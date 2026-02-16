/**
 * AttachmentList Component
 * Grid/list display of project attachments
 */

import { useTranslation } from '../../../../i18n';
import { Text } from '../../atoms/Text';
import { AttachmentItem } from './AttachmentItem';
import type { ProjectAttachment } from '../../../../infrastructure/api/api.client';

export interface AttachmentListProps {
  attachments: ProjectAttachment[];
  onDelete: (attachmentId: string) => Promise<void>;
  onUpdateDescription?: (attachmentId: string, description: string) => Promise<void>;
  loading?: boolean;
  disabled?: boolean;
}

export function AttachmentList({
  attachments,
  onDelete,
  onUpdateDescription,
  loading = false,
  disabled = false,
}: AttachmentListProps) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6 animate-spin text-[color:var(--primary)]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <Text variant="muted">{t('common:app.loading')}</Text>
        </div>
      </div>
    );
  }

  if (attachments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <svg
          className="w-16 h-16 text-[color:var(--muted-foreground)] mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
        <Text variant="muted">{t('projects:attachments.noAttachments')}</Text>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {attachments.map((attachment) => (
        <AttachmentItem
          key={attachment.id}
          attachment={attachment}
          onDelete={onDelete}
          onUpdateDescription={onUpdateDescription}
          disabled={disabled}
        />
      ))}
    </div>
  );
}
