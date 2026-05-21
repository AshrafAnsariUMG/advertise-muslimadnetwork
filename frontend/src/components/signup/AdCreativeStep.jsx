'use client';

import { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  AlertCircle,
  Image as ImageIcon,
  Link as LinkIcon,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import { getApiUrl } from '@/lib/api';

/**
 * The four banner sizes the network accepts. Order matches the visual guide
 * (largest impact first). These MUST match
 * `backend/app/Http/Controllers/Api/V1/UploadController::ALLOWED_DIMENSIONS`.
 */
const ALLOWED_DIMENSIONS = [
  { width: 300, height: 250, label: 'Medium Rectangle' },
  { width: 728, height: 90, label: 'Leaderboard' },
  { width: 160, height: 600, label: 'Wide Skyscraper' },
  { width: 320, height: 50, label: 'Mobile Banner' },
];

const MAX_FILES = 4;
const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png'];

function dimensionFor(width, height) {
  return ALLOWED_DIMENSIONS.find(
    (d) => d.width === width && d.height === height
  );
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function readImageDimensions(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

function validateURL(url) {
  if (!url) return { valid: true, message: '' };
  try {
    const u = new URL(url);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') {
      return {
        valid: false,
        message: 'URL must start with http:// or https://',
      };
    }
    if (!u.hostname.includes('.')) {
      return { valid: false, message: 'Please enter a complete domain' };
    }
    return { valid: true, message: '' };
  } catch {
    return {
      valid: false,
      message: 'Please enter a valid URL (e.g., https://example.com)',
    };
  }
}

/**
 * Upload a single file via XHR so we can observe per-file progress.
 * Returns the JSON metadata on success, throws ApiError-shaped on failure.
 */
function uploadOne({ file, advertiserId, accessToken, onProgress }) {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append('advertiser_id', advertiserId);
    form.append('access_token', accessToken);
    form.append('file', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${getApiUrl()}/api/v1/uploads`);
    xhr.setRequestHeader('Accept', 'application/json');

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onerror = () =>
      reject(new Error('Network error — please try again'));

    xhr.onload = () => {
      let payload = null;
      try {
        payload = JSON.parse(xhr.responseText);
      } catch {
        payload = null;
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(payload);
      } else {
        const msg = payload?.message || `Upload failed (${xhr.status})`;
        const err = new Error(msg);
        err.status = xhr.status;
        err.errors = payload?.errors || null;
        reject(err);
      }
    };

    xhr.send(form);
  });
}

export default function AdCreativeStep({
  formData,
  updateFormData,
  advertiserId,
  accessToken,
}) {
  const creatives = formData.ad_creatives || [];
  const designService = !!formData.design_service;

  const [uploadingFiles, setUploadingFiles] = useState([]); // [{ name, progress }]
  const [urlValidation, setUrlValidation] = useState({ valid: true, message: '' });

  // Pre-fill the target URL from the user's website if they haven't set it.
  useEffect(() => {
    if (!formData.ad_destination_url && formData.website_url) {
      updateFormData({ ad_destination_url: formData.website_url });
    }
  }, [formData.website_url, formData.ad_destination_url, updateFormData]);

  const atMax = creatives.length >= MAX_FILES;
  const dropDisabled = designService || atMax || !advertiserId;

  const remainingSlots = Math.max(0, MAX_FILES - creatives.length);

  /**
   * Drop handler — validates each file client-side, then uploads sequentially
   * so progress is intelligible (a single 4-up race is harder to reason about
   * for the user and pile-drives the backend's rate limit).
   */
  const onDrop = useCallback(
    async (acceptedFiles, fileRejections) => {
      if (!advertiserId || !accessToken) {
        toast.error('Please complete Step 1 first so we can save your draft.');
        return;
      }

      // react-dropzone reports its own rejections (mime / size / too-many)
      for (const rej of fileRejections) {
        const reason = rej.errors?.[0]?.code;
        if (reason === 'file-too-large') {
          toast.error(`${rej.file.name} is larger than 2MB`);
        } else if (reason === 'file-invalid-type') {
          toast.error(`${rej.file.name} must be a JPEG or PNG`);
        } else if (reason === 'too-many-files') {
          toast.error(`You can only upload ${MAX_FILES} creatives total`);
        } else {
          toast.error(`${rej.file.name} was rejected`);
        }
      }

      // Trim to remaining slots (drag-and-drop of 5 when 2 already uploaded
      // should accept the first 2 of the 5 and warn about the rest)
      const available = acceptedFiles.slice(0, remainingSlots);
      if (acceptedFiles.length > remainingSlots) {
        toast.warning(
          `Only the first ${remainingSlots} file${
            remainingSlots === 1 ? '' : 's'
          } will be uploaded (4-creative cap)`
        );
      }

      for (const file of available) {
        // (1) Belt-and-braces size check (dropzone already enforced, but
        // future-proof against config drift).
        if (file.size > MAX_BYTES) {
          toast.error(`${file.name} is larger than 2MB`);
          continue;
        }

        // (2) MIME check
        if (!ALLOWED_MIME.includes(file.type)) {
          toast.error(`${file.name} must be a JPEG or PNG`);
          continue;
        }

        // (3) Dimension check — load the image briefly to read width/height
        let dim;
        try {
          dim = await readImageDimensions(file);
        } catch {
          toast.error(`Couldn't read ${file.name} — is it a real image?`);
          continue;
        }

        const allowed = dimensionFor(dim.width, dim.height);
        if (!allowed) {
          toast.error(
            `${file.name} is ${dim.width}×${dim.height}. Allowed sizes: ${ALLOWED_DIMENSIONS.map(
              (d) => `${d.width}×${d.height}`
            ).join(', ')}`
          );
          continue;
        }

        // (4) All checks passed — upload
        setUploadingFiles((prev) => [
          ...prev,
          { name: file.name, progress: 0 },
        ]);

        try {
          const result = await uploadOne({
            file,
            advertiserId,
            accessToken,
            onProgress: (progress) => {
              setUploadingFiles((prev) =>
                prev.map((item) =>
                  item.name === file.name ? { ...item, progress } : item
                )
              );
            },
          });

          updateFormData({
            ad_creatives: [...(formData.ad_creatives || []), result],
          });
        } catch (err) {
          toast.error(err.message || `Upload failed for ${file.name}`);
        } finally {
          setUploadingFiles((prev) =>
            prev.filter((item) => item.name !== file.name)
          );
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [advertiserId, accessToken, remainingSlots, formData.ad_creatives]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/jpg': [], 'image/png': [] },
    maxSize: MAX_BYTES,
    maxFiles: remainingSlots > 0 ? remainingSlots : 0,
    multiple: true,
    disabled: dropDisabled,
  });

  const removeCreative = (index) => {
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm(
        'Remove this creative? The original file stays on our server until cleanup runs nightly.'
      );
      if (!confirmed) return;
    }
    const next = [...(formData.ad_creatives || [])];
    next.splice(index, 1);
    updateFormData({ ad_creatives: next });
  };

  const handleDesignToggle = (checked) => {
    updateFormData({ design_service: checked });
    if (checked) {
      // Per spec: enabling the design service clears any prior uploads (the
      // user is choosing to start over with our team's work)
      updateFormData({ ad_creatives: [] });
    }
  };

  const handleUrlChange = (e) => {
    const url = e.target.value;
    updateFormData({ ad_destination_url: url });
    setUrlValidation(validateURL(url));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl flex items-center justify-center">
          <ImageIcon className="w-8 h-8 text-indigo-600" />
        </div>
        <h2 className="text-3xl font-black text-gray-900 mb-2">
          Your Ad Creatives
        </h2>
        <p className="text-gray-600 text-lg">
          Upload your banner ads or let our designers make them for you.
        </p>
      </div>

      {/* Section 1: Upload Your Ad Creatives */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-gray-900 font-semibold text-base">
            Upload Your Ad Creatives
          </Label>
          <Badge variant="outline" className="text-xs">
            {creatives.length} / {MAX_FILES}
          </Badge>
        </div>

        <p className="text-sm text-gray-600">
          Drop banner images in one of the four allowed sizes. JPEG or PNG, up
          to 2&nbsp;MB each.
        </p>

        {/* Allowed dimensions visual guide */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {ALLOWED_DIMENSIONS.map((dim) => {
            // Scale each preview to fit a 120×120 visual box while keeping
            // the aspect ratio — gives the user a sense of the shape.
            const scale = Math.min(120 / dim.width, 80 / dim.height);
            const w = Math.max(8, Math.round(dim.width * scale));
            const h = Math.max(8, Math.round(dim.height * scale));
            return (
              <div
                key={dim.label}
                className="border border-gray-200 rounded-lg p-3 flex flex-col items-center justify-center bg-gray-50/50"
              >
                <div
                  className="bg-gradient-to-br from-indigo-100 to-indigo-200 rounded border border-indigo-300 mb-2"
                  style={{ width: `${w}px`, height: `${h}px` }}
                  aria-hidden
                />
                <div className="text-xs font-semibold text-gray-900">
                  {dim.width}×{dim.height}
                </div>
                <div className="text-[10px] text-gray-500">{dim.label}</div>
              </div>
            );
          })}
        </div>

        {/* Drop zone */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dropDisabled
              ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
              : isDragActive
              ? 'border-indigo-500 bg-indigo-50 cursor-pointer'
              : 'border-gray-300 hover:border-indigo-400 cursor-pointer'
          }`}
        >
          <input {...getInputProps()} />
          <Upload
            className={`w-12 h-12 mx-auto mb-3 ${
              dropDisabled ? 'text-gray-300' : 'text-gray-400'
            }`}
          />
          {designService ? (
            <>
              <p className="text-sm font-medium text-gray-600">
                Design service selected — our team will create your creatives.
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Toggle the design service off below to upload your own.
              </p>
            </>
          ) : atMax ? (
            <>
              <p className="text-sm font-medium text-gray-600">
                Maximum 4 creatives reached.
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Remove one to upload another.
              </p>
            </>
          ) : !advertiserId ? (
            <>
              <p className="text-sm font-medium text-gray-600">
                Finish Step 1 first so we can save your uploads to your draft.
              </p>
            </>
          ) : isDragActive ? (
            <p className="text-sm font-medium text-indigo-700">
              Drop your banners here…
            </p>
          ) : (
            <>
              <p className="text-sm font-medium text-gray-700">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PNG or JPEG · max 2&nbsp;MB · {remainingSlots} slot
                {remainingSlots === 1 ? '' : 's'} remaining
              </p>
            </>
          )}
        </div>

        {/* Per-file upload progress */}
        {uploadingFiles.length > 0 && (
          <div className="space-y-2">
            {uploadingFiles.map((u) => (
              <div
                key={u.name}
                className="flex items-center gap-3 bg-indigo-50 border border-indigo-100 rounded px-3 py-2"
              >
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-700 truncate">{u.name}</p>
                  <div className="w-full bg-indigo-100 rounded-full h-1.5 mt-1 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-1.5 rounded-full transition-all"
                      style={{ width: `${u.progress}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs text-indigo-700 font-medium">
                  {u.progress}%
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Uploaded creatives list */}
        {creatives.length > 0 && (
          <div className="space-y-3">
            <Label className="text-gray-900 font-medium">
              Uploaded creatives
            </Label>
            <div className="grid md:grid-cols-2 gap-4">
              {creatives.map((creative, index) => (
                <Card
                  key={`${creative.file_url}-${index}`}
                  className="relative overflow-hidden border-2 border-gray-200"
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 z-10 bg-white/90 hover:bg-white"
                    onClick={() => removeCreative(index)}
                    aria-label={`Remove ${creative.file_name}`}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  <CardContent className="p-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={creative.file_url}
                      alt={creative.file_name}
                      className="w-full h-auto rounded shadow-sm mb-3 bg-checkered"
                    />
                    <div className="space-y-2">
                      <p
                        className="text-xs font-medium text-gray-700 truncate"
                        title={creative.file_name}
                      >
                        {creative.file_name}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-xs">
                          {creative.dimension_label}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-xs text-gray-500"
                        >
                          {formatFileSize(creative.file_size)}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Section 2: Design service toggle */}
      <section className="pt-6 border-t border-gray-200">
        <Card
          className={`transition-all border-2 ${
            designService ? 'border-purple-300 bg-purple-50/50' : 'border-gray-200'
          }`}
        >
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-3 mb-1">
                  <Label
                    htmlFor="design_service"
                    className="text-gray-900 font-semibold cursor-pointer"
                  >
                    Don&apos;t have creatives? Let our design team make them for you
                  </Label>
                  <Switch
                    id="design_service"
                    checked={designService}
                    onCheckedChange={handleDesignToggle}
                  />
                </div>
                <p className="text-sm text-gray-600">
                  Professional ad banners designed for your campaign in all
                  four sizes — <span className="font-semibold">+$200</span>{' '}
                  one-time. Our team will reach out within 24&nbsp;hours to
                  collect your brand assets.
                </p>
                {designService && (
                  <Alert className="mt-3 bg-purple-50 border-purple-200">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <AlertDescription className="text-purple-900 text-sm">
                      Design service selected. You can skip uploading creatives
                      — we&apos;ll handle the design.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Target URL — required for any campaign to actually run */}
      <section className="pt-6 border-t border-gray-200 space-y-2">
        <Label
          htmlFor="ad_destination_url"
          className="text-gray-900 font-medium flex items-center gap-2"
        >
          <div className="w-5 h-5 rounded bg-blue-100 flex items-center justify-center">
            <LinkIcon className="w-3 h-3 text-blue-600" />
          </div>
          Target URL *
        </Label>
        <Input
          id="ad_destination_url"
          type="url"
          value={formData.ad_destination_url || ''}
          onChange={handleUrlChange}
          placeholder="https://yourbrand.com/shop"
          className={`h-12 ${
            !urlValidation.valid && formData.ad_destination_url
              ? 'border-red-500 focus:border-red-500'
              : ''
          }`}
        />
        <p className="text-xs text-gray-500">
          Where should people go when they click your ad?
        </p>
        {!urlValidation.valid && urlValidation.message && (
          <Alert variant="destructive" className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {urlValidation.message}
            </AlertDescription>
          </Alert>
        )}
      </section>
    </div>
  );
}
