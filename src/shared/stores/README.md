# Zustand Stores

This directory contains Zustand stores for global state management.

## Architecture

Stores follow the same SOLID principles as the rest of the application:
- **Single Responsibility**: Each store manages one domain of state
- **Dependency Inversion**: Stores depend on service abstractions (e.g., `AuthService`)

## Available Stores

### `auth.store.ts`
Manages authentication state:
- User information
- Authentication status
- Login/logout actions
- Persists to localStorage automatically

**Usage:**
```tsx
import { useAuthStore } from '@/shared/stores';

// In a component
const { user, isAuthenticated, login, logout } = useAuthStore();

// Or use the useAuth hook for backward compatibility
import { useAuth } from '@/shared/hooks/useAuth';
const { user, isAuthenticated, login, logout } = useAuth();
```

### `ui.store.ts`
Manages global UI state:
- Modal visibility
- Notifications
- Sidebar state

**Usage:**
```tsx
import { useUIStore } from '@/shared/stores';

// Modals
const { openModal, closeModal, isModalOpen } = useUIStore();
openModal('user-settings');
if (isModalOpen('user-settings')) { ... }

// Notifications
const { addNotification } = useUIStore();
addNotification({
  message: 'Successfully saved!',
  type: 'success',
  duration: 3000,
});

// Sidebar
const { sidebarOpen, setSidebarOpen, toggleSidebar } = useUIStore();
```

## Creating New Stores

Follow this pattern when creating new stores:

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware'; // Optional: for persistence

interface MyStoreState {
  // State
  data: string;
  
  // Actions
  setData: (data: string) => void;
  reset: () => void;
}

export const useMyStore = create<MyStoreState>()(
  // Add persist middleware if you need localStorage persistence
  persist(
    (set) => ({
      // Initial state
      data: '',
      
      // Actions
      setData: (data: string) => set({ data }),
      reset: () => set({ data: '' }),
    }),
    {
      name: 'my-store-storage', // localStorage key
    }
  )
);
```

## Best Practices

1. **Keep stores focused**: One store per domain (auth, UI, customers, etc.)
2. **Use selectors**: For better performance, select only what you need:
   ```tsx
   // ✅ Good: Only subscribes to user changes
   const user = useAuthStore((state) => state.user);
   
   // ⚠️ Less optimal: Subscribes to all state changes
   const { user } = useAuthStore();
   ```
3. **Actions over direct state mutation**: Always use actions, never mutate state directly
4. **Type safety**: Always define TypeScript interfaces for store state
5. **Persistence**: Use `persist` middleware only when you need localStorage persistence

## When to Use Zustand vs Context

- **Zustand**: Global app state, complex state logic, frequent updates
- **Context**: Provider-style concerns (theme, i18n), simple state that doesn't change often

In this app:
- ✅ **Zustand**: Auth, UI state, feature-specific stores
- ✅ **Context**: Theme (works well for provider pattern)

