/**
 * Create Rendering Page
 * Full-page form for creating a new rendering
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
  getVisits,
  getBudgets,
  type RenderingCreate,
  type VisitDetail,
  type BudgetDetail
} from '../../../infrastructure/api/api.client';
import { decodeJwt } from '../../../core/utils/jwt.utils';

export function CreateRenderingPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [visits, setVisits] = useState<VisitDetail[]>([]);
  const [budgets, setBudgets] = useState<BudgetDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    visit_id: '',
    budget_id: '',
    expiration_date: '',
    notes: '',
  });

  // Get company_id from JWT token
  const getCompanyId = useCallback((): string | null => {
    if (!user?.access_token) return null;
    const payload = decodeJwt(user.access_token);
    return payload?.company_id || null;
  }, [user]);

  // Fetch visits for dropdown
  const fetchVisits = useCallback(async () => {
    const companyId = getCompanyId();
    if (!companyId) return;

    try {
      const data = await getVisits({
        company_id: companyId,
        skip: 0,
        limit: 1000,
        include_details: true,
      });
      setVisits(data);
    } catch (err) {
      console.error('Failed to load visits:', err);
    }
  }, [getCompanyId]);

  // Fetch budgets for dropdown
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

  // Fetch data on mount
  useEffect(() => {
    const loadData = async () => {
      setDataLoading(true);
      await Promise.all([fetchVisits(), fetchBudgets()]);
      setDataLoading(false);
    };
    loadData();
  }, [fetchVisits, fetchBudgets]);

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
      navigate('/renderings');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create rendering');
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
          'w-full pt-5',
          'transition-all duration-500 ease-out',
          isSidebarOpen ? 'lg:ml-64' : 'lg:ml-0'
        )}
      >
        <div className="p-6 flex flex-col items-center">
          <div className="w-full max-w-xl">
            <div className="mb-6 text-center">
              <Heading variant="h1">Create Rendering</Heading>
            </div>

            {dataLoading ? (
              <div className="text-center py-8 text-[color:var(--foreground-muted)]">
                Loading...
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

                <div className="flex gap-4 pt-4">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? 'Creating...' : 'Create Rendering'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleCancel}
                    disabled={loading}
                    className="flex-1"
                  >
                    Cancel
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
