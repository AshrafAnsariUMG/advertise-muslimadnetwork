<?php

/**
 * PayPal configuration.
 *
 * `mode` swings the API endpoints between sandbox and live. The PayPal SDK
 * domains differ — sandbox.paypal.com vs paypal.com — and the OAuth client
 * credentials are issued separately per environment, so PAYPAL_CLIENT_ID
 * and PAYPAL_CLIENT_SECRET must match the chosen mode.
 */

$mode = strtolower((string) env('PAYPAL_MODE', 'live'));
$apiUrl = $mode === 'sandbox'
    ? 'https://api-m.sandbox.paypal.com'
    : 'https://api-m.paypal.com';

return [
    'mode'          => $mode,
    'client_id'     => env('PAYPAL_CLIENT_ID'),
    'client_secret' => env('PAYPAL_CLIENT_SECRET'),
    'webhook_id'    => env('PAYPAL_WEBHOOK_ID'),
    'api_url'       => $apiUrl,
    'currency'      => strtoupper((string) env('PAYPAL_CURRENCY', 'USD')),

    /*
     * OAuth tokens from PayPal expire after ~32400 seconds (~9 hours). We
     * cache them for a slightly shorter window so we never use a token that
     * could expire mid-request.
     */
    'token_cache_ttl_seconds' => 8 * 3600,
];
