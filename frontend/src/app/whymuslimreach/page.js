'use client';

import React, { useState, useEffect } from 'react';
import { Mail, Smartphone, TrendingUp, Shield, Users, CheckCircle, Tv } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import PublicShell from '@/components/layout/PublicShell';

const masjids = [
  {
    name: "Islamic Society of Orange County (ISOC)",
    location: "Orange County, CA",
    badge: "Featured Placement",
    detail: "High-affluence community · One of the largest mosques in America",
    attendees: "7,000+",
    attendeesLabel: "Weekly Attendees",
    img: "https://media.base44.com/images/public/68dc7a391cd3daa2a3e2a6e3/e1152cfe7_ISOCMasjid.png",
    link: "https://isocmasjid.org/"
  },
  {
    name: "Jersey Masjid Islamic Center (JMIC)",
    location: "Boonton, NJ",
    detail: "Serving the Greater New Jersey Muslim community",
    img: "https://media.base44.com/images/public/68dc7a391cd3daa2a3e2a6e3/1ec74c14c_JMICMasjid.png",
    link: "https://jmic.org/"
  },
  {
    name: "Islamic Center of Irvine (ICOI)",
    location: "Irvine, CA",
    detail: "Serving the Irvine & greater Orange County Muslim community",
    img: "https://media.base44.com/images/public/68dc7a391cd3daa2a3e2a6e3/b557c9dfc_ICOIMasjid2.png",
    link: "https://www.icoirvine.org/"
  }
];

const channels = [
  {
    icon: <img src="https://media.base44.com/images/public/68dc7a391cd3daa2a3e2a6e3/0ce2c91e8_device.png" alt="Digital Network" className="w-12 h-12 object-contain" />,
    color: "from-blue-500 to-indigo-600",
    bg: "bg-white",
    border: "border-gray-200",
    noIconBg: true,
    label: "DIGITAL NETWORK",
    title: "Reach 200+ Million Muslims Globally",
    desc: "Reach Muslim audiences through a premium display ad network featuring Ummahjobs, IslamicFinder, Al Jazeera, AboutIslam, CNN, and hundreds more across high-traffic Muslim platforms.",
    stat: "200 Million",
    statLabel: "Globally"
  },
  {
    icon: <img src="https://media.base44.com/images/public/68dc7a391cd3daa2a3e2a6e3/50bd0b452_Mosque.jpeg" alt="Mosque" className="w-12 h-12 object-contain" />,
    color: "from-indigo-500 to-indigo-600",
    bg: "bg-white",
    border: "border-gray-200",
    noIconBg: true,
    label: "MASJID SCREENS",
    title: "MasjidConnect™",
    desc: "Your brand on screen during Jumu'ah, daily prayers, and community programs reaching a captive, high intent audience in a trusted, distraction free environment.",
    stat: "50+",
    statLabel: "Masjids Nationwide"
  },
  {
    icon: <Mail className="w-7 h-7" />,
    color: "from-emerald-500 to-green-600",
    bg: "bg-white",
    border: "border-gray-200",
    label: "EMAIL",
    title: "Email Newsletter",
    desc: "Reach engaged Muslim subscribers directly in their inbox through trusted voices in Islamic finance, community news, and lifestyle.",
    stat: "High",
    statLabel: "Open Rates"
  },
  {
    icon: <Tv className="w-7 h-7" />,
    color: "from-purple-500 to-pink-600",
    bg: "bg-white",
    border: "border-gray-200",
    label: "CTV",
    title: "Connected TV",
    desc: "Reach exclusive Muslim audiences across premium platforms like YouTube, Hulu, and more!",
    stat: "Premium",
    statLabel: "Streaming Platforms"
  }
];

const whyItWorks = [
  { icon: <TrendingUp className="w-5 h-5 text-indigo-500" />, title: "Full-funnel coverage", desc: "From premium sites and apps Muslims visit daily to masjid placements, we cover every touchpoint, online and offline." },
  { icon: <CheckCircle className="w-5 h-5 text-indigo-500" />, title: "CTR above industry average", desc: "Contextual relevance drives stronger engagement than general market buys." },
  { icon: <Shield className="w-5 h-5 text-indigo-500" />, title: "Trust amplification", desc: "Masjid placements build credibility that carries across all channels." },
  { icon: <Users className="w-5 h-5 text-indigo-500" />, title: "Reach Millions of Muslim Consumers", desc: "Reachable through a single, unified media buy." }
];

const adPhotos = [
  { url: "https://media.base44.com/images/public/68dc7a391cd3daa2a3e2a6e3/d811ff326_CooktMC2026ISOC.jpg", label: "Cookt · ISOC" },
  { url: "https://media.base44.com/images/public/68dc7a391cd3daa2a3e2a6e3/6865af446_EhsaasFoundationMCRamadan2026atISOC.jpg", label: "Ehsaas Foundation · ISOC" },
  { url: "https://media.base44.com/images/public/68dc7a391cd3daa2a3e2a6e3/1ec1ed18d_AmanaFundsMCRamadan2026atISOC.jpg", label: "Amana Funds · ISOC" },
  { url: "https://media.base44.com/images/public/68dc7a391cd3daa2a3e2a6e3/bf36cb5e1_EhsaasFoundationMCRamadan2026atICOI.jpg", label: "Ehsaas Foundation · ICOI" },
  { url: "https://media.base44.com/images/public/68dc7a391cd3daa2a3e2a6e3/21dd27ec3_Cookt-MasjidConnectAdatJMICBoonton.jpg", label: "Cookt · JMIC Boonton" },
];

export default function WhyMuslimReach() {
  const [lightboxIdx, setLightboxIdx] = useState(null);
  const [faqOpen, setFaqOpen] = useState(false);

  useEffect(() => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "Why MuslimReach™ Targeting? | Muslim Ad Network",
      "description": "Reach 200M+ Muslim consumers across premium websites, in-mosque digital screens (MasjidConnect™), email newsletters, and Connected TV. The most powerful Muslim audience targeting platform.",
      "url": "https://ads.muslimadnetwork.com/WhyMuslimReach",
      "breadcrumb": {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://ads.muslimadnetwork.com/" },
          { "@type": "ListItem", "position": 2, "name": "Why MuslimReach™", "item": "https://ads.muslimadnetwork.com/WhyMuslimReach" }
        ]
      }
    };
    const s = document.createElement('script');
    s.type = 'application/ld+json';
    s.setAttribute('data-page', 'whymuslimreach');
    s.text = JSON.stringify(schema);
    document.head.appendChild(s);
    return () => document.querySelector('script[data-page="whymuslimreach"]')?.remove();
  }, []);
  return (
    <PublicShell>
    <>
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-[#0f1b2d] text-white py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-black mb-3">
            Why <span className="text-indigo-400">MuslimReach™</span> Targeting?
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl">
             Reach Muslim audiences across every meaningful moment, online and offline.
           </p>

           {/* Channel pills */}
             <div className="flex flex-wrap gap-3 mt-8">
             {["Premium Sites and Apps", "Masjid Screens", "Email", "Connected TV"].map(c => (
              <span key={c} className="border border-indigo-500 text-white text-xs font-semibold uppercase tracking-widest px-4 py-2 rounded-full">
                {c}
              </span>
             ))}
             </div>

             </div>
             </div>

      {/* Channels Grid */}
      <div className="max-w-5xl mx-auto px-6 py-14">
        <h2 className="text-2xl font-black text-gray-900 mb-8 text-center">Capture Muslim Attention at Scale<br />Four Channels. One Platform.</h2>
        <div className="relative">
          {/* SVG Connection Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none hidden md:block" style={{ zIndex: 0 }}>
            <defs>
              <linearGradient id="lineGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style={{ stopColor: '#6366f1', stopOpacity: 0.3 }} />
                <stop offset="100%" style={{ stopColor: '#6366f1', stopOpacity: 0 }} />
              </linearGradient>
              <linearGradient id="lineGradient2" x1="100%" y1="0%" x2="0%" y2="0%">
                <stop offset="0%" style={{ stopColor: '#6366f1', stopOpacity: 0.3 }} />
                <stop offset="100%" style={{ stopColor: '#6366f1', stopOpacity: 0 }} />
              </linearGradient>
            </defs>
            {/* Left top card to image */}
            <path d="M 290 80 Q 380 150, 450 150" stroke="url(#lineGradient1)" strokeWidth="2" fill="none" />
            {/* Left bottom card to image */}
            <path d="M 290 380 Q 380 300, 450 350" stroke="url(#lineGradient1)" strokeWidth="2" fill="none" />
            {/* Right top card to image */}
            <path d="M 710 80 Q 620 150, 550 150" stroke="url(#lineGradient2)" strokeWidth="2" fill="none" />
            {/* Right bottom card to image */}
            <path d="M 710 380 Q 620 300, 550 350" stroke="url(#lineGradient2)" strokeWidth="2" fill="none" />
          </svg>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch relative z-10">
          {/* Left column: channels 0 & 1 */}
          <div className="flex flex-col gap-6">
            {channels.slice(0, 2).map((ch) => (
              <div key={ch.title} className={`flex-1 rounded-2xl border-2 ${ch.border} ${ch.bg} p-6 flex flex-col`}>
                <div className="flex items-start gap-3 mb-3">
                  <div className={ch.noIconBg ? "flex-shrink-0 w-12 h-12 flex items-center justify-center overflow-hidden" : `p-2.5 rounded-xl bg-gradient-to-br ${ch.color} text-white shadow-lg flex-shrink-0 flex items-center justify-center`}>
                   {ch.icon}
                  </div>
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mt-1">{ch.label}</p>
                  </div>
                  <h3 className="text-lg font-black text-gray-900 mb-2">{ch.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed flex-1">{ch.desc}</p>
                  </div>
                  ))}
                  </div>

                  {/* Right column: channels 2 & 3 */}
                  <div className="flex flex-col gap-6">
                  {channels.slice(2, 4).map((ch) => (
                  <div key={ch.title} className={`flex-1 rounded-2xl border-2 ${ch.border} ${ch.bg} p-6 flex flex-col`}>
                  <div className="flex items-start gap-3 mb-3">
                  <div className={ch.noIconBg ? "flex-shrink-0 w-12 h-12 flex items-center justify-center overflow-hidden" : `p-2.5 rounded-xl bg-gradient-to-br ${ch.color} text-white shadow-lg flex-shrink-0 flex items-center justify-center`}>
                   {ch.icon}
                  </div>
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mt-1">{ch.label}</p>
                </div>
                <h3 className="text-lg font-black text-gray-900 mb-2">{ch.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed flex-1">{ch.desc}</p>
              </div>
            ))}
          </div>
          </div>
           </div>

          {/* CTA Buttons between channels and MasjidConnect */}
          <div className="flex flex-wrap gap-3 justify-center py-8">
            <button
              onClick={() => window.open('https://muslimadnetwork.pipedrive.com/scheduler/9KmA9sa/muslim-ad-network-advertising-partnership-next-steps', '_blank')}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold px-6 py-3 rounded-xl shadow-lg transition-all"
            >
              Book a Campaign Strategy Call
            </button>
            <a
              href="/"
              className="bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-700 hover:to-pink-800 text-white font-bold px-6 py-3 rounded-xl shadow-lg transition-all"
            >
              Launch Your Campaign
            </a>
          </div>
          </div>

          {/* MasjidConnect Section */}
      <div className="bg-[#0f1b2d] py-14 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6">
            <span className="inline-block bg-amber-500 text-black text-xs font-black px-4 py-2 rounded-full uppercase tracking-widest mb-4">✨ Featured Channel</span>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-2">Leverage the Power of <span className="text-indigo-400">MasjidConnect™</span><br/>In-Mosque Digital Screens</h2>
          </div>
          <p className="text-gray-300 mb-10 max-w-2xl">
            Your brand on screen during Jumu'ah, daily prayers, and community programs reaching a captive, high intent audience in a trusted, distraction free environment.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-10">
            {[
              { val: "50+", label: "Masjids Nationwide" },
              { val: "Top", label: "US Muslim Markets" },
              { val: "Affluent", label: "High-Income Communities" }
            ].map(s => (
              <div key={s.label} className="bg-white/10 border border-white/20 rounded-xl p-5 text-center">
                <p className="text-3xl font-black text-indigo-400">{s.val}</p>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Tier 1 Featured Placements */}
          <h3 className="text-xl font-bold text-white mb-6">Tier 1 Featured Placements</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {masjids.map((m) => (
              <div key={m.name} className="rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm">
                <div className="relative h-44 overflow-hidden">
                  <img src={m.img} alt={m.name} className="w-full h-full object-cover opacity-60" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  {m.badge && (
                    <span className="absolute top-3 left-3 bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                      {m.badge}
                    </span>
                  )}
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-white font-bold text-sm leading-tight">{m.name}</p>
                    <p className="text-indigo-300 text-xs font-semibold mt-0.5">{m.location}</p>
                  </div>
                  {m.attendees && (
                    <div className="absolute top-3 right-3 bg-indigo-500 text-white rounded-xl px-3 py-1 text-center">
                      <p className="text-lg font-black leading-none">{m.attendees}</p>
                      <p className="text-xs font-bold uppercase leading-tight">Weekly<br/>Attendees</p>
                    </div>
                  )}
                </div>
                <div className="p-4 flex items-center justify-between bg-white">
                  <p className="text-gray-700 text-xs">{m.detail}</p>
                  {m.link && (
                    <a href={m.link} target="_blank" rel="noopener noreferrer" className="text-indigo-400 text-xs font-semibold hover:underline ml-3 whitespace-nowrap">Visit →</a>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Brand Ads Gallery */}
          <div className="mt-14">
            <h3 className="text-2xl font-black text-white mb-2">How Leading Brands Show Up in Masjids</h3>
            <p className="text-gray-300 text-sm mb-6">Join the leading brands in the Muslim market and start capturing the attention of Muslim consumers.</p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {adPhotos.map((photo, idx) => (
                <button
                  key={idx}
                  onClick={() => setLightboxIdx(idx)}
                  className="relative rounded-xl overflow-hidden aspect-video group cursor-pointer border border-white/10 hover:border-indigo-400 transition-all"
                >
                  <img src={photo.url} alt={photo.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-all" />
                  <span className="absolute bottom-1.5 left-2 right-2 text-white text-xs font-semibold truncate drop-shadow">{photo.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MasjidConnect Impact Section */}
      <div className="max-w-5xl mx-auto px-6 py-14">
        <div className="mb-12">
          <h3 className="text-3xl font-black text-gray-900 mb-4">Maximum Exposure, Every Single Day</h3>
          <p className="text-gray-600 text-lg leading-relaxed">
            Your brand stays front and center with a consistent 30 second ad looping every <span className="font-black text-gray-900">3 minutes</span>. Capture attention during peak community moments, including Jumu'ah, daily prayers, and special programs.
          </p>
        </div>

        <div className="mb-12 border-t border-gray-200 pt-8">
          <h3 className="text-2xl font-black text-gray-900 mb-8">By The Numbers</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Daily Impact</p>
              <p className="text-2xl font-black text-gray-900">50 Minutes</p>
              <p className="text-gray-600 text-sm mt-1">of Screen Time</p>
              <div className="border-t border-gray-200 mt-4"></div>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Monthly Reach</p>
              <p className="text-2xl font-black text-gray-900">25+ Hours</p>
              <p className="text-gray-600 text-sm mt-1">Per Location</p>
              <div className="border-t border-gray-200 mt-4"></div>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Frequency</p>
              <p className="text-2xl font-black text-gray-900">Every 180</p>
              <p className="text-gray-600 text-sm mt-1">Seconds</p>
              <div className="border-t border-gray-200 mt-4"></div>
            </div>
          </div>
        </div>

        <div className="text-center pt-8">
          <Dialog open={faqOpen} onOpenChange={setFaqOpen}>
            <DialogTrigger asChild>
              <button className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold px-8 py-4 rounded-xl text-lg shadow-lg transition-all">
                View MasjidConnect FAQs
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-gray-50">
              <DialogHeader className="mb-6">
                <DialogTitle className="text-4xl font-black text-indigo-700">MasjidConnect FAQs</DialogTitle>
              </DialogHeader>
              <Accordion type="single" collapsible className="w-full space-y-3">
                <AccordionItem value="item-1" className="border-2 border-indigo-300 rounded-lg px-6 py-3 data-[state=open]:bg-indigo-50 data-[state=open]:border-indigo-500">
                  <AccordionTrigger className="text-left font-black text-lg text-indigo-900 hover:no-underline">What is MasjidConnect?</AccordionTrigger>
                  <AccordionContent className="text-gray-600 text-base pt-2">MasjidConnect is a flagship premium channel of Muslim Ad Network that places your brand on digital screens across 50+ handpicked masjids in the U.S.</AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2" className="border-2 border-indigo-300 rounded-lg px-6 py-3 data-[state=open]:bg-indigo-50 data-[state=open]:border-indigo-500">
                  <AccordionTrigger className="text-left font-black text-lg text-indigo-900 hover:no-underline">Where will my ads appear?</AccordionTrigger>
                  <AccordionContent className="text-gray-600 text-base pt-2">Your ads are displayed inside masjids during Jumu'ah, daily prayers, and community programs, reaching people in a trusted, high attention environment.</AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4" className="border-2 border-indigo-300 rounded-lg px-6 py-3 data-[state=open]:bg-indigo-50 data-[state=open]:border-indigo-500">
                  <AccordionTrigger className="text-left font-black text-lg text-indigo-900 hover:no-underline">How often will my ad be shown?</AccordionTrigger>
                  <AccordionContent className="text-gray-600 text-base pt-2">Your ad runs on a consistent loop throughout the day, typically displayed for around 30 seconds every 3 minutes during active screen hours. This results in repeated exposure across key moments like Jumu'ah, daily prayers, and community programs, totaling about 50 minutes of screen time per day and over 25 hours per month per location.</AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-6" className="border-2 border-indigo-300 rounded-lg px-6 py-3 data-[state=open]:bg-indigo-50 data-[state=open]:border-indigo-500">
                  <AccordionTrigger className="text-left font-black text-lg text-indigo-900 hover:no-underline">What do I need to provide?</AccordionTrigger>
                  <AccordionContent className="text-gray-600 text-base pt-2">You provide your banner creative with a QR code that includes tracking parameters (UTMs) so performance can be measured.</AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-7" className="border-2 border-indigo-300 rounded-lg px-6 py-3 data-[state=open]:bg-indigo-50 data-[state=open]:border-indigo-500">
                  <AccordionTrigger className="text-left font-black text-lg text-indigo-900 hover:no-underline">Can I track performance?</AccordionTrigger>
                  <AccordionContent className="text-gray-600 text-base pt-2">Yes. You'll track engagement through QR code scans and conversions. We also provide attendance estimates and proof of play images.</AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-8" className="border-2 border-indigo-300 rounded-lg px-6 py-3 data-[state=open]:bg-indigo-50 data-[state=open]:border-indigo-500">
                  <AccordionTrigger className="text-left font-black text-lg text-indigo-900 hover:no-underline">How are impressions measured?</AccordionTrigger>
                  <AccordionContent className="text-gray-600 text-base pt-2">We estimate reach using attendance data reported by each masjid. Locations range from 500+ weekly attendees to over 7,000 at high-traffic masjids, with additional daily foot traffic contributing to ongoing exposure.</AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-9" className="border-2 border-indigo-300 rounded-lg px-6 py-3 data-[state=open]:bg-indigo-50 data-[state=open]:border-indigo-500">
                  <AccordionTrigger className="text-left font-black text-lg text-indigo-900 hover:no-underline">Do I get proof my ad is live?</AccordionTrigger>
                  <AccordionContent className="text-gray-600 text-base pt-2">Yes. We provide real photos of your ads running inside the masjids as proof of play.</AccordionContent>
                </AccordionItem>
              </Accordion>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Why It Works */}
      <div className="max-w-5xl mx-auto px-6 py-14">
        <h2 className="text-3xl font-black text-gray-900 mb-8">Why MuslimReach™ Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {whyItWorks.map((w) => (
            <div key={w.title} className="flex gap-4 bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <div className="flex-shrink-0 mt-0.5">{w.icon}</div>
              <div>
                <p className="font-bold text-gray-900">{w.title}</p>
                <p className="text-gray-500 text-sm mt-1">{w.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
           <div className="flex flex-wrap gap-3 justify-center mb-4">
             <button
               onClick={() => window.open('https://muslimadnetwork.pipedrive.com/scheduler/9KmA9sa/muslim-ad-network-advertising-partnership-next-steps', '_blank')}
               className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold px-8 py-4 rounded-xl text-lg shadow-lg transition-all"
             >
               Book a Campaign Strategy Call
             </button>
             <a
               href="/"
               className="bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-700 hover:to-pink-800 text-white font-bold px-8 py-4 rounded-xl text-lg shadow-lg transition-all inline-block"
             >
               Launch Your Campaign
             </a>
           </div>
           <p className="text-gray-500 text-sm mt-3">Muslim Ad Network · muslimadnetwork.com</p>
         </div>
      </div>
    </div>

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxIdx(null)}
        >
          <div className="relative max-w-4xl w-full" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setLightboxIdx(null)}
              className="absolute -top-10 right-0 text-white text-2xl font-bold hover:text-indigo-300"
            >✕</button>
            <img src={adPhotos[lightboxIdx].url} alt={adPhotos[lightboxIdx].label} className="w-full rounded-xl shadow-2xl" />
            <p className="text-white text-center mt-3 font-semibold">{adPhotos[lightboxIdx].label}</p>
            <div className="flex justify-center gap-3 mt-4">
              {adPhotos.map((_, i) => (
                <button key={i} onClick={() => setLightboxIdx(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${i === lightboxIdx ? 'bg-indigo-400 scale-125' : 'bg-white/40 hover:bg-white/70'}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
    </PublicShell>
  );
}
