/**
 * Login Page
 * Feature: Auth
 * Best Practice: Uses useEffect for side effects (navigation)
 */

import { useState, useEffect, useCallback } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../shared/hooks/useAuth';
import { Card } from '../../../shared/components/atoms/Card';
import { Heading } from '../../../shared/components/atoms/Heading';
import { Text } from '../../../shared/components/atoms/Text';
import { Button } from '../../../shared/components/atoms/Button';
import { FormField } from '../../../shared/components/molecules/FormField';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

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
        err instanceof Error ? err.message : 'Failed to login. Please try again.'
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-[color:var(--background)]">
      <div className="w-full max-w-md">
        <Card className="p-8">
          <div className="mb-8">
            <Heading level={1} className="mb-2">
              Welcome Back
            </Heading>
            <Text variant="muted">
              Sign in to your CRM account
            </Text>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 rounded-md bg-[color:var(--destructive)]/10 border border-[color:var(--destructive)]/20">
                <Text size="sm" variant="destructive">
                  {error}
                </Text>
              </div>
            )}

            <FormField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={isSubmitting}
              required
            />

            <FormField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={isSubmitting}
              required
            />

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Text size="sm" variant="muted">
              Demo: Use any email and password to login
            </Text>
          </div>
        </Card>
      </div>
    </div>
  );
}

