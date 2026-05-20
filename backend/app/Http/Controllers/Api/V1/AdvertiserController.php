<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAdvertiserRequest;
use App\Http\Requests\UpdateAdvertiserRequest;
use App\Models\Advertiser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class AdvertiserController extends Controller
{
    /**
     * POST /api/v1/advertisers
     * Creates a draft. The response body is the ONLY time access_token is
     * returned — the client must store it locally.
     */
    public function store(StoreAdvertiserRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['created_by'] = $data['contact_email'];

        $advertiser = Advertiser::create($data);

        return response()->json(
            $advertiser->withAccessToken(),
            Response::HTTP_CREATED
        );
    }

    /**
     * GET /api/v1/advertisers/{id}?token=...
     * Loads a draft. Requires the matching access_token. Response excludes
     * access_token.
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $advertiser = Advertiser::find($id);
        if (!$advertiser) {
            return $this->notFound();
        }

        if (!$this->tokenMatches($advertiser, $request)) {
            return $this->forbidden();
        }

        return response()->json($advertiser);
    }

    /**
     * PATCH /api/v1/advertisers/{id}?token=...
     * Updates a draft. Requires the matching access_token. Locked once
     * payment_status === 'paid'.
     */
    public function update(UpdateAdvertiserRequest $request, string $id): JsonResponse
    {
        $advertiser = Advertiser::find($id);
        if (!$advertiser) {
            return $this->notFound();
        }

        if (!$this->tokenMatches($advertiser, $request)) {
            return $this->forbidden();
        }

        if ($advertiser->payment_status === PaymentStatus::Paid) {
            return response()->json(
                ['message' => 'This advertiser has already been paid and is locked from further updates.'],
                Response::HTTP_CONFLICT
            );
        }

        $advertiser->fill($request->validated());
        $advertiser->save();

        return response()->json($advertiser);
    }

    private function tokenMatches(Advertiser $advertiser, Request $request): bool
    {
        $token = (string) $request->query('token', '');
        if ($token === '') {
            return false;
        }

        return hash_equals($advertiser->access_token, $token);
    }

    private function notFound(): JsonResponse
    {
        return response()->json(['message' => 'Advertiser not found.'], Response::HTTP_NOT_FOUND);
    }

    private function forbidden(): JsonResponse
    {
        return response()->json(['message' => 'Invalid access token.'], Response::HTTP_FORBIDDEN);
    }
}
