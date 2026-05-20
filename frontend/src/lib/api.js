/**
 * API client for the advertise.muslimadnetwork.com Laravel backend.
 *
 * The public wizard talks to /api/v1/advertisers and /api/v1/uploads without
 * Sanctum — authorisation is via the per-record access_token returned at
 * create-time. See backend CLAUDE.md "Access-token security model" for the
 * full contract.
 */

export class ApiError extends Error {
  constructor({ status, message, errors }) {
    super(message || `Request failed (${status})`);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors || null;
  }
}

export function getApiUrl() {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) {
    throw new Error('NEXT_PUBLIC_API_URL is not configured.');
  }
  return url.replace(/\/$/, '');
}

async function request(path, { method = 'GET', body, signal } = {}) {
  const url = `${getApiUrl()}${path}`;
  const init = {
    method,
    headers: {
      Accept: 'application/json',
    },
    signal,
  };

  if (body !== undefined) {
    init.headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
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

  // 204 / empty body
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

export function createAdvertiser(data) {
  return request('/api/v1/advertisers', { method: 'POST', body: data });
}

export function updateAdvertiser(id, token, data) {
  const qs = new URLSearchParams({ token }).toString();
  return request(`/api/v1/advertisers/${encodeURIComponent(id)}?${qs}`, {
    method: 'PATCH',
    body: data,
  });
}

export function getAdvertiser(id, token) {
  const qs = new URLSearchParams({ token }).toString();
  return request(`/api/v1/advertisers/${encodeURIComponent(id)}?${qs}`, {
    method: 'GET',
  });
}
