import { describe, it, expect } from 'vitest';
import {
  parseFrequencyPerDay,
  parseDurationDays,
  parseUnitsPerDose,
  calculateQuantity,
  formatTreatmentLine,
  suggestPosologyUnit,
} from './treatment';

describe('parseFrequencyPerDay', () => {
  it('extracts the leading number before "fois"', () => {
    expect(parseFrequencyPerDay('3 fois/jour')).toBe(3);
    expect(parseFrequencyPerDay('3 fois par jour')).toBe(3);
    expect(parseFrequencyPerDay('1 fois/jour')).toBe(1);
  });

  it('extracts the leading number before "x"', () => {
    expect(parseFrequencyPerDay('2x/jour')).toBe(2);
    expect(parseFrequencyPerDay('4X par jour')).toBe(4);
  });

  it('returns null for non-numeric or empty frequencies', () => {
    expect(parseFrequencyPerDay('Si besoin')).toBeNull();
    expect(parseFrequencyPerDay('')).toBeNull();
    expect(parseFrequencyPerDay(undefined)).toBeNull();
  });
});

describe('parseDurationDays', () => {
  it('parses days directly', () => {
    expect(parseDurationDays('7 jours')).toBe(7);
    expect(parseDurationDays('1 jour')).toBe(1);
  });

  it('converts weeks to days', () => {
    expect(parseDurationDays('2 semaines')).toBe(14);
  });

  it('converts months to 30-day months', () => {
    expect(parseDurationDays('1 mois')).toBe(30);
    expect(parseDurationDays('2 mois')).toBe(60);
  });

  it('returns null for non-numeric or empty durations', () => {
    expect(parseDurationDays('jusqu’à amélioration')).toBeNull();
    expect(parseDurationDays('')).toBeNull();
    expect(parseDurationDays(undefined)).toBeNull();
  });
});

describe('parseUnitsPerDose', () => {
  it('extracts the leading number', () => {
    expect(parseUnitsPerDose('1 comprimé')).toBe(1);
    expect(parseUnitsPerDose('2 gélules')).toBe(2);
  });

  it('defaults to 1 when not interpretable', () => {
    expect(parseUnitsPerDose('1/2 comprimé')).toBe(1);
    expect(parseUnitsPerDose('')).toBe(1);
    expect(parseUnitsPerDose(undefined)).toBe(1);
  });
});

describe('calculateQuantity', () => {
  it('multiplies units per dose x frequency x duration, pluralizing the form', () => {
    expect(calculateQuantity({ posology: '1 comprimé', frequency: '3 fois/jour', duration: '7 jours', form: 'comprimé' }))
      .toBe('21 comprimés');
  });

  it('defaults to 1 unit per dose when posology is missing', () => {
    expect(calculateQuantity({ posology: undefined, frequency: '2 fois/jour', duration: '5 jours', form: 'gélule' }))
      .toBe('10 gélules');
  });

  it('falls back to "unités" when form is missing', () => {
    expect(calculateQuantity({ posology: '1', frequency: '2 fois/jour', duration: '3 jours', form: undefined }))
      .toBe('6 unités');
  });

  it('returns null when frequency is not interpretable (e.g. "Si besoin")', () => {
    expect(calculateQuantity({ posology: '1 comprimé', frequency: 'Si besoin', duration: '7 jours', form: 'comprimé' }))
      .toBeNull();
  });

  it('returns null when duration is not interpretable', () => {
    expect(calculateQuantity({ posology: '1 comprimé', frequency: '3 fois/jour', duration: '', form: 'comprimé' }))
      .toBeNull();
  });
});

describe('suggestPosologyUnit', () => {
  it('recognizes solid discrete forms from verbose official strings', () => {
    expect(suggestPosologyUnit('COMPRIME PELLICULE SECABLE')).toBe('comprimé');
    expect(suggestPosologyUnit('GELULES A LIBERATION MODIFIEE')).toBe('gélule');
    expect(suggestPosologyUnit('SACHET')).toBe('sachet');
    expect(suggestPosologyUnit('SUPPOSITOIRE')).toBe('suppositoire');
  });

  it('returns undefined for liquid/injectable forms rather than guessing', () => {
    expect(suggestPosologyUnit('SOLUTION BUVABLE')).toBeUndefined();
    expect(suggestPosologyUnit('SIROP')).toBeUndefined();
    expect(suggestPosologyUnit('SOLUTION INJECTABLE IV')).toBeUndefined();
  });

  it('returns undefined when form is missing', () => {
    expect(suggestPosologyUnit(undefined)).toBeUndefined();
    expect(suggestPosologyUnit('')).toBeUndefined();
  });
});

describe('formatTreatmentLine', () => {
  it('matches the server-side recomposition format exactly', () => {
    expect(formatTreatmentLine({
      medication: 'Amoxicilline',
      dosage: '1g',
      posology: '1 comprimé',
      frequency: '3 fois/jour',
      duration: '7 jours',
    })).toBe('Amoxicilline 1g — 1 comprimé — 3 fois/jour — 7 jours');
  });

  it('omits missing parts without leaving stray separators', () => {
    expect(formatTreatmentLine({ medication: 'Doliprane' })).toBe('Doliprane');
    expect(formatTreatmentLine({ medication: 'Doliprane', dosage: '1g' })).toBe('Doliprane 1g');
    expect(formatTreatmentLine({ medication: 'Doliprane', frequency: '3 fois/jour' })).toBe('Doliprane — 3 fois/jour');
  });
});
