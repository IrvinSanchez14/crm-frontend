/**
 * Budget Detail Page
 * Receives a visit ID. Shows visit info (left) + budget or create prompt (right).
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
  getVisit,
  getProject,
  getBudgetByVisit,
  getVisitAttachments,
  type BudgetDetail,
  type BudgetCategoryDetail,
  type BudgetStatus,
  type VisitDetail,
  type ProjectDetail,
  type VisitStatus,
  type VisitAttachment,
} from '../../../infrastructure/api/api.client';
import { decodeJwt } from '../../../core/utils/jwt.utils';
import { useTranslation } from 'react-i18next';

export function BudgetDetailPage() {
  const { id: visitId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t } = useTranslation('budgets');

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [visit, setVisit] = useState<VisitDetail | null>(null);
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [budget, setBudget] = useState<BudgetDetail | null>(null);
  const [attachments, setAttachments] = useState<VisitAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const getCompanyId = useCallback((): string | null => {
    if (!user?.access_token) return null;
    const payload = decodeJwt(user.access_token);
    return payload?.company_id || null;
  }, [user]);

  const fetchData = useCallback(async () => {
    if (!visitId) return;

    const companyId = getCompanyId();
    if (!companyId) {
      setError(t('common:messages.sessionExpired'));
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const visitData = await getVisit(visitId, companyId);
      setVisit(visitData);

      const [projectData, budgetData, attachmentsData] = await Promise.all([
        getProject(visitData.project_id, companyId),
        getBudgetByVisit(visitId, companyId),
        getVisitAttachments(visitId, companyId),
      ]);

      setProject(projectData);
      setBudget(budgetData);
      setAttachments(attachmentsData.attachments);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common:messages.errorLoading'));
    } finally {
      setLoading(false);
    }
  }, [visitId, getCompanyId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const statusColors: Record<VisitStatus, string> = {
    planning: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    in_review: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    inspection_required: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    visited: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  };

  const budgetStatusColors: Record<BudgetStatus, string> = {
    draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    pending_approval: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    accepted: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    revised: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(num);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[color:var(--background)]">
        <Header
          userName={user?.name || user?.email || 'User'}
          onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
          onLogout={logout}
        />
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <main className={cn('pt-5', 'transition-all duration-500 ease-out', isSidebarOpen ? 'lg:ml-64' : 'lg:ml-0')}>
          <div className="p-6 flex items-center justify-center">
            <Text variant="muted">{t('loading')}</Text>
          </div>
        </main>
      </div>
    );
  }

  if (error && !visit) {
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
            <div className="p-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg mb-4">
              {error}
            </div>
            <Button variant="secondary" onClick={() => navigate('/budgets')}>
              {t('backToBudgets')}
            </Button>
          </div>
        </main>
      </div>
    );
  }

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
          {/* Header with back button */}
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/budgets')}
              aria-label="Back to budgets"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Button>
            <div className="flex-1">
              <Heading variant="h1">{project?.name || 'Project'}</Heading>
              <Text variant="muted" size="sm">
                {visit?.title}
              </Text>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Two-panel layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Visit Information */}
            <div className="bg-[color:var(--card)] rounded-lg border border-[color:var(--border)] p-6">
              <Heading variant="h3" className="mb-4">{t('visitInformation')}</Heading>
              {visit ? (
                <div className="space-y-4">
                  <div>
                    <Text variant="muted" className="text-xs mb-1">Title</Text>
                    <Text variant="default" className="font-medium">{visit.title}</Text>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Text variant="muted" className="text-xs mb-1">Status</Text>
                      <span
                        className={cn(
                          'inline-block px-2 py-1 rounded-full text-xs font-medium',
                          statusColors[visit.status]
                        )}
                      >
                        {t(`visits:status.${visit.status}`)}
                      </span>
                    </div>
                    <div>
                      <Text variant="muted" className="text-xs mb-1">Visit Date</Text>
                      <Text variant="default">
                        {visit.visit_date
                          ? new Date(visit.visit_date).toLocaleDateString()
                          : '\u2014'}
                      </Text>
                    </div>
                  </div>

                  {visit.description && (
                    <div>
                      <Text variant="muted" className="text-xs mb-1">Description</Text>
                      <Text variant="default">{visit.description}</Text>
                    </div>
                  )}

                  {(visit.estimated_materials_cost || visit.estimated_labor_cost || visit.estimated_total_cost) && (
                    <div className="border-t border-[color:var(--border)] pt-4">
                      <Text variant="muted" className="text-xs mb-2">{t('costEstimates')}</Text>
                      <div className="grid grid-cols-3 gap-4">
                        {visit.estimated_materials_cost && (
                          <div>
                            <Text variant="muted" className="text-xs">{t('materials')}</Text>
                            <Text variant="default" className="font-medium">
                              ${parseFloat(visit.estimated_materials_cost).toFixed(2)}
                            </Text>
                          </div>
                        )}
                        {visit.estimated_labor_cost && (
                          <div>
                            <Text variant="muted" className="text-xs">{t('labor')}</Text>
                            <Text variant="default" className="font-medium">
                              ${parseFloat(visit.estimated_labor_cost).toFixed(2)}
                            </Text>
                          </div>
                        )}
                        {visit.estimated_total_cost && (
                          <div>
                            <Text variant="muted" className="text-xs">{t('total')}</Text>
                            <Text variant="default" className="font-medium">
                              ${parseFloat(visit.estimated_total_cost).toFixed(2)}
                            </Text>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 border-t border-[color:var(--border)] pt-4">
                    <div>
                      <Text variant="muted" className="text-xs mb-1">{t('createdBy')}</Text>
                      <Text variant="default">{visit.created_by_name || '\u2014'}</Text>
                    </div>
                    <div>
                      <Text variant="muted" className="text-xs mb-1">{t('common:table.created')}</Text>
                      <Text variant="default">
                        {new Date(visit.created_at).toLocaleDateString()}
                      </Text>
                    </div>
                  </div>

                  {/* Notes */}
                  {visit.inspection_notes && (
                    <div className="border-t border-[color:var(--border)] pt-4">
                      <Text variant="muted" className="text-xs mb-2">{t('notes')}</Text>
                      <div
                        className="prose prose-sm dark:prose-invert max-w-none text-sm text-[color:var(--foreground)]"
                        dangerouslySetInnerHTML={{ __html: visit.inspection_notes }}
                      />
                    </div>
                  )}

                  {/* Attachments thumbnails */}
                  {attachments.length > 0 && (
                    <div className="border-t border-[color:var(--border)] pt-4">
                      <Text variant="muted" className="text-xs mb-2">
                        {t('attachments')} ({attachments.length})
                      </Text>
                      <div className="flex flex-wrap gap-2">
                        {attachments.map((att) => {
                          const isImage = att.file_type.startsWith('image/');
                          return (
                            <a
                              key={att.id}
                              href={att.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block w-16 h-16 rounded-md border border-[color:var(--border)] overflow-hidden hover:opacity-80 transition-opacity"
                              title={att.filename}
                            >
                              {isImage ? (
                                <img
                                  src={att.file_url}
                                  alt={att.filename}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-[color:var(--muted)] text-[color:var(--muted-foreground)]">
                                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                  </svg>
                                </div>
                              )}
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Text variant="muted">{t('noVisitInfo')}</Text>
              )}
            </div>

            {/* Right: Budget Section */}
            {budget ? (
              <div className="bg-[color:var(--card)] rounded-lg border border-[color:var(--border)] p-6">
                <div className="flex items-center justify-between mb-4">
                  <Heading variant="h3">{t('budget')}</Heading>
                  <div className="flex items-center gap-2">
                    {budget.budget_categories.length > 0 && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setShowPreview(true)}
                      >
                        <span className="flex items-center gap-1.5">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          {t('preview')}
                        </span>
                      </Button>
                    )}
                    {budget.status === 'draft' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate(`/budgets/${visitId}/create`)}
                      >
                        {t('editBudget')}
                      </Button>
                    )}
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <Text variant="muted" className="text-xs mb-1">Title</Text>
                    <Text variant="default" className="font-medium">{budget.title}</Text>
                  </div>
                  <div>
                    <Text variant="muted" className="text-xs mb-1">{t('total')}</Text>
                    <Text variant="default" className="font-semibold text-lg">
                      {formatCurrency(budget.total_amount)}
                    </Text>
                  </div>
                  <div>
                    <Text variant="muted" className="text-xs mb-1">Status</Text>
                    <span
                      className={cn(
                        'inline-block px-2 py-1 rounded-full text-xs font-medium',
                        budgetStatusColors[budget.status]
                      )}
                    >
                      {t(`status.${budget.status}`)}
                    </span>
                  </div>
                  <div>
                    <Text variant="muted" className="text-xs mb-1">Categories</Text>
                    <Text variant="default">{budget.budget_categories.length}</Text>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[color:var(--card)] rounded-lg border border-[color:var(--border)] p-6 flex flex-col items-center justify-center text-center min-h-[300px]">
                <svg className="w-16 h-16 mb-4 text-[color:var(--muted-foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <Heading variant="h3" className="mb-2">{t('noBudgetYet')}</Heading>
                <Text variant="muted" className="mb-6">
                  {t('noBudgetDescription')}
                </Text>
                <Button variant="primary" onClick={() => navigate(`/budgets/${visitId}/create`)}>
                  {t('createBudget')}
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ========== Budget Preview Modal ========== */}
      {showPreview && budget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowPreview(false)} />

          {/* Modal panel */}
          <div className="relative bg-[color:var(--card)] rounded-lg border border-[color:var(--border)] shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto mx-4">
            {/* Modal header */}
            <div className="sticky top-0 z-10 bg-[color:var(--card)] border-b border-[color:var(--border)] px-6 py-4 flex items-center justify-between">
              <div>
                <Heading variant="h2">{budget.title}</Heading>
                <Text variant="muted" size="sm">
                  {project?.name} &mdash; {visit?.title}
                </Text>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <Text variant="muted" className="text-xs">{t('grandTotal')}</Text>
                  <Text className="font-bold text-xl">{formatCurrency(budget.total_amount)}</Text>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPreview(false)}
                  className="text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] transition-colors"
                  aria-label="Close preview"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal body — categories */}
            <div className="p-6 space-y-6">
              {budget.budget_categories.length === 0 ? (
                <Text variant="muted" className="text-center py-8">{t('noCategories')}</Text>
              ) : (
                budget.budget_categories.map((category: BudgetCategoryDetail) => {
                  const catTotal = category.budget_items.reduce(
                    (sum, item) => sum + parseFloat(item.subtotal || '0'),
                    0,
                  );
                  return (
                    <div
                      key={category.id}
                      className="border border-[color:var(--border)] rounded-lg overflow-hidden"
                    >
                      {/* Category header */}
                      <div className="flex items-center justify-between px-6 py-3 bg-[color:var(--muted)]/30 border-b border-[color:var(--border)]">
                        <Heading variant="h4">{category.name}</Heading>
                        <Text className="font-semibold">{formatCurrency(catTotal)}</Text>
                      </div>

                      {/* Category images */}
                      {category.images && category.images.length > 0 && (
                        <div className="px-6 py-3 border-b border-[color:var(--border)] flex gap-3">
                          {category.images.map((url, idx) => (
                            <a
                              key={idx}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block w-20 h-20 rounded-md border border-[color:var(--border)] overflow-hidden hover:opacity-80 transition-opacity"
                            >
                              <img
                                src={url}
                                alt={`${category.name} ${idx + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </a>
                          ))}
                        </div>
                      )}

                      {/* Items table */}
                      {category.budget_items.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-[color:var(--muted)]/20 border-b border-[color:var(--border)]">
                                <th className="text-left px-4 py-2 font-medium text-[color:var(--muted-foreground)]">{t('item')}</th>
                                <th className="text-left px-4 py-2 font-medium text-[color:var(--muted-foreground)] w-24">{t('unit')}</th>
                                <th className="text-right px-4 py-2 font-medium text-[color:var(--muted-foreground)] w-20">{t('quantity')}</th>
                                <th className="text-right px-4 py-2 font-medium text-[color:var(--muted-foreground)] w-28">{t('unitPrice')}</th>
                                <th className="text-right px-4 py-2 font-medium text-[color:var(--muted-foreground)] w-28">{t('subtotal')}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {category.budget_items.map((item) => (
                                <tr key={item.id} className="border-b border-[color:var(--border)] last:border-b-0">
                                  <td className="px-4 py-2.5">
                                    <span>{item.description}</span>
                                    {item.catalog_item_name && (
                                      <span className="ml-2 text-xs text-[color:var(--muted-foreground)]">
                                        ({item.catalog_item_name})
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-4 py-2.5 text-[color:var(--muted-foreground)]">{item.unit || '\u2014'}</td>
                                  <td className="text-right px-4 py-2.5">{item.quantity}</td>
                                  <td className="text-right px-4 py-2.5">{formatCurrency(item.unit_price)}</td>
                                  <td className="text-right px-4 py-2.5 font-medium">{formatCurrency(item.subtotal)}</td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr className="bg-[color:var(--muted)]/10">
                                <td colSpan={4} className="text-right px-4 py-2 font-medium text-[color:var(--muted-foreground)]">{t('categoryTotal')}</td>
                                <td className="text-right px-4 py-2 font-semibold">{formatCurrency(catTotal)}</td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      ) : (
                        <div className="px-6 py-4">
                          <Text variant="muted" size="sm">{t('noItems')}</Text>
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {/* Grand total footer */}
              {budget.budget_categories.length > 0 && (
                <div className="flex items-center justify-between px-6 py-4 bg-[color:var(--muted)]/20 rounded-lg border border-[color:var(--border)]">
                  <Heading variant="h3">{t('grandTotal')}</Heading>
                  <Heading variant="h2">{formatCurrency(budget.total_amount)}</Heading>
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="sticky bottom-0 bg-[color:var(--card)] border-t border-[color:var(--border)] px-6 py-4 flex justify-end">
              <Button variant="secondary" onClick={() => setShowPreview(false)}>{t('common:actions.close')}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
