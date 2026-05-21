<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Read-only audit log viewer.
 *
 * Append-only contract: there is no `store`, `update`, `destroy`. Audit
 * rows are written via App\Services\AuditLogger from inside the action
 * controllers, never via HTTP from a client.
 */
class AuditLogController extends Controller
{
    private const PER_PAGE = 25;

    /**
     * GET /api/admin/audit-logs
     */
    public function index(Request $request): JsonResponse
    {
        $query = AuditLog::query()->with(['user:id,name,email']);

        if ($request->filled('action')) {
            $value = (string) $request->query('action');
            // Trailing * → prefix match (e.g. "advertiser.*"). Anything else
            // is a substring match so "approve" finds advertiser.approve too.
            if (str_ends_with($value, '*')) {
                $prefix = addcslashes(rtrim($value, '*'), '%_\\');
                $query->where('action', 'like', $prefix . '%');
            } else {
                $needle = '%' . addcslashes($value, '%_\\') . '%';
                $query->where('action', 'like', $needle);
            }
        }

        if ($request->filled('target_type')) {
            $query->where('target_type', $request->query('target_type'));
        }

        if ($request->filled('target_id')) {
            $query->where('target_id', $request->query('target_id'));
        }

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->query('user_id'));
        }

        if ($request->filled('from_date')) {
            $query->where('created_at', '>=', $request->query('from_date'));
        }
        if ($request->filled('to_date')) {
            $query->where('created_at', '<=', $request->query('to_date') . ' 23:59:59');
        }

        $query->orderByDesc('created_at');

        $paginated = $query->paginate(self::PER_PAGE);

        $paginated->getCollection()->transform(function (AuditLog $row) {
            return [
                'id'          => $row->id,
                'action'      => $row->action,
                'target_type' => $row->target_type,
                'target_id'   => $row->target_id,
                'changes'     => $row->changes,
                'ip_address'  => $row->ip_address,
                'user_agent'  => $row->user_agent,
                'created_at'  => optional($row->created_at)->toIso8601String(),
                'user'        => $row->user
                    ? [
                        'id'    => $row->user->id,
                        'name'  => $row->user->name,
                        'email' => $row->user->email,
                    ]
                    : null,
            ];
        });

        return response()->json($paginated);
    }
}
