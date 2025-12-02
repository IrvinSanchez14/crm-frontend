/**
 * App Component
 * Performance: Implements code splitting for route-based lazy loading
 * Best Practice: Uses Suspense for loading states
 */

import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './shared/components/organisms/ProtectedRoute';
import { NotificationContainer } from './shared/components/organisms/NotificationContainer';
import { Text } from './shared/components/atoms/Text';

// Lazy load pages for code splitting and better performance
const LoginPage = lazy(() => 
  import('./features/auth').then((module) => ({ default: module.LoginPage }))
);
const DashboardPage = lazy(() => 
  import('./features/dashboard').then((module) => ({ default: module.DashboardPage }))
);

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[color:var(--background)]">
      <Text variant="muted">Loading...</Text>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <NotificationContainer />
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={<Navigate to="/dashboard" replace />}
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
