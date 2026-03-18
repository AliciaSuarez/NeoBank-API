import { describe, expect, it } from 'vitest';
import { formatDate, formatMonthYear } from '../../utils/formatDate';

describe('formatDate', () => {
  it('formats a valid ISO date string', () => {
    // Use a fixed UTC date; locale output is 'Jan 15, 2024'
    const result = formatDate('2024-01-15T10:30:00.000Z');
    expect(result).toMatch(/Jan(uary)?\s+\d+,?\s*2024/);
  });

  it('returns — for null', () => {
    expect(formatDate(null)).toBe('—');
  });

  it('returns — for undefined', () => {
    expect(formatDate(undefined)).toBe('—');
  });

  it('returns — for an invalid date string', () => {
    expect(formatDate('not-a-date')).toBe('—');
  });
});

describe('formatMonthYear', () => {
  it('returns month and year', () => {
    const result = formatMonthYear('2024-01-15T12:00:00Z');
    expect(result).toMatch(/Jan(uary)?\s+2024/);
  });

  it('returns — for null', () => {
    expect(formatMonthYear(null)).toBe('—');
  });
});
