/**
 * Utility: Class Name Helper
 * Combines clsx for conditional classes
 */

import clsx, { type ClassValue } from 'clsx';

/**
 * Merges class names conditionally
 * @param inputs - Class names or conditional class objects
 * @returns Merged class string
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
