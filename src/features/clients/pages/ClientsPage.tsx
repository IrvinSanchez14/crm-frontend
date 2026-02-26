import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Header } from '../../../shared/components/organisms/Header';
import { Sidebar } from '../../../shared/components/organisms/Sidebar';
import { RightSidebar } from '../../../shared/components/organisms/RightSidebar';
import { Table, type TableColumn } from '../../../shared/components/organisms/Table';
import { useAuth } from '../../../shared/hooks/useAuth';
import { Heading } from '../../../shared/components/atoms/Heading';
import { Text } from '../../../shared/components/atoms/Text';
import { Button } from '../../../shared/components/atoms/Button';
import { cn } from '../../../core/utils/cn';
import { getClients, type Client } from '../../../infrastructure/api/api.client';
import { decodeJwt } from '../../../core/utils/jwt.utils';
import { CreateClientForm } from '../components/CreateClientForm';

export function ClientsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation('clients');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());

  // Get company_id from JWT token
  const getCompanyId = useCallback((): string | null => {
    if (!user?.access_token) return null;
    const payload = decodeJwt(user.access_token);
    return payload?.company_id || null;
  }, [user]);

  // Fetch clients function
  const fetchClients = useCallback(async () => {
    const companyId = getCompanyId();
    if (!companyId) {
      setError('Company ID not found. Please log in again.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getClients({
        company_id: companyId,
        skip: 0,
        limit: 100,
      });
      setClients(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  }, [getCompanyId]);

  // Fetch clients on mount
  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Memoize logout handler to prevent unnecessary re-renders
  const handleLogout = useCallback(() => {
    logout();
    navigate('/login', { replace: true });
  }, [logout, navigate]);

  // Toggle sidebar
  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  // Right sidebar handlers
  const openRightSidebar = useCallback(() => {
    setIsRightSidebarOpen(true);
  }, []);

  const closeRightSidebar = useCallback(() => {
    setIsRightSidebarOpen(false);
  }, []);

  // Handle successful client creation
  const handleClientCreated = useCallback(() => {
    closeRightSidebar();
    // Refresh clients list
    fetchClients();
  }, [closeRightSidebar, fetchClients]);


  // Format date
  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });
  }, []);

  // Define table columns
  const columns: TableColumn<Client>[] = useMemo(
    () => [
      {
        key: 'name',
        label: t('name'),
        span: 3,
      },
      {
        key: 'email',
        label: t('email'),
        span: 3,
        render: (client, _isSelected) => (
          <Text
            size="sm"
            className={cn(
              'truncate',
              'font-normal text-gray-700 dark:text-gray-300'
            )}
          >
            {client.email || <span className="text-gray-400 dark:text-gray-500">—</span>}
          </Text>
        ),
      },
      {
        key: 'phone',
        label: t('phone'),
        span: 2,
        render: (client, _isSelected) => (
          <Text
            size="sm"
            className={cn(
              'truncate',
              'font-normal text-gray-700 dark:text-gray-300'
            )}
          >
            {client.phone || <span className="text-gray-400 dark:text-gray-500">—</span>}
          </Text>
        ),
      },
      {
        key: 'created_at',
        label: t('common:table.created'),
        span: 4,
        align: 'right',
        render: (client, _isSelected) => (
          <Text
            size="sm"
            className={cn(
              'truncate',
              'font-normal text-gray-700 dark:text-gray-300'
            )}
          >
            {formatDate(client.created_at)}
          </Text>
        ),
      },
    ],
    [formatDate]
  );

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
          'pt-2',
          'transition-all duration-500 ease-out',
          isSidebarOpen ? 'lg:ml-64' : 'lg:ml-0'
        )}
      >
        <div className="mb-4 flex items-center justify-between px-4">
          <Heading level={1}>{t('title')}</Heading>
          <Button
            onClick={openRightSidebar}
            variant="ghost"
            size="md"
            className="flex items-center gap-2 bg-[rgba(0,0,0,0.0775)] dark:bg-[rgba(255,255,255,0.0775)] hover:bg-[rgba(0,0,0,0.2)] dark:hover:bg-[rgba(255,255,255,0.2)]"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            {t('common:actions.add')}
          </Button>
        </div>

        {/* Gmail-like Table Component */}
        <Table
          columns={columns}
          data={clients}
          getRowId={(client) => client.id}
          loading={loading}
          error={error}
          emptyMessage={t('common:table.noResults')}
          selectedRows={selectedClients}
          onSelectionChange={setSelectedClients}
          selectable={true}
        />

        {/* Footer Info */}
        {!loading && !error && clients.length > 0 && (
          <div className="mt-4 flex items-center justify-between">
            <Text size="sm" variant="muted">
              {selectedClients.size > 0
                ? `${selectedClients.size} of ${clients.length} selected`
                : `${clients.length} client${clients.length !== 1 ? 's' : ''}`}
            </Text>
          </div>
        )}
      </div>

      {/* Right Sidebar for Client Creation */}
      <RightSidebar
        isOpen={isRightSidebarOpen}
        onClose={closeRightSidebar}
        title={t('createClient')}
      >
        <CreateClientForm onSuccess={handleClientCreated} onCancel={closeRightSidebar} />
      </RightSidebar>
    </div>
  );
}

