/**
 * Create Visit Form Component
 * Simplified form for admin to create a visit assignment
 * Only requires: project, title, status, visit date
 */

import { useState, useEffect, type FormEvent, useMemo } from 'react';
import { FormField } from '../../../shared/components/molecules/FormField';
import { Combobox, type ComboboxOption } from '../../../shared/components/molecules/Combobox';
import { Button } from '../../../shared/components/atoms/Button';
import { Label } from '../../../shared/components/atoms/Label/Label';
import {
  createVisit,
  type VisitCreate,
  type ProjectDetail
} from '../../../infrastructure/api/api.client';
import { decodeJwt } from '../../../core/utils/jwt.utils';
import { useAuth } from '../../../shared/hooks/useAuth';

export const CREATE_VISIT_FORM_ID = 'create-visit-form';

export interface CreateVisitFormProps {
  projects: ProjectDetail[];
  onSuccess?: () => void;
  onCancel: () => void;
  onLoadingChange?: (loading: boolean) => void;
}

// Footer component to be used with RightSidebar footer prop
export function CreateVisitFormFooter({
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
        form={CREATE_VISIT_FORM_ID}
        variant="primary"
        disabled={loading}
        className="flex-1"
      >
        {loading ? 'Creating...' : 'Create Visit'}
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

export function CreateVisitForm({
  projects,
  onSuccess,
  onCancel,
  onLoadingChange
}: CreateVisitFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    status: 'planning' as const,
    visit_date: '',
    project_id: '',
  });

  // Notify parent of loading state changes
  useEffect(() => {
    onLoadingChange?.(loading);
  }, [loading, onLoadingChange]);

  // Convert projects to combobox options
  const projectOptions: ComboboxOption[] = useMemo(
    () =>
      projects.map((project) => ({
        id: project.id,
        label: `${project.name} - ${project.client?.name || 'Unknown Client'}`,
        value: project.id,
      })),
    [projects]
  );

  // Get company_id from JWT token
  const getCompanyId = (): string | null => {
    if (!user?.access_token) return null;
    const payload = decodeJwt(user.access_token);
    return payload?.company_id || null;
  };

  const handleChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (error) setError(null);
    if (field === 'project_id' && projectError) setProjectError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setProjectError(null);

    if (!formData.project_id) {
      setProjectError('Project is required');
      return;
    }

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

      const visitData: VisitCreate = {
        title: formData.title,
        project_id: formData.project_id,
        status: formData.status,
        visit_date: formData.visit_date || undefined,
      };

      await createVisit(visitData, companyId);

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create visit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form id={CREATE_VISIT_FORM_ID} onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg text-sm">
          {error}
        </div>
      )}

      <Combobox
        label="Project *"
        options={projectOptions}
        value={formData.project_id}
        onChange={(value) => {
          setFormData((prev) => ({ ...prev, project_id: value }));
          if (projectError) setProjectError(null);
          if (error) setError(null);
        }}
        placeholder="Search for a project..."
        required
        disabled={loading}
        error={projectError || undefined}
        emptyMessage="No projects found"
      />

      <FormField
        label="Title *"
        type="text"
        value={formData.title}
        onChange={handleChange('title')}
        disabled={loading}
        required
        placeholder="Visit title"
      />

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          value={formData.status}
          onChange={handleChange('status')}
          disabled={loading}
          className="w-full px-3 py-2 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]"
        >
          <option value="planning">Planning</option>
          <option value="in_review">In Review</option>
          <option value="approved">Approved</option>
          <option value="inspection_required">Inspection Required</option>
          <option value="visited">Visited</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="visit_date">Visit Date</Label>
        <input
          id="visit_date"
          type="date"
          value={formData.visit_date}
          onChange={handleChange('visit_date')}
          disabled={loading}
          className="w-full px-3 py-2 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]"
        />
      </div>
    </form>
  );
}
