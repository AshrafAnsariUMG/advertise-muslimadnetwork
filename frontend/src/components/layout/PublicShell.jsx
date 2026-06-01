'use client';

import PublicHeader from './PublicHeader';
import PublicFooter from './PublicFooter';

/**
 * Wraps public-facing pages (wizard + payment flow) with the site header and
 * footer. NOT used on /admin/* — those have their own shell in
 * app/admin/layout.js.
 *
 * `bare` strips the footer for short transactional pages (payment redirects)
 * where a full footer would be noise.
 */
export default function PublicShell({ children, bare = false }) {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      <div className="flex-1">{children}</div>
      {!bare && <PublicFooter />}
    </div>
  );
}
