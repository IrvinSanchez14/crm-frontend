/**
 * Reference Report Page
 * Manage customer references for company portfolio with CRUD operations and PDF download.
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Header } from '../../../shared/components/organisms/Header';
import { Sidebar } from '../../../shared/components/organisms/Sidebar';
import { useAuth } from '../../../shared/hooks/useAuth';
import { Heading } from '../../../shared/components/atoms/Heading';
import { Text } from '../../../shared/components/atoms/Text';
import { Button } from '../../../shared/components/atoms/Button';
import { cn } from '../../../core/utils/cn';
import {
  getReferences,
  createReference,
  updateReference,
  deleteReference,
  generateReferencePDF,
  type Reference,
  type ReferenceCreate,
  type ReferenceUpdate,
} from '../../../infrastructure/api/api.client';
import { decodeJwt } from '../../../core/utils/jwt.utils';

interface ReferenceFormData {
  client_name: string;
  location: string;
  project_description: string;
  project_value: string;
  phone: string;
}

const emptyForm: ReferenceFormData = {
  client_name: '',
  location: '',
  project_description: '',
  project_value: '',
  phone: '',
};

export function ReferenceReportPage() {
  const { user, logout } = useAuth();
  const { t } = useTranslation('reports');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [references, setReferences] = useState<Reference[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ReferenceFormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const getCompanyId = useCallback((): string | null => {
    if (!user?.access_token) return null;
    const payload = decodeJwt(user.access_token);
    return payload?.company_id || null;
  }, [user]);

  const fetchReferences = useCallback(async () => {
    const companyId = getCompanyId();
    if (!companyId) {
      setError('Company ID not found. Please log in again.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getReferences({ company_id: companyId, skip: 0, limit: 1000 });
      setReferences(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load references');
    } finally {
      setLoading(false);
    }
  }, [getCompanyId]);

  useEffect(() => {
    fetchReferences();
  }, [fetchReferences]);

  // Auto-clear success message
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleOpenAddForm = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setShowForm(true);
  };

  const handleOpenEditForm = (ref: Reference) => {
    setFormData({
      client_name: ref.client_name,
      location: ref.location,
      project_description: ref.project_description,
      project_value: ref.project_value,
      phone: ref.phone || '',
    });
    setEditingId(ref.id);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(emptyForm);
  };

  const handleFormChange = (field: keyof ReferenceFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const companyId = getCompanyId();
    if (!companyId) return;

    try {
      setSubmitting(true);
      setError(null);

      if (editingId) {
        const updateData: ReferenceUpdate = {
          client_name: formData.client_name,
          location: formData.location,
          project_description: formData.project_description,
          project_value: formData.project_value,
          phone: formData.phone || undefined,
        };
        await updateReference(editingId, updateData, companyId);
        setSuccessMessage(t('referenceUpdated'));
      } else {
        const createData: ReferenceCreate = {
          client_name: formData.client_name,
          location: formData.location,
          project_description: formData.project_description,
          project_value: formData.project_value,
          phone: formData.phone || undefined,
          company_id: companyId,
        };
        await createReference(createData);
        setSuccessMessage(t('referenceAdded'));
      }

      handleCloseForm();
      await fetchReferences();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save reference');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const companyId = getCompanyId();
    if (!companyId) return;

    try {
      setError(null);
      await deleteReference(id, companyId);
      setDeleteConfirmId(null);
      setSuccessMessage(t('referenceDeleted'));
      await fetchReferences();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete reference');
    }
  };

  const handlePreviewPdf = async () => {
    const companyId = getCompanyId();
    if (!companyId) return;

    try {
      setGeneratingPdf(true);
      setError(null);
      const { blob } = await generateReferencePDF(companyId);
      // Revoke previous URL if any
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate PDF');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleDownloadPdf = async () => {
    const companyId = getCompanyId();
    if (!companyId) return;

    try {
      setGeneratingPdf(true);
      setError(null);
      const { blob, fileName } = await generateReferencePDF(companyId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate PDF');
    } finally {
      setGeneratingPdf(false);
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

      <div
        className={cn(
          'pt-2',
          'transition-all duration-500 ease-out',
          isSidebarOpen ? 'lg:ml-64' : 'lg:ml-0',
        )}
      >
        <div className="px-4 py-5">
          {/* Page header */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <Heading variant="h1">{t('referenceReport')}</Heading>
              <Text variant="muted" size="sm">{t('referenceReportDescription')}</Text>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={handleOpenAddForm}
              >
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {t('addReference')}
                </span>
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handlePreviewPdf}
                disabled={generatingPdf || references.length === 0}
              >
                <span className="flex items-center gap-1.5">
                  {generatingPdf ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                  {t('preview')} PDF
                </span>
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleDownloadPdf}
                disabled={generatingPdf || references.length === 0}
              >
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {t('downloadPdf')}
                </span>
              </Button>
            </div>
          </div>

          {/* Success message */}
          {successMessage && (
            <div className="mb-4 p-4 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-lg">
              {successMessage}
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg">
              {error}
            </div>
          )}

          {/* Add/Edit Form */}
          {showForm && (
            <div className="mb-6 bg-[color:var(--card)] rounded-lg border border-[color:var(--border)] p-6">
              <Heading variant="h3" className="mb-4">
                {editingId ? t('editReference') : t('addReference')}
              </Heading>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[color:var(--foreground)] mb-1">
                      {t('clientName')} *
                    </label>
                    <input
                      type="text"
                      value={formData.client_name}
                      onChange={(e) => handleFormChange('client_name', e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--foreground)] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[color:var(--foreground)] mb-1">
                      {t('location')} *
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => handleFormChange('location', e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--foreground)] text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-[color:var(--foreground)] mb-1">
                      {t('projectDescription')} *
                    </label>
                    <textarea
                      value={formData.project_description}
                      onChange={(e) => handleFormChange('project_description', e.target.value)}
                      required
                      rows={3}
                      className="w-full px-3 py-2 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--foreground)] text-sm resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[color:var(--foreground)] mb-1">
                      {t('projectValue')} *
                    </label>
                    <input
                      type="text"
                      value={formData.project_value}
                      onChange={(e) => handleFormChange('project_value', e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--foreground)] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[color:var(--foreground)] mb-1">
                      {t('phone')}
                    </label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => handleFormChange('phone', e.target.value)}
                      className="w-full px-3 py-2 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--foreground)] text-sm"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <Button type="submit" variant="primary" size="sm" disabled={submitting}>
                    {submitting ? t('loading') : editingId ? t('common:actions.save') : t('addReference')}
                  </Button>
                  <Button type="button" variant="secondary" size="sm" onClick={handleCloseForm}>
                    {t('common:actions.cancel')}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Text variant="muted">{t('loading')}</Text>
            </div>
          ) : references.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <svg className="w-12 h-12 mb-3 text-[color:var(--muted-foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <Text variant="muted">{t('noReferences')}</Text>
            </div>
          ) : (
            <div className="bg-[color:var(--card)] rounded-lg border border-[color:var(--border)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[color:var(--muted)]/30 border-b border-[color:var(--border)]">
                      <th className="text-left px-4 py-3 font-medium text-[color:var(--muted-foreground)]">{t('clientName')}</th>
                      <th className="text-left px-4 py-3 font-medium text-[color:var(--muted-foreground)]">{t('location')}</th>
                      <th className="text-left px-4 py-3 font-medium text-[color:var(--muted-foreground)]">{t('projectDescription')}</th>
                      <th className="text-right px-4 py-3 font-medium text-[color:var(--muted-foreground)]">{t('projectValue')}</th>
                      <th className="text-left px-4 py-3 font-medium text-[color:var(--muted-foreground)]">{t('phone')}</th>
                      <th className="text-center px-4 py-3 font-medium text-[color:var(--muted-foreground)]">{t('common:table.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {references.map((ref) => (
                      <tr key={ref.id} className="border-b border-[color:var(--border)] last:border-b-0 hover:bg-[color:var(--muted)]/20 transition-colors">
                        <td className="px-4 py-3 font-medium">{ref.client_name}</td>
                        <td className="px-4 py-3 text-[color:var(--muted-foreground)]">{ref.location}</td>
                        <td className="px-4 py-3 text-[color:var(--muted-foreground)] max-w-xs truncate">{ref.project_description}</td>
                        <td className="px-4 py-3 text-right font-semibold">{ref.project_value}</td>
                        <td className="px-4 py-3 text-[color:var(--muted-foreground)]">{ref.phone || '\u2014'}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditForm(ref)}
                              className={cn(
                                'inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium',
                                'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50',
                                'transition-colors',
                              )}
                              title={t('editReference')}
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              {t('common:actions.edit')}
                            </button>
                            {deleteConfirmId === ref.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleDelete(ref.id)}
                                  className={cn(
                                    'inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium',
                                    'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-400 dark:hover:bg-red-900/70',
                                    'transition-colors',
                                  )}
                                >
                                  {t('common:actions.confirm')}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteConfirmId(null)}
                                  className={cn(
                                    'inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium',
                                    'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600',
                                    'transition-colors',
                                  )}
                                >
                                  {t('common:actions.cancel')}
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmId(ref.id)}
                                className={cn(
                                  'inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium',
                                  'bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50',
                                  'transition-colors',
                                )}
                                title={t('deleteReference')}
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                {t('common:actions.delete')}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PDF Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 bg-black/60">
          <div className="absolute inset-0 bg-[color:var(--card)] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[color:var(--border)]">
              <Heading variant="h3">{t('pdfPreview')}</Heading>
              <div className="flex items-center gap-2">
                <Button variant="primary" size="sm" onClick={handleDownloadPdf}>
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {t('download')}
                  </span>
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    URL.revokeObjectURL(previewUrl);
                    setPreviewUrl(null);
                  }}
                  className="p-1.5 rounded-lg hover:bg-[color:var(--muted)] transition-colors text-[color:var(--muted-foreground)]"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex-1">
              <iframe
                src={previewUrl}
                className="w-full h-full"
                title="PDF Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
