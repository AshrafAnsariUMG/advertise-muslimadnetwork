import { Check } from 'lucide-react';

export default function StepProgress({ currentStep, steps }) {
  return (
    <div className="w-full mb-12">
      <div className="flex items-center justify-between relative">
        <div className="absolute top-5 left-0 w-full h-0.5 bg-gray-200 -z-10" />
        <div
          className="absolute top-5 left-0 h-0.5 bg-gradient-to-r from-indigo-600 to-indigo-500 transition-all duration-500 -z-10"
          style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((step, index) => (
          <div key={index} className="flex flex-col items-center">
            <div
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 ${
                index < currentStep
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                  : index === currentStep
                  ? 'bg-white border-4 border-indigo-600 text-indigo-600 shadow-lg'
                  : 'bg-white border-2 border-gray-300 text-gray-400'
              }`}
            >
              {index < currentStep ? (
                <Check className="w-5 h-5" />
              ) : (
                <span className="font-semibold">{index + 1}</span>
              )}
            </div>
            <span
              className={`mt-3 text-sm font-medium transition-colors duration-300 ${
                index <= currentStep ? 'text-indigo-700' : 'text-gray-400'
              } hidden sm:block`}
            >
              {step}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
