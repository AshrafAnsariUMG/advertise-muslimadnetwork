'use client';

import React, { useEffect } from 'react';
import PublicShell from '@/components/layout/PublicShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Heart,
  TrendingUp,
  Users,
  DollarSign,
  Shield,
  CheckCircle2,
  Zap,
  Target,
  Globe,
  Star,
  ArrowRight,
  Sparkles
} from 'lucide-react';


export default function CharitySignup() {
  const scrollToForm = () => {
    document.getElementById('signup-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  useEffect(() => {
    // Load Pipedrive form script
    const script = document.createElement('script');
    script.src = 'https://webforms.pipedrive.com/f/loader';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Cleanup script on unmount
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  return (
    <PublicShell>
    <div className="min-h-screen bg-white text-gray-900">
      {/* Hero Section - Bold Numbers */}
      <div className="relative overflow-hidden py-8 md:py-12 bg-white">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
          <div
            className="absolute inset-0 bg-cover bg-center opacity-[0.08]"
            style={{ backgroundImage: "url('/marketing/36418ed7c_Muslimconsumerondevice.png')" }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-5xl font-black text-gray-900 max-w-4xl mx-auto mb-6 leading-tight">
              Catch Muslim donors at their moment of generosity.
            </h1>

            </div>

            {/* Stat Cards - Spotify Style */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {/* Card 1 - Slate Gray */}
            <div className="bg-[#1F2937] p-4 md:p-6 rounded-2xl md:rounded-3xl transform hover:scale-105 transition-all duration-300 md:rotate-[-2deg] hover:rotate-0 text-white">
              <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <DollarSign className="w-4 h-4 md:w-5 md:h-5" />
                </div>
              </div>
              <div className="text-3xl md:text-4xl font-black mb-1">3-5x</div>
              <div className="text-sm md:text-base font-bold text-white/90">average ROAS</div>
              <p className="text-xs mt-1 md:mt-2 text-white/70">
                Built for the moments that matter most to donors.
              </p>
            </div>

            {/* Card 2 - Purple/Indigo */}
            <div className="bg-[#7C3AED] p-4 md:p-6 rounded-2xl md:rounded-3xl transform hover:scale-105 transition-all duration-300 md:rotate-[2deg] hover:rotate-0 text-white">
              <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Users className="w-4 h-4 md:w-5 md:h-5" />
                </div>
              </div>
              <div className="text-3xl md:text-4xl font-black mb-1">200M+</div>
              <div className="text-sm md:text-base font-bold text-white/90">Global Muslim Audience Reach</div>
              <p className="text-xs mt-1 md:mt-2 text-white/70">
                Across trusted websites, apps and digital masjid screens
              </p>
            </div>

            {/* Card 3 - Muted Emerald */}
            <div className="bg-[#16A34A] p-4 md:p-6 rounded-2xl md:rounded-3xl transform hover:scale-105 transition-all duration-300 md:rotate-[-1deg] hover:rotate-0 text-white">
              <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 md:w-5 md:h-5" />
                </div>
              </div>
              <div className="text-3xl md:text-4xl font-black mb-1">20%</div>
              <div className="text-sm md:text-base font-bold text-white/90">conversion rate</div>
              <p className="text-xs mt-1 md:mt-2 text-white/70">
                UNHCR achieved 116 recurring donors in 30 days
              </p>
            </div>
            </div>
            </div>

            {/* CTA Button */}
            <div className="relative z-10 text-center mt-8">
              <button
                onClick={scrollToForm}
                className="relative bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-6 rounded-lg font-bold shadow-lg transition-all hover:scale-105 cursor-pointer"
                style={{ pointerEvents: 'all' }}
              >
                Secure Your Campaign Now!
              </button>
            </div>
            </div>

          {/* Why It Works for Charities */}
          <div className="py-8 bg-gray-50">
            <div className="max-w-5xl mx-auto px-4">
              <h2 className="text-3xl md:text-4xl font-black text-center mb-3">Why it works for charities</h2>
              <p className="text-center text-gray-600 mb-6">This beats Meta/Google during peak donor season. Here's why.</p>

              {/* Device Mockup Image */}
              <div className="mb-1 flex justify-center">
                <img
                  src="/marketing/474957051_AdsScreenshot.png"
                  alt="Ad placements across desktop, tablet, and mobile devices"
                  className="w-full max-w-md"
                />
              </div>

              <div className="grid md:grid-cols-3 gap-8 mt-2">
                <div className="text-center">
                  <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-4xl font-black text-indigo-600">1</span>
                  </div>
                  <h3 className="text-xl font-bold mb-2">Captured Donor Attention</h3>
                  <p className="text-base text-gray-600">
                    Instant access to Muslim donors at the moment of generosity—across premium websites, apps, and digital masjid screens.
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-4xl font-black text-blue-600">2</span>
                  </div>
                  <h3 className="text-xl font-bold mb-2">Religious occasion targeting</h3>
                  <p className="text-base text-gray-600">
                    Reach donors at peak generosity — Ramadan, Laylat al-Qadr, Dhul Hijjah, and Eid. Timing beats targeting. Every time.
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-4xl font-black text-green-600">3</span>
                  </div>
                  <h3 className="text-xl font-bold mb-2">Real conversion tracking</h3>
                  <p className="text-base text-gray-600">
                    Track donations, not clicks. See which campaigns drive revenue in real-time.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Trust Bar */}
          <div className="py-12 bg-white">
            <div className="max-w-7xl mx-auto px-4">
              <p className="text-center text-gray-900 font-semibold text-xl mb-8">Trusted by leading charities worldwide</p>
            <div className="flex flex-wrap justify-center items-center gap-16">
            <img
              src="/marketing/e69c8e6d6_life-for-relief-and-development-logo.png"
              alt="Life for Relief"
              className="h-20 object-contain hover:opacity-80 transition-all"
            />
            <img
              src="/marketing/77c18dd15_UNHCRLogo.png"
              alt="UNHCR"
              className="h-20 object-contain hover:opacity-80 transition-all"
            />
          </div>
          </div>
          </div>

          {/* ROI Guarantee + Sign Up Form Side by Side */}
          <div className="py-20 bg-gradient-to-br from-indigo-600 to-blue-700">
            <div className="max-w-7xl mx-auto px-4">
              <div className="grid lg:grid-cols-2 gap-12 items-start">
                {/* Left: ROI Guarantee */}
                <div className="text-white">
                  <Shield className="w-16 h-16 mb-6" />
                  <h2 className="text-4xl md:text-5xl font-black mb-4">
                    Our ROI Guarantee
                  </h2>
                  <p className="text-xl mb-8">
                    We're so confident in our platform, we guarantee results
                  </p>

                  <div className="space-y-6">
                    <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                      <CardContent className="p-6">
                        <CheckCircle2 className="w-8 h-8 mb-3 text-white" />
                        <h3 className="text-xl font-bold mb-2 text-white">Minimum 2x ROAS</h3>
                        <p className="text-white/90">
                          Measured on donation revenue within 30 days.
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                      <CardContent className="p-6">
                        <CheckCircle2 className="w-8 h-8 mb-3 text-white" />
                        <h3 className="text-xl font-bold mb-2 text-white">75%+ Viewability</h3>
                        <p className="text-white/90">
                          Guaranteed viewability rate—25% higher than industry standard
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                      <CardContent className="p-6">
                        <CheckCircle2 className="w-8 h-8 mb-3 text-white" />
                        <h3 className="text-xl font-bold mb-2 text-white">Transparent Reporting</h3>
                        <p className="text-white/90">
                          Real-time dashboard with full visibility into every dollar spent
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                      <CardContent className="p-6">
                        <CheckCircle2 className="w-8 h-8 mb-3 text-white" />
                        <h3 className="text-xl font-bold mb-2 text-white">Unlimited delivery until ROI achieved</h3>
                        <p className="text-white/90">
                          We optimize until campaigns consistently reach at least a 2× ROAS
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Right: Pipedrive Form */}
                <Card id="signup-form" className="bg-white border-0 shadow-2xl sticky top-8">
                  <CardContent className="p-8">
                    <div className="mb-6">
                      <Badge className="bg-red-500/20 text-red-600 border-red-500/30 mb-4">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Limited Spots Available
                      </Badge>
                      <h3 className="text-2xl font-black text-gray-900 mb-2">
                        Connect with a campaign success advisor
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        2-minute check. No pressure. We'll tell you honestly if this makes sense.
                      </p>
                    </div>

                    <div
                      className="pipedriveWebForms"
                      data-pd-webforms="https://webforms.pipedrive.com/f/1r2VQiCCLyPp4aV5cvkE0FnDlqWrcCJd2rMgoX3zduQrH5dNgJjzpyGT7LVV8uxEf"
                    />
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* CTA Button */}
            <div className="text-center py-12">
              <Button
                onClick={scrollToForm}
                className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-6 h-auto font-bold shadow-lg"
              >
                Secure Your Campaign Now!
              </Button>
            </div>
            </div>

            {/* Why Muslim Donors Section */}
      <div className="py-20 bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              Why Muslim donors matter<br />for your mission
            </h2>
            <p className="text-xl text-gray-600">
              The Muslim community isn't just generous—they're deeply committed to humanitarian causes
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <Heart className="w-6 h-6 text-blue-400" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Religious obligation to give</h3>
                  <p className="text-gray-600">
                    Zakat (mandatory charity) and Sadaqah (voluntary giving) are pillars of Islam.
                    Muslims donate 2.5% of wealth annually—that's $1.8B in the U.S. alone.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                    <Target className="w-6 h-6 text-green-400" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Higher lifetime value</h3>
                  <p className="text-gray-600">
                    Muslim donors show 40% higher retention rates and give consistently throughout
                    the year, especially during Ramadan and Dhul Hijjah.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                    <Globe className="w-6 h-6 text-purple-400" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Untapped market</h3>
                  <p className="text-gray-600">
                    Only 12% of charities actively target Muslim donors, yet they represent
                    one of the fastest-growing demographics with $170B+ purchasing power.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative">
              <img
                src="/marketing/e257533ce_muslim-people-giving-donation-in-ramadan-hoy-month-flat-cartoon-illustration-vector.jpg"
                alt="Charity impact"
                className="rounded-2xl shadow-2xl"
              />
              <div className="absolute -bottom-6 -left-6 bg-gradient-to-r from-red-500 to-pink-600 p-6 rounded-2xl shadow-2xl">
                <div className="text-4xl font-black mb-1">$235K+</div>
                <div className="text-sm font-semibold">Total donations raised<br />for our charity partners</div>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <div className="text-center mt-12">
            <Button
              onClick={scrollToForm}
              className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-6 h-auto font-bold shadow-lg"
            >
              Secure Your Campaign Now!
            </Button>
          </div>
          </div>
          </div>

          {/* Micro Case Studies */}
      <div className="py-16 bg-white border-y border-gray-200">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-black text-center mb-12">Where real data drives real impact.</h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
              <div className="text-sm text-gray-500 mb-2">UNHCR USA</div>
              <div className="text-3xl font-black text-green-600 mb-1">116</div>
              <div className="text-sm text-gray-700 mb-3">recurring donors in 30 days</div>
              <div className="text-xs text-gray-500">$8.2K spend → $47K raised → 5.7x ROAS</div>
            </div>

            <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
              <div className="text-sm text-gray-500 mb-2">Life for Relief</div>
              <div className="text-3xl font-black text-purple-600 mb-1">340%</div>
              <div className="text-sm text-gray-700 mb-3">increase in Q1 donors</div>
              <div className="text-xs text-gray-500">$5.5K spend → $28K raised → Ramadan campaign</div>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="text-center mt-8">
          <Button
            onClick={scrollToForm}
            className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-6 h-auto font-bold shadow-lg"
          >
            Secure Your Campaign Now!
          </Button>
        </div>
        </div>

      {/* Why We're Different */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              Why charities choose us
            </h2>
            <p className="text-xl text-gray-600">
              We're not just another ad network—we're your partner in donor acquisition
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-white border-gray-200 hover:border-blue-500/50 transition-all">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-6">
                  <Zap className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-gray-900">Exclusive Access</h3>
                <p className="text-gray-600">
                  We're the only network with first-party data and access to Muslim audiences across premium websites, apps and digital masjid screens.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 hover:border-purple-500/50 transition-all">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-6">
                  <Target className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-gray-900">Hyper-Targeting</h3>
                <p className="text-gray-600">
                  Target by demographics, geography, religious occasions (Ramadan, Hajj),
                  and donor behavior patterns.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 hover:border-green-500/50 transition-all">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-6">
                  <Heart className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-gray-900">Cultural Expertise</h3>
                <p className="text-gray-600">
                  Our team understands Islamic giving principles and creates culturally
                  resonant campaigns that drive action.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* CTA Button */}
          <div className="text-center mt-12">
            <Button
              onClick={scrollToForm}
              className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-6 h-auto font-bold shadow-lg"
            >
              Secure Your Campaign Now!
            </Button>
          </div>
          </div>
          </div>

          {/* Contact Section */}
      <div className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-gray-600 mb-4">Prefer to talk first?</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="tel:+18668870844"
              className="text-indigo-600 hover:text-indigo-700 font-semibold"
            >
              📞 (866) 887-0844
            </a>
            <span className="text-gray-400">|</span>
            <a
              href="mailto:sales@muslimadnetwork.com"
              className="text-indigo-600 hover:text-indigo-700 font-semibold"
            >
              ✉️ sales@muslimadnetwork.com
            </a>
          </div>
        </div>
      </div>
    </div>
    </PublicShell>
  );
}
