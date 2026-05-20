<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\UploadFileRequest;
use App\Models\Advertiser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class UploadController extends Controller
{
    /**
     * The four creative sizes the IAB-style ad network accepts. Browser
     * validates first; this is the server-side enforcement.
     */
    private const ALLOWED_DIMENSIONS = [
        ['width' => 300, 'height' => 250, 'label' => '300×250 (Medium Rectangle)'],
        ['width' => 728, 'height' => 90,  'label' => '728×90 (Leaderboard)'],
        ['width' => 160, 'height' => 600, 'label' => '160×600 (Wide Skyscraper)'],
        ['width' => 320, 'height' => 50,  'label' => '320×50 (Mobile Banner)'],
    ];

    private const MAX_CREATIVES_PER_ADVERTISER = 4;

    public function store(UploadFileRequest $request): JsonResponse
    {
        /** @var \App\Models\Advertiser $advertiser */
        $advertiser = Advertiser::findOrFail($request->validated('advertiser_id'));

        // Cap creatives per advertiser
        $existing = $advertiser->ad_creatives ?? [];
        if (count($existing) >= self::MAX_CREATIVES_PER_ADVERTISER) {
            return response()->json([
                'message' => 'Maximum of ' . self::MAX_CREATIVES_PER_ADVERTISER . ' ad creatives allowed.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $upload = $request->file('file');
        $realPath = $upload->getRealPath();

        // Genuine MIME — do NOT trust the upload's reported MIME header
        $info = @getimagesize($realPath);
        if ($info === false) {
            return response()->json([
                'message' => 'Uploaded file is not a valid image.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        [$width, $height] = $info;
        $imageType = $info[2] ?? null;

        if (!in_array($imageType, [IMAGETYPE_JPEG, IMAGETYPE_PNG], true)) {
            return response()->json([
                'message' => 'Only JPEG and PNG images are accepted.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        if (!$this->isAllowedDimension($width, $height)) {
            return response()->json([
                'message' => sprintf(
                    'Image dimensions %d×%d are not allowed. Allowed sizes: %s.',
                    $width,
                    $height,
                    implode(', ', array_column(self::ALLOWED_DIMENSIONS, 'label'))
                ),
                'errors' => ['file' => ['Invalid image dimensions.']],
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $label = $this->labelFor($width, $height);
        $ext = $imageType === IMAGETYPE_JPEG ? 'jpg' : 'png';
        $filename = Str::uuid()->toString() . '.' . $ext;
        $relativePath = "ad-creatives/{$advertiser->id}/{$filename}";

        // Strip EXIF by re-encoding through GD. This rebuilds the image from
        // pixel data only; metadata (GPS, camera info, etc.) is dropped.
        $stripped = $this->stripExif($realPath, $imageType);
        if ($stripped === null) {
            return response()->json([
                'message' => 'Failed to process image.',
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }

        Storage::disk('public')->put($relativePath, $stripped);

        $originalName = $upload->getClientOriginalName();
        $fileSize = strlen($stripped);

        return response()->json([
            'file_url'        => Storage::disk('public')->url($relativePath),
            'file_name'       => $originalName,
            'file_size'       => $fileSize,
            'width'           => $width,
            'height'          => $height,
            'dimension_label' => $label,
        ], Response::HTTP_CREATED);
    }

    private function isAllowedDimension(int $width, int $height): bool
    {
        foreach (self::ALLOWED_DIMENSIONS as $dim) {
            if ($dim['width'] === $width && $dim['height'] === $height) {
                return true;
            }
        }
        return false;
    }

    private function labelFor(int $width, int $height): string
    {
        foreach (self::ALLOWED_DIMENSIONS as $dim) {
            if ($dim['width'] === $width && $dim['height'] === $height) {
                return $dim['label'];
            }
        }
        return "{$width}×{$height}";
    }

    /**
     * Re-encode through GD to strip EXIF and other metadata. Returns the
     * binary payload, or null on failure.
     */
    private function stripExif(string $path, int $imageType): ?string
    {
        $image = @imagecreatefromstring((string) file_get_contents($path));
        if ($image === false) {
            return null;
        }

        // Preserve transparency for PNG
        if ($imageType === IMAGETYPE_PNG) {
            imagealphablending($image, false);
            imagesavealpha($image, true);
        }

        ob_start();
        try {
            $ok = $imageType === IMAGETYPE_JPEG
                ? imagejpeg($image, null, 90)
                : imagepng($image, null, 6);
            $data = ob_get_clean();
            if (!$ok || $data === false) {
                return null;
            }
            return $data;
        } finally {
            imagedestroy($image);
        }
    }
}
