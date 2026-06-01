<?php

namespace App\Jobs;

use App\Models\Advertiser;
use App\Services\PipedriveService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Moves an advertiser's Pipedrive deal to a new stage (e.g. on activation).
 *
 * Queued + fire-and-forget: a Pipedrive hiccup must never block the admin
 * action that triggered it. Retries a couple of times; a final failure just
 * logs (the deal stage being stale in Pipedrive is a cosmetic CRM issue, not
 * a data-integrity one).
 */
class UpdatePipedriveDealStage implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $tries = 3;
    public array $backoff = [30, 120, 300];
    public int $timeout = 30;

    public function __construct(
        public Advertiser $advertiser,
        public int $stageId
    ) {
    }

    public function handle(PipedriveService $pipedrive): void
    {
        $pipedrive->updateDealStage($this->advertiser, $this->stageId);
    }

    public function failed(?\Throwable $exception): void
    {
        Log::warning('UpdatePipedriveDealStage: final failure', [
            'advertiser_id'     => $this->advertiser->id,
            'pipedrive_deal_id' => $this->advertiser->pipedrive_deal_id,
            'stage_id'          => $this->stageId,
            'message'           => $exception?->getMessage(),
        ]);
    }
}
