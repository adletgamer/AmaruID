import { useAppTranslation } from '@/hooks/useTranslation';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const { currentLanguage, changeLanguage, isSpanish } = useAppTranslation();

  return (
    <button
      onClick={() => changeLanguage(isSpanish ? 'en' : 'es')}
      className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700"
      title={isSpanish ? 'Switch to English' : 'Cambiar a Español'}
    >
      <Globe className="h-4 w-4" />
      <span>{isSpanish ? 'EN' : 'ES'}</span>
    </button>
  );
}
