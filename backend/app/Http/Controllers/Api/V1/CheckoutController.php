<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\AdvertiserStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Api\WebhookController;
use App\Http\Controllers\Controller;
use App\Models\Advertiser;
use App\Services\AdvertiserSubmissionGate;
use App\Services\PayPalService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;
use Stripe\Exception\ApiErrorException;
use Stripe\StripeClient;

class CheckoutController extends Controller
{
    /**
     * Pretty labels for the line-item description. Same wording used on
     * the dashboard so the customer sees consistent language.
     */
    private const OBJECTIVE_LABELS = [
        'brand_awareness'    => 'Brand Awareness',
        'website_traffic'    => 'Website Traffic',
        'lead_generation'    => 'Lead Generation',
        'product_sales'      => 'Product Sales',
        'app_installs'       => 'App Installs',
        'event_promotion'    => 'Event Promotion',
        'drive_foot_traffic' => 'Drive Foot Traffic',
        'donations'          => 'Donations',
    ];

    public function stripe(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'advertiser_id' => ['required', 'uuid'],
            'access_token'  => ['required', 'string', 'size:64'],
        ]);

        $advertiser = Advertiser::find($validated['advertiser_id']);
        if (!$advertiser) {
            return response()->json(
                ['message' => 'Advertiser not found.'],
                Response::HTTP_NOT_FOUND
            );
        }

        if (!hash_equals($advertiser->access_token, $validated['access_token'])) {
            return response()->json(
                ['message' => 'Invalid access token.'],
                Response::HTTP_FORBIDDEN
            );
        }

        if ($advertiser->payment_status === PaymentStatus::Paid) {
            return response()->json(
                ['message' => 'This advertiser has already been paid.'],
                Response::HTTP_CONFLICT
            );
        }

        // Submission readiness — same gate as PATCH→pending_review
        $gateErrors = (new AdvertiserSubmissionGate())->errorsForAdvertiser($advertiser);

        // Plus: at least one creative or design service selected
        $hasCreatives = is_array($advertiser->ad_creatives) && count($advertiser->ad_creatives) > 0;
        if (!$hasCreatives && !$advertiser->design_service) {
            $gateErrors['ad_creatives'] = 'Please upload at least one ad creative or enable the design service.';
        }

        if (!empty($gateErrors)) {
            return response()->json([
                'message' => 'This draft is not ready for checkout yet.',
                'errors'  => array_map(fn ($msg) => [$msg], $gateErrors),
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        // Server-side price calculation — single source of truth
        $totalUsd = $advertiser->calculateTotal();

        $secret = config('stripe.secret_key');
        if (empty($secret)) {
            Log::error('Stripe checkout invoked but STRIPE_SECRET_KEY is empty.');
            return response()->json(
                ['message' => 'Payments are temporarily unavailable. Please try again shortly.'],
                Response::HTTP_SERVICE_UNAVAILABLE
            );
        }

        try {
            $stripe = new StripeClient($secret);
            $session = $stripe->checkout->sessions->create(
                $this->sessionParams($advertiser, $totalUsd)
            );
        } catch (ApiErrorException $e) {
            Log::error('Stripe Checkout Session creation failed', [
                'advertiser_id' => $advertiser->id,
                'message'       => $e->getMessage(),
            ]);
            return response()->json(
                ['message' => 'Failed to start checkout. Please try again.'],
                Response::HTTP_BAD_GATEWAY
            );
        }

        // Record the session for traceability. Status is intentionally NOT
        // bumped to pending_review here — only the webhook flips that, after
        // payment is confirmed.
        $advertiser->stripe_session_id = $session->id;
        $advertiser->save();

        return response()->json([
            'url' => $session->url,
        ]);
    }

    /**
     * @return array<string,mixed>
     */
    private function sessionParams(Advertiser $advertiser, float $totalUsd): array
    {
        $currency = config('stripe.currency', 'usd');

        $objectiveLabel = self::OBJECTIVE_LABELS[$advertiser->campaign_objective?->value]
            ?? 'Campaign';

        $startDate = optional($advertiser->campaign_start_date)->format('M j, Y') ?? 'TBD';
        $endDate = optional($advertiser->campaign_end_date)->format('M j, Y') ?? 'TBD';

        $campaignDescription = "{$objectiveLabel} · {$startDate} to {$endDate}";
        if ($advertiser->has_ctv) {
            $campaignDescription .= ' (CTV inventory included)';
        }

        $lineItems = [[
            'quantity'   => 1,
            'price_data' => [
                'currency'     => $currency,
                'unit_amount'  => (int) round(((float) $advertiser->monthly_budget) * 100),
                'product_data' => [
                    'name'        => 'Muslim Ad Network Campaign — ' . ($advertiser->campaign_name ?? 'Untitled'),
                    'description' => $campaignDescription,
                ],
            ],
        ]];

        if ($advertiser->design_service) {
            $lineItems[] = [
                'quantity'   => 1,
                'price_data' => [
                    'currency'     => $currency,
                    'unit_amount'  => 20000, // $200.00 in cents
                    'product_data' => [
                        'name'        => 'Professional Ad Design Service',
                        'description' => 'Custom banners in all four IAB sizes',
                    ],
                ],
            ];
        }

        // Sanity-check: the line items sum should equal $advertiser->calculateTotal().
        // This is a guard against future field drift.
        $lineItemsSum = array_sum(array_map(fn ($li) => $li['price_data']['unit_amount'], $lineItems)) / 100;
        if (abs($lineItemsSum - $totalUsd) > 0.005) {
            Log::warning('Stripe line items sum drift', [
                'advertiser_id' => $advertiser->id,
                'line_items_sum'  => $lineItemsSum,
                'calculate_total' => $totalUsd,
            ]);
        }

        return [
            'mode'                 => 'payment',
            'customer_email'       => $advertiser->contact_email,
            'line_items'           => $lineItems,
            'success_url'          => config('stripe.success_url') . '?session_id={CHECKOUT_SESSION_ID}',
            'cancel_url'           => config('stripe.cancel_url') . '?advertiser_id=' . $advertiser->id,
            'metadata'             => [
                'advertiser_id' => $advertiser->id,
            ],
            'payment_intent_data'  => [
                'metadata' => [
                    'advertiser_id' => $advertiser->id,
                ],
            ],
            'expires_at'           => time() + 24 * 3600,
        ];
    }

    /**
     * POST /api/v1/checkout/paypal
     *
     * Creates a PayPal Order. Status stays at incomplete_step_3 — the
     * advertiser is marked paid only after the capture endpoint (or the
     * redundancy webhook) confirms.
     */
    public function paypal(Request $request, PayPalService $paypal): JsonResponse
    {
        $validated = $request->validate([
            'advertiser_id' => ['required', 'uuid'],
            'access_token'  => ['required', 'string', 'size:64'],
        ]);

        [$advertiser, $error] = $this->resolveAdvertiserForCheckout(
            $validated['advertiser_id'],
            $validated['access_token']
        );
        if ($error) {
            return $error;
        }

        $totalUsd = $advertiser->calculateTotal();
        $currency = config('paypal.currency', 'USD');

        $orderBody = [
            'intent' => 'CAPTURE',
            'purchase_units' => [[
                'reference_id' => $advertiser->id,
                'description'  => 'Muslim Ad Network — Campaign',
                'amount'       => [
                    'currency_code' => $currency,
                    'value'         => number_format($totalUsd, 2, '.', ''),
                ],
            ]],
            'application_context' => [
                'brand_name'          => 'Muslim Ad Network',
                'user_action'         => 'PAY_NOW',
                'shipping_preference' => 'NO_SHIPPING',
                // Bound through config to survive `artisan config:cache`.
                // Raw env() would return empty once config is cached, and
                // PayPal would receive `/payment/paypal-success` as a
                // protocol-relative path → checkout request rejected.
                'return_url'          => rtrim((string) config('app.frontend_url'), '/') . '/payment/paypal-success',
                'cancel_url'          => rtrim((string) config('app.frontend_url'), '/') . '/payment/cancel?advertiser_id=' . $advertiser->id,
            ],
        ];

        try {
            $order = $paypal->createOrder($orderBody);
        } catch (\Throwable $e) {
            Log::error('PayPal Order creation failed', [
                'advertiser_id' => $advertiser->id,
                'message'       => $e->getMessage(),
            ]);
            return response()->json(
                ['message' => 'Failed to start PayPal checkout. Please try again.'],
                Response::HTTP_BAD_GATEWAY
            );
        }

        $orderId = (string) ($order['id'] ?? '');
        $approvalUrl = '';
        foreach ($order['links'] ?? [] as $link) {
            if (($link['rel'] ?? '') === 'payer-action' || ($link['rel'] ?? '') === 'approve') {
                $approvalUrl = (string) ($link['href'] ?? '');
                break;
            }
        }

        if ($orderId === '' || $approvalUrl === '') {
            Log::error('PayPal Order missing id or approval link', [
                'advertiser_id' => $advertiser->id,
                'order'         => $order,
            ]);
            return response()->json(
                ['message' => 'PayPal returned an unexpected response. Please try again.'],
                Response::HTTP_BAD_GATEWAY
            );
        }

        $advertiser->paypal_order_id = $orderId;
        $advertiser->save();

        return response()->json([
            'order_id'     => $orderId,
            'approval_url' => $approvalUrl,
        ]);
    }

    /**
     * POST /api/v1/checkout/paypal/capture
     *
     * Called from /payment/paypal-success after the user clicks "Pay Now" on
     * PayPal. PayPal's flow lands the user back on our domain BEFORE the
     * money has moved — this endpoint is the synchronous capture call that
     * actually completes the payment. The webhook is redundancy.
     */
    public function paypalCapture(Request $request, PayPalService $paypal): JsonResponse
    {
        $validated = $request->validate([
            'advertiser_id' => ['required', 'uuid'],
            'access_token'  => ['required', 'string', 'size:64'],
            'order_id'      => ['required', 'string', 'max:64'],
        ]);

        $advertiser = Advertiser::find($validated['advertiser_id']);
        if (!$advertiser) {
            return response()->json(
                ['message' => 'Advertiser not found.'],
                Response::HTTP_NOT_FOUND
            );
        }

        if (!hash_equals($advertiser->access_token, $validated['access_token'])) {
            return response()->json(
                ['message' => 'Invalid access token.'],
                Response::HTTP_FORBIDDEN
            );
        }

        // If the webhook already marked this advertiser paid, return success
        // immediately — capture is idempotent on PayPal's side anyway, but we
        // can short-circuit.
        if ($advertiser->payment_status === PaymentStatus::Paid) {
            return response()->json([
                'status'        => 'paid',
                'advertiser_id' => $advertiser->id,
                'redirect_to'   => '/application-success',
            ]);
        }

        // The order_id passed in MUST match what we created. This prevents
        // an attacker from passing somebody else's order id and having us
        // mark their record paid.
        if (!hash_equals((string) $advertiser->paypal_order_id, $validated['order_id'])) {
            return response()->json(
                ['message' => 'PayPal order does not belong to this advertiser.'],
                Response::HTTP_FORBIDDEN
            );
        }

        try {
            $capture = $paypal->captureOrder($validated['order_id']);
        } catch (\Throwable $e) {
            Log::error('PayPal capture API call failed', [
                'advertiser_id' => $advertiser->id,
                'order_id'      => $validated['order_id'],
                'message'       => $e->getMessage(),
            ]);
            // Do NOT update payment_status — the webhook is the fallback.
            return response()->json(
                ['message' => 'PayPal payment could not be confirmed. Please try again or contact support.'],
                Response::HTTP_BAD_GATEWAY
            );
        }

        $status = (string) ($capture['status'] ?? '');
        $captureUnit = $capture['purchase_units'][0]['payments']['captures'][0] ?? null;
        $captureId = (string) ($captureUnit['id'] ?? '');
        $captureStatus = (string) ($captureUnit['status'] ?? '');

        $isSuccessful = $status === 'COMPLETED' && $captureStatus === 'COMPLETED';

        if (!$isSuccessful) {
            Log::warning('PayPal capture did not complete', [
                'advertiser_id'  => $advertiser->id,
                'order_status'   => $status,
                'capture_status' => $captureStatus,
            ]);

            $advertiser->payment_status = PaymentStatus::Failed;
            $advertiser->save();

            return response()->json([
                'status'  => 'failed',
                'message' => 'PayPal did not confirm the payment. Please try again.',
            ], Response::HTTP_PAYMENT_REQUIRED);
        }

        // Capture confirmed — flip the advertiser into the post-payment state.
        $advertiser->payment_status = PaymentStatus::Paid;
        $advertiser->payment_method = PaymentMethod::PayPal;
        $advertiser->paypal_payment_id = $captureId;
        $advertiser->status = AdvertiserStatus::PendingReview;

        $payerAddress = $capture['payer']['address'] ?? null;
        if (is_array($payerAddress)) {
            $advertiser->billing_address = json_encode($payerAddress);
        }

        $advertiser->save();

        // Synchronous PayPal capture path — this is where the customer-facing
        // confirmation and internal Mattermost ping fire for PayPal. The
        // webhook handler only fires fulfillment as a redundancy if this
        // endpoint never ran (browser closed mid-redirect, etc.).
        WebhookController::fireSubmissionFulfillment($advertiser);

        return response()->json([
            'status'        => 'paid',
            'advertiser_id' => $advertiser->id,
            'redirect_to'   => '/application-success',
        ]);
    }

    /**
     * Shared preflight for both Stripe and PayPal "create checkout" calls.
     *
     * Returns [Advertiser, null] on success or [null, JsonResponse] on
     * failure. Callers should return the JsonResponse verbatim.
     *
     * @return array{0: ?Advertiser, 1: ?JsonResponse}
     */
    private function resolveAdvertiserForCheckout(string $id, string $token): array
    {
        $advertiser = Advertiser::find($id);
        if (!$advertiser) {
            return [null, response()->json(
                ['message' => 'Advertiser not found.'],
                Response::HTTP_NOT_FOUND
            )];
        }

        if (!hash_equals($advertiser->access_token, $token)) {
            return [null, response()->json(
                ['message' => 'Invalid access token.'],
                Response::HTTP_FORBIDDEN
            )];
        }

        if ($advertiser->payment_status === PaymentStatus::Paid) {
            return [null, response()->json(
                ['message' => 'This advertiser has already been paid.'],
                Response::HTTP_CONFLICT
            )];
        }

        $gateErrors = (new AdvertiserSubmissionGate())->errorsForAdvertiser($advertiser);
        $hasCreatives = is_array($advertiser->ad_creatives) && count($advertiser->ad_creatives) > 0;
        if (!$hasCreatives && !$advertiser->design_service) {
            $gateErrors['ad_creatives'] = 'Please upload at least one ad creative or enable the design service.';
        }

        if (!empty($gateErrors)) {
            return [null, response()->json([
                'message' => 'This draft is not ready for checkout yet.',
                'errors'  => array_map(fn ($msg) => [$msg], $gateErrors),
            ], Response::HTTP_UNPROCESSABLE_ENTITY)];
        }

        return [$advertiser, null];
    }
}
