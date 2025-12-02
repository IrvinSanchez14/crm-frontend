/**
 * Label Atom
 * Basic label component
 */

import { forwardRef } from 'react';
import type { LabelHTMLAttributes } from 'react';
import { cn } from '../../../../core/utils/cn';

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          'block text-sm font-medium text-[color:var(--foreground)]',
          className
        )}
        {...props}
      />
    );
  }
);

Label.displayName = 'Label';

