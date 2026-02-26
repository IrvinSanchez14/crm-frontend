import { memo, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '../../../../core/utils/cn';
import type { SidebarProps, SidebarItem } from './Sidebar.types';

/**
 * Sidebar organism component
 * Left side navigation panel with menu items
 * Supports dark/light mode through CSS variables
 * Mobile-responsive with overlay and animations
 */
export const Sidebar = memo<SidebarProps>(({ isOpen, onClose, className }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Menu items configuration
  const menuItems: SidebarItem[] = [
    {
      id: 'clients',
      label: t('navigation.clients'),
      icon: (
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
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
      path: '/clients',
    },
    {
      id: 'projects',
      label: t('navigation.projects'),
      icon: (
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
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          />
        </svg>
      ),
      path: '/projects',
    },
    {
      id: 'project-categories',
      label: t('navigation.projectCategories'),
      icon: (
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
            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
          />
        </svg>
      ),
      path: '/project-categories',
    },
    {
      id: 'visits',
      label: t('navigation.visits'),
      icon: (
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
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          />
        </svg>
      ),
      path: '/visits',
    },
    {
      id: 'budgets',
      label: t('navigation.budgets'),
      icon: (
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
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
      path: '/budgets',
    },
    {
      id: 'renderings',
      label: t('navigation.renderings'),
      icon: (
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
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
      path: '/renderings',
    },
    {
      id: 'reports',
      label: t('navigation.reports'),
      icon: (
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
            d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
      children: [
        {
          id: 'reports-budgets',
          label: t('navigation.budgetReport'),
          path: '/reports/budgets',
        },
        {
          id: 'reports-renderings',
          label: t('reports:renderingReport'),
          path: '/reports/renderings',
        },
      ],
    },
  ];

  // Track expanded parent menus
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});

  const toggleMenu = useCallback((id: string) => {
    setExpandedMenus((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  // Handle menu item click
  const handleItemClick = useCallback(
    (item: SidebarItem) => {
      // If item has children, toggle expand instead of navigating
      if (item.children && item.children.length > 0) {
        toggleMenu(item.id);
        return;
      }
      if (item.path) {
        navigate(item.path);
      }
      if (item.onClick) {
        item.onClick();
      }
      // Close sidebar on mobile after navigation
      if (window.innerWidth < 1024) {
        onClose();
      }
    },
    [navigate, onClose, toggleMenu]
  );

  // ESC key handler
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isOpen) {
      // Only prevent scroll on mobile
      if (window.innerWidth < 1024) {
        document.body.style.overflow = 'hidden';
      }
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* Overlay - only visible on mobile, starts below header */}
      {isOpen && (
        <div
          className={cn(
            'fixed top-16 left-0 right-0 bottom-0 z-40 bg-black/50',
            'lg:hidden',
            'transition-opacity duration-500 ease-out',
            isOpen ? 'opacity-100' : 'opacity-0'
          )}
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar - starts below header */}
      <aside
        className={cn(
          'fixed top-16 left-0 z-50',
          'h-[calc(100vh-4rem)]',
          'w-56 lg:w-64',
          'bg-[color:var(--card)]',
          'shadow-xl lg:shadow-none',
          'transform transition-transform duration-500 ease-out',
          'flex flex-col',
          // Slide in/out based on isOpen
          isOpen ? 'translate-x-0' : '-translate-x-full',
          className
        )}
        role="navigation"
        aria-label="Main navigation"
      >


        {/* Sidebar Content */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {menuItems.map((item) => {
              const hasChildren = item.children && item.children.length > 0;
              const isExpanded = expandedMenus[item.id];

              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleItemClick(item)}
                    className={cn(
                      'w-full flex items-center gap-3',
                      'px-4 py-3 rounded-lg',
                      'text-left text-sm font-medium',
                      'text-[color:var(--foreground)]',
                      'hover:bg-[color:var(--muted)]',
                      'transition-colors duration-150',
                      'focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] focus:ring-offset-2',
                      'active:scale-[0.98]'
                    )}
                    aria-label={item.label}
                    aria-expanded={hasChildren ? isExpanded : undefined}
                  >
                    {item.icon && (
                      <span className="flex-shrink-0 text-[color:var(--muted-foreground)]">
                        {item.icon}
                      </span>
                    )}
                    <span className="flex-1">{item.label}</span>
                    {hasChildren && (
                      <svg
                        className={cn(
                          'w-4 h-4 text-[color:var(--muted-foreground)] transition-transform duration-200',
                          isExpanded && 'rotate-90'
                        )}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </button>

                  {/* Sub-menu */}
                  {hasChildren && isExpanded && (
                    <ul className="mt-1 ml-4 pl-4 border-l border-[color:var(--border)] space-y-1">
                      {item.children!.map((child) => (
                        <li key={child.id}>
                          <button
                            onClick={() => handleItemClick(child)}
                            className={cn(
                              'w-full flex items-center gap-3',
                              'px-3 py-2 rounded-lg',
                              'text-left text-sm',
                              'text-[color:var(--muted-foreground)]',
                              'hover:bg-[color:var(--muted)] hover:text-[color:var(--foreground)]',
                              'transition-colors duration-150',
                              'focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] focus:ring-offset-2',
                              'active:scale-[0.98]'
                            )}
                            aria-label={child.label}
                          >
                            {child.icon && (
                              <span className="flex-shrink-0">
                                {child.icon}
                              </span>
                            )}
                            <span>{child.label}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
});

Sidebar.displayName = 'Sidebar';

