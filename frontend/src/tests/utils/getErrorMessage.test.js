import { describe, expect, it } from 'vitest';
import { getErrorMessage } from '../../utils/getErrorMessage';

describe('getErrorMessage', () => {
  it('extracts error.response.data.error (highest priority)', () => {
    const err = { response: { data: { error: 'Insufficient funds' } } };
    expect(getErrorMessage(err)).toBe('Insufficient funds');
  });

  it('falls back to error.response.data.message', () => {
    const err = { response: { data: { message: 'Not found' } } };
    expect(getErrorMessage(err)).toBe('Not found');
  });

  it('falls back to error.message', () => {
    const err = { message: 'Network Error' };
    expect(getErrorMessage(err)).toBe('Network Error');
  });

  it('returns fallback string for an empty object', () => {
    expect(getErrorMessage({})).toBe('An unexpected error occurred.');
  });

  it('returns fallback string for null', () => {
    expect(getErrorMessage(null)).toBe('An unexpected error occurred.');
  });

  it('returns fallback string for undefined', () => {
    expect(getErrorMessage(undefined)).toBe('An unexpected error occurred.');
  });

  it('prefers response.data.error over response.data.message', () => {
    const err = {
      response: { data: { error: 'Primary error', message: 'Secondary message' } },
    };
    expect(getErrorMessage(err)).toBe('Primary error');
  });
});
