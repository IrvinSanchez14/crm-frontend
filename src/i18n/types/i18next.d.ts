/**
 * Type definitions for i18n
 * Provides type safety for translation keys
 */

import 'react-i18next';
import type { resources } from './config';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: typeof resources.en;
  }
}
