'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building2, AlertCircle } from 'lucide-react';

const BUSINESS_TYPES = [
  { value: 'halal_food', label: 'Halal Food & Beverage' },
  { value: 'restaurant', label: 'Restaurant (Local)' },
  { value: 'islamic_education', label: 'Islamic Education' },
  { value: 'fashion_modest_wear', label: 'Fashion & Modest Wear' },
  { value: 'travel_hajj_umrah', label: 'Travel, Hajj & Umrah' },
  { value: 'finance_islamic_banking', label: 'Finance & Islamic Banking' },
  { value: 'technology', label: 'Technology' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'charity_nonprofit', label: 'Charity & Non-Profit' },
  { value: 'other', label: 'Other' },
];

function getCurrentQuarterYear() {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  let quarter;
  if (month <= 2) quarter = 'Q1';
  else if (month <= 5) quarter = 'Q2';
  else if (month <= 8) quarter = 'Q3';
  else quarter = 'Q4';

  return `${quarter} ${year}`;
}

function extractNameFromURL(url) {
  try {
    const hostname = new URL(url.startsWith('http') ? url : `https://${url}`)
      .hostname;
    const name = hostname.replace(/^www\./, '').split('.')[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  } catch {
    return '';
  }
}

function validateURL(url) {
  if (!url) return { valid: false, message: '' };

  const fullUrl =
    url.startsWith('http://') || url.startsWith('https://')
      ? url
      : `https://${url}`;

  try {
    const urlObj = new URL(fullUrl);
    if (!urlObj.hostname.includes('.')) {
      return {
        valid: false,
        message: 'Please enter a complete domain (e.g., example.com)',
      };
    }
    const parts = urlObj.hostname.split('.');
    if (parts.length < 2 || parts.some((part) => part.length === 0)) {
      return { valid: false, message: 'Please enter a valid domain' };
    }
    return { valid: true, message: '' };
  } catch {
    return {
      valid: false,
      message: 'Please enter a valid URL (e.g., example.com)',
    };
  }
}

function validateEmail(email) {
  if (!email) return { valid: false, message: '' };

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, message: 'Please enter a valid email address' };
  }

  const domain = email.split('@')[1];
  if (!domain || !domain.includes('.')) {
    return {
      valid: false,
      message: 'Please enter a complete email domain (e.g., user@example.com)',
    };
  }

  const domainParts = domain.split('.');
  if (domainParts.length < 2 || domainParts.some((part) => part.length === 0)) {
    return { valid: false, message: 'Please enter a valid email domain' };
  }

  return { valid: true, message: '' };
}

function validatePhone(phone) {
  if (!phone) return { valid: false, message: '' };

  const digitsOnly = phone.replace(/\D/g, '');

  if (digitsOnly.length < 10) {
    return {
      valid: false,
      message: 'Please enter a valid phone number with at least 10 digits',
    };
  }

  if (digitsOnly.length > 15) {
    return { valid: false, message: 'Phone number is too long' };
  }

  const validPhoneRegex = /^[\d\s\-\(\)\+]+$/;
  if (!validPhoneRegex.test(phone)) {
    return { valid: false, message: 'Phone number contains invalid characters' };
  }

  return { valid: true, message: '' };
}

function getUrlDomainPart(url) {
  if (!url) return '';
  return url.replace(/^https?:\/\//, '');
}

export default function BusinessInfoStep({ formData, updateFormData }) {
  const [urlValidation, setUrlValidation] = useState({ valid: true, message: '' });
  const [emailValidation, setEmailValidation] = useState({ valid: true, message: '' });
  const [phoneValidation, setPhoneValidation] = useState({ valid: true, message: '' });
  const [urlDisplayValue, setUrlDisplayValue] = useState(getUrlDomainPart(formData.website_url));

  // Keep the display value in sync if the form data is restored from a draft
  useEffect(() => {
    setUrlDisplayValue(getUrlDomainPart(formData.website_url));
  }, [formData.website_url]);

  // Auto-name campaign from business_name once the user has typed it
  useEffect(() => {
    if (formData.business_name && !formData.campaign_name) {
      const quarterYear = getCurrentQuarterYear();
      updateFormData({
        campaign_name: `${formData.business_name} - ${quarterYear} Campaign`,
      });
    }
  }, [formData.business_name, formData.campaign_name, updateFormData]);

  const handleWebsiteChange = (e) => {
    const inputValue = e.target.value;
    setUrlDisplayValue(inputValue);

    const fullUrl = inputValue ? `https://${inputValue}` : '';
    updateFormData({ website_url: fullUrl });

    if (inputValue) {
      setUrlValidation(validateURL(fullUrl));
    } else {
      setUrlValidation({ valid: true, message: '' });
    }

    if (fullUrl && !formData.business_name) {
      const extractedName = extractNameFromURL(fullUrl);
      if (extractedName) {
        updateFormData({ business_name: extractedName });
      }
    }
  };

  const handleEmailChange = (e) => {
    const email = e.target.value;
    updateFormData({ contact_email: email });

    if (email) {
      setEmailValidation(validateEmail(email));
    } else {
      setEmailValidation({ valid: true, message: '' });
    }
  };

  const handlePhoneChange = (e) => {
    const phone = e.target.value;
    updateFormData({ contact_phone: phone });

    if (phone) {
      setPhoneValidation(validatePhone(phone));
    } else {
      setPhoneValidation({ valid: true, message: '' });
    }
  };

  const handleBusinessTypeChange = (value) => {
    const updates = { business_type: value };

    if (value === 'restaurant') {
      updates.monthly_budget = 500;
      updates.campaign_objective = 'drive_foot_traffic';
    } else {
      updates.campaign_objective = 'brand_awareness';
    }

    updateFormData(updates);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl flex items-center justify-center">
          <Building2 className="w-8 h-8 text-indigo-600" />
        </div>
        <h2 className="text-3xl font-black text-gray-900 mb-2">
          Launch your campaign today
        </h2>
        <p className="text-gray-600 text-lg">
          Set your budget and target your audience instantly
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="business_name" className="text-gray-900 font-medium">
            Business Name *
          </Label>
          <Input
            id="business_name"
            value={formData.business_name || ''}
            onChange={(e) => updateFormData({ business_name: e.target.value })}
            placeholder=""
            className="h-12"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="business_type" className="text-gray-900 font-medium">
            Business Type *
          </Label>
          <Select
            items={BUSINESS_TYPES}
            value={formData.business_type || ''}
            onValueChange={handleBusinessTypeChange}
          >
            <SelectTrigger id="business_type" className="h-12 w-full">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {BUSINESS_TYPES.map((bt) => (
                <SelectItem key={bt.value} value={bt.value}>
                  {bt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="pt-6 border-t border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          Contact Information
        </h3>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="contact_name" className="text-gray-900 font-medium">
              Primary Contact Name
            </Label>
            <Input
              id="contact_name"
              value={formData.contact_name || ''}
              onChange={(e) => updateFormData({ contact_name: e.target.value })}
              placeholder=""
              className="h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_email" className="text-gray-900 font-medium">
              Contact Email *
            </Label>
            <Input
              id="contact_email"
              type="email"
              value={formData.contact_email || ''}
              onChange={handleEmailChange}
              placeholder=""
              className={`h-12 ${
                !emailValidation.valid && formData.contact_email
                  ? 'border-red-500 focus:border-red-500'
                  : ''
              }`}
            />
            <p className="text-xs text-gray-500 italic">
              We only use your contact info for campaign setup. No spam.
            </p>
            {!emailValidation.valid && emailValidation.message && (
              <Alert variant="destructive" className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {emailValidation.message}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_phone" className="text-gray-900 font-medium">
              Phone Number
            </Label>
            <Input
              id="contact_phone"
              type="tel"
              value={formData.contact_phone || ''}
              onChange={handlePhoneChange}
              placeholder=""
              className={`h-12 ${
                !phoneValidation.valid && formData.contact_phone
                  ? 'border-red-500 focus:border-red-500'
                  : ''
              }`}
            />
            <p className="text-xs text-gray-500 italic">
              We only use your contact info for campaign setup. No spam.
            </p>
            {!phoneValidation.valid && phoneValidation.message && (
              <Alert variant="destructive" className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {phoneValidation.message}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="website_url" className="text-gray-900 font-medium">
              Website URL
            </Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <span className="text-gray-500 font-medium">https://</span>
              </div>
              <Input
                id="website_url"
                type="text"
                value={urlDisplayValue}
                onChange={handleWebsiteChange}
                placeholder=""
                className={`h-12 pl-[70px] ${
                  !urlValidation.valid && urlDisplayValue
                    ? 'border-red-500 focus:border-red-500'
                    : ''
                }`}
              />
            </div>
            {!urlValidation.valid && urlValidation.message && (
              <Alert variant="destructive" className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {urlValidation.message}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
