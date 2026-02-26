/**
 * Create Rendering Page
 * Full-page form for creating a new rendering — select project, then optional budget
 */

import { useState, useEffect, useCallback, useMemo, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../../shared/components/organisms/Header';
import { Sidebar } from '../../../shared/components/organisms/Sidebar';
import { FormField } from '../../../shared/components/molecules/FormField';
import { Combobox, type ComboboxOption } from '../../../shared/components/molecules/Combobox';
import { Button } from '../../../shared/components/atoms/Button';
import { Heading } from '../../../shared/components/atoms/Heading';
import { Label } from '../../../shared/components/atoms/Label/Label';
import { useAuth } from '../../../shared/hooks/useAuth';
import { cn } from '../../../core/utils/cn';
import {
  createRendering,
  getProjects,
  getBudgets,
  type RenderingCreate,
  type ProjectDetail,
  type BudgetDetail
} from '../../../infrastructure/api/api.client';
import { decodeJwt } from '../../../core/utils/jwt.utils';
import { useTranslation } from 'react-i18next';

export function CreateRenderingPage() {
  const { user, logout } = useAuth();
  const { t } = useTranslation('renderings');
  const navigate = useNavigate();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [projects, setProjects] = useState<ProjectDetail[]>([]);
  const [budgets, setBudgets] = useState<BudgetDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project_id: '',
    budget_id: '',
    expiration_date: '',
    notes: '',
  });

  const getCompanyId = useCallback((): string | null => {
    if (!user?.access_token) return null;
    const payload = decodeJwt(user.access_token);
    return payload?.company_id || null;
  }, [user]);

  const fetchProjects = useCallback(async () => {
    const companyId = getCompanyId();
    if (!companyId) return;
    try {
      const data = await getProjects({
        company_id: companyId,
        skip: 0,
        limit: 1000,
        include_details: true,
      });
      setProjects(data);
    } catch (err) {
      console.error('Failed to load projects:', err);
    }
  }, [getCompanyId]);

  const fetchBudgets = useCallback(async () => {
    const companyId = getCompanyId();
    if (!companyId) return;
    try {
      const data = await getBudgets({
        company_id: companyId,
        skip: 0,
        limit: 1000,
      });
      setBudgets(data);
    } catch (err) {
      console.error('Failed to load budgets:', err);
    }
  }, [getCompanyId]);

  useEffect(() => {
    const loadData = async () => {
      setDataLoading(true);
      await Promise.all([fetchProjects(), fetchBudgets()]);
      setDataLoading(false);
    };
    loadData();
  }, [fetchProjects, fetchBudgets]);

  const projectOptions: ComboboxOption[] = useMemo(
    () =>
      projects.map((project) => ({
        id: project.id,
        label: project.name,
        value: project.id,
      })),
    [projects]
  );

  const budgetOptions: ComboboxOption[] = useMemo(
    () =>
      formData.project_id
        ? budgets.map((budget) => ({
            id: budget.id,
            label: budget.title,
            value: budget.id,
          }))
        : [],
    [budgets, formData.project_id]
  );

  const handleChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (error) setError(null);
  };

  const handleCancel = useCallback(() => {
    navigate('/renderings');
  }, [navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.title.trim()) {
      setError(t('titleRequired'));
      return;
    }

    const companyId = getCompanyId();
    if (!companyId) {
      setError(t('common:messages.sessionExpired'));
      return;
    }

    try {
      setLoading(true);

      const renderingData: RenderingCreate = {
        title: formData.title,
        description: formData.description || undefined,
        project_id: formData.project_id || undefined,
        budget_id: formData.budget_id || undefined,
        expiration_date: formData.expiration_date || undefined,
        notes: formData.notes || undefined,
      };

      await createRendering(renderingData, companyId);
      navigate('/renderings');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common:messages.errorLoading'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[color:var(--background)]">
      <Header
        userName={user?.name || user?.email || 'User'}
        onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
        onLogout={logout}
      />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main
        className={cn(
          'pt-5',
          'transition-all duration-500 ease-out',
          isSidebarOpen ? 'lg:ml-64' : 'lg:ml-0'
        )}
      >
        <div className="p-6 flex flex-col items-center">
          <div className="w-full max-w-xl">
            <div className="mb-6 text-center">
              <Heading variant="h1">{t('createRendering')}</Heading>
            </div>

            {dataLoading ? (
              <div className="text-center py-8 text-[color:var(--foreground-muted)]">
                {t('loading')}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6 p-6 border border-[color:var(--border)] rounded-lg bg-[color:var(--card)]">
                {error && (
                  <div className="p-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg">
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
                  placeholder={t('renderingTitle')}
                />

                <Combobox
                  label={t('project')}
                  options={projectOptions}
                  value={formData.project_id}
                  onChange={(value) => {
                    setFormData((prev) => ({
                      ...prev,
                      project_id: value,
                      budget_id: prev.project_id !== value ? '' : prev.budget_id,
                    }));
                    if (error) setError(null);
                  }}
                  placeholder={t('selectProject')}
                  disabled={loading}
                  emptyMessage={t('noProjectsFound')}
                />

                <Combobox
                  label={t('budgets:budget')}
                  options={budgetOptions}
                  value={formData.budget_id}
                  onChange={(value) => {
                    setFormData((prev) => ({ ...prev, budget_id: value }));
                    if (error) setError(null);
                  }}
                  placeholder={t('selectBudget')}
                  disabled={loading || !formData.project_id}
                  emptyMessage={formData.project_id ? t('noBudgetsForVisit') : t('selectProjectFirst')}
                />

                <div className="space-y-2">
                  <Label htmlFor="expiration_date">{t('expirationDate')}</Label>
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
                  <Label htmlFor="description">{t('description')}</Label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={handleChange('description')}
                    disabled={loading}
                    rows={3}
                    placeholder={t('descriptionPlaceholder')}
                    className="w-full px-3 py-2 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">{t('notes')}</Label>
                  <textarea
                    id="notes"
                    value={formData.notes}
                    onChange={handleChange('notes')}
                    disabled={loading}
                    rows={2}
                    placeholder={t('notesPlaceholder')}
                    className="w-full px-3 py-2 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] resize-none"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? t('creating') : t('createRendering')}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleCancel}
                    disabled={loading}
                    className="flex-1"
                  >
                    {t('common:actions.cancel')}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
