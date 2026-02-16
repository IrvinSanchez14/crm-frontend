# i18n Usage Examples

## 🎯 Common Use Cases

### 1. Basic Translation in Component

```tsx
import { useTranslation } from '../../../i18n';

function SaveButton() {
  const { t } = useTranslation('common');
  
  return (
    <button>{t('actions.save')}</button>
  );
}

// Output (EN): "Save"
// Output (ES): "Guardar"
```

### 2. Translation with Namespace

```tsx
import { useTranslation } from '../../../i18n';

function ClientsPage() {
  const { t } = useTranslation('clients');
  
  return (
    <div>
      <h1>{t('title')}</h1>
      <button>{t('createClient')}</button>
    </div>
  );
}

// Output (EN): "Clients" / "Create Client"
// Output (ES): "Clientes" / "Crear Cliente"
```

### 3. Translation with Interpolation

```tsx
import { useTranslation } from '../../../i18n';

function ClientStats({ count }: { count: number }) {
  const { t } = useTranslation('clients');
  
  return (
    <p>{t('totalClients', { count })}</p>
  );
}

// Output (EN): "Total Clients: 42"
// Output (ES): "Total de Clientes: 42"
```

### 4. Form Labels and Placeholders

```tsx
import { useTranslation } from '../../../i18n';

function ClientForm() {
  const { t } = useTranslation('clients');
  
  return (
    <form>
      <label>{t('name')}</label>
      <input 
        type="text" 
        placeholder={t('name')}
      />
      
      <label>{t('email')}</label>
      <input 
        type="email" 
        placeholder={t('email')}
      />
      
      <button type="submit">
        {t('common:actions.save')}
      </button>
    </form>
  );
}
```

### 5. Status Messages

```tsx
import { useTranslation } from '../../../i18n';

function NotificationMessage({ type }: { type: 'success' | 'error' }) {
  const { t } = useTranslation('common');
  
  return (
    <div className={type}>
      {type === 'success' 
        ? t('messages.savedSuccessfully')
        : t('messages.errorLoading')
      }
    </div>
  );
}

// Output (EN): "Saved successfully" / "Error loading data"
// Output (ES): "Guardado exitosamente" / "Error al cargar datos"
```

### 6. Navigation Menu

```tsx
import { useTranslation } from '../../../i18n';
import { Link } from 'react-router-dom';

function Navigation() {
  const { t } = useTranslation('common');
  
  return (
    <nav>
      <Link to="/dashboard">{t('navigation.dashboard')}</Link>
      <Link to="/clients">{t('navigation.clients')}</Link>
      <Link to="/projects">{t('navigation.projects')}</Link>
      <Link to="/visits">{t('navigation.visits')}</Link>
    </nav>
  );
}
```

### 7. Table Headers

```tsx
import { useTranslation } from '../../../i18n';

function ClientsTable() {
  const { t } = useTranslation('clients');
  
  return (
    <table>
      <thead>
        <tr>
          <th>{t('name')}</th>
          <th>{t('email')}</th>
          <th>{t('phone')}</th>
          <th>{t('status')}</th>
          <th>{t('common:table.actions')}</th>
        </tr>
      </thead>
      <tbody>
        {/* ... */}
      </tbody>
    </table>
  );
}
```

### 8. Confirmation Dialogs

```tsx
import { useTranslation } from '../../../i18n';

function DeleteConfirmation({ onConfirm, onCancel }: Props) {
  const { t } = useTranslation('common');
  
  return (
    <div className="modal">
      <h2>{t('messages.confirmDelete')}</h2>
      <div className="actions">
        <button onClick={onConfirm}>{t('actions.confirm')}</button>
        <button onClick={onCancel}>{t('actions.cancel')}</button>
      </div>
    </div>
  );
}

// Output (EN): "Are you sure you want to delete this item?"
// Output (ES): "¿Está seguro de que desea eliminar este elemento?"
```

### 9. Error Messages

```tsx
import { useTranslation } from '../../../i18n';

function FormField({ error }: { error?: string }) {
  const { t } = useTranslation('common');
  
  return (
    <div>
      <input type="text" />
      {error && (
        <span className="error">
          {error === 'required' && t('messages.requiredField')}
          {error === 'invalid' && t('messages.invalidFormat')}
        </span>
      )}
    </div>
  );
}
```

### 10. Dynamic Language Switching

```tsx
import { useLanguage } from '../../../i18n';

function LanguageToggle() {
  const { currentLanguage, changeLanguage } = useLanguage();
  
  const toggleLanguage = async () => {
    const newLang = currentLanguage === 'en' ? 'es' : 'en';
    await changeLanguage(newLang);
  };
  
  return (
    <button onClick={toggleLanguage}>
      {currentLanguage === 'en' ? '🇪🇸 Español' : '🇺🇸 English'}
    </button>
  );
}
```

### 11. Multiple Namespaces in One Component

```tsx
import { useTranslation } from '../../../i18n';

function ProjectDetails() {
  const { t: tCommon } = useTranslation('common');
  const { t: tProjects } = useTranslation('projects');
  const { t: tClients } = useTranslation('clients');
  
  return (
    <div>
      <h1>{tProjects('title')}</h1>
      <p>{tProjects('description')}</p>
      <h2>{tClients('title')}</h2>
      <button>{tCommon('actions.save')}</button>
    </div>
  );
}
```

### 12. Conditional Translations

```tsx
import { useTranslation } from '../../../i18n';

function ProjectStatus({ status }: { status: string }) {
  const { t } = useTranslation('projects');
  
  return (
    <span className={`status-${status}`}>
      {t(`statuses.${status}`)}
    </span>
  );
}

// For status = "in_progress"
// Output (EN): "In Progress"
// Output (ES): "En Progreso"
```

## 🎨 Best Practices

### ✅ DO

```tsx
// ✅ Use semantic key names
const { t } = useTranslation('clients');
<h1>{t('createClient')}</h1>

// ✅ Use namespaces for organization
const { t } = useTranslation('projects');
<button>{t('editProject')}</button>

// ✅ Use interpolation for dynamic content
<p>{t('totalClients', { count: 42 })}</p>

// ✅ Access other namespaces with prefix
const { t } = useTranslation('clients');
<button>{t('common:actions.save')}</button>
```

### ❌ DON'T

```tsx
// ❌ Don't hard-code strings
<button>Save</button>

// ❌ Don't use non-descriptive keys
<h1>{t('text1')}</h1>

// ❌ Don't concatenate translations
<p>{t('hello')} {userName}!</p> // Use interpolation instead

// ❌ Don't mix languages
<button>Guardar</button> // Always use translations
```

## 🔧 Advanced Patterns

### Custom Hook for Feature-Specific Translations

```tsx
// hooks/useClientsTranslation.ts
import { useTranslation } from '../../../i18n';

export function useClientsTranslation() {
  const { t } = useTranslation('clients');
  const { t: tCommon } = useTranslation('common');
  
  return {
    t,
    tCommon,
    labels: {
      name: t('name'),
      email: t('email'),
      phone: t('phone'),
    },
    actions: {
      create: t('createClient'),
      edit: t('editClient'),
      delete: t('deleteClient'),
    },
  };
}

// Usage in component
function ClientForm() {
  const { labels, actions } = useClientsTranslation();
  
  return (
    <form>
      <label>{labels.name}</label>
      <input type="text" />
      <button>{actions.create}</button>
    </form>
  );
}
```

### Translation Helper for Status Badges

```tsx
import { useTranslation } from '../../../i18n';

type ProjectStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const { t } = useTranslation('projects');
  
  const statusConfig = {
    pending: { color: 'yellow', text: t('statuses.pending') },
    in_progress: { color: 'blue', text: t('statuses.in_progress') },
    completed: { color: 'green', text: t('statuses.completed') },
    cancelled: { color: 'red', text: t('statuses.cancelled') },
  };
  
  const config = statusConfig[status];
  
  return (
    <span className={`badge badge-${config.color}`}>
      {config.text}
    </span>
  );
}
```

## 🧪 Testing Components with i18n

```tsx
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n/config';
import ClientsPage from './ClientsPage';

describe('ClientsPage', () => {
  const wrapper = ({ children }) => (
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  );
  
  it('should display translated title', async () => {
    render(<ClientsPage />, { wrapper });
    
    // Wait for translations to load
    const title = await screen.findByText('Clients');
    expect(title).toBeInTheDocument();
  });
  
  it('should display Spanish translations', async () => {
    await i18n.changeLanguage('es');
    render(<ClientsPage />, { wrapper });
    
    const title = await screen.findByText('Clientes');
    expect(title).toBeInTheDocument();
  });
});
```

---

**Note:** All examples assume you have the translation keys defined in your locale JSON files.
