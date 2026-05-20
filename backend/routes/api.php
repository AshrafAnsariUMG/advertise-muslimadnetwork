<?php

use App\Http\Controllers\Api\HealthController;
use App\Http\Controllers\Api\V1\AdvertiserController;
use App\Http\Controllers\Api\V1\UploadController;
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
    });

    Route::middleware('throttle:uploads')->group(function () {
        Route::post('/uploads', [UploadController::class, 'store']);
    });
});
