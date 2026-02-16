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
import { useTranslation } from '../../../i18n';

export interface CreateProjectFormProps {
  onSuccess?: () => void;
  onCancel: () => void;
}

export function CreateProjectForm({ onSuccess, onCancel }: CreateProjectFormProps) {
  const { t } = useTranslation();
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
    start_date: '',
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
        start_date: formData.start_date || undefined,
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
        start_date: '',
        address: '',
        client_id: '',
        category_id: '',
      });
      setClientError(null);

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('projects:errors.createFailed'));
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-[color:var(--muted-foreground)]">{t('common:app.loading')}</p>
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
          label={`${t('projects:name')} *`}
          type="text"
          value={formData.name}
          onChange={handleChange('name')}
          required
          disabled={loading}
          placeholder={t('projects:name')}
        />

        <Combobox
          label={`${t('projects:client')} *`}
          options={clientOptions}
          value={formData.client_id}
          onChange={(value) => {
            setFormData((prev) => ({ ...prev, client_id: value }));
            if (clientError) setClientError(null);
            if (error) setError(null);
          }}
          placeholder={t('projects:searchClients')}
          required
          disabled={loading || loadingData}
          error={clientError || undefined}
          emptyMessage={t('common:messages.noData')}
        />

        <div className="space-y-2">
          <Label htmlFor="category_id">{t('projects:category')} *</Label>
          <select
            id="category_id"
            value={formData.category_id}
            onChange={handleChange('category_id')}
            required
            disabled={loading}
            className="w-full px-3 py-2 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]"
          >
            <option value="">{t('common:form.selectOption')}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">{t('projects:status')}</Label>
          <select
            id="status"
            value={formData.status}
            onChange={handleChange('status')}
            disabled={loading}
            className="w-full px-3 py-2 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]"
          >
            <option value="pending">{t('projects:statuses.pending')}</option>
            <option value="in_progress">{t('projects:statuses.in_progress')}</option>
            <option value="completed">{t('projects:statuses.completed')}</option>
            <option value="cancelled">{t('projects:statuses.cancelled')}</option>
            <option value="on_hold">{t('projects:statuses.on_hold')}</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">{t('projects:description')}</Label>
          <textarea
            id="description"
            value={formData.description}
            onChange={handleChange('description')}
            disabled={loading}
            rows={3}
            placeholder={t('projects:description')}
            className="w-full px-3 py-2 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] resize-none"
          />
        </div>

        <FormField
          label={t('projects:address')}
          type="text"
          value={formData.address}
          onChange={handleChange('address')}
          disabled={loading}
          placeholder={t('projects:address')}
        />

        <FormField
          label={t('projects:startDate')}
          type="date"
          value={formData.start_date}
          onChange={handleChange('start_date')}
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
            {t('common:actions.cancel')}
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            className="flex-1"
          >
            {loading ? t('common:app.loading') : t('common:actions.save')}
          </Button>
        </div>
      </div>
    </form>
  );
}

