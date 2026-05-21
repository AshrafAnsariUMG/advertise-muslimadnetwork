'use client';

import { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Building2,
  Target,
  Image as ImageIcon,
  CheckCircle,
  DollarSign,
  ChevronLeft,
  Pencil,
} from 'lucide-react';
import AdCreativeStep from './AdCreativeStep';

const DATE_FMT = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

function formatDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return DATE_FMT.format(d);
}

function calculateTotal(formData) {
  const campaignBudget = Number(formData.monthly_budget) || 0;
  const designFee = formData.design_service ? 200 : 0;
  return campaignBudget + designFee;
}

function SectionHeader({ icon: Icon, title, onEdit }) {
  return (
    <CardHeader className="pb-4 flex flex-row items-center justify-between">
      <CardTitle className="flex items-center gap-2 text-lg">
        <Icon className="w-5 h-5 text-indigo-600" />
        {title}
      </CardTitle>
      {onEdit && (
        <Button
          variant="outline"
          size="sm"
          onClick={onEdit}
          className="h-8 px-3 text-xs"
        >
          <Pencil className="w-3.5 h-3.5 mr-1.5" />
          Edit
        </Button>
      )}
    </CardHeader>
  );
}

export default function ReviewStep({
  formData,
  updateFormData,
  advertiserId,
  accessToken,
  onEditSection,
  onBack,
}) {
  const paymentSectionRef = useRef(null);

  // Auto-scroll to the payment section when the review loads (matches base44)
  useEffect(() => {
    const id = setTimeout(() => {
      paymentSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }, 300);
    return () => clearTimeout(id);
  }, []);

  const totalAmount = calculateTotal(formData);
  const startDate = formatDate(formData.campaign_start_date);
  const endDate = formatDate(formData.campaign_end_date);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-indigo-600" />
        </div>
        <h2 className="text-3xl font-black text-gray-900 mb-2">
          Review &amp; Launch
        </h2>
        <p className="text-gray-600 text-lg">
          Review your campaign details. Payment unlocks in the next build.
        </p>
      </div>

      <div className="space-y-4">
        {/* Business Information */}
        <Card className="border-indigo-100 shadow-sm">
          <SectionHeader
            icon={Building2}
            title="Business Information"
            onEdit={onEditSection ? () => onEditSection(0) : undefined}
          />
          <CardContent className="space-y-3">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Business Name</p>
                <p className="font-semibold">{formData.business_name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Business Type</p>
                <p className="font-semibold capitalize">
                  {formData.business_type?.replace(/_/g, ' ') || '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Contact Person</p>
                <p className="font-semibold">{formData.contact_name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-semibold">{formData.contact_email || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-semibold">{formData.contact_phone || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Website</p>
                <p className="font-semibold truncate">
                  {formData.website_url || '-'}
                </p>
              </div>
            </div>
            {formData.company_description && (
              <div className="pt-2 border-t border-gray-100">
                <p className="text-sm text-gray-500">Description</p>
                <p className="text-gray-700">{formData.company_description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Campaign Details */}
        <Card className="border-indigo-100 shadow-sm">
          <SectionHeader
            icon={Target}
            title="Campaign Details"
            onEdit={onEditSection ? () => onEditSection(1) : undefined}
          />
          <CardContent className="space-y-3">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Campaign Name</p>
                <p className="font-semibold">{formData.campaign_name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Objective</p>
                <p className="font-semibold capitalize">
                  {formData.campaign_objective?.replace(/_/g, ' ') || '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Budget</p>
                <p className="font-semibold text-indigo-600">
                  ${Number(formData.monthly_budget || 0).toLocaleString()} USD
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Campaign Duration</p>
                <p className="font-semibold">
                  {startDate && endDate ? `${startDate} – ${endDate}` : '-'}
                </p>
              </div>
            </div>

            {formData.campaign_objective === 'drive_foot_traffic' &&
              formData.campaign_offer && (
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">Special Offer</p>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="font-semibold text-green-800 flex items-center gap-2">
                      <span className="text-lg">🎁</span>
                      {formData.campaign_offer}
                    </p>
                  </div>
                </div>
              )}

            {formData.target_countries &&
              formData.target_countries.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Target Countries</p>
                  <div className="flex flex-wrap gap-2">
                    {formData.target_countries.map((country) => (
                      <Badge
                        key={country}
                        variant="secondary"
                        className="bg-indigo-50 text-indigo-700"
                      >
                        {country}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

            {formData.target_location && (
              <div>
                <p className="text-sm text-gray-500 mb-2">
                  Target Location (Local)
                </p>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  {formData.target_location.address && (
                    <p className="font-medium text-gray-900 mb-1">
                      {formData.target_location.address}
                    </p>
                  )}
                  <p className="text-sm text-gray-600">
                    📍{' '}
                    {Number(formData.target_location.latitude).toFixed(4)},{' '}
                    {Number(formData.target_location.longitude).toFixed(4)}
                  </p>
                  <p className="text-sm text-green-700 font-medium mt-1">
                    Radius: {formData.target_location.radius_miles} miles
                  </p>
                </div>
              </div>
            )}

            {(formData.target_age_range || formData.target_gender) && (
              <div className="grid md:grid-cols-2 gap-4 pt-3 border-t border-gray-100">
                {formData.target_age_range && (
                  <div>
                    <p className="text-sm text-gray-500">Age Range</p>
                    <p className="font-semibold">{formData.target_age_range}</p>
                  </div>
                )}
                {formData.target_gender && (
                  <div>
                    <p className="text-sm text-gray-500">Gender</p>
                    <p className="font-semibold capitalize">
                      {formData.target_gender}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ad Creatives — upload + design-service toggle live here */}
        <Card className="border-indigo-100 shadow-sm">
          <SectionHeader icon={ImageIcon} title="Ad Creatives & Target URL" />
          <CardContent>
            <AdCreativeStep
              formData={formData}
              updateFormData={updateFormData}
              advertiserId={advertiserId}
              accessToken={accessToken}
            />
          </CardContent>
        </Card>

        {/* Payment Summary */}
        <Card
          ref={paymentSectionRef}
          className="border-indigo-100 shadow-sm bg-gradient-to-br from-indigo-50 to-white"
        >
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="w-5 h-5 text-indigo-600" />
              Payment Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Monthly Campaign Budget</span>
                <span className="text-lg font-semibold text-gray-900">
                  ${Number(formData.monthly_budget || 0).toLocaleString()} USD
                </span>
              </div>
              {formData.design_service && (
                <div className="flex justify-between items-center py-2 border-t border-indigo-100">
                  <span className="text-gray-600">
                    Professional Banner Design
                  </span>
                  <span className="text-lg font-semibold text-gray-900">
                    $200 USD
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center py-3 border-t-2 border-indigo-200">
                <span className="text-gray-900 font-semibold text-lg">
                  Total Amount
                </span>
                <span className="text-2xl font-bold text-indigo-600">
                  ${totalAmount.toLocaleString()} USD
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment buttons — disabled until S6/S7 */}
        <div className="space-y-3">
          <div>
            <p className="text-sm font-semibold text-gray-700 text-center">
              Choose your payment method
            </p>
            <p className="text-xs text-gray-500 text-center mt-1">
              Secure checkout • No account required • Encrypted payment
            </p>
          </div>
          <TooltipProvider delay={150}>
            <div className="grid grid-cols-2 gap-3">
              <Tooltip>
                <TooltipTrigger
                  render={
                    <span className="block opacity-60 cursor-not-allowed" />
                  }
                >
                  <button
                    type="button"
                    disabled
                    className="w-full flex flex-col items-center justify-center gap-2 h-20 rounded-xl border-2 border-indigo-200 bg-white pointer-events-none"
                    aria-disabled="true"
                  >
                    <span className="text-sm font-semibold text-indigo-700">
                      Pay with Stripe
                    </span>
                    <span className="text-xs text-gray-500 font-medium">
                      Card / Bank
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent>Coming in next build session</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger
                  render={
                    <span className="block opacity-60 cursor-not-allowed" />
                  }
                >
                  <button
                    type="button"
                    disabled
                    className="w-full flex flex-col items-center justify-center gap-2 h-20 rounded-xl border-2 border-yellow-300 bg-white pointer-events-none"
                    aria-disabled="true"
                  >
                    <span className="text-sm font-semibold text-yellow-700">
                      Pay with PayPal
                    </span>
                    <span className="text-xs text-gray-500 font-medium">
                      PayPal
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent>Coming in next build session</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>

          {onBack && (
            <Button
              variant="outline"
              onClick={onBack}
              className="w-full h-11 border-2"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}

          <p className="text-xs text-gray-500 text-center">
            🔒 Secure payment • Opens in new tab
          </p>
        </div>
      </div>
    </div>
  );
}
