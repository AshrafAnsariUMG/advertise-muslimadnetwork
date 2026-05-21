<?php

namespace App\Http\Controllers\Api;

use App\Enums\AdvertiserStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Jobs\NotifyMattermostOfSubmission;
use App\Mail\PaymentConfirmation;
use App\Models\Advertiser;
use App\Models\ProcessedPaypalEvent;
use App\Models\ProcessedStripeEvent;
use App\Services\PayPalService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Stripe\Event as StripeEvent;
use Stripe\Exception\SignatureVerificationException;
use Stripe\Webhook;

class WebhookController extends Controller
{
    /**
     * Stripe webhook handler.
     *
     * Trust model:
     *  - Stripe-Signature header is verified against STRIPE_WEBHOOK_SECRET.
     *  - Without a valid signature this endpoint MUST NOT mutate any state.
     *  - Idempotency: we look up event_id in processed_stripe_events before
     *    doing any side effect, and we write the row inside the same
     *    transaction as the side effect. A retry hits the unique constraint
     *    on the second insert (belt-and-braces against a race) but the
     *    in-app check covers 99.9% of cases without burning a transaction.
     */
    public function stripe(Request $request): Response
    {
        $secret = config('stripe.webhook_secret');
        if (empty($secret)) {
            Log::error('Stripe webhook received but STRIPE_WEBHOOK_SECRET is empty.');
            return response('Webhook misconfigured', Response::HTTP_INTERNAL_SERVER_ERROR);
        }

        $payload = $request->getContent();
        $sigHeader = (string) $request->header('Stripe-Signature', '');

        try {
            $event = Webhook::constructEvent($payload, $sigHeader, $secret);
        } catch (SignatureVerificationException $e) {
            Log::warning('Stripe webhook: signature verification failed', [
                'reason' => $e->getMessage(),
            ]);
            return response('Invalid signature', Response::HTTP_BAD_REQUEST);
        } catch (\UnexpectedValueException $e) {
            Log::warning('Stripe webhook: invalid payload', [
                'reason' => $e->getMessage(),
            ]);
            return response('Invalid payload', Response::HTTP_BAD_REQUEST);
        }

        /** @var StripeEvent $event */

        // Idempotency check — short-circuit BEFORE opening a transaction
        if (ProcessedStripeEvent::where('event_id', $event->id)->exists()) {
            return response('Already processed', Response::HTTP_OK);
        }

        try {
            DB::transaction(function () use ($event): void {
                $advertiserId = $this->dispatchEvent($event);

                // Always record the event, even when we chose to skip the
                // side effect (unknown event types, missing advertiser, etc.).
                // That way duplicate retries don't reprocess them either.
                ProcessedStripeEvent::create([
                    'event_id'      => $event->id,
                    'event_type'    => $event->type,
                    'advertiser_id' => $advertiserId,
                    'processed_at'  => now(),
                ]);
            });
        } catch (\Throwable $e) {
            Log::error('Stripe webhook: unhandled exception during processing', [
                'event_id'   => $event->id,
                'event_type' => $event->type,
                'exception'  => $e->getMessage(),
            ]);
            // 500 → Stripe will retry. Better than swallowing the error.
            return response('Processing failed', Response::HTTP_INTERNAL_SERVER_ERROR);
        }

        return response('OK', Response::HTTP_OK);
    }

    /**
     * Apply the side effect for the event. Returns the affected advertiser_id
     * (or null) so the ledger row can record it.
     */
    private function dispatchEvent(StripeEvent $event): ?string
    {
        switch ($event->type) {
            case 'checkout.session.completed':
                return $this->handleCheckoutCompleted($event);

            default:
                Log::info('Stripe webhook: event type skipped', [
                    'event_id'   => $event->id,
                    'event_type' => $event->type,
                ]);
                return null;
        }
    }

    private function handleCheckoutCompleted(StripeEvent $event): ?string
    {
        $session = $event->data->object;
        $advertiserId = $session->metadata->advertiser_id ?? null;

        if (!$advertiserId) {
            Log::error('Stripe webhook: checkout.session.completed has no advertiser_id metadata', [
                'event_id'   => $event->id,
                'session_id' => $session->id ?? null,
            ]);
            // Return null and acknowledge — Stripe should not retry for a
            // malformed metadata payload that's never going to succeed.
            return null;
        }

        /** @var Advertiser|null $advertiser */
        $advertiser = Advertiser::find($advertiserId);
        if (!$advertiser) {
            Log::error('Stripe webhook: advertiser not found for paid session', [
                'advertiser_id' => $advertiserId,
                'session_id'    => $session->id ?? null,
            ]);
            return null;
        }

        // Already paid? Stripe occasionally double-delivers an event before
        // the idempotency record lands. Don't clobber later state.
        if ($advertiser->payment_status === PaymentStatus::Paid) {
            return $advertiser->id;
        }

        $advertiser->payment_status = PaymentStatus::Paid;
        $advertiser->payment_method = PaymentMethod::Stripe;
        $advertiser->stripe_payment_intent = (string) ($session->payment_intent ?? '');
        $advertiser->status = AdvertiserStatus::PendingReview;
        $advertiser->save();

        Log::info('Stripe webhook: advertiser marked paid', [
            'advertiser_id' => $advertiser->id,
        ]);

        $this->fireSubmissionFulfillment($advertiser);

        return $advertiser->id;
    }

    /**
     * Sends the customer-facing confirmation email + posts the internal
     * Mattermost notification. Both are queued so the webhook responds fast.
     *
     * This method is called from every code path that flips an advertiser to
     * payment_status=paid:
     *   - Stripe webhook checkout.session.completed (the primary Stripe path)
     *   - PayPal capture endpoint (the primary PayPal path)
     *   - PayPal webhook PAYMENT.CAPTURE.COMPLETED (only when it's the one
     *     doing the flip — i.e., the capture endpoint never ran successfully)
     *
     * Callers are responsible for only invoking this on the state transition
     * itself, not on every "already paid" re-entry.
     */
    public static function fireSubmissionFulfillment(Advertiser $advertiser): void
    {
        try {
            if ($advertiser->contact_email) {
                Mail::to($advertiser->contact_email)
                    ->queue(new PaymentConfirmation($advertiser));
            }
        } catch (\Throwable $e) {
            Log::error('Failed to queue payment confirmation email', [
                'advertiser_id' => $advertiser->id,
                'error'         => $e->getMessage(),
            ]);
        }

        try {
            NotifyMattermostOfSubmission::dispatch($advertiser);
        } catch (\Throwable $e) {
            Log::error('Failed to dispatch Mattermost notification', [
                'advertiser_id' => $advertiser->id,
                'error'         => $e->getMessage(),
            ]);
        }
    }

    /**
     * PayPal webhook handler.
     *
     * Important: this endpoint is REDUNDANCY, not the primary confirmation
     * path. The synchronous `paypalCapture` controller endpoint is what
     * actually flips the advertiser into the paid state once the user
     * returns from PayPal. This webhook covers the edge cases where the
     * user's browser closes between PayPal approval and our capture call.
     *
     * Signature verification uses PayPal's verify-webhook-signature API
     * (no native HMAC like Stripe). See PayPalService::verifyWebhookSignature.
     */
    public function paypal(Request $request, PayPalService $paypal): Response
    {
        $webhookId = config('paypal.webhook_id');
        if (empty($webhookId)) {
            Log::error('PayPal webhook received but PAYPAL_WEBHOOK_ID is empty.');
            return response('Webhook misconfigured', Response::HTTP_INTERNAL_SERVER_ERROR);
        }

        $rawBody = $request->getContent();
        $headers = [
            'paypal-auth-algo'         => $request->header('paypal-auth-algo'),
            'paypal-cert-url'          => $request->header('paypal-cert-url'),
            'paypal-transmission-id'   => $request->header('paypal-transmission-id'),
            'paypal-transmission-sig'  => $request->header('paypal-transmission-sig'),
            'paypal-transmission-time' => $request->header('paypal-transmission-time'),
        ];

        if (!$paypal->verifyWebhookSignature($headers, $rawBody)) {
            Log::warning('PayPal webhook: signature verification failed');
            return response('Invalid signature', Response::HTTP_BAD_REQUEST);
        }

        $event = json_decode($rawBody, true);
        if (!is_array($event) || empty($event['id']) || empty($event['event_type'])) {
            return response('Invalid payload', Response::HTTP_BAD_REQUEST);
        }

        $eventId = (string) $event['id'];
        $eventType = (string) $event['event_type'];

        // Idempotency — fast-path return before any work
        if (ProcessedPaypalEvent::where('event_id', $eventId)->exists()) {
            return response('Already processed', Response::HTTP_OK);
        }

        try {
            DB::transaction(function () use ($event, $eventId, $eventType): void {
                // Insert the ledger row first so a duplicate retry hits the
                // unique constraint and aborts cleanly. We update
                // processed_at after the handler succeeds.
                $ledger = ProcessedPaypalEvent::create([
                    'event_id'   => $eventId,
                    'event_type' => $eventType,
                    'payload'    => $event,
                ]);

                $advertiserId = $this->dispatchPaypalEvent($event);

                $ledger->advertiser_id = $advertiserId;
                $ledger->processed_at = now();
                $ledger->save();
            });
        } catch (\Throwable $e) {
            Log::error('PayPal webhook: unhandled exception during processing', [
                'event_id'   => $eventId,
                'event_type' => $eventType,
                'exception'  => $e->getMessage(),
            ]);
            return response('Processing failed', Response::HTTP_INTERNAL_SERVER_ERROR);
        }

        return response('OK', Response::HTTP_OK);
    }

    /**
     * @param  array<string,mixed>  $event
     */
    private function dispatchPaypalEvent(array $event): ?string
    {
        $type = (string) ($event['event_type'] ?? '');

        switch ($type) {
            case 'PAYMENT.CAPTURE.COMPLETED':
                return $this->handlePaypalCaptureCompleted($event);

            case 'PAYMENT.CAPTURE.DENIED':
                return $this->handlePaypalCaptureDenied($event);

            case 'CHECKOUT.ORDER.APPROVED':
                // Informational only — capture endpoint does the work
                Log::info('PayPal webhook: order approved (informational)', [
                    'event_id' => $event['id'] ?? null,
                ]);
                return $this->findAdvertiserFromEvent($event);

            default:
                Log::info('PayPal webhook: event type skipped', [
                    'event_id'   => $event['id'] ?? null,
                    'event_type' => $type,
                ]);
                return null;
        }
    }

    /**
     * @param  array<string,mixed>  $event
     */
    private function handlePaypalCaptureCompleted(array $event): ?string
    {
        $advertiser = $this->locateAdvertiserForCapture($event);
        if (!$advertiser) {
            return null;
        }

        // The synchronous capture endpoint may have already flipped this —
        // that's the happy path; this webhook is the recovery one.
        if ($advertiser->payment_status === PaymentStatus::Paid) {
            return $advertiser->id;
        }

        $resource = $event['resource'] ?? [];
        $captureId = (string) ($resource['id'] ?? '');

        $advertiser->payment_status = PaymentStatus::Paid;
        $advertiser->payment_method = PaymentMethod::PayPal;
        if ($captureId !== '') {
            $advertiser->paypal_payment_id = $captureId;
        }
        $advertiser->status = AdvertiserStatus::PendingReview;
        $advertiser->save();

        Log::info('PayPal webhook: advertiser marked paid via webhook recovery', [
            'advertiser_id' => $advertiser->id,
        ]);

        // Webhook is the redundancy path — if we got here it means the
        // synchronous capture endpoint never finished, so fulfillment
        // (confirmation email + Mattermost) hasn't fired yet.
        self::fireSubmissionFulfillment($advertiser);

        return $advertiser->id;
    }

    /**
     * @param  array<string,mixed>  $event
     */
    private function handlePaypalCaptureDenied(array $event): ?string
    {
        $advertiser = $this->locateAdvertiserForCapture($event);
        if (!$advertiser) {
            return null;
        }

        // Don't downgrade a paid record. Denied events should land on
        // never-paid drafts; if we see a denied for a paid one something is
        // very wrong upstream — log and let the human investigate.
        if ($advertiser->payment_status === PaymentStatus::Paid) {
            Log::warning('PayPal webhook: PAYMENT.CAPTURE.DENIED for a record already marked paid', [
                'advertiser_id' => $advertiser->id,
            ]);
            return $advertiser->id;
        }

        $advertiser->payment_status = PaymentStatus::Failed;
        $advertiser->save();

        return $advertiser->id;
    }

    /**
     * Find the advertiser that a capture event belongs to.
     *
     * @param  array<string,mixed>  $event
     */
    private function locateAdvertiserForCapture(array $event): ?Advertiser
    {
        $advertiserId = $this->findAdvertiserFromEvent($event);
        if (!$advertiserId) {
            Log::error('PayPal webhook: capture event without resolvable advertiser', [
                'event_id'   => $event['id'] ?? null,
                'event_type' => $event['event_type'] ?? null,
            ]);
            return null;
        }

        $advertiser = Advertiser::find($advertiserId);
        if (!$advertiser) {
            Log::error('PayPal webhook: advertiser not found', [
                'advertiser_id' => $advertiserId,
                'event_id'      => $event['id'] ?? null,
            ]);
        }
        return $advertiser;
    }

    /**
     * Walk the event shape looking for an advertiser id. PayPal's payload
     * format varies by event type — for CAPTURE events the order's
     * reference_id is the most reliable; for ORDER events it's at the top
     * of resource.purchase_units.
     *
     * @param  array<string,mixed>  $event
     */
    private function findAdvertiserFromEvent(array $event): ?string
    {
        $resource = $event['resource'] ?? [];

        // Capture events usually carry the order's PURCHASE_UNIT reference_id
        // in supplementary_data.related_ids.order_id we'd have to look up,
        // but PayPal also surfaces the reference_id directly via
        // resource.custom_id or resource.purchase_units[0].reference_id
        // depending on event type. Try both.
        $candidates = [
            $resource['supplementary_data']['related_ids']['order_id'] ?? null,
            $resource['custom_id'] ?? null,
            $resource['purchase_units'][0]['reference_id'] ?? null,
            $resource['purchase_units'][0]['custom_id'] ?? null,
        ];

        foreach ($candidates as $candidate) {
            if (is_string($candidate) && $candidate !== '') {
                // If the reference is our advertiser UUID, accept it
                // directly. If it's a PayPal order id, look up by
                // paypal_order_id.
                if (preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $candidate)) {
                    return strtolower($candidate);
                }
                // Fallback: PayPal order id
                $byOrder = Advertiser::where('paypal_order_id', $candidate)->value('id');
                if ($byOrder) {
                    return (string) $byOrder;
                }
            }
        }

        return null;
    }
}
