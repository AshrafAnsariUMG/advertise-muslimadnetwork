<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\AdvertiserStatus;
use App\Http\Controllers\Controller;
use App\Models\Advertiser;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Pagination\LengthAwarePaginator;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Admin-side CRUD and lifecycle actions on Advertiser records.
 *
 * The status state machine enforced here:
 *
 *   pending_review ─approve──► approved ─activate──► active ◄───resume─── paused
 *         │                                            │
 *         └─reject──► rejected                         └─pause──► paused
 *
 * `incomplete_step_*` records aren't actionable from this controller — they
 * arrive via the public wizard and only transition to `pending_review` when
 * payment is confirmed via Stripe webhook / PayPal capture.
 */
class AdvertiserController extends Controller
{
    private const SORTABLE_COLUMNS = ['created_at', 'updated_at', 'monthly_budget'];
    private const PER_PAGE = 15;

    /**
     * GET /api/admin/advertisers
     */
    public function index(Request $request): JsonResponse
    {
        $query = Advertiser::query();

        // Status filter — accepts comma-separated list
        if ($request->filled('status')) {
            $statuses = array_filter(array_map('trim', explode(',', (string) $request->query('status'))));
            $query->whereIn('status', $statuses);
        }

        if ($request->filled('payment_status')) {
            $query->where('payment_status', $request->query('payment_status'));
        }

        if ($request->filled('payment_method')) {
            $query->where('payment_method', $request->query('payment_method'));
        }

        if ($request->filled('search')) {
            $needle = '%' . addcslashes((string) $request->query('search'), '%_\\') . '%';
            $query->where(function ($q) use ($needle) {
                $q->where('business_name', 'like', $needle)
                  ->orWhere('contact_email', 'like', $needle)
                  ->orWhere('contact_name', 'like', $needle);
            });
        }

        if ($request->filled('from_date')) {
            $query->where('created_at', '>=', $request->query('from_date'));
        }
        if ($request->filled('to_date')) {
            $query->where('created_at', '<=', $request->query('to_date') . ' 23:59:59');
        }

        $sort = $request->query('sort', 'created_at');
        if (!in_array($sort, self::SORTABLE_COLUMNS, true)) {
            $sort = 'created_at';
        }
        $direction = strtolower((string) $request->query('direction', 'desc'));
        $direction = $direction === 'asc' ? 'asc' : 'desc';
        $query->orderBy($sort, $direction);

        /** @var LengthAwarePaginator $paginated */
        $paginated = $query->paginate(self::PER_PAGE);

        $paginated->getCollection()->transform(fn (Advertiser $a) => $this->listShape($a));

        return response()->json($paginated);
    }

    /**
     * GET /api/admin/advertisers/{id}
     */
    public function show(string $id): JsonResponse
    {
        $advertiser = Advertiser::find($id);
        if (!$advertiser) {
            return response()->json(['message' => 'Advertiser not found.'], Response::HTTP_NOT_FOUND);
        }

        $data = $advertiser->toArray();
        // Belt-and-braces — model already hides this in $hidden but explicit
        // unset means a future $with() / make-visible() can't accidentally leak.
        unset($data['access_token']);

        $data['computed'] = [
            'total'         => round($advertiser->calculateTotal(), 2),
            'abandoned_age_hours' => $advertiser->created_at
                ? max(0, (int) $advertiser->created_at->diffInHours(now()))
                : null,
        ];

        return response()->json($data);
    }

    public function approve(Request $request, string $id): JsonResponse
    {
        return $this->transition(
            $request,
            $id,
            from: AdvertiserStatus::PendingReview,
            to:   AdvertiserStatus::Approved,
            action: 'advertiser.approve',
            note: fn ($user) => 'Approved by ' . $user->email . ' on ' . now()->toDateTimeString()
        );
    }

    public function reject(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'min:3', 'max:2000'],
        ]);

        return $this->transition(
            $request,
            $id,
            from: AdvertiserStatus::PendingReview,
            to:   AdvertiserStatus::Rejected,
            action: 'advertiser.reject',
            note: fn ($user) => 'Rejected by ' . $user->email . ' on ' . now()->toDateTimeString() . ': ' . $validated['reason'],
            extraChanges: ['reason' => $validated['reason']]
        );
    }

    public function activate(Request $request, string $id): JsonResponse
    {
        $response = $this->transition(
            $request,
            $id,
            from: AdvertiserStatus::Approved,
            to:   AdvertiserStatus::Active,
            action: 'advertiser.activate'
        );

        // On a successful activation, move the Pipedrive deal to the "live"
        // stage (if one is configured and the advertiser has a deal id).
        // Fire-and-forget queued job — never blocks the admin response.
        if ($response->getStatusCode() === Response::HTTP_OK) {
            $stageActive = config('pipedrive.stage_active');
            if ($stageActive) {
                $advertiser = Advertiser::find($id);
                if ($advertiser && $advertiser->pipedrive_deal_id) {
                    \App\Jobs\UpdatePipedriveDealStage::dispatch($advertiser, (int) $stageActive);
                }
            }
        }

        return $response;
    }

    public function pause(Request $request, string $id): JsonResponse
    {
        return $this->transition(
            $request,
            $id,
            from: AdvertiserStatus::Active,
            to:   AdvertiserStatus::Paused,
            action: 'advertiser.pause'
        );
    }

    public function resume(Request $request, string $id): JsonResponse
    {
        return $this->transition(
            $request,
            $id,
            from: AdvertiserStatus::Paused,
            to:   AdvertiserStatus::Active,
            action: 'advertiser.resume'
        );
    }

    /**
     * Shared transition path. Validates the precondition, applies the change,
     * writes an audit_logs row with before/after snapshot, returns the
     * updated record.
     *
     * @param  callable|null  $note  optional closure receiving $user, returning a note string to append
     */
    private function transition(
        Request $request,
        string $id,
        AdvertiserStatus $from,
        AdvertiserStatus $to,
        string $action,
        ?callable $note = null,
        array $extraChanges = []
    ): JsonResponse {
        $advertiser = Advertiser::find($id);
        if (!$advertiser) {
            return response()->json(['message' => 'Advertiser not found.'], Response::HTTP_NOT_FOUND);
        }

        $currentStatus = $advertiser->status?->value;
        if ($currentStatus !== $from->value) {
            $verb = explode('.', $action)[1] ?? 'transition';
            return response()->json([
                'message'        => "Cannot {$verb} from status: " . ($currentStatus ?: 'unknown') . '.',
                'current_status' => $currentStatus,
                'required_from'  => $from->value,
            ], Response::HTTP_CONFLICT);
        }

        $before = [
            'status' => $from->value,
            'notes'  => $advertiser->notes,
        ];

        $advertiser->status = $to;

        if ($note !== null) {
            $user = $request->user();
            $line = $note($user);
            $advertiser->notes = $advertiser->notes
                ? $advertiser->notes . "\n" . $line
                : $line;
        }

        $advertiser->save();

        AuditLogger::log(
            action: $action,
            target: $advertiser,
            changes: array_merge([
                'before' => $before,
                'after'  => [
                    'status' => $to->value,
                    'notes'  => $advertiser->notes,
                ],
            ], $extraChanges),
            request: $request
        );

        $data = $advertiser->toArray();
        unset($data['access_token']);
        return response()->json($data);
    }

    /**
     * GET /api/admin/advertisers/export
     *
     * Streams a CSV of advertisers matching the same filters as index()
     * (status / payment_status / payment_method / search / date range), but
     * unpaginated. Used by the sales team for ad-hoc reporting.
     *
     * Auth note: requested via the admin Bearer token (the frontend fetches
     * it and triggers a client-side blob download), so it goes through the
     * same auth:sanctum + is-admin gate as the rest of the admin group.
     */
    public function export(Request $request): StreamedResponse
    {
        $query = Advertiser::query();

        if ($request->filled('status')) {
            $statuses = array_filter(array_map('trim', explode(',', (string) $request->query('status'))));
            $query->whereIn('status', $statuses);
        }
        if ($request->filled('payment_status')) {
            $query->where('payment_status', $request->query('payment_status'));
        }
        if ($request->filled('payment_method')) {
            $query->where('payment_method', $request->query('payment_method'));
        }
        if ($request->filled('search')) {
            $needle = '%' . addcslashes((string) $request->query('search'), '%_\\') . '%';
            $query->where(function ($q) use ($needle) {
                $q->where('business_name', 'like', $needle)
                  ->orWhere('contact_email', 'like', $needle)
                  ->orWhere('contact_name', 'like', $needle);
            });
        }
        if ($request->filled('from_date')) {
            $query->where('created_at', '>=', $request->query('from_date'));
        }
        if ($request->filled('to_date')) {
            $query->where('created_at', '<=', $request->query('to_date') . ' 23:59:59');
        }
        $query->orderByDesc('created_at');

        AuditLogger::log('advertiser.export_csv', null, [
            'filters' => $request->only(['status', 'payment_status', 'payment_method', 'search', 'from_date', 'to_date']),
        ], $request);

        $columns = [
            'id', 'business_name', 'business_type', 'contact_name', 'contact_email',
            'contact_phone', 'website_url', 'campaign_name', 'campaign_objective',
            'monthly_budget', 'design_service', 'has_ctv', 'total', 'status',
            'payment_status', 'payment_method', 'campaign_start_date',
            'campaign_end_date', 'created_at',
        ];

        $filename = 'advertisers-' . now()->format('Y-m-d-His') . '.csv';

        return new StreamedResponse(function () use ($query, $columns) {
            $out = fopen('php://output', 'w');
            fputcsv($out, $columns);

            // chunk() keeps memory flat even at 10k+ rows
            $query->chunk(500, function ($advertisers) use ($out, $columns) {
                foreach ($advertisers as $a) {
                    fputcsv($out, [
                        $a->id,
                        $a->business_name,
                        $a->business_type?->value,
                        $a->contact_name,
                        $a->contact_email,
                        $a->contact_phone,
                        $a->website_url,
                        $a->campaign_name,
                        $a->campaign_objective?->value,
                        $a->monthly_budget,
                        $a->design_service ? 'yes' : 'no',
                        $a->has_ctv ? 'yes' : 'no',
                        round($a->calculateTotal(), 2),
                        $a->status?->value,
                        $a->payment_status?->value,
                        $a->payment_method?->value,
                        optional($a->campaign_start_date)->toDateString(),
                        optional($a->campaign_end_date)->toDateString(),
                        optional($a->created_at)->toIso8601String(),
                    ]);
                }
            });

            fclose($out);
        }, 200, [
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }

    /**
     * POST /api/admin/advertisers/bulk-approve
     * Body: { ids: [uuid...] } — max 100. Only pending_review rows transition;
     * others are skipped (not an error). Returns { approved, skipped, total }.
     */
    public function bulkApprove(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids'   => ['required', 'array', 'min:1', 'max:100'],
            'ids.*' => ['uuid'],
        ]);

        $user = $request->user();
        $advertisers = Advertiser::whereIn('id', $validated['ids'])->get();

        $approved = 0;
        $skipped = 0;
        foreach ($advertisers as $advertiser) {
            if ($advertiser->status !== AdvertiserStatus::PendingReview) {
                $skipped++;
                continue;
            }
            $before = ['status' => $advertiser->status->value, 'notes' => $advertiser->notes];
            $advertiser->status = AdvertiserStatus::Approved;
            $line = 'Approved (bulk) by ' . $user->email . ' on ' . now()->toDateTimeString();
            $advertiser->notes = $advertiser->notes ? $advertiser->notes . "\n" . $line : $line;
            $advertiser->save();

            AuditLogger::log(
                action: 'advertiser.approve',
                target: $advertiser,
                changes: ['before' => $before, 'after' => ['status' => 'approved', 'notes' => $advertiser->notes], 'bulk' => true],
                request: $request
            );
            $approved++;
        }

        // Bulk-level summary row so the audit trail shows the operation itself.
        AuditLogger::log(
            action: 'advertiser.bulk_approve',
            target: null,
            changes: ['approved' => $approved, 'skipped' => $skipped, 'total' => count($validated['ids']), 'ids' => $validated['ids']],
            request: $request
        );

        return response()->json([
            'approved' => $approved,
            'skipped'  => $skipped,
            'total'    => count($validated['ids']),
        ]);
    }

    /**
     * POST /api/admin/advertisers/bulk-reject
     * Body: { ids: [uuid...], reason: string } — max 100.
     */
    public function bulkReject(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids'    => ['required', 'array', 'min:1', 'max:100'],
            'ids.*'  => ['uuid'],
            'reason' => ['required', 'string', 'min:3', 'max:2000'],
        ]);

        $user = $request->user();
        $advertisers = Advertiser::whereIn('id', $validated['ids'])->get();

        $rejected = 0;
        $skipped = 0;
        foreach ($advertisers as $advertiser) {
            if ($advertiser->status !== AdvertiserStatus::PendingReview) {
                $skipped++;
                continue;
            }
            $before = ['status' => $advertiser->status->value, 'notes' => $advertiser->notes];
            $advertiser->status = AdvertiserStatus::Rejected;
            $line = 'Rejected (bulk) by ' . $user->email . ' on ' . now()->toDateTimeString() . ': ' . $validated['reason'];
            $advertiser->notes = $advertiser->notes ? $advertiser->notes . "\n" . $line : $line;
            $advertiser->save();

            AuditLogger::log(
                action: 'advertiser.reject',
                target: $advertiser,
                changes: ['before' => $before, 'after' => ['status' => 'rejected', 'notes' => $advertiser->notes], 'reason' => $validated['reason'], 'bulk' => true],
                request: $request
            );
            $rejected++;
        }

        AuditLogger::log(
            action: 'advertiser.bulk_reject',
            target: null,
            changes: ['rejected' => $rejected, 'skipped' => $skipped, 'total' => count($validated['ids']), 'reason' => $validated['reason'], 'ids' => $validated['ids']],
            request: $request
        );

        return response()->json([
            'rejected' => $rejected,
            'skipped'  => $skipped,
            'total'    => count($validated['ids']),
        ]);
    }

    /**
     * Trim the listing payload — full record is heavy and the table view
     * doesn't need every JSON column.
     *
     * @return array<string,mixed>
     */
    private function listShape(Advertiser $a): array
    {
        return [
            'id'                  => $a->id,
            'business_name'       => $a->business_name,
            'contact_name'        => $a->contact_name,
            'contact_email'       => $a->contact_email,
            'campaign_name'       => $a->campaign_name,
            'campaign_objective'  => $a->campaign_objective?->value,
            'monthly_budget'      => $a->monthly_budget,
            'design_service'      => (bool) $a->design_service,
            'has_ctv'             => (bool) $a->has_ctv,
            'status'              => $a->status?->value,
            'payment_status'      => $a->payment_status?->value,
            'payment_method'      => $a->payment_method?->value,
            'total'               => round($a->calculateTotal(), 2),
            'created_at'          => optional($a->created_at)->toIso8601String(),
            'updated_at'          => optional($a->updated_at)->toIso8601String(),
        ];
    }
}
