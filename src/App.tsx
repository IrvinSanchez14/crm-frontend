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
const ClientsPage = lazy(() => 
  import('./features/clients').then((module) => ({ default: module.ClientsPage }))
);
const ProjectsPage = lazy(() => 
  import('./features/projects').then((module) => ({ default: module.ProjectsPage }))
);
const ProjectCategoriesPage = lazy(() => 
  import('./features/project-categories').then((module) => ({ default: module.ProjectCategoriesPage }))
);
const VisitsPage = lazy(() =>
  import('./features/visits').then((module) => ({ default: module.VisitsPage }))
);
const VisitDetailPage = lazy(() =>
  import('./features/visits').then((module) => ({ default: module.VisitDetailPage }))
);
const BudgetsListPage = lazy(() =>
  import('./features/budgets').then((module) => ({ default: module.BudgetsListPage }))
);
const RenderingsPage = lazy(() =>
  import('./features/renderings').then((module) => ({ default: module.RenderingsPage }))
);
const RenderingDetailPage = lazy(() =>
  import('./features/renderings').then((module) => ({ default: module.RenderingDetailPage }))
);
const CreateRenderingPage = lazy(() =>
  import('./features/renderings').then((module) => ({ default: module.CreateRenderingPage }))
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
          <Route
            path="/clients"
            element={
              <ProtectedRoute>
                <ClientsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <ProjectsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/project-categories"
            element={
              <ProtectedRoute>
                <ProjectCategoriesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/visits"
            element={
              <ProtectedRoute>
                <VisitsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/visits/:id"
            element={
              <ProtectedRoute>
                <VisitDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/budgets"
            element={
              <ProtectedRoute>
                <BudgetsListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/renderings"
            element={
              <ProtectedRoute>
                <RenderingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/renderings/create"
            element={
              <ProtectedRoute>
                <CreateRenderingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/renderings/:id"
            element={
              <ProtectedRoute>
                <RenderingDetailPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
