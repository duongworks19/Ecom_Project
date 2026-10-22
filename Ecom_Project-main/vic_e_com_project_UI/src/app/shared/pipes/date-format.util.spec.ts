import { formatDateVn } from './date-format.util';

describe('formatDateVn', () => {
  it('formats ISO date string to dd/MM/yyyy', () => {
    expect(formatDateVn('2026-10-19T08:30:00')).toBe('19/10/2026');
  });

  it('formats ISO date string with time when includeTime is true', () => {
    expect(formatDateVn('2026-10-19T08:05:00', true)).toBe('08:05 19/10/2026');
  });

  it('returns empty string for null or undefined', () => {
    expect(formatDateVn(null)).toBe('');
    expect(formatDateVn(undefined)).toBe('');
  });
});
