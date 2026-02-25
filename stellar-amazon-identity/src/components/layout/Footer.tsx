import { useAppTranslation } from '@/hooks/useTranslation';
import { Heart, ExternalLink } from 'lucide-react';

export function Footer() {
  const { t } = useAppTranslation();

  return (
    <footer className="border-t border-emerald-100 bg-emerald-50/50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>{t('footer.built_with')}</span>
            <Heart className="h-4 w-4 text-red-500" />
            <span>{t('footer.on_stellar')}</span>
          </div>
          <p className="text-xs font-medium text-emerald-700">
            {t('footer.for_award')}
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <a
              href="https://stellar.org"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-emerald-600"
            >
              Stellar <ExternalLink className="h-3 w-3" />
            </a>
            <a
              href="https://stellarchain.io"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-emerald-600"
            >
              Explorer <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} <span className="font-brand">AmaruID</span> — Testnet Only
          </p>
        </div>
      </div>
    </footer>
  );
}
