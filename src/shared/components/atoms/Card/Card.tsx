/**
 * Card Atom
 * Basic card container component
 */

import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { cn } from '../../../../core/utils/cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-[color:var(--card)] rounded-lg shadow-sm border border-[color:var(--border)]',
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';

