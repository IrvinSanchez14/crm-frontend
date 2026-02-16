/**
 * AttachmentItem Component
 * Individual attachment card with preview, info, and actions
 */

import { useState } from 'react';
import { useTranslation } from '../../../../i18n';
import { Button } from '../../atoms/Button';
import { Text } from '../../atoms/Text';
import { cn } from '../../../../core/utils/cn';
import type { ProjectAttachment } from '../../../../infrastructure/api/api.client';

export interface AttachmentItemProps {
  attachment: ProjectAttachment;
  onDelete: (attachmentId: string) => Promise<void>;
  onUpdateDescription?: (attachmentId: string, description: string) => Promise<void>;
  disabled?: boolean;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const getFileIcon = (fileType: string) => {
  if (fileType.startsWith('image/')) {
    return (
      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
      </svg>
    );
  }
  
  // PDF icon
  return (
    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
      <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z" />
    </svg>
  );
};

export function AttachmentItem({
  attachment,
  onDelete,
  onUpdateDescription,
  disabled = false,
}: AttachmentItemProps) {
  const { t } = useTranslation();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState(attachment.description || '');

  const isImage = attachment.file_type.startsWith('image/');
  const handleDelete = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    try {
      setIsDeleting(true);
      await onDelete(attachment.id);
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleSaveDescription = async () => {
    if (!onUpdateDescription) return;

    try {
      await onUpdateDescription(attachment.id, editedDescription);
      setIsEditingDescription(false);
    } catch (err) {
      console.error('Update failed:', err);
    }
  };

  const handleDownload = () => {
    window.open(attachment.file_url, '_blank');
  };

  return (
    <div
      className={cn(
        'relative border border-[color:var(--border)] rounded-lg p-4 transition-all',
        'hover:shadow-md hover:border-[color:var(--primary)]/50',
        (disabled || isDeleting) && 'opacity-50 pointer-events-none'
      )}
    >
      <div className="flex gap-4">
        {/* Preview/Icon */}
        <div className="flex-shrink-0">
          {isImage ? (
            <img
              src={attachment.file_url}
              alt={attachment.filename}
              className="w-20 h-20 object-cover rounded border border-[color:var(--border)]"
              loading="lazy"
            />
          ) : (
            <div className="w-20 h-20 flex items-center justify-center bg-[color:var(--muted)] rounded border border-[color:var(--border)] text-[color:var(--primary)]">
              {getFileIcon(attachment.file_type)}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Filename */}
          <div>
            <Text className="font-medium truncate">{attachment.filename}</Text>
            <Text size="sm" variant="muted">
              {formatFileSize(attachment.file_size)}
            </Text>
          </div>

          {/* Description */}
          {isEditingDescription ? (
            <div className="space-y-2">
              <input
                type="text"
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                placeholder={t('projects:attachments.description')}
                className="w-full px-3 py-2 text-sm border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]"
              />
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveDescription}
                >
                  {t('common:actions.save')}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setIsEditingDescription(false);
                    setEditedDescription(attachment.description || '');
                  }}
                >
                  {t('common:actions.cancel')}
                </Button>
              </div>
            </div>
          ) : (
            <>
              {attachment.description && (
                <Text size="sm" className="text-[color:var(--muted-foreground)]">
                  {attachment.description}
                </Text>
              )}
            </>
          )}

          {/* Meta info */}
          <div className="flex items-center gap-2 text-xs text-[color:var(--muted-foreground)]">
            {attachment.uploaded_by_name && (
              <>
                <span>{t('projects:attachments.uploadedBy')}:</span>
                <span>{attachment.uploaded_by_name}</span>
                <span>•</span>
              </>
            )}
            <span>{new Date(attachment.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 flex flex-col gap-2">
          <button
            onClick={handleDownload}
            className="p-2 rounded hover:bg-[color:var(--muted)] transition-colors"
            title={t('projects:attachments.downloadFile')}
            disabled={disabled}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
          </button>

          {onUpdateDescription && !isEditingDescription && (
            <button
              onClick={() => setIsEditingDescription(true)}
              className="p-2 rounded hover:bg-[color:var(--muted)] transition-colors"
              title={t('projects:attachments.editDescription')}
              disabled={disabled}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
          )}

          <button
            onClick={handleDelete}
            className={cn(
              'p-2 rounded transition-colors',
              showDeleteConfirm
                ? 'bg-[color:var(--destructive)] text-white'
                : 'hover:bg-[color:var(--destructive)]/10 text-[color:var(--destructive)]'
            )}
            title={t('projects:attachments.delete')}
            disabled={disabled || isDeleting}
          >
            {isDeleting ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="mt-3 p-3 bg-[color:var(--destructive)]/10 border border-[color:var(--destructive)]/20 rounded-lg">
          <Text size="sm" className="text-[color:var(--destructive)]">
            {t('projects:attachments.confirmDelete')}
          </Text>
          <div className="flex gap-2 mt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowDeleteConfirm(false)}
            >
              {t('common:actions.cancel')}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleDelete}
              className="bg-[color:var(--destructive)] hover:bg-[color:var(--destructive)]/90"
            >
              {t('common:actions.delete')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
