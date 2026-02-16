/**
 * Category Profit Form Component
 * Form for setting profit margins on a budget category (internal use)
 */

import { useState, type FormEvent } from 'react';
import { Button } from '../../../shared/components/atoms/Button';
import { Label } from '../../../shared/components/atoms/Label/Label';
import { Text } from '../../../shared/components/atoms/Text';
import {
  upsertCategoryProfit,
  deleteCategoryProfit,
  type CategoryProfit,
  type CategoryProfitCreate,
} from '../../../infrastructure/api/api.client';
import { decodeJwt } from '../../../core/utils/jwt.utils';
import { useAuth } from '../../../shared/hooks/useAuth';

export interface CategoryProfitFormProps {
  budgetId: string;
  categoryId: string;
  existingProfit?: CategoryProfit | null;
  onSuccess?: () => void;
  onCancel: () => void;
}

export function CategoryProfitForm({
  budgetId,
  categoryId,
  existingProfit,
  onSuccess,
  onCancel,
}: CategoryProfitFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CategoryProfitCreate>({
    provider_price: existingProfit?.provider_price || '0',
    delivery_cost: existingProfit?.delivery_cost || '0',
    profit_percentage: existingProfit?.profit_percentage || '0',
  });

  const getCompanyId = (): string | null => {
    if (!user?.access_token) return null;
    const payload = decodeJwt(user.access_token);
    return payload?.company_id || null;
  };

  // Calculate preview total
  const providerPrice = parseFloat(formData.provider_price) || 0;
  const deliveryCost = parseFloat(formData.delivery_cost || '0') || 0;
  const profitPct = parseFloat(formData.profit_percentage) || 0;
  const calculatedTotal = (providerPrice + deliveryCost) * (1 + profitPct / 100);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const companyId = getCompanyId();
    if (!companyId) {
      setError('Company ID not found. Please log in again.');
      return;
    }

    if (providerPrice < 0 || deliveryCost < 0 || profitPct < 0) {
      setError('Values must be 0 or greater.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await upsertCategoryProfit(budgetId, categoryId, formData, companyId);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profit data');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Remove profit data for this category?')) return;
    const companyId = getCompanyId();
    if (!companyId) return;

    try {
      setLoading(true);
      setError(null);
      await deleteCategoryProfit(budgetId, categoryId, companyId);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete profit data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-3 border border-[color:var(--border)] rounded-lg bg-[color:var(--card)]">
      <Text variant="default" className="font-semibold text-sm">Category Profit</Text>

      {error && (
        <div className="p-2 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded text-xs">
          {error}
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Provider Price</Label>
          <div className="relative">
            <span className="absolute left-2 top-1.5 text-xs text-[color:var(--muted-foreground)]">$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.provider_price}
              onChange={(e) => setFormData((prev) => ({ ...prev, provider_price: e.target.value }))}
              disabled={loading}
              className="w-full pl-6 pr-2 py-1 text-sm border border-[color:var(--border)] rounded bg-[color:var(--background)] text-[color:var(--foreground)]"
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Delivery Cost</Label>
          <div className="relative">
            <span className="absolute left-2 top-1.5 text-xs text-[color:var(--muted-foreground)]">$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.delivery_cost || '0'}
              onChange={(e) => setFormData((prev) => ({ ...prev, delivery_cost: e.target.value }))}
              disabled={loading}
              className="w-full pl-6 pr-2 py-1 text-sm border border-[color:var(--border)] rounded bg-[color:var(--background)] text-[color:var(--foreground)]"
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Profit %</Label>
          <div className="relative">
            <input
              type="number"
              step="0.1"
              min="0"
              value={formData.profit_percentage}
              onChange={(e) => setFormData((prev) => ({ ...prev, profit_percentage: e.target.value }))}
              disabled={loading}
              className="w-full pl-2 pr-6 py-1 text-sm border border-[color:var(--border)] rounded bg-[color:var(--background)] text-[color:var(--foreground)]"
            />
            <span className="absolute right-2 top-1.5 text-xs text-[color:var(--muted-foreground)]">%</span>
          </div>
        </div>
      </div>

      <div className="p-2 bg-[color:var(--muted)] rounded flex items-center justify-between">
        <Text variant="muted" className="text-xs">
          Estimated Total: {formatCurrency(calculatedTotal)}
        </Text>
        <Text variant="muted" className="text-xs">
          Cost: {formatCurrency(providerPrice + deliveryCost)} + {profitPct}% margin
        </Text>
      </div>

      <div className="flex gap-2">
        <Button type="submit" variant="primary" size="sm" disabled={loading} className="flex-1">
          {loading ? 'Saving...' : 'Save Profit'}
        </Button>
        {existingProfit && (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={loading}
          >
            Remove
          </Button>
        )}
        <Button type="button" variant="secondary" size="sm" onClick={onCancel} disabled={loading} className="flex-1">
          Cancel
        </Button>
      </div>
    </form>
  );
}
