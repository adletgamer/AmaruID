import { useAuthContext } from '@/contexts/AuthContext';
import { useAppTranslation } from '@/hooks/useTranslation';
import { ExplorerLink } from '@/components/common/ExplorerLink';
import { CopyButton } from '@/components/common/CopyButton';
import { truncateAddress } from '@/lib/utils/formatters';
import { CheckCircle2, ArrowLeft, Users, Shield, User, PartyPopper } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Step3Props {
  onBack: () => void;
}

export function Step3Verify({ onBack }: Step3Props) {
  const { t } = useAppTranslation();
  const { community, leaders, members } = useAuthContext();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">{t('setup.step3_title')}</h2>
        <p className="mt-1 text-sm text-gray-600">{t('setup.step3_desc')}</p>
      </div>

      <div className="rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 p-6">
        <div className="flex items-center gap-3">
          <PartyPopper className="h-8 w-8 text-emerald-600" />
          <div>
            <h3 className="text-lg font-bold text-emerald-800">¡Configuración Completa!</h3>
            <p className="text-sm text-emerald-600">Todas las cuentas han sido creadas y configuradas</p>
          </div>
        </div>
      </div>

      {/* Community */}
      {community && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
            <Users className="h-4 w-4" />
            Comunidad: {community.name}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <code className="text-xs text-gray-500">{truncateAddress(community.publicKey, 10, 6)}</code>
            <CopyButton text={community.publicKey} />
            <ExplorerLink type="account" id={community.publicKey} />
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
            Multisig: {community.signers.length} firmantes
          </div>
        </div>
      )}

      {/* Leaders */}
      <div className="space-y-2">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-blue-700">
          <Shield className="h-4 w-4" />
          Líderes ({leaders.length})
        </h4>
        {leaders.map((leader) => (
          <div key={leader.id} className="flex items-center justify-between rounded-lg border border-gray-100 bg-white p-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-medium">{leader.name}</span>
              <code className="text-xs text-gray-400">{truncateAddress(leader.publicKey)}</code>
            </div>
            <div className="flex items-center gap-1">
              <CopyButton text={leader.publicKey} />
              <ExplorerLink type="account" id={leader.publicKey} />
            </div>
          </div>
        ))}
      </div>

      {/* Members */}
      <div className="space-y-2">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-amber-700">
          <User className="h-4 w-4" />
          Miembros ({members.length})
        </h4>
        {members.map((member) => (
          <div key={member.id} className="flex items-center justify-between rounded-lg border border-gray-100 bg-white p-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-amber-400" />
              <span className="text-sm font-medium">{member.name}</span>
              <code className="text-xs text-gray-400">{truncateAddress(member.publicKey)}</code>
            </div>
            <div className="flex items-center gap-1">
              <CopyButton text={member.publicKey} />
              <ExplorerLink type="account" id={member.publicKey} />
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between pt-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('setup.prev_step')}
        </button>

        <div className="flex gap-3">
          <Link
            to="/member"
            className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-amber-700"
          >
            Ir a Miembro
          </Link>
          <Link
            to="/leader"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Ir a Líder
          </Link>
        </div>
      </div>
    </div>
  );
}
