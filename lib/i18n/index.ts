import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '@/locales/en.json';
import hi from '@/locales/hi.json';
import ta from '@/locales/ta.json';

export type AppLanguage = 'en' | 'hi' | 'ta';

const STORAGE_KEY = '@driver/ui_language';

const resources = {
  en: { translation: en },
  hi: { translation: hi },
  ta: { translation: ta },
} as const;

let initPromise: Promise<void> | null = null;

function normalizeDeviceLanguageTag(tag: string | null | undefined): AppLanguage {
  const t = (tag ?? '').toLowerCase();
  if (t.startsWith('ta')) return 'ta';
  if (t.startsWith('hi')) return 'hi';
  return 'en';
}

export async function getStoredAppLanguage(): Promise<AppLanguage | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw === 'en' || raw === 'hi' || raw === 'ta') return raw;
    return null;
  } catch {
    return null;
  }
}

export async function setStoredAppLanguage(lang: AppLanguage): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // ignore
  }
}

export async function setAppLanguage(lang: AppLanguage): Promise<void> {
  await ensureI18nInitialized();
  await i18n.changeLanguage(lang);
  await setStoredAppLanguage(lang);
}

export async function ensureI18nInitialized(): Promise<void> {
  if (i18n.isInitialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const stored = await getStoredAppLanguage();
    const device = normalizeDeviceLanguageTag(Localization.getLocales?.()[0]?.languageTag);
    const initialLanguage: AppLanguage = stored ?? device ?? 'en';

    await i18n.use(initReactI18next).init({
      resources,
      lng: initialLanguage,
      fallbackLng: 'en',
      supportedLngs: ['en', 'hi', 'ta'],
      interpolation: { escapeValue: false },
      returnNull: false,
      returnEmptyString: false,
    });

    // Make sure the storage reflects what we ended up using.
    await setStoredAppLanguage(i18n.language as AppLanguage);
  })();

  return initPromise;
}

/**
 * After logout storage is cleared; reset in-memory UI language to device default
 * without persisting (user will confirm on the language screen).
 */
export function applyDeviceLanguageInMemoryOnly(): void {
  if (!i18n.isInitialized) return;
  const device = normalizeDeviceLanguageTag(Localization.getLocales?.()[0]?.languageTag);
  void i18n.changeLanguage(device);
}

export { i18n };

