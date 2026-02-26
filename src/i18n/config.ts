/**
 * i18n Configuration
 * Best Practice: Centralized configuration with type safety
 * Performance: Lazy loading of translation resources
 * Maintainability: Namespace-based organization
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import commonEn from './locales/en/common.json';
import commonEs from './locales/es/common.json';
import authEn from './locales/en/auth.json';
import authEs from './locales/es/auth.json';
import clientsEn from './locales/en/clients.json';
import clientsEs from './locales/es/clients.json';
import projectsEn from './locales/en/projects.json';
import projectsEs from './locales/es/projects.json';
import dashboardEn from './locales/en/dashboard.json';
import dashboardEs from './locales/es/dashboard.json';
import visitsEn from './locales/en/visits.json';
import visitsEs from './locales/es/visits.json';
import budgetsEn from './locales/en/budgets.json';
import budgetsEs from './locales/es/budgets.json';
import renderingsEn from './locales/en/renderings.json';
import renderingsEs from './locales/es/renderings.json';
import reportsEn from './locales/en/reports.json';
import reportsEs from './locales/es/reports.json';
import categoriesEn from './locales/en/categories.json';
import categoriesEs from './locales/es/categories.json';
import setupEn from './locales/en/setup.json';
import setupEs from './locales/es/setup.json';

// Supported languages
export const SUPPORTED_LANGUAGES = ['en', 'es'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

// Default language
export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

// Language display names
export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  en: 'English',
  es: 'Español',
};

// Resources type for type safety
const resources = {
  en: {
    common: commonEn,
    auth: authEn,
    clients: clientsEn,
    projects: projectsEn,
    dashboard: dashboardEn,
    visits: visitsEn,
    budgets: budgetsEn,
    renderings: renderingsEn,
    reports: reportsEn,
    categories: categoriesEn,
    setup: setupEn,
  },
  es: {
    common: commonEs,
    auth: authEs,
    clients: clientsEs,
    projects: projectsEs,
    dashboard: dashboardEs,
    visits: visitsEs,
    budgets: budgetsEs,
    renderings: renderingsEs,
    reports: reportsEs,
    categories: categoriesEs,
    setup: setupEs,
  },
} as const;

// Initialize i18next
i18n
  // Detect user language
  .use(LanguageDetector)
  // Pass i18n instance to react-i18next
  .use(initReactI18next)
  // Init i18next
  .init({
    resources,
    defaultNS: 'common',
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: SUPPORTED_LANGUAGES,

    // Language detection configuration
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },

    // Performance optimization
    load: 'languageOnly', // Load only 'en', not 'en-US'

    interpolation: {
      escapeValue: false, // React already escapes values
    },

    // Development options
    debug: import.meta.env.DEV,

    react: {
      useSuspense: false, // Disable to allow real-time language switching
      bindI18n: 'languageChanged', // Re-render when language changes
    },
  });

export default i18n;
