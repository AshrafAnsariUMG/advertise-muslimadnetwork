'use client';

import WizardApp from '@/components/ssco-test/WizardApp';

// SSCO test sandbox — renders the ISOLATED clone of the wizard
// (components/ssco-test/*): MasjidConnect visible, drafts flagged is_test
// (hidden from live admin/CRM), and dry-run checkout (no real charge).
// Not linked publicly + noindex (see app/robots.js).
export default function SscoTestPage() {
  return <WizardApp />;
}
