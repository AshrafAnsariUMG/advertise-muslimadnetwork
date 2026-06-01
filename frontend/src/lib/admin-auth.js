/**
 * Admin token storage + Bearer-injected fetch wrapper.
 *
 * The Sanctum personal-access token lives in localStorage under
 * `admin_token`. Public-wizard storage (`advertise_draft_id`,
 * `advertise_draft_token`) is namespaced separately so a logged-in admin
 * can still test the wizard from the same browser.
 *
 * On 401 the helper unilaterally clears the token and hard-redirects to
 * `/admin/login` — the cleanest way to recover from an expired/revoked
 * session without leaking state into the next request.
 */

import { ApiError, getApiUrl } from './api';

const TOKEN_KEY = 'admin_token';

function safeWindow() {
  if (typeof window === 'undefined') return null;
  return window;
}

export function getAdminToken() {
  const w = safeWindow();
  if (!w) return null;
  try {
    return w.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAdminToken(token) {
  const w = safeWindow();
  if (!w || !token) return;
  try {
    w.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // ignore — quota / private mode
  }
}

export function clearAdminToken() {
  const w = safeWindow();
  if (!w) return;
  try {
    w.localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

/**
 * Bearer-injected fetch. Returns parsed JSON on 2xx. Throws ApiError on
 * other 4xx/5xx — except 401, where it also clears the token and
 * redirects so the caller doesn't have to handle the logout fork.
 */
export async function adminApiCall(path, options = {}) {
  const token = getAdminToken();
  const url = `${getApiUrl()}${path}`;

  const headers = {
    Accept: 'application/json',
    ...(options.headers || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const init = {
    method: options.method || 'GET',
    headers,
    signal: options.signal,
  };

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(options.body);
  }

  let response;
  try {
    response = await fetch(url, init);
  } catch (networkErr) {
    if (networkErr.name === 'AbortError') throw networkErr;
    throw new ApiError({
      status: 0,
      message: 'Network error — please check your connection and try again.',
    });
  }

  if (response.status === 401) {
    clearAdminToken();
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/admin/login')) {
      window.location.replace('/admin/login');
    }
    throw new ApiError({
      status: 401,
      message: 'Your session has expired. Please sign in again.',
    });
  }

  if (response.status === 204) return null;

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new ApiError({
      status: response.status,
      message: payload?.message || `Request failed (${response.status})`,
      errors: payload?.errors || null,
    });
  }

  return payload;
}

/**
 * Fetch a file (e.g. CSV export) with the admin Bearer token and trigger a
 * client-side download. Can't use a plain <a download> because that won't
 * carry the Authorization header.
 */
export async function adminDownload(path, filename) {
  const token = getAdminToken();
  const url = `${getApiUrl()}${path}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (response.status === 401) {
    clearAdminToken();
    if (typeof window !== 'undefined') window.location.replace('/admin/login');
    throw new ApiError({ status: 401, message: 'Session expired.' });
  }
  if (!response.ok) {
    throw new ApiError({
      status: response.status,
      message: `Download failed (${response.status})`,
    });
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = filename || 'export.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objectUrl);
}
