/**
 * Visit Detail Page
 * Full-page read-only view with tabs: Details | Notes | Attachments
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '../../../shared/components/organisms/Header';
import { Sidebar } from '../../../shared/components/organisms/Sidebar';
import { useAuth } from '../../../shared/hooks/useAuth';
import { Heading } from '../../../shared/components/atoms/Heading';
import { Text } from '../../../shared/components/atoms/Text';
import { Button } from '../../../shared/components/atoms/Button';
import { cn } from '../../../core/utils/cn';
import { RichTextEditor } from '../../../shared/components/molecules/RichTextEditor';
import { VisitAttachmentSection } from '../components/VisitAttachmentSection';
import {
  getVisit,
  getProjects,
  updateVisit,
  type VisitDetail,
  type ProjectDetail,
  type VisitStatus,
} from '../../../infrastructure/api/api.client';
import { decodeJwt } from '../../../core/utils/jwt.utils';
import { useTranslation } from 'react-i18next';

type Tab = 'details' | 'notes' | 'attachments';

export function VisitDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t } = useTranslation('visits');

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [visit, setVisit] = useState<VisitDetail | null>(null);
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('details');

  // Notes tab state
  const [notesValue, setNotesValue] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);

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
      setError(t('common:messages.sessionExpired'));
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const visitData = await getVisit(id, companyId);
      setVisit(visitData);
      setNotesValue(visitData.inspection_notes || '');

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
      setError(err instanceof Error ? err.message : t('errorLoading'));
    } finally {
      setLoading(false);
    }
  }, [id, getCompanyId]);

  useEffect(() => {
    fetchVisit();
  }, [fetchVisit]);

  const handleSaveNotes = async () => {
    if (!id || !visit) return;

    const companyId = getCompanyId();
    if (!companyId) {
      setError(t('common:messages.sessionExpired'));
      return;
    }

    try {
      setSavingNotes(true);
      setError(null);
      await updateVisit(id, { inspection_notes: notesValue }, companyId);
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common:messages.errorLoading'));
    } finally {
      setSavingNotes(false);
    }
  };

  const statusColors: Record<VisitStatus, string> = {
    planning: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    in_review: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    inspection_required: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    visited: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'details', label: t('details') },
    { key: 'notes', label: t('notes') },
    { key: 'attachments', label: t('attachments') },
  ];

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
            'pt-5',
            'transition-all duration-500 ease-out',
            isSidebarOpen ? 'lg:ml-64' : 'lg:ml-0'
          )}
        >
          <div className="p-6 flex items-center justify-center">
            <Text variant="muted">{t('loadingVisit')}</Text>
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
            'pt-5',
            'transition-all duration-500 ease-out',
            isSidebarOpen ? 'lg:ml-64' : 'lg:ml-0'
          )}
        >
          <div className="p-6">
            <div className="p-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg mb-4">
              {error}
            </div>
            <Button variant="secondary" onClick={() => navigate('/visits')}>
              {t('backToVisits')}
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
          'pt-5',
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
                  {t('project')}: {project.name}
                </Text>
              )}
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Tabs */}
          <div className="border-b border-[color:var(--border)] mb-6">
            <nav className="flex gap-6" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    'pb-3 text-sm font-medium border-b-2 transition-colors',
                    activeTab === tab.key
                      ? 'border-[color:var(--primary)] text-[color:var(--primary)]'
                      : 'border-transparent text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] hover:border-[color:var(--border)]'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'details' && (
            <div className="bg-[color:var(--card)] rounded-lg border border-[color:var(--border)] p-6">
              <Heading variant="h3" className="mb-4">{t('visitInformation')}</Heading>
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
                      {t(`status.${visit?.status}`)}
                    </span>
                  </div>
                  <div>
                    <Text variant="muted" className="text-xs mb-1">{t('visitDate')}</Text>
                    <Text variant="default">
                      {visit?.visit_date
                        ? new Date(visit.visit_date).toLocaleDateString()
                        : '\u2014'}
                    </Text>
                  </div>
                  <div>
                    <Text variant="muted" className="text-xs mb-1">{t('visitTime')}</Text>
                    <Text variant="default">
                      {visit?.visit_time
                        ? visit.visit_time.slice(0, 5)
                        : '\u2014'}
                    </Text>
                  </div>
                  <div>
                    <Text variant="muted" className="text-xs mb-1">{t('common:table.created')}</Text>
                    <Text variant="default">
                      {visit?.created_at
                        ? new Date(visit.created_at).toLocaleDateString()
                        : '\u2014'}
                    </Text>
                  </div>
                </div>

                {visit?.description && (
                  <div>
                    <Text variant="muted" className="text-xs mb-1">{t('description')}</Text>
                    <Text variant="default">{visit.description}</Text>
                  </div>
                )}

                {/* Cost Estimates Display */}
                {(visit?.estimated_materials_cost || visit?.estimated_labor_cost || visit?.estimated_total_cost) && (
                  <div className="border-t border-[color:var(--border)] pt-4 mt-4">
                    <Text variant="muted" className="text-xs mb-2">{t('costEstimates')}</Text>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {visit?.estimated_materials_cost && (
                        <div>
                          <Text variant="muted" className="text-xs">{t('materials')}</Text>
                          <Text variant="default" className="font-medium">
                            ${parseFloat(visit.estimated_materials_cost).toFixed(2)}
                          </Text>
                        </div>
                      )}
                      {visit?.estimated_labor_cost && (
                        <div>
                          <Text variant="muted" className="text-xs">{t('labor')}</Text>
                          <Text variant="default" className="font-medium">
                            ${parseFloat(visit.estimated_labor_cost).toFixed(2)}
                          </Text>
                        </div>
                      )}
                      {visit?.estimated_total_cost && (
                        <div>
                          <Text variant="muted" className="text-xs">{t('total')}</Text>
                          <Text variant="default" className="font-medium">
                            ${parseFloat(visit.estimated_total_cost).toFixed(2)}
                          </Text>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="bg-[color:var(--card)] rounded-lg border border-[color:var(--border)] p-6">
              <div className="flex items-center justify-between mb-4">
                <Heading variant="h3">{t('inspectionNotes')}</Heading>
                <div className="flex items-center gap-3">
                  {notesSaved && (
                    <Text size="sm" className="text-green-600 dark:text-green-400">
                      {t('saved')}
                    </Text>
                  )}
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSaveNotes}
                    disabled={savingNotes}
                  >
                    {savingNotes ? t('savingNotes') : t('saveNotes')}
                  </Button>
                </div>
              </div>
              <RichTextEditor
                value={notesValue}
                onChange={setNotesValue}
                placeholder={t('notesPlaceholder')}
                disabled={savingNotes}
              />
            </div>
          )}

          {activeTab === 'attachments' && id && (
            <div className="bg-[color:var(--card)] rounded-lg border border-[color:var(--border)] p-6">
              <VisitAttachmentSection visitId={id} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
