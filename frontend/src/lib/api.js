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

/**
 * Emails the draft's resume link to its contact_email so the user can finish
 * on another device / later. Does not affect the abandoned-cart flag.
 */
export function emailDraftLink(id, token) {
  const qs = new URLSearchParams({ token }).toString();
  return request(`/api/v1/advertisers/${encodeURIComponent(id)}/email-link?${qs}`, {
    method: 'POST',
  });
}

/**
 * Kicks off Stripe Checkout. Returns `{ url }` — the caller should
 * `window.location.href = url` to send the user into the Stripe-hosted page.
 * Backend creates the session, stores the session id on the advertiser, and
 * waits for the `checkout.session.completed` webhook to mark the record paid.
 */
export function createStripeCheckout(advertiserId, accessToken) {
  return request('/api/v1/checkout/stripe', {
    method: 'POST',
    body: {
      advertiser_id: advertiserId,
      access_token: accessToken,
    },
  });
}

/**
 * Creates a PayPal Order. Returns `{ order_id, approval_url }`. Send the
 * user to `approval_url` to approve the payment on PayPal's domain. PayPal
 * then redirects back to /payment/paypal-success which calls
 * `capturePaypalOrder` to actually complete the charge.
 */
export function createPaypalCheckout(advertiserId, accessToken) {
  return request('/api/v1/checkout/paypal', {
    method: 'POST',
    body: {
      advertiser_id: advertiserId,
      access_token: accessToken,
    },
  });
}

/**
 * Captures a previously-approved PayPal Order. Returns
 * `{ status, advertiser_id, redirect_to }` on success — `status` is `'paid'`
 * when the capture completes, otherwise the request status code surfaces
 * the failure (4xx for client/configuration issues, 502 if PayPal itself
 * errored and the webhook is now the safety net).
 */
export function capturePaypalOrder(advertiserId, accessToken, orderId) {
  return request('/api/v1/checkout/paypal/capture', {
    method: 'POST',
    body: {
      advertiser_id: advertiserId,
      access_token: accessToken,
      order_id: orderId,
    },
  });
}
