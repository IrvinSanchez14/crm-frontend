# Unit Testing Setup

## Overview

Unit tests have been added to the CRM Frontend using **Vitest** and **React Testing Library**.

## Test Framework

- **Vitest**: Vite-native testing framework (fast, compatible with Vite config)
- **@testing-library/react**: React component testing utilities
- **@testing-library/jest-dom**: Custom Jest matchers for DOM assertions
- **@testing-library/user-event**: User interaction simulation
- **jsdom**: Browser environment simulation

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with UI
npm test:ui

# Run tests with coverage
npm test:coverage

# Run specific test file
npm test -- path/to/test.test.ts
```

## Test Structure

```
src/
├── test/
│   ├── setup.ts              # Test environment setup
│   └── test-utils.tsx        # Custom render utilities
├── core/
│   ├── services/
│   │   └── token.service.test.ts   # TokenService tests
│   └── utils/
│       ├── cn.test.ts              # Classname utility tests
│       └── jwt.utils.test.ts       # JWT utility tests
├── infrastructure/
│   └── api/
│       └── api.client.test.ts      # API client type tests
└── shared/
    └── components/
        ├── atoms/
        │   └── Button/
        │       └── Button.test.tsx  # Button component tests
        └── molecules/
            └── FormField/
                └── FormField.test.tsx  # FormField component tests
```

## Test Coverage

### ✅ Currently Tested (25 tests passing)

1. **API Client Types** (7 tests)
   - Project interface structure
   - ProjectCreate interface validation
   - ProjectDetail with relationships
   - ProjectStatus enum values
   - Removed field verification (budget, completion dates)

2. **Button Component** (10 tests)
   - Rendering variants (primary, secondary, danger, ghost)
   - Click handling
   - Disabled state
   - Custom className support
   - Type attribute handling

3. **FormField Component** (8 tests)
   - Label rendering
   - Input value changes
   - Disabled state
   - Placeholder text
   - Required fields
   - Date inputs
   - Error message display

4. **TokenService** (tests created, need import fixes)
   - Token storage
   - Token retrieval
   - Token clearing
   - Token validation

5. **Utility Functions** (tests created, need import fixes)
   - JWT decoding
   - Classname merging (cn)

## Test Utilities

### Custom Render

Located in `src/test/test-utils.tsx`, provides:
- Automatic BrowserRouter wrapper
- User event setup
- Re-export of all React Testing Library utilities

Usage:
```typescript
import { render, screen } from '../../test/test-utils';

it('should render component', () => {
  const { user } = render(<MyComponent />);
  expect(screen.getByText('Hello')).toBeInTheDocument();
  await user.click(screen.getByRole('button'));
});
```

## Writing New Tests

### Component Test Template

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../path/to/test-utils';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('should handle user interactions', async () => {
    const handleClick = vi.fn();
    const { user } = render(<MyComponent onClick={handleClick} />);
    
    await user.click(screen.getByRole('button'));
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Service/Utility Test Template

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { myUtility } from './my-utility';

describe('myUtility', () => {
  beforeEach(() => {
    // Setup before each test
  });

  it('should perform expected behavior', () => {
    const result = myUtility('input');
    expect(result).toBe('expected output');
  });
});
```

## Best Practices

1. **Test Behavior, Not Implementation**
   - Focus on what the user sees and does
   - Avoid testing internal state or methods

2. **Use Semantic Queries**
   - Prefer `getByRole`, `getByLabelText`, `getByText`
   - Avoid `getByTestId` unless necessary

3. **Test User Interactions**
   - Use `userEvent` for realistic interactions
   - Test keyboard navigation when applicable

4. **Keep Tests Fast**
   - Mock external dependencies
   - Use minimal test data
   - Avoid unnecessary async operations

5. **Descriptive Test Names**
   - Use "should" statements
   - Describe the expected outcome
   - Example: `should display error when email is invalid`

## CI/CD Integration

Add to your CI pipeline:

```yaml
- name: Run Tests
  run: npm test -- --run

- name: Generate Coverage
  run: npm run test:coverage
```

## Future Improvements

- [ ] Add coverage thresholds
- [ ] Add integration tests for complex flows
- [ ] Add visual regression tests
- [ ] Mock API responses for component tests
- [ ] Add tests for remaining components
- [ ] Fix import resolution for utils tests

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library Best Practices](https://testing-library.com/docs/guiding-principles)
