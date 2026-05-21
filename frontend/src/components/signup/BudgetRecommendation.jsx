'use client';

import { Plus, CheckCircle } from 'lucide-react';

// Per-industry recommended monthly budgets. Values match the base44 reference
// (INDUSTRY_BENCHMARKS) so the dollar suggestions don't shift mid-migration.
const INDUSTRY_BENCHMARKS = {
  halal_food: { recommended: 1000, label: 'Halal Food & Beverage' },
  restaurant: { recommended: 1500, label: 'Restaurant (Local)' },
  islamic_education: { recommended: 800, label: 'Islamic Education' },
  fashion_modest_wear: { recommended: 1200, label: 'Fashion & Modest Wear' },
  travel_hajj_umrah: { recommended: 2000, label: 'Travel, Hajj & Umrah' },
  finance_islamic_banking: {
    recommended: 2500,
    label: 'Finance & Islamic Banking',
  },
  technology: { recommended: 1500, label: 'Technology' },
  healthcare: { recommended: 1200, label: 'Healthcare' },
  real_estate: { recommended: 1800, label: 'Real Estate' },
  charity_nonprofit: { recommended: 1000, label: 'Charity & Non-Profit' },
  other: { recommended: 1000, label: 'Other' },
};

export default function BudgetRecommendation({
  businessType,
  currentBudget,
  onBudgetChange,
}) {
  if (!businessType) return null;

  const benchmark = INDUSTRY_BENCHMARKS[businessType];
  if (!benchmark || (currentBudget && currentBudget >= benchmark.recommended)) {
    return null;
  }

  const safeCurrent = currentBudget || 0;
  const difference = benchmark.recommended - safeCurrent;
  const percentageLift =
    safeCurrent > 0
      ? Math.abs(Math.round((difference / safeCurrent) * 100))
      : null;

  return (
    <div className="mt-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
      <div className="flex items-start gap-3">
        <Plus className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-semibold text-green-900 text-sm">
            Recommended budget for {benchmark.label}:{' '}
            <span className="text-green-700">
              ${benchmark.recommended}/month
            </span>
          </p>
          {percentageLift !== null && (
            <p className="text-xs text-green-700 mt-1">
              Brands in your industry see {percentageLift}% higher engagement at
              this level. You&apos;ll reach more qualified Muslim consumers.
            </p>
          )}
          <button
            type="button"
            onClick={() => onBudgetChange(benchmark.recommended)}
            className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 hover:text-green-900 bg-white hover:bg-green-100 px-3 py-1.5 rounded transition-colors border border-green-300"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            Apply Recommendation
          </button>
        </div>
      </div>
    </div>
  );
}
