/**
 * Tests for i18n hooks
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useLanguage, useTranslation } from '../hooks';
import { I18nextProvider } from 'react-i18next';
import i18n from '../config';

describe('useTranslation', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  );

  it('should return translation function', () => {
    const { result } = renderHook(() => useTranslation(), { wrapper });
    expect(result.current.t).toBeDefined();
    expect(typeof result.current.t).toBe('function');
  });

  it('should translate common keys', () => {
    const { result } = renderHook(() => useTranslation('common'), { wrapper });
    const translation = result.current.t('actions.save');
    expect(translation).toBe('Save');
  });

  it('should translate with interpolation', () => {
    const { result } = renderHook(() => useTranslation('common'), { wrapper });
    const translation = result.current.t('table.showing');
    expect(translation).toBeDefined();
  });

  it('should use correct namespace', () => {
    const { result } = renderHook(() => useTranslation('auth'), { wrapper });
    const translation = result.current.t('title');
    expect(translation).toBe('Login');
  });
});

describe('useLanguage', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  );

  it('should return current language', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    expect(result.current.currentLanguage).toBeDefined();
    expect(['en', 'es']).toContain(result.current.currentLanguage);
  });

  it('should change language', async () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    
    await act(async () => {
      await result.current.changeLanguage('es');
    });
    
    expect(result.current.currentLanguage).toBe('es');
  });

  it('should return available languages', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    expect(result.current.availableLanguages).toHaveLength(2);
    expect(result.current.availableLanguages).toEqual([
      { code: 'en', name: 'English' },
      { code: 'es', name: 'Español' },
    ]);
  });

  it('should not change to unsupported language', async () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    const initialLanguage = result.current.currentLanguage;
    
    await act(async () => {
      await result.current.changeLanguage('fr' as any);
    });
    
    // Should remain the same
    expect(result.current.currentLanguage).toBe(initialLanguage);
  });
});
