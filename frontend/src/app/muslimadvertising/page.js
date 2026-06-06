'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import PublicShell from '@/components/layout/PublicShell';

const faqs = [
  {
    q: "How much does it cost to advertise to Muslim consumers?",
    a: "Muslim Ad Network campaigns start from $250/month for self-service display advertising. Managed campaigns with dedicated support typically start at $1,500/month. CTV and in-mosque (MasjidConnect™) placements are available as add-ons. There are no long-term contracts — you can start, pause, or scale at any time."
  },
  {
    q: "What is MuslimReach™ targeting technology?",
    a: "MuslimReach™ is Muslim Ad Network's proprietary audience targeting system. It combines contextual signals (Islamic content sites, Ramadan searches, halal product queries), behavioral data, and geographic targeting to reach Muslim consumers with pinpoint accuracy — without relying on religious identity data that violates privacy regulations."
  },
  {
    q: "Can I target Muslims in a specific city or country?",
    a: "Yes. You can target by country, region, state, city, or even by radius around a specific address — ideal for restaurants, local halal businesses, and masjids. Muslim Ad Network reaches Muslim audiences in 50+ countries including the US, UK, Canada, Australia, UAE, Malaysia, and more."
  },
  {
    q: "What ad formats does Muslim Ad Network support?",
    a: "We support standard display banners (300x250, 728x90, 160x600, 300x600), mobile interstitials, pre-roll video ads for CTV, email sponsored placements, and in-mosque digital screen ads. Our design team can also create custom creatives for an additional fee."
  },
  {
    q: "Is Muslim Ad Network effective for Ramadan campaigns?",
    a: "Ramadan is the single highest-performing period for Muslim consumer advertising. Engagement rates increase 60-80% during Ramadan. Muslim Ad Network runs dedicated Ramadan packages with priority placements, special newsletter features, and in-mosque advertising during Taraweeh prayers — the highest-attendance nights of the Islamic calendar."
  },
  {
    q: "How do I measure campaign performance?",
    a: "All campaigns include a real-time dashboard showing impressions, clicks, CTR, geographic breakdowns, and device performance. Pixel-based conversion tracking is available for website traffic and lead generation campaigns. Managed clients receive weekly performance reports with strategic recommendations."
  },
  {
    q: "Can nonprofits and charities advertise on Muslim Ad Network?",
    a: "Yes — Muslim Ad Network offers special charity and nonprofit packages, particularly popular for Ramadan Zakat and Sadaqah fundraising campaigns. Islamic charities consistently see exceptional donor conversion rates when reaching engaged Muslim audiences on our platform."
  },
  {
    q: "What makes Muslim advertising different from general digital advertising?",
    a: "Muslim consumers respond strongly to cultural authenticity. Ads that acknowledge Islamic values — honesty, community, family, halal compliance — significantly outperform generic creative. Muslim Ad Network's team provides guidance on culturally resonant messaging, and our audience is actively looking for halal and Muslim-friendly brands."
  }
];

function FAQ({ item }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <span className="font-semibold text-gray-900 pr-4">{item.q}</span>
        {open ? <ChevronUp className="w-5 h-5 text-indigo-600 flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />}
      </button>
      {open && (
        <div className="px-6 pb-5 text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
          {item.a}
        </div>
      )}
    </div>
  );
}

export default function MuslimAdvertising() {
  useEffect(() => {
    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map(f => ({
        "@type": "Question",
        "name": f.q,
        "acceptedAnswer": { "@type": "Answer", "text": f.a }
      }))
    };
    const articleSchema = {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "Muslim Advertising: The Complete Guide to Reaching Muslim Consumers in 2025",
      "description": "The complete guide to Muslim advertising. Learn how to reach 1.8 billion Muslim consumers, use MuslimReach™ targeting, run Ramadan campaigns, and grow your brand in the $3.1 trillion Muslim consumer market.",
      "url": "https://ads.muslimadnetwork.com/MuslimAdvertising",
      "publisher": { "@type": "Organization", "name": "Muslim Ad Network", "url": "https://www.muslimadnetwork.com" },
      "author": { "@type": "Organization", "name": "Muslim Ad Network" },
      "datePublished": "2025-01-01",
      "dateModified": "2025-05-01",
      "keywords": "Muslim advertising, halal marketing, Muslim consumers, Ramadan advertising, Islamic marketing, MuslimReach"
    };
    ['faqschema', 'articleschema'].forEach(id => document.querySelector(`script[data-page="${id}"]`)?.remove());
    [faqSchema, articleSchema].forEach((schema, i) => {
      const s = document.createElement('script');
      s.type = 'application/ld+json';
      s.setAttribute('data-page', i === 0 ? 'faqschema' : 'articleschema');
      s.text = JSON.stringify(schema);
      document.head.appendChild(s);
    });
    return () => ['faqschema', 'articleschema'].forEach(id => document.querySelector(`script[data-page="${id}"]`)?.remove());
  }, []);

  return (
    <PublicShell>
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-16">

        {/* Hero */}
        <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 leading-tight">
          Muslim Advertising: The Complete Guide to Reaching Muslim Consumers in 2025
        </h1>
        <p className="text-xl text-gray-600 leading-relaxed mb-8 border-l-4 border-indigo-500 pl-5">
          The global Muslim consumer market is worth <strong>$3.1 trillion</strong> — and most brands are still ignoring it. This guide explains how to reach Muslim audiences effectively, ethically, and at scale.
        </p>

        {/* Key stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-10">
          {[
            { stat: "1.8B+", label: "Muslims Worldwide" },
            { stat: "$3.1T", label: "Muslim Consumer Economy" },
            { stat: "200M+", label: "Addressable Audience" },
            { stat: "5,000+", label: "Publisher Sites" },
          ].map((s, i) => (
            <div key={i} className="bg-indigo-50 rounded-xl p-5 text-center">
              <div className="text-2xl font-black text-indigo-700">{s.stat}</div>
              <div className="text-sm text-gray-600 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl p-8 text-center text-white my-10">
          <h2 className="text-2xl md:text-3xl font-black mb-3">Ready to Reach Muslim Consumers?</h2>
          <p className="text-indigo-100 mb-6 max-w-xl mx-auto">
            Join hundreds of brands already growing with Muslim Ad Network. Launch your first campaign in minutes, or talk to our team about a custom strategy.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/" className="inline-block bg-white text-indigo-700 font-bold px-8 py-4 rounded-xl text-lg transition-colors hover:bg-indigo-50">
              Start Your Campaign →
            </a>
            <a href="/contact" className="inline-block border-2 border-white/60 text-white hover:bg-white/10 font-bold px-8 py-4 rounded-xl text-lg transition-colors">
              Talk to Our Team
            </a>
          </div>
        </div>

        {/* Section 1 */}
        <h2 className="text-3xl font-black text-gray-900 mt-14 mb-4">What Is Muslim Advertising?</h2>
        <p className="text-gray-700 leading-relaxed mb-5">
          Muslim advertising refers to digital marketing campaigns specifically designed and targeted to reach Muslim consumers — a demographic defined by shared values, cultural practices, and purchasing behaviors rooted in Islamic principles. Unlike general demographic targeting, Muslim advertising leverages contextual signals, behavioral data, and culturally aligned messaging to connect brands with an audience that is highly engaged, brand-loyal, and increasingly affluent.
        </p>
        <p className="text-gray-700 leading-relaxed mb-5">
          Muslim consumers actively seek out brands that respect their values. They favor halal-certified products, ethically sourced goods, family-oriented messaging, and businesses that demonstrate genuine cultural awareness. Brands that get this right don't just win a transaction — they earn long-term loyalty from one of the world's most community-driven consumer groups.
        </p>
        <p className="text-gray-700 leading-relaxed mb-5">
          Muslim Ad Network was built specifically to serve this need. As the leading Muslim advertising platform, we connect advertisers with over 200 million Muslim consumers across premium websites, in-mosque digital screens, email newsletters, and Connected TV platforms — all through a single, easy-to-use self-service platform.
        </p>

        {/* Section 2 */}
        <h2 className="text-3xl font-black text-gray-900 mt-14 mb-4">The Muslim Consumer Market: Why It Matters Now</h2>
        <p className="text-gray-700 leading-relaxed mb-5">
          The Muslim consumer economy is one of the most significant untapped opportunities in global marketing. Here's why brands are accelerating their investment in Muslim-targeted advertising:
        </p>
        <ul className="space-y-4 mb-6">
          {[
            { title: "Massive and Growing", body: "With 1.8 billion Muslims globally — roughly 25% of the world's population — and a median age significantly younger than the global average, the Muslim consumer market is not just large, it's growing rapidly. By 2030, the global Muslim population is projected to reach 2.2 billion." },
            { title: "High Purchasing Power", body: "Muslim consumers spend over $3.1 trillion annually across food, fashion, travel, finance, healthcare, and lifestyle. In the United States alone, Muslim purchasing power exceeds $200 billion per year — yet most major brands allocate less than 1% of their media budget to this demographic." },
            { title: "Underserved by Mainstream Advertising", body: "Despite their economic significance, Muslim consumers are chronically underrepresented in mainstream advertising. This creates a significant advantage for early-mover brands: less competition, lower CPMs, and a highly receptive audience that rewards brands for showing up." },
            { title: "Digital-First Audience", body: "Muslim consumers are disproportionately young, urban, and digitally engaged. They over-index on mobile usage, social media, streaming platforms, and online shopping — making them ideal targets for digital advertising campaigns." },
            { title: "Community-Driven Word of Mouth", body: "Muslim communities are tight-knit. A brand that earns trust within a mosque, Islamic school, or community organization can generate word-of-mouth that traditional advertising can't replicate. Muslim Ad Network's MasjidConnect™ channel taps directly into this community trust infrastructure." },
          ].map((item, i) => (
            <li key={i} className="bg-gray-50 rounded-xl p-5">
              <strong className="text-gray-900">{item.title}:</strong>{" "}
              <span className="text-gray-700">{item.body}</span>
            </li>
          ))}
        </ul>

        {/* Section 3 */}
        <h2 className="text-3xl font-black text-gray-900 mt-14 mb-4">How Muslim Ad Network's MuslimReach™ Technology Works</h2>
        <p className="text-gray-700 leading-relaxed mb-5">
          Reaching Muslim consumers effectively requires more than placing ads on Islamic websites. It requires understanding the full breadth of where and how Muslim audiences consume content — and delivering the right message at the right moment with the right cultural context.
        </p>
        <p className="text-gray-700 leading-relaxed mb-5">
          MuslimReach™ is Muslim Ad Network's proprietary targeting technology that combines three layers of intelligence:
        </p>
        <div className="space-y-4 mb-8">
          {[
            { title: "Contextual Targeting", body: "Ads are placed on content that Muslim consumers are actively reading — Islamic news, Quran apps, halal food blogs, Islamic finance sites, prayer time apps, and more. Contextual relevance dramatically increases engagement and purchase intent." },
            { title: "Behavioral Targeting", body: "MuslimReach™ identifies Muslim consumer segments based on browsing behavior, search history, and app usage patterns — including searches for halal restaurants, Islamic clothing, prayer apps, and Ramadan-related content — without using sensitive identity data." },
            { title: "Geographic & Community Targeting", body: "Target by country, city, zip code, or radius. For local businesses, we can reach Muslims within a specific distance of your location — highly effective for restaurants, Islamic schools, and community services." },
          ].map((item, i) => (
            <div key={i} className="flex gap-4 p-5 border border-indigo-100 rounded-xl bg-indigo-50/30">
              <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0 mt-0.5">{i + 1}</div>
              <div>
                <div className="font-bold text-gray-900 mb-1">{item.title}</div>
                <div className="text-gray-700 text-sm leading-relaxed">{item.body}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Section 4 */}
        <h2 className="text-3xl font-black text-gray-900 mt-14 mb-4">Advertising Channels: Where We Reach Muslim Consumers</h2>
        <p className="text-gray-700 leading-relaxed mb-6">
          Muslim Ad Network offers four primary channels, each designed to reach Muslim audiences at different touchpoints in their daily lives:
        </p>
        <div className="grid md:grid-cols-2 gap-5 mb-8">
          {[
            {
              icon: "🌐",
              title: "Premium Display Network",
              body: "Reach 200M+ Muslims on 5,000+ premium websites including Al Jazeera English, IslamicFinder, AboutIslam, SeekersGuidance, Halaltrip, and hundreds of Islamic lifestyle, news, and community sites — as well as mainstream publishers with Muslim audience segments.",
              tags: ["Banner Ads", "Native Ads", "Mobile", "Desktop"]
            },
            {
              icon: "🕌",
              title: "MasjidConnect™ In-Mosque Screens",
              body: "Advertise inside masjids during Jumu'ah Friday prayers and Taraweeh — reaching a captive, highly engaged audience in a high-trust community environment. This channel is unique to Muslim Ad Network and delivers unmatched brand recall.",
              tags: ["Digital Screens", "Community Trust", "National Network"]
            },
            {
              icon: "📧",
              title: "Email & Newsletter Marketing",
              body: "Sponsored placements in curated Islamic newsletters delivered to engaged Muslim subscribers. Email placements achieve above-industry-average open rates because the audience self-selected into Islamic content they trust.",
              tags: ["Newsletters", "Sponsored Content", "High Open Rates"]
            },
            {
              icon: "📺",
              title: "Connected TV (CTV) Advertising",
              body: "Serve 15 or 30-second unskippable video ads to Muslim households on Hulu, YouTube TV, Peacock, Pluto TV, and other premium streaming platforms. CTV combines the reach of broadcast TV with the precision targeting of digital.",
              tags: ["Hulu", "YouTube TV", "Peacock", "Streaming"]
            },
          ].map((ch, i) => (
            <div key={i} className="border border-gray-200 rounded-xl p-6 hover:border-indigo-300 hover:shadow-md transition-all">
              <div className="text-3xl mb-3">{ch.icon}</div>
              <h3 className="font-black text-gray-900 text-lg mb-2">{ch.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">{ch.body}</p>
              <div className="flex flex-wrap gap-2">
                {ch.tags.map((tag, j) => (
                  <span key={j} className="bg-indigo-50 text-indigo-700 text-xs font-medium px-3 py-1 rounded-full">{tag}</span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Section 5 */}
        <h2 className="text-3xl font-black text-gray-900 mt-14 mb-4">Best Industries for Muslim Advertising</h2>
        <p className="text-gray-700 leading-relaxed mb-6">
          While any brand can benefit from reaching Muslim consumers, certain industries see exceptional ROI due to natural alignment with Muslim values and purchasing behavior:
        </p>
        <div className="space-y-3 mb-8">
          {[
            { industry: "Halal Food & Restaurants", detail: "The halal food market exceeds $1.9 trillion globally. Muslim consumers actively search for halal-certified options and respond strongly to restaurant ads on local and national Islamic platforms." },
            { industry: "Islamic Finance & Banking", detail: "Sharia-compliant financial products (Islamic mortgages, halal investment funds, interest-free banking) are in high demand. Brands in this space consistently see high-intent leads through Muslim Ad Network campaigns." },
            { industry: "Modest Fashion", detail: "The modest fashion market is valued at over $280 billion. Muslim women are a powerhouse consumer group with strong brand preferences and high social media engagement." },
            { industry: "Hajj & Umrah Travel", detail: "Every Muslim aspires to perform Hajj and Umrah. Travel agencies offering pilgrimage packages see enormous seasonal demand — particularly when promoted through trusted Muslim media channels in the months before Dhul Hijjah and Ramadan." },
            { industry: "Islamic Education", detail: "Online Quran schools, Islamic studies platforms, Arabic learning apps, and Islamic boarding schools all find highly targeted audiences through Muslim Ad Network's education-focused publisher network." },
            { industry: "Charities & Nonprofits", detail: "Ramadan is the world's single largest charitable giving season for Muslims. Zakat, Sadaqah, and Fitrah campaigns promoted through Muslim Ad Network routinely see 5-10x returns on ad spend during Ramadan." },
            { industry: "Healthcare", detail: "Muslim consumers seek healthcare providers who understand cultural needs — from gender-separated care to halal-compliant medications. Medical practices and health brands targeting Muslim communities see strong conversion through contextual advertising." },
            { industry: "Mainstream Brands", detail: "Major CPG, retail, and financial brands increasingly allocate dedicated media budgets to Muslim audiences. If you're already advertising broadly, a Muslim-specific campaign is often the highest-incremental-return segment you can add." },
          ].map((item, i) => (
            <div key={i} className="flex gap-3 items-start p-4 bg-gray-50 rounded-xl">
              <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 flex-shrink-0"></div>
              <div>
                <span className="font-bold text-gray-900">{item.industry}: </span>
                <span className="text-gray-600 text-sm">{item.detail}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Section 6 */}
        <h2 className="text-3xl font-black text-gray-900 mt-14 mb-4">Ramadan Advertising: The Most Powerful Muslim Marketing Season</h2>
        <p className="text-gray-700 leading-relaxed mb-5">
          Ramadan is the Super Bowl of Muslim advertising. For 30 days, Muslim consumers are more digitally active, more emotionally engaged with content, and more likely to make significant purchases — from food and fashion to charitable donations and spiritual services. Advertisers who run Ramadan-specific campaigns consistently see 2-4x the engagement of non-Ramadan periods.
        </p>
        <p className="text-gray-700 leading-relaxed mb-5">
          Muslim Ad Network offers dedicated Ramadan advertising packages that include priority placement across our publisher network, featured spots in Ramadan-themed newsletters, in-mosque advertising during Taraweeh prayers (the most-attended nightly prayers of the year), and CTV placements targeting Muslim households during Suhoor and Iftar viewing hours.
        </p>
        <p className="text-gray-700 leading-relaxed mb-5">
          For charities, Ramadan represents an unparalleled fundraising opportunity. The last 10 nights of Ramadan — particularly Laylat al-Qadr — drive the highest charitable giving of the entire year. Muslim Ad Network's charity clients routinely see donation volumes 5-10x higher than campaigns run outside of Ramadan.
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8">
          <p className="font-bold text-amber-900 mb-2">📅 Plan Ahead for Ramadan</p>
          <p className="text-amber-800 text-sm">Ramadan placements fill up 4-8 weeks in advance. Brands that plan early secure the best inventory and positioning. Contact our team now to discuss Ramadan advertising strategy.</p>
        </div>

        {/* Section 7 */}
        <h2 className="text-3xl font-black text-gray-900 mt-14 mb-4">How to Create Effective Muslim Ad Creatives</h2>
        <p className="text-gray-700 leading-relaxed mb-5">
          Creative quality is one of the most important factors in Muslim advertising performance. Ads that feel authentic and culturally informed consistently outperform generic creative. Here are the key principles:
        </p>
        <ul className="space-y-3 mb-8 text-gray-700">
          {[
            { point: "Use Islamic greetings and phrases authentically", detail: "Phrases like \"Assalamu Alaikum,\" \"Halal Certified,\" or \"Ramadan Mubarak\" immediately signal relevance — but only when used genuinely. Misuse stands out immediately to Muslim audiences." },
            { point: "Represent Muslim consumers visually", detail: "Show Muslim families, hijab-wearing women, diverse Muslim men, and community settings. Representation matters enormously to a demographic that rarely sees itself in mainstream advertising." },
            { point: "Highlight halal compliance clearly", detail: "For food, beauty, and pharmaceutical brands, halal certification should be prominently featured. This is a primary purchase driver for devout Muslim consumers." },
            { point: "Align with Islamic values", detail: "Family, community, honesty, generosity, and faith are core values for Muslim consumers. Ads that speak to these values — without being preachy — resonate far more than product-only messaging." },
            { point: "Avoid culturally insensitive imagery", detail: "No pork products, alcohol, immodest imagery, or content that conflicts with Islamic values. Simple awareness of these sensitivities prevents costly brand missteps." },
          ].map((item, i) => (
            <li key={i} className="flex gap-3 items-start">
              <span className="text-indigo-600 font-bold mt-0.5">✓</span>
              <div><strong>{item.point}:</strong> {item.detail}</div>
            </li>
          ))}
        </ul>
        <p className="text-gray-700 leading-relaxed mb-5">
          Not sure how to create culturally effective Muslim ad creatives? Muslim Ad Network offers a professional banner design service that produces culturally resonant, high-converting ad creatives for your campaign.
        </p>

        {/* Section 8 */}
        <h2 className="text-3xl font-black text-gray-900 mt-14 mb-4">Self-Service vs. Managed Muslim Advertising Campaigns</h2>
        <p className="text-gray-700 leading-relaxed mb-5">
          Muslim Ad Network offers two paths for advertisers:
        </p>
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="border-2 border-gray-200 rounded-xl p-6">
            <h3 className="font-black text-gray-900 text-xl mb-3">Self-Service Platform</h3>
            <ul className="space-y-2 text-gray-600 text-sm mb-4">
              <li>✓ Launch in minutes</li>
              <li>✓ Start from $250/month</li>
              <li>✓ Full targeting control</li>
              <li>✓ Real-time dashboard</li>
              <li>✓ No long-term contracts</li>
              <li>✓ Pause or scale anytime</li>
            </ul>
            <p className="text-gray-500 text-sm">Best for: Small to mid-size businesses, test campaigns, direct-response advertisers</p>
          </div>
          <div className="border-2 border-indigo-500 rounded-xl p-6 bg-indigo-50/30">
            <h3 className="font-black text-indigo-800 text-xl mb-3">Managed Services</h3>
            <ul className="space-y-2 text-gray-600 text-sm mb-4">
              <li>✓ Dedicated account manager</li>
              <li>✓ Full-service campaign strategy</li>
              <li>✓ Custom creative design</li>
              <li>✓ Weekly performance reports</li>
              <li>✓ Multi-channel coordination</li>
              <li>✓ Ramadan & seasonal planning</li>
            </ul>
            <p className="text-gray-500 text-sm">Best for: Brands spending $1,500+/month, agencies, complex multi-channel campaigns</p>
          </div>
        </div>

        {/* FAQ */}
        <h2 className="text-3xl font-black text-gray-900 mt-14 mb-6">Frequently Asked Questions About Muslim Advertising</h2>
        <div className="space-y-3 mb-12">
          {faqs.map((item, i) => (
            <FAQ key={i} item={item} />
          ))}
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl p-8 text-center text-white mt-14">
          <h2 className="text-2xl md:text-3xl font-black mb-3">Ready to Reach Muslim Consumers?</h2>
          <p className="text-indigo-100 mb-6 max-w-xl mx-auto">
            Join hundreds of brands already growing with Muslim Ad Network. Launch your first campaign in minutes, or talk to our team about a custom strategy.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/"
              className="inline-block bg-white text-indigo-700 font-bold px-8 py-4 rounded-xl text-lg transition-colors hover:bg-indigo-50"
            >
              Start Your Campaign →
            </a>
            <a
              href="/contact"
              className="inline-block border-2 border-white/60 text-white hover:bg-white/10 font-bold px-8 py-4 rounded-xl text-lg transition-colors"
            >
              Talk to Our Team
            </a>
          </div>
        </div>

      </div>
    </div>
    </PublicShell>
  );
}
