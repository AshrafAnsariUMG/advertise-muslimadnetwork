'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import PublicShell from '@/components/layout/PublicShell';

export default function About() {
  useEffect(() => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "AboutPage",
      "name": "About Muslim Ad Network",
      "description": "Muslim Ad Network is the leading digital advertising platform reaching 200M+ Muslim consumers globally through premium display, MasjidConnect™ in-mosque screens, email, and CTV advertising.",
      "url": "https://ads.muslimadnetwork.com/About",
      "mainEntity": {
        "@type": "Organization",
        "name": "Muslim Ad Network",
        "alternateName": "MAN",
        "url": "https://www.muslimadnetwork.com",
        "foundingDate": "2020",
        "description": "The leading Muslim advertising platform connecting brands with 200M+ Muslim consumers globally.",
        "areaServed": ["US", "GB", "CA", "AU", "AE", "MY", "PK", "BD", "SA"],
        "serviceType": ["Muslim advertising", "Halal marketing", "CTV advertising", "In-mosque advertising", "Islamic audience targeting"],
        "contactPoint": {
          "@type": "ContactPoint",
          "email": "sales@muslimadnetwork.com",
          "contactType": "sales"
        }
      }
    };
    const s = document.createElement('script');
    s.type = 'application/ld+json';
    s.setAttribute('data-page', 'about');
    s.text = JSON.stringify(schema);
    document.head.appendChild(s);
    return () => document.querySelector('script[data-page="about"]')?.remove();
  }, []);

  return (
    <PublicShell>
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-black text-gray-900 mb-6">About Muslim Ad Network</h1>

        <p className="text-lg text-gray-700 leading-relaxed mb-6">
          Muslim Ad Network (MAN) is the leading digital advertising platform built exclusively to help brands,
          businesses, and nonprofits reach the global Muslim consumer market. We connect advertisers with over
          200 million Muslims across premium websites, mobile apps, in-mosque digital screens, email newsletters,
          and Connected TV (CTV) platforms — all through one unified, easy-to-use platform.
        </p>

        <p className="text-lg text-gray-700 leading-relaxed mb-6">
          Our proprietary <strong>MuslimReach™ targeting technology</strong> enables advertisers to reach Muslim audiences with precision —
          across top-tier publishers like Al Jazeera, IslamicFinder, AboutIslam, and hundreds more. Whether
          you are a halal food brand, an Islamic finance provider, a charity fundraising during Ramadan, or a
          travel company offering Hajj and Umrah packages, Muslim Ad Network gives you unmatched access to
          the world's 1.8 billion Muslim consumers.
        </p>

        <p className="text-lg text-gray-700 leading-relaxed mb-6">
          Our flagship channel, <strong>MasjidConnect™</strong>, places your brand on digital screens inside 50+ handpicked
          masjids across the United States — including the Islamic Society of Orange County (ISOC), one of
          the largest mosques in America. These placements reach a captive, high-intent audience during
          Jumu'ah, daily prayers, and community programs, delivering a level of trust and cultural relevance
          that no other media channel can offer.
        </p>

        <p className="text-lg text-gray-700 leading-relaxed mb-6">
          Muslim Ad Network also offers <strong>Connected TV (CTV) advertising</strong> on platforms like Hulu, YouTube TV, and
          Peacock, enabling full-funnel campaigns that go from awareness to conversion. Our self-service
          platform makes it easy for businesses of any size to launch campaigns starting from $250/month,
          while our managed services team is available to help larger advertisers achieve maximum ROI.
        </p>

        <p className="text-lg text-gray-700 leading-relaxed mb-6">
          We are built by a passionate team of Muslim entrepreneurs and marketing professionals who understand
          the nuances of reaching Muslim communities authentically and effectively. Our mission is simple:
          to be the bridge between halal brands and Muslim consumers worldwide.
        </p>

        <div className="mt-12 border-t border-gray-200 pt-8">
          <h2 className="text-2xl font-black text-gray-900 mb-6">Our Advertising Channels</h2>
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {[
              { title: "Premium Display Network", desc: "200M+ Muslim users globally across 5,000+ premium publishers including Al Jazeera, IslamicFinder, AboutIslam, and more.", link: "/muslimadvertising" },
              { title: "MasjidConnect™ In-Mosque Screens", desc: "In-mosque digital screens at 50+ US masjids, reaching Muslim audiences during Jumu'ah, daily prayers, and community programs.", link: "/whymuslimreach" },
              { title: "Email Newsletter Advertising", desc: "High open-rate sponsored placements in curated Islamic newsletters delivered to engaged Muslim subscribers worldwide.", link: "/muslimadvertising" },
              { title: "Connected TV (CTV) Advertising", desc: "Streaming video ads on Hulu, YouTube TV, Peacock & 20+ platforms targeting Muslim households with 95%+ completion rates.", link: "/ctvadvertising" },
            ].map((ch, i) => (
              <div key={i} className="bg-gray-50 border border-gray-200 rounded-xl p-5 hover:border-indigo-300 transition-colors">
                <h3 className="font-bold text-gray-900 mb-2">{ch.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-3">{ch.desc}</p>
                <Link href={ch.link} className="text-indigo-600 text-sm font-semibold hover:underline">Learn more →</Link>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-black text-gray-900 mb-3">Who We Serve</h2>
          <div className="flex flex-wrap gap-2">
            {["Halal Food & Restaurants", "Islamic Finance", "Modest Fashion", "Hajj & Umrah Travel", "Islamic Education", "Charities & Nonprofits", "Healthcare", "Mainstream Brands"].map(tag => (
              <span key={tag} className="bg-white border border-indigo-200 text-indigo-700 text-sm font-medium px-3 py-1 rounded-full">{tag}</span>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/"
            className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-4 rounded-xl text-lg transition-colors text-center"
          >
            Start Your Campaign →
          </a>
          <a
            href="https://muslimadnetwork.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 font-bold px-8 py-4 rounded-xl text-lg transition-colors text-center"
          >
            Visit muslimadnetwork.com
          </a>
        </div>
      </div>
    </div>
    </PublicShell>
  );
}
