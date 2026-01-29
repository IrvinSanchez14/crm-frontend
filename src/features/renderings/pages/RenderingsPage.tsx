/**
 * Renderings Page
 * List view for all renderings with filtering
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../../shared/components/organisms/Header';
import { Sidebar } from '../../../shared/components/organisms/Sidebar';
import { Table, type TableColumn } from '../../../shared/components/organisms/Table';
import { useAuth } from '../../../shared/hooks/useAuth';
import { Heading } from '../../../shared/components/atoms/Heading';
import { Text } from '../../../shared/components/atoms/Text';
import { Button } from '../../../shared/components/atoms/Button';
import { cn } from '../../../core/utils/cn';
import {
  getRenderings,
  getVisits,
  type RenderingDetail,
  type VisitDetail,
  type RenderingStatus
} from '../../../infrastructure/api/api.client';
import { decodeJwt } from '../../../core/utils/jwt.utils';

export function RenderingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [renderings, setRenderings] = useState<RenderingDetail[]>([]);
  const [visits, setVisits] = useState<VisitDetail[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<RenderingStatus | ''>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get company_id from JWT token
  const getCompanyId = useCallback((): string | null => {
    if (!user?.access_token) return null;
    const payload = decodeJwt(user.access_token);
    return payload?.company_id || null;
  }, [user]);

  // Fetch visits for dropdown
  const fetchVisits = useCallback(async () => {
    const companyId = getCompanyId();
    if (!companyId) return;

    try {
      const data = await getVisits({
        company_id: companyId,
        skip: 0,
        limit: 1000,
        include_details: true,
      });
      setVisits(data);
    } catch (err) {
      console.error('Failed to load visits:', err);
    }
  }, [getCompanyId]);

  // Fetch renderings
  const fetchRenderings = useCallback(async () => {
    const companyId = getCompanyId();
    if (!companyId) {
      setError('Company ID not found. Please log in again.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const params: any = {
        company_id: companyId,
        skip: 0,
        limit: 1000,
      };

      if (selectedStatus) {
        params.status = selectedStatus;
      }

      const data = await getRenderings(params);
      setRenderings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load renderings');
    } finally {
      setLoading(false);
    }
  }, [getCompanyId, selectedStatus]);

  // Fetch data on mount
  useEffect(() => {
    fetchVisits();
  }, [fetchVisits]);

  // Fetch renderings when filters change
  useEffect(() => {
    fetchRenderings();
  }, [fetchRenderings]);

  // Table columns
  const columns: TableColumn<RenderingDetail>[] = useMemo(
    () => [
      {
        key: 'title',
        label: 'Title',
        span: 4,
        render: (rendering) => (
          <Text variant="default" className="font-medium">
            {rendering.title}
          </Text>
        ),
      },
      {
        key: 'visit',
        label: 'Visit',
        span: 3,
        render: (rendering) => {
          const visit = visits.find((v) => v.id === rendering.visit_id);
          return (
            <Text variant="muted" size="sm">
              {visit?.title || '—'}
            </Text>
          );
        },
      },
      {
        key: 'status',
        label: 'Status',
        span: 2,
        render: (rendering) => {
          const statusColors: Record<RenderingStatus, string> = {
            draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
            sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
            approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
            rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
          };
          return (
            <span
              className={cn(
                'px-2 py-1 rounded-full text-xs font-medium',
                statusColors[rendering.status]
              )}
            >
              {rendering.status.toUpperCase()}
            </span>
          );
        },
      },
      {
        key: 'expiration_date',
        label: 'Expires',
        span: 3,
        render: (rendering) => (
          <Text variant="muted" size="sm">
            {rendering.expiration_date
              ? new Date(rendering.expiration_date).toLocaleDateString()
              : '—'}
          </Text>
        ),
      },
    ],
    [visits]
  );

  // Navigate to rendering detail page on row click
  const handleRowClick = useCallback((rendering: RenderingDetail) => {
    navigate(`/renderings/${rendering.id}`);
  }, [navigate]);

  const handleCreateClick = useCallback(() => {
    navigate('/renderings/create');
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[color:var(--background)]">
      <Header
        userName={user?.name || user?.email || 'User'}
        onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
        onLogout={logout}
      />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main
        className={cn(
          'w-full pt-5',
          'transition-all duration-500 ease-out',
          isSidebarOpen ? 'lg:ml-64' : 'lg:ml-0'
        )}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <Heading variant="h1">Renderings</Heading>
            <Button onClick={handleCreateClick} variant="primary">
              Create Rendering
            </Button>
          </div>

          {/* Filters */}
          <div className="mb-6 flex gap-4 items-end">
            <div className="flex-1 max-w-xs">
              <label className="block text-sm font-medium mb-2 text-[color:var(--foreground)]">
                Filter by Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as RenderingStatus | '')}
                className="w-full px-3 py-2 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--foreground)]"
              >
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg">
              {error}
            </div>
          )}

          <Table
            columns={columns}
            data={renderings}
            getRowId={(rendering) => rendering.id}
            loading={loading}
            error={error}
            emptyMessage="No renderings found"
            onRowClick={handleRowClick}
            selectable={false}
          />
        </div>
      </main>
    </div>
  );
}
