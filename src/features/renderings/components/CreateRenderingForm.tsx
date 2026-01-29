/**
 * Create Rendering Form Component
 * Form for creating a new rendering proposal
 */

import { useState, useEffect, type FormEvent, useMemo } from 'react';
import { FormField } from '../../../shared/components/molecules/FormField';
import { Combobox, type ComboboxOption } from '../../../shared/components/molecules/Combobox';
import { Button } from '../../../shared/components/atoms/Button';
import { Label } from '../../../shared/components/atoms/Label/Label';
import {
  createRendering,
  type RenderingCreate,
  type VisitDetail,
  type BudgetDetail
} from '../../../infrastructure/api/api.client';
import { decodeJwt } from '../../../core/utils/jwt.utils';
import { useAuth } from '../../../shared/hooks/useAuth';

export const CREATE_RENDERING_FORM_ID = 'create-rendering-form';

export interface CreateRenderingFormProps {
  visits: VisitDetail[];
  budgets: BudgetDetail[];
  onSuccess?: () => void;
  onCancel: () => void;
  onLoadingChange?: (loading: boolean) => void;
}

// Footer component to be used with RightSidebar footer prop
export function CreateRenderingFormFooter({
  loading,
  onCancel
}: {
  loading: boolean;
  onCancel: () => void;
}) {
  return (
    <div className="flex gap-3">
      <Button
        type="submit"
        form={CREATE_RENDERING_FORM_ID}
        variant="primary"
        disabled={loading}
        className="flex-1"
      >
        {loading ? 'Creating...' : 'Create Rendering'}
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
  );
}

export function CreateRenderingForm({
  visits,
  budgets,
  onSuccess,
  onCancel,
  onLoadingChange
}: CreateRenderingFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    visit_id: '',
    budget_id: '',
    expiration_date: '',
    notes: '',
  });

  // Notify parent of loading state changes
  useEffect(() => {
    onLoadingChange?.(loading);
  }, [loading, onLoadingChange]);

  // Convert visits to combobox options
  const visitOptions: ComboboxOption[] = useMemo(
    () =>
      visits.map((visit) => ({
        id: visit.id,
        label: visit.title,
        value: visit.id,
      })),
    [visits]
  );

  // Filter budgets based on selected visit
  const filteredBudgets = useMemo(
    () =>
      formData.visit_id
        ? budgets.filter((b) => b.visit_id === formData.visit_id)
        : budgets,
    [budgets, formData.visit_id]
  );

  // Convert budgets to combobox options
  const budgetOptions: ComboboxOption[] = useMemo(
    () =>
      filteredBudgets.map((budget) => ({
        id: budget.id,
        label: budget.title,
        value: budget.id,
      })),
    [filteredBudgets]
  );

  // Get company_id from JWT token
  const getCompanyId = (): string | null => {
    if (!user?.access_token) return null;
    const payload = decodeJwt(user.access_token);
    return payload?.company_id || null;
  };

  const handleChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    const companyId = getCompanyId();
    if (!companyId) {
      setError('Company ID not found. Please log in again.');
      return;
    }

    try {
      setLoading(true);

      const renderingData: RenderingCreate = {
        title: formData.title,
        description: formData.description || undefined,
        visit_id: formData.visit_id || undefined,
        budget_id: formData.budget_id || undefined,
        expiration_date: formData.expiration_date || undefined,
        notes: formData.notes || undefined,
      };

      await createRendering(renderingData, companyId);

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create rendering');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form id={CREATE_RENDERING_FORM_ID} onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg text-sm">
          {error}
        </div>
      )}

      <FormField
        label="Title *"
        type="text"
        value={formData.title}
        onChange={handleChange('title')}
        disabled={loading}
        required
        placeholder="Rendering title"
      />

      <Combobox
        label="Visit"
        options={visitOptions}
        value={formData.visit_id}
        onChange={(value) => {
          setFormData((prev) => ({
            ...prev,
            visit_id: value,
            // Clear budget if visit changes
            budget_id: prev.visit_id !== value ? '' : prev.budget_id
          }));
          if (error) setError(null);
        }}
        placeholder="Select a visit..."
        disabled={loading}
        emptyMessage="No visits found"
      />

      <Combobox
        label="Budget"
        options={budgetOptions}
        value={formData.budget_id}
        onChange={(value) => {
          setFormData((prev) => ({ ...prev, budget_id: value }));
          if (error) setError(null);
        }}
        placeholder="Select a budget..."
        disabled={loading || budgetOptions.length === 0}
        emptyMessage={formData.visit_id ? "No budgets for this visit" : "Select a visit first"}
      />

      <div className="space-y-2">
        <Label htmlFor="expiration_date">Expiration Date</Label>
        <input
          id="expiration_date"
          type="date"
          value={formData.expiration_date}
          onChange={handleChange('expiration_date')}
          disabled={loading}
          className="w-full px-3 py-2 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          value={formData.description}
          onChange={handleChange('description')}
          disabled={loading}
          rows={3}
          placeholder="Brief description of this rendering..."
          className="w-full px-3 py-2 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] resize-none"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <textarea
          id="notes"
          value={formData.notes}
          onChange={handleChange('notes')}
          disabled={loading}
          rows={2}
          placeholder="Internal notes..."
          className="w-full px-3 py-2 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] resize-none"
        />
      </div>
    </form>
  );
}
