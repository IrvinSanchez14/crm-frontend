/**
 * Edit Budget Item Form Component
 * Form for editing an existing budget item
 */

import { useState, type FormEvent } from 'react';
import { Button } from '../../../shared/components/atoms/Button';
import { Label } from '../../../shared/components/atoms/Label/Label';
import {
  updateBudgetItem,
  type BudgetItemDetail,
  type BudgetItemUpdate
} from '../../../infrastructure/api/api.client';
import { decodeJwt } from '../../../core/utils/jwt.utils';
import { useAuth } from '../../../shared/hooks/useAuth';
import { formatCurrencyDisplay } from '../../../core/utils/currency.utils';
import { calcSellingPrice, calcProfit, calcLineSubtotal } from '../../../core/utils/pricing.utils';

export interface EditBudgetItemFormProps {
  budgetId: string;
  categoryId: string;
  item: BudgetItemDetail;
  onSuccess?: () => void;
  onCancel: () => void;
}

function PricingSummary({ quantity, unitPrice }: { quantity?: string; unitPrice?: string }) {
  const price = parseFloat(unitPrice || '0');
  const qty = parseFloat(quantity || '0');
  const selling = calcSellingPrice(price);
  const profit = calcProfit(price);
  const subtotal = calcLineSubtotal(qty, price);

  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="space-y-1">
        <Label className="text-xs">Price + Profit</Label>
        <div className="px-2 py-1 text-sm border border-[color:var(--border)] rounded bg-[color:var(--muted)] text-[color:var(--foreground)] font-medium">
          {formatCurrencyDisplay(selling)}
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Profit</Label>
        <div className="px-2 py-1 text-sm border border-[color:var(--border)] rounded bg-[color:var(--muted)] text-[color:var(--foreground)] font-medium">
          {formatCurrencyDisplay(profit)}
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Subtotal</Label>
        <div className="px-2 py-1 text-sm border border-[color:var(--border)] rounded bg-[color:var(--muted)] text-[color:var(--foreground)] font-semibold">
          {formatCurrencyDisplay(subtotal)}
        </div>
      </div>
    </div>
  );
}

export function EditBudgetItemForm({ budgetId, categoryId, item, onSuccess, onCancel }: EditBudgetItemFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<BudgetItemUpdate>({
    description: item.description,
    unit: item.unit || undefined,
    quantity: item.quantity,
    unit_price: item.unit_price,
    catalog_item_id: item.catalog_item_id || undefined,
  });

  // Get company_id from JWT token
  const getCompanyId = (): string | null => {
    if (!user?.access_token) return null;
    const payload = decodeJwt(user.access_token);
    return payload?.company_id || null;
  };

  const handleChange = (field: keyof BudgetItemUpdate) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.description?.trim()) {
      setError('Description is required');
      return;
    }

    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }

    if (!formData.unit_price || parseFloat(formData.unit_price) < 0) {
      setError('Unit price must be 0 or greater');
      return;
    }

    const companyId = getCompanyId();
    if (!companyId) {
      setError('Company ID not found. Please log in again.');
      return;
    }

    try {
      setLoading(true);
      
      const quantity = parseFloat(formData.quantity);
      const unitPrice = parseFloat(formData.unit_price);
      const subtotal = calcLineSubtotal(quantity, unitPrice);

      const itemData: BudgetItemUpdate = {
        ...formData,
        subtotal: subtotal.toString(),
      };

      await updateBudgetItem(budgetId, categoryId, item.id, itemData, companyId);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="p-2 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded text-xs">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="edit_description" className="text-xs">Description *</Label>
        <textarea
          id="edit_description"
          value={formData.description}
          onChange={handleChange('description')}
          disabled={loading}
          required
          rows={2}
          className="w-full px-2 py-1 text-sm border border-[color:var(--border)] rounded bg-[color:var(--background)] text-[color:var(--foreground)]"
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-2">
          <Label htmlFor="edit_unit" className="text-xs">Unit</Label>
          <input
            id="edit_unit"
            type="text"
            value={formData.unit || ''}
            onChange={handleChange('unit')}
            disabled={loading}
            className="w-full px-2 py-1 text-sm border border-[color:var(--border)] rounded bg-[color:var(--background)] text-[color:var(--foreground)]"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit_quantity" className="text-xs">Qty *</Label>
          <input
            id="edit_quantity"
            type="number"
            step="0.01"
            min="0.01"
            value={formData.quantity}
            onChange={handleChange('quantity')}
            disabled={loading}
            required
            className="w-full px-2 py-1 text-sm border border-[color:var(--border)] rounded bg-[color:var(--background)] text-[color:var(--foreground)]"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit_unit_price" className="text-xs">Real Price *</Label>
          <input
            id="edit_unit_price"
            type="number"
            step="0.01"
            min="0"
            value={formData.unit_price}
            onChange={handleChange('unit_price')}
            disabled={loading}
            required
            className="w-full px-2 py-1 text-sm border border-[color:var(--border)] rounded bg-[color:var(--background)] text-[color:var(--foreground)]"
          />
        </div>
      </div>

      <PricingSummary quantity={formData.quantity} unitPrice={formData.unit_price} />

      <div className="flex gap-2">
        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={loading}
          className="flex-1"
        >
          {loading ? 'Saving...' : 'Save'}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onCancel}
          disabled={loading}
          className="flex-1"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
