/**
 * ThemeToggleButton Molecule
 * Single theme button (combines Button atom with theme logic)
 * Performance: Memoized to prevent unnecessary re-renders
 */

import { memo } from 'react';
import { Button } from '../../atoms/Button';

export interface ThemeToggleButtonProps {
  label: string;
  icon: string;
  isActive: boolean;
  onClick: () => void;
}

export const ThemeToggleButton = memo(function ThemeToggleButton({
  label,
  icon,
  isActive,
  onClick,
}: ThemeToggleButtonProps) {
  return (
    <Button
      onClick={onClick}
      variant={isActive ? 'secondary' : 'ghost'}
      size="sm"
      className={`
        relative px-3 py-1.5 text-sm font-medium rounded-md
        transition-colors duration-200
        ${
          isActive
            ? 'bg-[color:var(--background)] text-[color:var(--foreground)] shadow-sm'
            : 'text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]'
        }
      `}
      aria-label={`Switch to ${label} theme`}
    >
      <span className="mr-1.5">{icon}</span>
      {label}
    </Button>
  );
});

