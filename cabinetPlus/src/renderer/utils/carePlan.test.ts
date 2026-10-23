import { describe, it, expect } from 'vitest';
import { addDaysToDate, formatDateFr, formatAppointmentDisplay } from './carePlan';

describe('addDaysToDate', () => {
  it('adds days within the same month', () => {
    expect(addDaysToDate('2026-08-26', 3)).toBe('2026-08-29');
  });

  it('rolls over to the next month', () => {
    expect(addDaysToDate('2026-08-29', 7)).toBe('2026-09-05');
  });

  it('rolls over to the next year', () => {
    expect(addDaysToDate('2026-12-28', 5)).toBe('2027-01-02');
  });

  it('returns the same date for 0 days', () => {
    expect(addDaysToDate('2026-08-26', 0)).toBe('2026-08-26');
  });

  it('returns null for a negative or non-finite day count', () => {
    expect(addDaysToDate('2026-08-26', -1)).toBeNull();
    expect(addDaysToDate('2026-08-26', NaN)).toBeNull();
  });

  it('returns null for a missing or invalid base date', () => {
    expect(addDaysToDate('', 3)).toBeNull();
    expect(addDaysToDate('not-a-date', 3)).toBeNull();
  });
});

describe('formatDateFr', () => {
  it('formats an ISO date to dd/MM/yyyy', () => {
    expect(formatDateFr('2026-09-02')).toBe('02/09/2026');
  });

  it('returns an empty string for an invalid date', () => {
    expect(formatDateFr('not-a-date')).toBe('');
  });
});

describe('formatAppointmentDisplay', () => {
  it('matches the target format', () => {
    expect(formatAppointmentDisplay('2026-09-02', '10:30')).toBe('02/09/2026 à 10:30');
  });

  it('falls back to the time alone when the date is invalid', () => {
    expect(formatAppointmentDisplay('not-a-date', '10:30')).toBe('10:30');
  });
});
