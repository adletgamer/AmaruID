import { useOfflineContext } from '@/contexts/OfflineContext';
import { useAppTranslation } from '@/hooks/useTranslation';
import { Wifi, WifiOff, CloudUpload } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export function OfflineIndicator() {
  const { isOnline, pendingSync } = useOfflineContext();
  const { t } = useAppTranslation();

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
          isOnline
            ? 'bg-emerald-50 text-emerald-700'
            : 'bg-amber-50 text-amber-700'
        )}
      >
        {isOnline ? (
          <Wifi className="h-3.5 w-3.5" />
        ) : (
          <WifiOff className="h-3.5 w-3.5" />
        )}
        <span>{isOnline ? t('common.online') : t('common.offline')}</span>
      </div>

      {pendingSync > 0 && (
        <div className="flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
          <CloudUpload className="h-3.5 w-3.5" />
          <span>{pendingSync}</span>
        </div>
      )}
    </div>
  );
}
