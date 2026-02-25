import { useAppTranslation } from '@/hooks/useTranslation';
import type { ReputationScore as RepScore } from '@/types/reputation';
import { TrendingUp, Award, Users, Calendar, Shield } from 'lucide-react';

interface ReputationScoreProps {
  score: RepScore | null;
}

export function ReputationScoreDisplay({ score }: ReputationScoreProps) {
  const { t } = useAppTranslation();

  if (!score) {
    return (
      <div className="rounded-xl border-2 border-dashed border-gray-200 p-8 text-center">
        <TrendingUp className="mx-auto h-10 w-10 text-gray-300" />
        <p className="mt-2 text-sm text-gray-500">{t('common.no_data')}</p>
      </div>
    );
  }

  const items = [
    { label: t('reputation.actions_score'), value: score.breakdown.actionsScore, icon: Award, color: 'emerald' },
    { label: t('reputation.endorsements_score'), value: score.breakdown.endorsementsScore, icon: Users, color: 'blue' },
    { label: t('reputation.time_score'), value: score.breakdown.timeScore, icon: Calendar, color: 'purple' },
    { label: t('reputation.certification_bonus'), value: score.breakdown.certificationBonus, icon: Shield, color: 'amber' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white">
        <div>
          <p className="text-sm font-medium text-emerald-100">{t('reputation.total_score')}</p>
          <p className="text-4xl font-bold">{score.totalScore}</p>
          <p className="mt-1 text-xs text-emerald-200">MVRS</p>
        </div>
        <TrendingUp className="h-12 w-12 text-emerald-200" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-gray-400" />
                <span className="text-xs text-gray-500">{item.label}</span>
              </div>
              <p className="mt-1 text-2xl font-bold text-gray-900">{item.value}</p>
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-gray-400">{t('reputation.formula')}</p>
    </div>
  );
}
