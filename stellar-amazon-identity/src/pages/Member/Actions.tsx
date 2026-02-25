import { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useOfflineStorage } from '@/hooks/useOfflineStorage';
import { useAppTranslation } from '@/hooks/useTranslation';
import { ActionForm } from '@/components/actions/ActionForm';
import { ActionList } from '@/components/actions/ActionList';
import { recordAction } from '@/lib/stellar/accounts';
import type { ConservationAction } from '@/types/action';
import type { ActionFormValues } from '@/lib/utils/validators';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, X } from 'lucide-react';

export function MemberActions() {
  const { t } = useAppTranslation();
  const { currentAccount } = useAuthContext();
  const { saveAction, getActions, enqueueOfflineAction } = useOfflineStorage();
  const [actions, setActions] = useState<ConservationAction[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const member = currentAccount?.role === 'member' ? currentAccount : null;

  const loadActions = useCallback(async () => {
    if (!member) return;
    const acts = await getActions(member.id);
    setActions(acts);
  }, [member, getActions]);

  useEffect(() => {
    loadActions();
  }, [loadActions]);

  const handleSubmit = async (data: ActionFormValues) => {
    if (!member) return;
    setLoading(true);
    try {
      const actionId = crypto.randomUUID();
      const action: ConservationAction = {
        id: actionId,
        memberId: member.id,
        memberPublicKey: member.publicKey,
        category: data.category,
        title: data.title,
        description: data.description,
        evidenceUrl: data.evidenceUrl || undefined,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      await saveAction(action);

      // Try to record on Stellar
      if (navigator.onLine && 'secretKey' in member) {
        const result = await recordAction(member.secretKey, actionId, data.category, data.description);
        if (result.success) {
          action.transactionHash = result.hash;
          action.syncedAt = new Date().toISOString();
          await saveAction(action);
        }
      } else {
        await enqueueOfflineAction('action', { actionId, ...data });
      }

      setShowForm(false);
      await loadActions();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/member" className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900">{t('member.my_actions')}</h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? 'Cerrar' : t('member.submit_action')}
        </button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">{t('member.submit_action')}</h2>
          <ActionForm onSubmit={handleSubmit} loading={loading} />
        </div>
      )}

      <ActionList actions={actions} />
    </div>
  );
}
