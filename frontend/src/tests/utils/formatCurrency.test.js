import { describe, expect, it } from 'vitest';
import { formatCurrency } from '../../utils/formatCurrency';

describe('formatCurrency', () => {
  it('formats a positive amount as USD', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56');
  });

  it('formats zero correctly', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('formats a negative amount', () => {
    expect(formatCurrency(-500)).toBe('-$500.00');
  });

  it('formats a large amount with correct separators', () => {
    expect(formatCurrency(1000000)).toBe('$1,000,000.00');
  });

  it('returns — for null', () => {
    expect(formatCurrency(null)).toBe('—');
  });

  it('returns — for undefined', () => {
    expect(formatCurrency(undefined)).toBe('—');
  });
});
