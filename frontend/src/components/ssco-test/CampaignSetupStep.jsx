'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Target,
  DollarSign,
  MapPin,
  Calendar,
  Eye,
  MousePointerClick,
  Users,
  Sparkles,
  Tv,
  Monitor,
  CheckCircle2,
} from 'lucide-react';

// Leaflet relies on `window`/`document`, so the picker is loaded only on the
// client — never during SSR/prerender.
const LocationPicker = dynamic(() => import('@/components/signup/LocationPicker'), {
  ssr: false,
  loading: () => (
    <div className="h-96 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center text-sm text-gray-500">
      Loading map…
    </div>
  ),
});

// Select option maps — `items` drives the base-ui trigger label (otherwise
// the trigger shows the raw value). The same arrays render the popup items.
const OBJECTIVE_OPTIONS = [
  { value: 'brand_awareness', label: 'Brand Awareness' },
  { value: 'website_traffic', label: 'Website Traffic' },
  { value: 'lead_generation', label: 'Lead Generation' },
  { value: 'donations', label: 'Donations' },
  { value: 'product_sales', label: 'Product Sales' },
  { value: 'app_installs', label: 'App Installs' },
  { value: 'event_promotion', label: 'Event Promotion' },
  { value: 'drive_foot_traffic', label: 'Drive Foot Traffic' },
];
const AGE_OPTIONS = [
  { value: '18-24', label: '18-24 years' },
  { value: '25-34', label: '25-34 years' },
  { value: '35-44', label: '35-44 years' },
  { value: '45-54', label: '45-54 years' },
  { value: '55+', label: '55+ years' },
  { value: 'all', label: 'All ages' },
];
const GENDER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
];

// Geographic targeting buckets — matches base44's clickable badge row.
const GEO_OPTIONS = [
  'Global',
  'North America',
  'Middle East',
  'Europe',
  'Asia',
  'Africa',
  'US',
  'Canada',
  'UK',
];

// Minimum campaign length. End date auto-fills to start + this, and can't be
// set earlier than that.
const MIN_CAMPAIGN_DAYS = 30;

// Add days to a YYYY-MM-DD string, parsing/formatting in LOCAL time to avoid
// the new Date('YYYY-MM-DD')=UTC-midnight off-by-one in non-UTC timezones.
function addDays(dateStr, days) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return '';
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

// Pricing constants — must match base44 reference for parity with the live
// site until cutover.
const CPM = 5;
const COST_PER_CLICK = 2;
const CTR = 0.00167;
const MIN_REACH_PERCENTAGE = 0.067;
const MAX_REACH_PERCENTAGE = 0.1;

// Premium add-ons (CTV + MasjidConnect) require a $1,500 minimum budget.
const ADDON_MIN_BUDGET = 1500;

// MasjidConnect (DOOH) masjid placements: base 2 masjids at $1,500, doubling
// for each additional $2,500 spent above that. Matches the base44 export.
function masjidCountFor(budget) {
  const b = Number(budget) || 0;
  const increments = Math.floor(Math.max(0, b - ADDON_MIN_BUDGET) / 2500);
  return 2 * Math.pow(2, increments);
}

function getColorScheme(budget) {
  if (budget < 500) {
    return {
      gradient: 'from-blue-400 to-blue-500',
      bg: 'bg-blue-50/50',
      border: 'border-blue-200',
      text: 'text-blue-600',
      icon: 'text-blue-600',
    };
  } else if (budget < 1500) {
    return {
      gradient: 'from-indigo-500 to-indigo-600',
      bg: 'bg-indigo-50/50',
      border: 'border-indigo-200',
      text: 'text-indigo-600',
      icon: 'text-indigo-600',
    };
  }
  return {
    gradient: 'from-purple-500 to-indigo-600',
    bg: 'bg-gradient-to-br from-purple-50 to-indigo-50',
    border: 'border-purple-300',
    text: 'text-purple-600',
    icon: 'text-purple-600',
  };
}

export default function CampaignSetupStep({
  formData,
  updateFormData,
  testMode = false,
}) {
  // Defaults — only applied on first mount when the field is empty.
  useEffect(() => {
    const updates = {};

    if (!formData.campaign_start_date) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 2);
      updates.campaign_start_date = startDate.toISOString().split('T')[0];
    }

    const effectiveStartDate =
      updates.campaign_start_date || formData.campaign_start_date;

    if (!formData.campaign_end_date && effectiveStartDate) {
      const endDate = new Date(effectiveStartDate);
      endDate.setDate(endDate.getDate() + 30);
      updates.campaign_end_date = endDate.toISOString().split('T')[0];
    }

    if (!formData.monthly_budget) {
      updates.monthly_budget = 500;
    }

    if (!formData.campaign_objective) {
      updates.campaign_objective = 'brand_awareness';
    }

    if (
      formData.business_type !== 'restaurant' &&
      (!formData.target_countries || formData.target_countries.length === 0)
    ) {
      updates.target_countries = ['Global'];
    }

    if (Object.keys(updates).length > 0) {
      updateFormData(updates);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Toggle a geo bucket in/out of target_countries (base44 badge behavior).
  const toggleCountry = (country) => {
    const current = formData.target_countries || [];
    const updated = current.includes(country)
      ? current.filter((c) => c !== country)
      : [...current, country];
    updateFormData({ target_countries: updated });
  };

  // Omnichannel budget logic (base44 parity): at ≥$1,500 the premium add-ons
  // light up; below that they switch off. CTV is only offered for
  // brand_awareness (that's the only objective whose CTV toggle is visible),
  // so we only auto-enable has_ctv there. MasjidConnect is gated behind
  // testMode — it's not live to the public yet (only on /ssco-test).
  const applyBudgetSideEffects = (budget) => {
    const updates = { monthly_budget: budget };
    const ctvEligible =
      !formData.campaign_objective ||
      formData.campaign_objective === 'brand_awareness';
    if (budget >= ADDON_MIN_BUDGET) {
      if (testMode) updates.has_masjidconnect = true;
      if (ctvEligible) updates.has_ctv = true;
    } else {
      updates.has_ctv = false;
      if (testMode) updates.has_masjidconnect = false;
    }
    return updates;
  };

  const calculateMetrics = () => {
    const budget = formData.monthly_budget || 0;
    const objective = formData.campaign_objective;
    const isRecommendedPlan = budget === 500;
    const bonus = isRecommendedPlan ? 1.2 : 1;

    if (objective === 'drive_foot_traffic') {
      const multiplier = budget / 250;
      const adViews = Math.round(50000 * multiplier * bonus);
      const minVisits = Math.floor(15 * multiplier * bonus);
      const maxVisits = Math.floor(30 * multiplier * bonus);

      return {
        isDriveFootTraffic: true,
        adViews,
        minVisits,
        maxVisits,
        totalImpressions: 0,
        totalClicks: 0,
        minPotentialLeads: 0,
        maxPotentialLeads: 0,
        minReach: 0,
        maxReach: 0,
        isWebsiteTraffic: false,
        showLeadProjections: false,
        hasBonus: isRecommendedPlan,
      };
    }

    let totalImpressions;
    let totalClicks;

    if (
      objective === 'website_traffic' ||
      objective === 'app_installs' ||
      objective === 'lead_generation' ||
      objective === 'donations'
    ) {
      totalClicks = Math.floor((budget / COST_PER_CLICK) * bonus);
      totalImpressions = Math.round(totalClicks / CTR / 10000) * 10000;
    } else {
      totalImpressions = Math.round(((budget / CPM) * 1000 * bonus) / 10000) * 10000;
      totalClicks = Math.floor(totalImpressions * CTR);
    }

    const showLeadProjections =
      objective === 'lead_generation' ||
      objective === 'app_installs' ||
      objective === 'donations';

    const minConversionRate = objective === 'lead_generation' ? 0.05 : 0.02;
    const maxConversionRate = objective === 'lead_generation' ? 0.1 : 0.05;
    const minPotentialLeads = Math.floor(totalClicks * minConversionRate);
    const maxPotentialLeads = Math.floor(totalClicks * maxConversionRate);

    return {
      totalImpressions,
      totalClicks,
      minPotentialLeads,
      maxPotentialLeads,
      minReach: Math.floor(totalImpressions * MIN_REACH_PERCENTAGE),
      maxReach: Math.floor(totalImpressions * MAX_REACH_PERCENTAGE),
      isWebsiteTraffic:
        objective === 'website_traffic' ||
        objective === 'app_installs' ||
        objective === 'donations',
      showLeadProjections,
      isDriveFootTraffic: false,
      hasBonus: isRecommendedPlan,
    };
  };

  const metrics = calculateMetrics();

  // CTV scaling — base44 parity
  const ctvBudget = formData.monthly_budget || 1500;
  const tvViewsPerDollar = 50000 / 1500;
  const ctvTvViews = Math.round((ctvBudget * tvViewsPerDollar) / 10000) * 10000;
  const ctvDigitalViews =
    Math.round(((ctvBudget * (2 / 3)) / CPM) * 1000 / 10000) * 10000;
  const ctvTotalViews = ctvDigitalViews + ctvTvViews;

  // Slider always spans $250–$10,000; dragging below $1,500 turns the add-ons
  // off (via applyBudgetSideEffects), matching the base44 omnichannel model.
  const budgetMin = 250;
  const budgetMax = 10000;

  const colors = getColorScheme(Number(formData.monthly_budget) || 500);

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="text-center mb-10">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl flex items-center justify-center">
          <Target className="w-8 h-8 text-indigo-600" />
        </div>
        <h2 className="text-3xl font-black text-gray-900 mb-2">
          Build your campaign
        </h2>
        <p className="text-gray-600 text-lg">
          Let&apos;s define your goals and target audience
        </p>
      </div>

      {/* Campaign Basics */}
      <div className="space-y-6 pb-8 border-b-2 border-gray-200">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label
              htmlFor="campaign_name"
              className="text-gray-900 font-medium"
            >
              Campaign Name *
            </Label>
            <Input
              id="campaign_name"
              value={formData.campaign_name || ''}
              onChange={(e) =>
                updateFormData({ campaign_name: e.target.value })
              }
              placeholder="e.g., Ramadan 2025 Campaign"
              className="h-12"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="campaign_objective"
              className="text-gray-900 font-medium"
            >
              Campaign Objective *
            </Label>
            <Select
              items={OBJECTIVE_OPTIONS}
              value={formData.campaign_objective || 'brand_awareness'}
              onValueChange={(value) => {
                const clickObjectives = [
                  'website_traffic',
                  'app_installs',
                  'lead_generation',
                  'donations',
                ];
                const purchaseType = clickObjectives.includes(value)
                  ? 'clicks'
                  : 'impressions';
                updateFormData({
                  campaign_objective: value,
                  purchase_type: purchaseType,
                });
              }}
            >
              <SelectTrigger id="campaign_objective" className="h-12 w-full">
                <SelectValue placeholder="Select objective" />
              </SelectTrigger>
              <SelectContent>
                {OBJECTIVE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {formData.campaign_objective === 'drive_foot_traffic' && (
          <div className="space-y-2 p-4 bg-green-50 border-2 border-green-200 rounded-lg mt-4">
            <Label
              htmlFor="campaign_offer"
              className="text-gray-900 font-medium flex items-center gap-2"
            >
              <span className="text-lg">🎁</span>
              What special offer are you promoting? *
            </Label>
            <Input
              id="campaign_offer"
              value={formData.campaign_offer || ''}
              onChange={(e) =>
                updateFormData({ campaign_offer: e.target.value })
              }
              placeholder="e.g., BOGO meal, 20% off dinner, Free appetizer with entree"
              className="h-12 bg-white"
            />
            <p className="text-sm text-gray-600">
              💡 Tip: A compelling offer increases foot traffic. Be specific and
              clear!
            </p>
          </div>
        )}
      </div>

      {/* Budget Section */}
      <div className="space-y-6 pb-8 border-b-2 border-gray-200">
        <Label
          htmlFor="monthly_budget"
          className={`font-medium text-lg flex items-center gap-2 ${colors.text}`}
        >
          <DollarSign className={`w-5 h-5 ${colors.icon}`} />
          Monthly Budget:{' '}
          <span className="font-bold">
            ${(Number(formData.monthly_budget) || 500).toLocaleString()}
          </span>{' '}
          USD *
        </Label>

        <p className="text-gray-600 text-center">
          Pick a plan or slide to the number that fits your goals
        </p>

        {/* Budget Presets */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {[
            { value: 250, label: 'Starter', sub: 'Test & Learn' },
            {
              value: 500,
              label: 'Recommended',
              sub: 'Best Value',
              recommended: true,
            },
            { value: 1000, label: 'Growth', sub: 'Scale Up' },
            { value: 2500, label: 'Premium', sub: 'Maximum Impact' },
          ].map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() =>
                updateFormData(applyBudgetSideEffects(preset.value))
              }
              className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                Number(formData.monthly_budget) === preset.value
                  ? `${colors.border} ${colors.bg} shadow-md`
                  : 'border-gray-200 hover:border-indigo-300 bg-white'
              }`}
            >
              {preset.recommended && (
                <div className="absolute -top-2 -right-2">
                  <Badge className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-0 shadow-lg flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Recommended
                  </Badge>
                </div>
              )}
              <div
                className={`font-bold text-xl mb-1 ${
                  Number(formData.monthly_budget) === preset.value
                    ? colors.text
                    : 'text-indigo-600'
                }`}
              >
                ${preset.value.toLocaleString()}
              </div>
              <div className="text-xs font-semibold text-gray-900">
                {preset.label}
              </div>
              <div className="text-xs text-gray-500">{preset.sub}</div>
            </button>
          ))}
        </div>

        {(formData.has_ctv || formData.has_masjidconnect) && (
          <p className="text-xs text-purple-600 text-center -mt-2 mb-1">
            {testMode
              ? 'Minimum $1,500/month required for premium add-ons (CTV / MasjidConnect)'
              : 'Minimum $1,500/month required for Streaming TV Ads'}
          </p>
        )}

        <div className="relative py-2">
          {/* ⭐ omnichannel milestone at $2,500 — left = (2500-250)/(10000-250) */}
          <div
            className="pointer-events-none absolute -top-1 z-10 flex flex-col items-center"
            style={{ left: 'calc(23.08% - 8px)' }}
          >
            <span className="text-sm leading-none">⭐</span>
          </div>
          <Slider
            id="monthly_budget"
            value={[Number(formData.monthly_budget) || 500]}
            onValueChange={(value) => {
              // base-ui emits a scalar for single-thumb sliders (unlike
              // Radix, which always emits an array). Handle both shapes and
              // never write undefined/NaN — doing so would trip the `|| 500`
              // fallback and snap the thumb back to 500 mid-drag.
              const next = Array.isArray(value) ? value[0] : value;
              if (typeof next === 'number' && !Number.isNaN(next)) {
                updateFormData(applyBudgetSideEffects(next));
              }
            }}
            min={budgetMin}
            max={budgetMax}
            step={250}
            className="w-full"
            indicatorClassName={`bg-gradient-to-r ${colors.gradient}`}
          />
        </div>
        <div className="flex justify-between text-sm text-gray-500">
          <span>$250</span>
          <span>$2,500</span>
          <span>$5,000</span>
          <span>$7,500</span>
          <span>$10,000</span>
        </div>

        {/* Performance Estimate */}
        {formData.monthly_budget > 0 && formData.campaign_objective && (
          <Card
            className={`${colors.bg} ${colors.border} border-2 mt-6 transition-all duration-300`}
          >
            <CardContent className="p-6">
              <div className="text-center mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-1">
                  Monthly Campaign Performance Estimate
                </h3>
                {metrics.hasBonus && (
                  <Badge className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-0 shadow-md mt-2">
                    <Sparkles className="w-3 h-3 mr-1" />
                    +20% Bonus Included
                  </Badge>
                )}
              </div>

              {formData.has_ctv &&
              formData.campaign_objective === 'brand_awareness' ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                    <div>
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Eye className="w-4 h-4 text-indigo-500" />
                        <p className="text-xs text-gray-600">Digital Ad Views</p>
                      </div>
                      <p className="text-2xl font-bold text-indigo-600">
                        {ctvDigitalViews.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Tv className="w-4 h-4 text-purple-600" />
                        <p className="text-xs text-gray-600">TV Ad Views</p>
                      </div>
                      <p className="text-2xl font-bold text-purple-600">
                        {ctvTvViews.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Sparkles className="w-4 h-4 text-pink-600" />
                        <p className="text-xs text-gray-600">Total Views</p>
                      </div>
                      <p className="text-2xl font-bold text-pink-600">
                        {ctvTotalViews.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="border-t pt-4 text-center">
                    <div className="flex items-center justify-center gap-1 mb-2">
                      <Users className="w-4 h-4 text-indigo-600" />
                      <p className="text-sm text-gray-600">
                        Est Muslim Audience Reach
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-indigo-600">
                      {Math.floor(
                        ctvTotalViews * MIN_REACH_PERCENTAGE
                      ).toLocaleString()}{' '}
                      -{' '}
                      {Math.floor(
                        ctvTotalViews * MAX_REACH_PERCENTAGE
                      ).toLocaleString()}
                    </p>
                  </div>
                  <p className="text-xs text-center text-gray-400">
                    TV ads appear on streaming platforms and Smart TVs.
                  </p>
                </div>
              ) : metrics.isDriveFootTraffic ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-2">
                      <Eye className={`w-4 h-4 ${colors.icon}`} />
                      <p className="text-sm text-gray-600">
                        Monthly Total Ad Views
                      </p>
                    </div>
                    <p className={`text-2xl sm:text-3xl font-bold break-words ${colors.text}`}>
                      {metrics.adViews.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-2">
                      <Users className="w-4 h-4 text-green-600" />
                      <p className="text-sm text-gray-600">Estimated Visits</p>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold break-words text-green-600">
                      {metrics.minVisits.toLocaleString()}–
                      {metrics.maxVisits.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">customers</p>
                  </div>
                </div>
              ) : metrics.isWebsiteTraffic ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-2">
                      <MousePointerClick className={`w-4 h-4 ${colors.icon}`} />
                      <p className="text-sm text-gray-600">Total Clicks</p>
                    </div>
                    <p className={`text-2xl sm:text-3xl font-bold break-words ${colors.text}`}>
                      {metrics.totalClicks.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-2">
                      <Eye className={`w-4 h-4 ${colors.icon}`} />
                      <p className="text-sm text-gray-600">
                        Monthly Total Ad Views
                      </p>
                    </div>
                    <p className={`text-2xl sm:text-3xl font-bold break-words ${colors.text}`}>
                      {metrics.totalImpressions.toLocaleString()}
                    </p>
                  </div>
                </div>
              ) : metrics.showLeadProjections ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-2">
                      <MousePointerClick className={`w-4 h-4 ${colors.icon}`} />
                      <p className="text-sm text-gray-600">Total Clicks</p>
                    </div>
                    <p className={`text-2xl sm:text-3xl font-bold break-words ${colors.text}`}>
                      {metrics.totalClicks.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-2">
                      <Users className="w-4 h-4 text-green-600" />
                      <p className="text-sm text-gray-600">Expected Leads</p>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold break-words text-green-600">
                      {metrics.minPotentialLeads.toLocaleString()} -{' '}
                      {metrics.maxPotentialLeads.toLocaleString()}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-2">
                      <Eye className={`w-4 h-4 ${colors.icon}`} />
                      <p className="text-sm text-gray-600">
                        Monthly Total Ad Views
                      </p>
                    </div>
                    <p className={`text-2xl sm:text-3xl font-bold break-words ${colors.text}`}>
                      {metrics.totalImpressions.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-2">
                      <Users className={`w-4 h-4 ${colors.icon}`} />
                      <p className="text-sm text-gray-600">
                        Est Muslim Audience Reach
                      </p>
                    </div>
                    <p className={`text-2xl sm:text-3xl font-bold break-words ${colors.text}`}>
                      {metrics.minReach.toLocaleString()} -{' '}
                      {metrics.maxReach.toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              {/* MasjidConnect placements — appended under whichever metric
                  branch rendered, whenever the add-on is enabled. */}
              {testMode && formData.has_masjidconnect && (
                <div className="mt-4 pt-4 border-t border-indigo-100 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Monitor className="w-4 h-4 text-indigo-600" />
                    <p className="text-sm text-gray-600">
                      Masjid Screen Placements
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-indigo-600">
                    {masjidCountFor(formData.monthly_budget)} Masjid
                    {masjidCountFor(formData.monthly_budget) > 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    50 min daily screen time per masjid
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

        {/* CTV add-on — brand_awareness only */}
        {(formData.campaign_objective === 'brand_awareness' ||
          !formData.campaign_objective) && (
          <div
            className={`mt-4 rounded-xl border-2 transition-all ${
              formData.has_ctv
                ? 'border-purple-300 bg-white'
                : 'border-purple-200 bg-purple-50/50'
            }`}
          >
            <div className="p-6">
              <div className="flex flex-col md:flex-row items-stretch md:items-start gap-4 md:gap-6 mb-6">
                <div className="flex items-start gap-4 flex-1">
                  <Checkbox
                    id="has_ctv"
                    checked={!!formData.has_ctv}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        updateFormData({
                          has_ctv: true,
                          monthly_budget: 1500,
                        });
                      } else {
                        updateFormData({ has_ctv: false });
                      }
                    }}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <label
                      htmlFor="has_ctv"
                      className="flex items-center gap-2 cursor-pointer mb-2"
                    >
                      <div className="w-6 h-6 rounded bg-purple-100 flex items-center justify-center">
                        <Tv className="w-4 h-4 text-purple-600" />
                      </div>
                      <span className="font-bold text-gray-900">
                        Add Streaming TV Ads (CTV)
                      </span>
                      <Badge className="bg-purple-100 text-purple-700 border-0 ml-2">
                        Premium
                      </Badge>
                    </label>
                    <p className="text-sm font-semibold text-purple-600 mb-2">
                      Get your ad on the big screen.
                    </p>
                    <p className="text-sm text-gray-600 mb-3">
                      Reach Muslim households on Smart TVs through top streaming
                      platforms.
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Brand-colored chips — self-contained, no external
                          logo assets (avoids the base44 CDN dependency). */}
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-[#1ce783] text-black text-xs font-extrabold tracking-tight">
                        hulu
                      </span>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-black text-white text-xs font-bold tracking-tight">
                        peacock
                      </span>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-[#662d91] text-white text-xs font-bold tracking-tight">
                        Roku
                      </span>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-[#e5a00d] text-black text-xs font-bold tracking-tight">
                        Plex
                      </span>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-[#ff0000] text-white text-xs font-bold tracking-tight">
                        YouTube
                      </span>
                      <span className="text-xs text-gray-600">&amp; more</span>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-4 text-center w-full md:w-auto md:min-w-fit">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-purple-600" />
                    <span className="text-2xl font-bold text-purple-600">
                      50,000+
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">TV ad views</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Minimum with $1,500 budget
                  </p>
                </div>
              </div>

              <div className="bg-purple-50 rounded-lg p-4 mb-4 flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3 h-3 text-white" />
                </div>
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">
                    Premium, brand-safe TV environments
                  </span>
                  <span className="mx-2">•</span>
                  <span className="font-semibold">High impact</span>
                  <span className="mx-2">•</span>
                  <span className="font-semibold">Builds trust & awareness</span>
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-600">
                <div className="w-4 h-4 rounded-full border-2 border-purple-500 flex items-center justify-center flex-shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                </div>
                <span>Requires minimum budget of $1,500</span>
              </div>
            </div>
          </div>
        )}

        {/* MasjidConnect (DOOH) add-on — gated behind testMode (not public yet;
            visible only on /ssco-test). Shown for all objectives. */}
        {testMode && (
        <div
          className={`mt-4 rounded-xl border-2 transition-all ${
            formData.has_masjidconnect
              ? 'border-indigo-300 bg-white'
              : 'border-indigo-200 bg-indigo-50/50'
          }`}
        >
          <div className="p-6">
            <div className="flex flex-col md:flex-row items-stretch md:items-start gap-4 md:gap-6">
              <div className="flex items-start gap-4 flex-1">
                <Checkbox
                  id="has_masjidconnect"
                  checked={!!formData.has_masjidconnect}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      updateFormData({
                        has_masjidconnect: true,
                        monthly_budget: Math.max(
                          Number(formData.monthly_budget) || 0,
                          ADDON_MIN_BUDGET
                        ),
                      });
                    } else {
                      updateFormData({ has_masjidconnect: false });
                    }
                  }}
                  className="mt-1"
                />
                <div className="flex-1">
                  <label
                    htmlFor="has_masjidconnect"
                    className="flex items-center gap-2 cursor-pointer mb-2"
                  >
                    <div className="w-6 h-6 rounded bg-indigo-100 flex items-center justify-center">
                      <Monitor className="w-4 h-4 text-indigo-600" />
                    </div>
                    <span className="font-bold text-gray-900">
                      Add Masjid Digital Screens (MasjidConnect)
                    </span>
                    <Badge className="bg-indigo-100 text-indigo-700 border-0 ml-2">
                      Premium
                    </Badge>
                  </label>
                  <p className="text-sm font-semibold text-indigo-600 mb-2">
                    Bring your brand into the heart of the community.
                  </p>
                  <p className="text-sm text-gray-600">
                    Reach local audiences on high-visibility digital screens
                    inside trusted neighborhood masjids during peak community
                    hours.
                  </p>
                </div>
              </div>

              <div className="bg-indigo-50 rounded-lg p-4 text-center w-full md:w-auto md:min-w-fit">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Monitor className="w-5 h-5 text-indigo-600" />
                  <span className="text-2xl font-bold text-indigo-600">
                    {masjidCountFor(formData.monthly_budget)} Masjid
                    {masjidCountFor(formData.monthly_budget) > 1 ? 's' : ''}
                  </span>
                </div>
                <p className="text-sm font-semibold text-indigo-700">
                  50 min daily screen time
                </p>
                <p className="text-xs text-gray-500 mt-1">per masjid</p>
                {(Number(formData.monthly_budget) || 0) >= 2500 && (
                  <p className="text-xs text-purple-600 font-semibold mt-2">
                    ⭐ Unlocked at $2,500
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs text-gray-600">
              <div className="w-4 h-4 rounded-full border-2 border-indigo-500 flex items-center justify-center flex-shrink-0">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              </div>
              <span>Requires minimum budget of $1,500</span>
            </div>
          </div>
        </div>
        )}

      {/* Campaign Dates */}
      <div className="space-y-6 pb-8 border-b-2 border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-indigo-600" />
          <h3 className="text-xl font-bold text-gray-900">Campaign Duration</h3>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label
              htmlFor="campaign_start_date"
              className="text-gray-900 font-medium"
            >
              Campaign Start Date *
            </Label>
            <Input
              id="campaign_start_date"
              type="date"
              value={formData.campaign_start_date || ''}
              onChange={(e) =>
                // Auto-fill the end date to start + 30 days whenever the start
                // changes (the end is then editable forward, but not earlier).
                updateFormData({
                  campaign_start_date: e.target.value,
                  campaign_end_date: addDays(e.target.value, MIN_CAMPAIGN_DAYS),
                })
              }
              className="h-12"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="campaign_end_date"
              className="text-gray-900 font-medium"
            >
              Campaign End Date *
            </Label>
            <Input
              id="campaign_end_date"
              type="date"
              value={formData.campaign_end_date || ''}
              onChange={(e) =>
                updateFormData({ campaign_end_date: e.target.value })
              }
              className="h-12"
              // Can't end earlier than 30 days after the start date.
              min={
                formData.campaign_start_date
                  ? addDays(formData.campaign_start_date, MIN_CAMPAIGN_DAYS)
                  : new Date().toISOString().split('T')[0]
              }
            />
          </div>
        </div>
      </div>

      {/* Audience Targeting */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-5 h-5 text-indigo-600" />
          <h3 className="text-xl font-bold text-gray-900">
            Audience Targeting
          </h3>
        </div>

        {formData.business_type === 'restaurant' ? (
          <LocationPicker
            location={formData.target_location}
            onLocationChange={(loc) => updateFormData({ target_location: loc })}
          />
        ) : (
          <div className="space-y-6">
            <div className="space-y-3">
              <Label className="text-gray-900 font-medium">
                Geographic Targeting *
              </Label>
              <div className="flex flex-wrap gap-2">
                {GEO_OPTIONS.map((country) => {
                  const selected = (formData.target_countries || []).includes(country);
                  return (
                    <button
                      key={country}
                      type="button"
                      onClick={() => toggleCountry(country)}
                      className={`px-4 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                        selected
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
                      }`}
                    >
                      {country}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 pt-4">
              <div className="space-y-2">
                <Label
                  htmlFor="target_age_range"
                  className="text-gray-900 font-medium flex items-center gap-2"
                >
                  Age Range
                  <span className="text-xs text-gray-500 font-normal bg-gray-100 px-2 py-0.5 rounded">
                    Optional
                  </span>
                </Label>
                <Select
                  items={AGE_OPTIONS}
                  value={formData.target_age_range || ''}
                  onValueChange={(value) =>
                    updateFormData({ target_age_range: value })
                  }
                >
                  <SelectTrigger
                    id="target_age_range"
                    className="h-12 w-full"
                  >
                    <SelectValue placeholder="All ages" />
                  </SelectTrigger>
                  <SelectContent>
                    {AGE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="target_gender"
                  className="text-gray-900 font-medium flex items-center gap-2"
                >
                  Gender
                  <span className="text-xs text-gray-500 font-normal bg-gray-100 px-2 py-0.5 rounded">
                    Optional
                  </span>
                </Label>
                <Select
                  items={GENDER_OPTIONS}
                  value={formData.target_gender || ''}
                  onValueChange={(value) =>
                    updateFormData({ target_gender: value })
                  }
                >
                  <SelectTrigger id="target_gender" className="h-12 w-full">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    {GENDER_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
