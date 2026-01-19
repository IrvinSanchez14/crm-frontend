/**
 * Visit Detail View Component
 * Shows visit details and allows editing, plus budget management
 */

import { useState, useEffect, useCallback } from 'react';
import { Button } from '../../../shared/components/atoms/Button';
import { Label } from '../../../shared/components/atoms/Label/Label';
import { Text } from '../../../shared/components/atoms/Text';
import { Heading } from '../../../shared/components/atoms/Heading';
import { cn } from '../../../core/utils/cn';
import { 
  updateVisit,
  changeVisitStatus,
  getBudgetByVisit,
  createBudget,
  acceptBudget,
  type VisitDetail,
  type VisitUpdate,
  type VisitStatus,
  type BudgetDetail,
  type BudgetCreate,
  type BudgetAcceptRequest
} from '../../../infrastructure/api/api.client';
import { decodeJwt } from '../../../core/utils/jwt.utils';
import { useAuth } from '../../../shared/hooks/useAuth';
import { BudgetView } from '../../budgets/components/BudgetView';

export interface VisitDetailViewProps {
  visit: VisitDetail;
  onSuccess?: () => void;
  onCancel: () => void;
}

export function VisitDetailView({ visit, onSuccess, onCancel }: VisitDetailViewProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [budget, setBudget] = useState<BudgetDetail | null>(null);
  const [loadingBudget, setLoadingBudget] = useState(true);
  const [formData, setFormData] = useState<VisitUpdate>({
    title: visit.title,
    description: visit.description || undefined,
    status: visit.status,
    visit_date: visit.visit_date || undefined,
    inspection_notes: visit.inspection_notes || undefined,
    estimated_materials_cost: visit.estimated_materials_cost || undefined,
    estimated_labor_cost: visit.estimated_labor_cost || undefined,
    estimated_total_cost: visit.estimated_total_cost || undefined,
  });

  // Get company_id from JWT token
  const getCompanyId = (): string | null => {
    if (!user?.access_token) return null;
    const payload = decodeJwt(user.access_token);
    return payload?.company_id || null;
  };

  // Fetch budget for this visit
  const fetchBudget = useCallback(async () => {
    const companyId = getCompanyId();
    if (!companyId) return;

    try {
      setLoadingBudget(true);
      const budgetData = await getBudgetByVisit(visit.id, companyId);
      setBudget(budgetData);
    } catch (err) {
      console.error('Failed to load budget:', err);
      setBudget(null);
    } finally {
      setLoadingBudget(false);
    }
  }, [visit.id]);

  useEffect(() => {
    fetchBudget();
  }, [fetchBudget]);

  const handleChange = (field: keyof VisitUpdate) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (error) setError(null);
  };

  const handleSave = async () => {
    const companyId = getCompanyId();
    if (!companyId) {
      setError('Company ID not found. Please log in again.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await updateVisit(visit.id, formData, companyId);
      setIsEditing(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update visit');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: VisitStatus) => {
    const companyId = getCompanyId();
    if (!companyId) {
      setError('Company ID not found. Please log in again.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await changeVisitStatus(visit.id, newStatus, companyId);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change status');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBudget = async () => {
    const companyId = getCompanyId();
    if (!companyId) {
      setError('Company ID not found. Please log in again.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const budgetData: BudgetCreate = {
        title: `Budget for ${visit.title}`,
        description: `Budget created from visit: ${visit.title}`,
        visit_id: visit.id,
        status: 'draft',
        budget_items: [],
      };
      const newBudget = await createBudget(budgetData, companyId);
      setBudget(newBudget);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create budget');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptBudget = async () => {
    if (!budget) return;
    
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
      await fetchBudget(); // Refresh budget
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept budget');
    } finally {
      setLoading(false);
    }
  };

  const statusColors: Record<VisitStatus, string> = {
    planning: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    in_review: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    inspection_required: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    visited: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Visit Details Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Heading variant="h3">Visit Details</Heading>
          {!isEditing && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              Edit
            </Button>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <input
                id="title"
                type="text"
                value={formData.title}
                onChange={handleChange('title')}
                disabled={loading}
                required
                className="w-full px-3 py-2 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--foreground)]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={formData.status}
                onChange={handleChange('status')}
                disabled={loading}
                className="w-full px-3 py-2 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--foreground)]"
              >
                <option value="planning">Planning</option>
                <option value="in_review">In Review</option>
                <option value="approved">Approved</option>
                <option value="inspection_required">Inspection Required</option>
                <option value="visited">Visited</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={formData.description || ''}
                onChange={handleChange('description')}
                disabled={loading}
                rows={3}
                className="w-full px-3 py-2 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--foreground)]"
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="primary"
                onClick={handleSave}
                disabled={loading}
                className="flex-1"
              >
                Save
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setIsEditing(false);
                  setFormData({
                    title: visit.title,
                    description: visit.description || undefined,
                    status: visit.status,
                    visit_date: visit.visit_date || undefined,
                    inspection_notes: visit.inspection_notes || undefined,
                    estimated_materials_cost: visit.estimated_materials_cost || undefined,
                    estimated_labor_cost: visit.estimated_labor_cost || undefined,
                    estimated_total_cost: visit.estimated_total_cost || undefined,
                  });
                }}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <Text variant="muted" className="text-xs">Title</Text>
              <Text variant="default" className="font-medium">{visit.title}</Text>
            </div>
            <div>
              <Text variant="muted" className="text-xs">Status</Text>
              <span
                className={cn(
                  'inline-block px-2 py-1 rounded-full text-xs font-medium mt-1',
                  statusColors[visit.status]
                )}
              >
                {visit.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            {visit.description && (
              <div>
                <Text variant="muted" className="text-xs">Description</Text>
                <Text variant="default">{visit.description}</Text>
              </div>
            )}
            {visit.visit_date && (
              <div>
                <Text variant="muted" className="text-xs">Visit Date</Text>
                <Text variant="default">
                  {new Date(visit.visit_date).toLocaleDateString()}
                </Text>
              </div>
            )}
            {visit.inspection_notes && (
              <div>
                <Text variant="muted" className="text-xs">Inspection Notes</Text>
                <Text variant="default">{visit.inspection_notes}</Text>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Budget Section */}
      <div className="border-t border-[color:var(--border)] pt-6">
        <div className="flex items-center justify-between mb-4">
          <Heading variant="h3">Budget</Heading>
          {!budget && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreateBudget}
              disabled={loading || loadingBudget}
            >
              Create Budget
            </Button>
          )}
        </div>

        {loadingBudget ? (
          <Text variant="muted">Loading budget...</Text>
        ) : budget ? (
          <BudgetView
            budget={budget}
            onBudgetUpdated={fetchBudget}
            onSuccess={onSuccess}
          />
        ) : (
          <div className="p-4 bg-[color:var(--muted)] rounded-lg">
            <Text variant="muted">No budget created yet. Create a budget to add line items.</Text>
          </div>
        )}
      </div>
    </div>
  );
}
