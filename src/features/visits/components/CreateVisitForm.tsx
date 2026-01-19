/**
 * Create Visit Form Component
 * Form for creating a new visit for a project
 */

import { useState, type FormEvent, useEffect, useMemo } from 'react';
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

export interface CreateVisitFormProps {
  projects: ProjectDetail[];
  onSuccess?: () => void;
  onCancel: () => void;
}

export function CreateVisitForm({ projects, onSuccess, onCancel }: CreateVisitFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<VisitCreate, 'created_by_user_id'>>({
    title: '',
    description: '',
    status: 'planning',
    visit_date: '',
    inspection_notes: '',
    estimated_materials_cost: '',
    estimated_labor_cost: '',
    estimated_total_cost: '',
    images: [],
    attachments: [],
    project_id: '',
  });

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
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
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
      
      // Prepare data, converting empty strings to undefined
      const visitData: VisitCreate = {
        ...formData,
        description: formData.description || undefined,
        visit_date: formData.visit_date || undefined,
        inspection_notes: formData.inspection_notes || undefined,
        estimated_materials_cost: formData.estimated_materials_cost || undefined,
        estimated_labor_cost: formData.estimated_labor_cost || undefined,
        estimated_total_cost: formData.estimated_total_cost || undefined,
        images: formData.images && formData.images.length > 0 ? formData.images : undefined,
        attachments: formData.attachments && formData.attachments.length > 0 ? formData.attachments : undefined,
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
    <form onSubmit={handleSubmit} className="space-y-4">
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
        placeholder="Visit title"
      />

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

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          value={formData.description}
          onChange={handleChange('description')}
          disabled={loading}
          rows={3}
          placeholder="Visit description"
          className="w-full px-3 py-2 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] resize-none"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="inspection_notes">Inspection Notes</Label>
        <textarea
          id="inspection_notes"
          value={formData.inspection_notes}
          onChange={handleChange('inspection_notes')}
          disabled={loading}
          rows={4}
          placeholder="Notes from the inspection..."
          className="w-full px-3 py-2 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="estimated_materials_cost">Materials Cost</Label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-[color:var(--foreground)]">$</span>
            <input
              id="estimated_materials_cost"
              type="number"
              step="0.01"
              value={formData.estimated_materials_cost}
              onChange={handleChange('estimated_materials_cost')}
              disabled={loading}
              placeholder="0.00"
              className="w-full pl-8 pr-3 py-2 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="estimated_labor_cost">Labor Cost</Label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-[color:var(--foreground)]">$</span>
            <input
              id="estimated_labor_cost"
              type="number"
              step="0.01"
              value={formData.estimated_labor_cost}
              onChange={handleChange('estimated_labor_cost')}
              disabled={loading}
              placeholder="0.00"
              className="w-full pl-8 pr-3 py-2 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
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
    </form>
  );
}
