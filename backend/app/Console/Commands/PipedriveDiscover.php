<?php

namespace App\Console\Commands;

use App\Services\PipedriveService;
use Illuminate\Console\Command;

/**
 * One-shot pipeline + stage enumeration for Pipedrive setup.
 *
 * Run during S11 setup, never again unless Pipedrive structure changes.
 * Lists every pipeline and its stages, then prints the env keys the operator
 * needs to populate to wire up our push integration.
 */
class PipedriveDiscover extends Command
{
    protected $signature = 'pipedrive:discover';

    protected $description = 'List Pipedrive pipelines and stages, then print env-var instructions for setup.';

    public function handle(PipedriveService $pipedrive): int
    {
        $this->line('');
        $this->info('Pipedrive discovery');
        $this->line(str_repeat('=', 60));

        try {
            $me = $pipedrive->testConnection();
            $this->line('Connected as: ' . ($me['name'] ?? 'unknown')
                . ' (' . ($me['email'] ?? 'no email') . ')');
            $this->line('Company:      ' . ($me['company_name'] ?? 'unknown'));
            $this->line('');
        } catch (\Throwable $e) {
            $this->error('Auth check failed: ' . $e->getMessage());
            $this->line('');
            $this->line('Fix this first — likely PIPEDRIVE_API_TOKEN or PIPEDRIVE_DOMAIN is wrong.');
            return self::FAILURE;
        }

        try {
            $pipelines = $pipedrive->listPipelines();
        } catch (\Throwable $e) {
            $this->error('Failed to list pipelines: ' . $e->getMessage());
            return self::FAILURE;
        }

        if (empty($pipelines)) {
            $this->warn('No pipelines found in this Pipedrive account.');
            return self::SUCCESS;
        }

        $this->info('Pipelines:');
        $this->table(
            ['ID', 'Name', 'Active'],
            array_map(fn ($p) => [
                $p['id'] ?? '?',
                $p['name'] ?? '(unnamed)',
                ($p['active'] ?? false) ? 'yes' : 'no',
            ], $pipelines),
        );
        $this->line('');

        foreach ($pipelines as $pipeline) {
            $pid = (int) ($pipeline['id'] ?? 0);
            if (!$pid) continue;

            $this->info('Stages for pipeline ' . $pid . ' (' . ($pipeline['name'] ?? '?') . '):');

            try {
                $stages = $pipedrive->listStages($pid);
            } catch (\Throwable $e) {
                $this->error('  Failed: ' . $e->getMessage());
                continue;
            }

            if (empty($stages)) {
                $this->line('  (no stages)');
                $this->line('');
                continue;
            }

            $this->table(
                ['Stage ID', 'Name', 'Order'],
                array_map(fn ($s) => [
                    $s['id'] ?? '?',
                    $s['name'] ?? '(unnamed)',
                    $s['order_nr'] ?? '?',
                ], $stages),
            );
            $this->line('');
        }

        $this->line(str_repeat('=', 60));
        $this->info('Next steps');
        $this->line('');
        $this->line('Pick a pipeline and two stage IDs (one for abandoned drafts,');
        $this->line('one for paid customers). Add them to backend/.env:');
        $this->line('');
        $this->line('  PIPEDRIVE_PIPELINE_ID=<id>');
        $this->line('  PIPEDRIVE_STAGE_ABANDONED=<stage id>');
        $this->line('  PIPEDRIVE_STAGE_PAID=<stage id>');
        $this->line('');
        $this->line('Then: php artisan config:clear && php artisan config:cache');
        $this->line('');

        return self::SUCCESS;
    }
}
