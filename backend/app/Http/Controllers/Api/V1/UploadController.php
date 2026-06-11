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

    private const MAX_CREATIVES_PER_ADVERTISER = 6;

    private const MAX_IMAGE_BYTES = 2 * 1024 * 1024;        // 2 MB
    private const MAX_VIDEO_BYTES = 100 * 1024 * 1024;      // 100 MB

    /** Accepted video container extensions (CTV creatives). */
    private const ALLOWED_VIDEO_EXT = ['mp4', 'mov', 'webm'];
    private const ALLOWED_VIDEO_MIME = ['video/mp4', 'video/quicktime', 'video/webm'];

    public function store(UploadFileRequest $request): JsonResponse
    {
        /** @var \App\Models\Advertiser $advertiser */
        $advertiser = Advertiser::findOrFail($request->validated('advertiser_id'));

        // Cap creatives per advertiser (banners + videos combined).
        $existing = $advertiser->ad_creatives ?? [];
        if (count($existing) >= self::MAX_CREATIVES_PER_ADVERTISER) {
            return response()->json([
                'message' => 'Maximum of ' . self::MAX_CREATIVES_PER_ADVERTISER . ' ad creatives allowed.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $upload = $request->file('file');

        // Genuine type detection — do NOT trust the client's reported MIME.
        // getimagesize() succeeds only for real raster images; anything else
        // is treated as a (potential) video and routed accordingly.
        $imageInfo = @getimagesize($upload->getRealPath());

        $creative = $imageInfo !== false
            ? $this->handleImage($advertiser, $upload, $imageInfo)
            : $this->handleVideo($advertiser, $upload);

        // $creative is either the metadata array or a JsonResponse (error).
        if ($creative instanceof JsonResponse) {
            return $creative;
        }

        // Persist server-side. The public PATCH endpoint is locked once
        // payment_status=paid, so post-payment creative uploads can ONLY be
        // saved here — the upload endpoint owns the ad_creatives array.
        $advertiser->ad_creatives = array_merge($existing, [$creative]);
        $advertiser->save();

        return response()->json($creative, Response::HTTP_CREATED);
    }

    /**
     * Validate + store a display banner. Returns the creative metadata array,
     * or a JsonResponse on rejection.
     *
     * @param  array<int,mixed>  $info  getimagesize() result
     * @return array<string,mixed>|JsonResponse
     */
    private function handleImage(Advertiser $advertiser, $upload, array $info)
    {
        if ($upload->getSize() > self::MAX_IMAGE_BYTES) {
            return response()->json([
                'message' => 'Image must be 2MB or smaller.',
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

        $ext = $imageType === IMAGETYPE_JPEG ? 'jpg' : 'png';
        $filename = Str::uuid()->toString() . '.' . $ext;
        $relativePath = "ad-creatives/{$advertiser->id}/{$filename}";

        // Strip EXIF by re-encoding through GD (drops GPS/camera metadata).
        $stripped = $this->stripExif($upload->getRealPath(), $imageType);
        if ($stripped === null) {
            return response()->json([
                'message' => 'Failed to process image.',
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }

        Storage::disk('public')->put($relativePath, $stripped);

        return [
            'kind'            => 'image',
            'file_url'        => Storage::disk('public')->url($relativePath),
            'file_name'       => $upload->getClientOriginalName(),
            'file_size'       => strlen($stripped),
            'width'           => $width,
            'height'          => $height,
            'dimension_label' => $this->labelFor($width, $height),
        ];
    }

    /**
     * Validate + store a video creative. Only permitted when the campaign has
     * the CTV (Streaming TV) add-on enabled. Returns metadata or a JsonResponse.
     *
     * @return array<string,mixed>|JsonResponse
     */
    private function handleVideo(Advertiser $advertiser, $upload)
    {
        // CTV (streaming TV) and MasjidConnect (in-mosque digital screens) both
        // run video creatives; display-only campaigns take banners.
        if (!$advertiser->has_ctv && !$advertiser->has_masjidconnect) {
            return response()->json([
                'message' => 'Video creatives are only accepted for campaigns with the Streaming TV (CTV) or Masjid Screens (DOOH) add-on. Upload a display banner (JPEG/PNG) instead.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        if ($upload->getSize() > self::MAX_VIDEO_BYTES) {
            return response()->json([
                'message' => 'Video must be 100MB or smaller.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $ext = strtolower((string) $upload->getClientOriginalExtension());
        $mime = (string) $upload->getMimeType(); // Symfony guesses from content

        if (!in_array($ext, self::ALLOWED_VIDEO_EXT, true)
            || !in_array($mime, self::ALLOWED_VIDEO_MIME, true)) {
            return response()->json([
                'message' => 'Unsupported video format. Accepted: MP4, MOV, WebM.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $filename = Str::uuid()->toString() . '.' . $ext;
        $relativePath = "ad-creatives/{$advertiser->id}/{$filename}";

        // Store the video as-is (GD can't process video, so no re-encode).
        $stream = fopen($upload->getRealPath(), 'r');
        Storage::disk('public')->put($relativePath, $stream);
        if (is_resource($stream)) {
            fclose($stream);
        }

        return [
            'kind'            => 'video',
            'file_url'        => Storage::disk('public')->url($relativePath),
            'file_name'       => $upload->getClientOriginalName(),
            'file_size'       => $upload->getSize(),
            'width'           => null,
            'height'          => null,
            'dimension_label' => 'Video (' . strtoupper($ext) . ')',
        ];
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
