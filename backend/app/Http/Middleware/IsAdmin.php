<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Gate that requires `auth:sanctum` upstream and a `role=admin` user.
 *
 * Returns 403 even on missing user — the upstream auth:sanctum middleware
 * already returns 401 for unauthenticated requests, so by the time we get
 * here the only failure mode is "authenticated but wrong role".
 */
class IsAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if (!$user || !$user->isAdmin()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        return $next($request);
    }
}
