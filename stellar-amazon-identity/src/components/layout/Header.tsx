import { Link, useLocation } from 'react-router-dom';
import { useAppTranslation } from '@/hooks/useTranslation';
import { useAuthContext } from '@/contexts/AuthContext';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { OfflineIndicator } from '@/components/common/OfflineIndicator';
import { Menu, X, Trees, LogIn, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils/cn';

export function Header() {
  const { t } = useAppTranslation();
  const { currentAccount } = useAuthContext();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { to: '/', label: t('nav.home') },
    { to: '/setup', label: t('nav.setup') },
    { to: '/member', label: t('nav.member') },
    { to: '/leader', label: t('nav.leader') },
    { to: '/explorer', label: t('nav.explorer') },
    { to: '/demo', label: t('nav.demo') },
  ];

  const authItems = currentAccount
    ? []
    : [
        { to: '/login', label: t('nav.login'), icon: LogIn },
        { to: '/signup', label: t('nav.signup'), icon: UserPlus },
      ];

  return (
    <header className="sticky top-0 z-50 border-b border-emerald-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <Trees className="h-8 w-8 text-emerald-600" />
          <span className="font-brand text-xl text-emerald-800">AmaruID</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                location.pathname === item.to
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-700'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <OfflineIndicator />
          <LanguageSwitcher />

          {currentAccount ? (
            <Link
              to="/login"
              className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 md:flex"
            >
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              {currentAccount.name}
            </Link>
          ) : (
            <div className="hidden items-center gap-1.5 md:flex">
              {authItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                      item.to === '/signup'
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-700'
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          )}

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 md:hidden"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {menuOpen && (
        <nav className="border-t border-emerald-100 bg-white px-4 py-3 md:hidden">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMenuOpen(false)}
              className={cn(
                'block rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                location.pathname === item.to
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'text-gray-600 hover:bg-emerald-50'
              )}
            >
              {item.label}
            </Link>
          ))}
          {!currentAccount && (
            <div className="mt-2 flex gap-2 border-t border-gray-100 pt-2">
              {authItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      'inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      item.to === '/signup'
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          )}
        </nav>
      )}
    </header>
  );
}
