<?php

/**
 * Stripe configuration.
 *
 * Reads exclusively from env so the live keys never touch the codebase.
 * Currency is uppercase per Stripe convention; Stripe accepts both cases but
 * the dashboard displays uppercase.
 */
return [
    'publishable_key' => env('STRIPE_PUBLISHABLE_KEY'),
    'secret_key'      => env('STRIPE_SECRET_KEY'),
    'webhook_secret'  => env('STRIPE_WEBHOOK_SECRET'),
    'currency'        => strtolower(env('STRIPE_CURRENCY', 'USD')),

    /*
     * Stripe redirects the user to these URLs after the Checkout flow.
     * The FRONTEND_URL env var swings between the staging IP:port and the
     * production HTTPS host across S1–S12 — keep these URL builders dynamic
     * so the cutover does not need a Stripe config change.
     */
    // {CHECKOUT_SESSION_ID} is substituted by Stripe on redirect — the
    // success page uses it to verify the session (return-path fulfillment,
    // belt-and-suspenders alongside the webhook).
    'success_url' => rtrim((string) env('FRONTEND_URL', ''), '/') . '/payment/success?session_id={CHECKOUT_SESSION_ID}',
    'cancel_url'  => rtrim((string) env('FRONTEND_URL', ''), '/') . '/payment/cancel',
];
