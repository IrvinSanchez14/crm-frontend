/**
 * App Component
 * Performance: Implements code splitting for route-based lazy loading
 * Best Practice: Uses Suspense for loading states
 */

import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from './i18n';
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
const ProjectEditPage = lazy(() => 
  import('./features/projects').then((module) => ({ default: module.ProjectEditPage }))
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
const BudgetDetailPage = lazy(() =>
  import('./features/budgets').then((module) => ({ default: module.BudgetDetailPage }))
);
const CreateBudgetPage = lazy(() =>
  import('./features/budgets').then((module) => ({ default: module.CreateBudgetPage }))
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
const ChangeOrdersListPage = lazy(() =>
  import('./features/change-orders').then((module) => ({ default: module.ChangeOrdersListPage }))
);
const ChangeOrderDetailPage = lazy(() =>
  import('./features/change-orders').then((module) => ({ default: module.ChangeOrderDetailPage }))
);
const CreateChangeOrderPage = lazy(() =>
  import('./features/change-orders').then((module) => ({ default: module.CreateChangeOrderPage }))
);
const BudgetReportPage = lazy(() =>
  import('./features/reports').then((module) => ({ default: module.BudgetReportPage }))
);
const RenderingReportPage = lazy(() =>
  import('./features/reports').then((module) => ({ default: module.RenderingReportPage }))
);
const ReferenceReportPage = lazy(() =>
  import('./features/reports').then((module) => ({ default: module.ReferenceReportPage }))
);
const SetupRequestPage = lazy(() =>
  import('./features/setup').then((module) => ({ default: module.SetupRequestPage }))
);
const SetupCreatePage = lazy(() =>
  import('./features/setup').then((module) => ({ default: module.SetupCreatePage }))
);

// Loading fallback component
function LoadingFallback() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex items-center justify-center bg-[color:var(--background)]">
      <Text variant="muted">{t('app.loading')}</Text>
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
          <Route path="/setup" element={<SetupRequestPage />} />
          <Route path="/setup/create" element={<SetupCreatePage />} />
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
            path="/projects/:id/edit"
            element={
              <ProtectedRoute>
                <ProjectEditPage />
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
            path="/budgets/:id/create"
            element={
              <ProtectedRoute>
                <CreateBudgetPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/budgets/:id"
            element={
              <ProtectedRoute>
                <BudgetDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/change-orders"
            element={
              <ProtectedRoute>
                <ChangeOrdersListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/change-orders/create"
            element={
              <ProtectedRoute>
                <CreateChangeOrderPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/change-orders/:id"
            element={
              <ProtectedRoute>
                <ChangeOrderDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/change-orders/:id/edit"
            element={
              <ProtectedRoute>
                <CreateChangeOrderPage />
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
          <Route
            path="/reports/budgets"
            element={
              <ProtectedRoute>
                <BudgetReportPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports/renderings"
            element={
              <ProtectedRoute>
                <RenderingReportPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports/references"
            element={
              <ProtectedRoute>
                <ReferenceReportPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
