

import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../../shared/components/organisms/Header';
import { Sidebar } from '../../../shared/components/organisms/Sidebar';
import { useAuth } from '../../../shared/hooks/useAuth';
import { Heading } from '../../../shared/components/atoms/Heading';
import { Text } from '../../../shared/components/atoms/Text';
import { Card } from '../../../shared/components/atoms/Card';
import { cn } from '../../../core/utils/cn';

export function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Memoize logout handler to prevent unnecessary re-renders
  const handleLogout = useCallback(() => {
    logout();
    navigate('/login', { replace: true });
  }, [logout, navigate]);

  // Toggle sidebar
  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  // Close sidebar
  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  return (
    <div className="min-h-screen bg-[color:var(--background)]">
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      <Header
        userName={user?.name}
        onLogout={handleLogout}
        onMenuClick={toggleSidebar}
      />

      <div
        className={cn(
          'max-w-7xl mx-auto p-8',
          // Add left margin on desktop when sidebar is open to prevent content overlap
          // Smooth transition for content shift
          'transition-all duration-500 ease-out',
          isSidebarOpen ? 'lg:ml-64' : 'lg:ml-0'
        )}
      >
        <div className="mb-8">
          <Heading level={1}>CRM Dashboard</Heading>
          {user && (
            <Text size="sm" variant="muted" className="mt-1">
              Welcome, {user.name}
            </Text>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Stats Cards */}
          <Card className="p-6">
            <Text size="sm" variant="muted" className="mb-2 font-medium">
              Total Customers
            </Text>
            <Heading level={1} className="text-3xl mb-2">
              1,234
            </Heading>
            <Text size="sm" variant="muted" className="mt-2">
              +12% from last month
            </Text>
          </Card>

          <Card className="p-6">
            <Text size="sm" variant="muted" className="mb-2 font-medium">
              Active Deals
            </Text>
            <Heading level={1} className="text-3xl mb-2">
              87
            </Heading>
            <Text size="sm" variant="muted" className="mt-2">
              +5% from last month
            </Text>
          </Card>

          <Card className="p-6">
            <Text size="sm" variant="muted" className="mb-2 font-medium">
              Revenue
            </Text>
            <Heading level={1} className="text-3xl mb-2">
              $45,678
            </Heading>
            <Text size="sm" variant="muted" className="mt-2">
              +23% from last month
            </Text>
          </Card>
        </div>

        <Card className="mt-8 p-6">
          <Heading level={2} className="mb-4">
            Recent Activity
          </Heading>
          <Text variant="muted">
            Your CRM dashboard with dark/light mode support is ready!
          </Text>
        </Card>
      </div>
    </div>
  );
}
