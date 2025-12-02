# Components - Atomic Design Structure

This directory follows the **Atomic Design** methodology, organizing components into a hierarchical structure from smallest to largest building blocks.

## Structure

```
components/
├── atoms/          # Basic building blocks
├── molecules/      # Simple combinations of atoms
├── organisms/      # Complex UI components
└── templates/      # Page-level layouts (future)
```

## Atoms

The smallest, most basic components that cannot be broken down further.

**Location:** `atoms/`

**Components:**
- `Button` - Basic button with variants (primary, secondary, ghost, destructive)
- `Input` - Text input field
- `Label` - Form label
- `Card` - Container card component
- `Heading` - Semantic heading (h1-h6)
- `Text` - Text/paragraph component with variants

**Usage:**
```tsx
import { Button, Input, Card } from '@/shared/components/atoms';
```

## Molecules

Simple combinations of atoms that form a functional unit.

**Location:** `molecules/`

**Components:**
- `FormField` - Combines Label + Input with error handling
- `ThemeToggleButton` - Single theme button (Button atom + theme logic)
- `Notification` - Single notification item (Card + Text + Button)

**Usage:**
```tsx
import { FormField, Notification } from '@/shared/components/molecules';
```

## Organisms

Complex UI components that combine molecules and atoms to form distinct sections of an interface.

**Location:** `organisms/`

**Components:**
- `ThemeToggle` - Theme switcher (combines multiple ThemeToggleButton molecules)
- `NotificationContainer` - Notification system (combines multiple Notification molecules)
- `ProtectedRoute` - Route protection with loading state

**Usage:**
```tsx
import { ThemeToggle, ProtectedRoute } from '@/shared/components/organisms';
```

## Principles

1. **Atoms** are independent and reusable
2. **Molecules** combine atoms to create simple UI patterns
3. **Organisms** combine molecules and atoms to create complex, feature-specific components
4. Each component should have a single responsibility
5. Components should be composable and reusable

## Adding New Components

### Adding an Atom
1. Create a folder in `atoms/ComponentName/`
2. Create `ComponentName.tsx` and `index.ts`
3. Export from `atoms/index.ts`

### Adding a Molecule
1. Create a folder in `molecules/ComponentName/`
2. Use atoms as building blocks
3. Export from `molecules/index.ts`

### Adding an Organism
1. Create a folder in `organisms/ComponentName/`
2. Combine molecules and atoms
3. Export from `organisms/index.ts`

