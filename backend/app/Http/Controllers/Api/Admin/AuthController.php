<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
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
            return response()->json(
                ['message' => 'Invalid credentials.'],
                Response::HTTP_UNAUTHORIZED
            );
        }

        if (!$user->isAdmin()) {
            return response()->json(
                ['message' => 'Not authorized.'],
                Response::HTTP_FORBIDDEN
            );
        }

        $token = $user->createToken('admin-session')->plainTextToken;

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
