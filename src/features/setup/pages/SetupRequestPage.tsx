import { useState, useCallback } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from '../../../i18n';
import { Heading } from '../../../shared/components/atoms/Heading';
import { Button } from '../../../shared/components/atoms/Button';
import { FormField } from '../../../shared/components/molecules/FormField';
import { Text } from '../../../shared/components/atoms/Text';
import { requestSetupLink } from '../../../infrastructure/api/api.client';

export function SetupRequestPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const { t } = useTranslation('setup');

  const handleSubmit = useCallback(async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await requestSetupLink({ email });
      setSubmitted(true);
    } catch {
      setError(t('setupError'));
    } finally {
      setIsSubmitting(false);
    }
  }, [email, t]);

  if (submitted) {
    return (
      <div className="relative h-screen bg-[color:var(--background)]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full p-8 flex flex-col items-center justify-center gap-4 max-w-md">
          <Heading level={2}>{t('successTitle')}</Heading>
          <Text variant="muted" className="text-center">{t('successMessage')}</Text>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen bg-[color:var(--background)]">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full p-8 flex flex-col md:flex-row items-center justify-center gap-8">
        <div className="mb-6 text-center w-full md:w-80">
          <Heading level={1}>{t('requestTitle')}</Heading>
          <Text variant="muted" className="mt-2">{t('requestSubtitle')}</Text>
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
          <Button
            type="submit"
            disabled={isSubmitting}
            variant="ghost"
            className="w-full h-10 rounded-full bg-[rgba(0,0,0,0.0775)] dark:bg-[rgba(255,255,255,0.0775)] hover:bg-[rgba(0,0,0,0.2)] dark:hover:bg-[rgba(255,255,255,0.2)]"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-current" style={{ animation: 'dot-bounce 1.4s ease-in-out infinite', animationDelay: '0s' }} />
                <span className="h-2 w-2 rounded-full bg-current" style={{ animation: 'dot-bounce 1.4s ease-in-out infinite', animationDelay: '0.2s' }} />
                <span className="h-2 w-2 rounded-full bg-current" style={{ animation: 'dot-bounce 1.4s ease-in-out infinite', animationDelay: '0.4s' }} />
              </span>
            ) : (
              t('sendLink')
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
