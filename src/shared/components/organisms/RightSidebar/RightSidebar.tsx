/**
 * Right Sidebar Organism
 * Right-side sliding panel for forms and additional content
 */

import { memo, useEffect } from 'react';
import { cn } from '../../../../core/utils/cn';

export interface RightSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const RightSidebar = memo<RightSidebarProps>(
  ({ isOpen, onClose, title, children, className }) => {
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

    // Prevent body scroll when sidebar is open
    useEffect(() => {
      if (isOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }

      return () => {
        document.body.style.overflow = '';
      };
    }, [isOpen]);

    return (
      <>
        {/* Overlay */}
        {isOpen && (
          <div
            className={cn(
              'fixed top-16 left-0 right-0 bottom-0 z-40 bg-black/50',
              'transition-opacity duration-300 ease-out',
              isOpen ? 'opacity-100' : 'opacity-0'
            )}
            onClick={onClose}
            aria-hidden="true"
          />
        )}

        {/* Sidebar */}
        <aside
          className={cn(
            'fixed top-16 right-0 z-50',
            'h-[calc(100vh-4rem)] w-full sm:w-96',
            'bg-[color:var(--card)]',
            'shadow-xl',
            'transform transition-transform duration-300 ease-out',
            'flex flex-col',
            // Slide in from right when open, hidden when closed
            isOpen ? 'translate-x-0' : 'translate-x-full',
            className
          )}
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[color:var(--border)]">
            <h2 className="text-lg font-semibold text-[color:var(--foreground)]">{title}</h2>
            <button
              onClick={onClose}
              className={cn(
                'flex items-center justify-center',
                'w-8 h-8 rounded-lg',
                'text-[color:var(--muted-foreground)]',
                'hover:bg-[color:var(--muted)]',
                'hover:text-[color:var(--foreground)]',
                'transition-colors duration-200',
                'focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] focus:ring-offset-2',
                'active:scale-95'
              )}
              aria-label="Close sidebar"
              type="button"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">{children}</div>
        </aside>
      </>
    );
  }
);

RightSidebar.displayName = 'RightSidebar';

