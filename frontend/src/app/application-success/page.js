'use client';

import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle, Mail, Phone } from 'lucide-react';
import PublicShell from '@/components/layout/PublicShell';

export default function ApplicationSuccessPage() {
  useEffect(() => {
    // A friendly burst — three quick bursts from opposing edges so it feels
    // celebratory without being obnoxious.
    const defaults = {
      spread: 70,
      startVelocity: 45,
      ticks: 90,
      colors: ['#4f46e5', '#6366f1', '#a855f7', '#22c55e', '#eab308'],
    };

    confetti({ ...defaults, particleCount: 80, origin: { x: 0, y: 0.6 } });
    confetti({ ...defaults, particleCount: 80, origin: { x: 1, y: 0.6 } });

    const followup = setTimeout(() => {
      confetti({
        ...defaults,
        particleCount: 60,
        spread: 100,
        origin: { x: 0.5, y: 0.4 },
      });
    }, 250);

    return () => clearTimeout(followup);
  }, []);

  return (
    <PublicShell>
    <div className="min-h-[80vh] bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-xl w-full text-center space-y-8">
        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg">
          <CheckCircle className="w-12 h-12 text-white" />
        </div>

        <div className="space-y-3">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900">
            You&apos;re all set!
          </h1>
          <p className="text-lg text-gray-600">
            Thank you, your campaign is now under review.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 text-left space-y-4">
          <h2 className="text-base font-semibold text-gray-900 text-center">
            What happens next
          </h2>
          <ol className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-sm font-bold flex items-center justify-center">
                1
              </span>
              <p className="text-sm text-gray-700">
                Our team reviews your submission within{' '}
                <span className="font-semibold">1–2 business days</span>.
              </p>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-sm font-bold flex items-center justify-center">
                2
              </span>
              <p className="text-sm text-gray-700">
                We&apos;ll email you when your campaign is approved and live.
              </p>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-sm font-bold flex items-center justify-center">
                3
              </span>
              <p className="text-sm text-gray-700">
                If we need any clarification on your creatives or targeting,
                we&apos;ll reach out.
              </p>
            </li>
          </ol>
        </div>

        <div className="text-sm text-gray-500 space-y-2">
          <p>Questions? Our team is happy to help.</p>
          <div className="flex flex-wrap justify-center items-center gap-4">
            <a
              href="mailto:Sales@muslimadnetwork.com"
              className="inline-flex items-center gap-2 text-indigo-600 hover:underline"
            >
              <Mail className="w-4 h-4" />
              Sales@muslimadnetwork.com
            </a>
            <span className="text-gray-300">|</span>
            <a
              href="tel:+18868870844"
              className="inline-flex items-center gap-2 text-indigo-600 hover:underline"
            >
              <Phone className="w-4 h-4" />
              (886)-887-0844
            </a>
          </div>
        </div>
      </div>
    </div>
    </PublicShell>
  );
}
