/**
 * Application Entry Point
 * Sets up providers following Dependency Inversion principle
 * Best Practice: Wraps app in ErrorBoundary for error handling
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { ThemeProvider } from './shared/providers/ThemeProvider';
import { ErrorBoundary } from './shared/components/organisms/ErrorBoundary';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider defaultTheme="system">
        <App />
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>
);
