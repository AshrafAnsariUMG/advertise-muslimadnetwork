'use client';

/**
 * Trust-signal strip shown below the wizard, above the footer. Mirrors the
 * base44 reference's row of checkmark assurances.
 */
const SIGNALS = [
  'Real-Time Reporting',
  'Global Reach',
  'Verified Audience',
  'Transparent Pricing',
  '24/7 Support',
];

export default function TrustSignals() {
  return (
    <div className="mt-12 text-center">
      <p className="text-sm text-gray-500 mb-4 font-medium">
        Trusted by leading brands worldwide
      </p>
      <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-gray-400">
        {SIGNALS.map((signal) => (
          <span key={signal} className="inline-flex items-center gap-1">
            <span className="text-green-500">✓</span>
            {signal}
          </span>
        ))}
      </div>
    </div>
  );
}
