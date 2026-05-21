<?php

/**
 * Pipedrive CRM configuration.
 *
 * `domain` is the company-specific subdomain shown in the Pipedrive
 * dashboard URL (e.g. `muslimadnetwork.pipedrive.com` → `muslimadnetwork`).
 * The discovery command (`php artisan pipedrive:discover`) lists pipelines
 * and stages so the operator can populate the IDs below.
 *
 * Stage routing:
 *   abandoned drafts → STAGE_ABANDONED
 *   paid customers   → STAGE_PAID
 *
 * If `api_token` is empty, PipedriveService throws a clear "not configured"
 * error rather than failing silently.
 */

$domain = trim((string) env('PIPEDRIVE_DOMAIN', ''));

return [
    'api_token'       => env('PIPEDRIVE_API_TOKEN'),
    'domain'          => $domain,
    'api_url'         => $domain !== '' ? "https://{$domain}.pipedrive.com/api/v1" : null,
    'pipeline_id'     => env('PIPEDRIVE_PIPELINE_ID') !== null && env('PIPEDRIVE_PIPELINE_ID') !== ''
        ? (int) env('PIPEDRIVE_PIPELINE_ID')
        : null,
    'stage_abandoned' => env('PIPEDRIVE_STAGE_ABANDONED') !== null && env('PIPEDRIVE_STAGE_ABANDONED') !== ''
        ? (int) env('PIPEDRIVE_STAGE_ABANDONED')
        : null,
    'stage_paid'      => env('PIPEDRIVE_STAGE_PAID') !== null && env('PIPEDRIVE_STAGE_PAID') !== ''
        ? (int) env('PIPEDRIVE_STAGE_PAID')
        : null,
    'currency'        => strtoupper((string) env('PIPEDRIVE_CURRENCY', 'USD')),
];
