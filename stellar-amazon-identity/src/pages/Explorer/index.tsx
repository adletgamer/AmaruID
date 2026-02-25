import { useState } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useAppTranslation } from '@/hooks/useTranslation';
import { AccountCard } from '@/components/accounts/AccountCard';
import { ExplorerLink } from '@/components/common/ExplorerLink';
import { Search, Users, Shield, User } from 'lucide-react';
import { Link } from 'react-router-dom';

export function ExplorerPage() {
  const { t } = useAppTranslation();
  const { community, leaders, members } = useAuthContext();
  const [search, setSearch] = useState('');

  const allAccounts = [
    ...(community ? [community] : []),
    ...leaders,
    ...members,
  ];

  const filtered = search
    ? allAccounts.filter(
        (a) =>
          a.name.toLowerCase().includes(search.toLowerCase()) ||
          a.publicKey.toLowerCase().includes(search.toLowerCase())
      )
    : allAccounts;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-gray-900">{t('explorer.title')}</h1>
      <p className="mt-1 text-sm text-gray-600">
        Explora todas las identidades registradas en AmaruID
      </p>

      {/* Search */}
      <div className="relative mt-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('explorer.search_placeholder')}
          className="w-full rounded-xl border border-gray-300 py-3 pl-10 pr-4 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-emerald-50 p-4 text-center">
          <Users className="mx-auto h-5 w-5 text-emerald-600" />
          <p className="mt-1 text-2xl font-bold text-emerald-800">{community ? 1 : 0}</p>
          <p className="text-xs text-emerald-600">Comunidades</p>
        </div>
        <div className="rounded-lg bg-blue-50 p-4 text-center">
          <Shield className="mx-auto h-5 w-5 text-blue-600" />
          <p className="mt-1 text-2xl font-bold text-blue-800">{leaders.length}</p>
          <p className="text-xs text-blue-600">Líderes</p>
        </div>
        <div className="rounded-lg bg-amber-50 p-4 text-center">
          <User className="mx-auto h-5 w-5 text-amber-600" />
          <p className="mt-1 text-2xl font-bold text-amber-800">{members.length}</p>
          <p className="text-xs text-amber-600">Miembros</p>
        </div>
      </div>

      {/* Results */}
      <div className="mt-6 space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-gray-200 p-8 text-center">
            <Search className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-2 text-sm text-gray-500">{t('common.no_data')}</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {filtered.map((account) => (
              <div key={account.id}>
                <AccountCard account={account} />
                {account.role === 'member' && (
                  <div className="mt-1 px-2">
                    <Link
                      to={`/explorer/${account.publicKey}`}
                      className="text-xs text-emerald-600 hover:underline"
                    >
                      {t('common.view_details')} →
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
