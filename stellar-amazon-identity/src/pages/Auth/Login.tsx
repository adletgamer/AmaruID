import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { useAppTranslation } from '@/hooks/useTranslation';
import { AccountCard } from '@/components/accounts/AccountCard';
import { useOfflineStorage } from '@/hooks/useOfflineStorage';
import { isValidSecretKey, publicKeyFromSecret } from '@/lib/crypto/keys';
import { accountExists } from '@/lib/stellar/client';
import { useStellar } from '@/hooks/useStellar';
import type { LeaderAccount, MemberAccount } from '@/types/account';
import { AlertCircle, KeyRound, LogIn, RefreshCcw, UserPlus } from 'lucide-react';

type ImportRole = 'leader' | 'member';

export function LoginPage() {
  const { t } = useAppTranslation();
  const {
    community,
    leaders,
    members,
    currentAccount,
    selectAccount,
    clearAccount,
    refreshAccounts,
    isLoaded,
  } = useAuthContext();
  const navigate = useNavigate();
  const { isOnline } = useStellar();
  const { saveLeader, saveMember } = useOfflineStorage();

  const [importRole, setImportRole] = useState<ImportRole>('member');
  const [importName, setImportName] = useState('');
  const [importSecretKey, setImportSecretKey] = useState('');
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const allAccounts = useMemo(() => {
    return [
      ...(community ? [community] : []),
      ...leaders,
      ...members,
    ];
  }, [community, leaders, members]);

  const goToDashboard = (role: 'community' | 'leader' | 'member') => {
    if (role === 'member') navigate('/member');
    else if (role === 'leader') navigate('/leader');
    else navigate('/setup');
  };

  const handleSelect = (account: typeof allAccounts[number]) => {
    selectAccount(account);
    goToDashboard(account.role);
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setImportError(null);

    const name = importName.trim();
    const secret = importSecretKey.trim();

    if (!name) {
      setImportError(t('auth.name_required'));
      return;
    }

    if (!isValidSecretKey(secret)) {
      setImportError(t('auth.invalid_secret'));
      return;
    }

    if (!community) {
      setImportError(t('auth.community_required'));
      return;
    }

    setImporting(true);
    try {
      const publicKey = publicKeyFromSecret(secret);
      const funded = isOnline ? await accountExists(publicKey) : false;

      if (importRole === 'leader') {
        const leader: LeaderAccount = {
          id: crypto.randomUUID(),
          publicKey,
          secretKey: secret,
          name,
          role: 'leader',
          communityId: community.id,
          createdAt: new Date().toISOString(),
          funded,
        };
        await saveLeader(leader);
        await refreshAccounts();
        selectAccount(leader);
        goToDashboard('leader');
        return;
      }

      const member: MemberAccount = {
        id: crypto.randomUUID(),
        publicKey,
        secretKey: secret,
        name,
        role: 'member',
        communityId: community.id,
        certified: false,
        createdAt: new Date().toISOString(),
        funded,
      };
      await saveMember(member);
      await refreshAccounts();
      selectAccount(member);
      goToDashboard('member');
    } catch (err) {
      setImportError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <LogIn className="h-6 w-6 text-emerald-600" />
            {t('auth.login_title')}
          </h1>
          <p className="mt-1 text-sm text-gray-600">{t('auth.login_subtitle')}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refreshAccounts}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <RefreshCcw className="h-4 w-4" />
            {t('common.refresh')}
          </button>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            <UserPlus className="h-4 w-4" />
            {t('auth.signup')}
          </Link>
        </div>
      </div>

      {!isLoaded ? (
        <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6">
          <p className="text-sm text-gray-600">{t('common.loading')}</p>
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          {currentAccount && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <p className="text-sm font-semibold text-emerald-800">
                    {t('auth.current_session')}: <span className="font-bold">{currentAccount.name}</span>
                  </p>
                  <p className="mt-1 text-xs text-emerald-700">{t('auth.role_' + currentAccount.role)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => goToDashboard(currentAccount.role)}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                  >
                    {t('auth.continue')}
                  </button>
                  <button
                    onClick={clearAccount}
                    className="rounded-lg border border-emerald-300 bg-white px-4 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100"
                  >
                    {t('auth.logout')}
                  </button>
                </div>
              </div>
            </div>
          )}

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-700">{t('auth.saved_identities')}</h2>

            {allAccounts.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-10 text-center">
                <p className="text-sm text-gray-600">{t('auth.no_saved_identities')}</p>
                <div className="mt-4 flex flex-col justify-center gap-2 sm:flex-row">
                  <Link
                    to="/setup"
                    className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                  >
                    {t('auth.go_to_setup')}
                  </Link>
                  <Link
                    to="/signup"
                    className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    {t('auth.signup')}
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {allAccounts.map((account) => (
                  <AccountCard
                    key={account.id}
                    account={account}
                    onSelect={handleSelect}
                    selected={currentAccount?.id === account.id}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
              <KeyRound className="h-4 w-4 text-emerald-600" />
              {t('auth.import_title')}
            </div>
            <p className="mt-1 text-sm text-gray-600">{t('auth.import_subtitle')}</p>

            {importError && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {importError}
              </div>
            )}

            <form onSubmit={handleImport} className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <label className="mb-1 block text-xs font-semibold text-gray-600">{t('auth.import_role')}</label>
                <select
                  value={importRole}
                  onChange={(e) => setImportRole(e.target.value as ImportRole)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="member">{t('auth.role_member')}</option>
                  <option value="leader">{t('auth.role_leader')}</option>
                </select>
              </div>

              <div className="sm:col-span-1">
                <label className="mb-1 block text-xs font-semibold text-gray-600">{t('auth.name')}</label>
                <input
                  value={importName}
                  onChange={(e) => setImportName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder={t('auth.name_placeholder')}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-gray-600">{t('auth.secret_key')}</label>
                <textarea
                  value={importSecretKey}
                  onChange={(e) => setImportSecretKey(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder={t('auth.secret_placeholder')}
                />
              </div>

              <div className="sm:col-span-2 flex items-center justify-between gap-3">
                <p className="text-xs text-gray-500">
                  {isOnline ? t('auth.online_hint') : t('auth.offline_hint')}
                </p>
                <button
                  type="submit"
                  disabled={importing}
                  className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {importing ? t('common.loading') : t('auth.import_button')}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
