import { describe, expect, it } from 'bun:test';
import { formatToDateStr } from '../../../../src/shared/utils/date';

describe('formatToDateStr helper', () => {
  it('should return null when date is null or undefined', () => {
    expect(formatToDateStr(null, 'yyyy-MM-dd')).toBeNull();
    expect(formatToDateStr(undefined, 'yyyy-MM-dd')).toBeNull();
  });

  it('should return null for invalid Date objects', () => {
    expect(formatToDateStr(new Date('invalid'), 'yyyy-MM-dd')).toBeNull();
  });

  it('should format a valid Date object to yyyy-MM-dd format using local time', () => {
    // Note: Month is 0-indexed, so 4 is May
    const date = new Date(2026, 4, 30);
    expect(formatToDateStr(date, 'yyyy-MM-dd')).toBe('2026-05-30');
  });

  it('should format a valid Date object to different custom formats', () => {
    const date = new Date(2026, 4, 30);
    expect(formatToDateStr(date, 'yyyy')).toBe('2026');
    expect(formatToDateStr(date, 'dd/MM/yyyy')).toBe('30/05/2026');
    expect(formatToDateStr(date, 'MM-yyyy')).toBe('05-2026');
  });
});
