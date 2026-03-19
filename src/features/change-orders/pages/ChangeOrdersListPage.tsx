/**
 * Change Orders List Page
 * Shows all change orders with budget context, status, and actions.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../../shared/components/organisms/Header';
import { Sidebar } from '../../../shared/components/organisms/Sidebar';
import { useAuth } from '../../../shared/hooks/useAuth';
import { Heading } from '../../../shared/components/atoms/Heading';
import { Text } from '../../../shared/components/atoms/Text';
import { Button } from '../../../shared/components/atoms/Button';
import { cn } from '../../../core/utils/cn';
import {
  getChangeOrders,
  type ChangeOrderDetail,
  type ChangeOrderStatus,
} from '../../../infrastructure/api/api.client';
import { decodeJwt } from '../../../core/utils/jwt.utils';
import { useTranslation } from 'react-i18next';

const statusColors: Record<ChangeOrderStatus, string> = {
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  pending_approval: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  accepted: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  applied: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
};

export function ChangeOrdersListPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation('changeOrders');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [changeOrders, setChangeOrders] = useState<ChangeOrderDetail[]>([]);
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
      const result = await getChangeOrders({ company_id: companyId, skip: 0, limit: 500 });
      setChangeOrders(result.change_orders);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common:messages.errorLoading'));
    } finally {
      setLoading(false);
    }
  }, [getCompanyId, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return '$0.00';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(num);
  };

  return (
    <div className="min-h-screen bg-[color:var(--background)]">
      <Header
        userName={user?.name || user?.email || 'User'}
        onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
        onLogout={logout}
      />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className={cn('pt-5', 'transition-all duration-500 ease-out', isSidebarOpen ? 'lg:ml-64' : 'lg:ml-0')}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <Heading variant="h1">{t('title')}</Heading>
            <Button variant="primary" onClick={() => navigate('/change-orders/create')}>
              {t('createChangeOrder')}
            </Button>
          </div>

          {error && (
            <div className="p-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg mb-6">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Text variant="muted">{t('loading')}</Text>
            </div>
          ) : changeOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <svg className="w-16 h-16 mb-4 text-[color:var(--muted-foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <Heading variant="h3" className="mb-2">{t('noChangeOrders')}</Heading>
              <Text variant="muted" className="mb-6">{t('noChangeOrdersDescription')}</Text>
            </div>
          ) : (
            <div className="grid gap-4">
              {changeOrders.map((co) => (
                <div
                  key={co.id}
                  className="bg-[color:var(--card)] rounded-lg border border-[color:var(--border)] p-5 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/change-orders/${co.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <Heading variant="h4">
                          {t('orderNumber')}{co.order_number} — {co.title}
                        </Heading>
                        <span className={cn('inline-block px-2 py-0.5 rounded-full text-xs font-medium', statusColors[co.status])}>
                          {t(`status.${co.status}`)}
                        </span>
                      </div>
                      <Text variant="muted" size="sm">
                        {co.project_name} — {co.client_name}
                      </Text>
                    </div>
                    <div className="text-right">
                      <Text className="font-semibold text-lg">{formatCurrency(co.total_amount)}</Text>
                      <Text variant="muted" size="sm">
                        {new Date(co.created_at).toLocaleDateString()}
                      </Text>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
