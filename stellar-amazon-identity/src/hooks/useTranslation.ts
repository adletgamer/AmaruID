import { useTranslation as useI18nTranslation } from 'react-i18next';
import { useCallback } from 'react';

export function useAppTranslation() {
  const { t, i18n } = useI18nTranslation();

  const changeLanguage = useCallback(
    (lng: 'es' | 'en') => {
      i18n.changeLanguage(lng);
    },
    [i18n]
  );

  const currentLanguage = i18n.language as 'es' | 'en';

  const isSpanish = currentLanguage === 'es' || currentLanguage?.startsWith('es');

  return {
    t,
    i18n,
    changeLanguage,
    currentLanguage,
    isSpanish,
  };
}
