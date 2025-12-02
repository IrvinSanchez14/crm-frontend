/**
 * Theme Toggle Component
 * Single Responsibility: Renders theme toggle UI
 * Open/Closed: Can be styled/extended without modifying core logic
 */

import { useTheme } from '../hooks/useTheme';
import type { Theme } from '../../core/domain/theme.types';

const themes: Array<{ value: Theme; label: string; icon: string }> = [
  { value: 'light', label: 'Light', icon: '☀️' },
  { value: 'dark', label: 'Dark', icon: '🌙' },
  { value: 'system', label: 'System', icon: '💻' },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="inline-flex items-center rounded-lg bg-[color:var(--muted)] p-1">
      {themes.map((t) => (
        <button
          key={t.value}
          onClick={() => setTheme(t.value)}
          className={`
            relative px-3 py-1.5 text-sm font-medium rounded-md
            transition-colors duration-200
            ${
              theme === t.value
                ? 'bg-[color:var(--background)] text-[color:var(--foreground)] shadow-sm'
                : 'text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]'
            }
          `}
          aria-label={`Switch to ${t.label} theme`}
        >
          <span className="mr-1.5">{t.icon}</span>
          {t.label}
        </button>
      ))}
    </div>
  );
}
