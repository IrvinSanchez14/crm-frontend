import { memo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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

  // Menu items configuration
  const menuItems: SidebarItem[] = [
    {
      id: 'clients',
      label: 'Clients',
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
  ];

  // Handle menu item click
  const handleItemClick = useCallback(
    (item: SidebarItem) => {
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
    [navigate, onClose]
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
          // Mobile: slide in from left when open, hidden when closed
          // Desktop: slide in from left when open, hidden when closed
          isOpen ? 'translate-x-0' : '-translate-x-full',
          className
        )}
        role="navigation"
        aria-label="Main navigation"
      >


        {/* Sidebar Content */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {menuItems.map((item) => (
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
                >
                  {item.icon && (
                    <span className="flex-shrink-0 text-[color:var(--muted-foreground)]">
                      {item.icon}
                    </span>
                  )}
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
});

Sidebar.displayName = 'Sidebar';

