import type { SupportedLanguage } from '../../../../i18n';

export interface LanguageSwitcherProps {
  className?: string;
  variant?: 'default' | 'compact';
}

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  flag: string;
}
