/**
 * Create Client Form Component
 * Form for creating a new client in the CRM system
 */

import { useState, FormEvent } from 'react';
import { FormField } from '../../../shared/components/molecules/FormField';
import { Button } from '../../../shared/components/atoms/Button';
import { createClient, type ClientCreate } from '../../../infrastructure/api/api.client';
import { decodeJwt } from '../../../core/utils/jwt.utils';
import { useAuth } from '../../../shared/hooks/useAuth';

export interface CreateClientFormProps {
  onSuccess?: () => void;
  onCancel: () => void;
}

export function CreateClientForm({ onSuccess, onCancel }: CreateClientFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<ClientCreate, 'company_id'>>({
    name: '',
    email: '',
    phone: '',
  });

  // Get company_id from JWT token
  const getCompanyId = (): string | null => {
    if (!user?.access_token) return null;
    const payload = decodeJwt(user.access_token);
    return payload?.company_id || null;
  };

  const handleChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const companyId = getCompanyId();
    if (!companyId) {
      setError('Company ID not found. Please log in again.');
      return;
    }

    // Validate required fields
    if (!formData.name.trim()) {
      setError('Please enter a client name.');
      return;
    }

    try {
      setLoading(true);
      const clientData: ClientCreate = {
        name: formData.name.trim(),
        company_id: companyId,
        email: formData.email?.trim() || undefined,
        phone: formData.phone?.trim() || undefined,
      };

      await createClient(clientData);
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create client. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      {/* Form Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-[color:var(--destructive)]/10 border border-[color:var(--destructive)]/20">
            <p className="text-sm text-[color:var(--destructive)]">{error}</p>
          </div>
        )}

        <FormField
          label="Name *"
          type="text"
          value={formData.name}
          onChange={handleChange('name')}
          required
          disabled={loading}
          placeholder="Client name"
        />

        <FormField
          label="Email"
          type="email"
          value={formData.email}
          onChange={handleChange('email')}
          disabled={loading}
          placeholder="client@example.com"
        />

        <FormField
          label="Phone"
          type="tel"
          value={formData.phone}
          onChange={handleChange('phone')}
          disabled={loading}
          placeholder="555-1234"
        />
      </div>

      {/* Footer with buttons */}
      <div className="border-t border-[color:var(--border)] px-6 py-4 space-y-3">
        <div className="flex gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={loading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            className="flex-1"
          >
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </form>
  );
}

