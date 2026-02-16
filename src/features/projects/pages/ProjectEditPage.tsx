/**
 * Project Edit Page
 * Full-page view for editing project details and managing attachments
 */

import { useState, useEffect, useCallback, useMemo, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '../../../shared/components/organisms/Header';
import { Sidebar } from '../../../shared/components/organisms/Sidebar';
import { useAuth } from '../../../shared/hooks/useAuth';
import { Heading } from '../../../shared/components/atoms/Heading';
import { Text } from '../../../shared/components/atoms/Text';
import { Button } from '../../../shared/components/atoms/Button';
import { FormField } from '../../../shared/components/molecules/FormField';
import { Combobox, type ComboboxOption } from '../../../shared/components/molecules/Combobox';
import { cn } from '../../../core/utils/cn';
import {
  getProject,
  getProjectCategories,
  getClients,
  updateProject,
  type ProjectDetail,
  type ProjectUpdate,
  type ProjectCategory,
  type Client
} from '../../../infrastructure/api/api.client';
import { decodeJwt } from '../../../core/utils/jwt.utils';
import { useTranslation } from '../../../i18n';
import { AttachmentSection } from '../components/AttachmentSection';

export function ProjectEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, logout } = useAuth();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [categories, setCategories] = useState<ProjectCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'attachments'>('details');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: '' as string,
    start_date: '',
    address: '',
    client_id: '',
    category_id: '',
  });

  // Get company_id from JWT token
  const getCompanyId = useCallback((): string | null => {
    if (!user?.access_token) return null;
    const payload = decodeJwt(user.access_token);
    return payload?.company_id || null;
  }, [user]);

  // Convert clients to combobox options
  const clientOptions: ComboboxOption[] = useMemo(
    () => [
      { id: '', label: t('common:form.allClients'), value: '' },
      ...clients.map((client) => ({
        id: client.id,
        label: client.name,
        value: client.id,
      })),
    ],
    [clients, t]
  );

  // Convert categories to combobox options
  const categoryOptions: ComboboxOption[] = useMemo(
    () => [
      { id: '', label: t('projects:selectCategory'), value: '' },
      ...categories.map((category) => ({
        id: category.id,
        label: category.name,
        value: category.id,
      })),
    ],
    [categories, t]
  );

  // Status options
  const statusOptions: ComboboxOption[] = useMemo(
    () => [
      { id: 'lead', label: t('projects:statuses.lead'), value: 'lead' },
      { id: 'quoted', label: t('projects:statuses.quoted'), value: 'quoted' },
      { id: 'approved', label: t('projects:statuses.approved'), value: 'approved' },
      { id: 'in_progress', label: t('projects:statuses.in_progress'), value: 'in_progress' },
      { id: 'completed', label: t('projects:statuses.completed'), value: 'completed' },
      { id: 'cancelled', label: t('projects:statuses.cancelled'), value: 'cancelled' },
      { id: 'on_hold', label: t('projects:statuses.on_hold'), value: 'on_hold' },
    ],
    [t]
  );

  // Fetch project data
  const fetchProject = useCallback(async () => {
    if (!id) return;

    const companyId = getCompanyId();
    if (!companyId) {
      setError('Company ID not found. Please log in again.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const projectData = await getProject(id, companyId);
      setProject(projectData);
      setFormData({
        name: projectData.name,
        description: projectData.description || '',
        status: projectData.status,
        start_date: projectData.start_date || '',
        address: projectData.address || '',
        client_id: projectData.client_id,
        category_id: projectData.category_id,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project');
    } finally {
      setLoading(false);
    }
  }, [id, getCompanyId]);

  // Fetch clients and categories
  const fetchData = useCallback(async () => {
    const companyId = getCompanyId();
    if (!companyId) return;

    try {
      setLoadingData(true);
      const [clientsData, categoriesData] = await Promise.all([
        getClients({ company_id: companyId, skip: 0, limit: 1000 }),
        getProjectCategories({ company_id: companyId, skip: 0, limit: 1000 }),
      ]);
      setClients(clientsData);
      setCategories(categoriesData);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoadingData(false);
    }
  }, [getCompanyId]);

  useEffect(() => {
    fetchProject();
    fetchData();
  }, [fetchProject, fetchData]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!id || !project) return;

    const companyId = getCompanyId();
    if (!companyId) {
      setError('Company ID not found. Please log in again.');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const updateData: ProjectUpdate = {
        name: formData.name,
        description: formData.description || undefined,
        status: (formData.status || undefined) as ProjectUpdate['status'],
        start_date: formData.start_date || undefined,
        address: formData.address || undefined,
        client_id: formData.client_id,
        category_id: formData.category_id,
      };

      await updateProject(id, updateData, companyId);
      navigate('/projects');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update project');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[color:var(--background)]">
        <Header onMenuClick={toggleSidebar} onLogout={logout} />
        <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} />
        <main className="lg:ml-64 pt-16 min-h-screen">
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            <Text variant="muted">{t('common:loading')}</Text>
          </div>
        </main>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-[color:var(--background)]">
        <Header onMenuClick={toggleSidebar} onLogout={logout} />
        <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} />
        <main className="lg:ml-64 pt-16 min-h-screen">
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            <Text className="text-red-500">{error || 'Project not found'}</Text>
            <Button onClick={() => navigate('/projects')} className="mt-4">
              {t('common:actions.back')}
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[color:var(--background)]">
      <Header onMenuClick={toggleSidebar} onLogout={logout} />
      <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} />
      
      <main className="lg:ml-64 pt-16 min-h-screen">
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-4">
                <Button
                  variant="secondary"
                  onClick={() => navigate('/projects')}
                  className="flex items-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  {t('common:actions.back')}
                </Button>
                <Heading level={1}>{t('projects:editProject')}</Heading>
              </div>
              <Text variant="muted">{project.name}</Text>
            </div>

            {/* Tabs */}
            <div className="border-b border-[color:var(--border)] mb-6">
              <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab('details')}
                  className={cn(
                    'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                    activeTab === 'details'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  )}
                >
                  {t('projects:detailsTab')}
                </button>
                <button
                  onClick={() => setActiveTab('attachments')}
                  className={cn(
                    'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                    activeTab === 'attachments'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  )}
                >
                  {t('projects:attachmentsTab')}
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'details' ? (
              <div className="max-w-2xl mx-auto">
                <form onSubmit={handleSubmit} className="space-y-6">
                <FormField
                  label={t('projects:name')}
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                  disabled={saving}
                />

                <FormField
                  label={t('projects:description')}
                  id="description"
                  type="textarea"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  disabled={saving}
                />

                <Combobox
                  label={t('projects:client')}
                  options={clientOptions}
                  value={formData.client_id}
                  onChange={(value) => handleInputChange('client_id', value)}
                  placeholder={t('projects:selectClient')}
                  emptyMessage={t('projects:noClientsFound')}
                  disabled={loadingData || saving}
                />

                <Combobox
                  label={t('projects:category')}
                  options={categoryOptions}
                  value={formData.category_id}
                  onChange={(value) => handleInputChange('category_id', value)}
                  placeholder={t('projects:selectCategory')}
                  emptyMessage={t('projects:noCategoriesFound')}
                  disabled={loadingData || saving}
                />

                <Combobox
                  label={t('projects:status')}
                  options={statusOptions}
                  value={formData.status}
                  onChange={(value) => handleInputChange('status', value)}
                  placeholder={t('projects:selectStatus')}
                  disabled={saving}
                />

                <FormField
                  label={t('projects:startDate')}
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => handleInputChange('start_date', e.target.value)}
                  disabled={saving}
                />

                <FormField
                  label={t('projects:address')}
                  id="address"
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  disabled={saving}
                />

                {error && (
                  <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
                    <Text className="text-sm text-red-800 dark:text-red-200">{error}</Text>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button type="submit" disabled={saving}>
                    {saving ? t('common:actions.saving') : t('common:actions.save')}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => navigate('/projects')}
                    disabled={saving}
                  >
                    {t('common:actions.cancel')}
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <div>
              <AttachmentSection projectId={id!} />
            </div>
          )}
          </div>
        </div>
      </main>
    </div>
  );
}
