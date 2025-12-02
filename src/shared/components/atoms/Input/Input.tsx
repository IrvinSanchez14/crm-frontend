/**
 * Input Atom
 * Basic input component
 */

import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { cn } from '../../../../core/utils/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'w-full px-4 py-2 border-0 border-b border-b-[color:var(--input)] bg-transparent text-[color:var(--foreground)] focus:outline-none focus:border-b-[color:var(--ring)]',
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

