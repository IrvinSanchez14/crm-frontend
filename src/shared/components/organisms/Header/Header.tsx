import { memo } from 'react';
import { cn } from '../../../../core/utils/cn';
import { UserMenu } from '../../molecules/UserMenu';
import { LanguageSwitcher } from '../../molecules/LanguageSwitcher';
import type { HeaderProps } from './Header.types';
import logoImage from '../../../../assets/logo.webp';

/**
 * Header organism component
 * Displays logo on the left and user menu on the right
 * Supports dark/light mode through CSS variables
 */
export const Header = memo<HeaderProps>(
  ({ userName, onLogout, onMenuClick, className }) => {
    return (
      <header
        className={cn(
          'sticky top-0 z-40 w-full',
          'border-b border-[color:var(--border)]',
          'bg-[color:var(--background)]',
          'backdrop-blur supports-[backdrop-filter]:bg-[color:var(--background)]/95',
          className
        )}
      >
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo Section */}
            <div className="flex items-center gap-3">
              {/* Hamburger Menu Icon */}
              <button
                onClick={onMenuClick}
                className={cn(
                  'flex items-center justify-center',
                  'w-10 h-10 rounded-lg',
                  'text-[color:var(--foreground)]',
                  'hover:bg-[color:var(--muted)]',
                  'transition-colors duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] focus:ring-offset-2',
                  'active:scale-95'
                )}
                aria-label="Menu"
                type="button"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
              <img
                src={logoImage}
                alt="Logo"
                className="h-15 w-auto"
              />
            </div>

            {/* Right Section - Language Switcher & User Menu */}
            <div className="flex items-center gap-4">
              <LanguageSwitcher />
              <UserMenu userName={userName} onLogout={onLogout} />
            </div>
          </div>
        </div>
      </header>
    );
  }
);

Header.displayName = 'Header';
