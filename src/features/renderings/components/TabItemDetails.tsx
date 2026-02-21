import { useState, useEffect, useCallback } from 'react';
import { Heading } from '../../../shared/components/atoms/Heading';
import { Text } from '../../../shared/components/atoms/Text';
import { Button } from '../../../shared/components/atoms/Button';
import { ItemDetailEditor } from './ItemDetailEditor';
import {
  getBudget,
  deleteRenderingItem,
  type RenderingItem,
  type BudgetDetail,
  type BudgetCategoryDetail,
  type BudgetItemDetail,
} from '../../../infrastructure/api/api.client';

interface TabItemDetailsProps {
  renderingId: string;
  companyId: string;
  budgetId: string | null;
  items: RenderingItem[];
  onRefresh: () => Promise<void>;
}

function formatCurrency(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(num);
}

export function TabItemDetails({ renderingId, companyId, budgetId, items, onRefresh }: TabItemDetailsProps) {
  const [budget, setBudget] = useState<BudgetDetail | null>(null);
  const [loadingBudget, setLoadingBudget] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [editingBudgetItemId, setEditingBudgetItemId] = useState<string | null>(null);

  const fetchBudget = useCallback(async () => {
    if (!budgetId) return;
    try {
      setLoadingBudget(true);
      setError(null);
      const data = await getBudget(budgetId, companyId);
      setBudget(data);
      if (data.budget_categories.length > 0 && !selectedCategoryId) {
        setSelectedCategoryId(data.budget_categories[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load budget');
    } finally {
      setLoadingBudget(false);
    }
  }, [budgetId, companyId, selectedCategoryId]);

  useEffect(() => {
    fetchBudget();
  }, [fetchBudget]);

  const getRenderingItemForBudgetItem = (budgetItemId: string): RenderingItem | null => {
    return items.find((item) => item.budget_item_id === budgetItemId) || null;
  };

  const selectedCategory: BudgetCategoryDetail | null =
    budget?.budget_categories.find((cat) => cat.id === selectedCategoryId) || null;

  const handleItemSaved = async () => {
    setEditingBudgetItemId(null);
    await onRefresh();
  };

  const handleDeleteRenderingItem = async (renderingItemId: string) => {
    if (!confirm('Remove rendering details for this item?')) return;
    try {
      await deleteRenderingItem(renderingId, renderingItemId, companyId);
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete item');
    }
  };

  if (!budgetId) {
    return (
      <div className="p-8 bg-[color:var(--muted)] rounded-lg text-center">
        <Text variant="muted">No budget linked to this rendering.</Text>
        <Text variant="muted" size="sm" className="mt-1">
          Link a budget in the rendering settings above to add item details.
        </Text>
      </div>
    );
  }

  if (loadingBudget) {
    return (
      <div className="p-8 text-center">
        <Text variant="muted">Loading budget data...</Text>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg">
        {error}
      </div>
    );
  }

  if (!budget || budget.budget_categories.length === 0) {
    return (
      <div className="p-8 bg-[color:var(--muted)] rounded-lg text-center">
        <Text variant="muted">The linked budget has no categories yet.</Text>
        <Text variant="muted" size="sm" className="mt-1">
          Add categories and items to the budget first.
        </Text>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Heading variant="h3">Item Details</Heading>
        <Text variant="muted" size="sm">
          {items.length} item{items.length !== 1 ? 's' : ''} with details
        </Text>
      </div>

      {/* Category Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-[color:var(--foreground)] mb-2">
          Select Budget Category
        </label>
        <select
          value={selectedCategoryId}
          onChange={(e) => {
            setSelectedCategoryId(e.target.value);
            setEditingBudgetItemId(null);
          }}
          className="w-full max-w-md px-3 py-2 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--foreground)]"
        >
          {budget.budget_categories.map((cat) => {
            const itemCount = cat.budget_items.length;
            const detailedCount = cat.budget_items.filter((bi) => getRenderingItemForBudgetItem(bi.id)).length;
            return (
              <option key={cat.id} value={cat.id}>
                {cat.name} ({detailedCount}/{itemCount} items detailed)
              </option>
            );
          })}
        </select>
      </div>

      {/* Budget Items List */}
      {selectedCategory && (
        <div className="space-y-2">
          {selectedCategory.budget_items.map((budgetItem: BudgetItemDetail) => {
            const renderingItem = getRenderingItemForBudgetItem(budgetItem.id);
            const hasDetails = !!renderingItem;
            const isEditing = editingBudgetItemId === budgetItem.id;

            return (
              <div key={budgetItem.id}>
                <div
                  className={`flex items-center gap-4 p-3 rounded-lg border transition-colors ${
                    hasDetails
                      ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950'
                      : 'border-[color:var(--border)] bg-[color:var(--card)]'
                  }`}
                >
                  {/* Status icon */}
                  <div className="flex-shrink-0">
                    {hasDetails ? (
                      <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-[color:var(--border)]" />
                    )}
                  </div>

                  {/* Item info */}
                  <div className="flex-1 min-w-0">
                    <Text variant="default" className="font-medium truncate">
                      {budgetItem.description}
                    </Text>
                    <Text variant="muted" size="sm">
                      {budgetItem.quantity} {budgetItem.unit || 'ea'} x {formatCurrency(budgetItem.unit_price)} = {formatCurrency(budgetItem.subtotal)}
                    </Text>
                  </div>

                  {/* Action buttons */}
                  <div className="flex-shrink-0 flex gap-2">
                    {hasDetails ? (
                      <>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setEditingBudgetItemId(isEditing ? null : budgetItem.id)}
                        >
                          {isEditing ? 'Close' : 'Edit Details'}
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleDeleteRenderingItem(renderingItem.id)}
                        >
                          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setEditingBudgetItemId(isEditing ? null : budgetItem.id)}
                      >
                        + Add Details
                      </Button>
                    )}
                  </div>
                </div>

                {/* Inline editor */}
                {isEditing && (
                  <ItemDetailEditor
                    renderingId={renderingId}
                    companyId={companyId}
                    budgetItem={budgetItem}
                    budgetCategoryName={selectedCategory.name}
                    existingRenderingItem={renderingItem}
                    onSave={handleItemSaved}
                    onCancel={() => setEditingBudgetItemId(null)}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
