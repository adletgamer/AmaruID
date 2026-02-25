import type { ReputationEvent } from '@/types/reputation';
import { useAppTranslation } from '@/hooks/useTranslation';
import { formatRelativeTime } from '@/lib/utils/formatters';
import { Award, Users, Shield, Calendar } from 'lucide-react';

interface ReputationHistoryProps {
  events: ReputationEvent[];
}

const eventIcons = {
  action_verified: Award,
  endorsement_received: Users,
  certification: Shield,
  daily_active: Calendar,
};

export function ReputationHistory({ events }: ReputationHistoryProps) {
  const { t, currentLanguage } = useAppTranslation();

  if (events.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-gray-200 p-6 text-center">
        <p className="text-sm text-gray-500">{t('common.no_data')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-gray-700">{t('reputation.history')}</h3>
      <div className="space-y-1">
        {events.map((event) => {
          const Icon = eventIcons[event.type];
          return (
            <div key={event.id} className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
              <Icon className="h-4 w-4 shrink-0 text-emerald-500" />
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm text-gray-700">{event.description}</p>
                <p className="text-xs text-gray-400">
                  {formatRelativeTime(event.createdAt, currentLanguage)}
                </p>
              </div>
              <span className="shrink-0 text-sm font-bold text-emerald-600">+{event.points}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
