<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class HealthController extends Controller
{
    public function index(): JsonResponse
    {
        $version = '0.1.0';
        $composerPath = base_path('composer.json');
        if (is_file($composerPath)) {
            $composer = json_decode((string) file_get_contents($composerPath), true);
            if (is_array($composer) && !empty($composer['version'])) {
                $version = (string) $composer['version'];
            }
        }

        return response()->json([
            'status'    => 'ok',
            'timestamp' => now()->toIso8601String(),
            'version'   => $version,
        ]);
    }
}
