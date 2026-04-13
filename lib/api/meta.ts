import { META_OPTIONS_PATH } from '@/lib/config';
import { i18n } from '@/lib/i18n';

import { api, getApiErrorMessage } from './client';
import type { ApiEnvelope } from './types';
import { isApiFailure } from './types';

export type MetaOptionItem = { code: string; displayName: string };

/**
 * Known `categories` query values for `GET /meta/options?categories=...`
 * (comma-separated, max 10 per request).
 */
export const MetaCategory = {
  VEHICLE_TYPE: 'VEHICLE_TYPE',
  BODY_TYPE: 'BODY_TYPE',
  BODY_SPEC: 'BODY_SPEC',
  CANCELLATION_REASON_ORDER: 'CANCELLATION_REASON_ORDER',
  CANCELLATION_REASON_TRIP: 'CANCELLATION_REASON_TRIP',
  REJECTION_REASON: 'REJECTION_REASON',
  RATING: 'RATING',
  RATING_REASON: 'RATING_REASON',
} as const;

export type MetaCategoryCode = (typeof MetaCategory)[keyof typeof MetaCategory];

function normalizeItem(raw: unknown, language: 'en' | 'hi' | 'ta'): MetaOptionItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const code = typeof o.code === 'string' ? o.code : '';
  const localized =
    language === 'ta'
      ? o.displayNameTa ?? o.display_name_ta
      : language === 'hi'
        ? o.displayNameHi ?? o.display_name_hi
        : o.displayNameEn ?? o.display_name_en;
  const fallbackDisplayName =
    typeof o.displayName === 'string'
      ? o.displayName
      : typeof o.display_name === 'string'
        ? o.display_name
        : '';
  const displayName = (typeof localized === 'string' ? localized : '') || fallbackDisplayName;
  if (!code) return null;
  return { code, displayName: displayName || code };
}

function normalizeCategoryList(raw: unknown, language: 'en' | 'hi' | 'ta'): MetaOptionItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => normalizeItem(item, language)).filter((x): x is MetaOptionItem => x != null);
}

/**
 * `GET {API_BASE}{META_OPTIONS_PATH}?categories=CAT1,CAT2,...`
 * Auth: Bearer (same axios instance as other authenticated calls).
 */
export async function getMetaOptions(
  categories: string[],
): Promise<Record<string, MetaOptionItem[]>> {
  if (categories.length === 0 || categories.length > 10) {
    throw new Error('categories must have 1–10 entries');
  }
  const categoriesParam = categories.join(',');
  const lang: 'en' | 'hi' | 'ta' =
    i18n.language?.startsWith('ta') ? 'ta' : i18n.language?.startsWith('hi') ? 'hi' : 'en';
  try {
    const { data } = await api.get<ApiEnvelope<Record<string, unknown>>>(META_OPTIONS_PATH, {
      params: { categories: categoriesParam },
    });
    if (isApiFailure(data)) {
      throw new Error(data.message ?? 'Could not load options');
    }
    const payload = data.data;
    if (!payload || typeof payload !== 'object') {
      return {};
    }
    const out: Record<string, MetaOptionItem[]> = {};
    for (const key of categories) {
      out[key] = normalizeCategoryList((payload as Record<string, unknown>)[key], lang);
    }
    return out;
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

/** Vehicle onboarding: one call for type, body type, and body spec lists. */
export async function getVehicleOnboardingMeta(): Promise<{
  VEHICLE_TYPE: MetaOptionItem[];
  BODY_TYPE: MetaOptionItem[];
  BODY_SPEC: MetaOptionItem[];
}> {
  const data = await getMetaOptions([
    MetaCategory.VEHICLE_TYPE,
    MetaCategory.BODY_TYPE,
    MetaCategory.BODY_SPEC,
  ]);
  return {
    VEHICLE_TYPE: data.VEHICLE_TYPE ?? [],
    BODY_TYPE: data.BODY_TYPE ?? [],
    BODY_SPEC: data.BODY_SPEC ?? [],
  };
}
