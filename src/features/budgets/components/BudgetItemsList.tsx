/**
 * Budget Items List Component
 * Displays budget items organized by categories with profit tracking
 */

import { useState } from 'react';
import { Button } from '../../../shared/components/atoms/Button';
import { Text } from '../../../shared/components/atoms/Text';
import { Heading } from '../../../shared/components/atoms/Heading';
import {
  type BudgetDetail,
  type BudgetCategoryDetail,
  deleteBudgetItem,
  deleteBudgetCategory
} from '../../../infrastructure/api/api.client';
import { decodeJwt } from '../../../core/utils/jwt.utils';
import { useAuth } from '../../../shared/hooks/useAuth';
import { EditBudgetItemForm } from './EditBudgetItemForm';
import { AddBudgetItemForm } from './AddBudgetItemForm';
import { CategoryProfitForm } from './CategoryProfitForm';

export interface BudgetItemsListProps {
  budget: BudgetDetail;
  onItemUpdated?: () => void;
}

export function BudgetItemsList({ budget, onItemUpdated }: BudgetItemsListProps) {
  const { user } = useAuth();
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [addingItemForCategory, setAddingItemForCategory] = useState<string | null>(null);
  const [editingProfitForCategory, setEditingProfitForCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get company_id from JWT token
  const getCompanyId = (): string | null => {
    if (!user?.access_token) return null;
    const payload = decodeJwt(user.access_token);
    return payload?.company_id || null;
  };

  const handleDeleteItem = async (categoryId: string, itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    const companyId = getCompanyId();
    if (!companyId) {
      setError('Company ID not found.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await deleteBudgetItem(budget.id, categoryId, itemId, companyId);
      if (onItemUpdated) onItemUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete item');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Delete this category and all its items?')) return;

    const companyId = getCompanyId();
    if (!companyId) {
      setError('Company ID not found.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await deleteBudgetCategory(budget.id, categoryId, companyId);
      if (onItemUpdated) onItemUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete category');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount);
    if (isNaN(num)) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(num);
  };

  if (budget.budget_categories.length === 0) {
    return (
      <div className="p-4 bg-[color:var(--muted)] rounded-lg text-center">
        <Text variant="muted">No categories in this budget yet. Add a category to get started.</Text>
      </div>
    );
  }

  const renderCategoryItems = (category: BudgetCategoryDetail) => {
    if (category.budget_items.length === 0 && addingItemForCategory !== category.id) {
      return (
        <div className="p-3 bg-[color:var(--muted)] rounded text-center">
          <Text variant="muted" className="text-sm">No items in this category.</Text>
        </div>
      );
    }

    return (
      <>
        {category.budget_items.length > 0 && (
          <div className="border border-[color:var(--border)] rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-[color:var(--muted)]">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-[color:var(--muted-foreground)]">
                    Description
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-[color:var(--muted-foreground)]">
                    Unit
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-[color:var(--muted-foreground)]">
                    Quantity
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-[color:var(--muted-foreground)]">
                    Unit Price
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-[color:var(--muted-foreground)]">
                    Subtotal
                  </th>
                  {budget.status === 'draft' && (
                    <th className="px-4 py-2 text-right text-xs font-medium text-[color:var(--muted-foreground)]">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {category.budget_items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t border-[color:var(--border)] hover:bg-[color:var(--muted)]/50"
                  >
                    <td className="px-4 py-3">
                      {editingItemId === item.id ? (
                        <EditBudgetItemForm
                          budgetId={budget.id}
                          categoryId={category.id}
                          item={item}
                          onSuccess={() => {
                            setEditingItemId(null);
                            if (onItemUpdated) onItemUpdated();
                          }}
                          onCancel={() => setEditingItemId(null)}
                        />
                      ) : (
                        <div>
                          <Text variant="default" className="font-medium">
                            {item.description}
                          </Text>
                          {item.catalog_item_name && (
                            <Text variant="muted" className="text-xs">
                              From catalog: {item.catalog_item_name}
                            </Text>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Text variant="muted">{item.unit || '-'}</Text>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Text variant="default">{item.quantity}</Text>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Text variant="default">{formatCurrency(item.unit_price)}</Text>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Text variant="default" className="font-semibold">
                        {formatCurrency(item.subtotal)}
                      </Text>
                    </td>
                    {budget.status === 'draft' && editingItemId !== item.id && (
                      <td className="px-4 py-3 text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setEditingItemId(item.id)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteItem(category.id, item.id)}
                            disabled={loading}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {/* Category Total Row */}
                <tr className="border-t-2 border-[color:var(--border)] bg-[color:var(--muted)]">
                  <td colSpan={4} className="px-4 py-3">
                    <Text variant="default" className="font-bold">
                      {category.name} Total
                    </Text>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Text variant="default" className="font-bold text-lg">
                      {formatCurrency(category.subtotal)}
                    </Text>
                  </td>
                  {budget.status === 'draft' && (
                    <td className="px-4 py-3"></td>
                  )}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </>
    );
  };

  const renderProfitSection = (category: BudgetCategoryDetail) => {
    if (editingProfitForCategory === category.id) {
      return (
        <CategoryProfitForm
          budgetId={budget.id}
          categoryId={category.id}
          existingProfit={category.category_profit}
          onSuccess={() => {
            setEditingProfitForCategory(null);
            if (onItemUpdated) onItemUpdated();
          }}
          onCancel={() => setEditingProfitForCategory(null)}
        />
      );
    }

    if (category.category_profit) {
      const profit = category.category_profit;
      return (
        <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex gap-4 text-sm">
            <span>
              <Text variant="muted" className="text-xs">Provider:</Text>{' '}
              <Text variant="default" className="font-medium">{formatCurrency(profit.provider_price)}</Text>
            </span>
            <span>
              <Text variant="muted" className="text-xs">Delivery:</Text>{' '}
              <Text variant="default" className="font-medium">{formatCurrency(profit.delivery_cost)}</Text>
            </span>
            <span>
              <Text variant="muted" className="text-xs">Profit:</Text>{' '}
              <Text variant="default" className="font-medium">{profit.profit_percentage}%</Text>
            </span>
            <span>
              <Text variant="muted" className="text-xs">Total:</Text>{' '}
              <Text variant="default" className="font-bold">{formatCurrency(profit.total_price)}</Text>
            </span>
          </div>
          {budget.status === 'draft' && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setEditingProfitForCategory(category.id)}
            >
              Edit Profit
            </Button>
          )}
        </div>
      );
    }

    if (budget.status === 'draft') {
      return (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setEditingProfitForCategory(category.id)}
        >
          Set Profit
        </Button>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg text-sm">
          {error}
        </div>
      )}

      {budget.budget_categories.map((category) => (
        <div key={category.id} className="space-y-3">
          <div className="flex items-center justify-between">
            <Heading variant="h5" className="text-[color:var(--muted-foreground)]">
              {category.name}
            </Heading>
            {budget.status === 'draft' && (
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setAddingItemForCategory(
                    addingItemForCategory === category.id ? null : category.id
                  )}
                >
                  {addingItemForCategory === category.id ? 'Cancel' : 'Add Item'}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteCategory(category.id)}
                  disabled={loading}
                >
                  Delete Category
                </Button>
              </div>
            )}
          </div>

          {addingItemForCategory === category.id && (
            <AddBudgetItemForm
              budgetId={budget.id}
              categoryId={category.id}
              onSuccess={() => {
                setAddingItemForCategory(null);
                if (onItemUpdated) onItemUpdated();
              }}
              onCancel={() => setAddingItemForCategory(null)}
            />
          )}

          {renderCategoryItems(category)}

          {renderProfitSection(category)}
        </div>
      ))}
    </div>
  );
}
