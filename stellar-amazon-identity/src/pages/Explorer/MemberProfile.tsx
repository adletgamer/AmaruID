import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { useAppTranslation } from '@/hooks/useTranslation';
import { useReputation } from '@/hooks/useReputation';
import { CertificateCard } from '@/components/certification/CertificateCard';
import { ReputationScoreDisplay } from '@/components/reputation/ReputationScore';
import { ExplorerLink } from '@/components/common/ExplorerLink';
import { CopyButton } from '@/components/common/CopyButton';
import { db } from '@/lib/storage/schema';
import type { ConservationAction } from '@/types/action';
import type { ReputationScore } from '@/types/reputation';
import { ActionCard } from '@/components/actions/ActionCard';
import { ArrowLeft, User } from 'lucide-react';

export function MemberProfile() {
  const { t } = useAppTranslation();
  const { publicKey } = useParams<{ publicKey: string }>();
  const { members } = useAuthContext();
  const { getScore } = useReputation();
  const [actions, setActions] = useState<ConservationAction[]>([]);
  const [score, setScore] = useState<ReputationScore | null>(null);

  const member = members.find((m) => m.publicKey === publicKey);

  const loadData = useCallback(async () => {
    if (!member) return;
    const memberActions = await db.actions
      .where('memberId')
      .equals(member.id)
      .filter((a) => a.status === 'verified')
      .toArray();
    setActions(memberActions);
    const rep = await getScore(member.id);
    if (rep) setScore(rep);
  }, [member, getScore]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!member) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center gap-3">
          <Link to="/explorer" className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900">{t('explorer.member_profile')}</h1>
        </div>
        <div className="rounded-xl border-2 border-dashed border-gray-200 p-8 text-center">
          <User className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-2 text-sm text-gray-500">Miembro no encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center gap-3">
        <Link to="/explorer" className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">{t('explorer.member_profile')}</h1>
      </div>

      <div className="space-y-6">
        <div className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-2xl font-brand">
              {member.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="font-display text-xl font-bold">{member.name}</h2>
              <p className="text-sm text-emerald-100">
                {member.certified ? t('member.certified') : t('member.not_certified')}
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <code className="text-xs text-emerald-200">
              {member.publicKey.substring(0, 12)}...{member.publicKey.slice(-6)}
            </code>
            <CopyButton text={member.publicKey} className="bg-white/20 text-white hover:bg-white/30" />
          </div>
          <div className="mt-2">
            <ExplorerLink type="account" id={member.publicKey} label={t('explorer.view_on_stellar')} className="text-emerald-200 hover:text-white" />
          </div>
        </div>

        <CertificateCard
          memberName={member.name}
          memberPublicKey={member.publicKey}
          certified={member.certified}
          certifiedAt={member.certifiedAt}
        />

        <ReputationScoreDisplay score={score} />

        {actions.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">{t('explorer.verified_actions')} ({actions.length})</h3>
            {actions.map((action) => (
              <ActionCard key={action.id} action={action} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
