import { useState, useEffect, useCallback } from 'react';
import type { FormEvent } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from '../../../i18n';
import { Heading } from '../../../shared/components/atoms/Heading';
import { Button } from '../../../shared/components/atoms/Button';
import { FormField } from '../../../shared/components/molecules/FormField';
import { Text } from '../../../shared/components/atoms/Text';
import { verifySetupToken, setupCompany } from '../../../infrastructure/api/api.client';

export function SetupCreatePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation('setup');
  const token = searchParams.get('token') || '';

  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [companyName, setCompanyName] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminFirstName, setAdminFirstName] = useState('');
  const [adminLastName, setAdminLastName] = useState('');
  const [adminPhone, setAdminPhone] = useState('');

  useEffect(() => {
    if (!token) {
      setVerifying(false);
      setTokenValid(false);
      return;
    }

    verifySetupToken(token)
      .then((result) => {
        setTokenValid(result.valid);
        if (result.valid && result.email) {
          setAdminEmail(result.email);
        }
      })
      .catch(() => {
        setTokenValid(false);
      })
      .finally(() => {
        setVerifying(false);
      });
  }, [token]);

  const handleSubmit = useCallback(async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await setupCompany({
        setup_token: token,
        company_name: companyName,
        company_email: companyEmail,
        company_phone: companyPhone || undefined,
        company_address: companyAddress || undefined,
        admin_email: adminEmail,
        admin_username: adminUsername,
        admin_password: adminPassword,
        admin_first_name: adminFirstName,
        admin_last_name: adminLastName,
        admin_phone: adminPhone || undefined,
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('setupError'));
    } finally {
      setIsSubmitting(false);
    }
  }, [token, companyName, companyEmail, companyPhone, companyAddress, adminEmail, adminUsername, adminPassword, adminFirstName, adminLastName, adminPhone, t]);

  if (verifying) {
    return (
      <div className="relative h-screen bg-[color:var(--background)]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full p-8 flex flex-col items-center justify-center gap-4">
          <Text variant="muted">{t('verifying')}</Text>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="relative h-screen bg-[color:var(--background)]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full p-8 flex flex-col items-center justify-center gap-4 max-w-md">
          <Text variant="muted" className="text-center">{t('invalidToken')}</Text>
          <Link
            to="/setup"
            className="text-sm text-[color:var(--foreground)] opacity-60 hover:opacity-100 underline"
          >
            {t('backToSetup')}
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="relative h-screen bg-[color:var(--background)]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full p-8 flex flex-col items-center justify-center gap-4 max-w-md">
          <Heading level={2}>{t('setupSuccess')}</Heading>
          <Button
            variant="ghost"
            className="h-10 rounded-full bg-[rgba(0,0,0,0.0775)] dark:bg-[rgba(255,255,255,0.0775)] hover:bg-[rgba(0,0,0,0.2)] dark:hover:bg-[rgba(255,255,255,0.2)] px-8"
            onClick={() => navigate('/login')}
          >
            {t('goToLogin')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[color:var(--background)] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Heading level={1}>{t('createTitle')}</Heading>
          <Text variant="muted" className="mt-2">{t('createSubtitle')}</Text>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Company Section */}
          <div className="space-y-4">
            <Heading level={3}>{t('companySection')}</Heading>
            <FormField
              label={t('companyName')}
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
            />
            <FormField
              label={t('companyEmail')}
              type="email"
              value={companyEmail}
              onChange={(e) => setCompanyEmail(e.target.value)}
              required
            />
            <FormField
              label={t('companyPhone')}
              type="tel"
              value={companyPhone}
              onChange={(e) => setCompanyPhone(e.target.value)}
            />
            <FormField
              label={t('companyAddress')}
              type="text"
              value={companyAddress}
              onChange={(e) => setCompanyAddress(e.target.value)}
            />
          </div>

          {/* Admin Section */}
          <div className="space-y-4">
            <Heading level={3}>{t('adminSection')}</Heading>
            <FormField
              label={t('adminEmail')}
              type="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              required
            />
            <FormField
              label={t('adminUsername')}
              type="text"
              value={adminUsername}
              onChange={(e) => setAdminUsername(e.target.value)}
              required
            />
            <FormField
              label={t('adminPassword')}
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              required
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label={t('adminFirstName')}
                type="text"
                value={adminFirstName}
                onChange={(e) => setAdminFirstName(e.target.value)}
                required
              />
              <FormField
                label={t('adminLastName')}
                type="text"
                value={adminLastName}
                onChange={(e) => setAdminLastName(e.target.value)}
                required
              />
            </div>
            <FormField
              label={t('adminPhone')}
              type="tel"
              value={adminPhone}
              onChange={(e) => setAdminPhone(e.target.value)}
            />
          </div>

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
              t('createCompany')
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
