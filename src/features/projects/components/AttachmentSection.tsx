/**
 * AttachmentSection Component
 * Manages project attachments - upload, list, delete
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../../../i18n';
import { Text } from '../../../shared/components/atoms/Text';
import { Heading } from '../../../shared/components/atoms/Heading';
import { AttachmentUploader } from '../../../shared/components/molecules/AttachmentUploader';
import { AttachmentList } from '../../../shared/components/molecules/AttachmentList';
import { useAuth } from '../../../shared/hooks/useAuth';
import { decodeJwt } from '../../../core/utils/jwt.utils';
import {
  uploadProjectAttachment,
  getProjectAttachments,
  deleteProjectAttachment,
  updateProjectAttachment,
  type ProjectAttachment,
} from '../../../infrastructure/api/api.client';

export interface AttachmentSectionProps {
  projectId: string;
}

export function AttachmentSection({ projectId }: AttachmentSectionProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [attachments, setAttachments] = useState<ProjectAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [maxAllowed] = useState(20);

  // Get company ID from JWT token
  const getCompanyId = useCallback((): string | null => {
    if (!user?.access_token) return null;
    const payload = decodeJwt(user.access_token);
    return payload?.company_id || null;
  }, [user]);

  // Fetch attachments
  const fetchAttachments = useCallback(async () => {
    const companyId = getCompanyId();
    if (!companyId) {
      setError('Company ID not found');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await getProjectAttachments(projectId, companyId);
      setAttachments(response.attachments);
    } catch (err) {
      console.error('Failed to load attachments:', err);
      setError(err instanceof Error ? err.message : 'Failed to load attachments');
    } finally {
      setLoading(false);
    }
  }, [projectId, getCompanyId]);

  // Load attachments on mount
  useEffect(() => {
    fetchAttachments();
  }, [fetchAttachments]);

  // Handle upload
  const handleUpload = useCallback(
    async (file: File, description?: string) => {
      const companyId = getCompanyId();
      if (!companyId) {
        throw new Error('Company ID not found');
      }

      try {
        const newAttachment = await uploadProjectAttachment(
          projectId,
          file,
          companyId,
          description
        );

        // Add to list
        setAttachments((prev) => [newAttachment, ...prev]);
      } catch (err) {
        console.error('Upload failed:', err);
        throw err;
      }
    },
    [projectId, getCompanyId]
  );

  // Handle delete
  const handleDelete = useCallback(
    async (attachmentId: string) => {
      const companyId = getCompanyId();
      if (!companyId) {
        throw new Error('Company ID not found');
      }

      try {
        await deleteProjectAttachment(projectId, attachmentId, companyId);

        // Remove from list
        setAttachments((prev) => prev.filter((att) => att.id !== attachmentId));
      } catch (err) {
        console.error('Delete failed:', err);
        throw err;
      }
    },
    [projectId, getCompanyId]
  );

  // Handle update description
  const handleUpdateDescription = useCallback(
    async (attachmentId: string, description: string) => {
      const companyId = getCompanyId();
      if (!companyId) {
        throw new Error('Company ID not found');
      }

      try {
        const updated = await updateProjectAttachment(
          projectId,
          attachmentId,
          { description },
          companyId
        );

        // Update in list
        setAttachments((prev) =>
          prev.map((att) => (att.id === attachmentId ? updated : att))
        );
      } catch (err) {
        console.error('Update failed:', err);
        throw err;
      }
    },
    [projectId, getCompanyId]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Heading level={3}>{t('projects:attachments.title')}</Heading>
        <Text size="sm" variant="muted">
          {t('projects:attachments.limit', {
            count: attachments.length,
            max: maxAllowed,
          })}
        </Text>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 rounded-lg bg-[color:var(--destructive)]/10 border border-[color:var(--destructive)]/20">
          <Text size="sm" className="text-[color:var(--destructive)]">
            {error}
          </Text>
        </div>
      )}

      {/* Upload Section */}
      <div>
        <AttachmentUploader
          onUpload={handleUpload}
          maxAttachments={maxAllowed}
          currentCount={attachments.length}
        />
      </div>

      {/* Attachments List */}
      <div>
        <AttachmentList
          attachments={attachments}
          onDelete={handleDelete}
          onUpdateDescription={handleUpdateDescription}
          loading={loading}
        />
      </div>
    </div>
  );
}
