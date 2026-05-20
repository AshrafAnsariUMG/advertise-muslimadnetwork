/**
 * Per-browser draft handle for the advertiser wizard.
 *
 * The backend never authenticates the wizard user — instead each draft has a
 * one-time access_token, exposed in the response to POST /api/v1/advertisers.
 * The frontend persists {id, access_token} in localStorage so the user can
 * refresh / come back later and continue editing.
 *
 * Keys are stable across sessions and intentionally namespaced under
 * `advertise_draft_*` so they don't collide with anything else on the origin.
 */

const ID_KEY = 'advertise_draft_id';
const TOKEN_KEY = 'advertise_draft_token';

function safeWindow() {
  if (typeof window === 'undefined') return null;
  return window;
}

export function saveDraft({ id, token }) {
  const w = safeWindow();
  if (!w || !id || !token) return;
  try {
    w.localStorage.setItem(ID_KEY, id);
    w.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Storage quota / private mode — non-fatal; the wizard still works in
    // this session, it just won't resume after a refresh.
  }
}

export function loadDraft() {
  const w = safeWindow();
  if (!w) return null;
  try {
    const id = w.localStorage.getItem(ID_KEY);
    const token = w.localStorage.getItem(TOKEN_KEY);
    if (!id || !token) return null;
    return { id, token };
  } catch {
    return null;
  }
}

export function clearDraft() {
  const w = safeWindow();
  if (!w) return;
  try {
    w.localStorage.removeItem(ID_KEY);
    w.localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}
