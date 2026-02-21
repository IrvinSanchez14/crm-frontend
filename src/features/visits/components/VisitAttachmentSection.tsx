/**
 * VisitAttachmentSection Component
 * Manages visit attachments - upload, list, delete
 */

import { useState, useEffect, useCallback } from 'react';
import { Text } from '../../../shared/components/atoms/Text';
import { Heading } from '../../../shared/components/atoms/Heading';
import { AttachmentUploader } from '../../../shared/components/molecules/AttachmentUploader';
import { AttachmentList } from '../../../shared/components/molecules/AttachmentList';
import { useAuth } from '../../../shared/hooks/useAuth';
import { decodeJwt } from '../../../core/utils/jwt.utils';
import {
  uploadVisitAttachment,
  getVisitAttachments,
  deleteVisitAttachment,
  updateVisitAttachment,
  type VisitAttachment,
  type ProjectAttachment,
} from '../../../infrastructure/api/api.client';

export interface VisitAttachmentSectionProps {
  visitId: string;
}

/** Map VisitAttachment to ProjectAttachment shape for shared components */
function toProjectAttachment(att: VisitAttachment): ProjectAttachment {
  return {
    ...att,
    project_id: att.visit_id, // map visit_id to project_id for type compat
  };
}

export function VisitAttachmentSection({ visitId }: VisitAttachmentSectionProps) {
  const { user } = useAuth();
  const [attachments, setAttachments] = useState<VisitAttachment[]>([]);
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
      const response = await getVisitAttachments(visitId, companyId);
      setAttachments(response.attachments);
    } catch (err) {
      console.error('Failed to load attachments:', err);
      setError(err instanceof Error ? err.message : 'Failed to load attachments');
    } finally {
      setLoading(false);
    }
  }, [visitId, getCompanyId]);

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
        const newAttachment = await uploadVisitAttachment(
          visitId,
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
    [visitId, getCompanyId]
  );

  // Handle delete
  const handleDelete = useCallback(
    async (attachmentId: string) => {
      const companyId = getCompanyId();
      if (!companyId) {
        throw new Error('Company ID not found');
      }

      try {
        await deleteVisitAttachment(visitId, attachmentId, companyId);

        // Remove from list
        setAttachments((prev) => prev.filter((att) => att.id !== attachmentId));
      } catch (err) {
        console.error('Delete failed:', err);
        throw err;
      }
    },
    [visitId, getCompanyId]
  );

  // Handle update description
  const handleUpdateDescription = useCallback(
    async (attachmentId: string, description: string) => {
      const companyId = getCompanyId();
      if (!companyId) {
        throw new Error('Company ID not found');
      }

      try {
        const updated = await updateVisitAttachment(
          visitId,
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
    [visitId, getCompanyId]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Heading level={3}>Attachments</Heading>
        <Text size="sm" variant="muted">
          {attachments.length} / {maxAllowed} files
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
          attachments={attachments.map(toProjectAttachment)}
          onDelete={handleDelete}
          onUpdateDescription={handleUpdateDescription}
          loading={loading}
        />
      </div>
    </div>
  );
}
