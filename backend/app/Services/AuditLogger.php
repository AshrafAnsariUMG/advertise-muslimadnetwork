<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Append-only audit log writer.
 *
 * Always called explicitly from controllers — no observers, no triggers.
 * The verbose call site is the point: every audit entry should be visible
 * in the diff of the action that wrote it, so reviewers can see what gets
 * logged when.
 *
 * Action naming convention: dot-namespaced lowercase, "domain.verb[.qualifier]".
 *   - `advertiser.approve`
 *   - `advertiser.reject`
 *   - `advertiser.activate`
 *   - `advertiser.pause`
 *   - `advertiser.resume`
 *   - `auth.login.success`
 *   - `auth.login.failed`
 *   - `auth.login.unauthorized`
 *   - `auth.logout`
 */
class AuditLogger
{
    public static function log(
        string $action,
        ?Model $target = null,
        ?array $changes = null,
        ?Request $request = null
    ): void {
        $req = $request ?? (function_exists('request') ? request() : null);

        AuditLog::create([
            'user_id'     => Auth::id(),
            'action'      => $action,
            'target_type' => $target ? class_basename($target) : 'system',
            'target_id'   => $target?->getKey() ?? '',
            'changes'     => $changes,
            'ip_address'  => $req?->ip(),
            'user_agent'  => self::truncate((string) $req?->header('User-Agent', ''), 500),
        ]);
    }

    private static function truncate(string $value, int $max): ?string
    {
        if ($value === '') return null;
        return mb_substr($value, 0, $max);
    }
}
