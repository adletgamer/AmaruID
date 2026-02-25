import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const loadTranslations = async () => {
  const [esRes, enRes] = await Promise.all([
    fetch('/locales/es/translation.json'),
    fetch('/locales/en/translation.json'),
  ]);
  const es = await esRes.json();
  const en = await enRes.json();
  return { es, en };
};

let initialized = false;

export async function initI18n() {
  if (initialized) return i18n;

  const { es, en } = await loadTranslations();

  await i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        es: { translation: es },
        en: { translation: en },
      },
      fallbackLng: 'es',
      supportedLngs: ['es', 'en'],
      nonExplicitSupportedLngs: true,
      interpolation: {
        escapeValue: false,
      },
      detection: {
        order: ['localStorage', 'navigator'],
        caches: ['localStorage'],
        lookupLocalStorage: 'i18nextLng',
      },
    });

  initialized = true;
  return i18n;
}

export default i18n;
