/**
 * Custom i18n hooks
 * Best Practice: Encapsulates i18n logic for reusability
 * Performance: Memoized values to prevent unnecessary re-renders
 * Maintainability: Single source of truth for i18n operations
 */

import { useCallback, useMemo } from 'react';
import { useTranslation as useI18nTranslation } from 'react-i18next';
import type { SupportedLanguage } from './config';
import { SUPPORTED_LANGUAGES, LANGUAGE_NAMES } from './config';

/**
 * Custom hook for translations with type safety
 * Usage: const { t } = useTranslation('namespace');
 */
export function useTranslation(namespace?: string) {
  return useI18nTranslation(namespace);
}

/**
 * Hook for language management
 * Provides current language, change handler, and available languages
 */
export function useLanguage() {
  const { i18n } = useI18nTranslation();

  const currentLanguage = useMemo(
    () => i18n.language as SupportedLanguage,
    [i18n.language]
  );

  const changeLanguage = useCallback(
    async (lng: SupportedLanguage) => {
      if (!SUPPORTED_LANGUAGES.includes(lng)) {
        console.warn(`Language ${lng} is not supported`);
        return;
      }
      await i18n.changeLanguage(lng);
    },
    [i18n]
  );

  const availableLanguages = useMemo(
    () =>
      SUPPORTED_LANGUAGES.map((lang) => ({
        code: lang,
        name: LANGUAGE_NAMES[lang],
      })),
    []
  );

  return {
    currentLanguage,
    changeLanguage,
    availableLanguages,
    isRTL: false, // Can be extended for RTL languages
  };
}

/**
 * Hook for formatted translations with interpolation
 * Useful for complex translations with variables
 */
export function useFormattedTranslation(namespace?: string) {
  const { t } = useI18nTranslation(namespace);

  const formatTranslation = useCallback(
    (key: string, values?: Record<string, string | number>) => {
      return t(key, values);
    },
    [t]
  );

  return { formatTranslation, t };
}
