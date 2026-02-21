/**
 * Rendering Report Page
 * Shows a filterable report of all renderings with totals per status.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Header } from '../../../shared/components/organisms/Header';
import { Sidebar } from '../../../shared/components/organisms/Sidebar';
import { useAuth } from '../../../shared/hooks/useAuth';
import { Heading } from '../../../shared/components/atoms/Heading';
import { Text } from '../../../shared/components/atoms/Text';
import { cn } from '../../../core/utils/cn';
import {
  getRenderings,
  generateRenderingPDF,
  type RenderingDetail,
  type RenderingStatus,
} from '../../../infrastructure/api/api.client';
import { decodeJwt } from '../../../core/utils/jwt.utils';
import { Button } from '../../../shared/components/atoms/Button';

const formatCurrency = (amount: string | number | null) => {
  if (amount === null || amount === undefined) return '$0.00';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(num);
};

const renderingStatusColors: Record<RenderingStatus, string> = {
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  sent: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

const ALL_STATUSES: RenderingStatus[] = ['draft', 'sent', 'approved', 'rejected'];

export function RenderingReportPage() {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [renderings, setRenderings] = useState<RenderingDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<RenderingStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [generating, setGenerating] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ url: string; fileName: string } | null>(null);

  const getCompanyId = useCallback((): string | null => {
    if (!user?.access_token) return null;
    const payload = decodeJwt(user.access_token);
    return payload?.company_id || null;
  }, [user]);

  const fetchData = useCallback(async () => {
    const companyId = getCompanyId();
    if (!companyId) {
      setError('Company ID not found. Please log in again.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const renderingsData = await getRenderings({
        company_id: companyId,
        skip: 0,
        limit: 1000,
      });

      setRenderings(renderingsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load report data');
    } finally {
      setLoading(false);
    }
  }, [getCompanyId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtered renderings
  const filtered = useMemo(() => {
    let result = renderings;
    if (statusFilter !== 'all') {
      result = result.filter((r) => r.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          (r.description && r.description.toLowerCase().includes(q)),
      );
    }
    return result;
  }, [renderings, statusFilter, searchQuery]);

  // Summary stats
  const summary = useMemo(() => {
    const byStatus: Record<string, { count: number; total: number }> = {};
    for (const s of ALL_STATUSES) {
      byStatus[s] = { count: 0, total: 0 };
    }
    let grandTotal = 0;
    for (const r of filtered) {
      const amount = parseFloat(r.items?.reduce((sum, item) => sum + (parseFloat(item.total || item.subtotal || '0')), 0).toString()) || 0;
      grandTotal += amount;
      if (byStatus[r.status]) {
        byStatus[r.status].count += 1;
        byStatus[r.status].total += amount;
      }
    }
    return { byStatus, grandTotal, count: filtered.length };
  }, [filtered]);

  const handleDownloadPDF = async (rendering: RenderingDetail) => {
    const companyId = getCompanyId();
    if (!companyId) return;
    try {
      setGenerating(`pdf-${rendering.id}`);
      const { blob, fileName } = await generateRenderingPDF(rendering.id, companyId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Failed to generate PDF');
    } finally {
      setGenerating(null);
    }
  };

  const handlePreviewPDF = async (rendering: RenderingDetail) => {
    const companyId = getCompanyId();
    if (!companyId) return;
    try {
      setGenerating(`preview-${rendering.id}`);
      const { blob, fileName } = await generateRenderingPDF(rendering.id, companyId);
      const url = URL.createObjectURL(blob);
      setPreview({ url, fileName });
    } catch {
      setError('Failed to generate preview');
    } finally {
      setGenerating(null);
    }
  };

  const closePreview = () => {
    if (preview) {
      URL.revokeObjectURL(preview.url);
      setPreview(null);
    }
  };

  const downloadFromPreview = () => {
    if (!preview) return;
    const a = document.createElement('a');
    a.href = preview.url;
    a.download = preview.fileName;
    a.click();
  };

  const getRenderingTotal = (rendering: RenderingDetail): number => {
    return rendering.items?.reduce((sum, item) => sum + (parseFloat(item.total || item.subtotal || '0')), 0) || 0;
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
          <div className="mb-6">
            <Heading variant="h1">Rendering Report</Heading>
            <Text variant="muted" size="sm">Overview of all renderings by status and totals</Text>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg">
              {error}
            </div>
          )}

          {/* Summary cards */}
          {!loading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
              {/* Grand total card */}
              <div className="col-span-2 sm:col-span-3 lg:col-span-1 bg-[color:var(--card)] rounded-lg border border-[color:var(--border)] p-4">
                <Text variant="muted" className="text-xs">Total ({summary.count})</Text>
                <Text className="font-bold text-lg">{formatCurrency(summary.grandTotal)}</Text>
              </div>
              {ALL_STATUSES.map((status) => {
                const s = summary.byStatus[status];
                if (s.count === 0) return null;
                return (
                  <div
                    key={status}
                    className="bg-[color:var(--card)] rounded-lg border border-[color:var(--border)] p-4 cursor-pointer hover:border-[color:var(--primary)] transition-colors"
                    onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={cn(
                          'inline-block px-1.5 py-0.5 rounded-full text-[10px] font-medium',
                          renderingStatusColors[status],
                        )}
                      >
                        {status.toUpperCase()}
                      </span>
                      <Text variant="muted" className="text-xs">({s.count})</Text>
                    </div>
                    <Text className="font-semibold">{formatCurrency(s.total)}</Text>
                  </div>
                );
              })}
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
            {/* Search */}
            <div className="relative flex-1 w-full sm:max-w-xs">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[color:var(--muted-foreground)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title or description..."
                className="w-full pl-9 pr-3 py-2 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--foreground)] text-sm"
              />
            </div>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as RenderingStatus | 'all')}
              className="px-3 py-2 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--foreground)] text-sm"
            >
              <option value="all">All Statuses</option>
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Text variant="muted">Loading report...</Text>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <svg className="w-12 h-12 mb-3 text-[color:var(--muted-foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <Text variant="muted">No renderings found</Text>
              {statusFilter !== 'all' && (
                <button
                  onClick={() => setStatusFilter('all')}
                  className="mt-2 text-sm text-[color:var(--primary)] hover:underline"
                >
                  Clear filter
                </button>
              )}
            </div>
          ) : (
            <div className="bg-[color:var(--card)] rounded-lg border border-[color:var(--border)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[color:var(--muted)]/30 border-b border-[color:var(--border)]">
                      <th className="text-left px-4 py-3 font-medium text-[color:var(--muted-foreground)]">Title</th>
                      <th className="text-left px-4 py-3 font-medium text-[color:var(--muted-foreground)]">Description</th>
                      <th className="text-center px-4 py-3 font-medium text-[color:var(--muted-foreground)]">Status</th>
                      <th className="text-center px-4 py-3 font-medium text-[color:var(--muted-foreground)]">Items</th>
                      <th className="text-center px-4 py-3 font-medium text-[color:var(--muted-foreground)]">Images</th>
                      <th className="text-right px-4 py-3 font-medium text-[color:var(--muted-foreground)]">Total</th>
                      <th className="text-left px-4 py-3 font-medium text-[color:var(--muted-foreground)]">Created</th>
                      <th className="text-center px-4 py-3 font-medium text-[color:var(--muted-foreground)]">Export</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((rendering) => (
                      <tr key={rendering.id} className="border-b border-[color:var(--border)] last:border-b-0 hover:bg-[color:var(--muted)]/20 transition-colors">
                        <td className="px-4 py-3 font-medium">{rendering.title}</td>
                        <td className="px-4 py-3 text-[color:var(--muted-foreground)] max-w-xs truncate">
                          {rendering.description || '\u2014'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={cn(
                              'inline-block px-2 py-0.5 rounded-full text-xs font-medium',
                              renderingStatusColors[rendering.status],
                            )}
                          >
                            {rendering.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">{rendering.items?.length || 0}</td>
                        <td className="px-4 py-3 text-center">{rendering.images?.length || 0}</td>
                        <td className="px-4 py-3 text-right font-semibold">
                          {formatCurrency(getRenderingTotal(rendering))}
                        </td>
                        <td className="px-4 py-3 text-[color:var(--muted-foreground)]">
                          {new Date(rendering.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handlePreviewPDF(rendering); }}
                              disabled={generating === `preview-${rendering.id}`}
                              className={cn(
                                'inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium',
                                'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50',
                                'transition-colors',
                                generating === `preview-${rendering.id}` && 'opacity-50 cursor-not-allowed',
                              )}
                              title="Preview PDF"
                            >
                              {generating === `preview-${rendering.id}` ? (
                                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                              ) : (
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleDownloadPDF(rendering); }}
                              disabled={generating === `pdf-${rendering.id}`}
                              className={cn(
                                'inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium',
                                'bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50',
                                'transition-colors',
                                generating === `pdf-${rendering.id}` && 'opacity-50 cursor-not-allowed',
                              )}
                              title="Download PDF"
                            >
                              {generating === `pdf-${rendering.id}` ? (
                                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                              ) : (
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              )}
                              PDF
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-[color:var(--muted)]/20 border-t border-[color:var(--border)]">
                      <td colSpan={5} className="px-4 py-3 text-right font-medium text-[color:var(--muted-foreground)]">
                        Total ({filtered.length} rendering{filtered.length !== 1 ? 's' : ''})
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-lg">{formatCurrency(summary.grandTotal)}</td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========== PDF Preview Modal ========== */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={closePreview} />
          <div className="relative bg-[color:var(--card)] rounded-lg border border-[color:var(--border)] shadow-xl w-full max-w-5xl h-[90vh] mx-4 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[color:var(--border)]">
              <div>
                <Text className="font-semibold">{preview.fileName}</Text>
                <Text variant="muted" size="sm">PDF Preview</Text>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="primary" size="sm" onClick={downloadFromPreview}>
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download
                  </span>
                </Button>
                <Button variant="secondary" size="sm" onClick={closePreview}>
                  Close
                </Button>
              </div>
            </div>
            {/* PDF viewer */}
            <div className="flex-1 overflow-hidden">
              <iframe
                src={preview.url}
                title="Rendering PDF Preview"
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
