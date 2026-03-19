/**
 * Create/Edit Change Order Page
 * Form to create a change order linked to a project, with observations and items.
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
  getProjects,
  getChangeOrder,
  createChangeOrder,
  updateChangeOrder,
  addChangeOrderItem,
  deleteChangeOrderItem,
  type ProjectDetail,
  type ChangeOrderDetail,
} from '../../../infrastructure/api/api.client';
import { decodeJwt } from '../../../core/utils/jwt.utils';
import { formatCurrencyDisplay } from '../../../core/utils/currency.utils';
import { calcSellingPrice, calcProfit, calcLineSubtotal } from '../../../core/utils/pricing.utils';
import { useTranslation } from 'react-i18next';

export function CreateChangeOrderPage() {
  const { id: changeOrderId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t } = useTranslation('changeOrders');
  const isEditMode = !!changeOrderId;

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [projects, setProjects] = useState<ProjectDetail[]>([]);
  const [changeOrder, setChangeOrder] = useState<ChangeOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [observations, setObservations] = useState<string[]>([]);
  const [newObservation, setNewObservation] = useState('');

  // New item form
  const [itemCode, setItemCode] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemUnit, setItemUnit] = useState('');
  const [itemQty, setItemQty] = useState('');
  const [itemPrice, setItemPrice] = useState('');

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
    const companyId = getCompanyId();
    if (!companyId) {
      setError(t('common:messages.sessionExpired'));
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch projects for the dropdown
      const projectsData = await getProjects({ company_id: companyId, skip: 0, limit: 500, include_details: true });
      setProjects(projectsData);

      // If editing, load existing change order
      if (isEditMode && changeOrderId) {
        const coData = await getChangeOrder(changeOrderId, companyId);
        setChangeOrder(coData);
        setTitle(coData.title);
        setDescription(coData.description || '');
        setSelectedProjectId(coData.project_id);
        setObservations(coData.observations || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common:messages.errorLoading'));
    } finally {
      setLoading(false);
    }
  }, [getCompanyId, isEditMode, changeOrderId, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddObservation = () => {
    if (newObservation.trim()) {
      setObservations([...observations, newObservation.trim()]);
      setNewObservation('');
    }
  };

  const handleRemoveObservation = (idx: number) => {
    setObservations(observations.filter((_, i) => i !== idx));
  };

  const handleCreateOrUpdate = async () => {
    if (!title.trim()) {
      setError(t('titleRequired'));
      return;
    }
    if (!isEditMode && !selectedProjectId) {
      setError(t('budgetRequired'));
      return;
    }

    const companyId = getCompanyId();
    const userId = getUserId();
    if (!companyId) return;

    try {
      setSaving(true);
      setError(null);

      if (isEditMode && changeOrderId) {
        const updated = await updateChangeOrder(changeOrderId, {
          title,
          description: description || undefined,
          observations: observations.length > 0 ? observations : undefined,
        }, companyId);
        setChangeOrder(updated);
      } else {
        const created = await createChangeOrder({
          title,
          description: description || undefined,
          observations: observations.length > 0 ? observations : undefined,
          project_id: selectedProjectId,
        }, companyId, userId || undefined);
        // Navigate to edit mode so user can add items
        navigate(`/change-orders/${created.id}/edit`, { replace: true });
        setChangeOrder(created);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common:messages.errorLoading'));
    } finally {
      setSaving(false);
    }
  };

  const handleAddItem = async () => {
    if (!changeOrder) return;
    if (!itemDesc.trim()) { setError(t('itemDescriptionRequired')); return; }
    if (!itemQty || parseFloat(itemQty) <= 0) { setError(t('quantityRequired')); return; }
    if (!itemPrice) { setError(t('unitPriceRequired')); return; }

    const companyId = getCompanyId();
    if (!companyId) return;

    try {
      setSaving(true);
      setError(null);
      await addChangeOrderItem(changeOrder.id, {
        item_code: itemCode || undefined,
        description: itemDesc,
        unit: itemUnit || undefined,
        quantity: itemQty,
        unit_price: itemPrice,
        order_index: changeOrder.change_order_items.length,
      }, companyId);

      // Refresh
      const updated = await getChangeOrder(changeOrder.id, companyId);
      setChangeOrder(updated);

      // Reset form
      setItemCode('');
      setItemDesc('');
      setItemUnit('');
      setItemQty('');
      setItemPrice('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!changeOrder) return;
    const companyId = getCompanyId();
    if (!companyId) return;

    try {
      await deleteChangeOrderItem(changeOrder.id, itemId, companyId);
      const updated = await getChangeOrder(changeOrder.id, companyId);
      setChangeOrder(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete item');
    }
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return '$0.00';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(num);
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
        <div className="p-6 max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button variant="secondary" size="sm" onClick={() => navigate('/change-orders')} aria-label="Back">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Button>
            <Heading variant="h1">
              {isEditMode ? t('editChangeOrder') : t('createChangeOrder')}
            </Heading>
          </div>

          {error && (
            <div className="p-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Form */}
          <div className="bg-[color:var(--card)] rounded-lg border border-[color:var(--border)] p-6 mb-6">
            <div className="space-y-4">
              {/* Project select (only on create) */}
              {!isEditMode && (
                <div>
                  <label className="block text-sm font-medium text-[color:var(--foreground)] mb-1">
                    {t('projectInfo')} *
                  </label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full rounded-md border border-[color:var(--border)] bg-[color:var(--background)] px-3 py-2 text-sm"
                  >
                    <option value="">{t('common:actions.select', 'Select a project')}</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {p.address || ''} ({p.client?.name || ''})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-[color:var(--foreground)] mb-1">
                  {t('changeOrder')} *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Extra deck work"
                  className="w-full rounded-md border border-[color:var(--border)] bg-[color:var(--background)] px-3 py-2 text-sm"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-[color:var(--foreground)] mb-1">
                  {t('description')}
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full rounded-md border border-[color:var(--border)] bg-[color:var(--background)] px-3 py-2 text-sm"
                />
              </div>

              {/* Observations */}
              <div>
                <label className="block text-sm font-medium text-[color:var(--foreground)] mb-1">
                  {t('observations')}
                </label>
                {observations.map((obs, idx) => (
                  <div key={idx} className="flex items-start gap-3 mb-2 pl-2">
                    <span className="text-[color:var(--foreground)] mt-0.5 text-sm shrink-0">&#10148;</span>
                    <Text variant="default" size="sm" className="flex-1">{obs}</Text>
                    <button
                      type="button"
                      onClick={() => handleRemoveObservation(idx)}
                      className="text-red-500 hover:text-red-700 text-xs"
                    >
                      &times;
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newObservation}
                    onChange={(e) => setNewObservation(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddObservation())}
                    placeholder={t('observationPlaceholder')}
                    className="flex-1 rounded-md border border-[color:var(--border)] bg-[color:var(--background)] px-3 py-2 text-sm"
                  />
                  <Button variant="secondary" size="sm" onClick={handleAddObservation}>
                    {t('addObservation')}
                  </Button>
                </div>
              </div>

              {/* Save button */}
              <div className="flex justify-end">
                <Button variant="primary" onClick={handleCreateOrUpdate} disabled={saving}>
                  {saving ? t('saving') : t('common:actions.save')}
                </Button>
              </div>
            </div>
          </div>

          {/* Items section (only after change order is created) */}
          {changeOrder && (
            <div className="bg-[color:var(--card)] rounded-lg border border-[color:var(--border)] overflow-hidden">
              <div className="px-6 py-4 border-b border-[color:var(--border)] flex items-center justify-between">
                <Heading variant="h3">{t('title')} — {t('total')}: {formatCurrency(changeOrder.total_amount)}</Heading>
              </div>

              {/* Items table */}
              {changeOrder.change_order_items.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[color:var(--muted)]/20 border-b border-[color:var(--border)]">
                        <th className="text-left px-3 py-2 font-medium text-[color:var(--muted-foreground)] w-10">#</th>
                        <th className="text-left px-3 py-2 font-medium text-[color:var(--muted-foreground)] w-16">{t('itemCode')}</th>
                        <th className="text-left px-3 py-2 font-medium text-[color:var(--muted-foreground)]">{t('description')}</th>
                        <th className="text-left px-3 py-2 font-medium text-[color:var(--muted-foreground)] w-16">{t('unit')}</th>
                        <th className="text-right px-3 py-2 font-medium text-[color:var(--muted-foreground)] w-16">{t('quantity')}</th>
                        <th className="text-right px-3 py-2 font-medium text-[color:var(--muted-foreground)] w-24">{t('budgets:realPrice')}</th>
                        <th className="text-right px-3 py-2 font-medium text-[color:var(--muted-foreground)] w-28">{t('budgets:realPriceWithGanancia')}</th>
                        <th className="text-right px-3 py-2 font-medium text-[color:var(--muted-foreground)] w-24">{t('budgets:gananciaBruta')}</th>
                        <th className="text-right px-3 py-2 font-medium text-[color:var(--muted-foreground)] w-28">{t('subtotal')}</th>
                        <th className="w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {changeOrder.change_order_items.map((item, idx) => {
                        const realPrice = parseFloat(item.unit_price) || 0;
                        const qty = parseFloat(item.quantity) || 0;
                        return (
                          <tr key={item.id} className="border-b border-[color:var(--border)]">
                            <td className="px-3 py-2.5 text-[color:var(--muted-foreground)]">{idx + 1}</td>
                            <td className="px-3 py-2.5">{item.item_code || '—'}</td>
                            <td className="px-3 py-2.5">{item.description}</td>
                            <td className="px-3 py-2.5 text-[color:var(--muted-foreground)]">{item.unit || '—'}</td>
                            <td className="text-right px-3 py-2.5">{item.quantity}</td>
                            <td className="text-right px-3 py-2.5">{formatCurrencyDisplay(realPrice)}</td>
                            <td className="text-right px-3 py-2.5">{formatCurrencyDisplay(calcSellingPrice(realPrice))}</td>
                            <td className="text-right px-3 py-2.5">{formatCurrencyDisplay(calcProfit(realPrice))}</td>
                            <td className="text-right px-3 py-2.5 font-medium">{formatCurrencyDisplay(calcLineSubtotal(qty, realPrice))}</td>
                            <td className="px-2 py-2.5">
                              <button
                                type="button"
                                onClick={() => handleDeleteItem(item.id)}
                                className="text-red-500 hover:text-red-700"
                                title={t('deleteItem')}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Add item form */}
              <div className="px-6 py-4 border-t border-[color:var(--border)] bg-[color:var(--muted)]/10">
                <Text variant="muted" size="sm" className="mb-3 font-medium">{t('addItem')}</Text>
                <div className="grid grid-cols-12 gap-2">
                  <input
                    type="text"
                    value={itemCode}
                    onChange={(e) => setItemCode(e.target.value)}
                    placeholder={t('itemCode')}
                    className="col-span-1 rounded-md border border-[color:var(--border)] bg-[color:var(--background)] px-2 py-1.5 text-sm"
                  />
                  <input
                    type="text"
                    value={itemDesc}
                    onChange={(e) => setItemDesc(e.target.value)}
                    placeholder={t('description')}
                    className="col-span-4 rounded-md border border-[color:var(--border)] bg-[color:var(--background)] px-2 py-1.5 text-sm"
                  />
                  <input
                    type="text"
                    value={itemUnit}
                    onChange={(e) => setItemUnit(e.target.value)}
                    placeholder={t('unit')}
                    className="col-span-1 rounded-md border border-[color:var(--border)] bg-[color:var(--background)] px-2 py-1.5 text-sm"
                  />
                  <input
                    type="number"
                    value={itemQty}
                    onChange={(e) => setItemQty(e.target.value)}
                    placeholder={t('quantity')}
                    step="0.01"
                    min="0"
                    className="col-span-2 rounded-md border border-[color:var(--border)] bg-[color:var(--background)] px-2 py-1.5 text-sm"
                  />
                  <input
                    type="number"
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value)}
                    placeholder={t('unitPrice')}
                    step="0.01"
                    min="0"
                    className="col-span-2 rounded-md border border-[color:var(--border)] bg-[color:var(--background)] px-2 py-1.5 text-sm"
                  />
                  <Button variant="primary" size="sm" className="col-span-2" onClick={handleAddItem} disabled={saving}>
                    {t('addItem')}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
