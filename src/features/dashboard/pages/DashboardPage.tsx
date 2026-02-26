

import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('dashboard');

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
          <Heading level={1}>{t('title')}</Heading>
          {user && (
            <Text size="sm" variant="muted" className="mt-1">
              {t('welcome', { name: user.name })}
            </Text>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Stats Cards */}
          <Card className="p-6">
            <Text size="sm" variant="muted" className="mb-2 font-medium">
              {t('totalCustomers')}
            </Text>
            <Heading level={1} className="text-3xl mb-2">
              1,234
            </Heading>
            <Text size="sm" variant="muted" className="mt-2">
              {t('fromLastMonth', { percent: '12' })}
            </Text>
          </Card>

          <Card className="p-6">
            <Text size="sm" variant="muted" className="mb-2 font-medium">
              {t('activeDeals')}
            </Text>
            <Heading level={1} className="text-3xl mb-2">
              87
            </Heading>
            <Text size="sm" variant="muted" className="mt-2">
              {t('fromLastMonth', { percent: '5' })}
            </Text>
          </Card>

          <Card className="p-6">
            <Text size="sm" variant="muted" className="mb-2 font-medium">
              {t('revenue')}
            </Text>
            <Heading level={1} className="text-3xl mb-2">
              $45,678
            </Heading>
            <Text size="sm" variant="muted" className="mt-2">
              {t('fromLastMonth', { percent: '23' })}
            </Text>
          </Card>
        </div>

        <Card className="mt-8 p-6">
          <Heading level={2} className="mb-4">
            {t('recentActivity')}
          </Heading>
          <Text variant="muted">
            {t('dashboardReady')}
          </Text>
        </Card>
      </div>
    </div>
  );
}
