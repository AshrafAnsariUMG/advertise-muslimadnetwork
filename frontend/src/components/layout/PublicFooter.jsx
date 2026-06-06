'use client';

import Link from 'next/link';
import { Mail, Phone, MapPin } from 'lucide-react';

/**
 * Public-site footer. Links flagged `internal` are pages ported into this
 * app; the rest point out to the main marketing site (muslimadnetwork.com).
 * Batch 2/3 marketing pages get switched to internal as they're approved.
 */
const FOOTER_LINKS = [
  { label: 'Muslim Ad Network', href: 'https://www.muslimadnetwork.com' },
  { label: 'About', href: '/about', internal: true },
  { label: 'Contact', href: '/contact', internal: true },
  { label: 'Why MuslimReach™', href: '/whymuslimreach', internal: true },
  { label: 'CTV Advertising', href: 'https://muslimadnetwork.com/ctv-advertising' },
  { label: 'Halal Advertising', href: 'https://muslimadnetwork.com/halal-advertising' },
  { label: 'Islamic Advertising', href: 'https://muslimadnetwork.com/islamic-advertising' },
  { label: 'Charity Advertising', href: 'https://muslimadnetwork.com/advertise-your-charity' },
];

export default function PublicFooter() {
  return (
    <footer className="mt-16 border-t border-gray-200 bg-white/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Section links */}
        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-8">
          {FOOTER_LINKS.map((link) =>
            link.internal ? (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm text-gray-600 hover:text-indigo-600 transition-colors"
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-600 hover:text-indigo-600 transition-colors"
              >
                {link.label}
              </a>
            )
          )}
        </nav>

        {/* Contact */}
        <div className="flex flex-col items-center gap-3 text-sm text-gray-600">
          <p className="font-semibold text-gray-700">
            Powered by Ummah Media Group LLC
          </p>
          <div className="flex flex-wrap justify-center items-center gap-4">
            <a
              href="mailto:Sales@muslimadnetwork.com"
              className="inline-flex items-center gap-1.5 hover:text-indigo-600 transition-colors"
            >
              <Mail className="w-4 h-4" />
              Sales@muslimadnetwork.com
            </a>
            <span className="text-gray-300">|</span>
            <a
              href="tel:+18868870844"
              className="inline-flex items-center gap-1.5 hover:text-indigo-600 transition-colors"
            >
              <Phone className="w-4 h-4" />
              (886)-887-0844
            </a>
          </div>
          <p className="inline-flex items-center gap-1.5 text-xs text-gray-500">
            <MapPin className="w-3.5 h-3.5" />
            515 Madison Ave., Suite 9111, Manhattan, NY 10022
          </p>
          <p className="text-xs text-gray-400 mt-2">
            &copy; {new Date().getFullYear()} Muslim Ad Network. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
