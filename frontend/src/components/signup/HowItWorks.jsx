'use client';

import { useState } from 'react';
import { Rocket, BarChart3, CheckCircle, ArrowDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

/**
 * "How it works" sidebar shown alongside the wizard on desktop.
 *
 * Ported from base44's PublisherShowcase — three colored step cards
 * (indigo → purple → green) connected by bouncing arrows, plus three trust
 * checkmarks at the bottom. Step 1 has a device-mockup illustration and a
 * "See featured publishers" button that opens a 12-logo dialog.
 *
 * Publisher logos + device mockup are served locally from /public/marketing
 * (mirrored off base44's CDN before base44 was decommissioned).
 */
const ADS_MOCKUP_URL =
  '/marketing/474957051_AdsScreenshot.png';

const PUBLISHERS = [
  { name: 'Al Jazeera',          src: '/marketing/ae568d35c_aljazeeralogo.png',           wrap: 'bg-white' },
  { name: 'My Halal Scanner',    src: '/marketing/83d3feade_MyHalalScanner.jpeg',          wrap: 'bg-white' },
  { name: 'Ummah Jobs',          src: '/marketing/b2f0f6800_ummahjobslogo.png',           wrap: 'bg-white' },
  { name: 'IslamicFinder',       src: '/marketing/f8b332a40_Screenshot2025-12-28at82936PM.png', wrap: 'bg-gray-900' },
  { name: 'About Islam',         src: '/marketing/9cf5505cd_AboutIslamlogo.png',          wrap: 'bg-white' },
  { name: 'CNN',                 src: '/marketing/706054d0c_generated_image.png',                                                       wrap: 'bg-white' },
  { name: 'Muslim Travel Girl',  src: '/marketing/08d12351c_MTG-new-logo-2020-450px.png', wrap: 'bg-white' },
  { name: 'The New York Times',  src: '/marketing/67f5936fd_New-York-Times-Logo.jpg',                                                   wrap: 'bg-white' },
  { name: 'Muslima',             src: '/marketing/aba1ccd9c_muslimapub.png',              wrap: 'bg-white' },
  { name: 'Hulu',                src: '/marketing/6ad8a2d4f_hululogo.svg',                                                              wrap: 'bg-green-50 border-green-200' },
  { name: 'YouTube TV',          src: '/marketing/151b22aa5_YouTube-TV-Logo.png',                                                      wrap: 'bg-red-50 border-red-200' },
  { name: 'Peacock',             src: '/marketing/294aa117a_peacocklogoofficial.jpg',                                                  wrap: 'bg-purple-50 border-purple-200' },
];

export default function HowItWorks() {
  const [open, setOpen] = useState(false);

  return (
    <Card className="bg-white border-2 border-indigo-100 shadow-lg overflow-hidden p-0">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-6 text-center">
        <h3 className="text-2xl font-bold mb-1">How it works</h3>
        <p className="text-indigo-100 text-sm">Easy advertising for your business</p>
      </div>

      <div className="p-6 space-y-4">
        {/* Step 1 — indigo */}
        <div className="relative pl-6">
          <div className="absolute -left-3 top-0 w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-xl shadow-xl z-10 border-4 border-white">
            1
          </div>
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-6 border-2 border-indigo-200 shadow-md">
            <div className="text-center mb-4">
              <h4 className="text-lg font-bold text-gray-900 mb-2">
                Your ads reach real Muslim consumers instantly.
              </h4>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                Your ads appear in front of real Muslim audiences across trusted
                premium publishers, mobile apps, masjid networks, and Connected
                TV platforms.
                <br />
                <br />
                Reach millions with precision targeting and zero wasted
                impressions.
              </p>
            </div>

            <div className="flex flex-col items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={ADS_MOCKUP_URL}
                alt="Ad placements across desktop, tablet, and mobile devices"
                className="w-full max-w-xs rounded-lg"
              />

              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger
                  render={
                    <Button
                      variant="outline"
                      className="mt-3 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-bold text-sm border-2 border-indigo-200 px-5 py-2.5 h-auto"
                    />
                  }
                >
                  See featured publishers →
                </DialogTrigger>
                <DialogContent className="sm:max-w-4xl">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-center mb-2">
                      Featured premium sites &amp; apps — with hundreds more
                      powering your reach!
                    </DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 max-h-[70vh] overflow-y-auto">
                    {PUBLISHERS.map((p) => (
                      <div
                        key={p.name}
                        className={`flex items-center justify-center p-6 rounded-lg border hover:shadow-lg transition-all min-h-[110px] ${p.wrap.includes('border-') ? p.wrap : `${p.wrap} border-gray-200 hover:border-indigo-300`}`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.src}
                          alt={p.name}
                          className="max-h-16 w-auto object-contain"
                        />
                      </div>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex justify-center py-1">
          <ArrowDown className="w-6 h-6 text-indigo-400 animate-bounce" />
        </div>

        {/* Step 2 — purple */}
        <div className="relative pl-6">
          <div className="absolute -left-3 top-0 w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-xl shadow-xl z-10 border-4 border-white">
            2
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200 shadow-md">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center shadow-md">
                <Rocket className="w-8 h-8 text-purple-600" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">
                Set Up in Minutes
              </h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                Quick and easy campaign setup. Our team reviews and activates
                your campaign within 24–48 hours.
              </p>
            </div>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex justify-center py-1">
          <ArrowDown className="w-6 h-6 text-purple-400 animate-bounce" />
        </div>

        {/* Step 3 — green */}
        <div className="relative pl-6">
          <div className="absolute -left-3 top-0 w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-xl shadow-xl z-10 border-4 border-white">
            3
          </div>
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200 shadow-md">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center shadow-md">
                <BarChart3 className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">
                Track Real Results
              </h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                Monitor ad clicks, display ad impressions, and customer
                conversions in real-time. See exactly how your budget is working
                for you.
              </p>
            </div>
          </div>
        </div>

        {/* Trust checkmarks */}
        <div className="pt-6 mt-4 border-t-2 border-gray-200 space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-700">
              <strong>Brand-safe:</strong> Muslim-friendly environment
            </p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-700">
              <strong>Verified reach:</strong> Authentic Muslim audience
            </p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-700">
              <strong>Flexible budget:</strong> Start from $250/month
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
