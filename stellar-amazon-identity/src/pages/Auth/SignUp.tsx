import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppTranslation } from '@/hooks/useTranslation';
import { useAuthContext } from '@/contexts/AuthContext';
import { useAccounts } from '@/hooks/useAccounts';
import { AccountStatus } from '@/components/accounts/AccountStatus';
import { CopyButton } from '@/components/common/CopyButton';
import type { LeaderAccount, MemberAccount } from '@/types/account';
import { AlertCircle, CheckCircle2, UserPlus } from 'lucide-react';

type SignupRole = 'member' | 'leader';

type CreatedAccount = LeaderAccount | MemberAccount;

export function SignUpPage() {
  const { t } = useAppTranslation();
  const navigate = useNavigate();
  const { selectAccount } = useAuthContext();
  const { community, createLeader, createMember, loading, error } = useAccounts();

  const [role, setRole] = useState<SignupRole>('member');
  const [name, setName] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedAccount | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    const trimmed = name.trim();
    if (!trimmed) {
      setLocalError(t('auth.name_required'));
      return;
    }

    if (!community) {
      setLocalError(t('auth.community_required'));
      return;
    }

    const result = role === 'leader'
      ? await createLeader(trimmed, community.id)
      : await createMember(trimmed, community.id);

    if (!result) {
      return;
    }

    setCreated(result);
    selectAccount(result);
  };

  const goToDashboard = () => {
    if (!created) return;
    navigate(created.role === 'leader' ? '/leader' : '/member');
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          <UserPlus className="h-6 w-6 text-emerald-600" />
          {t('auth.signup_title')}
        </h1>
        <p className="mt-1 text-sm text-gray-600">{t('auth.signup_subtitle')}</p>
      </div>

      <div className="mt-8">
        {!community ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <p className="text-sm font-medium text-amber-900">{t('auth.community_required')}</p>
            <p className="mt-1 text-sm text-amber-800">{t('auth.go_to_setup_hint')}</p>
            <div className="mt-4 flex gap-2">
              <Link
                to="/setup"
                className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                {t('auth.go_to_setup')}
              </Link>
              <Link
                to="/login"
                className="rounded-lg border border-amber-300 bg-white px-5 py-2 text-sm font-medium text-amber-900 hover:bg-amber-100"
              >
                {t('auth.login')}
              </Link>
            </div>
          </div>
        ) : created ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-6 w-6 text-emerald-600" />
              <div className="flex-1">
                <h2 className="text-lg font-bold text-emerald-900">{t('auth.created_success')}</h2>
                <p className="mt-1 text-sm text-emerald-800">{t('auth.copy_secret_warning')}</p>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-emerald-200 bg-white p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{created.name}</p>
                  <p className="text-xs text-gray-500">{t('auth.role_' + created.role)}</p>
                </div>
                <AccountStatus account={created} />
              </div>

              <div className="mt-4 space-y-3">
                <div>
                  <p className="text-xs font-semibold text-gray-600">{t('auth.public_key')}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <code className="text-xs text-gray-600">{created.publicKey}</code>
                    <CopyButton text={created.publicKey} />
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-600">{t('auth.secret_key')}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <code className="text-xs text-gray-600">{created.secretKey}</code>
                    <CopyButton text={created.secretKey} />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-col justify-end gap-2 sm:flex-row">
              <Link
                to="/login"
                className="rounded-lg border border-emerald-300 bg-white px-5 py-2 text-sm font-medium text-emerald-900 hover:bg-emerald-100"
              >
                {t('auth.login')}
              </Link>
              <button
                onClick={goToDashboard}
                className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                {t('auth.go_to_dashboard')}
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            {(localError || error) && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {localError || error}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 p-4 hover:bg-gray-50">
                  <input
                    type="radio"
                    name="role"
                    value="member"
                    checked={role === 'member'}
                    onChange={() => setRole('member')}
                  />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{t('auth.role_member')}</p>
                    <p className="text-xs text-gray-500">{t('auth.role_member_desc')}</p>
                  </div>
                </label>

                <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 p-4 hover:bg-gray-50">
                  <input
                    type="radio"
                    name="role"
                    value="leader"
                    checked={role === 'leader'}
                    onChange={() => setRole('leader')}
                  />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{t('auth.role_leader')}</p>
                    <p className="text-xs text-gray-500">{t('auth.role_leader_desc')}</p>
                  </div>
                </label>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">{t('auth.name')}</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder={t('auth.name_placeholder')}
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <Link to="/login" className="text-sm font-medium text-emerald-700 hover:underline">
                  {t('auth.have_account')}
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {loading ? t('common.loading') : t('auth.create_button')}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
