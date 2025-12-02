/**
 * Text Atom
 * Basic text/paragraph component
 */

import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { cn } from '../../../../core/utils/cn';

export interface TextProps extends HTMLAttributes<HTMLParagraphElement> {
  variant?: 'default' | 'muted' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
}

export const Text = forwardRef<HTMLParagraphElement, TextProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    const variants = {
      default: 'text-[color:var(--foreground)]',
      muted: 'text-[color:var(--muted-foreground)]',
      destructive: 'text-[color:var(--destructive)]',
    };

    const sizes = {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
    };

    return (
      <p
        ref={ref}
        className={cn(variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);

Text.displayName = 'Text';

