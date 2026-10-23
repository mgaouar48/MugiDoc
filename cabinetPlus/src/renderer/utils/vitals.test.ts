import { describe, it, expect } from 'vitest';
import { calculateBmi, interpretBmi, evaluateVitals } from './vitals';

describe('calculateBmi', () => {
  it('computes weight (kg) / height (m)^2, rounded to 1 decimal', () => {
    expect(calculateBmi(70, 175)).toBe(22.9);
    expect(calculateBmi(90, 180)).toBe(27.8);
  });

  it('returns undefined when weight or height is missing', () => {
    expect(calculateBmi(undefined, 175)).toBeUndefined();
    expect(calculateBmi(70, undefined)).toBeUndefined();
    expect(calculateBmi(undefined, undefined)).toBeUndefined();
  });

  it('returns undefined for zero or negative values', () => {
    expect(calculateBmi(0, 175)).toBeUndefined();
    expect(calculateBmi(70, 0)).toBeUndefined();
    expect(calculateBmi(-5, 175)).toBeUndefined();
  });
});

describe('interpretBmi', () => {
  it('returns undefined for a child (< 18 ans)', () => {
    expect(interpretBmi(22, 10)).toBeUndefined();
    expect(interpretBmi(30, 17)).toBeUndefined();
  });

  it('classifies each WHO band for an adult', () => {
    expect(interpretBmi(17, 30)?.label).toBe('Dénutrition');
    expect(interpretBmi(22, 30)?.label).toBe('Corpulence normale');
    expect(interpretBmi(27, 30)?.label).toBe('Surpoids');
    expect(interpretBmi(32, 30)?.label).toBe('Obésité modérée (grade I)');
    expect(interpretBmi(37, 30)?.label).toBe('Obésité sévère (grade II)');
    expect(interpretBmi(42, 30)?.label).toBe('Obésité morbide (grade III)');
  });

  it('treats exactly 18 years old as adult', () => {
    expect(interpretBmi(22, 18)?.label).toBe('Corpulence normale');
  });
});

describe('evaluateVitals', () => {
  it('flags nothing for an empty vitals object', () => {
    expect(evaluateVitals({}, 40)).toEqual([]);
  });

  it('flags nothing for values within normal adult ranges', () => {
    const vitals = {
      temperature: 37,
      heart_rate: 75,
      respiratory_rate: 16,
      spo2: 98,
      blood_pressure_systolic: 120,
      blood_pressure_diastolic: 80,
      glycemia: 0.9,
    };
    expect(evaluateVitals(vitals, 40)).toEqual([]);
  });

  it('flags fever and hypothermia', () => {
    expect(evaluateVitals({ temperature: 38.5 }, 40)).toEqual([{ field: 'temperature', label: 'Fièvre' }]);
    expect(evaluateVitals({ temperature: 34 }, 40)).toEqual([{ field: 'temperature', label: 'Hypothermie' }]);
  });

  it('uses adult heart-rate thresholds by default', () => {
    expect(evaluateVitals({ heart_rate: 45 }, 40)).toEqual([{ field: 'heart_rate', label: 'Bradycardie' }]);
    expect(evaluateVitals({ heart_rate: 110 }, 40)).toEqual([{ field: 'heart_rate', label: 'Tachycardie' }]);
  });

  it('uses wider heart-rate thresholds for a child under 12', () => {
    // 110 bpm is tachycardia for an adult but normal for a young child
    expect(evaluateVitals({ heart_rate: 110 }, 6)).toEqual([]);
    expect(evaluateVitals({ heart_rate: 65 }, 6)).toEqual([{ field: 'heart_rate', label: 'Bradycardie' }]);
  });

  it('flags abnormal respiratory rate, age-aware', () => {
    expect(evaluateVitals({ respiratory_rate: 25 }, 40)).toEqual([{ field: 'respiratory_rate', label: 'Tachypnée' }]);
    expect(evaluateVitals({ respiratory_rate: 25 }, 6)).toEqual([]);
  });

  it('flags desaturation below 95%', () => {
    expect(evaluateVitals({ spo2: 92 }, 40)).toEqual([{ field: 'spo2', label: 'Désaturation' }]);
    expect(evaluateVitals({ spo2: 97 }, 40)).toEqual([]);
  });

  it('flags hypertension and hypotension for an adult', () => {
    expect(evaluateVitals({ blood_pressure_systolic: 150, blood_pressure_diastolic: 95 }, 40)).toEqual([
      { field: 'blood_pressure_systolic', label: 'Hypertension' },
      { field: 'blood_pressure_diastolic', label: 'Hypertension' },
    ]);
    expect(evaluateVitals({ blood_pressure_systolic: 85, blood_pressure_diastolic: 55 }, 40)).toEqual([
      { field: 'blood_pressure_systolic', label: 'Hypotension' },
      { field: 'blood_pressure_diastolic', label: 'Hypotension' },
    ]);
  });

  it('never evaluates blood pressure for a child (percentile-dependent norms)', () => {
    expect(evaluateVitals({ blood_pressure_systolic: 150, blood_pressure_diastolic: 95 }, 6)).toEqual([]);
  });

  it('requires both systolic and diastolic to be present to evaluate blood pressure', () => {
    expect(evaluateVitals({ blood_pressure_systolic: 150 }, 40)).toEqual([]);
  });

  it('flags hypo/hyperglycemia', () => {
    expect(evaluateVitals({ glycemia: 0.5 }, 40)).toEqual([{ field: 'glycemia', label: 'Hypoglycémie' }]);
    expect(evaluateVitals({ glycemia: 1.5 }, 40)).toEqual([{ field: 'glycemia', label: 'Hyperglycémie' }]);
  });

  it('combines multiple flags at once', () => {
    const flags = evaluateVitals({ temperature: 39, heart_rate: 130 }, 40);
    expect(flags).toEqual([
      { field: 'temperature', label: 'Fièvre' },
      { field: 'heart_rate', label: 'Tachycardie' },
    ]);
  });
});
