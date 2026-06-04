<?php

namespace App\Services;

use App\Models\Advertiser;
use Illuminate\Http\Client\Response as HttpResponse;
use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * Pipedrive CRM client — REST direct via the Http facade.
 *
 * The Pipedrive surface we need is small (Persons, Deals, Pipelines, Stages,
 * DealFields) and their official PHP SDK would add far more code than it
 * saves. Direct HTTP keeps the wire shape visible in diffs, matches the
 * pattern we use for PayPal in S7, and avoids version pin headaches.
 *
 * v1 design choices:
 *  - Person dedup: search by exact email, reuse if found.
 *  - Deal dedup: NONE. Each push creates a new deal; if the operator pushes
 *    the same advertiser twice, two deals exist. The `pushed_to_pipedrive`
 *    flag is the soft guard against accidental double-pushes in the UI.
 *  - No Organization entity yet (the website_url maps to person->org_name).
 *  - No custom field mapping yet — DealFields are listed by the discovery
 *    command for the operator to inspect, but we don't write to them.
 *
 * @see PipedriveDiscover for the one-shot pipeline/stage enumeration tool.
 */
class PipedriveService
{
    /**
     * @throws RuntimeException if PIPEDRIVE_API_TOKEN is not configured
     */
    private function token(): string
    {
        $token = (string) config('pipedrive.api_token');
        if ($token === '') {
            throw new RuntimeException(
                'Pipedrive not configured — set PIPEDRIVE_API_TOKEN in .env'
                . ' (run `php artisan pipedrive:discover` to find your pipeline/stage IDs).'
            );
        }
        return $token;
    }

    private function url(string $path): string
    {
        $base = (string) config('pipedrive.api_url');
        if ($base === '') {
            throw new RuntimeException(
                'Pipedrive not configured — set PIPEDRIVE_DOMAIN in .env'
                . ' (your company subdomain, e.g. `muslimadnetwork`).'
            );
        }
        return rtrim($base, '/') . $path;
    }

    /**
     * GET /users/me — round-trips with the configured token to verify auth.
     */
    public function testConnection(): array
    {
        $response = Http::timeout(10)->get($this->url('/users/me'), [
            'api_token' => $this->token(),
        ]);
        $this->assertOk($response, '/users/me');
        return (array) $response->json('data', []);
    }

    /**
     * @return array<int,array<string,mixed>>
     */
    public function listPipelines(): array
    {
        $response = Http::timeout(10)->get($this->url('/pipelines'), [
            'api_token' => $this->token(),
        ]);
        $this->assertOk($response, '/pipelines');
        return (array) ($response->json('data') ?? []);
    }

    /**
     * @return array<int,array<string,mixed>>
     */
    public function listStages(int $pipelineId): array
    {
        $response = Http::timeout(10)->get($this->url('/stages'), [
            'api_token'   => $this->token(),
            'pipeline_id' => $pipelineId,
        ]);
        $this->assertOk($response, '/stages');
        return (array) ($response->json('data') ?? []);
    }

    /**
     * @return array<int,array<string,mixed>>
     */
    public function listDealFields(): array
    {
        $response = Http::timeout(10)->get($this->url('/dealFields'), [
            'api_token' => $this->token(),
        ]);
        $this->assertOk($response, '/dealFields');
        return (array) ($response->json('data') ?? []);
    }

    /**
     * Returns the first matching person ID for an exact-email search, or
     * null if no match.
     */
    public function searchPerson(string $email): ?int
    {
        $response = Http::timeout(10)->get($this->url('/persons/search'), [
            'api_token'    => $this->token(),
            'term'         => $email,
            'fields'       => 'email',
            'exact_match'  => 'true',
        ]);
        $this->assertOk($response, '/persons/search');

        $items = (array) ($response->json('data.items') ?? []);
        $first = $items[0] ?? null;
        $id = $first['item']['id'] ?? null;

        return is_numeric($id) ? (int) $id : null;
    }

    /**
     * Create a Pipedrive Person. Returns the new person ID.
     *
     * @param  array<string,mixed>  $data  expects keys: name, email, phone (any may be null/missing)
     *
     * Note: the v1 /persons endpoint does NOT accept `org_name` (returns 400
     * ERR_SCHEMA_VALIDATION_FAILED). Linking an org requires a separate Orgs
     * call + `org_id`. Per spec we don't create orgs — the company name lives
     * in the attached deal Note instead.
     */
    public function createPerson(array $data): int
    {
        $payload = array_filter([
            'name'  => $data['name'] ?? null,
            'email' => isset($data['email']) ? [$data['email']] : null,
            'phone' => isset($data['phone']) ? [$data['phone']] : null,
        ], fn ($v) => $v !== null && $v !== '');

        $response = Http::timeout(10)
            ->asJson()
            ->post($this->url('/persons') . '?api_token=' . urlencode($this->token()), $payload);
        $this->assertOk($response, '/persons (create)');

        $id = $response->json('data.id');
        if (!is_numeric($id)) {
            throw new RuntimeException('Pipedrive returned no person id: ' . $response->body());
        }
        return (int) $id;
    }

    /**
     * Search-then-create. The email is the dedup key.
     */
    public function findOrCreatePerson(Advertiser $advertiser): int
    {
        $email = (string) $advertiser->contact_email;
        if ($email === '') {
            throw new RuntimeException(
                'Cannot push advertiser ' . $advertiser->id . ' to Pipedrive: contact_email is empty.'
            );
        }

        $existing = $this->searchPerson($email);
        if ($existing !== null) {
            return $existing;
        }

        // Spec: paid push falls back contact_name → business_name; abandoned
        // falls back contact_name → email. This chain covers both: paid
        // submissions always have business_name (it's required at submission),
        // so they get business_name; abandoned drafts that haven't entered a
        // business name yet fall through to email.
        $name = $advertiser->contact_name
            ?: $advertiser->business_name
            ?: $email;

        return $this->createPerson([
            'name'  => $name,
            'email' => $email,
            'phone' => $advertiser->contact_phone,
        ]);
    }

    /**
     * @param  array<string,mixed>  $data
     */
    public function createDeal(array $data): int
    {
        $payload = array_filter([
            'title'      => $data['title'] ?? null,
            'value'      => $data['value'] ?? null,
            'currency'   => $data['currency'] ?? config('pipedrive.currency', 'USD'),
            'stage_id'   => $data['stage_id'] ?? null,
            'person_id'  => $data['person_id'] ?? null,
            // Pipedrive deal statuses: open / won / lost / deleted. We mark
            // paid deals as 'won' so they leave the active sales pipeline
            // forecast and land in the closed-won bucket.
            'status'     => $data['status'] ?? null,
            'expected_close_date' => $data['expected_close_date'] ?? null,
        ], fn ($v) => $v !== null && $v !== '');

        $response = Http::timeout(10)
            ->asJson()
            ->post($this->url('/deals') . '?api_token=' . urlencode($this->token()), $payload);
        $this->assertOk($response, '/deals (create)');

        $id = $response->json('data.id');
        if (!is_numeric($id)) {
            throw new RuntimeException('Pipedrive returned no deal id: ' . $response->body());
        }
        return (int) $id;
    }

    /**
     * High-level push. Resolves person, builds the deal payload, creates the
     * deal, flips `pushed_to_pipedrive`, audits, returns the new deal id.
     *
     * @param  'abandoned'|'paid'  $stageType
     */
    public function pushAdvertiser(Advertiser $advertiser, string $stageType): int
    {
        $stageId = $stageType === 'paid'
            ? config('pipedrive.stage_paid')
            : config('pipedrive.stage_abandoned');

        if (!$stageId) {
            throw new RuntimeException(
                "Pipedrive stage not configured for type '{$stageType}'. "
                . 'Set PIPEDRIVE_STAGE_ABANDONED / PIPEDRIVE_STAGE_PAID in .env '
                . '(run `php artisan pipedrive:discover` to find IDs).'
            );
        }

        $personId = $this->findOrCreatePerson($advertiser);

        // Deal title format per spec — emoji prefix + business name.
        // Paid: "✅ PAID - {biz}". Abandoned: "{biz} - Abandoned Cart".
        $business = $advertiser->business_name
            ?: $advertiser->contact_email
            ?: 'Untitled lead';
        $title = $stageType === 'paid'
            ? "✅ PAID - {$business}"
            : "{$business} - Abandoned Cart";

        // Paid deals are worth the actual paid total. Abandoned deals are
        // worth the *potential* monthly budget (no design service add — they
        // never committed to it).
        $value = $stageType === 'paid'
            ? $advertiser->calculateTotal()
            : (float) ($advertiser->monthly_budget ?? 0);

        $dealId = $this->createDeal([
            'title'     => $title,
            'value'     => $value,
            'currency'  => config('pipedrive.currency', 'USD'),
            'stage_id'  => (int) $stageId,
            'person_id' => $personId,
            'status'    => $stageType === 'paid' ? 'won' : 'open',
            'expected_close_date' => optional($advertiser->campaign_start_date)->toDateString(),
        ]);

        // Attach a Note with the full advertiser context — covers every
        // useful field we don't (or can't) map to a standard Pipedrive
        // column. Non-fatal: a note failure shouldn't undo a successful deal.
        try {
            $this->createNote([
                'deal_id'   => $dealId,
                'person_id' => $personId,
                'content'   => $stageType === 'paid'
                    ? $this->buildPaidNote($advertiser)
                    : $this->buildAbandonedNote($advertiser),
            ]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Pipedrive note attach failed', [
                'advertiser_id' => $advertiser->id,
                'deal_id'       => $dealId,
                'error'         => $e->getMessage(),
            ]);
        }

        $advertiser->pushed_to_pipedrive = true;
        $advertiser->pipedrive_deal_id = (string) $dealId;
        $advertiser->pipedrive_pushed_at = now();
        $advertiser->save();

        AuditLogger::log(
            action: 'pipedrive.push.' . $stageType,
            target: $advertiser,
            changes: [
                'pipedrive_deal_id'   => $dealId,
                'pipedrive_person_id' => $personId,
                'stage_id'            => (int) $stageId,
                'value'               => $value,
            ]
        );

        return $dealId;
    }

    /**
     * Pipedrive Notes API. Pipedrive renders `content` as HTML.
     *
     * @param  array{deal_id?:int,person_id?:int,content:string}  $data
     */
    public function createNote(array $data): int
    {
        $payload = array_filter([
            'content'   => $data['content'] ?? '',
            'deal_id'   => $data['deal_id'] ?? null,
            'person_id' => $data['person_id'] ?? null,
        ], fn ($v) => $v !== null && $v !== '');

        $response = Http::timeout(10)
            ->asJson()
            ->post($this->url('/notes') . '?api_token=' . urlencode($this->token()), $payload);
        $this->assertOk($response, '/notes (create)');

        $id = $response->json('data.id');
        if (!is_numeric($id)) {
            throw new RuntimeException('Pipedrive returned no note id: ' . $response->body());
        }
        return (int) $id;
    }

    /**
     * Paid-push note — full submission context. `Advertiser ID` at the end
     * acts as a dedup key for any future "search notes by advertiser_id"
     * logic we add.
     */
    private function buildPaidNote(Advertiser $a): string
    {
        $designService = $a->design_service ? 'Yes ($200)' : 'No';
        $total = $a->calculateTotal();
        return $this->renderNote([
            'Name'                => $a->contact_name,
            'Email'               => $a->contact_email,
            'Phone'               => $a->contact_phone,
            'Company Name'        => $a->business_name,
            'Website URL'         => $a->website_url,
            'Campaign Name'       => $a->campaign_name,
            'Monthly Budget'      => $this->money($a->monthly_budget),
            'Design Service'      => $designService,
            'Total Value'         => $this->money($total),
            'Application Status'  => $this->humanize($a->status?->value),
            'Payment Status'      => $this->humanize($a->payment_status?->value),
            'Advertiser ID'       => $a->id,
        ]);
    }

    /**
     * Abandoned-push note — recovery-focused context including a deep-link
     * back into the wizard so sales can resume the draft on the customer's
     * behalf, plus a suggested promo code for the recovery email.
     */
    private function buildAbandonedNote(Advertiser $a): string
    {
        $countries = is_array($a->target_countries)
            ? implode(', ', $a->target_countries)
            : ($a->target_countries ?? '');

        $recoveryLink = rtrim((string) config('app.frontend_url'), '/')
            . '/?return=' . urlencode($a->id)
            . '&token=' . urlencode($a->access_token);

        return $this->renderNote([
            'Business Name'    => $a->business_name,
            'Business Type'    => $this->humanize($a->business_type?->value),
            'Contact'          => $a->contact_name,
            'Email'            => $a->contact_email,
            'Phone'            => $a->contact_phone,
            'Website'          => $a->website_url,
            'Campaign Name'    => $a->campaign_name,
            'Objective'        => $this->humanize($a->campaign_objective?->value),
            'Monthly Budget'   => $this->money($a->monthly_budget),
            'Status'           => $this->humanize($a->status?->value),
            'Countries'        => $countries,
            'Age Range'        => $a->target_age_range,
            'Gender'           => $a->target_gender?->value,
            'Recovery Link'    => $recoveryLink,
            'Suggested Coupon' => '100OFF',
            'Advertiser ID'    => $a->id,
        ]);
    }

    /**
     * @param  array<string,mixed>  $fields
     */
    private function renderNote(array $fields): string
    {
        $lines = [];
        foreach ($fields as $label => $value) {
            if ($value === null || $value === '') {
                continue;
            }
            $safeLabel = htmlspecialchars($label, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
            $safeValue = htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
            $lines[] = "<p><strong>{$safeLabel}:</strong> {$safeValue}</p>";
        }
        return implode("\n", $lines);
    }

    private function money(?float $v): ?string
    {
        if ($v === null) return null;
        return '$' . number_format((float) $v, 2);
    }

    private function humanize(?string $v): ?string
    {
        if ($v === null || $v === '') return null;
        return ucwords(str_replace('_', ' ', $v));
    }

    /**
     * Move an existing deal to a new stage. Used when an advertiser is
     * activated (paid → live). No-op (returns false) if the advertiser has
     * no stored deal id or the target stage isn't configured — both are
     * acceptable "nothing to do" states, not errors.
     */
    public function updateDealStage(Advertiser $advertiser, int $stageId): bool
    {
        $dealId = $advertiser->pipedrive_deal_id;
        if (!$dealId) {
            return false;
        }

        $response = Http::timeout(10)
            ->asJson()
            ->put(
                $this->url('/deals/' . $dealId) . '?api_token=' . urlencode($this->token()),
                ['stage_id' => $stageId]
            );
        $this->assertOk($response, '/deals (stage update)');

        AuditLogger::log(
            action: 'pipedrive.update_stage',
            target: $advertiser,
            changes: ['pipedrive_deal_id' => $dealId, 'stage_id' => $stageId]
        );

        return true;
    }

    private function assertOk(HttpResponse $response, string $context): void
    {
        if ($response->successful()) {
            return;
        }
        throw new RuntimeException(
            "Pipedrive {$context} failed: HTTP {$response->status()} {$response->body()}"
        );
    }
}
