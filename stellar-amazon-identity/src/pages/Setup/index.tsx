import { useState } from 'react';
import { useAppTranslation } from '@/hooks/useTranslation';
import { Step1Accounts } from './Step1Accounts';
import { Step2Multisig } from './Step2Multisig';
import { Step3Verify } from './Step3Verify';
import { cn } from '@/lib/utils/cn';

export function SetupPage() {
  const { t } = useAppTranslation();
  const [step, setStep] = useState(1);

  const steps = [
    { num: 1, title: t('setup.step1_title') },
    { num: 2, title: t('setup.step2_title') },
    { num: 3, title: t('setup.step3_title') },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-gray-900">{t('setup.title')}</h1>

      {/* Step Indicator */}
      <div className="mt-6 mb-8 flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s.num} className="flex items-center">
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors',
                step >= s.num
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-200 text-gray-500'
              )}
            >
              {s.num}
            </div>
            <span
              className={cn(
                'ml-2 hidden text-sm font-medium sm:inline',
                step >= s.num ? 'text-emerald-700' : 'text-gray-400'
              )}
            >
              {s.title}
            </span>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  'mx-3 h-0.5 w-8 sm:w-16',
                  step > s.num ? 'bg-emerald-500' : 'bg-gray-200'
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      {step === 1 && <Step1Accounts onNext={() => setStep(2)} />}
      {step === 2 && <Step2Multisig onNext={() => setStep(3)} onBack={() => setStep(1)} />}
      {step === 3 && <Step3Verify onBack={() => setStep(2)} />}
    </div>
  );
}
