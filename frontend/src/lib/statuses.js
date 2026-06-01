/**
 * Single source of truth for advertiser status / payment presentation.
 *
 * Before this lib, /admin/page.js, /admin/review/page.js and
 * /admin/abandoned/page.js each carried their own copies of these maps and
 * they had already drifted (different labels for the same status). Import
 * from here instead.
 */

// Full status set the backend AdvertiserStatus enum can emit.
export const STATUS_LABEL = {
  incomplete_step_1: 'Step 1',
  incomplete_step_2: 'Step 2',
  incomplete_step_3: 'Step 3',
  pending_review: 'Pending review',
  approved: 'Approved',
  rejected: 'Rejected',
  active: 'Active',
  paused: 'Paused',
};

// Tailwind classes for the colored status pill. Keep the abandoned-cart
// "step N" tiers visually distinct (slate → blue → amber) so the
// highest-intent abandon (step 3, reached review) stands out.
export const STATUS_BADGE = {
  incomplete_step_1: 'bg-slate-100 text-slate-600 border-slate-200',
  incomplete_step_2: 'bg-blue-100 text-blue-800 border-blue-200',
  incomplete_step_3: 'bg-amber-100 text-amber-800 border-amber-200',
  pending_review: 'bg-amber-100 text-amber-800 border-amber-200',
  approved: 'bg-blue-100 text-blue-800 border-blue-200',
  active: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  paused: 'bg-slate-200 text-slate-700 border-slate-300',
  rejected: 'bg-rose-100 text-rose-800 border-rose-200',
};

export const PAYMENT_LABELS = {
  stripe: 'Stripe',
  paypal: 'PayPal',
};

/**
 * Valid lifecycle transitions per current status. Drives which action items
 * appear in the admin row menus and detail-sheet footers. Mirrors the
 * server-side state machine enforced in
 * Api\Admin\AdvertiserController::transition().
 */
export const ALLOWED_ACTIONS = {
  pending_review: ['approve', 'reject'],
  approved: ['activate'],
  active: ['pause'],
  paused: ['resume'],
  rejected: [],
  incomplete_step_1: [],
  incomplete_step_2: [],
  incomplete_step_3: [],
};

export const ACTION_LABEL = {
  approve: 'Approve',
  reject: 'Reject',
  activate: 'Activate',
  pause: 'Pause',
  resume: 'Resume',
};

export function statusLabel(status) {
  return STATUS_LABEL[status] || status || 'unknown';
}

export function statusBadgeClass(status) {
  return STATUS_BADGE[status] || 'bg-slate-100 text-slate-700 border-slate-200';
}

export function paymentLabel(method) {
  return PAYMENT_LABELS[method] || method || '—';
}
