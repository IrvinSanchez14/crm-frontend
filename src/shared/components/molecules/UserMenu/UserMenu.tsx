import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '../../../../core/utils/cn';
import type { UserMenuProps } from './UserMenu.types';

/**
 * UserMenu component displays a user icon with dropdown menu
 * Implements click-outside detection and keyboard navigation
 */
export const UserMenu = memo<UserMenuProps>(({ userName, onLogout, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleMenu = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleLogout = useCallback(() => {
    setIsOpen(false);
    onLogout();
  }, [onLogout]);

  // Click outside detection
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // ESC key handler
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  return (
    <div ref={menuRef} className={cn('relative', className)}>
      {/* User Icon Button */}
      <button
        onClick={toggleMenu}
        aria-label="User menu"
        aria-expanded={isOpen}
        aria-haspopup="true"
        className={cn(
          'flex items-center justify-center w-10 h-10 rounded-full',
          'bg-[rgba(93,94,97,0.295)] dark:bg-[rgba(144,144,148,0.295)] text-[color:var(--foreground)]',
          'hover:opacity-90 transition-opacity duration-200',
          'focus:outline-none'
        )}
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
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={cn(
            'absolute right-0 mt-2 w-56 rounded-lg shadow-lg',
            'bg-[color:var(--card)] border border-[color:var(--border)]',
            'overflow-hidden z-50',
            'animate-in fade-in slide-in-from-top-2 duration-200'
          )}
        >
          {/* User Info Section */}
          {userName && (
            <div className="px-4 py-3 border-b border-[color:var(--border)]">
              <p className="text-sm font-medium text-[color:var(--foreground)]">
                {userName}
              </p>
            </div>
          )}

          {/* Menu Items */}
          <div className="py-1">
            <button
              onClick={handleLogout}
              className={cn(
                'w-full px-4 py-2 text-left text-sm',
                'text-[color:var(--foreground)]',
                'hover:bg-[color:var(--muted)] transition-colors duration-150',
                'focus:outline-none focus:bg-[color:var(--muted)]',
                'flex items-center gap-2'
              )}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

UserMenu.displayName = 'UserMenu';
