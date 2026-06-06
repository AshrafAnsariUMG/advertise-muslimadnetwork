<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\AdvertiserStatus;
use App\Http\Controllers\Controller;
use App\Jobs\PushAdvertiserToPipedrive;
use App\Mail\AbandonedCartRecovery;
use App\Models\Advertiser;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

/**
 * Admin endpoints for the abandoned-carts workflow.
 *
 * "Abandoned" here means an Advertiser in any `incomplete_step_*` status
 * whose last activity (`updated_at`) is older than min_age_minutes (default
 * 5 — short enough to feel real-time, long enough that actively-typing
 * users don't appear), with a contact_email so we can recover them.
 *
 * Two recovery levers:
 *  - Recovery email (queued AbandonedCartRecovery mailable)
 *  - Pipedrive push (queued PushAdvertiserToPipedrive job, stage=abandoned)
 *
 * Both are tracked on the advertiser:
 *  - `recovery_email_sent` + `recovery_email_sent_date`
 *  - `pushed_to_pipedrive`
 *
 * The single-record endpoints return 409 on duplicate to nudge admins toward
 * the bulk endpoints with a `force` flag if intentional.
 */
class AbandonedController extends Controller
{
    private const PER_PAGE = 15;
    private const SORTABLE_COLUMNS = [
        'created_at',
        'updated_at',       // "inactive for" — time since last activity
        'business_name',
        'contact_name',
        'monthly_budget',   // "potential"
        'recovery_email_sent_date',
    ];
    private const INCOMPLETE_STAGES = [
        'incomplete_step_1',
        'incomplete_step_2',
        'incomplete_step_3',
    ];
    private const BULK_MAX = 100;

    /**
     * GET /api/admin/abandoned
     */
    public function index(Request $request): JsonResponse
    {
        $stages = $this->parseStages($request);
        // Minimum inactivity window — default 5 minutes since the user's last
        // save. We filter on `updated_at` (last activity), not `created_at`,
        // so an actively-typing user (auto-save fires every 1s) never appears
        // here. The moment they stop interacting for 5 min, they show up.
        $minAgeMinutes = (int) $request->query('min_age_minutes', 5);
        $hasEmail = filter_var($request->query('has_email', 'true'), FILTER_VALIDATE_BOOLEAN);
        $cutoff = now()->subMinutes(max(0, $minAgeMinutes));

        $query = Advertiser::query()
            ->whereIn('status', $stages)
            ->where('updated_at', '<', $cutoff);

        if ($hasEmail) {
            $query->whereNotNull('contact_email')->where('contact_email', '!=', '');
        }

        if ($request->filled('search')) {
            $needle = '%' . addcslashes((string) $request->query('search'), '%_\\') . '%';
            $query->where(function ($q) use ($needle) {
                $q->where('business_name', 'like', $needle)
                  ->orWhere('contact_email', 'like', $needle)
                  ->orWhere('contact_name', 'like', $needle);
            });
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

        $paginated->getCollection()->transform(fn (Advertiser $a) => $this->rowShape($a));

        // Summary aggregates — run a second cheap query so they reflect the
        // *whole* filtered set, not just the current page.
        $summary = $this->summary($stages, $cutoff, $hasEmail, $request->query('search'));

        // Merge summary into the meta block — Laravel paginator's toArray()
        // already includes `meta` keys; we append our own.
        $payload = $paginated->toArray();
        $payload['summary'] = $summary;

        return response()->json($payload);
    }

    /**
     * POST /api/admin/abandoned/{id}/send-recovery
     */
    public function sendRecovery(Request $request, string $id): JsonResponse
    {
        $advertiser = $this->loadOrFail($id);
        if ($advertiser instanceof JsonResponse) return $advertiser;

        if (!$advertiser->contact_email) {
            return response()->json([
                'message' => 'Advertiser has no contact email — cannot send recovery.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        if ($advertiser->recovery_email_sent) {
            return response()->json([
                'message' => 'Recovery email already sent on '
                    . optional($advertiser->recovery_email_sent_date)->toDateTimeString() . '. '
                    . 'Use bulk-send with force=true if you want to re-send.',
                'already_sent_at' => optional($advertiser->recovery_email_sent_date)->toIso8601String(),
            ], Response::HTTP_CONFLICT);
        }

        Mail::to($advertiser->contact_email)->queue(new AbandonedCartRecovery($advertiser));

        // Don't bump updated_at — it's the customer-inactivity clock the
        // abandoned list filters on. An admin emailing the lead is NOT
        // customer activity, so the row must stay visible (just "Emailed ✓").
        $advertiser->recovery_email_sent = true;
        $advertiser->recovery_email_sent_date = now();
        $advertiser->timestamps = false;
        $advertiser->save();

        AuditLogger::log(
            action: 'abandoned.send_recovery',
            target: $advertiser,
            changes: ['recovery_email_sent_date' => $advertiser->recovery_email_sent_date->toIso8601String()],
            request: $request
        );

        return response()->json(['status' => 'dispatched']);
    }

    /**
     * POST /api/admin/abandoned/{id}/push-pipedrive
     */
    public function pushPipedrive(Request $request, string $id): JsonResponse
    {
        $advertiser = $this->loadOrFail($id);
        if ($advertiser instanceof JsonResponse) return $advertiser;

        if ($advertiser->pushed_to_pipedrive) {
            return response()->json([
                'message' => 'Advertiser already pushed to Pipedrive.',
            ], Response::HTTP_CONFLICT);
        }

        PushAdvertiserToPipedrive::dispatch($advertiser, 'abandoned');

        AuditLogger::log(
            action: 'abandoned.push_pipedrive',
            target: $advertiser,
            changes: ['stage_type' => 'abandoned'],
            request: $request
        );

        return response()->json(['status' => 'queued']);
    }

    /**
     * POST /api/admin/abandoned/bulk-send-recovery
     */
    public function bulkSendRecovery(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids'   => ['required', 'array', 'min:1', 'max:' . self::BULK_MAX],
            'ids.*' => ['uuid'],
            'force' => ['nullable', 'boolean'],
        ]);

        $force = (bool) ($validated['force'] ?? false);
        $advertisers = Advertiser::whereIn('id', $validated['ids'])->get();

        $dispatched = 0;
        $skipped = 0;
        $skipReasons = [];

        foreach ($advertisers as $advertiser) {
            if (!$advertiser->contact_email) {
                $skipped++;
                $skipReasons[$advertiser->id] = 'no_contact_email';
                continue;
            }
            if (!$force && $advertiser->recovery_email_sent) {
                $skipped++;
                $skipReasons[$advertiser->id] = 'already_sent';
                continue;
            }

            Mail::to($advertiser->contact_email)->queue(new AbandonedCartRecovery($advertiser));

            $advertiser->recovery_email_sent = true;
            $advertiser->recovery_email_sent_date = now();
            $advertiser->timestamps = false; // keep the inactivity clock intact
            $advertiser->save();
            $dispatched++;
        }

        AuditLogger::log(
            action: 'abandoned.bulk_send_recovery',
            target: null,
            changes: [
                'count'        => $dispatched,
                'skipped'      => $skipped,
                'total'        => count($validated['ids']),
                'force'        => $force,
                'ids'          => $validated['ids'],
                'skip_reasons' => $skipReasons,
            ],
            request: $request
        );

        return response()->json([
            'dispatched' => $dispatched,
            'skipped'    => $skipped,
            'total'      => count($validated['ids']),
        ]);
    }

    /**
     * POST /api/admin/abandoned/bulk-push-pipedrive
     */
    public function bulkPushPipedrive(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids'   => ['required', 'array', 'min:1', 'max:' . self::BULK_MAX],
            'ids.*' => ['uuid'],
            'force' => ['nullable', 'boolean'],
        ]);

        $force = (bool) ($validated['force'] ?? false);
        $advertisers = Advertiser::whereIn('id', $validated['ids'])->get();

        $dispatched = 0;
        $skipped = 0;
        $skipReasons = [];

        foreach ($advertisers as $advertiser) {
            if (!$advertiser->contact_email) {
                $skipped++;
                $skipReasons[$advertiser->id] = 'no_contact_email';
                continue;
            }
            if (!$force && $advertiser->pushed_to_pipedrive) {
                $skipped++;
                $skipReasons[$advertiser->id] = 'already_pushed';
                continue;
            }

            // For "force" mode on re-push: zero the flag so the job's defensive
            // skip-if-already-pushed check doesn't no-op.
            if ($force && $advertiser->pushed_to_pipedrive) {
                $advertiser->pushed_to_pipedrive = false;
                $advertiser->timestamps = false; // keep the inactivity clock intact
                $advertiser->save();
            }

            PushAdvertiserToPipedrive::dispatch($advertiser, 'abandoned');
            $dispatched++;
        }

        AuditLogger::log(
            action: 'abandoned.bulk_push_pipedrive',
            target: null,
            changes: [
                'count'        => $dispatched,
                'skipped'      => $skipped,
                'total'        => count($validated['ids']),
                'force'        => $force,
                'ids'          => $validated['ids'],
                'skip_reasons' => $skipReasons,
            ],
            request: $request
        );

        return response()->json([
            'dispatched' => $dispatched,
            'skipped'    => $skipped,
            'total'      => count($validated['ids']),
        ]);
    }

    /**
     * @return array<int,string>
     */
    private function parseStages(Request $request): array
    {
        $raw = (string) $request->query('stage', '');
        if ($raw === '') {
            return self::INCOMPLETE_STAGES;
        }
        $stages = array_filter(array_map('trim', explode(',', $raw)));
        $stages = array_values(array_intersect($stages, self::INCOMPLETE_STAGES));
        return $stages ?: self::INCOMPLETE_STAGES;
    }

    private function loadOrFail(string $id): JsonResponse|Advertiser
    {
        $advertiser = Advertiser::find($id);
        if (!$advertiser) {
            return response()->json(['message' => 'Advertiser not found.'], Response::HTTP_NOT_FOUND);
        }

        if (!in_array($advertiser->status?->value, self::INCOMPLETE_STAGES, true)) {
            return response()->json([
                'message' => 'Advertiser is not in an abandoned state (current: '
                    . $advertiser->status?->value . ').',
            ], Response::HTTP_CONFLICT);
        }

        return $advertiser;
    }

    /**
     * @return array<string,mixed>
     */
    private function rowShape(Advertiser $a): array
    {
        // Inactivity = time since last save. Granular minutes — the frontend
        // formats it as "Xm" / "Xh" / "Xd" depending on magnitude.
        $inactiveMinutes = $a->updated_at
            ? max(0, (int) $a->updated_at->diffInMinutes(now()))
            : null;

        return [
            'id'                         => $a->id,
            'business_name'              => $a->business_name,
            'contact_name'               => $a->contact_name,
            'contact_email'              => $a->contact_email,
            'contact_phone'              => $a->contact_phone,
            'campaign_name'              => $a->campaign_name,
            'monthly_budget'             => $a->monthly_budget,
            'design_service'             => (bool) $a->design_service,
            'status'                     => $a->status?->value,
            'inactive_minutes'           => $inactiveMinutes,
            'recovery_email_sent'        => (bool) $a->recovery_email_sent,
            'recovery_email_sent_date'   => optional($a->recovery_email_sent_date)->toIso8601String(),
            'pushed_to_pipedrive'        => (bool) $a->pushed_to_pipedrive,
            'potential_total'            => $a->monthly_budget !== null
                ? round($a->calculateTotal(), 2)
                : null,
            'created_at'                 => optional($a->created_at)->toIso8601String(),
            'last_activity_at'           => optional($a->updated_at)->toIso8601String(),
        ];
    }

    /**
     * @param  array<int,string>  $stages
     * @return array<string,mixed>
     */
    private function summary(array $stages, \Carbon\Carbon $cutoff, bool $hasEmail, ?string $search): array
    {
        $base = Advertiser::query()
            ->whereIn('status', $stages)
            ->where('updated_at', '<', $cutoff);

        if ($hasEmail) {
            $base->whereNotNull('contact_email')->where('contact_email', '!=', '');
        }

        if ($search) {
            $needle = '%' . addcslashes($search, '%_\\') . '%';
            $base->where(function ($q) use ($needle) {
                $q->where('business_name', 'like', $needle)
                  ->orWhere('contact_email', 'like', $needle)
                  ->orWhere('contact_name', 'like', $needle);
            });
        }

        $row = (clone $base)->selectRaw('
            COUNT(*) AS total_count,
            COALESCE(SUM(COALESCE(monthly_budget, 0) + (design_service * 200)), 0) AS total_potential,
            SUM(CASE WHEN recovery_email_sent = 1 THEN 1 ELSE 0 END) AS emailed_count,
            SUM(CASE WHEN pushed_to_pipedrive = 1 THEN 1 ELSE 0 END) AS pipedrive_pushed_count
        ')->first();

        return [
            'total_count'              => (int) ($row->total_count ?? 0),
            'total_potential'          => round((float) ($row->total_potential ?? 0), 2),
            'emailed_count'            => (int) ($row->emailed_count ?? 0),
            'pipedrive_pushed_count'   => (int) ($row->pipedrive_pushed_count ?? 0),
        ];
    }
}
