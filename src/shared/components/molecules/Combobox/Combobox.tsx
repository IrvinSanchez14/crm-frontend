/**
 * Combobox Component
 * Searchable dropdown/select component with filtering
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Label } from '../../atoms/Label';
import { cn } from '../../../../core/utils/cn';

export interface ComboboxOption {
  id: string;
  label: string;
  value: string;
}

export interface ComboboxProps {
  label: string;
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  emptyMessage?: string;
  className?: string;
}

export function Combobox({
  label,
  options,
  value,
  onChange,
  placeholder = 'Search...',
  required = false,
  disabled = false,
  error,
  emptyMessage = 'No results found',
  className,
}: ComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Get selected option
  const selectedOption = options.find((opt) => opt.value === value);

  // Filter options based on search term
  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Reset search term when value changes externally
  useEffect(() => {
    if (!isOpen && selectedOption) {
      setSearchTerm(selectedOption.label);
    }
  }, [value, isOpen, selectedOption]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        // Reset search term to selected option label when closing
        if (selectedOption) {
          setSearchTerm(selectedOption.label);
        } else {
          setSearchTerm('');
        }
        setHighlightedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, selectedOption]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (disabled) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setIsOpen(true);
          setHighlightedIndex((prev) =>
            prev < filteredOptions.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setIsOpen(true);
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        case 'Enter':
          e.preventDefault();
          if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
            handleSelect(filteredOptions[highlightedIndex].value);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          if (selectedOption) {
            setSearchTerm(selectedOption.label);
          } else {
            setSearchTerm('');
          }
          setHighlightedIndex(-1);
          inputRef.current?.blur();
          break;
        default:
          setIsOpen(true);
          setHighlightedIndex(-1);
      }
    },
    [disabled, filteredOptions, highlightedIndex, selectedOption]
  );

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listRef.current) {
      const highlightedElement = listRef.current.children[
        highlightedIndex
      ] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth',
        });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    const selected = options.find((opt) => opt.value === optionValue);
    if (selected) {
      setSearchTerm(selected.label);
    }
    setHighlightedIndex(-1);
    inputRef.current?.blur();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);
    setIsOpen(true);
    setHighlightedIndex(-1);

    // If search term is cleared, clear selection
    if (!newSearchTerm.trim()) {
      onChange('');
    }
  };

  const handleInputFocus = () => {
    if (!disabled) {
      setIsOpen(true);
      // Select all text when focusing
      inputRef.current?.select();
    }
  };

  return (
    <div ref={containerRef} className={cn('relative space-y-2', className)}>
      <Label htmlFor={`combobox-${label}`}>
        {label}
        {required && <span className="text-[color:var(--destructive)] ml-1">*</span>}
      </Label>
      <div className="relative">
        <input
          ref={inputRef}
          id={`combobox-${label}`}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={cn(
            'w-full px-3 py-2',
            'border border-[color:var(--border)]',
            'rounded-lg',
            'bg-[color:var(--background)]',
            'text-[color:var(--foreground)]',
            'focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error && 'border-[color:var(--destructive)]',
            'pr-10'
          )}
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          role="combobox"
        />
        {/* Dropdown arrow icon */}
        <div
          className={cn(
            'absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none',
            'text-[color:var(--muted-foreground)]',
            'transition-transform duration-200',
            isOpen && 'rotate-180'
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
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>

        {/* Dropdown list */}
        {isOpen && !disabled && (
          <div
            className={cn(
              'absolute z-50 w-full mt-1',
              'bg-[color:var(--card)]',
              'border border-[color:var(--border)]',
              'rounded-lg shadow-lg',
              'max-h-60 overflow-auto',
              'py-1'
            )}
            role="listbox"
          >
            {filteredOptions.length > 0 ? (
              <ul ref={listRef} className="py-1">
                {filteredOptions.map((option, index) => {
                  const isSelected = option.value === value;
                  const isHighlighted = index === highlightedIndex;

                  return (
                    <li
                      key={option.id}
                      role="option"
                      aria-selected={isSelected}
                      className={cn(
                        'px-4 py-2 cursor-pointer',
                        'text-sm',
                        'transition-colors duration-150',
                        isHighlighted &&
                          'bg-[color:var(--muted)] text-[color:var(--foreground)]',
                        isSelected &&
                          !isHighlighted &&
                          'bg-[color:var(--primary)]/10 text-[color:var(--primary)]',
                        !isHighlighted &&
                          !isSelected &&
                          'text-[color:var(--foreground)] hover:bg-[color:var(--muted)]'
                      )}
                      onClick={() => handleSelect(option.value)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                    >
                      <div className="flex items-center justify-between">
                        <span>{option.label}</span>
                        {isSelected && (
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
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="px-4 py-8 text-center text-sm text-[color:var(--muted-foreground)]">
                {emptyMessage}
              </div>
            )}
          </div>
        )}
      </div>
      {error && (
        <p className="text-sm text-[color:var(--destructive)]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

