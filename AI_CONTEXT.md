# CRM Frontend - Complete Application Flow & Code Rules Documentation

> **Last Updated**: February 2026  
> **Purpose**: Comprehensive documentation for understanding the CRM Frontend architecture, flow, patterns, and coding rules

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Architecture & Structure](#architecture--structure)
4. [Application Flow](#application-flow)
5. [Code Organization Rules](#code-organization-rules)
6. [SOLID Principles Implementation](#solid-principles-implementation)
7. [State Management](#state-management)
8. [API Integration](#api-integration)
9. [Authentication Flow](#authentication-flow)
10. [Routing & Navigation](#routing--navigation)
11. [Component Patterns](#component-patterns)
12. [Feature Modules](#feature-modules)
13. [Styling & Theming](#styling--theming)
14. [Performance Optimizations](#performance-optimizations)
15. [Security Considerations](#security-considerations)
16. [Best Practices](#best-practices)
17. [Common Patterns & Examples](#common-patterns--examples)
18. [Testing Strategy](#testing-strategy)
19. [Development Workflow](#development-workflow)

---

## 🎯 Project Overview

**CRM Frontend** is an enterprise-grade Customer Relationship Management system built with modern React and TypeScript. It manages:

- **Client Management**: Track companies and contacts
- **Project Management**: Organize work with categories
- **Visit Tracking**: Schedule and log client visits
- **Budget Management**: Create, approve, and track budgets with PDF generation
- **Rendering/Visualization**: Manage visual assets and presentations

### Key Characteristics
- **Type**: Single Page Application (SPA)
- **Architecture**: Feature-based with Clean Architecture principles
- **API**: RESTful integration with FastAPI backend
- **Deployment**: Vite-based build with code splitting

---

## 🛠 Tech Stack

### Core Dependencies
```json
{
  "react": "19.2.0",           // UI framework
  "react-router": "7.1.4",     // Routing
  "typescript": "5.9.3",       // Type safety
  "zustand": "5.0.3",          // State management
  "tailwindcss": "4.1.7",      // Styling
  "vite": "7.0.7"              // Build tool
}
```

### Additional Libraries
- **@radix-ui/react-***: Accessible UI primitives (popover, select, dialog, etc.)
- **react-hook-form**: Form management
- **lucide-react**: Icon library
- **jspdf** & **jspdf-autotable**: PDF generation
- **clsx** & **tailwind-merge**: Utility class management

### Development Tools
- **ESLint**: Code quality
- **Prettier**: Code formatting
- **TypeScript**: Strict type checking

---

## 🏗 Architecture & Structure

### Directory Layout

```
crm-frontend/
├── src/
│   ├── core/                    # Framework-agnostic business logic
│   │   ├── domain/             # Type definitions (*.types.ts)
│   │   │   ├── auth.types.ts
│   │   │   ├── theme.types.ts
│   │   │   └── ...
│   │   ├── services/           # Business logic services
│   │   │   ├── auth.service.ts
│   │   │   ├── token.service.ts
│   │   │   ├── theme.service.ts
│   │   │   └── ...
│   │   └── utils/              # Pure utility functions
│   │       ├── jwt.utils.ts
│   │       ├── currency.ts
│   │       └── cn.ts
│   │
│   ├── features/               # Feature modules (vertical slices)
│   │   ├── auth/              # Login/authentication
│   │   ├── dashboard/         # Dashboard overview
│   │   ├── clients/           # Client management
│   │   ├── projects/          # Project management
│   │   ├── visits/            # Visit tracking
│   │   ├── budgets/           # Budget management
│   │   ├── renderings/        # Rendering/visualization
│   │   └── project-categories/ # Category management
│   │
│   ├── shared/                 # Cross-cutting concerns
│   │   ├── components/        # Reusable UI components
│   │   │   ├── atoms/         # Basic elements
│   │   │   ├── molecules/     # Composite elements
│   │   │   └── organisms/     # Complex components
│   │   ├── hooks/             # Custom React hooks
│   │   ├── providers/         # Context providers
│   │   └── stores/            # Zustand stores
│   │
│   ├── infrastructure/         # External integrations
│   │   └── api/               # API client
│   │       ├── api.client.ts
│   │       ├── base-api.client.ts
│   │       └── config.ts
│   │
│   ├── App.tsx                 # Root component & routing
│   ├── main.tsx               # Application entry point
│   └── index.css              # Global styles
│
├── public/                     # Static assets
├── docs/                       # Documentation
├── ARCHITECTURE.md            # Architecture guide
├── BEST_PRACTICES.md          # Best practices
├── CODE_REVIEW.md             # Code review checklist
├── vite.config.ts             # Vite configuration
├── tsconfig.json              # TypeScript configuration
└── package.json               # Dependencies
```

### Dependency Flow

```
Features → Shared → Core
    ↓
Infrastructure
```

**Rules:**
- **Core**: No dependencies on React or external libraries (framework-agnostic)
- **Shared**: Depends only on Core
- **Features**: Can depend on Core, Shared, and Infrastructure
- **Infrastructure**: Isolated external integrations

---

## 🔄 Application Flow

### 1. **Application Startup** (`main.tsx`)

```typescript
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>      // Catches runtime errors
      <ThemeProvider>    // Injects theme context
        <App />          // Root routing component
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
```

**Steps:**
1. Initialize React root
2. Wrap in ErrorBoundary for graceful error handling
3. Initialize ThemeProvider (loads saved theme from localStorage)
4. Render App with routing

### 2. **Authentication Flow**

```
┌─────────────┐
│ User visits │
│   /login    │
└──────┬──────┘
       │
       ├─ Is user already authenticated? (Check Zustand store)
       │  ├─ YES → Redirect to /dashboard
       │  └─ NO  → Show login form
       │
       ├─ User submits credentials
       │
       ├─ API call to /auth/login
       │  ├─ Success: Store tokens (localStorage) & user data (Zustand)
       │  │          Set Authorization header
       │  │          Navigate to /dashboard
       │  └─ Failure: Show error notification
       │
       └─ Protected routes check authentication via ProtectedRoute wrapper
          ├─ Authenticated → Render page
          └─ Not authenticated → Redirect to /login
```

### 3. **Routing Flow** (`App.tsx`)

```typescript
<Routes>
  // Public route
  <Route path="/login" element={<LoginPage />} />
  
  // Root redirect
  <Route path="/" element={<Navigate to="/dashboard" replace />} />
  
  // Protected routes
  <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
  <Route path="/clients" element={<ProtectedRoute><ClientsPage /></ProtectedRoute>} />
  <Route path="/projects" element={<ProtectedRoute><ProjectsPage /></ProtectedRoute>} />
  <Route path="/visits" element={<ProtectedRoute><VisitsPage /></ProtectedRoute>} />
  <Route path="/visits/:id" element={<ProtectedRoute><VisitDetailPage /></ProtectedRoute>} />
  <Route path="/budgets" element={<ProtectedRoute><BudgetsListPage /></ProtectedRoute>} />
  <Route path="/renderings" element={<ProtectedRoute><RenderingsPage /></ProtectedRoute>} />
  <Route path="/renderings/create" element={<ProtectedRoute><CreateRenderingPage /></ProtectedRoute>} />
  <Route path="/renderings/:id" element={<ProtectedRoute><RenderingDetailPage /></ProtectedRoute>} />
</Routes>
```

**Lazy Loading**: All pages are lazy-loaded for performance:
```typescript
const LoginPage = lazy(() => import('./features/auth'));
const DashboardPage = lazy(() => import('./features/dashboard'));
```

### 4. **Data Fetching Flow**

```
Component Mount
    ↓
useEffect(() => {
    fetchData()           // Call API client method
}, [])
    ↓
apiClient.getClients()    // API client handles request
    ↓
┌───────────────────────┐
│ Request Interceptors  │ → Add auth token, company_id, etc.
└───────────────────────┘
    ↓
HTTP Request to Backend
    ↓
┌───────────────────────┐
│ Response Interceptors │ → Handle 401 (token refresh), errors
└───────────────────────┘
    ↓
Success? 
├─ YES → setState(data)  → Re-render with data
└─ NO  → Show error notification
```

### 5. **Form Submission Flow**

```
User fills form → Validation (react-hook-form) → Submit
    ↓
handleSubmit(data)
    ↓
API call (apiClient.createClient(data))
    ↓
┌─────────────────┐
│ Success?        │
├─ YES → Show success notification
│        Update local state or refetch
│        Navigate to list/detail page
└─ NO  → Show error notification
         Keep form data (user can retry)
```

---

## 📏 Code Organization Rules

### 1. **File Naming Conventions**

| Type | Convention | Example |
|------|-----------|---------|
| **Components** | PascalCase.tsx | `Button.tsx`, `UserMenu.tsx` |
| **Services** | kebab-case.service.ts | `auth.service.ts` |
| **Utilities** | kebab-case.ts | `jwt.utils.ts`, `cn.ts` |
| **Types** | kebab-case.types.ts | `auth.types.ts` |
| **Hooks** | camelCase.ts | `useAuth.ts`, `useTheme.ts` |
| **Stores** | kebab-case.store.ts | `auth.store.ts`, `ui.store.ts` |

### 2. **Feature Module Structure**

Each feature MUST follow this structure:

```
features/
└── {feature-name}/
    ├── components/      # Feature-specific components
    ├── hooks/          # Feature-specific hooks
    ├── pages/          # Page components
    ├── services/       # Feature-specific business logic (optional)
    ├── types/          # Feature-specific types (optional)
    └── index.ts        # Public API - exports what's needed
```

**Example: Clients Feature**
```typescript
// features/clients/index.ts
export { ClientsPage } from './pages/ClientsPage';
export type { Client } from '@/core/domain/client.types'; // Re-export if needed

// Usage in App.tsx
import { ClientsPage } from './features/clients';
```

### 3. **Import Order**

**ALWAYS** organize imports in this order:

```typescript
// 1. External dependencies (React, libraries)
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// 2. Internal core/shared (absolute imports with @/)
import { useAuth } from '@/shared/hooks/useAuth';
import type { Client } from '@/core/domain/client.types';
import { Button } from '@/shared/components/atoms/Button';

// 3. Feature-specific (relative imports)
import { ClientCard } from '../components/ClientCard';
import { useClientForm } from '../hooks/useClientForm';

// 4. Styles (if any)
import './styles.css';
```

### 4. **Component Structure**

**Template for all components:**

```typescript
// 1. Imports
import { useState } from 'react';
import type { ComponentPropsWithoutRef } from 'react';

// 2. Type definitions
interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
  variant?: 'primary' | 'secondary';
  isLoading?: boolean;
}

// 3. Component definition
export function Button({ variant = 'primary', isLoading, children, ...props }: ButtonProps) {
  // 4. Hooks (state, context, etc.)
  const [count, setCount] = useState(0);
  
  // 5. Event handlers
  const handleClick = () => {
    setCount(prev => prev + 1);
  };
  
  // 6. Effects (if needed)
  useEffect(() => {
    // Side effects
  }, []);
  
  // 7. Early returns (if applicable)
  if (isLoading) {
    return <span>Loading...</span>;
  }
  
  // 8. Render
  return (
    <button {...props} onClick={handleClick}>
      {children}
    </button>
  );
}
```

### 5. **Separation of Concerns**

**❌ BAD: Everything in one file**
```typescript
function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const handleSubmit = async () => {
    // API call logic here
    const response = await fetch('/api/auth/login', { ... });
    // Token storage logic here
    localStorage.setItem('token', token);
  };
  
  return <form>...</form>;
}
```

**✅ GOOD: Separated concerns**
```typescript
// core/services/auth.service.ts
export class AuthService {
  static async login(credentials: LoginRequest): Promise<User> { ... }
}

// shared/hooks/useAuth.ts
export function useAuth() {
  const login = useAuthStore(state => state.login);
  return { login, ... };
}

// features/auth/pages/LoginPage.tsx
function LoginPage() {
  const { login } = useAuth();
  const handleSubmit = (data: LoginRequest) => login(data);
  return <LoginForm onSubmit={handleSubmit} />;
}
```

---

## 🎯 SOLID Principles Implementation

### 1. Single Responsibility Principle (SRP)

**Each module has ONE clear responsibility.**

#### Example: Theme System

```typescript
// ❌ BAD: Single component doing everything
function ThemeComponent() {
  const [theme, setTheme] = useState('light');
  localStorage.setItem('theme', theme);              // Storage
  document.documentElement.classList.add(theme);     // DOM manipulation
  // ... rendering logic
}

// ✅ GOOD: Separated concerns
// core/services/theme.service.ts - Handles storage & detection
export class ThemeService {
  static getStoredTheme(): Theme | null { ... }
  static setStoredTheme(theme: Theme): void { ... }
}

// shared/providers/ThemeProvider.tsx - Manages state
export function ThemeProvider({ children }) { ... }

// shared/components/organisms/ThemeToggle.tsx - Renders UI
export function ThemeToggle() { ... }
```

**Benefits:**
- Each file has one reason to change
- Easy to test in isolation
- Clear responsibility boundaries

### 2. Open/Closed Principle (OCP)

**Open for extension, closed for modification.**

#### Example: API Client

```typescript
// base-api.client.ts - Base implementation (closed for modification)
export class BaseApiClient {
  protected async get<T>(endpoint: string) { ... }
  protected async post<T>(endpoint: string, data: unknown) { ... }
}

// api.client.ts - Extended for specific features (open for extension)
export class ApiClient extends BaseApiClient {
  async getClients(): Promise<Client[]> {
    return this.get<Client[]>('/clients');
  }
  
  async getProjects(): Promise<Project[]> {
    return this.get<Project[]>('/projects');
  }
}
```

### 3. Liskov Substitution Principle (LSP)

**Interfaces can be replaced without breaking the system.**

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

### 4. Interface Segregation Principle (ISP)

**No forced implementation of unused interfaces.**

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

### 5. Dependency Inversion Principle (DIP)

**Depend on abstractions, not concretions.**

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
    return localStorage.getItem('theme');
  }
}
```

---

## 🗄 State Management

### State Management Strategy

The app uses a **hybrid state management approach**:

1. **Local State** (`useState`) - Component-specific state
2. **Context API** - App-wide state (theme)
3. **Zustand Stores** - Global state with persistence

### Zustand Stores

#### 1. Auth Store (`shared/stores/auth.store.ts`)

**Purpose**: Manages authentication state

```typescript
interface AuthState {
  user: User | null;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
}
```

**Persistence**: Uses `persist` middleware - saves `user` to localStorage

**Usage:**
```typescript
// Direct store access (with selectors for performance)
const user = useAuthStore((state) => state.user);
const login = useAuthStore((state) => state.login);

// Or via wrapper hook
const { user, login, logout, isAuthenticated } = useAuth();
```

#### 2. UI Store (`shared/stores/ui.store.ts`)

**Purpose**: Manages global UI state (modals, notifications, sidebar)

```typescript
interface UIState {
  // Modals
  modals: Record<string, boolean>;
  openModal: (id: string) => void;
  closeModal: (id: string) => void;
  
  // Notifications
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  
  // Sidebar
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}
```

**Persistence**: NO persistence (transient state)

**Usage:**
```typescript
const notifications = useUIStore((state) => state.notifications);
const addNotification = useUIStore((state) => state.addNotification);
const sidebarOpen = useUIStore((state) => state.sidebarOpen);
```

### State Placement Rules

```typescript
// ❌ BAD: Global state for local concern
const [modalOpen, setModalOpen] = useGlobalState('modalOpen');

// ✅ GOOD: Local state for local concern
const [modalOpen, setModalOpen] = useState(false);

// ✅ GOOD: Context/Zustand for app-wide concern
const { theme, setTheme } = useTheme();
const user = useAuthStore((state) => state.user);
```

**Rule of thumb:**
- If state is used in ONE component → `useState`
- If state is shared between 2-3 nearby components → Lift state up or use Context
- If state is app-wide (auth, theme, notifications) → Zustand or Context

---

## 🌐 API Integration

### API Client Architecture

```
BaseApiClient (protected methods)
  ├─ HTTP methods: get(), post(), put(), patch(), delete()
  ├─ Request/response interceptors
  └─ Error handling

ApiClient (extends BaseApiClient)
  ├─ Token refresh logic (handles 401 responses automatically)
  ├─ Domain-specific methods (getClients, getProjects, etc.)
  └─ Singleton instance exported
```

### Configuration

**Base URL**: `https://canas-api-dev.onrender.com/api/v1`

**Required Query Parameter**: All endpoints require `company_id`

### Authentication Token Management

```typescript
// Initialization (on app startup)
apiClient.setAuthToken(TokenService.getAccessToken());

// Token refresh (automatic on 401)
private async handleTokenRefresh(response: Response) {
  if (response.status === 401 && !response.url.includes('/auth/')) {
    // Get refresh token
    const tokens = TokenService.getStoredTokens();
    
    // Call refresh endpoint
    const newTokens = await this.refreshToken(tokens.refresh);
    
    // Store new tokens and update header
    TokenService.storeTokens(newTokens);
    this.setAuthToken(newTokens.access);
  }
}
```

### Request/Response Interceptors

```typescript
// Request interceptors (modify config before request)
apiClient.addRequestInterceptor((config) => {
  config.headers = {
    ...config.headers,
    'X-Custom-Header': 'value',
  };
  return config;
});

// Response interceptors (process response)
apiClient.addResponseInterceptor((response) => {
  if (response.status === 401) {
    // Handle token refresh
  }
  return response;
});
```

### Error Handling

```typescript
// Custom ApiError class
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public statusText: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Extraction from FastAPI error format
private async getErrorMessage(response: Response): Promise<string> {
  const data = await response.json();
  return data.detail || data.message || response.statusText;
}
```

### Available Endpoints

| Category | Endpoints | Methods |
|----------|-----------|---------|
| **Auth** | `/auth/login`, `/auth/refresh` | POST |
| **Clients** | `/clients`, `/clients?company_id=X` | GET, POST |
| **Users** | `/users/` | POST |
| **Projects** | `/projects`, `/project-categories` | GET, POST |
| **Visits** | `/visits`, `/visits/{id}`, `/visits/{id}/status` | GET, POST, PUT |
| **Budgets** | `/budgets`, `/budgets/{id}`, `/budgets/{id}/items`, `/budgets/{id}/accept`, `/budgets/{id}/reject` | GET, POST, PUT |
| **Renderings** | `/renderings`, `/renderings/{id}`, `/renderings/{id}/images`, `/renderings/{id}/items` | GET, POST, PUT, DELETE |
| **Catalog** | `/catalog-items?company_id=X` | GET |
| **Uploads** | `/uploads/image` | POST |
| **PDF** | `/renderings/{id}/pdf` | GET |

### Usage Examples

```typescript
// Fetch clients
const clients = await apiClient.getClients(companyId);

// Create client
const newClient = await apiClient.createClient({
  name: 'ACME Corp',
  email: 'contact@acme.com',
  company_id: companyId,
});

// Update visit status
await apiClient.updateVisitStatus(visitId, 'completed');

// Upload image
const imageUrl = await apiClient.uploadImage(file, companyId);
```

---

## 🔐 Authentication Flow

### Login Flow (Detailed)

```
1. User navigates to /login
   ├─ Check if already authenticated (useAuth hook reads Zustand store)
   │  ├─ YES → useEffect redirects to /dashboard
   │  └─ NO  → Show LoginPage
   
2. User submits login form
   ├─ Validate form (react-hook-form)
   ├─ Call login() from useAuth hook
   
3. login() function flow
   ├─ Set isLoading = true (Zustand)
   ├─ Call apiClient.login(credentials)
   │  ├─ POST /auth/login with { email, password }
   │  └─ Receive { access, refresh, user }
   │
   ├─ Store tokens via TokenService
   │  ├─ localStorage.setItem('access_token', access)
   │  └─ localStorage.setItem('refresh_token', refresh)
   │
   ├─ Update API client auth header
   │  └─ apiClient.setAuthToken(access)
   │
   ├─ Store user in Zustand (persisted via middleware)
   │  └─ useAuthStore.getState().setUser(user)
   │
   ├─ Set isLoading = false
   └─ Navigate to /dashboard
   
4. Protected routes check authentication
   ├─ ProtectedRoute component reads isAuthenticated from Zustand
   ├─ If authenticated → Render children
   └─ If not authenticated → <Navigate to="/login" />
```

### Token Refresh Flow

```
User makes API call → Request sent with access token
    ↓
Backend returns 401 (token expired)
    ↓
Response interceptor catches 401
    ↓
Check if refresh token exists and is valid
    ├─ NO → Logout user (clear tokens, redirect to /login)
    └─ YES → Continue
        ↓
Call /auth/refresh with refresh token
    ├─ Success → Receive new { access, refresh }
    │           Store new tokens
    │           Update auth header
    │           Return to interceptor
    └─ Failure → Logout user
```

**Deduplication**: Uses `refreshPromise` to prevent multiple simultaneous refresh requests

### Logout Flow

```
User clicks logout
    ↓
Call logout() from useAuth hook
    ↓
Clear tokens from localStorage
    ├─ TokenService.clearTokens()
    └─ localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
    ↓
Clear user from Zustand
    └─ useAuthStore.getState().setUser(null)
    ↓
Clear auth header from API client
    └─ apiClient.clearAuthToken()
    ↓
Navigate to /login
```

### Protected Route Implementation

```typescript
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore(state => state.user !== null);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}
```

---

## 🗺 Routing & Navigation

### Route Structure

```typescript
/ (root)
├─ /login                   // Public - Login page
├─ / → /dashboard           // Redirect to dashboard
├─ /dashboard               // Protected - Dashboard overview
├─ /clients                 // Protected - Client list
├─ /projects                // Protected - Project list
├─ /project-categories      // Protected - Category management
├─ /visits                  // Protected - Visit list
├─ /visits/:id              // Protected - Visit detail
├─ /budgets                 // Protected - Budget list
├─ /renderings              // Protected - Rendering list
├─ /renderings/create       // Protected - Create new rendering
└─ /renderings/:id          // Protected - Rendering detail
```

### Lazy Loading Strategy

**All pages are lazy-loaded** for optimal bundle size:

```typescript
const LoginPage = lazy(() => 
  import('./features/auth').then((module) => ({ default: module.LoginPage }))
);

const DashboardPage = lazy(() => 
  import('./features/dashboard').then((module) => ({ default: module.DashboardPage }))
);
```

**Benefits:**
- Reduces initial bundle size
- Faster Time to Interactive (TTI)
- Code splitting per route
- Users only download code for routes they visit

### Navigation Patterns

```typescript
// Programmatic navigation
const navigate = useNavigate();

// Navigate to route
navigate('/dashboard');

// Navigate with replace (no history entry)
navigate('/dashboard', { replace: true });

// Navigate with state
navigate('/clients/123', { state: { from: 'dashboard' } });

// Navigate back
navigate(-1);

// Link component
<Link to="/clients">Clients</Link>
```

---

## 🧩 Component Patterns

### Atomic Design Hierarchy

```
Atoms → Molecules → Organisms → Pages
```

#### Atoms (Basic Building Blocks)

**Location**: `shared/components/atoms/`

**Examples**: Button, Input, Text, Label, Card, Heading

```typescript
// Button.tsx - Reusable button with variants
export function Button({ 
  variant = 'primary', 
  size = 'md',
  children, 
  ...props 
}: ButtonProps) {
  return (
    <button 
      className={cn(
        'rounded-md font-medium',
        variant === 'primary' && 'bg-blue-600 text-white',
        variant === 'secondary' && 'bg-gray-200 text-gray-900',
        size === 'sm' && 'px-3 py-1.5 text-sm',
        size === 'md' && 'px-4 py-2',
      )}
      {...props}
    >
      {children}
    </button>
  );
}
```

#### Molecules (Composite Components)

**Location**: `shared/components/molecules/`

**Examples**: FormField, Notification, Combobox, UserMenu

```typescript
// FormField.tsx - Label + Input + Error message
export function FormField({ 
  label, 
  error, 
  children, 
  ...props 
}: FormFieldProps) {
  return (
    <div className="space-y-1">
      <Label htmlFor={props.id}>{label}</Label>
      {children}
      {error && <Text variant="error">{error}</Text>}
    </div>
  );
}
```

#### Organisms (Complex Components)

**Location**: `shared/components/organisms/`

**Examples**: Header, Sidebar, Table, ProtectedRoute, NotificationContainer

```typescript
// Header.tsx - App header with navigation and user menu
export function Header() {
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  
  return (
    <header className="flex items-center justify-between px-6 py-4">
      <Logo />
      <nav>
        <NavLink to="/dashboard">Dashboard</NavLink>
        <NavLink to="/clients">Clients</NavLink>
      </nav>
      <UserMenu user={user} onLogout={logout} />
    </header>
  );
}
```

### Component Composition Pattern

```typescript
// ❌ BAD: Monolithic component
function UserProfile() {
  return (
    <div>
      <img src={user.avatar} />
      <h1>{user.name}</h1>
      <p>{user.email}</p>
      <button onClick={handleEdit}>Edit</button>
    </div>
  );
}

// ✅ GOOD: Composable components
function UserProfile() {
  return (
    <Card>
      <Card.Header>
        <Avatar src={user.avatar} />
        <Heading level={2}>{user.name}</Heading>
      </Card.Header>
      <Card.Content>
        <Text variant="muted">{user.email}</Text>
      </Card.Content>
      <Card.Footer>
        <Button onClick={handleEdit}>Edit</Button>
      </Card.Footer>
    </Card>
  );
}
```

### Props Pattern

**Extend HTML attributes** for maximum flexibility:

```typescript
// ✅ GOOD: Extends native button props
interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
  variant?: 'primary' | 'secondary';
  isLoading?: boolean;
}

// Usage supports all native button props
<Button 
  variant="primary" 
  type="submit" 
  disabled={isLoading}
  onClick={handleClick}
>
  Submit
</Button>
```

### Children Pattern

```typescript
// Render props pattern
<Table
  data={clients}
  renderRow={(client) => (
    <TableRow>
      <TableCell>{client.name}</TableCell>
      <TableCell>{client.email}</TableCell>
    </TableRow>
  )}
/>

// Children as function
<DataLoader>
  {({ data, isLoading }) => (
    isLoading ? <Spinner /> : <ClientList clients={data} />
  )}
</DataLoader>
```

---

## 📦 Feature Modules

### Feature Structure Template

```
features/
└── {feature-name}/
    ├── components/          # Feature-specific components
    │   ├── FeatureForm.tsx
    │   └── FeatureCard.tsx
    ├── hooks/              # Feature-specific hooks
    │   └── useFeatureData.ts
    ├── pages/              # Page components
    │   ├── FeatureListPage.tsx
    │   └── FeatureDetailPage.tsx
    ├── services/           # Feature-specific business logic (optional)
    │   └── feature.service.ts
    ├── types/              # Feature-specific types (optional)
    │   └── feature.types.ts
    └── index.ts            # Public API
```

### Example: Clients Feature

```
features/clients/
├── components/
│   ├── ClientForm.tsx        # Form for creating/editing clients
│   ├── ClientCard.tsx        # Display client info
│   └── ClientTable.tsx       # Table of clients
├── hooks/
│   └── useClients.ts         # Hook for fetching/managing clients
├── pages/
│   ├── ClientsPage.tsx       # Main clients list page
│   └── ClientDetailPage.tsx  # Client detail page (future)
└── index.ts                  # Export ClientsPage
```

### Data Flow in Feature

```
Page Component (ClientsPage)
    ↓
Custom Hook (useClients)
    ↓
API Client (apiClient.getClients)
    ↓
Backend API
    ↓
Response → Hook updates state → Page re-renders
```

**Example implementation:**

```typescript
// hooks/useClients.ts
export function useClients(companyId: string) {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    async function fetchClients() {
      try {
        const data = await apiClient.getClients(companyId);
        setClients(data);
      } catch (error) {
        console.error('Failed to fetch clients:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchClients();
  }, [companyId]);
  
  return { clients, isLoading };
}

// pages/ClientsPage.tsx
export function ClientsPage() {
  const user = useAuthStore(state => state.user);
  const { clients, isLoading } = useClients(user.company_id);
  
  if (isLoading) return <LoadingSpinner />;
  
  return (
    <PageLayout>
      <Heading level={1}>Clients</Heading>
      <ClientTable clients={clients} />
    </PageLayout>
  );
}
```

---

## 🎨 Styling & Theming

### Tailwind CSS

**Configuration**: `tailwind.config.js`

**Usage**: Utility-first CSS classes

```typescript
// Using Tailwind classes
<div className="flex items-center justify-between px-6 py-4 bg-white rounded-lg shadow-md">
  <h1 className="text-2xl font-bold text-gray-900">Title</h1>
  <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
    Action
  </button>
</div>
```

### Theme System

**Themes**: `light`, `dark`, `system`

**CSS Variables**: Defined in `index.css`

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  /* ... */
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --primary: 210 40% 98%;
  /* ... */
}
```

**Usage in components:**

```typescript
// Using CSS variables
<div className="bg-[color:var(--background)] text-[color:var(--foreground)]">
  Content
</div>
```

### Theme Toggle

**Implementation:**

```typescript
// ThemeProvider.tsx - Manages theme state
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState<Theme>(
    ThemeService.getStoredTheme() || 'system'
  );
  
  // Resolve actual theme (system → light/dark)
  const actualTheme = useMemo(() => {
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches 
        ? 'dark' 
        : 'light';
    }
    return theme;
  }, [theme]);
  
  // Apply theme to document
  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(actualTheme);
  }, [actualTheme]);
  
  return (
    <ThemeContext.Provider value={{ theme, actualTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Usage in components
const { theme, setTheme } = useTheme();

<select value={theme} onChange={(e) => setTheme(e.target.value)}>
  <option value="light">Light</option>
  <option value="dark">Dark</option>
  <option value="system">System</option>
</select>
```

### Utility Function: `cn`

**Purpose**: Merge Tailwind classes conditionally

```typescript
import { cn } from '@/core/utils/cn';

// Conditional classes
<button className={cn(
  'px-4 py-2 rounded-md',
  isActive && 'bg-blue-600 text-white',
  isDisabled && 'opacity-50 cursor-not-allowed'
)}>
  Click me
</button>
```

---

## ⚡️ Performance Optimizations

### 1. Code Splitting

**Route-based lazy loading:**

```typescript
const DashboardPage = lazy(() => import('./features/dashboard'));

<Route path="/dashboard" element={
  <Suspense fallback={<Loading />}>
    <DashboardPage />
  </Suspense>
} />
```

**Benefits:**
- Initial bundle size reduced by ~70%
- Faster Time to Interactive (TTI)
- Users only download code for routes they visit

### 2. Memoization

**useMemo - Expensive computations:**

```typescript
const sortedClients = useMemo(
  () => clients.sort((a, b) => a.name.localeCompare(b.name)),
  [clients]
);
```

**useCallback - Stable function references:**

```typescript
const handleSubmit = useCallback((data: FormData) => {
  apiClient.createClient(data);
}, []);
```

**React.memo - Component memoization:**

```typescript
export const ClientCard = memo(({ client }: { client: Client }) => {
  return <div>{client.name}</div>;
});
```

### 3. Zustand Selectors

**Granular subscriptions** prevent unnecessary re-renders:

```typescript
// ❌ BAD: Component re-renders on ANY store change
const store = useAuthStore();

// ✅ GOOD: Only re-renders when user changes
const user = useAuthStore(state => state.user);
```

### 4. Token Expiration Buffer

**Refresh tokens 5 minutes before expiration** to prevent API call failures:

```typescript
const EXPIRATION_BUFFER_MS = 5 * 60 * 1000; // 5 minutes

export function isTokenExpired(token: string): boolean {
  const payload = decodeJwt(token);
  if (!payload || !payload.exp) return true;
  
  const expirationTime = payload.exp * 1000;
  const currentTime = Date.now();
  
  return currentTime >= expirationTime - EXPIRATION_BUFFER_MS;
}
```

### 5. Request Deduplication

**Prevent multiple simultaneous token refresh requests:**

```typescript
private refreshPromise: Promise<TokenResponse> | null = null;

private async handleTokenRefresh(response: Response) {
  if (this.refreshPromise) {
    return this.refreshPromise; // Reuse existing promise
  }
  
  this.refreshPromise = this.refreshToken(refreshToken)
    .finally(() => {
      this.refreshPromise = null; // Clear after completion
    });
  
  return this.refreshPromise;
}
```

---

## 🔒 Security Considerations

### 1. Token Storage

**Current**: localStorage (XSS vulnerable)
**Future consideration**: httpOnly cookies

```typescript
// Token storage abstraction allows easy migration
export class TokenService {
  static storeTokens(tokens: TokenResponse): void {
    localStorage.setItem('access_token', tokens.access);
    localStorage.setItem('refresh_token', tokens.refresh);
  }
  
  // Easy to swap to cookies/IndexedDB later
}
```

### 2. Token Validation

```typescript
// Validate token structure and expiration
export function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch {
    return null;
  }
}
```

### 3. Automatic Token Refresh

**Seamless token refresh** prevents session interruptions:
- Tokens refresh automatically on 401 responses
- No user action required
- Falls back to logout on failure

### 4. Protected Routes

**Authentication check** on every protected route:

```typescript
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore(state => state.user !== null);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}
```

### 5. Input Sanitization

**React's built-in XSS protection** via JSX escaping:

```typescript
// Safe by default - React escapes content
<div>{userInput}</div>

// Dangerous - avoid unless absolutely necessary
<div dangerouslySetInnerHTML={{ __html: userInput }} />
```

---

## ✅ Best Practices

### 1. Component Design

- **Small, focused components** (< 200 lines)
- **Props over render props** when possible
- **Composition over inheritance**
- **Proper TypeScript types** (no `any`)

### 2. Error Handling

```typescript
// ✅ GOOD: Try-catch for async operations
async function fetchData() {
  try {
    const data = await apiClient.getClients(companyId);
    setClients(data);
  } catch (error) {
    console.error('Failed to fetch clients:', error);
    addNotification({
      type: 'error',
      message: 'Failed to load clients',
    });
  }
}
```

### 3. Loading States

```typescript
// Always show loading indicators
{isLoading ? (
  <LoadingSpinner />
) : (
  <ClientList clients={clients} />
)}
```

### 4. Type Safety

```typescript
// ✅ GOOD: Explicit types
function createClient(data: CreateClientRequest): Promise<Client> {
  return apiClient.createClient(data);
}

// ❌ BAD: Implicit any
function createClient(data): Promise<any> {
  return apiClient.createClient(data);
}
```

### 5. Side Effects

```typescript
// ✅ GOOD: Side effects in useEffect
useEffect(() => {
  if (isAuthenticated) {
    navigate('/dashboard');
  }
}, [isAuthenticated, navigate]);

// ❌ BAD: Side effects in render
if (isAuthenticated) {
  navigate('/dashboard'); // Anti-pattern!
}
return <LoginForm />;
```

---

## 🔄 Common Patterns & Examples

### Pattern 1: Data Fetching with Loading/Error States

```typescript
export function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const user = useAuthStore(state => state.user);
  
  useEffect(() => {
    async function fetchClients() {
      try {
        setIsLoading(true);
        const data = await apiClient.getClients(user.company_id);
        setClients(data);
        setError(null);
      } catch (err) {
        setError('Failed to load clients');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchClients();
  }, [user.company_id]);
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  
  return <ClientList clients={clients} />;
}
```

### Pattern 2: Form Handling with Validation

```typescript
export function ClientForm({ onSubmit }: { onSubmit: (data: Client) => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm<Client>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const onFormSubmit = async (data: Client) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);
    } catch (error) {
      console.error('Submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onFormSubmit)}>
      <FormField label="Name" error={errors.name?.message}>
        <Input 
          {...register('name', { required: 'Name is required' })}
        />
      </FormField>
      
      <Button type="submit" isLoading={isSubmitting}>
        Submit
      </Button>
    </form>
  );
}
```

### Pattern 3: Modal Management

```typescript
// Open modal
const openModal = useUIStore(state => state.openModal);
<Button onClick={() => openModal('create-client')}>Create Client</Button>

// Modal component
const isOpen = useUIStore(state => state.modals['create-client']);
const closeModal = useUIStore(state => state.closeModal);

<Dialog open={isOpen} onOpenChange={() => closeModal('create-client')}>
  <ClientForm onSubmit={handleCreate} />
</Dialog>
```

### Pattern 4: Notifications

```typescript
const addNotification = useUIStore(state => state.addNotification);

// Success notification
addNotification({
  type: 'success',
  message: 'Client created successfully',
});

// Error notification
addNotification({
  type: 'error',
  message: 'Failed to create client',
});

// Info notification
addNotification({
  type: 'info',
  message: 'Loading data...',
});
```

---

## 🧪 Testing Strategy

### Unit Tests

**Test pure functions** in `core/utils/`:

```typescript
// jwt.utils.test.ts
describe('decodeJwt', () => {
  it('should decode valid JWT', () => {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
    const payload = decodeJwt(token);
    expect(payload).toBeDefined();
    expect(payload.exp).toBeGreaterThan(0);
  });
  
  it('should return null for invalid JWT', () => {
    const payload = decodeJwt('invalid-token');
    expect(payload).toBeNull();
  });
});
```

### Component Tests

**Test shared components** in isolation:

```typescript
// Button.test.tsx
describe('Button', () => {
  it('should render with primary variant', () => {
    render(<Button variant="primary">Click me</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-blue-600');
  });
  
  it('should call onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Integration Tests

**Test feature flows**:

```typescript
// ClientsPage.test.tsx
describe('ClientsPage', () => {
  it('should fetch and display clients', async () => {
    const mockClients = [
      { id: '1', name: 'ACME Corp', email: 'contact@acme.com' },
    ];
    
    vi.spyOn(apiClient, 'getClients').mockResolvedValue(mockClients);
    
    render(<ClientsPage />);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('ACME Corp')).toBeInTheDocument();
    });
  });
});
```

---

## 🚀 Development Workflow

### Setup

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Open browser to http://localhost:5173
```

### Scripts

```bash
# Development
npm run dev              # Start dev server with hot reload

# Building
npm run build            # Type-check + build for production
npm run type-check       # Run TypeScript compiler

# Code Quality
npm run lint             # Run ESLint
npm run format           # Format code with Prettier
npm run format:check     # Check formatting without changes

# Preview
npm run preview          # Preview production build locally
```

### Git Workflow

```bash
# Feature branch
git checkout -b feature/client-search

# Make changes
git add .
git commit -m "feat: add client search functionality"

# Push and create PR
git push origin feature/client-search
```

### Commit Message Convention

```
feat: Add new feature
fix: Fix bug
refactor: Refactor code
docs: Update documentation
style: Format code
test: Add tests
chore: Update dependencies
```

---

## 📝 Summary Checklist

When building a new feature, ensure:

- [ ] Feature folder created in `src/features/`
- [ ] Types defined (if not in `core/domain/`)
- [ ] API client methods added (if needed)
- [ ] Custom hooks created for data fetching
- [ ] Components follow atomic design pattern
- [ ] Pages use lazy loading
- [ ] Routes added to `App.tsx` with `ProtectedRoute`
- [ ] Loading and error states handled
- [ ] Form validation implemented (if applicable)
- [ ] Notifications shown for success/error
- [ ] TypeScript strict types (no `any`)
- [ ] Proper error handling with try-catch
- [ ] Side effects in `useEffect`
- [ ] Memoization for performance (useMemo/useCallback)
- [ ] Responsive design with Tailwind
- [ ] Theme support (CSS variables)
- [ ] Accessibility (ARIA labels, keyboard navigation)
- [ ] Documentation updated

---

## 🎓 Resources

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Zustand Documentation](https://docs.pmnd.rs/zustand/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React Router Documentation](https://reactrouter.com/)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)

---

**End of Documentation**
