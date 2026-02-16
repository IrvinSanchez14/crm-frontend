/**
 * Add Budget Item Form Component
 * Form for adding a new item to a budget
 */

import { useState, type FormEvent, useEffect } from 'react';
import { Button } from '../../../shared/components/atoms/Button';
import { Label } from '../../../shared/components/atoms/Label/Label';
import { Text } from '../../../shared/components/atoms/Text';
import { 
  addBudgetItem,
  getCatalogItems,
  type BudgetItemCreate,
  type CatalogItem
} from '../../../infrastructure/api/api.client';
import { decodeJwt } from '../../../core/utils/jwt.utils';
import { useAuth } from '../../../shared/hooks/useAuth';

export interface AddBudgetItemFormProps {
  budgetId: string;
  categoryId: string;
  onSuccess?: () => void;
  onCancel: () => void;
}

export function AddBudgetItemForm({ budgetId, categoryId, onSuccess, onCancel }: AddBudgetItemFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [useCatalogItem, setUseCatalogItem] = useState(false);
  const [formData, setFormData] = useState<BudgetItemCreate>({
    description: '',
    unit: '',
    quantity: '1',
    unit_price: '0',
    catalog_item_id: undefined,
  });

  // Get company_id from JWT token
  const getCompanyId = (): string | null => {
    if (!user?.access_token) return null;
    const payload = decodeJwt(user.access_token);
    return payload?.company_id || null;
  };

  // Load catalog items
  useEffect(() => {
    const loadCatalog = async () => {
      const companyId = getCompanyId();
      if (!companyId) return;

      try {
        setLoadingCatalog(true);
        const items = await getCatalogItems({
          company_id: companyId,
          active_only: true,
          limit: 1000,
        });
        setCatalogItems(items);
      } catch (err) {
        console.error('Failed to load catalog items:', err);
      } finally {
        setLoadingCatalog(false);
      }
    };

    loadCatalog();
  }, []);

  const handleChange = (field: keyof BudgetItemCreate) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (error) setError(null);
  };

  const handleCatalogItemSelect = (catalogItemId: string) => {
    const catalogItem = catalogItems.find((item) => item.id === catalogItemId);
    if (catalogItem) {
      setFormData((prev) => ({
        ...prev,
        catalog_item_id: catalogItem.id,
        description: catalogItem.name,
        unit: catalogItem.unity,
        unit_price: catalogItem.price_base.toString(),
      }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.description.trim()) {
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
      
      // Calculate subtotal
      const quantity = parseFloat(formData.quantity);
      const unitPrice = parseFloat(formData.unit_price);
      const subtotal = quantity * unitPrice;

      const itemData: BudgetItemCreate = {
        ...formData,
        unit: formData.unit || undefined,
        subtotal: subtotal.toString(),
        catalog_item_id: formData.catalog_item_id || undefined,
      };

      await addBudgetItem(budgetId, categoryId, itemData, companyId);
      
      // Reset form
      setFormData({
        description: '',
        unit: '',
        quantity: '1',
        unit_price: '0',
        catalog_item_id: undefined,
      });
      setUseCatalogItem(false);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border border-[color:var(--border)] rounded-lg bg-[color:var(--card)]">
      {error && (
        <div className="p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label>
          <input
            type="checkbox"
            checked={useCatalogItem}
            onChange={(e) => setUseCatalogItem(e.target.checked)}
            className="mr-2"
          />
          Use catalog item
        </Label>
      </div>

      {useCatalogItem && (
        <div className="space-y-2">
          <Label htmlFor="catalog_item">Catalog Item</Label>
          <select
            id="catalog_item"
            value={formData.catalog_item_id || ''}
            onChange={(e) => handleCatalogItemSelect(e.target.value)}
            disabled={loading || loadingCatalog}
            className="w-full px-3 py-2 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--foreground)]"
          >
            <option value="">Select a catalog item...</option>
            {catalogItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} - {item.unity} - ${item.price_base}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <textarea
          id="description"
          value={formData.description}
          onChange={handleChange('description')}
          disabled={loading}
          required
          rows={2}
          placeholder="Item description"
          className="w-full px-3 py-2 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--foreground)]"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="unit">Unit</Label>
          <input
            id="unit"
            type="text"
            value={formData.unit}
            onChange={handleChange('unit')}
            disabled={loading}
            placeholder="each, sq ft, ft, etc."
            className="w-full px-3 py-2 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--foreground)]"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity *</Label>
          <input
            id="quantity"
            type="number"
            step="0.01"
            min="0.01"
            value={formData.quantity}
            onChange={handleChange('quantity')}
            disabled={loading}
            required
            className="w-full px-3 py-2 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--foreground)]"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="unit_price">Unit Price *</Label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-[color:var(--foreground)]">$</span>
            <input
              id="unit_price"
              type="number"
              step="0.01"
              min="0"
              value={formData.unit_price}
              onChange={handleChange('unit_price')}
              disabled={loading}
              required
              className="w-full pl-8 pr-3 py-2 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--foreground)]"
            />
          </div>
        </div>
      </div>

      {formData.quantity && formData.unit_price && (
        <div className="p-2 bg-[color:var(--muted)] rounded">
          <Text variant="muted" className="text-sm">
            Subtotal: ${(parseFloat(formData.quantity) * parseFloat(formData.unit_price)).toFixed(2)}
          </Text>
        </div>
      )}

      <div className="flex gap-3">
        <Button
          type="submit"
          variant="primary"
          disabled={loading}
          className="flex-1"
        >
          {loading ? 'Adding...' : 'Add Item'}
        </Button>
        <Button
          type="button"
          variant="secondary"
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
