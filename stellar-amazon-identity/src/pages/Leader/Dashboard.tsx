import { useAuthContext } from '@/contexts/AuthContext';
import { useAppTranslation } from '@/hooks/useTranslation';
import { AccountCard } from '@/components/accounts/AccountCard';
import { Link } from 'react-router-dom';
import { Award, CheckSquare, Shield } from 'lucide-react';

export function LeaderDashboard() {
  const { t } = useAppTranslation();
  const { leaders, selectAccount, currentAccount } = useAuthContext();

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
                className="group flex flex-col items-center gap-3 rounded-xl border border-gray-200 bg-white p-6 transition-all hover:border-emerald-200 hover:shadow-md"
              >
                <Award className="h-8 w-8 text-emerald-500 transition-transform group-hover:scale-110" />
                <span className="text-sm font-semibold text-gray-700">{t('leader.pending_certifications')}</span>
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
