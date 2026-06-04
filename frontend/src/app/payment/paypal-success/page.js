'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { capturePaypalOrder } from '@/lib/api';
import { loadDraft } from '@/lib/draft-storage';
import PublicShell from '@/components/layout/PublicShell';

/**
 * PayPal redirect landing.
 *
 * PayPal sends the user back here with ?token=ORDER_ID&PayerID=... after
 * they approve the payment. The user is NOT yet charged — we have to
 * synchronously call our capture endpoint to actually move the money.
 * Once capture returns "paid" we forward to /application-success; failures
 * land on /payment/cancel so they can try again.
 */
function PaypalSuccessInner() {
  const router = useRouter();
  const params = useSearchParams();
  const orderId = params.get('token');

  const [phase, setPhase] = useState('capturing'); // 'capturing' | 'error'
  const [errorMsg, setErrorMsg] = useState('');
  // Capture runs exactly once even if React strict-mode re-mounts the effect.
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const draft = loadDraft();

    if (!orderId || !draft) {
      setErrorMsg(
        !orderId
          ? 'No PayPal order reference was returned. Please start the payment again.'
          : 'We could not find your draft on this device. Please contact support.'
      );
      setPhase('error');
      return;
    }

    (async () => {
      try {
        const result = await capturePaypalOrder(
          draft.id,
          draft.token,
          orderId
        );
        if (result?.status === 'paid') {
          // Keep the draft handle so the success page can authorize the
          // post-payment creative upload; it clears the draft afterward.
          const q = new URLSearchParams({ id: draft.id, token: draft.token }).toString();
          router.replace(`/application-success?${q}`);
          return;
        }
        // PayPal acknowledged but didn't complete — fall through to cancel
        router.replace('/payment/cancel?reason=paypal_failed');
      } catch (err) {
        // Network error / 5xx — send the user to cancel with a friendly
        // reason; the webhook is still the safety net if PayPal already
        // moved the money on their side.
        router.replace('/payment/cancel?reason=paypal_failed');
        // Swallow — we've already navigated away
        void err;
      }
    })();
  }, [orderId, router]);

  if (phase === 'error') {
    return (
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 flex items-center justify-center">
          <AlertTriangle className="w-10 h-10 text-amber-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          Something went wrong
        </h1>
        <p className="text-gray-600">{errorMsg}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="/"
            className="inline-block px-6 py-3 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
          >
            Return to your draft
          </a>
          <a
            href="mailto:Sales@muslimadnetwork.com"
            className="inline-block px-6 py-3 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Contact support
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md w-full text-center space-y-6">
      <Loader2 className="w-16 h-16 text-indigo-600 mx-auto animate-spin" />
      <h1 className="text-2xl font-bold text-gray-900">
        Confirming your payment with PayPal…
      </h1>
      <p className="text-gray-600">This usually takes just a second.</p>
    </div>
  );
}

function CapturingFallback() {
  return (
    <div className="max-w-md w-full text-center space-y-6">
      <Loader2 className="w-16 h-16 text-indigo-600 mx-auto animate-spin" />
      <h1 className="text-2xl font-bold text-gray-900">
        Confirming your payment with PayPal…
      </h1>
    </div>
  );
}

export default function PaypalSuccessPage() {
  return (
    <PublicShell bare>
      <div className="min-h-[80vh] bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex items-center justify-center px-4 py-16">
        <Suspense fallback={<CapturingFallback />}>
          <PaypalSuccessInner />
        </Suspense>
      </div>
    </PublicShell>
  );
}
