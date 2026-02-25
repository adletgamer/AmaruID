import { useState, useEffect, useCallback } from 'react';
import { useAppTranslation } from '@/hooks/useTranslation';
import { useOfflineStorage } from '@/hooks/useOfflineStorage';
import { useReputation } from '@/hooks/useReputation';
import { ActionList } from '@/components/actions/ActionList';
import { db } from '@/lib/storage/schema';
import type { ConservationAction } from '@/types/action';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export function VerifyActions() {
  const { t } = useAppTranslation();
  const { getPendingActions } = useOfflineStorage();
  const { addEvent } = useReputation();
  const [pendingActions, setPendingActions] = useState<ConservationAction[]>([]);

  const loadPending = useCallback(async () => {
    const actions = await getPendingActions();
    setPendingActions(actions);
  }, [getPendingActions]);

  useEffect(() => {
    loadPending();
  }, [loadPending]);

  const handleVerify = async (action: ConservationAction) => {
    await db.actions.update(action.id, {
      status: 'verified',
      verifiedAt: new Date().toISOString(),
    });
    await addEvent(action.memberId, 'action_verified', `Acción verificada: ${action.title}`);
    await loadPending();
  };

  const handleReject = async (action: ConservationAction) => {
    await db.actions.update(action.id, {
      status: 'rejected',
      verifiedAt: new Date().toISOString(),
    });
    await loadPending();
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center gap-3">
        <Link to="/leader" className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">{t('leader.pending_actions')}</h1>
      </div>

      <ActionList
        actions={pendingActions}
        showVerifyButton
        onVerify={handleVerify}
        onReject={handleReject}
      />
    </div>
  );
}
