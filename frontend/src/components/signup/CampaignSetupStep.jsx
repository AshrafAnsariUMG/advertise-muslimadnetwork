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
  CheckCircle2,
} from 'lucide-react';
import BudgetRecommendation from './BudgetRecommendation';
import CountryMultiSelect from './CountryMultiSelect';

// Leaflet relies on `window`/`document`, so the picker is loaded only on the
// client — never during SSR/prerender.
const LocationPicker = dynamic(() => import('./LocationPicker'), {
  ssr: false,
  loading: () => (
    <div className="h-96 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center text-sm text-gray-500">
      Loading map…
    </div>
  ),
});

// Pricing constants — must match base44 reference for parity with the live
// site until cutover.
const CPM = 5;
const COST_PER_CLICK = 2;
const CTR = 0.00167;
const MIN_REACH_PERCENTAGE = 0.067;
const MAX_REACH_PERCENTAGE = 0.1;

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

export default function CampaignSetupStep({ formData, updateFormData }) {
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

  const budgetMin = formData.has_ctv ? 1500 : 250;
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
                <SelectItem value="brand_awareness">Brand Awareness</SelectItem>
                <SelectItem value="website_traffic">Website Traffic</SelectItem>
                <SelectItem value="lead_generation">Lead Generation</SelectItem>
                <SelectItem value="donations">Donations</SelectItem>
                <SelectItem value="product_sales">Product Sales</SelectItem>
                <SelectItem value="app_installs">App Installs</SelectItem>
                <SelectItem value="event_promotion">Event Promotion</SelectItem>
                <SelectItem value="drive_foot_traffic">
                  Drive Foot Traffic
                </SelectItem>
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
                !formData.has_ctv &&
                updateFormData({ monthly_budget: preset.value })
              }
              disabled={!!formData.has_ctv}
              className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                formData.has_ctv ? 'opacity-40 cursor-not-allowed' : ''
              } ${
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

        {formData.has_ctv && (
          <p className="text-xs text-purple-600 text-center -mt-2 mb-1">
            Minimum $1,500/month required for Streaming TV Ads
          </p>
        )}

        <div className="py-2">
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
                updateFormData({ monthly_budget: next });
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
          <span>{formData.has_ctv ? '$1,500' : '$250'}</span>
          <span>$2,500</span>
          <span>$5,000</span>
          <span>$7,500</span>
          <span>$10,000</span>
        </div>

        {/* Industry-specific recommendation nudge */}
        <BudgetRecommendation
          businessType={formData.business_type}
          currentBudget={formData.monthly_budget}
          onBudgetChange={(value) => updateFormData({ monthly_budget: value })}
        />

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
              <div className="flex items-start gap-6 mb-6">
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
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-[#f9a01b] text-black text-xs font-bold tracking-tight">
                        Sling
                      </span>
                      <span className="text-xs text-gray-600">&amp; more</span>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-4 text-center min-w-fit">
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
                  <div className="grid grid-cols-3 gap-3 text-center">
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-2">
                      <Eye className={`w-4 h-4 ${colors.icon}`} />
                      <p className="text-sm text-gray-600">
                        Monthly Total Ad Views
                      </p>
                    </div>
                    <p className={`text-3xl font-bold ${colors.text}`}>
                      {metrics.adViews.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-2">
                      <Users className="w-4 h-4 text-green-600" />
                      <p className="text-sm text-gray-600">Estimated Visits</p>
                    </div>
                    <p className="text-3xl font-bold text-green-600">
                      {metrics.minVisits.toLocaleString()}–
                      {metrics.maxVisits.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">customers</p>
                  </div>
                </div>
              ) : metrics.isWebsiteTraffic ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-2">
                      <MousePointerClick className={`w-4 h-4 ${colors.icon}`} />
                      <p className="text-sm text-gray-600">Total Clicks</p>
                    </div>
                    <p className={`text-3xl font-bold ${colors.text}`}>
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
                    <p className={`text-3xl font-bold ${colors.text}`}>
                      {metrics.totalImpressions.toLocaleString()}
                    </p>
                  </div>
                </div>
              ) : metrics.showLeadProjections ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-2">
                      <MousePointerClick className={`w-4 h-4 ${colors.icon}`} />
                      <p className="text-sm text-gray-600">Total Clicks</p>
                    </div>
                    <p className={`text-3xl font-bold ${colors.text}`}>
                      {metrics.totalClicks.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-2">
                      <Users className="w-4 h-4 text-green-600" />
                      <p className="text-sm text-gray-600">Expected Leads</p>
                    </div>
                    <p className="text-3xl font-bold text-green-600">
                      {metrics.minPotentialLeads.toLocaleString()} -{' '}
                      {metrics.maxPotentialLeads.toLocaleString()}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-2">
                      <Eye className={`w-4 h-4 ${colors.icon}`} />
                      <p className="text-sm text-gray-600">
                        Monthly Total Ad Views
                      </p>
                    </div>
                    <p className={`text-3xl font-bold ${colors.text}`}>
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
                    <p className={`text-3xl font-bold ${colors.text}`}>
                      {metrics.minReach.toLocaleString()} -{' '}
                      {metrics.maxReach.toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

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
                updateFormData({
                  campaign_start_date: e.target.value,
                  campaign_end_date: '',
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
              min={
                formData.campaign_start_date ||
                new Date().toISOString().split('T')[0]
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
              <CountryMultiSelect
                value={formData.target_countries || []}
                onChange={(countries) =>
                  updateFormData({ target_countries: countries })
                }
              />
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
                    <SelectItem value="18-24">18-24 years</SelectItem>
                    <SelectItem value="25-34">25-34 years</SelectItem>
                    <SelectItem value="35-44">35-44 years</SelectItem>
                    <SelectItem value="45-54">45-54 years</SelectItem>
                    <SelectItem value="55+">55+ years</SelectItem>
                    <SelectItem value="all">All ages</SelectItem>
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
                  value={formData.target_gender || ''}
                  onValueChange={(value) =>
                    updateFormData({ target_gender: value })
                  }
                >
                  <SelectTrigger id="target_gender" className="h-12 w-full">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
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
