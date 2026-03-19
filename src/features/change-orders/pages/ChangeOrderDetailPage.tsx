/**
 * Change Order Detail Page
 * Shows change order details with items, actions (accept/reject/apply), and PDF download.
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '../../../shared/components/organisms/Header';
import { Sidebar } from '../../../shared/components/organisms/Sidebar';
import { useAuth } from '../../../shared/hooks/useAuth';
import { Heading } from '../../../shared/components/atoms/Heading';
import { Text } from '../../../shared/components/atoms/Text';
import { Button } from '../../../shared/components/atoms/Button';
import { cn } from '../../../core/utils/cn';
import {
  getChangeOrder,
  acceptChangeOrder,
  rejectChangeOrder,
  applyChangeOrder,
  generateChangeOrderPDF,
  type ChangeOrderDetail,
  type ChangeOrderStatus,
} from '../../../infrastructure/api/api.client';
import { decodeJwt } from '../../../core/utils/jwt.utils';
import { formatCurrencyDisplay } from '../../../core/utils/currency.utils';
import { calcSellingPrice, calcProfit, calcLineSubtotal } from '../../../core/utils/pricing.utils';
import { useTranslation } from 'react-i18next';

const statusColors: Record<ChangeOrderStatus, string> = {
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  pending_approval: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  accepted: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  applied: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
};

export function ChangeOrderDetailPage() {
  const { id: changeOrderId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t } = useTranslation('changeOrders');

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [changeOrder, setChangeOrder] = useState<ChangeOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const getCompanyId = useCallback((): string | null => {
    if (!user?.access_token) return null;
    const payload = decodeJwt(user.access_token);
    return payload?.company_id || null;
  }, [user]);

  const getUserId = useCallback((): string | null => {
    if (!user?.access_token) return null;
    const payload = decodeJwt(user.access_token);
    return (payload?.sub as string) || null;
  }, [user]);

  const fetchData = useCallback(async () => {
    if (!changeOrderId) return;
    const companyId = getCompanyId();
    if (!companyId) {
      setError(t('common:messages.sessionExpired'));
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getChangeOrder(changeOrderId, companyId);
      setChangeOrder(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common:messages.errorLoading'));
    } finally {
      setLoading(false);
    }
  }, [changeOrderId, getCompanyId, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return '$0.00';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(num);
  };

  const handleAccept = async () => {
    if (!changeOrderId) return;
    const companyId = getCompanyId();
    const userId = getUserId();
    if (!companyId || !userId) return;

    try {
      setActionLoading(true);
      const updated = await acceptChangeOrder(changeOrderId, companyId, userId);
      setChangeOrder(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!changeOrderId) return;
    const companyId = getCompanyId();
    if (!companyId) return;

    try {
      setActionLoading(true);
      const updated = await rejectChangeOrder(changeOrderId, companyId);
      setChangeOrder(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApply = async () => {
    if (!changeOrderId) return;
    const companyId = getCompanyId();
    const userId = getUserId();
    if (!companyId || !userId) return;

    if (!window.confirm(t('confirmApply'))) return;

    try {
      setActionLoading(true);
      const updated = await applyChangeOrder(changeOrderId, companyId, userId);
      setChangeOrder(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!changeOrderId) return;
    const companyId = getCompanyId();
    if (!companyId) return;

    try {
      const { blob, fileName } = await generateChangeOrderPDF(changeOrderId, companyId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate PDF');
    }
  };

  const handlePreviewPDF = async () => {
    if (!changeOrderId) return;
    const companyId = getCompanyId();
    if (!companyId) return;

    try {
      const { blob } = await generateChangeOrderPDF(changeOrderId, companyId);
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate PDF preview');
    }
  };

  const closePreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[color:var(--background)]">
        <Header userName={user?.name || user?.email || 'User'} onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} onLogout={logout} />
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <main className={cn('pt-5', 'transition-all duration-500 ease-out', isSidebarOpen ? 'lg:ml-64' : 'lg:ml-0')}>
          <div className="p-6 flex items-center justify-center">
            <Text variant="muted">{t('loading')}</Text>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[color:var(--background)]">
      <Header userName={user?.name || user?.email || 'User'} onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} onLogout={logout} />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className={cn('pt-5', 'transition-all duration-500 ease-out', isSidebarOpen ? 'lg:ml-64' : 'lg:ml-0')}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button variant="secondary" size="sm" onClick={() => navigate('/change-orders')} aria-label="Back">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <Heading variant="h1">
                  {t('orderNumber')}{changeOrder?.order_number} — {changeOrder?.title}
                </Heading>
                {changeOrder && (
                  <span className={cn('inline-block px-2 py-1 rounded-full text-xs font-medium', statusColors[changeOrder.status])}>
                    {t(`status.${changeOrder.status}`)}
                  </span>
                )}
              </div>
              <Text variant="muted" size="sm">
                {changeOrder?.project_name} — {changeOrder?.client_name}
              </Text>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg mb-6">
              {error}
            </div>
          )}

          {changeOrder && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Info */}
              <div className="bg-[color:var(--card)] rounded-lg border border-[color:var(--border)] p-6">
                <Heading variant="h3" className="mb-4">{t('changeOrderDetails')}</Heading>
                <div className="space-y-3">
                  <div>
                    <Text variant="muted" className="text-xs mb-1">{t('projectInfo')}</Text>
                    <Text variant="default">{changeOrder.project_name}</Text>
                    {changeOrder.project_address && (
                      <Text variant="muted" size="sm">{changeOrder.project_address}</Text>
                    )}
                  </div>
                  <div>
                    <Text variant="muted" className="text-xs mb-1">{t('clientInfo')}</Text>
                    <Text variant="default">{changeOrder.client_name}</Text>
                    {changeOrder.client_phone && <Text variant="muted" size="sm">{changeOrder.client_phone}</Text>}
                  </div>
                  <div>
                    <Text variant="muted" className="text-xs mb-1">{t('total')}</Text>
                    <Text className="font-semibold text-lg">{formatCurrency(changeOrder.total_amount)}</Text>
                  </div>
                  {changeOrder.created_by_name && (
                    <div>
                      <Text variant="muted" className="text-xs mb-1">{t('createdBy')}</Text>
                      <Text variant="default">{changeOrder.created_by_name}</Text>
                    </div>
                  )}
                  <div>
                    <Text variant="muted" className="text-xs mb-1">{t('common:table.created')}</Text>
                    <Text variant="default">{new Date(changeOrder.created_at).toLocaleDateString()}</Text>
                  </div>

                  {/* Actions */}
                  <div className="border-t border-[color:var(--border)] pt-4 space-y-2">
                    <Button variant="secondary" size="sm" className="w-full" onClick={handlePreviewPDF}>
                      <span className="flex items-center justify-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        {t('preview')}
                      </span>
                    </Button>

                    <Button variant="secondary" size="sm" className="w-full" onClick={handleDownloadPDF}>
                      {t('downloadPDF')}
                    </Button>

                    {changeOrder.status === 'draft' && (
                      <Button variant="secondary" size="sm" className="w-full" onClick={() => navigate(`/change-orders/${changeOrder.id}/edit`)}>
                        {t('editChangeOrder')}
                      </Button>
                    )}

                    {(changeOrder.status === 'draft' || changeOrder.status === 'pending_approval') && (
                      <>
                        <Button variant="primary" size="sm" className="w-full" onClick={handleAccept} disabled={actionLoading}>
                          {t('accept')}
                        </Button>
                        <Button variant="secondary" size="sm" className="w-full" onClick={handleReject} disabled={actionLoading}>
                          {t('reject')}
                        </Button>
                      </>
                    )}

                    {changeOrder.status === 'accepted' && (
                      <Button variant="primary" size="sm" className="w-full" onClick={handleApply} disabled={actionLoading}>
                        {t('applyToBudget')}
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Observations + Items */}
              <div className="lg:col-span-2 space-y-6">
                {/* Observations */}
                {changeOrder.observations && changeOrder.observations.length > 0 && (
                  <div className="bg-[color:var(--card)] rounded-lg border border-[color:var(--border)] p-6">
                    <Heading variant="h3" className="mb-3">{t('observations')}</Heading>
                    <ul className="space-y-3">
                      {changeOrder.observations.map((obs, idx) => (
                        <li key={idx} className="flex items-start gap-3 pl-2">
                          <span className="text-[color:var(--foreground)] mt-0.5 text-sm shrink-0">&#10148;</span>
                          <Text variant="default" size="sm">{obs}</Text>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Items Table */}
                <div className="bg-[color:var(--card)] rounded-lg border border-[color:var(--border)] overflow-hidden">
                  <div className="px-6 py-4 border-b border-[color:var(--border)]">
                    <Heading variant="h3">{t('changeOrders:title')}</Heading>
                  </div>

                  {changeOrder.change_order_items.length === 0 ? (
                    <div className="px-6 py-8 text-center">
                      <Text variant="muted">{t('noItems')}</Text>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-[color:var(--muted)]/20 border-b border-[color:var(--border)]">
                            <th className="text-left px-4 py-2 font-medium text-[color:var(--muted-foreground)] w-12">#</th>
                            <th className="text-left px-3 py-2 font-medium text-[color:var(--muted-foreground)] w-16">{t('itemCode')}</th>
                            <th className="text-left px-3 py-2 font-medium text-[color:var(--muted-foreground)]">{t('description')}</th>
                            <th className="text-left px-3 py-2 font-medium text-[color:var(--muted-foreground)] w-16">{t('unit')}</th>
                            <th className="text-right px-3 py-2 font-medium text-[color:var(--muted-foreground)] w-16">{t('quantity')}</th>
                            <th className="text-right px-3 py-2 font-medium text-[color:var(--muted-foreground)] w-24">{t('budgets:realPrice')}</th>
                            <th className="text-right px-3 py-2 font-medium text-[color:var(--muted-foreground)] w-28">{t('budgets:realPriceWithGanancia')}</th>
                            <th className="text-right px-3 py-2 font-medium text-[color:var(--muted-foreground)] w-24">{t('budgets:gananciaBruta')}</th>
                            <th className="text-right px-3 py-2 font-medium text-[color:var(--muted-foreground)] w-28">{t('subtotal')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {changeOrder.change_order_items.map((item, idx) => {
                            const realPrice = parseFloat(item.unit_price) || 0;
                            const qty = parseFloat(item.quantity) || 0;
                            return (
                              <tr key={item.id} className="border-b border-[color:var(--border)] last:border-b-0">
                                <td className="px-3 py-2.5 text-[color:var(--muted-foreground)]">{idx + 1}</td>
                                <td className="px-3 py-2.5 text-[color:var(--muted-foreground)]">{item.item_code || '—'}</td>
                                <td className="px-3 py-2.5">{item.description}</td>
                                <td className="px-3 py-2.5 text-[color:var(--muted-foreground)]">{item.unit || '—'}</td>
                                <td className="text-right px-3 py-2.5">{item.quantity}</td>
                                <td className="text-right px-3 py-2.5">{formatCurrencyDisplay(realPrice)}</td>
                                <td className="text-right px-3 py-2.5">{formatCurrencyDisplay(calcSellingPrice(realPrice))}</td>
                                <td className="text-right px-3 py-2.5">{formatCurrencyDisplay(calcProfit(realPrice))}</td>
                                <td className="text-right px-3 py-2.5 font-medium">{formatCurrencyDisplay(calcLineSubtotal(qty, realPrice))}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="bg-[color:var(--muted)]/10">
                            <td colSpan={8} className="text-right px-3 py-3 font-medium text-[color:var(--muted-foreground)]">{t('total')}</td>
                            <td className="text-right px-3 py-3 font-bold text-lg">
                              {formatCurrencyDisplay(
                                changeOrder.change_order_items.reduce((sum, item) => {
                                  const rp = parseFloat(item.unit_price) || 0;
                                  const q = parseFloat(item.quantity) || 0;
                                  return sum + calcLineSubtotal(q, rp);
                                }, 0)
                              )}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* PDF Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={closePreview} />
          <div className="relative bg-[color:var(--card)] rounded-lg border border-[color:var(--border)] shadow-xl w-full max-w-4xl max-h-[90vh] mx-4 flex flex-col">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[color:var(--border)]">
              <Heading variant="h3">
                {t('preview')} — {t('orderNumber')}{changeOrder?.order_number}
              </Heading>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={handleDownloadPDF}>
                  {t('downloadPDF')}
                </Button>
                <button
                  type="button"
                  onClick={closePreview}
                  className="text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] transition-colors"
                  aria-label="Close preview"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            {/* PDF iframe */}
            <div className="flex-1 min-h-0">
              <iframe
                src={previewUrl}
                className="w-full h-[80vh] rounded-b-lg"
                title="Change Order PDF Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
