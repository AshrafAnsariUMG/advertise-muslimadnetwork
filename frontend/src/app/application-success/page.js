'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import confetti from 'canvas-confetti';
import { CheckCircle, Mail, Phone, Loader2, Palette } from 'lucide-react';
import PublicShell from '@/components/layout/PublicShell';
import PostPaymentCreatives from '@/components/signup/PostPaymentCreatives';
import { getAdvertiser } from '@/lib/api';
import { clearDraft } from '@/lib/draft-storage';

function fireConfetti() {
  const defaults = {
    spread: 70,
    startVelocity: 45,
    ticks: 90,
    colors: ['#4f46e5', '#6366f1', '#a855f7', '#22c55e', '#eab308'],
  };
  confetti({ ...defaults, particleCount: 80, origin: { x: 0, y: 0.6 } });
  confetti({ ...defaults, particleCount: 80, origin: { x: 1, y: 0.6 } });
  setTimeout(() => {
    confetti({ ...defaults, particleCount: 60, spread: 100, origin: { x: 0.5, y: 0.4 } });
  }, 250);
}

function SuccessInner() {
  const params = useSearchParams();
  const id = params.get('id');
  const token = params.get('token');

  // phase: 'loading' (fetching record) | 'upload' (collect creatives) | 'done'
  const [phase, setPhase] = useState(id && token ? 'loading' : 'done');
  const [advertiser, setAdvertiser] = useState(null);

  useEffect(() => {
    fireConfetti();
  }, []);

  useEffect(() => {
    if (!id || !token) return;
    let cancelled = false;
    (async () => {
      try {
        const rec = await getAdvertiser(id, token);
        if (cancelled) return;
        setAdvertiser(rec);
        // Design-service customers don't upload — our team makes the ads.
        // Anyone else uploads now. (Defensive: if somehow not paid, just
        // show the terminal page.)
        if (rec?.design_service || rec?.payment_status !== 'paid') {
          clearDraft();
          setPhase('done');
        } else {
          setPhase('upload');
        }
      } catch {
        if (!cancelled) {
          clearDraft();
          setPhase('done');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, token]);

  const handleDone = () => {
    clearDraft();
    setPhase('done');
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (phase === 'loading') {
    return (
      <div className="max-w-xl w-full text-center py-20">
        <Loader2 className="w-10 h-10 text-indigo-600 mx-auto animate-spin" />
        <p className="text-gray-600 mt-4">Confirming your payment…</p>
      </div>
    );
  }

  if (phase === 'upload') {
    return (
      <div className="max-w-xl w-full text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg">
          <CheckCircle className="w-12 h-12 text-white" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-black text-gray-900">
            Payment confirmed! 🎉
          </h1>
          <p className="text-lg text-gray-600">
            One last step — upload your ad creatives so we can get your campaign
            live.
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <PostPaymentCreatives
            advertiserId={id}
            accessToken={token}
            hasCtv={!!advertiser?.has_ctv}
            initialCreatives={advertiser?.ad_creatives || []}
            onDone={handleDone}
          />
        </div>
      </div>
    );
  }

  // phase === 'done'
  return (
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

      {advertiser?.design_service && (
        <div className="flex items-center justify-center gap-2 text-sm text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3">
          <Palette className="w-4 h-4" />
          Our design team will create your ad creatives and reach out if they
          need anything.
        </div>
      )}

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
  );
}

export default function ApplicationSuccessPage() {
  return (
    <PublicShell>
      <div className="min-h-[80vh] bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex items-center justify-center px-4 py-12">
        <Suspense
          fallback={
            <div className="py-20 text-center">
              <Loader2 className="w-10 h-10 text-indigo-600 mx-auto animate-spin" />
            </div>
          }
        >
          <SuccessInner />
        </Suspense>
      </div>
    </PublicShell>
  );
}
