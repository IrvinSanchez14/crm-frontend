/**
 * Currency and decimal formatting utilities
 */

/**
 * Format a string input to currency format (with dollar sign and 2 decimal places)
 * @param value - The input string value
 * @returns Formatted currency string
 */
export const formatCurrencyInput = (value: string): string => {
  // Remove all non-numeric characters except the decimal point
  let sanitized = value.replace(/[^\d.]/g, '');
  
  // Remove multiple decimal points
  const parts = sanitized.split('.');
  if (parts.length > 2) {
    sanitized = parts[0] + '.' + parts.slice(1).join('');
  }
  
  // Limit to 2 decimal places
  if (parts.length === 2) {
    sanitized = parts[0] + '.' + parts[1].substring(0, 2);
  }
  
  return sanitized;
};

/**
 * Format a number to currency display format
 * @param value - The numeric value
 * @returns Formatted currency string with dollar sign
 */
export const formatCurrencyDisplay = (value: number | string): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return '$0.00';
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numValue);
};

/**
 * Format a string input to decimal format (up to 2 decimal places)
 * @param value - The input string value
 * @returns Formatted decimal string
 */
export const formatDecimalInput = (value: string): string => {
  // Remove all non-numeric characters except the decimal point
  let sanitized = value.replace(/[^\d.]/g, '');
  
  // Remove multiple decimal points
  const parts = sanitized.split('.');
  if (parts.length > 2) {
    sanitized = parts[0] + '.' + parts.slice(1).join('');
  }
  
  // Limit to 2 decimal places
  if (parts.length === 2) {
    sanitized = parts[0] + '.' + parts[1].substring(0, 2);
  }
  
  return sanitized;
};

/**
 * Validate if a string is a valid currency value
 * @param value - The string to validate
 * @returns True if valid, false otherwise
 */
export const isValidCurrencyInput = (value: string): boolean => {
  if (!value) return true; // Empty is valid (optional field)
  
  // Check if it's a valid number format
  const num = parseFloat(value);
  return !isNaN(num) && isFinite(num) && num >= 0;
};
