import { useAuthContext } from '@/contexts/AuthContext';
import { useAppTranslation } from '@/hooks/useTranslation';
import { AccountCard } from '@/components/accounts/AccountCard';
import { Link } from 'react-router-dom';
import { Award, CheckSquare, Shield, AlertTriangle, Settings, CheckCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getServer } from '@/lib/stellar/client';

interface MultisigStatus {
  configured: boolean;
  signerCount: number;
  threshold: number;
  leadersAreSigners: boolean;
}

export function LeaderDashboard() {
  const { t } = useAppTranslation();
  const { leaders, selectAccount, currentAccount, community } = useAuthContext();
  const [multisigStatus, setMultisigStatus] = useState<MultisigStatus | null>(null);
  const [checkingMultisig, setCheckingMultisig] = useState(false);

  // Check multisig status
  useEffect(() => {
    async function checkMultisig() {
      if (!community) return;
      setCheckingMultisig(true);
      try {
        const server = getServer();
        const account = await server.loadAccount(community.publicKey);
        const signerKeys = account.signers.map(s => s.key);
        const leaderKeys = leaders.map(l => l.publicKey);
        const leadersAreSigners = leaderKeys.length > 0 && leaderKeys.every(k => signerKeys.includes(k));
        
        setMultisigStatus({
          configured: account.thresholds.med_threshold > 0 && leadersAreSigners,
          signerCount: account.signers.length,
          threshold: account.thresholds.med_threshold,
          leadersAreSigners,
        });
      } catch (err) {
        console.error('Error checking multisig:', err);
      } finally {
        setCheckingMultisig(false);
      }
    }
    checkMultisig();
  }, [community, leaders]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-gray-900">{t('leader.dashboard')}</h1>
      <p className="mt-1 text-sm text-gray-600">Gestionar certificaciones y verificar acciones</p>

      {leaders.length === 0 ? (
        <div className="mt-8 rounded-xl border-2 border-dashed border-gray-200 p-10 text-center">
          <Shield className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-3 text-gray-500">No hay líderes registrados aún.</p>
          <Link
            to="/setup"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Ir a Configuración
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {/* Multisig Status Banner */}
          {community && !checkingMultisig && multisigStatus && (
            <div className={`rounded-xl p-4 ${multisigStatus.configured 
              ? 'bg-emerald-50 border border-emerald-200' 
              : 'bg-amber-50 border border-amber-200'}`}
            >
              <div className="flex items-start gap-3">
                {multisigStatus.configured ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <h3 className={`font-semibold ${multisigStatus.configured ? 'text-emerald-800' : 'text-amber-800'}`}>
                    {multisigStatus.configured ? '✓ Multisig Configurado' : '⚠️ Multisig NO Configurado'}
                  </h3>
                  <p className={`text-sm mt-1 ${multisigStatus.configured ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {multisigStatus.configured 
                      ? `${multisigStatus.signerCount} firmantes, umbral: ${multisigStatus.threshold} firmas requeridas`
                      : 'Debes configurar el multisig antes de poder certificar miembros. Los líderes deben ser agregados como firmantes de la cuenta de comunidad.'}
                  </p>
                  {!multisigStatus.configured && (
                    <Link
                      to="/setup"
                      className="mt-3 inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
                    >
                      <Settings className="h-4 w-4" />
                      Ir a Configurar Multisig
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}

          <div>
            <h2 className="mb-3 text-sm font-semibold text-gray-700">Seleccionar Líder</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {leaders.map((leader) => (
                <AccountCard
                  key={leader.id}
                  account={leader}
                  selected={currentAccount?.id === leader.id}
                  onSelect={selectAccount}
                />
              ))}
            </div>
          </div>

          {currentAccount && currentAccount.role === 'leader' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Link
                to="/leader/certify"
                className={`group flex flex-col items-center gap-3 rounded-xl border p-6 transition-all ${
                  multisigStatus?.configured 
                    ? 'border-gray-200 bg-white hover:border-emerald-200 hover:shadow-md' 
                    : 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                }`}
                onClick={(e) => !multisigStatus?.configured && e.preventDefault()}
              >
                <Award className={`h-8 w-8 transition-transform ${multisigStatus?.configured ? 'text-emerald-500 group-hover:scale-110' : 'text-gray-400'}`} />
                <span className="text-sm font-semibold text-gray-700">{t('leader.pending_certifications')}</span>
                {!multisigStatus?.configured && (
                  <span className="text-xs text-amber-600">Requiere multisig</span>
                )}
              </Link>
              <Link
                to="/leader/verify-actions"
                className="group flex flex-col items-center gap-3 rounded-xl border border-gray-200 bg-white p-6 transition-all hover:border-emerald-200 hover:shadow-md"
              >
                <CheckSquare className="h-8 w-8 text-blue-500 transition-transform group-hover:scale-110" />
                <span className="text-sm font-semibold text-gray-700">{t('leader.pending_actions')}</span>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
