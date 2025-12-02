# Architecture Documentation

## Overview

This CRM frontend follows a **feature-based architecture** with **SOLID principles** at its core. The structure promotes maintainability, scalability, and testability.

## Core Principles

### 1. Separation of Concerns

The codebase is divided into clear layers:

```
├── core/           → Business logic (framework-agnostic)
├── features/       → Feature modules (vertical slices)
├── shared/         → Shared UI components
├── infrastructure/ → External dependencies
```

### 2. Dependency Flow

```
Features → Shared → Core
    ↓
Infrastructure
```

- **Core**: No dependencies on React or external libraries
- **Shared**: Depends only on Core
- **Features**: Can depend on Core, Shared, and Infrastructure
- **Infrastructure**: Isolated external integrations

## SOLID Principles Implementation

### Single Responsibility Principle (SRP)

Each module has one clear responsibility:

**Example: Theme System**

```typescript
// ❌ BAD: Single component doing everything
function ThemeComponent() {
  const [theme, setTheme] = useState('light');
  localStorage.setItem('theme', theme); // Storage logic
  document.documentElement.classList.add(theme); // DOM manipulation
  // ... rendering logic
}

// ✅ GOOD: Separated concerns
// theme.service.ts - Handles storage & detection
export class ThemeService {
  static getStoredTheme(): Theme | null { ... }
  static setStoredTheme(theme: Theme): void { ... }
}

// ThemeProvider.tsx - Manages state
export function ThemeProvider({ children }) { ... }

// ThemeToggle.tsx - Renders UI
export function ThemeToggle() { ... }
```

**Benefits:**
- Each file has one reason to change
- Easy to test in isolation
- Clear responsibility boundaries

### Open/Closed Principle (OCP)

Components and services are open for extension but closed for modification.

**Example: API Client**

```typescript
// base-api.client.ts - Base implementation (closed for modification)
export class BaseApiClient {
  protected async get<T>(endpoint: string) { ... }
  protected async post<T>(endpoint: string, data: unknown) { ... }
}

// Extended for specific features (open for extension)
export class CustomerApiClient extends BaseApiClient {
  async getCustomers(): Promise<Customer[]> {
    return this.get<Customer[]>('/customers');
  }
}

export class OrderApiClient extends BaseApiClient {
  async getOrders(): Promise<Order[]> {
    return this.get<Order[]>('/orders');
  }
}
```

**Benefits:**
- Add new features without changing existing code
- Reduced risk of breaking existing functionality
- Clear extension points

### Liskov Substitution Principle (LSP)

Any implementation of an interface can be replaced without breaking the system.

**Example: Theme Types**

```typescript
// theme.types.ts
export interface ThemeContextValue {
  theme: Theme;
  actualTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
}

// Any provider implementing ThemeContextValue works
export function ThemeProvider(): ThemeContextValue { ... }
export function MockThemeProvider(): ThemeContextValue { ... } // For testing
```

**Benefits:**
- Predictable behavior
- Easy to mock for testing
- Type safety with TypeScript

### Interface Segregation Principle (ISP)

Clients shouldn't depend on interfaces they don't use.

**Example: Theme Hook**

```typescript
// ❌ BAD: Exposing internals
export function useTheme() {
  return {
    theme,
    setTheme,
    systemTheme,
    mediaQuery,
    listeners,
    // ... too many internal details
  };
}

// ✅ GOOD: Minimal interface
export function useTheme() {
  return {
    theme,        // What the user selected
    actualTheme,  // Resolved theme
    setTheme,     // Change theme
  };
}
```

**Benefits:**
- Cleaner APIs
- Less coupling
- Easier to understand and use

### Dependency Inversion Principle (DIP)

Depend on abstractions, not concretions.

**Example: Theme Service**

```typescript
// ❌ BAD: Direct dependency on localStorage
export function ThemeProvider() {
  const [theme, setTheme] = useState(
    localStorage.getItem('theme') || 'light'
  );
}

// ✅ GOOD: Depends on ThemeService abstraction
export function ThemeProvider() {
  const [theme, setTheme] = useState(
    ThemeService.getStoredTheme() || 'light'
  );
}

// ThemeService can be swapped for different storage
export class ThemeService {
  static getStoredTheme(): Theme | null {
    // Could be localStorage, sessionStorage, IndexedDB, etc.
    return localStorage.getItem('theme');
  }
}
```

**Benefits:**
- Easy to swap implementations
- Better testability
- Reduced coupling

## Feature Module Structure

Each feature follows a consistent structure:

```
features/
└── dashboard/
    ├── components/      # Feature-specific components
    ├── hooks/          # Feature-specific hooks
    ├── pages/          # Page components
    ├── services/       # Feature-specific business logic
    ├── types/          # Feature-specific types
    └── index.ts        # Public API (what's exported)
```

**Example: Adding a Customers Feature**

```typescript
// features/customers/index.ts
export { CustomersPage } from './pages/CustomersPage';
export type { Customer } from './types/customer.types';

// App.tsx
import { CustomersPage } from './features/customers';
```

**Benefits:**
- Self-contained features
- Clear boundaries
- Easy to add/remove features

## State Management Strategy

### Local State
- Use `useState` for component-specific state
- Keep state as close to where it's used as possible

### Shared State
- Use Context API for app-wide state (theme, auth, etc.)
- Create focused providers (one responsibility each)

### Server State
- Use React Query or SWR for API data (when needed)
- Cache and synchronize server data automatically

**Example: Proper State Placement**

```typescript
// ❌ BAD: Global state for local concern
const [modalOpen, setModalOpen] = useGlobalState('modalOpen');

// ✅ GOOD: Local state for local concern
const [modalOpen, setModalOpen] = useState(false);

// ✅ GOOD: Context for app-wide concern
const { theme, setTheme } = useTheme();
```

## Performance Optimization

### Code Splitting

```typescript
// Lazy load feature pages
const CustomersPage = lazy(() => import('./features/customers'));

<Route path="/customers" element={
  <Suspense fallback={<Loading />}>
    <CustomersPage />
  </Suspense>
} />
```

### Memoization

```typescript
// Expensive computations
const sortedCustomers = useMemo(
  () => customers.sort((a, b) => a.name.localeCompare(b.name)),
  [customers]
);

// Callback stability
const handleSubmit = useCallback((data: FormData) => {
  // Handle submission
}, []);

// Component memoization
export const ExpensiveComponent = memo(({ data }) => {
  // Only re-renders when data changes
});
```

### Bundle Optimization

- Tailwind CSS with Vite for optimal CSS
- Tree-shaking enabled by default
- Modern build target (ES2020+)
- Automatic code splitting per route

## Testing Strategy

### Unit Tests
- Test pure functions in `core/utils/`
- Test services in `core/services/`
- Mock external dependencies

### Component Tests
- Test shared components in isolation
- Test user interactions
- Test accessibility

### Integration Tests
- Test feature flows
- Test API integration
- Test routing

**Example: Testing with SOLID**

```typescript
// Easy to test because of SRP and DIP
describe('ThemeService', () => {
  it('should store theme preference', () => {
    ThemeService.setStoredTheme('dark');
    expect(ThemeService.getStoredTheme()).toBe('dark');
  });
});

// Easy to mock providers
const mockTheme = {
  theme: 'dark' as const,
  actualTheme: 'dark' as const,
  setTheme: vi.fn(),
};

test('ThemeToggle', () => {
  render(
    <ThemeContext.Provider value={mockTheme}>
      <ThemeToggle />
    </ThemeContext.Provider>
  );
});
```

## Adding New Features Checklist

1. **Create feature folder** in `src/features/`
2. **Define types** in `core/domain/` or `features/{name}/types/`
3. **Create services** if business logic needed
4. **Build UI components** following existing patterns
5. **Add routes** in `App.tsx`
6. **Export public API** via `index.ts`
7. **Update documentation** if needed

## Best Practices

### Component Design
- Small, focused components (< 200 lines)
- Props over render props when possible
- Composition over inheritance
- Proper TypeScript types (no `any`)

### File Naming
- `PascalCase.tsx` for components
- `kebab-case.ts` for utilities/services
- `*.types.ts` for type definitions
- `*.service.ts` for services

### Import Organization
```typescript
// 1. External dependencies
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// 2. Internal core/shared
import { useTheme } from '@/shared/hooks/useTheme';
import type { Customer } from '@/core/domain/customer.types';

// 3. Feature-specific
import { CustomerCard } from '../components/CustomerCard';
```

### Type Safety
- Enable strict mode in TypeScript
- Define explicit return types
- Use discriminated unions for states
- Avoid `any` and `unknown` without proper guards

## Security Considerations

- API tokens stored securely
- XSS prevention via React's built-in escaping
- CSRF tokens for mutations
- Content Security Policy headers
- Environment variables for sensitive config

## Scalability Considerations

This architecture scales because:

1. **Features are isolated** - Can be developed independently
2. **Core is framework-agnostic** - Can migrate frameworks if needed
3. **Clear contracts** - Interfaces define boundaries
4. **Easy to test** - Separation allows isolated testing
5. **Team-friendly** - Multiple developers can work simultaneously

## Migration Path

If you need to migrate or refactor:

1. **Core types** can be shared with backend
2. **Services** can be moved to a separate package
3. **Components** can be published as a library
4. **Features** can be extracted to micro-frontends

## Resources

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
