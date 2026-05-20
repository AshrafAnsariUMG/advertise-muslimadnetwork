<?php

/**
 * CORS configuration for the public advertiser API.
 *
 * Origins are sourced from the CORS_ALLOWED_ORIGINS env var, comma-separated.
 * The wizard runs at the staging IP/port during pre-cutover (S1–S11) and at
 * the production HTTPS host after S12. Both are allowed simultaneously so the
 * cutover does not require a redeploy.
 */

$allowedOriginsRaw = env('CORS_ALLOWED_ORIGINS', '');
$allowedOrigins = array_values(array_filter(array_map(
    'trim',
    explode(',', $allowedOriginsRaw)
)));

if (empty($allowedOrigins)) {
    $allowedOrigins = ['http://37.27.215.90:3004', 'https://advertise.muslimadnetwork.com'];
}

return [
    'paths' => ['api/*', 'storage/*'],

    'allowed_methods' => ['*'],

    'allowed_origins' => $allowedOrigins,

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 3600,

    'supports_credentials' => false,
];
