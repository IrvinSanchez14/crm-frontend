# Internationalization (i18n) Guide

## 📚 Overview

The CRM frontend application supports multiple languages using **react-i18next**, the industry-standard internationalization framework for React applications. The implementation follows best practices for scalability, performance, and maintainability.

### Supported Languages
- 🇺🇸 **English (en)** - Default
- 🇪🇸 **Spanish (es)**

## 🏗️ Architecture

### Directory Structure
```
src/i18n/
├── config.ts                 # i18n configuration and initialization
├── hooks.ts                  # Custom hooks for i18n operations
├── index.ts                  # Public API exports
├── types/
│   └── i18next.d.ts         # TypeScript type definitions
└── locales/
    ├── en/                   # English translations
    │   ├── common.json       # Common translations (navigation, actions, etc.)
    │   ├── auth.json         # Authentication-related translations
    │   ├── clients.json      # Clients feature translations
    │   └── projects.json     # Projects feature translations
    └── es/                   # Spanish translations
        ├── common.json
        ├── auth.json
        ├── clients.json
        └── projects.json
```

### Key Design Decisions

1. **Namespace-based Organization**: Translations are organized by feature/domain
2. **Type Safety**: Full TypeScript support with type-safe translation keys
3. **Performance**: Lazy loading with Suspense for optimal bundle size
4. **Persistence**: Language preference stored in localStorage
5. **Browser Detection**: Automatic language detection based on browser settings

## 🚀 Usage

### Basic Translation

```tsx
import { useTranslation } from '../../../i18n';

function MyComponent() {
  const { t } = useTranslation('common'); // Specify namespace
  
  return (
    <div>
      <h1>{t('navigation.dashboard')}</h1>
      <button>{t('actions.save')}</button>
    </div>
  );
}
```

### With Interpolation

```tsx
const { t } = useTranslation('clients');

// Translation: "Total Clients: {{count}}"
<p>{t('totalClients', { count: 42 })}</p>
```

### Language Management

```tsx
import { useLanguage } from '../../../i18n';

function LanguageSelector() {
  const { currentLanguage, changeLanguage, availableLanguages } = useLanguage();
  
  return (
    <select 
      value={currentLanguage} 
      onChange={(e) => changeLanguage(e.target.value)}
    >
      {availableLanguages.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.name}
        </option>
      ))}
    </select>
  );
}
```

### Using Default Namespace

```tsx
// No namespace specified = uses 'common' namespace
const { t } = useTranslation();

<button>{t('actions.cancel')}</button>
```

## 🧩 Components

### LanguageSwitcher Component

A pre-built, accessible language switcher component is available:

```tsx
import { LanguageSwitcher } from '../shared/components/molecules/LanguageSwitcher';

function Header() {
  return (
    <header>
      <LanguageSwitcher variant="default" />
      {/* or */}
      <LanguageSwitcher variant="compact" />
    </header>
  );
}
```

**Features:**
- Dropdown with language flags
- Keyboard navigation support
- Click-outside to close
- Smooth animations
- Accessible (ARIA attributes)
- Responsive design

## 📝 Adding New Translations

### 1. Add Translation Keys

**English (en/common.json)**
```json
{
  "myFeature": {
    "title": "My Feature",
    "description": "Feature description"
  }
}
```

**Spanish (es/common.json)**
```json
{
  "myFeature": {
    "title": "Mi Función",
    "description": "Descripción de la función"
  }
}
```

### 2. Create New Namespace (Optional)

For new features with many translations:

1. Create `en/myfeature.json` and `es/myfeature.json`
2. Import in `src/i18n/config.ts`:

```typescript
import myFeatureEn from './locales/en/myfeature.json';
import myFeatureEs from './locales/es/myfeature.json';

const resources = {
  en: {
    common: commonEn,
    myfeature: myFeatureEn, // Add here
  },
  es: {
    common: commonEs,
    myfeature: myFeatureEs, // Add here
  },
};
```

3. Use in components:

```tsx
const { t } = useTranslation('myfeature');
```

## 🎨 Best Practices

### ✅ DO

- Use namespaces to organize translations by feature
- Keep translation keys hierarchical (e.g., `clients.form.name`)
- Store all user-facing text in translation files
- Use interpolation for dynamic content
- Provide context in translation keys

### ❌ DON'T

- Hard-code strings in components
- Create overly generic keys like `text1`, `text2`
- Mix languages in the same translation file
- Forget to add translations for both languages
- Use translation keys as display text

### Example: Good vs Bad

**❌ Bad**
```tsx
<button>Save</button> // Hard-coded string
const { t } = useTranslation();
<h1>{t('text1')}</h1> // Non-descriptive key
```

**✅ Good**
```tsx
<button>{t('actions.save')}</button> // Translated
const { t } = useTranslation('clients');
<h1>{t('clients.title')}</h1> // Clear, namespaced key
```

## 🔧 Configuration

### Main Configuration (`config.ts`)

```typescript
export const SUPPORTED_LANGUAGES = ['en', 'es'] as const;
export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

i18n.init({
  defaultNS: 'common',           // Default namespace
  fallbackLng: DEFAULT_LANGUAGE, // Fallback language
  supportedLngs: SUPPORTED_LANGUAGES,
  detection: {
    order: ['localStorage', 'navigator'], // Detection order
    caches: ['localStorage'],              // Persist in localStorage
  },
});
```

### Adding a New Language

1. Add language code to `SUPPORTED_LANGUAGES`
2. Add display name to `LANGUAGE_NAMES`
3. Create translation files in `locales/{lang}/`
4. Import and add to `resources` object
5. Update `LanguageSwitcher` component with flag emoji

## 🧪 Testing with i18n

### Mock Translations in Tests

```tsx
// test-utils.tsx
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';

i18n.init({
  lng: 'en',
  fallbackLng: 'en',
  resources: {
    en: { common: { ... } }
  },
});

function render(ui: ReactElement) {
  return {
    ...defaultRender(
      <I18nextProvider i18n={i18n}>
        {ui}
      </I18nextProvider>
    ),
  };
}
```

## 🌟 Advanced Features

### Pluralization

```json
{
  "itemCount": "{{count}} item",
  "itemCount_plural": "{{count}} items"
}
```

```tsx
t('itemCount', { count: 1 }); // "1 item"
t('itemCount', { count: 5 }); // "5 items"
```

### Formatting

Use interpolation for numbers, dates, and currencies:

```tsx
// Translation: "Price: {{price}}"
t('product.price', { 
  price: new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(99.99)
});
```

### Nested Keys

```json
{
  "form": {
    "fields": {
      "email": {
        "label": "Email Address",
        "placeholder": "Enter your email",
        "errors": {
          "required": "Email is required",
          "invalid": "Invalid email format"
        }
      }
    }
  }
}
```

```tsx
t('form.fields.email.label'); // "Email Address"
t('form.fields.email.errors.required'); // "Email is required"
```

## 📊 Current Translation Coverage

| Namespace | Keys | Status |
|-----------|------|--------|
| common    | 45+  | ✅ Complete |
| auth      | 10+  | ✅ Complete |
| clients   | 15+  | ✅ Complete |
| projects  | 18+  | ✅ Complete |

## 🔗 Resources

- [react-i18next Documentation](https://react.i18next.com/)
- [i18next Documentation](https://www.i18next.com/)
- [i18next Browser Language Detector](https://github.com/i18next/i18next-browser-languageDetector)

## 🚦 Migration Checklist

When migrating existing components to use i18n:

- [ ] Import `useTranslation` hook
- [ ] Replace all hard-coded strings with translation keys
- [ ] Add translation keys to both `en` and `es` files
- [ ] Test component in both languages
- [ ] Update component tests if needed
- [ ] Remove any English-specific comments

## 💡 Tips

1. **Use namespaces** for large features to keep files manageable
2. **Group related translations** with consistent key naming
3. **Keep translation files in sync** between languages
4. **Test language switching** in development mode
5. **Use type-safe keys** by leveraging TypeScript autocomplete

---

**Last Updated:** 2026-02-05  
**Maintainer:** Development Team
