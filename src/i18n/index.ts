/**
 * i18n module exports
 * Centralized export for easy imports
 */

export { default as i18n } from './config';
export { useTranslation, useLanguage, useFormattedTranslation } from './hooks';
export type { SupportedLanguage } from './config';
export { SUPPORTED_LANGUAGES, LANGUAGE_NAMES, DEFAULT_LANGUAGE } from './config';
