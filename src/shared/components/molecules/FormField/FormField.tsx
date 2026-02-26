/**
 * FormField Molecule
 * Combines Label and Input atoms
 * Supports optional input mask via the `mask` prop.
 */

import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { Label } from '../../atoms/Label';
import { Input } from '../../atoms/Input';
import { MaskedInput } from '../../atoms/MaskedInput';
import { cn } from '../../../../core/utils/cn';

export interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
  /** Optional mask pattern. # = digit, A = letter, * = any. E.g. "(###) ###-####" */
  mask?: string;
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, helperText, className, id, mask, ...props }, ref) => {
    // Memoize ID generation to prevent recalculation on every render
    const inputId = id || `field-${label.toLowerCase().replace(/\s+/g, '-')}`;

    const sharedProps = {
      ref,
      id: inputId,
      className: cn(error && 'border-[color:var(--destructive)]', className),
      'aria-invalid': error ? ('true' as const) : ('false' as const),
      'aria-describedby':
        error || helperText
          ? `${inputId}-${error ? 'error' : 'helper'}`
          : undefined,
      ...props,
    };

    return (
      <div className="space-y-2">
        <Label htmlFor={inputId} className="mb-2">
          {label}
        </Label>
        {mask ? (
          <MaskedInput mask={mask} {...sharedProps} value={sharedProps.value != null ? String(sharedProps.value) : undefined} />
        ) : (
          <Input {...sharedProps} />
        )}
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

