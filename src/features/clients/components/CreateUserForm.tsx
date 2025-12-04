/**
 * Create User Form Component
 * Form for creating a new user in the CRM system
 */

import { useState, FormEvent } from 'react';
import { FormField } from '../../../shared/components/molecules/FormField';
import { Button } from '../../../shared/components/atoms/Button';
import { createUser, type UserCreate } from '../../../infrastructure/api/api.client';
import { decodeJwt } from '../../../core/utils/jwt.utils';
import { useAuth } from '../../../shared/hooks/useAuth';

export interface CreateUserFormProps {
  onSuccess?: () => void;
  onCancel: () => void;
}

export function CreateUserForm({ onSuccess, onCancel }: CreateUserFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<UserCreate, 'company_id'>>({
    email: '',
    username: '',
    password: '',
    first_name: '',
    last_name: '',
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
    if (!formData.email || !formData.username || !formData.password || !formData.first_name || !formData.last_name) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      setLoading(true);
      const userData: UserCreate = {
        ...formData,
        company_id: companyId,
        role_ids: [], // Empty array for now, can be extended later
        phone: formData.phone || undefined,
      };

      await createUser(userData);
      
      // Reset form
      setFormData({
        email: '',
        username: '',
        password: '',
        first_name: '',
        last_name: '',
        phone: '',
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user. Please try again.');
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
          label="Email *"
          type="email"
          value={formData.email}
          onChange={handleChange('email')}
          required
          disabled={loading}
          placeholder="user@example.com"
        />

        <FormField
          label="Username *"
          type="text"
          value={formData.username}
          onChange={handleChange('username')}
          required
          disabled={loading}
          placeholder="johndoe"
        />

        <FormField
          label="Password *"
          type="password"
          value={formData.password}
          onChange={handleChange('password')}
          required
          disabled={loading}
          placeholder="••••••••"
        />

        <FormField
          label="First Name *"
          type="text"
          value={formData.first_name}
          onChange={handleChange('first_name')}
          required
          disabled={loading}
          placeholder="John"
        />

        <FormField
          label="Last Name *"
          type="text"
          value={formData.last_name}
          onChange={handleChange('last_name')}
          required
          disabled={loading}
          placeholder="Doe"
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

