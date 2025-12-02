/**
 * ThemeToggle Organism
 * Combines multiple ThemeToggleButton molecules
 * Performance: Uses useCallback to prevent unnecessary re-renders
 */

import { useMemo } from 'react';
import { useTheme } from '../../../hooks/useTheme';
import type { Theme } from '../../../../core/domain/theme.types';
import { ThemeToggleButton } from '../../molecules/ThemeToggleButton';

const themes: Array<{ value: Theme; label: string; icon: string }> = [
  { value: 'light', label: 'Light', icon: '☀️' },
  { value: 'dark', label: 'Dark', icon: '🌙' },
  { value: 'system', label: 'System', icon: '💻' },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  // Memoize theme handlers to prevent creating new functions on each render
  const themeHandlers = useMemo(() => {
    return themes.reduce(
      (acc, t) => {
        acc[t.value] = () => setTheme(t.value);
        return acc;
      },
      {} as Record<Theme, () => void>
    );
  }, [setTheme]);

  return (
    <div className="inline-flex items-center rounded-lg bg-[color:var(--muted)] p-1">
      {themes.map((t) => (
        <ThemeToggleButton
          key={t.value}
          label={t.label}
          icon={t.icon}
          isActive={theme === t.value}
          onClick={themeHandlers[t.value]}
        />
      ))}
    </div>
  );
}

