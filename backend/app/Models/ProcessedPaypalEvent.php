<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class ProcessedPaypalEvent extends Model
{
    use HasUuids;

    /**
     * Append-only. We do touch `processed_at` after first insert, but that's
     * a single targeted update — we don't want Eloquent rewriting an
     * `updated_at` on every save.
     */
    public $timestamps = false;

    protected $guarded = ['id'];

    protected $casts = [
        'payload'      => 'array',
        'processed_at' => 'datetime',
        'created_at'   => 'datetime',
    ];
}
