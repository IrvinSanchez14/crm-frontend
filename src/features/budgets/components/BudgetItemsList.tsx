/**
 * Budget Items List Component
 * Displays budget items grouped by section
 */

import { useState, useMemo } from 'react';
import { Button } from '../../../shared/components/atoms/Button';
import { Text } from '../../../shared/components/atoms/Text';
import { Heading } from '../../../shared/components/atoms/Heading';
import { 
  type BudgetDetail,
  deleteBudgetItem
} from '../../../infrastructure/api/api.client';
import { decodeJwt } from '../../../core/utils/jwt.utils';
import { useAuth } from '../../../shared/hooks/useAuth';
import { EditBudgetItemForm } from './EditBudgetItemForm';

export interface BudgetItemsListProps {
  budget: BudgetDetail;
  onItemUpdated?: () => void;
}

export function BudgetItemsList({ budget, onItemUpdated }: BudgetItemsListProps) {
  const { user } = useAuth();
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get company_id from JWT token
  const getCompanyId = (): string | null => {
    if (!user?.access_token) return null;
    const payload = decodeJwt(user.access_token);
    return payload?.company_id || null;
  };

  // Group items by section
  const groupedItems = useMemo(() => {
    const groups: Record<string, typeof budget.budget_items> = {};
    budget.budget_items.forEach((item) => {
      const section = item.section_name || 'Other';
      if (!groups[section]) {
        groups[section] = [];
      }
      groups[section].push(item);
    });
    return groups;
  }, [budget.budget_items]);

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    const companyId = getCompanyId();
    if (!companyId) {
      setError('Company ID not found.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await deleteBudgetItem(budget.id, itemId, companyId);
      if (onItemUpdated) {
        onItemUpdated();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete item');
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

  if (budget.budget_items.length === 0) {
    return (
      <div className="p-4 bg-[color:var(--muted)] rounded-lg text-center">
        <Text variant="muted">No items in this budget yet. Add items to get started.</Text>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg text-sm">
          {error}
        </div>
      )}

      {Object.entries(groupedItems).map(([section, items]) => (
        <div key={section} className="space-y-2">
          {section !== 'Other' && (
            <Heading variant="h5" className="text-[color:var(--muted-foreground)]">
              {section}
            </Heading>
          )}
          
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
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t border-[color:var(--border)] hover:bg-[color:var(--muted)]/50"
                  >
                    <td className="px-4 py-3">
                      {editingItemId === item.id ? (
                        <EditBudgetItemForm
                          budgetId={budget.id}
                          item={item}
                          onSuccess={() => {
                            setEditingItemId(null);
                            if (onItemUpdated) {
                              onItemUpdated();
                            }
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
                            onClick={() => handleDelete(item.id)}
                            disabled={loading}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
