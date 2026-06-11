'use client';

import WizardApp from '@/components/signup/WizardApp';

// Production wizard (components/signup/*). The /ssco-test sandbox uses a
// separate, fully isolated clone (components/ssco-test/*) so changes there —
// including pricing — never affect this live wizard.
export default function AdvertiserSignupPage() {
  return <WizardApp />;
}
