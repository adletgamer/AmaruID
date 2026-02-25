import { useState } from 'react';
import { useAccounts } from '@/hooks/useAccounts';
import { useAppTranslation } from '@/hooks/useTranslation';
import { AccountCreator } from '@/components/accounts/AccountCreator';
import { AccountList } from '@/components/accounts/AccountList';
import { AlertCircle, CheckCircle2, Users, Shield, User } from 'lucide-react';

interface Step1Props {
  onNext: () => void;
}

export function Step1Accounts({ onNext }: Step1Props) {
  const { t } = useAppTranslation();
  const { community, leaders, members, createCommunity, createLeader, createMember, loading, error } = useAccounts();
  const [communityDesc, setCommunityDesc] = useState('Comunidad indígena amazónica protectora de la selva');

  const canProceed = community && leaders.length >= 2 && members.length >= 1;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900">
          <Users className="h-5 w-5 text-emerald-600" />
          {t('setup.step1_title')}
        </h2>
        <p className="mt-1 text-sm text-gray-600">{t('setup.step1_desc')}</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Community Account */}
      <div className="space-y-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <Users className="h-4 w-4 text-emerald-500" />
          Cuenta de la Comunidad (Multisig)
        </h3>
        {!community ? (
          <div className="space-y-2">
            <input
              type="text"
              value={communityDesc}
              onChange={(e) => setCommunityDesc(e.target.value)}
              placeholder="Descripción de la comunidad"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <AccountCreator
              role="community"
              onCreateAccount={async (name) => {
                await createCommunity(name, communityDesc);
              }}
              loading={loading}
            />
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            Comunidad <strong>{community.name}</strong> creada
            {community.funded ? ' y fondeada' : ' (pendiente de fondeo)'}
          </div>
        )}
      </div>

      {/* Leader Accounts */}
      <div className="space-y-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <Shield className="h-4 w-4 text-blue-500" />
          Líderes (mínimo 2 para multisig)
        </h3>
        {community && (
          <AccountCreator
            role="leader"
            onCreateAccount={async (name) => {
              await createLeader(name, community.id);
            }}
            loading={loading}
          />
        )}
        <AccountList accounts={leaders} />
      </div>

      {/* Member Accounts */}
      <div className="space-y-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <User className="h-4 w-4 text-amber-500" />
          Miembros
        </h3>
        {community && (
          <AccountCreator
            role="member"
            onCreateAccount={async (name) => {
              await createMember(name, community.id);
            }}
            loading={loading}
          />
        )}
        <AccountList accounts={members} />
      </div>

      {/* Next button */}
      <div className="flex justify-end pt-4">
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
        >
          {t('setup.next_step')}
        </button>
      </div>

      {!canProceed && (
        <p className="text-center text-xs text-gray-400">
          Necesitas: 1 comunidad + 2 líderes + 1 miembro para continuar
        </p>
      )}
    </div>
  );
}
