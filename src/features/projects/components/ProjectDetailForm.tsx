/**
 * Project Detail Form Component
 * Form for viewing and editing project details
 */

import { useState, type FormEvent, useEffect, useMemo } from 'react';
import { FormField } from '../../../shared/components/molecules/FormField';
import { Combobox, type ComboboxOption } from '../../../shared/components/molecules/Combobox';
import { Button } from '../../../shared/components/atoms/Button';
import { Label } from '../../../shared/components/atoms/Label/Label';
import { 
  getProjectCategories,
  getClients,
  type ProjectDetail,
  type ProjectCategory,
  type Client
} from '../../../infrastructure/api/api.client';
import { decodeJwt } from '../../../core/utils/jwt.utils';
import { useAuth } from '../../../shared/hooks/useAuth';
import { formatCurrencyInput, formatCurrencyDisplay } from '../../../core/utils/currency.utils';

export interface ProjectDetailFormProps {
  project: ProjectDetail;
  onSuccess?: () => void;
  onCancel: () => void;
}

export function ProjectDetailForm({ project, onSuccess, onCancel }: ProjectDetailFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [categories, setCategories] = useState<ProjectCategory[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [formData, setFormData] = useState({
    name: project.name,
    description: project.description || '',
    status: project.status,
    estimated_budget: project.estimated_budget || '',
    actual_cost: project.actual_cost || '',
    start_date: project.start_date || '',
    estimated_completion_date: project.estimated_completion_date || '',
    actual_completion_date: project.actual_completion_date || '',
    address: project.address || '',
    client_id: project.client_id,
    category_id: project.category_id,
  });

  // Convert clients to combobox options
  const clientOptions: ComboboxOption[] = useMemo(
    () =>
      clients.map((client) => ({
        id: client.id,
        label: client.name,
        value: client.id,
      })),
    [clients]
  );

  // Categories are used directly in the select dropdown below

  // Get company_id from JWT token
  const getCompanyId = (): string | null => {
    if (!user?.access_token) return null;
    const payload = decodeJwt(user.access_token);
    return payload?.company_id || null;
  };

  // Load clients and categories on mount
  useEffect(() => {
    const loadData = async () => {
      const companyId = getCompanyId();
      if (!companyId) {
        setError('Company ID not found. Please log in again.');
        setLoadingData(false);
        return;
      }

      try {
        setLoadingData(true);
        const [clientsData, categoriesData] = await Promise.all([
          getClients({ company_id: companyId, limit: 1000 }),
          getProjectCategories({ company_id: companyId, active_only: true, limit: 1000 }),
        ]);
        setClients(clientsData);
        setCategories(categoriesData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load form data');
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, []);

  const handleChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleClientChange = (value: string) => {
    setFormData((prev) => ({ ...prev, client_id: value }));
    if (error) setError(null);
  };

  // Category change is handled through handleChange('category_id')

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name.trim()) {
      setError('Please enter a project name.');
      return;
    }
    if (!formData.client_id) {
      setError('Please select a client.');
      return;
    }
    if (!formData.category_id) {
      setError('Please select a category.');
      return;
    }

    // TODO: Implement update project API call
    // For now, just show success message
    setLoading(true);
    try {
      // await updateProject(project.id, formData);
      console.log('Update project (not implemented yet):', formData);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update project');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-[color:var(--muted-foreground)]">Loading form data...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      {/* Form Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-[color:var(--destructive)]/10 border border-[color:var(--destructive)]/20">
            <p className="text-sm text-[color:var(--destructive)]">{error}</p>
          </div>
        )}

        <FormField
          label="Project Name *"
          type="text"
          value={formData.name}
          onChange={handleChange('name')}
          required
          disabled={loading}
          placeholder="Project name"
        />

        <Combobox
          label="Client *"
          options={clientOptions}
          value={formData.client_id}
          onChange={handleClientChange}
          placeholder="Search for a client..."
          required
          disabled={loading || loadingData}
          emptyMessage="No clients found"
        />

        <div className="space-y-2">
          <Label htmlFor="category_id">Category *</Label>
          <select
            id="category_id"
            value={formData.category_id}
            onChange={handleChange('category_id')}
            required
            disabled={loading}
            className="w-full px-3 py-2 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]"
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            value={formData.status}
            onChange={handleChange('status')}
            disabled={loading}
            className="w-full px-3 py-2 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]"
          >
            <option value="lead">Lead</option>
            <option value="quoted">Quoted</option>
            <option value="approved">Approved</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="on_hold">On Hold</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            value={formData.description}
            onChange={handleChange('description')}
            disabled={loading}
            rows={3}
            placeholder="Project description"
            className="w-full px-3 py-2 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] resize-none"
          />
        </div>

        <FormField
          label="Address"
          type="text"
          value={formData.address}
          onChange={handleChange('address')}
          disabled={loading}
          placeholder="Project address"
        />

        <div className="space-y-2">
          <Label htmlFor="estimated_budget">Estimated Budget</Label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-[color:var(--foreground)]">$</span>
            <input
              id="estimated_budget"
              type="text"
              inputMode="decimal"
              value={formData.estimated_budget}
              onChange={(e) => {
                const formatted = formatCurrencyInput(e.target.value);
                setFormData((prev) => ({ ...prev, estimated_budget: formatted }));
                if (error) setError(null);
              }}
              disabled={loading}
              placeholder="0.00"
              className="w-full pl-8 pr-3 py-2 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]"
            />
          </div>
          <p className="text-xs text-[color:var(--muted-foreground)]">
            {formData.estimated_budget ? `Display: ${formatCurrencyDisplay(formData.estimated_budget)}` : ''}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="actual_cost">Actual Cost</Label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-[color:var(--foreground)]">$</span>
            <input
              id="actual_cost"
              type="text"
              inputMode="decimal"
              value={formData.actual_cost}
              onChange={(e) => {
                const formatted = formatCurrencyInput(e.target.value);
                setFormData((prev) => ({ ...prev, actual_cost: formatted }));
                if (error) setError(null);
              }}
              disabled={loading}
              placeholder="0.00"
              className="w-full pl-8 pr-3 py-2 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]"
            />
          </div>
          <p className="text-xs text-[color:var(--muted-foreground)]">
            {formData.actual_cost ? `Display: ${formatCurrencyDisplay(formData.actual_cost)}` : ''}
          </p>
        </div>

        <FormField
          label="Start Date"
          type="date"
          value={formData.start_date}
          onChange={handleChange('start_date')}
          disabled={loading}
        />

        <FormField
          label="Estimated Completion Date"
          type="date"
          value={formData.estimated_completion_date}
          onChange={handleChange('estimated_completion_date')}
          disabled={loading}
        />

        <FormField
          label="Actual Completion Date"
          type="date"
          value={formData.actual_completion_date}
          onChange={handleChange('actual_completion_date')}
          disabled={loading}
        />

        {/* Created Info (Read-only) */}
        <div className="space-y-2 mt-6 pt-4 border-t border-[color:var(--border)]">
          <div className="text-xs font-semibold text-[color:var(--muted-foreground)] uppercase tracking-wide">
            Project Information
          </div>
          <div className="space-y-1 text-sm">
            <p>
              <span className="text-[color:var(--muted-foreground)]">Created by: </span>
              <span className="text-[color:var(--foreground)]">{project.created_by_name || '—'}</span>
            </p>
            <p>
              <span className="text-[color:var(--muted-foreground)]">Created at: </span>
              <span className="text-[color:var(--foreground)]">
                {new Date(project.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Footer with buttons */}
      <div className="border-t border-[color:var(--border)] px-6 py-4 space-y-3">
        <div className="flex gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={loading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            className="flex-1"
          >
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </form>
  );
}
