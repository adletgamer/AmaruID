import type { AnyAccount } from '@/types/account';
import { useAppTranslation } from '@/hooks/useTranslation';
import { useOfflineContext } from '@/contexts/OfflineContext';
import { CheckCircle2, Clock, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface AccountStatusProps {
  account: AnyAccount;
  className?: string;
}

export function AccountStatus({ account, className }: AccountStatusProps) {
  const { t } = useAppTranslation();
  const { isOnline } = useOfflineContext();

  const isMember = account.role === 'member';
  const certified = isMember && 'certified' in account ? account.certified : undefined;

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
          account.funded ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
        )}
      >
        {account.funded ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
        {account.funded ? t('accounts.funded') : t('accounts.pending_funding')}
      </span>

      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
          isOnline ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-700'
        )}
      >
        {isOnline ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
        {isOnline ? t('common.online') : t('common.offline')}
      </span>

      {isMember && certified !== undefined && (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
            certified ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
          )}
        >
          {certified ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
          {certified ? t('accounts.certified') : t('accounts.pending_certification')}
        </span>
      )}
    </div>
  );
}
