/**
 * Application Entry Point
 * Sets up providers following Dependency Inversion principle
 * Best Practice: Wraps app in ErrorBoundary for error handling
 */

import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './i18n/config'; // Initialize i18n
import App from './App.tsx';
import { ThemeProvider } from './shared/providers/ThemeProvider';
import { ErrorBoundary } from './shared/components/organisms/ErrorBoundary';
import { Text } from './shared/components/atoms/Text';

// Loading fallback for i18n initialization
function I18nLoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[color:var(--background)]">
      <Text variant="muted">Loading translations...</Text>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider defaultTheme="system">
        <Suspense fallback={<I18nLoadingFallback />}>
          <App />
        </Suspense>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>
);
