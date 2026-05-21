<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Hash;

/**
 * Admin authentication controller.
 *
 * Native email/password + Sanctum tokens. UmmahPass SSO is deferred to
 * post-launch — see CLAUDE.md S9 notes. The middleware/routes/pages around
 * this controller are written to make the SSO swap a one-file change.
 *
 * Anti-enumeration: invalid email and invalid password both return the same
 * 401 "Invalid credentials" — never tell an attacker which half they got
 * right. Only authenticated-but-not-admin returns 403 (intentional: by then
 * they've proven they know a valid login).
 *
 * Every outcome is audited:
 *  - `auth.login.success`        — valid creds + admin role
 *  - `auth.login.failed`         — bad email or bad password
 *  - `auth.login.unauthorized`   — valid creds but non-admin role
 *  - `auth.logout`               — token revocation
 *
 * Failed-login rows are a spam vector for an attacker. The mitigation is
 * `throttle:admin-login` (5/min/IP) — see AppServiceProvider. The audit log
 * intentionally records the *attempted* email so we can spot enumeration
 * patterns after the fact.
 */
class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email'    => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            AuditLogger::log(
                action: 'auth.login.failed',
                target: null,
                changes: ['attempted_email' => $validated['email']],
                request: $request
            );

            return response()->json(
                ['message' => 'Invalid credentials.'],
                Response::HTTP_UNAUTHORIZED
            );
        }

        if (!$user->isAdmin()) {
            AuditLogger::log(
                action: 'auth.login.unauthorized',
                target: $user,
                changes: ['attempted_role' => $user->role?->value],
                request: $request
            );

            return response()->json(
                ['message' => 'Not authorized.'],
                Response::HTTP_FORBIDDEN
            );
        }

        $token = $user->createToken('admin-session')->plainTextToken;

        AuditLogger::log(
            action: 'auth.login.success',
            target: $user,
            changes: null,
            request: $request
        );

        return response()->json([
            'token' => $token,
            'user'  => [
                'id'    => $user->id,
                'name'  => $user->name,
                'email' => $user->email,
                'role'  => $user->role?->value,
            ],
        ]);
    }

    public function logout(Request $request): Response
    {
        $user = $request->user();
        AuditLogger::log('auth.logout', $user, null, $request);

        $request->user()->currentAccessToken()->delete();
        return response()->noContent();
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'id'    => $user->id,
            'name'  => $user->name,
            'email' => $user->email,
            'role'  => $user->role?->value,
        ]);
    }
}
