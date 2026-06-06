'use client';

import Link from 'next/link';
import { Calendar } from 'lucide-react';

/**
 * Public-site header for the wizard, payment, and marketing pages.
 *
 * Links flagged `internal` are pages ported into this app (Next routes);
 * the rest point out to the main marketing site (muslimadnetwork.com).
 */
const SCHEDULER_URL =
  'https://muslimadnetwork.pipedrive.com/scheduler/9KmA9sa/muslim-ad-network-advertising-partnership-next-steps';

const NAV_LINKS = [
  { label: 'Home', href: 'https://muslimadnetwork.com/' },
  { label: 'Why MuslimReach™', href: '/whymuslimreach', internal: true },
  { label: 'For Charities', href: '/charitysignup', internal: true },
];

export default function PublicHeader() {
  return (
    <header className="bg-white/90 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <a
          href="https://www.muslimadnetwork.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/man-logo.png"
            alt="Muslim Ad Network"
            className="h-10 w-auto"
          />
        </a>

        {/* Nav */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {NAV_LINKS.map((link) =>
            link.internal ? (
              <Link
                key={link.label}
                href={link.href}
                className="hidden md:inline-block px-3 py-2 text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors"
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:inline-block px-3 py-2 text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors"
              >
                {link.label}
              </a>
            )
          )}
          <a
            href={SCHEDULER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 shadow-sm transition-all"
          >
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Book a Campaign Strategy Call</span>
            <span className="sm:hidden">Book a Call</span>
          </a>
        </nav>
      </div>
    </header>
  );
}
