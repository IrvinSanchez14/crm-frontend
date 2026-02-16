/**
 * AttachmentUploader Component
 * Drag & drop file uploader for project attachments
 * Supports images (JPEG, PNG, WebP, GIF) and PDF files
 */

import { useCallback, useState, useRef } from 'react';
import { useTranslation } from '../../../../i18n';
import { Button } from '../../atoms/Button';
import { Text } from '../../atoms/Text';
import { cn } from '../../../../core/utils/cn';

export interface AttachmentUploaderProps {
  onUpload: (file: File, description?: string) => Promise<void>;
  disabled?: boolean;
  maxAttachments?: number;
  currentCount?: number;
}

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function AttachmentUploader({
  onUpload,
  disabled = false,
  maxAttachments = 20,
  currentCount = 0,
}: AttachmentUploaderProps) {
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isMaxReached = currentCount >= maxAttachments;

  const validateFile = useCallback(
    (file: File): { valid: boolean; error?: string } => {
      // Check file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        return {
          valid: false,
          error: t('projects:attachments.allowedTypes'),
        };
      }

      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        return {
          valid: false,
          error: t('projects:attachments.maxSize'),
        };
      }

      // Check max attachments
      if (isMaxReached) {
        return {
          valid: false,
          error: t('projects:attachments.maxReached', { max: maxAttachments }),
        };
      }

      return { valid: true };
    },
    [t, isMaxReached, maxAttachments]
  );

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);

      // Validate
      const validation = validateFile(file);
      if (!validation.valid) {
        setError(validation.error || 'Invalid file');
        return;
      }

      try {
        setUploading(true);
        await onUpload(file);
        
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed');
      } finally {
        setUploading(false);
      }
    },
    [validateFile, onUpload]
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isMaxReached) {
      setIsDragging(true);
    }
  }, [disabled, isMaxReached]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled || isMaxReached) return;

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFile(files[0]); // Upload first file only
      }
    },
    [disabled, isMaxReached, handleFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  const handleClick = useCallback(() => {
    if (!disabled && !isMaxReached) {
      fileInputRef.current?.click();
    }
  }, [disabled, isMaxReached]);

  return (
    <div className="space-y-3">
      {/* Upload Area */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={cn(
          'relative border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer',
          isDragging && !disabled && !isMaxReached
            ? 'border-[color:var(--primary)] bg-[color:var(--primary)]/5'
            : 'border-[color:var(--border)] hover:border-[color:var(--primary)]/50',
          (disabled || isMaxReached) && 'opacity-50 cursor-not-allowed',
          uploading && 'pointer-events-none'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.gif,.pdf"
          onChange={handleFileSelect}
          disabled={disabled || isMaxReached || uploading}
          className="hidden"
        />

        <div className="space-y-2">
          {/* Icon */}
          <div className="flex justify-center">
            <svg
              className={cn(
                'w-12 h-12',
                uploading
                  ? 'text-[color:var(--primary)] animate-pulse'
                  : 'text-[color:var(--muted-foreground)]'
              )}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>

          {/* Text */}
          <div className="space-y-1">
            <Text className="font-medium">
              {uploading
                ? t('projects:attachments.uploading')
                : t('projects:attachments.dragDrop')}
            </Text>
            <Text size="sm" variant="muted">
              {t('projects:attachments.allowedTypes')}
            </Text>
            <Text size="sm" variant="muted">
              {t('projects:attachments.maxSize')}
            </Text>
          </div>

          {/* Button */}
          {!uploading && (
            <Button
              variant="secondary"
              size="sm"
              disabled={disabled || isMaxReached}
              onClick={(e) => {
                e.stopPropagation();
                handleClick();
              }}
            >
              {t('projects:attachments.upload')}
            </Button>
          )}
        </div>
      </div>

      {/* Counter */}
      <div className="flex justify-between items-center">
        <Text size="sm" variant="muted">
          {t('projects:attachments.limit', {
            count: currentCount,
            max: maxAttachments,
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
    </div>
  );
}
