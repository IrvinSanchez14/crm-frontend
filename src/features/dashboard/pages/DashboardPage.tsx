/**
 * Dashboard Page
 * Feature: Dashboard
 */

import { useNavigate } from 'react-router-dom';
import { ThemeToggle } from '../../../shared/components/ThemeToggle';
import { useAuth } from '../../../shared/hooks/useAuth';

export function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-[color:var(--foreground)]">
              CRM Dashboard
            </h1>
            {user && (
              <p className="text-sm text-[color:var(--muted-foreground)] mt-1">
                Welcome, {user.name}
              </p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-[color:var(--foreground)] hover:bg-[color:var(--accent)] rounded-md transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Stats Cards */}
          <div className="bg-[color:var(--card)] p-6 rounded-lg shadow-sm border border-[color:var(--border)]">
            <h3 className="text-sm font-medium text-[color:var(--muted-foreground)] mb-2">
              Total Customers
            </h3>
            <p className="text-3xl font-bold text-[color:var(--foreground)]">
              1,234
            </p>
            <p className="text-sm text-[color:var(--muted-foreground)] mt-2">
              +12% from last month
            </p>
          </div>

          <div className="bg-[color:var(--card)] p-6 rounded-lg shadow-sm border border-[color:var(--border)]">
            <h3 className="text-sm font-medium text-[color:var(--muted-foreground)] mb-2">
              Active Deals
            </h3>
            <p className="text-3xl font-bold text-[color:var(--foreground)]">
              87
            </p>
            <p className="text-sm text-[color:var(--muted-foreground)] mt-2">
              +5% from last month
            </p>
          </div>

          <div className="bg-[color:var(--card)] p-6 rounded-lg shadow-sm border border-[color:var(--border)]">
            <h3 className="text-sm font-medium text-[color:var(--muted-foreground)] mb-2">
              Revenue
            </h3>
            <p className="text-3xl font-bold text-[color:var(--foreground)]">
              $45,678
            </p>
            <p className="text-sm text-[color:var(--muted-foreground)] mt-2">
              +23% from last month
            </p>
          </div>
        </div>

        <div className="mt-8 bg-[color:var(--card)] p-6 rounded-lg shadow-sm border border-[color:var(--border)]">
          <h2 className="text-2xl font-semibold text-[color:var(--foreground)] mb-4">
            Recent Activity
          </h2>
          <p className="text-[color:var(--muted-foreground)]">
            Your CRM dashboard with dark/light mode support is ready!
          </p>
        </div>
      </div>
    </div>
  );
}
