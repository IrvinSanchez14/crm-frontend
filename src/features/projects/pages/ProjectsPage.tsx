import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../../shared/components/organisms/Header';
import { Sidebar } from '../../../shared/components/organisms/Sidebar';
import { RightSidebar } from '../../../shared/components/organisms/RightSidebar';
import { Table, type TableColumn } from '../../../shared/components/organisms/Table';
import { useAuth } from '../../../shared/hooks/useAuth';
import { Heading } from '../../../shared/components/atoms/Heading';
import { Text } from '../../../shared/components/atoms/Text';
import { Button } from '../../../shared/components/atoms/Button';
import { cn } from '../../../core/utils/cn';
import { getProjects, getClients, type ProjectDetail, type Client } from '../../../infrastructure/api/api.client';
import { decodeJwt } from '../../../core/utils/jwt.utils';
import { CreateProjectForm } from '../components/CreateProjectForm';
import { ProjectDetailForm } from '../components/ProjectDetailForm';

export function ProjectsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [rightSidebarMode, setRightSidebarMode] = useState<'create' | 'detail'>('create');
  const [selectedProject, setSelectedProject] = useState<ProjectDetail | null>(null);
  const [projects, setProjects] = useState<ProjectDetail[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());

  // Get company_id from JWT token
  const getCompanyId = useCallback((): string | null => {
    if (!user?.access_token) return null;
    const payload = decodeJwt(user.access_token);
    return payload?.company_id || null;
  }, [user]);

  // Fetch clients function
  const fetchClients = useCallback(async () => {
    const companyId = getCompanyId();
    if (!companyId) {
      setError('Company ID not found. Please log in again.');
      setLoading(false);
      return;
    }

    try {
      const data = await getClients({
        company_id: companyId,
        skip: 0,
        limit: 1000,
      });
      setClients(data);
    } catch (err) {
      console.error('Failed to load clients:', err);
    }
  }, [getCompanyId]);

  // Fetch projects function
  const fetchProjects = useCallback(async () => {
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
        include_creator: true,
      };
      
      if (selectedClientId) {
        params.client_id = selectedClientId;
      }
      
      const data = await getProjects(params);
      setProjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, [getCompanyId, selectedClientId]);

  // Fetch clients on mount
  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Fetch projects when client filter changes
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Memoize logout handler to prevent unnecessary re-renders
  const handleLogout = useCallback(() => {
    logout();
    navigate('/login', { replace: true });
  }, [logout, navigate]);

  // Toggle sidebar
  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  // Right sidebar handlers
  const openRightSidebar = useCallback(() => {
    setRightSidebarMode('create');
    setSelectedProject(null);
    setIsRightSidebarOpen(true);
  }, []);

  const openProjectDetail = useCallback((project: ProjectDetail) => {
    setRightSidebarMode('detail');
    setSelectedProject(project);
    setIsRightSidebarOpen(true);
  }, []);

  const closeRightSidebar = useCallback(() => {
    setIsRightSidebarOpen(false);
    setSelectedProject(null);
  }, []);

  // Handle successful project creation
  const handleProjectCreated = useCallback(() => {
    closeRightSidebar();
    // Refresh projects list
    fetchProjects();
  }, [closeRightSidebar, fetchProjects]);

  // Handle client filter change
  const handleClientFilterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedClientId(e.target.value);
  }, []);

  // Format date
  const formatDate = useCallback((dateString: string | null) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });
  }, []);

  // Format currency
  const formatCurrency = useCallback((amount: string | null) => {
    if (!amount) return '—';
    const num = parseFloat(amount);
    if (isNaN(num)) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(num);
  }, []);

  // Format status
  const formatStatus = useCallback((status: string) => {
    const statusMap: Record<string, string> = {
      lead: 'Lead',
      quoted: 'Quoted',
      approved: 'Approved',
      in_progress: 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled',
      on_hold: 'On Hold',
    };
    return statusMap[status] || status;
  }, []);

  // Get status badge color
  const getStatusColor = useCallback((status: string) => {
    const colorMap: Record<string, string> = {
      lead: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      quoted: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      in_progress: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      completed: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      on_hold: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }, []);

  // Define table columns
  const columns: TableColumn<ProjectDetail>[] = useMemo(
    () => [
      {
        key: 'name',
        label: 'Project Name',
        span: 2,
      },
      {
        key: 'client',
        label: 'Client',
        span: 2,
        render: (project, _isSelected) => (
          <Text
            size="sm"
            className="truncate font-normal text-gray-700 dark:text-gray-300"
          >
            {project.client?.name || <span className="text-gray-400 dark:text-gray-500">—</span>}
          </Text>
        ),
      },
      {
        key: 'category',
        label: 'Category',
        span: 2,
        render: (project, _isSelected) => (
          <Text
            size="sm"
            className="truncate font-normal text-gray-700 dark:text-gray-300"
          >
            {project.category?.name || <span className="text-gray-400 dark:text-gray-500">—</span>}
          </Text>
        ),
      },
      {
        key: 'status',
        label: 'Status',
        span: 2,
        render: (project, _isSelected) => (
          <span
            className={cn(
              'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
              getStatusColor(project.status)
            )}
          >
            {formatStatus(project.status)}
          </span>
        ),
      },
      {
        key: 'estimated_budget',
        label: 'Budget',
        span: 1,
        render: (project, _isSelected) => (
          <Text
            size="sm"
            className="truncate font-normal text-gray-700 dark:text-gray-300"
          >
            {formatCurrency(project.estimated_budget)}
          </Text>
        ),
      },
      {
        key: 'start_date',
        label: 'Start Date',
        span: 1,
        render: (project, _isSelected) => (
          <Text
            size="sm"
            className="truncate font-normal text-gray-700 dark:text-gray-300"
          >
            {formatDate(project.start_date)}
          </Text>
        ),
      },
      {
        key: 'created_at',
        label: 'Created',
        span: 1,
        render: (project, _isSelected) => (
          <Text
            size="sm"
            className="truncate font-normal text-gray-700 dark:text-gray-300"
          >
            {formatDate(project.created_at)}
          </Text>
        ),
      },
      {
        key: 'actions',
        label: 'Actions',
        span: 1,
        align: 'center',
        render: (project, _isSelected) => (
          <button
            onClick={() => openProjectDetail(project)}
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-[color:var(--muted)] transition-colors"
            title="View project details"
          >
            <svg
              className="w-5 h-5 text-[color:var(--foreground)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>
        ),
      },
    ],
    [formatDate, formatCurrency, formatStatus, getStatusColor, openProjectDetail]
  );

  return (
    <div className="min-h-screen bg-[color:var(--background)]">
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      <Header
        userName={user?.name}
        onLogout={handleLogout}
        onMenuClick={toggleSidebar}
      />

      <div
        className={cn(
          'w-full pt-2',
          'transition-all duration-500 ease-out',
          isSidebarOpen ? 'lg:ml-64' : 'lg:ml-0'
        )}
      >
        <div className="mb-4 flex items-center justify-between px-4">
          <Heading level={1}>Projects</Heading>
          <div className="flex items-center gap-3">
            {/* Client Filter */}
            <select
              value={selectedClientId}
              onChange={handleClientFilterChange}
              className="px-3 py-2 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] text-sm"
            >
              <option value="">All Clients</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
            <Button
              onClick={openRightSidebar}
              variant="ghost"
              size="md"
              className="flex items-center gap-2 bg-[rgba(0,0,0,0.0775)] dark:bg-[rgba(255,255,255,0.0775)] hover:bg-[rgba(0,0,0,0.2)] dark:hover:bg-[rgba(255,255,255,0.2)]"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add
            </Button>
          </div>
        </div>

        {/* Gmail-like Table Component */}
        <Table
          columns={columns}
          data={projects}
          getRowId={(project) => project.id}
          loading={loading}
          error={error}
          emptyMessage="No projects found"
          selectedRows={selectedProjects}
          onSelectionChange={setSelectedProjects}
          selectable={true}
        />

        {/* Footer Info */}
        {!loading && !error && projects.length > 0 && (
          <div className="mt-4 flex items-center justify-between px-4">
            <Text size="sm" variant="muted">
              {selectedProjects.size > 0
                ? `${selectedProjects.size} of ${projects.length} selected`
                : `${projects.length} project${projects.length !== 1 ? 's' : ''}`}
              {selectedClientId && ` for ${clients.find(c => c.id === selectedClientId)?.name || 'selected client'}`}
            </Text>
          </div>
        )}
      </div>

      {/* Right Sidebar for Project Creation or Detail */}
      <RightSidebar
        isOpen={isRightSidebarOpen}
        onClose={closeRightSidebar}
        title={rightSidebarMode === 'create' ? 'Create Project' : `Project: ${selectedProject?.name}`}
      >
        {rightSidebarMode === 'create' ? (
          <CreateProjectForm onSuccess={handleProjectCreated} onCancel={closeRightSidebar} />
        ) : selectedProject ? (
          <ProjectDetailForm project={selectedProject} onSuccess={handleProjectCreated} onCancel={closeRightSidebar} />
        ) : null}
      </RightSidebar>
    </div>
  );
}

