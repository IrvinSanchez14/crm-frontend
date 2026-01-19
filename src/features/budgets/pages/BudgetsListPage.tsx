/**
 * Budgets List Page
 * Displays all budgets with ability to generate PDF reports
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
  getBudgets, 
  type BudgetDetail,
  type BudgetStatus
} from '../../../infrastructure/api/api.client';
import { decodeJwt } from '../../../core/utils/jwt.utils';
import { generateBudgetPDF } from '../utils/pdfGenerator';

export function BudgetsListPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [budgets, setBudgets] = useState<BudgetDetail[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<BudgetStatus | ''>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingPDF, setGeneratingPDF] = useState<string | null>(null);

  // Get company_id from JWT token
  const getCompanyId = useCallback((): string | null => {
    if (!user?.access_token) return null;
    const payload = decodeJwt(user.access_token);
    return payload?.company_id || null;
  }, [user]);

  // Fetch budgets function
  const fetchBudgets = useCallback(async () => {
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
      
      const data = await getBudgets(params);
      setBudgets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load budgets');
    } finally {
      setLoading(false);
    }
  }, [getCompanyId, selectedStatus]);

  // Fetch budgets on mount and when filters change
  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  // Handle PDF generation
  const handleGeneratePDF = useCallback(async (budget: BudgetDetail) => {
    try {
      setGeneratingPDF(budget.id);
      await generateBudgetPDF(budget);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setGeneratingPDF(null);
    }
  }, []);

  // Table columns
  const columns: TableColumn<BudgetDetail>[] = useMemo(
    () => [
      {
        key: 'title',
        label: 'Title',
        span: 3,
        render: (budget) => (
          <Text variant="default" className="font-medium">
            {budget.title}
          </Text>
        ),
      },
      {
        key: 'visit',
        label: 'Visit',
        span: 2,
        render: (budget) => {
          // We'll need to fetch visit details or include them in the response
          return (
            <Text variant="muted" size="sm">
              {budget.visit_id ? 'View Visit' : '—'}
            </Text>
          );
        },
      },
      {
        key: 'status',
        label: 'Status',
        span: 2,
        render: (budget) => {
          const statusColors: Record<BudgetStatus, string> = {
            draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
            pending_approval: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
            accepted: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
            rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
            revised: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
          };
          return (
            <span
              className={cn(
                'px-2 py-1 rounded-full text-xs font-medium',
                statusColors[budget.status]
              )}
            >
              {budget.status.replace('_', ' ').toUpperCase()}
            </span>
          );
        },
      },
      {
        key: 'total_amount',
        label: 'Total',
        span: 2,
        render: (budget) => {
          const amount = parseFloat(budget.total_amount);
          return (
            <Text variant="default" className="font-semibold">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 2,
              }).format(amount)}
            </Text>
          );
        },
      },
      {
        key: 'created_at',
        label: 'Created',
        span: 2,
        render: (budget) => (
          <Text variant="muted" size="sm">
            {new Date(budget.created_at).toLocaleDateString()}
          </Text>
        ),
      },
      {
        key: 'actions',
        label: 'Actions',
        span: 1,
        align: 'center',
        render: (budget) => (
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleGeneratePDF(budget);
            }}
            disabled={generatingPDF === budget.id}
          >
            {generatingPDF === budget.id ? 'Generating...' : 'PDF'}
          </Button>
        ),
      },
    ],
    [handleGeneratePDF, generatingPDF]
  );

  const handleRowClick = useCallback((budget: BudgetDetail) => {
    // Navigate to budget detail or visit detail
    navigate(`/visits?budget_id=${budget.id}`);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[color:var(--background)]">
      <Header
        userName={user?.name || user?.email || 'User'}
        onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
        onLogout={logout}
      />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <main className="lg:pl-64 pt-16">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <Heading variant="h1">Budgets</Heading>
          </div>

          {/* Filters */}
          <div className="mb-6 flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2 text-[color:var(--foreground)]">
                Filter by Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as BudgetStatus | '')}
                className="w-full px-3 py-2 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--foreground)]"
              >
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="pending_approval">Pending Approval</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
                <option value="revised">Revised</option>
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
            data={budgets}
            getRowId={(budget) => budget.id}
            loading={loading}
            error={error}
            emptyMessage="No budgets found"
            onRowClick={handleRowClick}
            selectable={false}
          />
        </div>
      </main>
    </div>
  );
}
