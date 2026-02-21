/**
 * MaskedInput Atom
 * Input with configurable character mask.
 * Mask characters:
 *   # — digit (0-9)
 *   A — letter (a-z, A-Z)
 *   * — any character
 * All other characters are treated as literal separators.
 *
 * Example masks:
 *   "(###) ###-####"  — US phone
 *   "##/##/####"      — date
 *   "###-##-####"     — SSN
 */

import { forwardRef, useRef, useCallback } from 'react';
import type { InputHTMLAttributes, ChangeEvent } from 'react';
import { cn } from '../../../../core/utils/cn';

export interface MaskedInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  /** Mask pattern. # = digit, A = letter, * = any. */
  mask: string;
  /** Current raw (unmasked) value — digits/letters only. */
  value?: string;
  /** Called with the new **masked display value** on every change. */
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
}

/** Extract only the characters that match mask slots from a raw string. */
function extractRaw(input: string, mask: string): string {
  let raw = '';
  let inputIdx = 0;

  for (let m = 0; m < mask.length && inputIdx < input.length; m++) {
    const mc = mask[m];
    const ic = input[inputIdx];

    if (mc === '#') {
      if (/\d/.test(ic)) { raw += ic; inputIdx++; }
      else { inputIdx++; m--; } // skip non-digit in input
    } else if (mc === 'A') {
      if (/[a-zA-Z]/.test(ic)) { raw += ic; inputIdx++; }
      else { inputIdx++; m--; }
    } else if (mc === '*') {
      raw += ic;
      inputIdx++;
    } else {
      // literal — skip in input if it matches
      if (ic === mc) inputIdx++;
    }
  }

  return raw;
}

/** Apply mask to raw characters, returning the formatted string. */
function applyMask(raw: string, mask: string): string {
  let result = '';
  let rawIdx = 0;

  for (let m = 0; m < mask.length && rawIdx < raw.length; m++) {
    const mc = mask[m];
    if (mc === '#' || mc === 'A' || mc === '*') {
      result += raw[rawIdx];
      rawIdx++;
    } else {
      result += mc;
    }
  }

  return result;
}

/** Count how many mask slots (# A *) exist before position `pos` in the mask. */
function rawIndexAtCursor(mask: string, cursorPos: number): number {
  let count = 0;
  for (let i = 0; i < cursorPos && i < mask.length; i++) {
    const c = mask[i];
    if (c === '#' || c === 'A' || c === '*') count++;
  }
  return count;
}

/** Given a raw index, find the corresponding cursor position in the masked output. */
function cursorPosForRawIndex(mask: string, rawIndex: number): number {
  let count = 0;
  for (let i = 0; i < mask.length; i++) {
    const c = mask[i];
    if (c === '#' || c === 'A' || c === '*') {
      if (count === rawIndex) return i;
      count++;
    }
  }
  // After last slot — place cursor at the end of the formatted string
  return mask.length;
}

export const MaskedInput = forwardRef<HTMLInputElement, MaskedInputProps>(
  ({ mask, value = '', onChange, className, ...props }, ref) => {
    const internalRef = useRef<HTMLInputElement | null>(null);

    const setRefs = useCallback(
      (node: HTMLInputElement | null) => {
        internalRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
      },
      [ref],
    );

    // Strip any formatting from value prop to get raw chars, then reformat
    const rawFromValue = extractRaw(value, mask);
    const displayValue = applyMask(rawFromValue, mask);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      const input = e.target;
      const cursorBefore = input.selectionStart ?? 0;

      // Extract raw chars from what the user typed
      const newRaw = extractRaw(input.value, mask);
      const newDisplay = applyMask(newRaw, mask);

      // Compute new cursor position
      const rawCursor = rawIndexAtCursor(mask, cursorBefore);
      // Clamp to actual raw length
      const clampedRaw = Math.min(rawCursor, newRaw.length);
      const newCursor = cursorPosForRawIndex(mask, clampedRaw);
      // If cursor lands on a literal, advance past it
      const adjustedCursor = Math.min(newCursor + 1, newDisplay.length);

      // Synthesize event with masked value
      const nativeEvent = e.nativeEvent;
      const syntheticEvent = {
        ...e,
        target: { ...input, value: newDisplay },
        currentTarget: { ...input, value: newDisplay },
        nativeEvent,
      } as ChangeEvent<HTMLInputElement>;

      onChange?.(syntheticEvent);

      // Restore cursor position after React re-renders
      requestAnimationFrame(() => {
        if (internalRef.current) {
          const pos = Math.min(adjustedCursor, newDisplay.length);
          internalRef.current.setSelectionRange(pos, pos);
        }
      });
    };

    return (
      <input
        ref={setRefs}
        type="tel"
        value={displayValue}
        onChange={handleChange}
        className={cn(
          'w-full px-4 py-2 border-0 border-b border-b-[color:var(--input)] bg-transparent text-[color:var(--foreground)] focus:outline-none focus:border-b-[color:var(--ring)]',
          className,
        )}
        {...props}
      />
    );
  },
);

MaskedInput.displayName = 'MaskedInput';
