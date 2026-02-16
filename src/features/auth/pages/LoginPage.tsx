import { useState, useEffect, useCallback } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../shared/hooks/useAuth';
import { useTranslation } from '../../../i18n';
import { Heading } from '../../../shared/components/atoms/Heading';
import { Button } from '../../../shared/components/atoms/Button';
import { FormField } from '../../../shared/components/molecules/FormField';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation('auth');

  // Redirect if already authenticated (useEffect for side effects)
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Memoize submit handler to prevent unnecessary re-renders
  const handleSubmit = useCallback(async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t('loginError')
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [email, password, login, navigate]);

  // Don't render if already authenticated (handled by useEffect)
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="relative h-screen bg-[color:var(--background)]">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full p-8 flex flex-col md:flex-row items-center justify-center gap-8">
        <div className="mb-6 text-center w-full md:w-80">
          <Heading level={1}>{t('title')}</Heading>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 w-full md:max-w-[600px]">
          {error && (
            <div className="p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg text-sm">
              {error}
            </div>
          )}
          <FormField
            label={t('email')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <FormField
            label={t('password')}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button
            type="submit"
            disabled={isSubmitting}
            variant="ghost"
            className="w-full h-10 rounded-full bg-[rgba(0,0,0,0.0775)] dark:bg-[rgba(255,255,255,0.0775)] hover:bg-[rgba(0,0,0,0.2)] dark:hover:bg-[rgba(255,255,255,0.2)]"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full bg-current"
                  style={{
                    animation: 'dot-bounce 1.4s ease-in-out infinite',
                    animationDelay: '0s',
                  }}
                />
                <span
                  className="h-2 w-2 rounded-full bg-current"
                  style={{
                    animation: 'dot-bounce 1.4s ease-in-out infinite',
                    animationDelay: '0.2s',
                  }}
                />
                <span
                  className="h-2 w-2 rounded-full bg-current"
                  style={{
                    animation: 'dot-bounce 1.4s ease-in-out infinite',
                    animationDelay: '0.4s',
                  }}
                />
              </span>
            ) : (
              t('signIn')
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

