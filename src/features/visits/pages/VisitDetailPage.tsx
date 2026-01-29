/**
 * Visit Detail Page
 * Full-page view for employees to view and edit visit details
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '../../../shared/components/organisms/Header';
import { Sidebar } from '../../../shared/components/organisms/Sidebar';
import { useAuth } from '../../../shared/hooks/useAuth';
import { Heading } from '../../../shared/components/atoms/Heading';
import { Text } from '../../../shared/components/atoms/Text';
import { Button } from '../../../shared/components/atoms/Button';
import { Label } from '../../../shared/components/atoms/Label/Label';
import { cn } from '../../../core/utils/cn';
import {
  getVisit,
  getProjects,
  updateVisit,
  getBudgetByVisit,
  createBudget,
  type VisitDetail,
  type VisitUpdate,
  type ProjectDetail,
  type BudgetDetail,
  type BudgetCreate,
  type VisitStatus
} from '../../../infrastructure/api/api.client';
import { decodeJwt } from '../../../core/utils/jwt.utils';
import { BudgetView } from '../../budgets/components/BudgetView';

export function VisitDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [visit, setVisit] = useState<VisitDetail | null>(null);
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [budget, setBudget] = useState<BudgetDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingBudget, setLoadingBudget] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<VisitUpdate>({});

  // Get company_id from JWT token
  const getCompanyId = useCallback((): string | null => {
    if (!user?.access_token) return null;
    const payload = decodeJwt(user.access_token);
    return payload?.company_id || null;
  }, [user]);

  // Fetch visit data
  const fetchVisit = useCallback(async () => {
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
      const visitData = await getVisit(id, companyId);
      setVisit(visitData);
      setFormData({
        title: visitData.title,
        description: visitData.description || undefined,
        status: visitData.status,
        visit_date: visitData.visit_date || undefined,
        inspection_notes: visitData.inspection_notes || undefined,
        estimated_materials_cost: visitData.estimated_materials_cost || undefined,
        estimated_labor_cost: visitData.estimated_labor_cost || undefined,
        estimated_total_cost: visitData.estimated_total_cost || undefined,
      });

      // Fetch project info
      const projects = await getProjects({
        company_id: companyId,
        skip: 0,
        limit: 1000,
        include_details: true,
      });
      const projectData = projects.find(p => p.id === visitData.project_id);
      setProject(projectData || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load visit');
    } finally {
      setLoading(false);
    }
  }, [id, getCompanyId]);

  // Fetch budget for this visit
  const fetchBudget = useCallback(async () => {
    if (!id) return;

    const companyId = getCompanyId();
    if (!companyId) return;

    try {
      setLoadingBudget(true);
      const budgetData = await getBudgetByVisit(id, companyId);
      setBudget(budgetData);
    } catch (err) {
      console.error('Failed to load budget:', err);
      setBudget(null);
    } finally {
      setLoadingBudget(false);
    }
  }, [id, getCompanyId]);

  useEffect(() => {
    fetchVisit();
    fetchBudget();
  }, [fetchVisit, fetchBudget]);

  const handleChange = (field: keyof VisitUpdate) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (error) setError(null);
  };

  const handleSave = async () => {
    if (!id || !visit) return;

    const companyId = getCompanyId();
    if (!companyId) {
      setError('Company ID not found. Please log in again.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await updateVisit(id, formData, companyId);
      await fetchVisit();
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update visit');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateBudget = async () => {
    if (!id || !visit) return;

    const companyId = getCompanyId();
    if (!companyId) {
      setError('Company ID not found. Please log in again.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const budgetData: BudgetCreate = {
        title: `Budget for ${visit.title}`,
        description: `Budget created from visit: ${visit.title}`,
        visit_id: id,
        status: 'draft',
        budget_items: [],
      };
      const newBudget = await createBudget(budgetData, companyId);
      setBudget(newBudget);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create budget');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (visit) {
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
    }
    setIsEditing(false);
  };

  const statusColors: Record<VisitStatus, string> = {
    planning: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    in_review: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    inspection_required: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    visited: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  };

  if (loading) {
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
          <div className="p-6 flex items-center justify-center">
            <Text variant="muted">Loading visit...</Text>
          </div>
        </main>
      </div>
    );
  }

  if (error && !visit) {
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
          <div className="p-6">
            <div className="p-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg mb-4">
              {error}
            </div>
            <Button variant="secondary" onClick={() => navigate('/visits')}>
              Back to Visits
            </Button>
          </div>
        </main>
      </div>
    );
  }

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
        <div className="p-6 max-w-4xl mx-auto">
          {/* Header with back button */}
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/visits')}
              aria-label="Back to visits"
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </Button>
            <div className="flex-1">
              <Heading variant="h1">{visit?.title}</Heading>
              {project && (
                <Text variant="muted" size="sm">
                  Project: {project.name}
                </Text>
              )}
            </div>
            {!isEditing && (
              <Button variant="primary" onClick={() => setIsEditing(true)}>
                Edit Visit
              </Button>
            )}
          </div>

          {error && (
            <div className="p-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Visit Details Card */}
          <div className="bg-[color:var(--card)] rounded-lg border border-[color:var(--border)] p-6 mb-6">
            <Heading variant="h3" className="mb-4">Visit Information</Heading>

            {isEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <input
                      id="title"
                      type="text"
                      value={formData.title || ''}
                      onChange={handleChange('title')}
                      disabled={saving}
                      required
                      className="w-full px-3 py-2 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <select
                      id="status"
                      value={formData.status || 'planning'}
                      onChange={handleChange('status')}
                      disabled={saving}
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
                      value={formData.visit_date || ''}
                      onChange={handleChange('visit_date')}
                      disabled={saving}
                      className="w-full px-3 py-2 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    value={formData.description || ''}
                    onChange={handleChange('description')}
                    disabled={saving}
                    rows={3}
                    placeholder="Describe the purpose of this visit..."
                    className="w-full px-3 py-2 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="inspection_notes">Inspection Notes</Label>
                  <textarea
                    id="inspection_notes"
                    value={formData.inspection_notes || ''}
                    onChange={handleChange('inspection_notes')}
                    disabled={saving}
                    rows={4}
                    placeholder="Notes from the site inspection..."
                    className="w-full px-3 py-2 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] resize-none"
                  />
                </div>

                {/* Cost Estimates */}
                <div className="border-t border-[color:var(--border)] pt-4 mt-4">
                  <Heading variant="h4" className="mb-3">Cost Estimates</Heading>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="estimated_materials_cost">Materials Cost</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-[color:var(--foreground)]">$</span>
                        <input
                          id="estimated_materials_cost"
                          type="number"
                          step="0.01"
                          value={formData.estimated_materials_cost || ''}
                          onChange={handleChange('estimated_materials_cost')}
                          disabled={saving}
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
                          value={formData.estimated_labor_cost || ''}
                          onChange={handleChange('estimated_labor_cost')}
                          disabled={saving}
                          placeholder="0.00"
                          className="w-full pl-8 pr-3 py-2 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="estimated_total_cost">Total Cost</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-[color:var(--foreground)]">$</span>
                        <input
                          id="estimated_total_cost"
                          type="number"
                          step="0.01"
                          value={formData.estimated_total_cost || ''}
                          onChange={handleChange('estimated_total_cost')}
                          disabled={saving}
                          placeholder="0.00"
                          className="w-full pl-8 pr-3 py-2 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="primary"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleCancelEdit}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Text variant="muted" className="text-xs mb-1">Status</Text>
                    <span
                      className={cn(
                        'inline-block px-2 py-1 rounded-full text-xs font-medium',
                        statusColors[visit?.status || 'planning']
                      )}
                    >
                      {visit?.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <Text variant="muted" className="text-xs mb-1">Visit Date</Text>
                    <Text variant="default">
                      {visit?.visit_date
                        ? new Date(visit.visit_date).toLocaleDateString()
                        : '—'}
                    </Text>
                  </div>
                  <div>
                    <Text variant="muted" className="text-xs mb-1">Created</Text>
                    <Text variant="default">
                      {visit?.created_at
                        ? new Date(visit.created_at).toLocaleDateString()
                        : '—'}
                    </Text>
                  </div>
                </div>

                {visit?.description && (
                  <div>
                    <Text variant="muted" className="text-xs mb-1">Description</Text>
                    <Text variant="default">{visit.description}</Text>
                  </div>
                )}

                {visit?.inspection_notes && (
                  <div>
                    <Text variant="muted" className="text-xs mb-1">Inspection Notes</Text>
                    <Text variant="default" className="whitespace-pre-wrap">
                      {visit.inspection_notes}
                    </Text>
                  </div>
                )}

                {/* Cost Estimates Display */}
                {(visit?.estimated_materials_cost || visit?.estimated_labor_cost || visit?.estimated_total_cost) && (
                  <div className="border-t border-[color:var(--border)] pt-4 mt-4">
                    <Text variant="muted" className="text-xs mb-2">Cost Estimates</Text>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {visit?.estimated_materials_cost && (
                        <div>
                          <Text variant="muted" className="text-xs">Materials</Text>
                          <Text variant="default" className="font-medium">
                            ${parseFloat(visit.estimated_materials_cost).toFixed(2)}
                          </Text>
                        </div>
                      )}
                      {visit?.estimated_labor_cost && (
                        <div>
                          <Text variant="muted" className="text-xs">Labor</Text>
                          <Text variant="default" className="font-medium">
                            ${parseFloat(visit.estimated_labor_cost).toFixed(2)}
                          </Text>
                        </div>
                      )}
                      {visit?.estimated_total_cost && (
                        <div>
                          <Text variant="muted" className="text-xs">Total</Text>
                          <Text variant="default" className="font-medium">
                            ${parseFloat(visit.estimated_total_cost).toFixed(2)}
                          </Text>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Budget Section */}
          <div className="bg-[color:var(--card)] rounded-lg border border-[color:var(--border)] p-6">
            <div className="flex items-center justify-between mb-4">
              <Heading variant="h3">Budget</Heading>
              {!budget && !loadingBudget && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleCreateBudget}
                  disabled={saving}
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
              />
            ) : (
              <div className="p-4 bg-[color:var(--muted)] rounded-lg">
                <Text variant="muted">
                  No budget created yet. Create a budget to add line items and generate quotes.
                </Text>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
