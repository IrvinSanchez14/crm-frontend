/**
 * Create Project Form Component
 * Form for creating a new project in the CRM system
 */

import { useState, type FormEvent, useEffect, useMemo } from 'react';
import { FormField } from '../../../shared/components/molecules/FormField';
import { Combobox, type ComboboxOption } from '../../../shared/components/molecules/Combobox';
import { Button } from '../../../shared/components/atoms/Button';
import { Label } from '../../../shared/components/atoms/Label/Label';
import { 
  createProject, 
  getProjectCategories,
  getClients,
  type ProjectCreate,
  type ProjectCategory,
  type Client
} from '../../../infrastructure/api/api.client';
import { decodeJwt } from '../../../core/utils/jwt.utils';
import { useAuth } from '../../../shared/hooks/useAuth';
import { formatCurrencyInput, formatCurrencyDisplay } from '../../../core/utils/currency.utils';

export interface CreateProjectFormProps {
  onSuccess?: () => void;
  onCancel: () => void;
}

export function CreateProjectForm({ onSuccess, onCancel }: CreateProjectFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [categories, setCategories] = useState<ProjectCategory[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [formData, setFormData] = useState<Omit<ProjectCreate, 'created_by_user_id'>>({
    name: '',
    description: '',
    status: 'lead',
    estimated_budget: '',
    actual_cost: '',
    start_date: '',
    estimated_completion_date: '',
    actual_completion_date: '',
    address: '',
    client_id: '',
    category_id: '',
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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const companyId = getCompanyId();
    if (!companyId) {
      setError('Company ID not found. Please log in again.');
      return;
    }

    // Validate required fields
    if (!formData.name.trim()) {
      setError('Please enter a project name.');
      return;
    }

    if (!formData.client_id) {
      setClientError('Please select a client.');
      setError('Please select a client.');
      return;
    }

    if (!formData.category_id) {
      setError('Please select a category.');
      return;
    }

    try {
      setLoading(true);
      const projectData: ProjectCreate = {
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
        status: formData.status as any,
        estimated_budget: formData.estimated_budget?.trim() || undefined,
        actual_cost: formData.actual_cost?.trim() || undefined,
        start_date: formData.start_date || undefined,
        estimated_completion_date: formData.estimated_completion_date || undefined,
        actual_completion_date: formData.actual_completion_date || undefined,
        address: formData.address?.trim() || undefined,
        client_id: formData.client_id,
        category_id: formData.category_id,
      };

      await createProject(projectData, companyId);
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        status: 'lead',
        estimated_budget: '',
        actual_cost: '',
        start_date: '',
        estimated_completion_date: '',
        actual_completion_date: '',
        address: '',
        client_id: '',
        category_id: '',
      });
      setClientError(null);

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project. Please try again.');
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
          onChange={(value) => {
            setFormData((prev) => ({ ...prev, client_id: value }));
            if (clientError) setClientError(null);
            if (error) setError(null);
          }}
          placeholder="Search for a client..."
          required
          disabled={loading || loadingData}
          error={clientError || undefined}
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

