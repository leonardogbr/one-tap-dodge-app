/**
 * i18n — pt-BR, es, en. Phase 4. Locale from settings or system.
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as RNLocalize from 'react-native-localize';

import en from './locales/en.json';
import es from './locales/es.json';
import ptBR from './locales/pt-BR.json';

const resources = {
  en: { translation: en },
  es: { translation: es },
  'pt-BR': { translation: ptBR },
};

function getDeviceLocale(): string {
  const locales = RNLocalize.getLocales();
  const tag = locales[0]?.languageTag ?? 'en';
  if (tag.startsWith('pt')) return 'pt-BR';
  if (tag.startsWith('es')) return 'es';
  return 'en';
}

export type ResolvedLocale = 'pt-BR' | 'es' | 'en';

export function initI18n(savedLocale: 'pt-BR' | 'es' | 'en' | 'system'): void {
  const lng = savedLocale === 'system' ? getDeviceLocale() : savedLocale;
  const supported: ResolvedLocale[] = ['en', 'es', 'pt-BR'];
  const lang = supported.includes(lng as ResolvedLocale) ? (lng as ResolvedLocale) : 'en';

  i18n.use(initReactI18next).init({
    resources,
    lng: lang,
    fallbackLng: 'en',
    compatibilityJSON: 'v4',
    react: { useSuspense: false },
  });
}

export function changeLanguage(locale: 'pt-BR' | 'es' | 'en' | 'system'): void {
  const lng = locale === 'system' ? getDeviceLocale() : locale;
  const supported = ['en', 'es', 'pt-BR'];
  i18n.changeLanguage(supported.includes(lng) ? lng : 'en');
}

export { i18n };
