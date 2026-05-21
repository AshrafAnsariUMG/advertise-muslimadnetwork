'use client';

import { ChevronLeft, ShieldCheck } from 'lucide-react';

export default function PaymentCancelPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center">
          <ShieldCheck className="w-10 h-10 text-gray-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900">
          No charge was made
        </h1>

        <p className="text-gray-600">
          Your campaign draft is saved. You can come back and finish whenever
          you&apos;re ready — nothing has been billed.
        </p>

        <a
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Return to your draft
        </a>

        <p className="text-sm text-gray-500 pt-4 border-t border-gray-200">
          Questions? Email{' '}
          <a
            href="mailto:Sales@muslimadnetwork.com"
            className="text-indigo-600 hover:underline"
          >
            Sales@muslimadnetwork.com
          </a>
          .
        </p>
      </div>
    </div>
  );
}
