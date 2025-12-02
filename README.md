# CRM Frontend

A production-ready CRM frontend built with React, TypeScript, and Vite, following SOLID principles and best practices.

## Features

- **Modern Stack**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v4 with custom design system
- **Theme System**: Dark/Light/System mode support
- **Routing**: React Router v7 with type-safe navigation
- **Architecture**: Feature-based structure following SOLID principles
- **Code Quality**: ESLint + Prettier pre-configured
- **Performance**: Optimized build with Vite
- **Scalability**: Modular architecture for easy feature addition

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Run TypeScript type checking

## Project Structure

```
src/
├── core/                    # Core business logic (framework-agnostic)
│   ├── domain/              # Domain models, types, interfaces
│   ├── services/            # Business logic services
│   └── utils/               # Pure utility functions
├── features/                # Feature modules (vertical slices)
│   ├── auth/                # Authentication feature
│   ├── customers/           # Customer management feature
│   ├── dashboard/           # Dashboard feature
│   └── settings/            # Settings feature
├── shared/                  # Shared UI and React-specific code
│   ├── components/          # Reusable UI components
│   ├── hooks/               # Custom React hooks
│   ├── layouts/             # Layout components
│   └── providers/           # Context providers
├── infrastructure/          # External dependencies & integrations
│   ├── api/                 # API clients and HTTP logic
│   └── storage/             # Browser storage abstractions
├── App.tsx                  # Main application component
├── main.tsx                 # Application entry point
└── index.css                # Global styles and Tailwind config
```

## Architecture & SOLID Principles

This project follows SOLID principles for maintainability and scalability:

### Single Responsibility Principle (SRP)
- Each module has one reason to change
- Services handle business logic
- Components handle UI rendering
- Utilities perform specific operations

### Open/Closed Principle (OCP)
- Theme system can be extended with new themes without modification
- Routing structure allows new routes without changing existing code
- Component composition allows extension without modification

### Liskov Substitution Principle (LSP)
- TypeScript interfaces ensure type safety
- Components can be replaced with compatible implementations

### Interface Segregation Principle (ISP)
- Hooks expose only necessary methods
- Context providers have focused responsibilities
- Type definitions are specific and minimal

### Dependency Inversion Principle (DIP)
- Components depend on interfaces, not concrete implementations
- Services are abstracted from UI components
- ThemeProvider depends on ThemeService abstraction

## Theme System

The application includes a complete dark/light mode system:

- **Three modes**: Light, Dark, System (auto-detects OS preference)
- **Persistent**: Theme preference saved to localStorage
- **Reactive**: Automatically responds to OS theme changes
- **Accessible**: Proper ARIA labels and semantic HTML

### Using the Theme

```typescript
import { useTheme } from './shared/hooks/useTheme';

function MyComponent() {
  const { theme, actualTheme, setTheme } = useTheme();

  return (
    <button onClick={() => setTheme('dark')}>
      Switch to Dark Mode
    </button>
  );
}
```

## Design System

The project uses a custom design system built on Tailwind CSS with CSS variables:

- **Color Palette**: Primary (blue) and Gray scales using OKLCH
- **Semantic Tokens**: Background, foreground, card, border, etc.
- **Theme-aware**: All colors automatically adapt to dark/light mode

### Using Design Tokens

```tsx
// Use CSS variables in your components
<div className="bg-[color:var(--background)] text-[color:var(--foreground)]">
  <div className="bg-[color:var(--card)] border border-[color:var(--border)]">
    Content
  </div>
</div>
```

## Adding New Features

Follow the feature-based architecture:

1. Create a new folder in `src/features/your-feature/`
2. Add pages, components, hooks specific to that feature
3. Export public API through `index.ts`
4. Add routes in `App.tsx`

Example:

```typescript
// src/features/contacts/index.ts
export { ContactsPage } from './pages/ContactsPage';

// src/App.tsx
import { ContactsPage } from './features/contacts';

// Add route
<Route path="/contacts" element={<ContactsPage />} />
```

## Best Practices

- **Components**: Keep components small and focused
- **Types**: Define types in `core/domain/` for reusability
- **Services**: Business logic goes in `core/services/`
- **API calls**: Abstract API calls in `infrastructure/api/`
- **Hooks**: Extract reusable logic into custom hooks
- **Styling**: Use Tailwind utilities with design tokens
- **Performance**: Use React.memo, useMemo, useCallback when needed

## Tech Stack

- **Framework**: React 19
- **Language**: TypeScript 5
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS 4
- **Routing**: React Router 7
- **Code Quality**: ESLint 9 + Prettier 3
- **Type Safety**: Strict TypeScript configuration

## Performance Optimizations

- Vite for fast HMR and optimized builds
- Code splitting with React Router
- Tree-shaking enabled
- Minimal bundle size
- CSS-in-CSS with Tailwind for optimal performance

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES2020+ features
- CSS Custom Properties support required

## Contributing

1. Follow the existing code structure
2. Use TypeScript for all new files
3. Run `npm run lint:fix` before committing
4. Run `npm run format` to format code
5. Ensure `npm run type-check` passes

## License

MIT
