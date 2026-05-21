<?php

namespace App\Console\Commands;

use App\Models\Advertiser;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

/**
 * Sweeps stale files from `storage/app/public/ad-creatives/`.
 *
 * Files become orphans when:
 *  - The user removes a creative from the wizard's uploaded list (we drop
 *    the entry from `advertisers.ad_creatives` but don't delete the file
 *    inline — PHP runs as root under PM2; the API process can't `unlink`
 *    its own creations from a request context safely).
 *  - The whole advertiser row gets soft-deleted or hard-deleted.
 *
 * This command runs weekly. Orphans aren't urgent (they don't leak PII —
 * uploads have been EXIF-stripped per the upload controller) but storage
 * fills up over time without cleanup.
 */
class CleanupOrphanCreatives extends Command
{
    protected $signature = 'creatives:cleanup-orphans
                            {--dry-run : Report what would be deleted without removing anything}';

    protected $description = 'Remove orphan ad-creative files no longer referenced by any advertiser.';

    public function handle(): int
    {
        $disk = Storage::disk('public');
        $dryRun = (bool) $this->option('dry-run');

        if (!$disk->exists('ad-creatives')) {
            $this->info('No ad-creatives directory found, nothing to clean.');
            return self::SUCCESS;
        }

        $directories = $disk->directories('ad-creatives');
        $removedFiles = 0;
        $touchedDirs = 0;

        foreach ($directories as $dir) {
            // `dir` is like "ad-creatives/{advertiser-uuid}"
            $advertiserId = basename($dir);

            // Soft-deleted records are still findable; only a missing row
            // means "this whole directory is garbage".
            $advertiser = Advertiser::withTrashed()->find($advertiserId);

            if (!$advertiser || $advertiser->trashed()) {
                $files = $disk->files($dir);
                if ($dryRun) {
                    $this->line("DRY-RUN: would purge {$dir} ({$advertiserId} not in DB or trashed) — " . count($files) . ' files');
                } else {
                    $disk->deleteDirectory($dir);
                }
                $removedFiles += count($files);
                $touchedDirs++;
                continue;
            }

            $referenced = $this->referencedBasenames($advertiser);
            $files = $disk->files($dir);
            $dirTouched = false;

            foreach ($files as $file) {
                $basename = basename($file);
                if (!isset($referenced[$basename])) {
                    if ($dryRun) {
                        $this->line("DRY-RUN: would delete {$file}");
                    } else {
                        $disk->delete($file);
                    }
                    $removedFiles++;
                    $dirTouched = true;
                }
            }

            if ($dirTouched) {
                $touchedDirs++;
            }
        }

        $msg = "Orphan cleanup: removed {$removedFiles} files from {$touchedDirs} advertiser directories"
            . ($dryRun ? ' (dry run)' : '');
        Log::info($msg);
        $this->info($msg);

        return self::SUCCESS;
    }

    /**
     * Build a lookup of basenames (e.g. "abc123.png") that the advertiser
     * row points at via `ad_creatives[*].file_url`.
     *
     * @return array<string,true>
     */
    private function referencedBasenames(Advertiser $advertiser): array
    {
        $out = [];
        foreach (($advertiser->ad_creatives ?? []) as $creative) {
            $url = $creative['file_url'] ?? null;
            if (!is_string($url) || $url === '') continue;
            $name = basename(parse_url($url, PHP_URL_PATH) ?: $url);
            if ($name !== '') $out[$name] = true;
        }
        return $out;
    }
}
