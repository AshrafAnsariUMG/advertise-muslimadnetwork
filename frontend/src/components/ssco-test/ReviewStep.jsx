'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Building2,
  Target,
  CheckCircle,
  DollarSign,
  ChevronLeft,
  Pencil,
  Link as LinkIcon,
  Palette,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { previewCheckout } from '@/lib/api';

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
  const [redirecting, setRedirecting] = useState(null); // null | 'preview'
  const [previewResult, setPreviewResult] = useState(null); // dry-run result

  // Pre-fill the target URL from the user's website if they haven't set one.
  useEffect(() => {
    if (!formData.ad_destination_url && formData.website_url) {
      updateFormData({ ad_destination_url: formData.website_url });
    }
  }, [formData.ad_destination_url, formData.website_url, updateFormData]);

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

  // Creatives are no longer collected before payment — they're uploaded on
  // the success page. The only pre-payment requirement is a saved draft;
  // the backend submission gate re-validates the campaign fields at checkout.
  const canPay = !!advertiserId && !!accessToken;

  // SANDBOX: dry-run instead of a real charge. Hits /checkout/preview which
  // returns the server-computed total (via calculateTotalTest) without
  // creating any Stripe/PayPal session.
  const handlePreview = async () => {
    if (!canPay || redirecting) return;
    setRedirecting('preview');
    setPreviewResult(null);
    try {
      const res = await previewCheckout(advertiserId, accessToken);
      setPreviewResult(res);
      toast.success('Dry run complete — no payment was taken.');
    } catch (err) {
      toast.error(err?.message || 'Dry-run preview failed. Please try again.');
    } finally {
      setRedirecting(null);
    }
  };

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

        {/* Target URL + Design Service — creatives themselves are uploaded
            AFTER payment, on the success page. */}
        <Card className="border-indigo-100 shadow-sm">
          <SectionHeader icon={LinkIcon} title="Target URL" />
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="ad_destination_url">
                Where should your ad clicks go? *
              </Label>
              <Input
                id="ad_destination_url"
                type="url"
                inputMode="url"
                placeholder="https://your-website.com/landing-page"
                value={formData.ad_destination_url || ''}
                onChange={(e) =>
                  updateFormData({ ad_destination_url: e.target.value })
                }
              />
              <p className="text-xs text-gray-500">
                The page visitors land on when they click your ad.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Design service — paid alternative to uploading your own creatives */}
        <Card className="border-indigo-100 shadow-sm">
          <SectionHeader icon={Palette} title="Ad Design" />
          <CardContent>
            <div className="flex items-start justify-between gap-4 rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
              <div className="flex-1">
                <p className="font-semibold text-gray-900">
                  Let our team design your ads{' '}
                  <span className="text-indigo-600">(+$200)</span>
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Skip the upload — our designers create professional banner
                  creatives for you. Leave this off to upload your own right
                  after checkout.
                </p>
              </div>
              <Switch
                checked={!!formData.design_service}
                onCheckedChange={(checked) =>
                  updateFormData({ design_service: checked })
                }
                aria-label="Professional ad design service"
              />
            </div>
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

        {/* SANDBOX: dry-run preview instead of a real charge */}
        <div className="space-y-3">
          <div>
            <p className="text-sm font-semibold text-gray-700 text-center">
              Preview total (dry run)
            </p>
            <p className="text-xs text-gray-500 text-center mt-1">
              Sandbox — computes the charge server-side with no real payment taken.
            </p>
          </div>

          <Button
            onClick={handlePreview}
            disabled={!canPay || !!redirecting}
            className="w-full h-12 text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 disabled:opacity-60"
          >
            {redirecting === 'preview' ? 'Computing…' : 'Run dry-run preview'}
          </Button>

          {previewResult && (
            <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50 p-4 text-center">
              <p className="text-sm font-semibold text-emerald-800">
                Dry run — would charge $
                {Number(previewResult.total).toLocaleString()}{' '}
                {previewResult.currency}
              </p>
              <p className="text-xs text-emerald-700 mt-1">
                Budget ${Number(previewResult.monthly_budget).toLocaleString()}
                {previewResult.design_fee > 0
                  ? ` + design $${previewResult.design_fee}`
                  : ''}{' '}
                · no payment was taken.
              </p>
            </div>
          )}

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
            🧪 Sandbox — dry run only, no real payment is processed
          </p>
        </div>
      </div>
    </div>
  );
}
