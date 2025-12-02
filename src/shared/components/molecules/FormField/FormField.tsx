/**
 * FormField Molecule
 * Combines Label and Input atoms
 */

import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { Label } from '../../atoms/Label';
import { Input } from '../../atoms/Input';
import { cn } from '../../../../core/utils/cn';

export interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, helperText, className, id, ...props }, ref) => {
    // Memoize ID generation to prevent recalculation on every render
    const inputId = id || `field-${label.toLowerCase().replace(/\s+/g, '-')}`;

    return (
      <div className="space-y-2">
        <Label htmlFor={inputId} className="mb-2">
          {label}
        </Label>
        <Input
          ref={ref}
          id={inputId}
          className={cn(error && 'border-[color:var(--destructive)]', className)}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            error || helperText
              ? `${inputId}-${error ? 'error' : 'helper'}`
              : undefined
          }
          {...props}
        />
        {error && (
          <p
            id={`${inputId}-error`}
            className="text-sm text-[color:var(--destructive)]"
            role="alert"
          >
            {error}
          </p>
        )}
        {helperText && !error && (
          <p
            id={`${inputId}-helper`}
            className="text-sm text-[color:var(--muted-foreground)]"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

FormField.displayName = 'FormField';

