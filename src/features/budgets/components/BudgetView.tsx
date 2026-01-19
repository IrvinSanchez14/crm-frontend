/**
 * Budget View Component
 * Shows budget details with items and allows management
 */

import { useState } from 'react';
import { Button } from '../../../shared/components/atoms/Button';
import { Text } from '../../../shared/components/atoms/Text';
import { Heading } from '../../../shared/components/atoms/Heading';
import { cn } from '../../../core/utils/cn';
import { 
  type BudgetDetail,
  type BudgetStatus,
  acceptBudget,
  updateBudget,
  type BudgetAcceptRequest
} from '../../../infrastructure/api/api.client';
import { decodeJwt } from '../../../core/utils/jwt.utils';
import { useAuth } from '../../../shared/hooks/useAuth';
import { BudgetItemsList } from './BudgetItemsList';
import { AddBudgetItemForm } from './AddBudgetItemForm';

export interface BudgetViewProps {
  budget: BudgetDetail;
  onBudgetUpdated?: () => void;
  onSuccess?: () => void;
}

export function BudgetView({ budget, onBudgetUpdated, onSuccess }: BudgetViewProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddItem, setShowAddItem] = useState(false);

  // Get company_id from JWT token
  const getCompanyId = (): string | null => {
    if (!user?.access_token) return null;
    const payload = decodeJwt(user.access_token);
    return payload?.company_id || null;
  };

  const handleAcceptBudget = async () => {
    const companyId = getCompanyId();
    if (!companyId || !user?.id) {
      setError('Company ID or User ID not found.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const acceptRequest: BudgetAcceptRequest = {
        accepted_by_user_id: user.id,
      };
      await acceptBudget(budget.id, acceptRequest, companyId);
      if (onBudgetUpdated) {
        onBudgetUpdated();
      }
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept budget');
    } finally {
      setLoading(false);
    }
  };

  const statusColors: Record<BudgetStatus, string> = {
    draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    pending_approval: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    accepted: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    revised: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
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

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Budget Header */}
      <div className="flex items-center justify-between">
        <div>
          <Heading variant="h4">{budget.title}</Heading>
          {budget.description && (
            <Text variant="muted" className="mt-1">{budget.description}</Text>
          )}
        </div>
        <span
          className={cn(
            'px-3 py-1 rounded-full text-xs font-medium',
            statusColors[budget.status]
          )}
        >
          {budget.status.replace('_', ' ').toUpperCase()}
        </span>
      </div>

      {/* Budget Total */}
      <div className="p-4 bg-[color:var(--muted)] rounded-lg">
        <div className="flex items-center justify-between">
          <Text variant="default" className="font-semibold">Total Amount</Text>
          <Text variant="default" className="text-2xl font-bold">
            {formatCurrency(budget.total_amount)}
          </Text>
        </div>
      </div>

      {/* Budget Items */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <Heading variant="h4">Items</Heading>
          {budget.status === 'draft' && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowAddItem(!showAddItem)}
            >
              {showAddItem ? 'Cancel' : 'Add Item'}
            </Button>
          )}
        </div>

        {showAddItem && (
          <div className="mb-4">
            <AddBudgetItemForm
              budgetId={budget.id}
              onSuccess={() => {
                setShowAddItem(false);
                if (onBudgetUpdated) {
                  onBudgetUpdated();
                }
              }}
              onCancel={() => setShowAddItem(false)}
            />
          </div>
        )}

        <BudgetItemsList
          budget={budget}
          onItemUpdated={onBudgetUpdated}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-[color:var(--border)]">
        {budget.status === 'draft' && (
          <Button
            variant="secondary"
            onClick={async () => {
              // Update budget status to pending_approval
              const companyId = getCompanyId();
              if (!companyId) {
                setError('Company ID not found.');
                return;
              }
              try {
                setLoading(true);
                setError(null);
                await updateBudget(budget.id, { status: 'pending_approval' }, companyId);
                if (onBudgetUpdated) {
                  onBudgetUpdated();
                }
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to submit budget');
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            className="flex-1"
          >
            Submit for Approval
          </Button>
        )}
        {budget.status === 'pending_approval' && (
          <Button
            variant="primary"
            onClick={handleAcceptBudget}
            disabled={loading}
            className="flex-1"
          >
            {loading ? 'Accepting...' : 'Accept Budget'}
          </Button>
        )}
      </div>

      {budget.status === 'accepted' && budget.accepted_at && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <Text variant="muted" className="text-sm">
            Budget accepted on {new Date(budget.accepted_at).toLocaleDateString()}
            {budget.accepted_by_name && ` by ${budget.accepted_by_name}`}
          </Text>
        </div>
      )}
    </div>
  );
}
