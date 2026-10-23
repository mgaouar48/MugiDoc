import { describe, it, expect } from 'vitest';
import { tryParseTime, slotsWithValue, SLOTS, periodOf } from './timeSlots';

describe('tryParseTime', () => {
  it('accepts an already-valid HH:MM value', () => {
    expect(tryParseTime('14:30')).toBe('14:30');
    expect(tryParseTime('00:00')).toBe('00:00');
    expect(tryParseTime('23:59')).toBe('23:59');
  });

  it('normalizes 4 digits typed without a colon ("1430" -> "14:30")', () => {
    expect(tryParseTime('1430')).toBe('14:30');
    expect(tryParseTime('0805')).toBe('08:05');
  });

  it('normalizes 3 digits typed without a colon ("930" -> "09:30")', () => {
    expect(tryParseTime('930')).toBe('09:30');
  });

  it('normalizes "14h30"-style separators by stripping non-digits', () => {
    expect(tryParseTime('14h30')).toBe('14:30');
  });

  it('rejects an out-of-range hour or minute', () => {
    expect(tryParseTime('25:00')).toBeNull();
    expect(tryParseTime('14:60')).toBeNull();
  });

  it('rejects garbage input', () => {
    expect(tryParseTime('')).toBeNull();
    expect(tryParseTime('abc')).toBeNull();
    expect(tryParseTime('1')).toBeNull();
  });
});

describe('periodOf', () => {
  it('buckets hours into Matin / Après-midi / Soir', () => {
    expect(periodOf(0)).toBe('Matin');
    expect(periodOf(11)).toBe('Matin');
    expect(periodOf(12)).toBe('Après-midi');
    expect(periodOf(17)).toBe('Après-midi');
    expect(periodOf(18)).toBe('Soir');
    expect(periodOf(23)).toBe('Soir');
  });
});

describe('slotsWithValue', () => {
  it('returns the plain 5-minute grid when the value already falls on it', () => {
    expect(slotsWithValue('14:30')).toBe(SLOTS);
  });

  it('returns the plain grid for an empty value', () => {
    expect(slotsWithValue('')).toBe(SLOTS);
  });

  it('inserts an off-grid value (e.g. inherited from an existing consultation) so it stays visible', () => {
    const slots = slotsWithValue('14:37');
    expect(slots.length).toBe(SLOTS.length + 1);
    expect(slots.some(s => s.value === '14:37' && s.period === 'Après-midi')).toBe(true);

    // reste trié chronologiquement, entre 14:35 et 14:40
    const index = slots.findIndex(s => s.value === '14:37');
    expect(slots[index - 1].value).toBe('14:35');
    expect(slots[index + 1].value).toBe('14:40');
  });

  it('does not insert an invalid value', () => {
    expect(slotsWithValue('not-a-time')).toBe(SLOTS);
  });
});
