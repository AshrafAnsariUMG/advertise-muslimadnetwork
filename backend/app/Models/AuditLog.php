<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    use HasUuids;

    /**
     * Audit logs are append-only. There is no updated_at column on this table;
     * Laravel's default timestamp handling would attempt to write one, so we
     * disable automatic timestamps and only let MySQL's CURRENT_TIMESTAMP
     * default populate created_at.
     */
    public $timestamps = false;

    protected $guarded = ['id'];

    protected $casts = [
        'changes'    => 'array',
        'created_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
