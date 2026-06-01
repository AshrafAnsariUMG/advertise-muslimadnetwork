'use client';

import { Sparkles } from 'lucide-react';

/**
 * "Trusted by leading brands worldwide" — colorful auto-scrolling strip.
 *
 * Logos render in full color inside white cards, sitting on a soft lavender
 * background strip. The list is rendered twice in the DOM; the CSS animation
 * in globals.css translates by -50% for a seamless loop. Pauses on hover.
 */
const BRANDS = [
  { src: '/brands/wfp.jpg',              alt: 'World Food Programme' },
  { src: '/brands/amana-mutual.jpg',     alt: 'Amana Mutual' },
  { src: '/brands/air-canada.jpg',       alt: 'Air Canada' },
  { src: '/brands/chicken.png',          alt: 'Crescent Foods' },
  { src: '/brands/life-usa.jpg',         alt: 'Life USA' },
  { src: '/brands/knorr.jpg',            alt: 'Knorr' },
  { src: '/brands/turkish-airlines.jpg', alt: 'Turkish Airlines' },
  { src: '/brands/uif.png',              alt: 'University Islamic Financial' },
];

export default function BrandLogos() {
  return (
    <div className="py-3">
      <div className="rounded-2xl bg-gradient-to-r from-indigo-50 via-purple-50/70 to-indigo-50 border border-indigo-100 px-2 py-6 shadow-sm">
        <p className="flex items-center justify-center gap-2 text-center text-xs font-semibold uppercase tracking-widest text-indigo-700 mb-5">
          <Sparkles className="w-3.5 h-3.5" />
          Trusted by Leading Brands Worldwide
          <Sparkles className="w-3.5 h-3.5" />
        </p>

        {/* Fade-out edges so logos slide in/out cleanly. */}
        <div
          className="relative overflow-hidden"
          style={{
            maskImage:
              'linear-gradient(to right, transparent 0, black 6%, black 94%, transparent 100%)',
            WebkitMaskImage:
              'linear-gradient(to right, transparent 0, black 6%, black 94%, transparent 100%)',
          }}
        >
          <div className="flex w-max animate-marquee">
            {[...BRANDS, ...BRANDS].map((brand, i) => (
              <div
                key={i}
                className="flex-shrink-0 mx-3 md:mx-4 flex items-center justify-center bg-white rounded-xl shadow-sm hover:shadow-md border border-gray-100 px-6 py-3 w-36 h-20 transition-shadow"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={brand.src}
                  alt={brand.alt}
                  className="max-h-12 w-auto object-contain"
                  draggable={false}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
