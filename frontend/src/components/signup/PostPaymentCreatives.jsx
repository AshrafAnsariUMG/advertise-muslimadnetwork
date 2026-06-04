'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import {
  UploadCloud,
  Image as ImageIcon,
  Film,
  X,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getApiUrl } from '@/lib/api';

const MAX_TOTAL = 6;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB
const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // 100 MB

const ALLOWED_DIMENSIONS = [
  { width: 300, height: 250, label: '300×250 (Medium Rectangle)' },
  { width: 728, height: 90, label: '728×90 (Leaderboard)' },
  { width: 160, height: 600, label: '160×600 (Wide Skyscraper)' },
  { width: 320, height: 50, label: '320×50 (Mobile Banner)' },
];

const IMAGE_MIME = ['image/jpeg', 'image/jpg', 'image/png'];
const VIDEO_MIME = ['video/mp4', 'video/quicktime', 'video/webm'];
const VIDEO_EXT = ['mp4', 'mov', 'webm'];

function dimensionFor(w, h) {
  return ALLOWED_DIMENSIONS.find((d) => d.width === w && d.height === h) || null;
}

function readImageDimensions(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('not an image'));
    };
    img.src = url;
  });
}

/** Upload one file via XHR (server persists it to ad_creatives). */
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
    xhr.onerror = () => reject(new Error('Network error — please try again'));
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
        const err = new Error(payload?.message || `Upload failed (${xhr.status})`);
        err.status = xhr.status;
        reject(err);
      }
    };
    xhr.send(form);
  });
}

export default function PostPaymentCreatives({
  advertiserId,
  accessToken,
  hasCtv = false,
  initialCreatives = [],
  onDone,
}) {
  const [creatives, setCreatives] = useState(initialCreatives);
  const [uploading, setUploading] = useState([]); // [{ name, progress }]

  const remaining = Math.max(0, MAX_TOTAL - creatives.length);
  const atMax = remaining === 0;

  const onDrop = useCallback(
    async (accepted, rejections) => {
      for (const rej of rejections) {
        toast.error(`${rej.file.name} was rejected (${rej.errors?.[0]?.code || 'invalid'})`);
      }

      const slots = accepted.slice(0, remaining);
      if (accepted.length > remaining) {
        toast.warning(`Only ${remaining} more file(s) can be added (max ${MAX_TOTAL}).`);
      }

      for (const file of slots) {
        const isVideo =
          VIDEO_MIME.includes(file.type) ||
          VIDEO_EXT.includes(file.name.split('.').pop()?.toLowerCase());

        // ---- client-side validation ----
        if (isVideo) {
          if (!hasCtv) {
            toast.error('Video is only accepted for campaigns with the Streaming TV (CTV) add-on.');
            continue;
          }
          if (file.size > MAX_VIDEO_BYTES) {
            toast.error(`${file.name} is larger than 100MB.`);
            continue;
          }
        } else {
          if (!IMAGE_MIME.includes(file.type)) {
            toast.error(`${file.name} must be a JPEG, PNG${hasCtv ? ', or MP4/MOV/WebM video' : ''}.`);
            continue;
          }
          if (file.size > MAX_IMAGE_BYTES) {
            toast.error(`${file.name} is larger than 2MB.`);
            continue;
          }
          let dim;
          try {
            dim = await readImageDimensions(file);
          } catch {
            toast.error(`Couldn't read ${file.name}.`);
            continue;
          }
          if (!dimensionFor(dim.width, dim.height)) {
            toast.error(
              `${file.name} is ${dim.width}×${dim.height}. Allowed: ${ALLOWED_DIMENSIONS.map((d) => `${d.width}×${d.height}`).join(', ')}.`
            );
            continue;
          }
        }

        // ---- upload ----
        setUploading((prev) => [...prev, { name: file.name, progress: 0 }]);
        try {
          const result = await uploadOne({
            file,
            advertiserId,
            accessToken,
            onProgress: (progress) =>
              setUploading((prev) =>
                prev.map((u) => (u.name === file.name ? { ...u, progress } : u))
              ),
          });
          setCreatives((prev) => [...prev, result]);
        } catch (err) {
          toast.error(err.message || `Upload failed for ${file.name}`);
        } finally {
          setUploading((prev) => prev.filter((u) => u.name !== file.name));
        }
      }
    },
    [advertiserId, accessToken, remaining, hasCtv]
  );

  const accept = hasCtv
    ? {
        'image/jpeg': [],
        'image/png': [],
        'video/mp4': ['.mp4'],
        'video/quicktime': ['.mov'],
        'video/webm': ['.webm'],
      }
    : { 'image/jpeg': [], 'image/png': [] };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles: remaining > 0 ? remaining : 0,
    multiple: true,
    disabled: atMax,
  });

  return (
    <div className="space-y-5 text-left">
      <div className="rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/40 p-4">
        <p className="text-sm font-semibold text-gray-900 mb-1">Accepted formats</p>
        <ul className="text-xs text-gray-600 space-y-0.5">
          <li>• Display banners (JPEG/PNG): 300×250, 728×90, 160×600, 320×50 — max 2MB each</li>
          {hasCtv && (
            <li>• Streaming TV video (MP4/MOV/WebM): max 100MB each</li>
          )}
        </ul>
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
          atMax
            ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
            : isDragActive
            ? 'border-indigo-500 bg-indigo-50'
            : 'border-gray-300 hover:border-indigo-400 hover:bg-indigo-50/40'
        }`}
      >
        <input {...getInputProps()} />
        <UploadCloud className="w-10 h-10 mx-auto text-indigo-500 mb-2" />
        {atMax ? (
          <p className="text-sm text-gray-500">Maximum {MAX_TOTAL} creatives reached</p>
        ) : (
          <p className="text-sm text-gray-600">
            <span className="font-medium text-indigo-600">Click to upload</span> or
            drag and drop · {remaining} slot{remaining === 1 ? '' : 's'} remaining
          </p>
        )}
      </div>

      {/* In-flight */}
      {uploading.map((u) => (
        <div key={u.name} className="flex items-center gap-3 text-sm text-gray-600">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
          <span className="flex-1 truncate">{u.name}</span>
          <span className="text-xs">{u.progress}%</span>
        </div>
      ))}

      {/* Uploaded creatives */}
      {creatives.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {creatives.map((c, i) => (
            <div
              key={`${c.file_url}-${i}`}
              className="relative rounded-lg border border-gray-200 bg-white p-2 flex flex-col items-center justify-center gap-1"
            >
              <button
                type="button"
                onClick={() => setCreatives((prev) => prev.filter((_, idx) => idx !== i))}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white border border-gray-200 shadow flex items-center justify-center hover:bg-rose-50"
                aria-label="Remove from view"
                title="Remove from this list (file stays uploaded)"
              >
                <X className="w-3.5 h-3.5 text-gray-500" />
              </button>
              {c.kind === 'video' ? (
                <Film className="w-8 h-8 text-purple-500" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={c.file_url}
                  alt={c.file_name}
                  className="max-h-16 w-auto object-contain"
                />
              )}
              <span className="text-[11px] text-gray-500 text-center truncate w-full">
                {c.dimension_label}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Done */}
      <div className="pt-2 flex flex-col items-center gap-2">
        <Button
          onClick={onDone}
          className="px-8 h-12 text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          {creatives.length > 0 ? "I'm done — finish" : 'Skip for now'}
        </Button>
        {creatives.length === 0 && (
          <p className="text-xs text-gray-500 text-center">
            You can upload later from the link in your confirmation email.
          </p>
        )}
      </div>
    </div>
  );
}
