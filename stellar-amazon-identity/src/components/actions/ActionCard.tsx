import type { ConservationAction } from '@/types/action';
import { ACTION_CATEGORIES } from '@/types/action';
import { ExplorerLink } from '@/components/common/ExplorerLink';
import { formatRelativeTime } from '@/lib/utils/formatters';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface ActionCardProps {
  action: ConservationAction;
  showVerifyButton?: boolean;
  onVerify?: (action: ConservationAction) => void;
  onReject?: (action: ConservationAction) => void;
}

const statusConfig = {
  pending: { icon: Clock, color: 'amber', label: 'Pendiente' },
  verified: { icon: CheckCircle2, color: 'emerald', label: 'Verificada' },
  rejected: { icon: XCircle, color: 'red', label: 'Rechazada' },
};

export function ActionCard({ action, showVerifyButton, onVerify, onReject }: ActionCardProps) {
  const category = ACTION_CATEGORIES[action.category];
  const status = statusConfig[action.status];
  const StatusIcon = status.icon;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{category.icon}</span>
          <div>
            <h4 className="font-semibold text-gray-900">{action.title}</h4>
            <p className="text-xs text-gray-500">{category.labelEs}</p>
          </div>
        </div>
        <div className={cn(
          'flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
          `bg-${status.color}-100 text-${status.color}-700`
        )}>
          <StatusIcon className="h-3 w-3" />
          {status.label}
        </div>
      </div>

      <p className="mt-2 text-sm text-gray-600">{action.description}</p>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-gray-400">
          {formatRelativeTime(action.createdAt)}
        </span>
        {action.transactionHash && (
          <ExplorerLink type="transaction" id={action.transactionHash} label="Ver tx" />
        )}
      </div>

      {showVerifyButton && action.status === 'pending' && (
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => onVerify?.(action)}
            className="flex-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Verificar
          </button>
          <button
            onClick={() => onReject?.(action)}
            className="flex-1 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Rechazar
          </button>
        </div>
      )}
    </div>
  );
}
