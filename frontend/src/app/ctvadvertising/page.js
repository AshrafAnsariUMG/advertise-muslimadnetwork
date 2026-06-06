'use client';

import React, { useEffect } from 'react';
import { Tv, Target, TrendingUp, Shield, Users, CheckCircle, Play, Star, ArrowRight, Zap } from 'lucide-react';
import Link from 'next/link';
import PublicShell from '@/components/layout/PublicShell';

const platforms = [
  {
    name: "Hulu",
    logo: "/marketing/6ad8a2d4f_hululogo.svg",
    color: "from-green-400 to-green-600",
    bg: "bg-green-50",
    border: "border-green-200",
    desc: "Premium streaming with unskippable ad formats",
    stat: "53M+",
    statLabel: "Subscribers"
  },
  {
    name: "YouTube TV",
    logo: "/marketing/151b22aa5_YouTube-TV-Logo.png",
    color: "from-red-500 to-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
    desc: "Live TV + on-demand with massive Muslim viewership",
    stat: "8M+",
    statLabel: "Subscribers"
  },
  {
    name: "Peacock",
    logo: "/marketing/294aa117a_peacocklogoofficial.jpg",
    color: "from-purple-500 to-indigo-600",
    bg: "bg-purple-50",
    border: "border-purple-200",
    desc: "NBC Universal's streaming platform with premium inventory",
    stat: "36M+",
    statLabel: "Active Users"
  }
];

const whyCtv = [
  {
    icon: <Target className="w-6 h-6 text-indigo-500" />,
    title: "Precision Muslim Targeting",
    desc: "Reach verified Muslim audiences across all major streaming platforms using contextual, behavioral, and demographic signals — not just guesswork."
  },
  {
    icon: <Tv className="w-6 h-6 text-indigo-500" />,
    title: "Big Screen, High Attention",
    desc: "CTV ads are shown on the living room TV — the most premium, high-attention environment available. Average completion rates exceed 95%."
  },
  {
    icon: <Shield className="w-6 h-6 text-indigo-500" />,
    title: "Brand-Safe Environments",
    desc: "Your ads appear alongside premium, professionally produced content on the world's most trusted streaming platforms."
  },
  {
    icon: <TrendingUp className="w-6 h-6 text-indigo-500" />,
    title: "Full-Funnel Impact",
    desc: "Drive brand awareness at scale while retargeting high-intent viewers across digital channels to close the loop on conversions."
  }
];

const stats = [
  { val: "200M+", label: "Muslim Households Reachable" },
  { val: "95%+", label: "Video Completion Rate" },
  { val: "3x", label: "Higher Recall vs Linear TV" },
  { val: "0%", label: "Ad Skipping on CTV" }
];

const adFormats = [
  {
    name: "Pre-Roll",
    duration: "15–30 sec",
    desc: "Unskippable ads that play before content begins. Maximum reach and brand recall.",
    icon: <Play className="w-5 h-5" />
  },
  {
    name: "Mid-Roll",
    duration: "15–30 sec",
    desc: "Ads delivered mid-content to a captive, engaged audience already deep into their viewing session.",
    icon: <Zap className="w-5 h-5" />
  },
  {
    name: "Pause Ads",
    duration: "Static",
    desc: "Non-intrusive ads that appear when viewers pause their content — high visibility, zero interruption.",
    icon: <Star className="w-5 h-5" />
  }
];

export default function CTVAdvertising() {
  useEffect(() => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "Muslim CTV Advertising | Reach Muslim Audiences on Hulu, YouTube TV & Peacock",
      "description": "Run unskippable video ads to Muslim households on Hulu, YouTube TV, Peacock, and 20+ streaming platforms. Target 200M+ Muslim consumers with precision CTV advertising.",
      "url": "https://ads.muslimadnetwork.com/CTVAdvertising",
      "breadcrumb": {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://ads.muslimadnetwork.com/" },
          { "@type": "ListItem", "position": 2, "name": "CTV Advertising", "item": "https://ads.muslimadnetwork.com/CTVAdvertising" }
        ]
      },
      "mainEntity": {
        "@type": "Service",
        "name": "Muslim CTV Advertising",
        "provider": { "@type": "Organization", "name": "Muslim Ad Network" },
        "description": "Connected TV advertising targeting Muslim households on Hulu, YouTube TV, Peacock, and 20+ streaming platforms with 95%+ completion rates.",
        "areaServed": ["US", "GB", "CA", "AU", "AE"],
        "audience": { "@type": "Audience", "audienceType": "Muslim consumers, halal brands, Islamic businesses" }
      }
    };
    const existing = document.querySelector('script[data-page="ctv"]');
    if (!existing) {
      const s = document.createElement('script');
      s.type = 'application/ld+json';
      s.setAttribute('data-page', 'ctv');
      s.text = JSON.stringify(schema);
      document.head.appendChild(s);
    }
    return () => { document.querySelector('script[data-page="ctv"]')?.remove(); };
  }, []);

  return (
    <PublicShell>
    <div className="min-h-screen bg-gray-50">

      {/* Hero */}
      <div className="bg-[#0f1b2d] text-white py-20 px-6 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-5xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-6">
            <Tv className="w-4 h-4" /> Connected TV Advertising
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-4 leading-tight">
            Reach Muslim Audiences<br />
            <span className="text-indigo-400">on the Big Screen</span>
          </h1>
          <p className="text-gray-300 text-xl max-w-2xl mb-8 leading-relaxed">
            Premium Connected TV advertising across Hulu, YouTube TV, Peacock, and more — precisely targeted to Muslim audiences at scale.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => window.open('https://muslimadnetwork.pipedrive.com/scheduler/9KmA9sa/muslim-ad-network-advertising-partnership-next-steps', '_blank')}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold px-8 py-4 rounded-xl text-lg shadow-lg transition-all"
            >
              Book a CTV Strategy Call <ArrowRight className="w-5 h-5" />
            </button>
            <Link
              href="/"
              className="inline-flex items-center gap-2 border-2 border-white/30 hover:border-white/60 text-white font-bold px-8 py-4 rounded-xl text-lg transition-all"
            >
              Start a Campaign
            </Link>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="bg-indigo-600 text-white py-8 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map(s => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-black">{s.val}</p>
              <p className="text-indigo-200 text-sm font-semibold mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Platforms */}
      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">
            Premium Streaming Platforms
          </h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            Your ads run inside the world's most-watched streaming services, targeted to Muslim viewers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {platforms.map((p) => (
            <div key={p.name} className={`rounded-2xl border-2 ${p.border} bg-white p-8 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-all`}>
              <div className={`w-full h-16 flex items-center justify-center mb-6`}>
                <img
                  src={p.logo}
                  alt={p.name}
                  className="h-10 w-auto object-contain"
                  onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='block'; }}
                />
                <span style={{display:'none'}} className="text-2xl font-black text-gray-800">{p.name}</span>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed mb-6">{p.desc}</p>
              <div className={`w-full rounded-xl ${p.bg} border ${p.border} py-4`}>
                <p className="text-2xl font-black text-gray-900">{p.stat}</p>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">{p.statLabel}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-gray-400 text-sm mt-6">+ Tubi, Pluto TV, Sling, DirecTV Stream, and more</p>
      </div>

      {/* Why CTV */}
      <div className="bg-white py-16 px-6 border-t border-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">Why CTV for Muslim Audiences?</h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              Muslim consumers are cord-cutters. They've moved to streaming — and we know how to find them there.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {whyCtv.map((w) => (
              <div key={w.title} className="flex gap-4 bg-gray-50 border border-gray-200 rounded-xl p-6">
                <div className="flex-shrink-0 w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
                  {w.icon}
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-lg">{w.title}</p>
                  <p className="text-gray-500 text-sm mt-1 leading-relaxed">{w.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ad Formats */}
      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-gray-900 mb-3">Ad Formats</h2>
          <p className="text-gray-500 text-lg">Choose the format that fits your campaign goals.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {adFormats.map((f) => (
            <div key={f.name} className="rounded-2xl border-2 border-indigo-100 bg-white p-6 text-center hover:border-indigo-400 transition-all shadow-sm">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 mx-auto mb-4">
                {f.icon}
              </div>
              <p className="font-black text-gray-900 text-lg">{f.name}</p>
              <span className="inline-block bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full mt-2 mb-3">{f.duration}</span>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-[#0f1b2d] py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-black text-white mb-2 text-center">How MuslimReach™ CTV Works</h2>
          <p className="text-gray-400 text-center mb-12">From campaign setup to living room screen in days.</p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: "01", title: "Define Your Audience", desc: "Target Muslim households by geography, demographics, interests, and device type." },
              { step: "02", title: "Upload Your Creative", desc: "Provide your 15 or 30-second video ad. Need help? Our team can produce it." },
              { step: "03", title: "Go Live", desc: "Your ad runs across Hulu, YouTube TV, Peacock, and 20+ other streaming platforms." },
              { step: "04", title: "Measure & Optimize", desc: "Track impressions, completion rates, and site visits with real-time reporting." }
            ].map((s) => (
              <div key={s.step} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <p className="text-4xl font-black text-indigo-400 mb-3">{s.step}</p>
                <p className="font-bold text-white mb-2">{s.title}</p>
                <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-5xl mx-auto px-6 py-16 text-center">
        <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">Ready to Reach Muslim Audiences on CTV?</h2>
        <p className="text-gray-500 text-lg mb-8 max-w-xl mx-auto">
          Book a strategy call to learn how CTV fits into your Muslim market campaign.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => window.open('https://muslimadnetwork.pipedrive.com/scheduler/9KmA9sa/muslim-ad-network-advertising-partnership-next-steps', '_blank')}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold px-8 py-4 rounded-xl text-lg shadow-lg transition-all"
          >
            Book a Strategy Call <ArrowRight className="w-5 h-5" />
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 font-bold px-8 py-4 rounded-xl text-lg transition-all"
          >
            Start a Campaign
          </Link>
        </div>
        <p className="text-gray-400 text-sm mt-6">Muslim Ad Network · muslimadnetwork.com</p>
      </div>

    </div>
    </PublicShell>
  );
}
