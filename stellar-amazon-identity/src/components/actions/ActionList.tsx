import type { ConservationAction } from '@/types/action';
import { ActionCard } from './ActionCard';
import { useAppTranslation } from '@/hooks/useTranslation';
import { ClipboardList } from 'lucide-react';

interface ActionListProps {
  actions: ConservationAction[];
  showVerifyButton?: boolean;
  onVerify?: (action: ConservationAction) => void;
  onReject?: (action: ConservationAction) => void;
}

export function ActionList({ actions, showVerifyButton, onVerify, onReject }: ActionListProps) {
  const { t } = useAppTranslation();

  if (actions.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-gray-200 p-8 text-center">
        <ClipboardList className="mx-auto h-10 w-10 text-gray-300" />
        <p className="mt-2 text-sm text-gray-500">{t('member.no_actions')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {actions.map((action) => (
        <ActionCard
          key={action.id}
          action={action}
          showVerifyButton={showVerifyButton}
          onVerify={onVerify}
          onReject={onReject}
        />
      ))}
    </div>
  );
}
