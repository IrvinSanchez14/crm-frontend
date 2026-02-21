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
import { 
  getProjectCategories,
  type ProjectCategory
} from '../../../infrastructure/api/api.client';
import { decodeJwt } from '../../../core/utils/jwt.utils';
import { CreateProjectCategoryForm } from '../components/CreateProjectCategoryForm';
import { EditProjectCategoryForm } from '../components/EditProjectCategoryForm';

export function ProjectCategoriesPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [rightSidebarMode, setRightSidebarMode] = useState<'create' | 'edit'>('create');
  const [selectedCategory, setSelectedCategory] = useState<ProjectCategory | null>(null);
  const [categories, setCategories] = useState<ProjectCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());

  // Get company_id from JWT token
  const getCompanyId = useCallback((): string | null => {
    if (!user?.access_token) return null;
    const payload = decodeJwt(user.access_token);
    return payload?.company_id || null;
  }, [user]);

  // Fetch categories function
  const fetchCategories = useCallback(async () => {
    const companyId = getCompanyId();
    if (!companyId) {
      setError('Company ID not found. Please log in again.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getProjectCategories({
        company_id: companyId,
        skip: 0,
        limit: 1000,
        active_only: false,
      });
      setCategories(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, [getCompanyId]);

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

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
    setSelectedCategory(null);
    setIsRightSidebarOpen(true);
  }, []);

  const openEditCategory = useCallback((category: ProjectCategory) => {
    setRightSidebarMode('edit');
    setSelectedCategory(category);
    setIsRightSidebarOpen(true);
  }, []);

  const closeRightSidebar = useCallback(() => {
    setIsRightSidebarOpen(false);
    setSelectedCategory(null);
  }, []);

  // Handle successful category creation
  const handleCategoryCreated = useCallback(() => {
    closeRightSidebar();
    // Refresh categories list
    fetchCategories();
  }, [closeRightSidebar, fetchCategories]);

  // Format date
  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });
  }, []);

  // Define table columns
  const columns: TableColumn<ProjectCategory>[] = useMemo(
    () => [
      {
        key: 'name',
        label: 'Name',
        span: 4,
        render: (category, isSelected) => (
          <div className="flex items-center gap-2">
            <Text
              size="sm"
              className={cn(
                'truncate',
                isSelected ? 'font-semibold dark:text-gray-100' : 'font-normal dark:text-gray-200',
                '[color:color-mix(in_oklab,var(--color-black)_100%,transparent)]'
              )}
            >
              {category.name}
            </Text>
            {!category.is_active && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                Inactive
              </span>
            )}
          </div>
        ),
      },
      {
        key: 'description',
        label: 'Description',
        span: 5,
        render: (category, _isSelected) => (
          <Text
            size="sm"
            className={cn(
              'truncate',
              'dark:text-gray-300',
              '[color:color-mix(in_oklab,var(--color-black)_100%,transparent)]'
            )}
          >
            {category.description || <span className="text-gray-400 dark:text-gray-500">—</span>}
          </Text>
        ),
      },
      {
        key: 'created_at',
        label: 'Created',
        span: 2,
        render: (category, _isSelected) => (
          <Text
            size="sm"
            className={cn(
              'truncate',
              'dark:text-gray-300',
              '[color:color-mix(in_oklab,var(--color-black)_100%,transparent)]'
            )}
          >
            {formatDate(category.created_at)}
          </Text>
        ),
      },
      {
        key: 'actions',
        label: 'Actions',
        span: 1,
        align: 'right',
        render: (category, _isSelected) => (
          <button
            onClick={() => openEditCategory(category)}
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-[color:var(--muted)] transition-colors"
            title="Edit category"
          >
            <svg
              className="w-4 h-4 text-[color:var(--muted-foreground)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
        ),
      },
    ],
    [formatDate, openEditCategory]
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
          <Heading level={1}>Project Categories</Heading>
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

        {/* Gmail-like Table Component */}
        <Table
          columns={columns}
          data={categories}
          getRowId={(category) => category.id}
          loading={loading}
          error={error}
          emptyMessage="No categories found"
          selectedRows={selectedCategories}
          onSelectionChange={setSelectedCategories}
          selectable={true}
        />

        {/* Footer Info */}
        {!loading && !error && categories.length > 0 && (
          <div className="mt-4 flex items-center justify-between px-4">
            <Text size="sm" variant="muted">
              {selectedCategories.size > 0
                ? `${selectedCategories.size} of ${categories.length} selected`
                : `${categories.length} categor${categories.length !== 1 ? 'ies' : 'y'}`}
            </Text>
          </div>
        )}
      </div>

      {/* Right Sidebar for Category Creation/Edit */}
      <RightSidebar
        isOpen={isRightSidebarOpen}
        onClose={closeRightSidebar}
        title={rightSidebarMode === 'create' ? 'Create Category' : `Edit: ${selectedCategory?.name}`}
      >
        {rightSidebarMode === 'create' ? (
          <CreateProjectCategoryForm onSuccess={handleCategoryCreated} onCancel={closeRightSidebar} />
        ) : selectedCategory ? (
          <EditProjectCategoryForm category={selectedCategory} onSuccess={handleCategoryCreated} onCancel={closeRightSidebar} />
        ) : null}
      </RightSidebar>
    </div>
  );
}

