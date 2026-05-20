'use client';

import { Card } from '@/components/ui/card';
import { Target } from 'lucide-react';

// eslint-disable-next-line no-unused-vars
export default function CampaignSetupStep({ formData, updateFormData }) {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl flex items-center justify-center">
          <Target className="w-8 h-8 text-indigo-600" />
        </div>
        <h2 className="text-3xl font-black text-gray-900 mb-2">
          Step 2: Choose Your Budget
        </h2>
        <p className="text-gray-600 text-lg">
          Campaign budget, targeting, and creatives — coming in next build
          session.
        </p>
      </div>

      <Card className="p-8 bg-indigo-50/50 border-indigo-100 text-center">
        <p className="text-sm text-indigo-700 font-medium">
          This step is intentionally a placeholder for S3. CampaignSetup,
          LocationPicker, BudgetRecommendation and the AdCreative upload flow
          land in S4 and S5.
        </p>
      </Card>
    </div>
  );
}
