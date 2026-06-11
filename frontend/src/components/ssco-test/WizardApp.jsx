'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import StepProgress from '@/components/ssco-test/StepProgress';
import BusinessInfoStep from '@/components/ssco-test/BusinessInfoStep';
import CampaignSetupStep from '@/components/ssco-test/CampaignSetupStep';
import ReviewStep from '@/components/ssco-test/ReviewStep';
import SaveLinkBar from '@/components/ssco-test/SaveLinkBar';
import HowItWorks from '@/components/signup/HowItWorks';
import PublicShell from '@/components/layout/PublicShell';
import BrandLogos from '@/components/layout/BrandLogos';
import TrustSignals from '@/components/layout/TrustSignals';
import {
  createAdvertiser,
  updateAdvertiser,
  getAdvertiser,
  ApiError,
} from '@/lib/api';
import { saveDraft, loadDraft, clearDraft } from '@/lib/draft-storage';

const STEPS = ['Your Business', 'Choose Your Budget', 'Review & Launch'];

// Landing on the review screen does NOT auto-submit. The transition to
// 'pending_review' happens only when the user initiates payment (S6/S7).
const STATUS_BY_STEP = {
  0: 'incomplete_step_1',
  1: 'incomplete_step_2',
  2: 'incomplete_step_3',
};

const STEP_BY_STATUS = {
  incomplete_step_1: 0,
  incomplete_step_2: 1,
  incomplete_step_3: 1,
  pending_review: 2,
  approved: 2,
  rejected: 2,
  active: 2,
  paused: 2,
};

const INITIAL_FORM = {
  business_type: 'fashion_modest_wear',
  campaign_objective: 'brand_awareness',
  monthly_budget: 500,
};

/**
 * CLONE of the production wizard, powering the /ssco-test sandbox. It uses its
 * own step components under components/ssco-test/, so changes here (including
 * the payment calculation) never touch the live wizard at `/`. testMode
 * defaults TRUE: MasjidConnect shows, drafts are flagged is_test (hidden from
 * live admin/CRM), and checkout is a dry-run (no real charge — see the cloned
 * ReviewStep). Promote a tested change by porting it into components/signup/*.
 */
export default function WizardApp({ testMode = true }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [advertiserId, setAdvertiserId] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const formRef = useRef(null);
  const isInitialMount = useRef(true);
  const saveTimeoutRef = useRef(null);
  const savedTimeoutRef = useRef(null);

  // Mount: resume from URL ?return=...&token=... or localStorage
  useEffect(() => {
    const load = async () => {
      let resumeId = null;
      let resumeToken = null;

      try {
        const params = new URLSearchParams(window.location.search);
        const returnId = params.get('return');
        const urlToken = params.get('token');

        if (returnId && urlToken) {
          resumeId = returnId;
          resumeToken = urlToken;
        } else {
          const stored = loadDraft();
          if (stored) {
            resumeId = stored.id;
            resumeToken = stored.token;
          }
        }

        if (resumeId && resumeToken) {
          const saved = await getAdvertiser(resumeId, resumeToken);

          // Don't restore a finished campaign — let the user start fresh
          if (saved.payment_status !== 'paid') {
            saveDraft({ id: resumeId, token: resumeToken });
            setAdvertiserId(resumeId);
            setAccessToken(resumeToken);
            setFormData({
              ...INITIAL_FORM,
              business_name: saved.business_name || '',
              business_type: saved.business_type || INITIAL_FORM.business_type,
              contact_name: saved.contact_name || '',
              contact_email: saved.contact_email || '',
              contact_phone: saved.contact_phone || '',
              website_url: saved.website_url || '',
              campaign_name: saved.campaign_name || '',
              campaign_objective:
                saved.campaign_objective || INITIAL_FORM.campaign_objective,
              campaign_offer: saved.campaign_offer || '',
              monthly_budget:
                saved.monthly_budget ?? INITIAL_FORM.monthly_budget,
              campaign_start_date: saved.campaign_start_date || '',
              campaign_end_date: saved.campaign_end_date || '',
              target_countries: saved.target_countries || [],
              target_location: saved.target_location || null,
              target_age_range: saved.target_age_range || '',
              target_gender: saved.target_gender || 'all',
              ad_creatives: saved.ad_creatives || [],
              ad_destination_url: saved.ad_destination_url || '',
              design_service: saved.design_service || false,
              has_ctv: saved.has_ctv || false,
              has_masjidconnect: saved.has_masjidconnect || false,
              notes: saved.notes || '',
            });
            setCurrentStep(STEP_BY_STATUS[saved.status] ?? 0);
          } else {
            // Finished campaign — discard the stale draft handle
            clearDraft();
          }
        }
      } catch (err) {
        // 403/404 on resume → stale handle, start fresh
        if (
          err instanceof ApiError &&
          (err.status === 403 || err.status === 404)
        ) {
          clearDraft();
        } else {
          console.error('Resume failed:', err);
        }
      } finally {
        setIsLoading(false);
      }
    };

    load();

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);
    };
  }, []);

  // Smooth-scroll to the form on step change (after initial mount)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
    } else if (formRef.current && !isLoading) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentStep, isLoading]);

  // Auto-save: fires 1s after the last change
  const scheduleAutoSave = useCallback(
    (merged) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      setSaveStatus('idle');

      saveTimeoutRef.current = setTimeout(async () => {
        // Need at least an email so the draft is re-findable
        if (!merged.contact_email) return;

        setSaveStatus('saving');
        const payload = {
          ...merged,
          status: STATUS_BY_STEP[currentStep] ?? 'incomplete_step_1',
          is_test: true, // sandbox draft — isolated from live admin/CRM
        };

        try {
          if (advertiserId && accessToken) {
            await updateAdvertiser(advertiserId, accessToken, payload);
          } else {
            const created = await createAdvertiser(payload);
            if (created?.id && created?.access_token) {
              saveDraft({ id: created.id, token: created.access_token });
              setAdvertiserId(created.id);
              setAccessToken(created.access_token);
            }
          }

          setSaveStatus('saved');
          if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);
          savedTimeoutRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (err) {
          // Silent retry on next change — don't spam toasts
          console.error('Auto-save failed:', err);
          setSaveStatus('idle');
        }
      }, 1000);
    },
    [advertiserId, accessToken, currentStep]
  );

  const updateFormData = useCallback(
    (partial) => {
      setError(null);
      setFormData((prev) => {
        const merged = { ...prev, ...partial };
        scheduleAutoSave(merged);
        return merged;
      });
    },
    [scheduleAutoSave]
  );

  const validateStep = () => {
    if (currentStep === 0) {
      if (
        !formData.business_name ||
        !formData.business_type ||
        !formData.contact_email
      ) {
        setError('Please fill in all required fields');
        return false;
      }
      return true;
    }

    if (currentStep === 1) {
      const required = [
        ['campaign_name', 'Campaign name'],
        ['campaign_objective', 'Campaign objective'],
        ['monthly_budget', 'Monthly budget'],
        ['campaign_start_date', 'Campaign start date'],
        ['campaign_end_date', 'Campaign end date'],
      ];

      for (const [field, label] of required) {
        if (!formData[field]) {
          setError(`${label} is required`);
          return false;
        }
      }

      const hasCountries =
        Array.isArray(formData.target_countries) &&
        formData.target_countries.length > 0;
      const hasLocation =
        formData.target_location &&
        formData.target_location.latitude != null &&
        formData.target_location.longitude != null;

      if (!hasCountries && !hasLocation) {
        setError('Please choose at least one target country or location');
        return false;
      }

      if (
        formData.campaign_objective === 'drive_foot_traffic' &&
        !formData.campaign_offer
      ) {
        setError('Please enter the special offer you are promoting');
        return false;
      }

      const start = new Date(formData.campaign_start_date);
      const end = new Date(formData.campaign_end_date);
      if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
        // Campaign must run at least 30 days — end >= start + 30.
        const minEnd = new Date(start);
        minEnd.setDate(minEnd.getDate() + 30);
        if (end < minEnd) {
          setError('Campaign must run for at least 30 days from the start date');
          return false;
        }
      }

      return true;
    }

    // Step 2 (Review) has no creative gate anymore — creatives are collected
    // AFTER payment (on the success page). Payment readiness is enforced
    // server-side by the AdvertiserSubmissionGate at checkout.
    return true;
  };

  const persistStep = async (stepNumber) => {
    if (!formData.contact_email) return;

    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        status: STATUS_BY_STEP[stepNumber] ?? 'incomplete_step_1',
        is_test: true, // sandbox draft — isolated from live admin/CRM
      };

      if (advertiserId && accessToken) {
        await updateAdvertiser(advertiserId, accessToken, payload);
      } else {
        const created = await createAdvertiser(payload);
        if (created?.id && created?.access_token) {
          saveDraft({ id: created.id, token: created.access_token });
          setAdvertiserId(created.id);
          setAccessToken(created.access_token);
        }
      }
    } catch (err) {
      console.error('Save on advance failed:', err);
      // Don't block the user from moving forward — auto-save will retry
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = async () => {
    if (!validateStep()) return;
    await persistStep(currentStep);
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
    setError(null);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <BusinessInfoStep
            formData={formData}
            updateFormData={updateFormData}
          />
        );
      case 1:
        return (
          <CampaignSetupStep
            formData={formData}
            updateFormData={updateFormData}
            testMode={testMode}
          />
        );
      case 2:
        return (
          <ReviewStep
            formData={formData}
            updateFormData={updateFormData}
            advertiserId={advertiserId}
            accessToken={accessToken}
            onEditSection={(stepIndex) => {
              setError(null);
              setCurrentStep(stepIndex);
            }}
            onBack={handleBack}
          />
        );
      default:
        return null;
    }
  };

  const continueButtonText = (() => {
    if (isSaving) return 'Saving...';
    if (currentStep === 0) return 'Save & Continue';
    if (currentStep === 1) return 'Review & Launch';
    return 'Continue';
  })();

  return (
    <PublicShell>
    <div className="bg-gradient-to-br from-slate-50 via-white to-indigo-50 relative">
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="bg-indigo-500 absolute top-0 left-0 w-64 h-64 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl" />
      </div>

      {testMode && (
        <div className="bg-amber-500 text-black text-center text-sm font-semibold py-2 px-4">
          ⚠️ SSCO TEST ENVIRONMENT — sandbox for previewing in-development
          features. Not the live site. Payments use LIVE keys, so don't
          complete real checkouts here.
        </div>
      )}
      <div className="relative max-w-7xl mx-auto px-4 py-6 md:py-12">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-full">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-medium text-indigo-700">
                Self-Service Advertising Platform
              </span>
            </div>
            {saveStatus !== 'idle' && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs">
                {saveStatus === 'saving' ? (
                  <>
                    <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-gray-600">Saving...</span>
                  </>
                ) : (
                  <>
                    <svg
                      className="w-3 h-3 text-green-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-gray-600">Saved</span>
                  </>
                )}
              </div>
            )}
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-gray-900 mb-4 leading-tight">
            Reach Muslim Consumers with Intent
          </h1>
          <p className="text-xl font-normal text-indigo-600 mb-2 max-w-4xl mx-auto">
            Connect with millions of engaged Muslims actively browsing premium
            websites, apps, and masjids worldwide
          </p>
        </div>

        <BrandLogos />

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading your saved progress...</p>
            </div>
          </div>
        ) : (
          <div className="mt-3">
            <p className="text-center text-sm text-gray-600 mb-4 font-medium">
              ⏱️ Takes less than 3 minutes.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
              <div className="lg:col-span-2">
            <Card
              ref={formRef}
              className="p-6 md:p-10 shadow-2xl border-0 bg-white/80 backdrop-blur-sm"
            >
              <StepProgress currentStep={currentStep} steps={STEPS} />

              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="min-h-96">{renderStep()}</div>

              {currentStep === 0 && (
                <SaveLinkBar
                  advertiserId={advertiserId}
                  accessToken={accessToken}
                  hasEmail={!!formData.contact_email}
                  testMode={testMode}
                />
              )}

              {currentStep < STEPS.length - 1 && (
                <div className="flex justify-between mt-10 pt-6 border-t border-gray-100">
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    disabled={currentStep === 0 || isSaving}
                    className="px-6 h-12 border-2"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>

                  <Button
                    onClick={handleNext}
                    disabled={isSaving}
                    className="px-8 h-12 text-white shadow-lg bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 shadow-indigo-200"
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        {continueButtonText}
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              )}
            </Card>
              </div>

              <aside className="lg:col-span-1 lg:sticky lg:top-20">
                <HowItWorks />
              </aside>
            </div>

            <TrustSignals />
          </div>
        )}
      </div>
    </div>
    </PublicShell>
  );
}
