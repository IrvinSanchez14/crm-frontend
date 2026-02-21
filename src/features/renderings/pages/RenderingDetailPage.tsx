/**
 * Rendering Detail Page
 * Full-page view for managing rendering with 3-tab layout:
 * Tab 1: 3D Renders, Tab 2: Proposed Materials, Tab 3: Item Details
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
import { Tab3DRenders } from '../components/Tab3DRenders';
import { TabProposedMaterials } from '../components/TabProposedMaterials';
import { TabItemDetails } from '../components/TabItemDetails';
import {
  getRendering,
  updateRendering,
  saveRendering,
  type RenderingDetail,
  type RenderingUpdate,
  type RenderingStatus,
} from '../../../infrastructure/api/api.client';
import { decodeJwt } from '../../../core/utils/jwt.utils';

const TABS = ['3D Renders', 'Proposed Materials', 'Item Details'] as const;

export function RenderingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [rendering, setRendering] = useState<RenderingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingRendering, setSavingRendering] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<RenderingUpdate>({});
  const [activeTab, setActiveTab] = useState(0);

  const getCompanyId = useCallback((): string | null => {
    if (!user?.access_token) return null;
    const payload = decodeJwt(user.access_token);
    return payload?.company_id || null;
  }, [user]);

  const fetchRendering = useCallback(async () => {
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
      const data = await getRendering(id, companyId);
      setRendering(data);
      setFormData({
        title: data.title,
        description: data.description || undefined,
        status: data.status,
        expiration_date: data.expiration_date || undefined,
        notes: data.notes || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load rendering');
    } finally {
      setLoading(false);
    }
  }, [id, getCompanyId]);

  useEffect(() => {
    fetchRendering();
  }, [fetchRendering]);

  const handleChange = (field: keyof RenderingUpdate) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (error) setError(null);
  };

  const handleSave = async () => {
    if (!id || !rendering) return;

    const companyId = getCompanyId();
    if (!companyId) {
      setError('Company ID not found. Please log in again.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await updateRendering(id, formData, companyId);
      await fetchRendering();
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update rendering');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (rendering) {
      setFormData({
        title: rendering.title,
        description: rendering.description || undefined,
        status: rendering.status,
        expiration_date: rendering.expiration_date || undefined,
        notes: rendering.notes || undefined,
      });
    }
    setIsEditing(false);
  };

  const handleSaveRendering = async () => {
    if (!id) return;
    const companyId = getCompanyId();
    if (!companyId) return;

    try {
      setSavingRendering(true);
      setError(null);
      setSaveSuccess(false);
      await saveRendering(id, companyId);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save rendering');
    } finally {
      setSavingRendering(false);
    }
  };

  const statusColors: Record<RenderingStatus, string> = {
    draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };

  const companyId = getCompanyId();

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
            <Text variant="muted">Loading rendering...</Text>
          </div>
        </main>
      </div>
    );
  }

  if (error && !rendering) {
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
            <Button variant="secondary" onClick={() => navigate('/renderings')}>
              Back to Renderings
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
        <div className="p-6 max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/renderings')}
              aria-label="Back to renderings"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Button>
            <div className="flex-1">
              <Heading variant="h1">{rendering?.title}</Heading>
              {rendering?.visit && (
                <Text variant="muted" size="sm">Visit: {rendering.visit.title}</Text>
              )}
            </div>
            <Button
              variant="primary"
              onClick={handleSaveRendering}
              disabled={savingRendering}
            >
              {savingRendering ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Rendering'}
            </Button>
            {isEditing ? (
              <>
                <Button variant="secondary" onClick={handleSave} disabled={saving}>
                  {saving ? 'Updating...' : 'Update'}
                </Button>
                <Button variant="secondary" onClick={handleCancelEdit} disabled={saving}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button variant="secondary" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
            )}
          </div>

          {saveSuccess && (
            <div className="p-4 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-lg mb-6">
              Rendering saved successfully! A version snapshot has been created.
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Rendering Info Card */}
          <div className="bg-[color:var(--card)] rounded-lg border border-[color:var(--border)] p-6 mb-6">
            <Heading variant="h3" className="mb-4">Rendering Information</Heading>

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
                      className="w-full px-3 py-2 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--foreground)]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <select
                      id="status"
                      value={formData.status || 'draft'}
                      onChange={handleChange('status')}
                      disabled={saving}
                      className="w-full px-3 py-2 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--foreground)]"
                    >
                      <option value="draft">Draft</option>
                      <option value="sent">Sent</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expiration_date">Expiration Date</Label>
                    <input
                      id="expiration_date"
                      type="date"
                      value={formData.expiration_date || ''}
                      onChange={handleChange('expiration_date')}
                      disabled={saving}
                      className="w-full px-3 py-2 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--foreground)]"
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
                    rows={2}
                    className="w-full px-3 py-2 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--foreground)] resize-none"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Text variant="muted" className="text-xs mb-1">Status</Text>
                  <span className={cn('inline-block px-2 py-1 rounded-full text-xs font-medium', statusColors[rendering?.status || 'draft'])}>
                    {rendering?.status.toUpperCase()}
                  </span>
                </div>
                <div>
                  <Text variant="muted" className="text-xs mb-1">Expiration</Text>
                  <Text variant="default">
                    {rendering?.expiration_date ? new Date(rendering.expiration_date).toLocaleDateString() : '\u2014'}
                  </Text>
                </div>
                <div>
                  <Text variant="muted" className="text-xs mb-1">Created</Text>
                  <Text variant="default">
                    {rendering?.created_at ? new Date(rendering.created_at).toLocaleDateString() : '\u2014'}
                  </Text>
                </div>
                {rendering?.description && (
                  <div className="md:col-span-3">
                    <Text variant="muted" className="text-xs mb-1">Description</Text>
                    <Text variant="default">{rendering.description}</Text>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tab Bar */}
          <div className="flex border-b border-[color:var(--border)] mb-6">
            {TABS.map((tab, index) => (
              <button
                key={tab}
                onClick={() => setActiveTab(index)}
                className={cn(
                  'px-6 py-3 text-sm font-medium transition-colors border-b-2 -mb-px',
                  activeTab === index
                    ? 'border-[color:var(--primary)] text-[color:var(--primary)]'
                    : 'border-transparent text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]'
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="bg-[color:var(--card)] rounded-lg border border-[color:var(--border)] p-6">
            {activeTab === 0 && rendering && companyId && (
              <Tab3DRenders
                renderingId={rendering.id}
                companyId={companyId}
                images={rendering.images}
                onRefresh={fetchRendering}
              />
            )}
            {activeTab === 1 && rendering && companyId && (
              <TabProposedMaterials
                renderingId={rendering.id}
                companyId={companyId}
                images={rendering.images}
                onRefresh={fetchRendering}
              />
            )}
            {activeTab === 2 && rendering && companyId && (
              <TabItemDetails
                renderingId={rendering.id}
                companyId={companyId}
                budgetId={rendering.budget_id}
                items={rendering.items}
                onRefresh={fetchRendering}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
