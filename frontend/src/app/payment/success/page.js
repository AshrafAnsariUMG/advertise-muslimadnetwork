'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, Loader2 } from 'lucide-react';
import { getAdvertiser, ApiError } from '@/lib/api';
import { loadDraft, clearDraft } from '@/lib/draft-storage';
import PublicShell from '@/components/layout/PublicShell';

const POLL_INTERVAL_MS = 2000;
const MAX_ATTEMPTS = 15; // 30 seconds total

/**
 * The inner component reads search params via `useSearchParams`, which Next.js
 * requires to be wrapped in a Suspense boundary so the static shell can be
 * prerendered without hitting the dynamic API.
 */
function PaymentSuccessInner() {
  const router = useRouter();
  const params = useSearchParams();
  const sessionId = params.get('session_id');

  const [status, setStatus] = useState('polling'); // 'polling' | 'paid' | 'timeout' | 'no-draft'

  // Carry the draft handle to the success page so it can authorize the
  // post-payment creative upload (falls back to bare URL if no draft).
  const draftForLink = loadDraft();
  const continueHref = draftForLink
    ? `/application-success?${new URLSearchParams({ id: draftForLink.id, token: draftForLink.token }).toString()}`
    : '/application-success';
  const attemptsRef = useRef(0);

  useEffect(() => {
    const draft = loadDraft();
    if (!draft) {
      setStatus('no-draft');
      return undefined;
    }

    let cancelled = false;
    let timer = null;

    const tick = async () => {
      if (cancelled) return;
      attemptsRef.current += 1;

      try {
        const record = await getAdvertiser(draft.id, draft.token);
        if (record?.payment_status === 'paid') {
          // Do NOT clear the draft yet — the success page needs the id+token
          // to authorize the post-payment creative upload. It clears the
          // draft once creatives are submitted (or design service was chosen).
          if (!cancelled) {
            setStatus('paid');
            const q = new URLSearchParams({ id: draft.id, token: draft.token }).toString();
            setTimeout(() => router.replace(`/application-success?${q}`), 600);
          }
          return;
        }
      } catch (err) {
        if (err instanceof ApiError && (err.status === 403 || err.status === 404)) {
          if (!cancelled) {
            clearDraft();
            setStatus('no-draft');
          }
          return;
        }
        // Network blip — keep trying until MAX_ATTEMPTS
      }

      if (attemptsRef.current >= MAX_ATTEMPTS) {
        if (!cancelled) setStatus('timeout');
        return;
      }

      timer = setTimeout(tick, POLL_INTERVAL_MS);
    };

    tick();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [router]);

  return (
    <div className="max-w-md w-full text-center space-y-6">
      {status === 'polling' && (
        <>
          <Loader2 className="w-16 h-16 text-indigo-600 mx-auto animate-spin" />
          <h1 className="text-2xl font-bold text-gray-900">
            Confirming your payment…
          </h1>
          <p className="text-gray-600">
            We&apos;re double-checking with Stripe. This usually takes a few
            seconds.
          </p>
        </>
      )}

      {status === 'paid' && (
        <>
          <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Payment confirmed!
          </h1>
          <p className="text-gray-600">Redirecting you to your confirmation…</p>
        </>
      )}

      {(status === 'timeout' || status === 'no-draft') && (
        <>
          <CheckCircle className="w-16 h-16 text-indigo-600 mx-auto" />
          <h1 className="text-2xl font-bold text-gray-900">
            Your payment is being processed
          </h1>
          <p className="text-gray-600">
            You&apos;ll receive an email confirmation shortly. You can close
            this tab or continue to the confirmation page.
          </p>
          <a
            href={continueHref}
            className="inline-block px-6 py-3 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
          >
            Continue
          </a>
        </>
      )}

      {sessionId && status !== 'paid' && (
        <p className="text-xs text-gray-400 break-all">Reference: {sessionId}</p>
      )}
    </div>
  );
}

function PollingFallback() {
  return (
    <div className="max-w-md w-full text-center space-y-6">
      <Loader2 className="w-16 h-16 text-indigo-600 mx-auto animate-spin" />
      <h1 className="text-2xl font-bold text-gray-900">
        Confirming your payment…
      </h1>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <PublicShell bare>
      <div className="min-h-[80vh] bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex items-center justify-center px-4 py-16">
        <Suspense fallback={<PollingFallback />}>
          <PaymentSuccessInner />
        </Suspense>
      </div>
    </PublicShell>
  );
}
