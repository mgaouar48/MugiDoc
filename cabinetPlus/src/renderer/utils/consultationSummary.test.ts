import { describe, it, expect } from 'vitest';
import { formatAnamneseLines, formatVitalsLines, formatCarePlanLines } from './consultationSummary';

describe('formatAnamneseLines', () => {
  it('returns one line per filled field', () => {
    const lines = formatAnamneseLines({ symptoms: 'Toux', evolution: 'Aggravation' });
    expect(lines).toEqual(['Symptômes : Toux', 'Évolution : Aggravation']);
  });

  it('returns an empty array when nothing is filled', () => {
    expect(formatAnamneseLines({})).toEqual([]);
  });
});

describe('formatVitalsLines', () => {
  it('formats each measured constant with its unit', () => {
    const lines = formatVitalsLines({ temperature: 38.5, blood_pressure_systolic: 120, blood_pressure_diastolic: 80 });
    expect(lines).toEqual(['Température : 38.5 °C', 'TA : 120/80 mmHg']);
  });

  it('omits blood pressure when only one of the two values is set', () => {
    expect(formatVitalsLines({ blood_pressure_systolic: 120 })).toEqual([]);
  });

  it('returns an empty array when nothing is measured', () => {
    expect(formatVitalsLines({})).toEqual([]);
  });
});

describe('formatCarePlanLines', () => {
  it('includes free text, rest days and the computed control date', () => {
    const lines = formatCarePlanLines({ text: 'Repos au lit', rest_days: 3, control_days: 7 }, '2026-08-26');
    expect(lines).toEqual(['Repos au lit', 'Repos : 3 jours', 'Contrôle : dans 7 jours (02/09/2026)']);
  });

  it('uses singular wording for a single day', () => {
    const lines = formatCarePlanLines({ rest_days: 1, control_days: 1 }, '2026-08-26');
    expect(lines).toEqual(['Repos : 1 jour', 'Contrôle : dans 1 jour (27/08/2026)']);
  });

  it('returns an empty array for an empty care plan', () => {
    expect(formatCarePlanLines({}, '2026-08-26')).toEqual([]);
  });
});
