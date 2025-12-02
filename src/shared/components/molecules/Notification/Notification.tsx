/**
 * Notification Molecule
 * Single notification item (combines Card, Text, and Button atoms)
 * Performance: Memoized to prevent unnecessary re-renders
 */

import { memo, useCallback } from 'react';
import { Card } from '../../atoms/Card';
import { Text } from '../../atoms/Text';
import { Button } from '../../atoms/Button';

export interface NotificationProps {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  onClose: (id: string) => void;
}

export const Notification = memo(function Notification({
  id,
  message,
  type = 'info',
  onClose,
}: NotificationProps) {
  // Memoize close handler to prevent unnecessary re-renders
  const handleClose = useCallback(() => {
    onClose(id);
  }, [id, onClose]);
  const typeStyles = {
    success:
      'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200',
    error:
      'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200',
    warning:
      'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200',
    info: 'bg-[color:var(--card)] border-[color:var(--border)] text-[color:var(--foreground)]',
  };

  return (
    <Card className={`p-4 shadow-lg min-w-[300px] ${typeStyles[type]}`}>
      <div className="flex items-start justify-between">
        <Text size="sm" className="font-medium flex-1">
          {message}
        </Text>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClose}
          className="ml-4 text-current opacity-70 hover:opacity-100 p-0 h-auto min-w-0"
          aria-label="Close notification"
        >
          ×
        </Button>
      </div>
    </Card>
  );
});

