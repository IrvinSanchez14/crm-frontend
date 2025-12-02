import { useState, useEffect, useCallback } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../shared/hooks/useAuth';
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
    <div className="relative h-screen bg-[color:var(--background)]">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full p-8 flex flex-col md:flex-row items-center justify-center gap-8">
        <div className="mb-6 text-center w-full md:w-80">
          <p>logo</p>
          <Heading level={1}>Sign in</Heading>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 w-full md:max-w-[600px]">
          <FormField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={error}
          />
          <FormField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={error}
          />
          <Button type="submit" disabled={isSubmitting} className="w-full rounded-full">
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
      </div>
    </div>
  );
}

