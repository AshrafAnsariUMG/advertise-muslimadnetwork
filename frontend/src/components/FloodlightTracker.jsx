'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Fires the DoubleClick Floodlight audience/conversion activity
 * (DC-16361189 · manau0/manss0) on every page view — including client-side
 * route changes, which a one-time inline snippet would miss in a SPA.
 *
 * This is the retargeting-audience tag, so it fires broadly on public pages.
 * Admin pages are excluded so internal staff don't pollute the audience.
 *
 * The gtag loader + `gtag('config', 'DC-16361189')` live in the root layout;
 * this only fires the activity event once gtag is available.
 */
export default function FloodlightTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname && pathname.startsWith('/admin')) return;
    if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;

    window.gtag('event', 'conversion', {
      allow_custom_scripts: true,
      send_to: 'DC-16361189/manau0/manss0+standard',
    });
  }, [pathname]);

  return null;
}
