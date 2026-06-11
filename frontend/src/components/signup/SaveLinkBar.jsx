'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Check, Copy, Mail, Link as LinkIcon } from 'lucide-react';
import { emailDraftLink } from '@/lib/api';

/**
 * "Your draft is saved — pick up where you left off later" affordance.
 *
 * Appears on Step 1 once the first auto-save has created the draft (so we
 * have an id + token). Surfaces the resume URL immediately instead of making
 * the user wait 24h for the abandoned-cart email. Two actions:
 *   - Copy link to clipboard
 *   - Email the link to their contact_email
 *
 * The resume URL is built client-side from the current origin so it's always
 * correct regardless of staging vs production host.
 */
export default function SaveLinkBar({
  advertiserId,
  accessToken,
  hasEmail,
  testMode = false,
}) {
  const [copied, setCopied] = useState(false);
  const [emailing, setEmailing] = useState(false);

  if (!advertiserId || !accessToken) return null;

  // Resume back into the same environment the draft was started in.
  const basePath = testMode ? '/ssco-test' : '/';
  const resumeUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${basePath}?return=${advertiserId}&token=${accessToken}`
      : '';

  const handleCopy = async () => {
    const markCopied = () => {
      setCopied(true);
      toast.success('Link copied — paste it anywhere to continue later.');
      setTimeout(() => setCopied(false), 2500);
    };

    // navigator.clipboard only exists in a secure context (HTTPS or
    // localhost). On plain-HTTP (e.g. the staging IP) it's undefined, so we
    // fall back to the legacy execCommand('copy') via a hidden textarea.
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(resumeUrl);
        markCopied();
        return;
      }
      throw new Error('clipboard API unavailable');
    } catch {
      try {
        const ta = document.createElement('textarea');
        ta.value = resumeUrl;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.top = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        if (ok) {
          markCopied();
          return;
        }
        throw new Error('execCommand failed');
      } catch {
        toast.error('Could not copy. Select and copy the link manually.');
      }
    }
  };

  const handleEmail = async () => {
    if (!hasEmail) {
      toast.error('Add your email above first so we know where to send it.');
      return;
    }
    setEmailing(true);
    try {
      await emailDraftLink(advertiserId, accessToken);
      toast.success('Sent! Check your inbox for the link to continue.');
    } catch (err) {
      toast.error(err?.message || 'Could not send the link. Please try again.');
    } finally {
      setEmailing(false);
    }
  };

  return (
    <div className="mt-6 rounded-lg border border-indigo-100 bg-indigo-50/50 p-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
          <LinkIcon className="w-4 h-4 text-indigo-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">
            Your progress is saved
          </p>
          <p className="text-xs text-gray-600 mt-0.5">
            Keep this link to pick up where you left off — on any device, for
            up to 90 days.
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy link
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleEmail}
              disabled={emailing}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50 transition-colors disabled:opacity-60"
            >
              <Mail className="w-3.5 h-3.5" />
              {emailing ? 'Sending…' : 'Email me this link'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
