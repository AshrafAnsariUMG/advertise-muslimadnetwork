<?php

use App\Http\Controllers\Api\Admin\AbandonedController as AdminAbandonedController;
use App\Http\Controllers\Api\Admin\AdvertiserController as AdminAdvertiserController;
use App\Http\Controllers\Api\Admin\AuditLogController as AdminAuditLogController;
use App\Http\Controllers\Api\Admin\AuthController as AdminAuthController;
use App\Http\Controllers\Api\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Api\HealthController;
use App\Http\Controllers\Api\V1\AdvertiserController;
use App\Http\Controllers\Api\V1\CheckoutController;
use App\Http\Controllers\Api\V1\UploadController;
use App\Http\Controllers\Api\WebhookController;
use Illuminate\Support\Facades\Route;

Route::get('/health', [HealthController::class, 'index']);

Route::prefix('v1')->group(function () {

    Route::middleware('throttle:advertiser-create')->group(function () {
        Route::post('/advertisers', [AdvertiserController::class, 'store']);
    });

    Route::middleware('throttle:advertiser-read')->group(function () {
        Route::get('/advertisers/{id}', [AdvertiserController::class, 'show']);
    });

    Route::middleware('throttle:advertiser-write')->group(function () {
        Route::patch('/advertisers/{id}', [AdvertiserController::class, 'update']);
        Route::post('/advertisers/{id}/email-link', [AdvertiserController::class, 'emailLink']);
    });

    Route::middleware('throttle:uploads')->group(function () {
        Route::post('/uploads', [UploadController::class, 'store']);
    });

    Route::middleware('throttle:checkout')->group(function () {
        Route::post('/checkout/stripe', [CheckoutController::class, 'stripe']);
        Route::post('/checkout/stripe/verify', [CheckoutController::class, 'verify']);
        Route::post('/checkout/paypal', [CheckoutController::class, 'paypal']);
        Route::post('/checkout/paypal/capture', [CheckoutController::class, 'paypalCapture']);
    });
});

/*
 * Payment webhooks — intentionally OUTSIDE the v1 prefix and OUTSIDE any rate
 * limiter or CSRF guard. Stripe and PayPal both retry failed deliveries with
 * exponential backoff; throttling here would cause unnecessary retries and
 * (worst case) double-process an event after our idempotency window. The
 * CSRF exemption is wired in bootstrap/app.php — `api/webhooks/*` is in the
 * validateCsrfTokens except list, so this covers /webhooks/paypal too.
 */
Route::post('/webhooks/stripe', [WebhookController::class, 'stripe']);
Route::post('/webhooks/paypal', [WebhookController::class, 'paypal']);

/*
 * Admin API — native email/password + Sanctum tokens.
 *
 * UmmahPass SSO migration is deferred until post-launch. When it lands, only
 * the AuthController body changes; the middleware stack, route paths, and
 * frontend Bearer-token contract stay identical.
 */
Route::prefix('admin')->group(function () {

    Route::middleware('throttle:admin-login')
        ->post('/auth/login', [AdminAuthController::class, 'login']);

    Route::middleware(['auth:sanctum', 'is-admin'])->group(function () {
        Route::post('/auth/logout', [AdminAuthController::class, 'logout']);
        Route::get('/auth/me',     [AdminAuthController::class, 'me']);
        Route::post('/auth/change-password', [AdminAuthController::class, 'changePassword']);

        Route::get('/dashboard/metrics', [AdminDashboardController::class, 'metrics']);

        // Advertiser admin CRUD + lifecycle
        Route::get('/advertisers',          [AdminAdvertiserController::class, 'index']);
        Route::get('/advertisers/export',   [AdminAdvertiserController::class, 'export']);
        Route::post('/advertisers/bulk-approve', [AdminAdvertiserController::class, 'bulkApprove']);
        Route::post('/advertisers/bulk-reject',  [AdminAdvertiserController::class, 'bulkReject']);
        Route::get('/advertisers/{id}',     [AdminAdvertiserController::class, 'show']);
        Route::post('/advertisers/{id}/approve',  [AdminAdvertiserController::class, 'approve']);
        Route::post('/advertisers/{id}/reject',   [AdminAdvertiserController::class, 'reject']);
        Route::post('/advertisers/{id}/activate', [AdminAdvertiserController::class, 'activate']);
        Route::post('/advertisers/{id}/pause',    [AdminAdvertiserController::class, 'pause']);
        Route::post('/advertisers/{id}/resume',   [AdminAdvertiserController::class, 'resume']);

        // Read-only audit log
        Route::get('/audit-logs', [AdminAuditLogController::class, 'index']);

        // Abandoned carts admin
        Route::get('/abandoned', [AdminAbandonedController::class, 'index']);
        Route::post('/abandoned/{id}/send-recovery', [AdminAbandonedController::class, 'sendRecovery']);
        Route::post('/abandoned/{id}/push-pipedrive', [AdminAbandonedController::class, 'pushPipedrive']);
        Route::post('/abandoned/bulk-send-recovery', [AdminAbandonedController::class, 'bulkSendRecovery']);
        Route::post('/abandoned/bulk-push-pipedrive', [AdminAbandonedController::class, 'bulkPushPipedrive']);
    });
});
