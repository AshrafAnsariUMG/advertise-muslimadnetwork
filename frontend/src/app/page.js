'use client';

import WizardApp from '@/components/signup/WizardApp';

// Production wizard. The shared <WizardApp> also powers /ssco-test (with
// testMode), where in-development features (e.g. MasjidConnect) are previewed
// before being promoted here.
export default function AdvertiserSignupPage() {
  return <WizardApp />;
}
