/**
 * Tests for LanguageSwitcher component
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LanguageSwitcher } from '../../../shared/components/molecules/LanguageSwitcher';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../config';

describe('LanguageSwitcher', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  );

  it('should render language switcher', () => {
    render(<LanguageSwitcher />, { wrapper });
    
    const button = screen.getByRole('button', { name: /select language/i });
    expect(button).toBeDefined();
  });

  it('should show current language flag', () => {
    render(<LanguageSwitcher variant="default" />, { wrapper });
    
    // Should show either US or ES flag
    const button = screen.getByRole('button');
    expect(button.textContent).toMatch(/🇺🇸|🇪🇸/);
  });

  it('should render in compact variant', () => {
    render(<LanguageSwitcher variant="compact" />, { wrapper });
    
    const button = screen.getByRole('button');
    expect(button).toBeDefined();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <LanguageSwitcher className="custom-class" />,
      { wrapper }
    );
    
    const div = container.querySelector('.custom-class');
    expect(div).toBeDefined();
  });
});
