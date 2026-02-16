import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Header } from '../../../shared/components/organisms/Header';
import { Sidebar } from '../../../shared/components/organisms/Sidebar';
import { RightSidebar } from '../../../shared/components/organisms/RightSidebar';
import { Table, type TableColumn } from '../../../shared/components/organisms/Table';
import { useAuth } from '../../../shared/hooks/useAuth';
import { Heading } from '../../../shared/components/atoms/Heading';
import { Text } from '../../../shared/components/atoms/Text';
import { Button } from '../../../shared/components/atoms/Button';
import { cn } from '../../../core/utils/cn';
import {
  getVisits,
  getProjects,
  type VisitDetail,
  type ProjectDetail,
  type VisitStatus
} from '../../../infrastructure/api/api.client';
import { decodeJwt } from '../../../core/utils/jwt.utils';
import { CreateVisitForm, CreateVisitFormFooter } from '../components/CreateVisitForm';

export function VisitsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectIdFromUrl = searchParams.get('project_id');

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [visits, setVisits] = useState<VisitDetail[]>([]);
  const [projects, setProjects] = useState<ProjectDetail[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projectIdFromUrl || '');
  const [selectedStatus, setSelectedStatus] = useState<VisitStatus | ''>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Get company_id from JWT token
  const getCompanyId = useCallback((): string | null => {
    if (!user?.access_token) return null;
    const payload = decodeJwt(user.access_token);
    return payload?.company_id || null;
  }, [user]);

  // Fetch projects function
  const fetchProjects = useCallback(async () => {
    const companyId = getCompanyId();
    if (!companyId) {
      setError('Company ID not found. Please log in again.');
      setLoading(false);
      return;
    }

    try {
      const data = await getProjects({
        company_id: companyId,
        skip: 0,
        limit: 1000,
        include_details: true,
        include_creator: true,
      });
      setProjects(data);
    } catch (err) {
      console.error('Failed to load projects:', err);
    }
  }, [getCompanyId]);

  // Fetch visits function
  const fetchVisits = useCallback(async () => {
    const companyId = getCompanyId();
    if (!companyId) {
      setError('Company ID not found. Please log in again.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const params: any = {
        company_id: companyId,
        skip: 0,
        limit: 1000,
        include_details: true,
      };

      if (selectedProjectId) {
        params.project_id = selectedProjectId;
      }

      if (selectedStatus) {
        params.status = selectedStatus;
      }

      const data = await getVisits(params);
      setVisits(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load visits');
    } finally {
      setLoading(false);
    }
  }, [getCompanyId, selectedProjectId, selectedStatus]);

  // Fetch projects and visits in parallel on mount
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchProjects(), fetchVisits()]);
    };
    loadData();
  }, [fetchProjects, fetchVisits]);

  // Table columns - simplified to 4 columns
  const columns: TableColumn<VisitDetail>[] = useMemo(
    () => [
      {
        key: 'title',
        label: 'Title',
        span: 4,
        render: (visit) => (
          <Text variant="default" className="font-medium">
            {visit.title}
          </Text>
        ),
      },
      {
        key: 'project',
        label: 'Project',
        span: 3,
        render: (visit) => {
          const project = projects.find((p) => p.id === visit.project_id);
          return (
            <Text variant="muted" size="sm">
              {project?.name || 'Unknown Project'}
            </Text>
          );
        },
      },
      {
        key: 'status',
        label: 'Status',
        span: 2,
        render: (visit) => {
          const statusColors: Record<VisitStatus, string> = {
            planning: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
            in_review: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
            approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
            inspection_required: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
            visited: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
          };
          return (
            <span
              className={cn(
                'px-2 py-1 rounded-full text-xs font-medium',
                statusColors[visit.status]
              )}
            >
              {visit.status.replace('_', ' ').toUpperCase()}
            </span>
          );
        },
      },
      {
        key: 'visit_date',
        label: 'Visit Date',
        span: 3,
        render: (visit) => (
          <Text variant="muted" size="sm">
            {visit.visit_date ? new Date(visit.visit_date).toLocaleDateString() : '—'}
          </Text>
        ),
      },
    ],
    [projects]
  );

  // Navigate to visit detail page on row click
  const handleRowClick = useCallback((visit: VisitDetail) => {
    navigate(`/visits/${visit.id}`);
  }, [navigate]);

  const handleCreateClick = useCallback(() => {
    setIsRightSidebarOpen(true);
  }, []);

  const handleSuccess = useCallback(() => {
    setIsRightSidebarOpen(false);
    fetchVisits();
  }, [fetchVisits]);

  const handleCancel = useCallback(() => {
    setIsRightSidebarOpen(false);
  }, []);

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
          <div className="flex items-center justify-between mb-6">
            <Heading variant="h1">Visits</Heading>
            <Button onClick={handleCreateClick} variant="primary">
              Create Visit
            </Button>
          </div>

          {/* Filters */}
          <div className="mb-6 flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2 text-[color:var(--foreground)]">
                Filter by Project
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full px-3 py-2 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--foreground)]"
              >
                <option value="">All Projects</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2 text-[color:var(--foreground)]">
                Filter by Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as VisitStatus | '')}
                className="w-full px-3 py-2 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--foreground)]"
              >
                <option value="">All Statuses</option>
                <option value="planning">Planning</option>
                <option value="in_review">In Review</option>
                <option value="approved">Approved</option>
                <option value="inspection_required">Inspection Required</option>
                <option value="visited">Visited</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg">
              {error}
            </div>
          )}

          <Table
            columns={columns}
            data={visits}
            getRowId={(visit) => visit.id}
            loading={loading}
            error={error}
            emptyMessage="No visits found"
            onRowClick={handleRowClick}
            selectable={false}
          />
        </div>
      </main>

      <RightSidebar
        isOpen={isRightSidebarOpen}
        onClose={handleCancel}
        title="Create Visit"
        footer={
          <CreateVisitFormFooter
            loading={formLoading}
            onCancel={handleCancel}
          />
        }
      >
        <CreateVisitForm
          projects={projects}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          onLoadingChange={setFormLoading}
        />
      </RightSidebar>
    </div>
  );
}
