/**
 * Edit Project Category Form Component
 * Form for editing an existing project category
 */

import { useState, type FormEvent } from 'react';
import { FormField } from '../../../shared/components/molecules/FormField';
import { Button } from '../../../shared/components/atoms/Button';
import { Label } from '../../../shared/components/atoms/Label/Label';
import {
  updateProjectCategory,
  type ProjectCategory,
  type ProjectCategoryUpdate,
} from '../../../infrastructure/api/api.client';
import { decodeJwt } from '../../../core/utils/jwt.utils';
import { useAuth } from '../../../shared/hooks/useAuth';

export interface EditProjectCategoryFormProps {
  category: ProjectCategory;
  onSuccess?: () => void;
  onCancel: () => void;
}

export function EditProjectCategoryForm({ category, onSuccess, onCancel }: EditProjectCategoryFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: category.name,
    description: category.description || '',
    is_active: category.is_active,
  });

  const getCompanyId = (): string | null => {
    if (!user?.access_token) return null;
    const payload = decodeJwt(user.access_token);
    return payload?.company_id || null;
  };

  const handleChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
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

    if (!formData.name.trim()) {
      setError('Please enter a category name.');
      return;
    }

    try {
      setLoading(true);
      const updateData: ProjectCategoryUpdate = {
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
        is_active: formData.is_active,
      };

      await updateProjectCategory(category.id, updateData, companyId);

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update category. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-[color:var(--destructive)]/10 border border-[color:var(--destructive)]/20">
            <p className="text-sm text-[color:var(--destructive)]">{error}</p>
          </div>
        )}

        <FormField
          label="Category Name *"
          type="text"
          value={formData.name}
          onChange={handleChange('name')}
          required
          disabled={loading}
          placeholder="e.g., Kitchen, Bathroom, Outside"
        />

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            value={formData.description}
            onChange={handleChange('description')}
            disabled={loading}
            rows={3}
            placeholder="Optional description for this category"
            className="w-full px-3 py-2 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] resize-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="is_active"
            checked={formData.is_active}
            onChange={handleChange('is_active')}
            disabled={loading}
            className="w-4 h-4 rounded border-[color:var(--border)] text-[color:var(--primary)] focus:ring-[color:var(--primary)]"
          />
          <Label htmlFor="is_active" className="cursor-pointer">
            Active (categories can be used in projects)
          </Label>
        </div>
      </div>

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
