'use client';

import WizardApp from '@/components/signup/WizardApp';

// SSCO test sandbox — the full wizard with testMode on, so in-development
// features (currently the MasjidConnect add-on) are visible here before being
// promoted to the live wizard at `/`. Not linked publicly + noindex (robots).
export default function SscoTestPage() {
  return <WizardApp testMode />;
}
