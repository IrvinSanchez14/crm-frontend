/**
 * LanguageSwitcher Component
 * Best Practice: Accessible dropdown with keyboard navigation
 * Performance: Memoized to prevent unnecessary re-renders
 * UX: Shows current language with flag, smooth dropdown animation
 */

import { memo, useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../../../i18n';
import { cn } from '../../../../core/utils/cn';
import type { LanguageSwitcherProps, LanguageOption } from './LanguageSwitcher.types';

// Language options with emoji flags
const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
];

export const LanguageSwitcher = memo<LanguageSwitcherProps>(
  ({ className, variant = 'default' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { currentLanguage, changeLanguage } = useLanguage();

    const currentOption = LANGUAGE_OPTIONS.find(
      (opt) => opt.code === currentLanguage
    ) || LANGUAGE_OPTIONS[0];

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
        }
      };

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
          document.removeEventListener('mousedown', handleClickOutside);
        };
      }
    }, [isOpen]);

    const handleLanguageChange = async (languageCode: string) => {
      await changeLanguage(languageCode as any);
      setIsOpen(false);
    };

    const isCompact = variant === 'compact';

    return (
      <div ref={dropdownRef} className={cn('relative', className)}>
        {/* Trigger Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg',
            'text-[color:var(--foreground)]',
            'hover:bg-[color:var(--muted)]',
            'transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] focus:ring-offset-2',
            'active:scale-95'
          )}
          aria-label="Select Language"
          aria-expanded={isOpen}
          aria-haspopup="true"
          type="button"
        >
          <span className="text-xl" role="img" aria-label={currentOption.name}>
            {currentOption.flag}
          </span>
          {!isCompact && (
            <span className="text-sm font-medium hidden sm:inline">
              {currentOption.name}
            </span>
          )}
          <svg
            className={cn(
              'w-4 h-4 transition-transform duration-200',
              isOpen && 'transform rotate-180'
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div
            className={cn(
              'absolute right-0 mt-2 w-48 z-50',
              'bg-[color:var(--background)]',
              'border border-[color:var(--border)]',
              'rounded-lg shadow-lg',
              'py-1',
              'animate-in fade-in slide-in-from-top-2 duration-200'
            )}
            role="menu"
            aria-orientation="vertical"
          >
            {LANGUAGE_OPTIONS.map((option) => {
              const isSelected = option.code === currentLanguage;

              return (
                <button
                  key={option.code}
                  onClick={() => handleLanguageChange(option.code)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-2.5',
                    'text-left text-sm',
                    'transition-colors duration-150',
                    isSelected
                      ? 'bg-[color:var(--primary)] text-white'
                      : 'text-[color:var(--foreground)] hover:bg-[color:var(--muted)]'
                  )}
                  role="menuitem"
                  type="button"
                >
                  <span className="text-xl" role="img" aria-label={option.name}>
                    {option.flag}
                  </span>
                  <span className="flex-1 font-medium">{option.name}</span>
                  {isSelected && (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }
);

LanguageSwitcher.displayName = 'LanguageSwitcher';
