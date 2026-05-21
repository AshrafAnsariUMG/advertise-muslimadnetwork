<?php

namespace App\Services;

use Illuminate\Http\Client\Response as HttpResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * Thin Laravel-Http wrapper over PayPal Orders v2.
 *
 * Three responsibilities:
 *  - OAuth: cache a client_credentials access token (TTL bounded below
 *    PayPal's ~9-hour window).
 *  - Order create / capture.
 *  - Webhook signature verification.
 *
 * No SDK — PayPal's official SDK has 365+ value-object classes for what is
 * effectively four HTTP calls in our integration. Direct Http facade calls
 * keep the wire shape obvious in the diff log.
 */
class PayPalService
{
    private const TOKEN_CACHE_KEY = 'paypal:access_token';

    /**
     * Get a valid access token. Cached until shortly before PayPal expires
     * it server-side.
     *
     * @throws RuntimeException if credentials are missing or auth fails
     */
    public function accessToken(): string
    {
        $cached = Cache::get(self::TOKEN_CACHE_KEY);
        if (is_string($cached) && $cached !== '') {
            return $cached;
        }

        $clientId = config('paypal.client_id');
        $secret = config('paypal.client_secret');
        if (empty($clientId) || empty($secret)) {
            throw new RuntimeException('PayPal credentials are not configured.');
        }

        $response = Http::asForm()
            ->withBasicAuth($clientId, $secret)
            ->post(config('paypal.api_url') . '/v1/oauth2/token', [
                'grant_type' => 'client_credentials',
            ]);

        if (!$response->successful()) {
            throw new RuntimeException(
                'PayPal OAuth failed: HTTP ' . $response->status() . ' ' . $response->body()
            );
        }

        $token = (string) $response->json('access_token', '');
        if ($token === '') {
            throw new RuntimeException('PayPal OAuth returned no access_token.');
        }

        Cache::put(
            self::TOKEN_CACHE_KEY,
            $token,
            config('paypal.token_cache_ttl_seconds', 8 * 3600)
        );

        return $token;
    }

    /**
     * Create an Order. Returns the decoded PayPal response body.
     *
     * @param  array<string,mixed>  $body
     */
    public function createOrder(array $body): array
    {
        $response = $this->paypalPost('/v2/checkout/orders', $body);
        $this->assertStatus($response, [200, 201], 'Order creation');
        return (array) $response->json();
    }

    /**
     * Capture a previously-approved Order.
     */
    public function captureOrder(string $orderId): array
    {
        // PayPal recommends sending PayPal-Request-Id for idempotent captures
        $response = Http::withToken($this->accessToken())
            ->withHeaders([
                'Content-Type'      => 'application/json',
                'PayPal-Request-Id' => 'capture-' . $orderId,
            ])
            ->post(
                config('paypal.api_url') . "/v2/checkout/orders/{$orderId}/capture",
                (object) [] // PayPal requires an empty JSON object as body
            );

        // 201 = first capture; 422 + UNPROCESSABLE_ENTITY = already captured
        // (PayPal returns the existing capture details on duplicate)
        $this->assertStatus($response, [200, 201, 422], 'Order capture');
        return (array) $response->json();
    }

    /**
     * Verify a webhook signature using PayPal's notifications API. Returns
     * true if PayPal confirms the signature is valid.
     *
     * @param  array<string,string|null>  $headers
     */
    public function verifyWebhookSignature(array $headers, string $rawBody): bool
    {
        $webhookId = config('paypal.webhook_id');
        if (empty($webhookId)) {
            return false;
        }

        $decoded = json_decode($rawBody, true);
        if (!is_array($decoded)) {
            return false;
        }

        $payload = [
            'auth_algo'         => (string) ($headers['paypal-auth-algo'] ?? ''),
            'cert_url'          => (string) ($headers['paypal-cert-url'] ?? ''),
            'transmission_id'   => (string) ($headers['paypal-transmission-id'] ?? ''),
            'transmission_sig'  => (string) ($headers['paypal-transmission-sig'] ?? ''),
            'transmission_time' => (string) ($headers['paypal-transmission-time'] ?? ''),
            'webhook_id'        => $webhookId,
            'webhook_event'     => $decoded,
        ];

        // If any required header is missing, don't even bother calling
        // PayPal — reject locally.
        foreach (['auth_algo', 'cert_url', 'transmission_id', 'transmission_sig', 'transmission_time'] as $key) {
            if ($payload[$key] === '') {
                return false;
            }
        }

        try {
            $response = Http::withToken($this->accessToken())
                ->acceptJson()
                ->post(
                    config('paypal.api_url') . '/v1/notifications/verify-webhook-signature',
                    $payload
                );
        } catch (\Throwable $e) {
            return false;
        }

        if (!$response->successful()) {
            return false;
        }

        return $response->json('verification_status') === 'SUCCESS';
    }

    /**
     * @param  array<string,mixed>  $body
     */
    private function paypalPost(string $path, array $body): HttpResponse
    {
        return Http::withToken($this->accessToken())
            ->acceptJson()
            ->asJson()
            ->post(config('paypal.api_url') . $path, $body);
    }

    /**
     * @param  array<int,int>  $expected
     */
    private function assertStatus(HttpResponse $response, array $expected, string $context): void
    {
        if (!in_array($response->status(), $expected, true)) {
            throw new RuntimeException(
                "PayPal {$context} failed: HTTP {$response->status()} {$response->body()}"
            );
        }
    }
}
