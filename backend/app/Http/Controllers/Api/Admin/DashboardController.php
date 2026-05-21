<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\AdvertiserStatus;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Models\Advertiser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Admin dashboard metrics endpoint.
 *
 * Designed to stay under ~200ms at 10k advertiser rows:
 *  - All counts are single grouped queries (no N+1).
 *  - Revenue and abandoned-potential are computed in SQL with the same
 *    formula `Advertiser::calculateTotal()` uses (monthly_budget + $200 if
 *    design_service) — these stay in step manually because MySQL boolean
 *    columns are tinyint(1) and ($d * 200) works without a CASE.
 *  - 30-day trend backfills zero-count days in PHP after one COUNT/GROUP query.
 */
class DashboardController extends Controller
{
    public function metrics(Request $request): JsonResponse
    {
        return response()->json([
            'totals'                    => $this->totals(),
            'abandoned'                 => $this->abandoned(),
            'status_breakdown'          => $this->statusBreakdown(),
            'signups_last_30_days'      => $this->signupsLast30Days(),
            'payment_method_breakdown'  => $this->paymentMethodBreakdown(),
            'recent_submissions'        => $this->recentSubmissions(),
        ]);
    }

    /**
     * @return array<string,mixed>
     */
    private function totals(): array
    {
        $row = Advertiser::query()
            ->selectRaw('
                COUNT(*) AS all_count,
                SUM(CASE WHEN payment_status = ? THEN 1 ELSE 0 END) AS paid_count,
                SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) AS pending_review_count,
                SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) AS active_count,
                SUM(CASE WHEN payment_status = ?
                         THEN COALESCE(monthly_budget, 0) + (design_service * 200)
                         ELSE 0 END) AS total_revenue
            ', [
                PaymentStatus::Paid->value,
                AdvertiserStatus::PendingReview->value,
                AdvertiserStatus::Active->value,
                PaymentStatus::Paid->value,
            ])
            ->first();

        return [
            'all'            => (int) ($row->all_count ?? 0),
            'paid'           => (int) ($row->paid_count ?? 0),
            'pending_review' => (int) ($row->pending_review_count ?? 0),
            'active'         => (int) ($row->active_count ?? 0),
            'total_revenue'  => round((float) ($row->total_revenue ?? 0), 2),
        ];
    }

    /**
     * @return array<string,mixed>
     */
    private function abandoned(): array
    {
        $cutoff = now()->subHours(24);

        $row = Advertiser::query()
            ->where('status', AdvertiserStatus::IncompleteStep3->value)
            ->where('created_at', '<', $cutoff)
            ->selectRaw('
                COUNT(*) AS abandoned_count,
                SUM(COALESCE(monthly_budget, 0) + (design_service * 200)) AS potential
            ')
            ->first();

        return [
            'count'         => (int) ($row->abandoned_count ?? 0),
            'sum_potential' => round((float) ($row->potential ?? 0), 2),
        ];
    }

    /**
     * @return list<array{status:string,count:int}>
     */
    private function statusBreakdown(): array
    {
        return Advertiser::query()
            ->selectRaw('status, COUNT(*) AS count')
            ->groupBy('status')
            ->orderBy('status')
            ->get()
            ->map(fn ($row) => [
                // status is enum-cast on the model — extract the underlying
                // string value rather than trying to cast the enum object.
                'status' => $row->status instanceof \BackedEnum
                    ? $row->status->value
                    : (string) $row->status,
                'count'  => (int) $row->count,
            ])
            ->all();
    }

    /**
     * @return list<array{date:string,count:int}>
     */
    private function signupsLast30Days(): array
    {
        // Day window is inclusive of today, 30 days total.
        $start = Carbon::today()->subDays(29);
        $end = Carbon::today()->endOfDay();

        $rows = Advertiser::query()
            ->where('created_at', '>=', $start)
            ->where('created_at', '<=', $end)
            ->selectRaw('DATE(created_at) AS day, COUNT(*) AS count')
            ->groupBy('day')
            ->pluck('count', 'day')
            ->all();

        $out = [];
        $cursor = $start->copy();
        while ($cursor->lte($end)) {
            $key = $cursor->toDateString();
            $out[] = [
                'date'  => $key,
                'count' => (int) ($rows[$key] ?? 0),
            ];
            $cursor->addDay();
        }

        return $out;
    }

    /**
     * @return array<string,int>
     */
    private function paymentMethodBreakdown(): array
    {
        $rows = Advertiser::query()
            ->where('payment_status', PaymentStatus::Paid->value)
            ->whereNotNull('payment_method')
            ->selectRaw('payment_method, COUNT(*) AS count')
            ->groupBy('payment_method')
            ->get();

        $out = [];
        foreach ($rows as $row) {
            // payment_method is enum-cast on the model; unwrap to its string
            // value for the JSON response.
            $key = $row->payment_method instanceof \BackedEnum
                ? $row->payment_method->value
                : (string) $row->payment_method;
            $out[$key] = (int) $row->count;
        }
        return $out;
    }

    /**
     * @return list<array<string,mixed>>
     */
    private function recentSubmissions(): array
    {
        return Advertiser::query()
            ->where('payment_status', PaymentStatus::Paid->value)
            ->orderByDesc('updated_at')
            ->limit(5)
            ->get([
                'id', 'business_name', 'contact_email', 'campaign_name',
                'monthly_budget', 'design_service', 'payment_method',
                'created_at', 'updated_at', 'status',
            ])
            ->map(fn (Advertiser $a) => [
                'id'             => $a->id,
                'business_name'  => $a->business_name,
                'contact_email'  => $a->contact_email,
                'campaign_name'  => $a->campaign_name,
                'total'          => round($a->calculateTotal(), 2),
                'payment_method' => $a->payment_method?->value,
                'created_at'     => optional($a->created_at)->toIso8601String(),
                'updated_at'     => optional($a->updated_at)->toIso8601String(),
                'status'         => $a->status?->value,
            ])
            ->all();
    }
}
