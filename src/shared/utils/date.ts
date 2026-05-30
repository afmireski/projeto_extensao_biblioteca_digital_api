import { format, isValid } from 'date-fns';

/**
 * Formats a Date object (or null/undefined) into a string using the specified format pattern.
 * Neutralizes timezone shifts for date-only formats by formatting the date using local execution context timezone.
 *
 * @param date - The Date object to format, or null/undefined.
 * @param formatStr - The date-fns format pattern string (e.g. 'yyyy-MM-dd').
 * @returns The formatted date string, or null if the date is invalid, null, or undefined.
 */
export function formatToDateStr(
  date: Date | null | undefined,
  formatStr: string,
): string | null {
  if (!date || !isValid(date)) {
    return null;
  }
  return format(date, formatStr);
}
