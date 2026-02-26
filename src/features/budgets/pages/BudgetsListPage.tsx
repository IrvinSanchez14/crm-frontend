/**
 * Budgets List Page
 * Shows all projects with visits so the user can create/view budgets
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../../shared/components/organisms/Header';
import { Sidebar } from '../../../shared/components/organisms/Sidebar';
import { Table, type TableColumn } from '../../../shared/components/organisms/Table';
import { useAuth } from '../../../shared/hooks/useAuth';
import { Heading } from '../../../shared/components/atoms/Heading';
import { Text } from '../../../shared/components/atoms/Text';
import { cn } from '../../../core/utils/cn';
import {
  getVisits,
  getProjects,
  getBudgets,
  type VisitDetail,
  type ProjectDetail,
  type BudgetDetail,
  type BudgetStatus,
} from '../../../infrastructure/api/api.client';
import { decodeJwt } from '../../../core/utils/jwt.utils';
import { DateRangeFilter } from '../../../shared/components/molecules/DateRangeFilter/DateRangeFilter';
import { useTranslation } from 'react-i18next';

interface VisitRow extends VisitDetail {
  project_name: string;
  budget_status: BudgetStatus | null;
}

const budgetStatusColors: Record<BudgetStatus, string> = {
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  pending_approval: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  accepted: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  revised: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
};

export function BudgetsListPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation('budgets');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [visits, setVisits] = useState<VisitRow[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getCompanyId = useCallback((): string | null => {
    if (!user?.access_token) return null;
    const payload = decodeJwt(user.access_token);
    return payload?.company_id || null;
  }, [user]);

  const fetchData = useCallback(async () => {
    const companyId = getCompanyId();
    if (!companyId) {
      setError(t('common:messages.sessionExpired'));
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const dateParams = {
        ...(dateFrom ? { date_from: dateFrom } : {}),
        ...(dateTo ? { date_to: dateTo } : {}),
      };

      const [visitsData, projectsData, budgetsData] = await Promise.all([
        getVisits({ company_id: companyId, skip: 0, limit: 1000, ...dateParams }),
        getProjects({ company_id: companyId, skip: 0, limit: 1000, include_details: true }),
        getBudgets({ company_id: companyId, skip: 0, limit: 1000, ...dateParams }),
      ]);

      const projectMap = new Map<string, ProjectDetail>();
      for (const p of projectsData) {
        projectMap.set(p.id, p);
      }

      const budgetByVisit = new Map<string, BudgetDetail>();
      for (const b of budgetsData) {
        budgetByVisit.set(b.visit_id, b);
      }

      const rows: VisitRow[] = visitsData.map((v) => ({
        ...v,
        project_name: projectMap.get(v.project_id)?.name || '—',
        budget_status: budgetByVisit.get(v.id)?.status ?? null,
      }));

      setVisits(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common:messages.errorLoading'));
    } finally {
      setLoading(false);
    }
  }, [getCompanyId, dateFrom, dateTo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const columns: TableColumn<VisitRow>[] = useMemo(
    () => [
      {
        key: 'project_name',
        label: t('project'),
        span: 3,
        render: (row) => (
          <Text variant="default" className="font-medium">
            {row.project_name}
          </Text>
        ),
      },
      {
        key: 'title',
        label: t('visit'),
        span: 4,
        render: (row) => (
          <Text variant="default" size="sm">
            {row.title}
          </Text>
        ),
      },
      {
        key: 'budget_status',
        label: t('budget'),
        span: 3,
        render: (row) =>
          row.budget_status ? (
            <span
              className={cn(
                'inline-block px-2 py-0.5 rounded-full text-xs font-medium',
                budgetStatusColors[row.budget_status]
              )}
            >
              {t(`status.${row.budget_status}`)}
            </span>
          ) : (
            <Text variant="muted" size="sm">{t('noBudget')}</Text>
          ),
      },
      {
        key: 'created_at',
        label: t('common:table.created'),
        span: 2,
        render: (row) => (
          <Text variant="muted" size="sm">
            {new Date(row.created_at).toLocaleDateString()}
          </Text>
        ),
      },
    ],
    [t]
  );

  const handleRowClick = useCallback((row: VisitRow) => {
    navigate(`/budgets/${row.id}`);
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
          'pt-5',
          'transition-all duration-500 ease-out',
          isSidebarOpen ? 'lg:ml-64' : 'lg:ml-0'
        )}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <Heading variant="h1">{t('title')}</Heading>
          </div>

          {/* Filters */}
          <div className="mb-6 flex gap-4 items-end">
            <DateRangeFilter
              dateFrom={dateFrom}
              dateTo={dateTo}
              onDateFromChange={setDateFrom}
              onDateToChange={setDateTo}
            />
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg">
              {error}
            </div>
          )}

          <Table
            columns={columns}
            data={visits}
            getRowId={(row) => row.id}
            loading={loading}
            error={error}
            emptyMessage={t('noProjectsFound')}
            onRowClick={handleRowClick}
            selectable={false}
          />
        </div>
      </main>
    </div>
  );
}
