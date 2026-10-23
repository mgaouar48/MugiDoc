import { describe, it, expect } from 'vitest';
import { composeDiagnosticPreview, composeTraitementPreview } from './consultationText';

describe('composeDiagnosticPreview', () => {
  it('formats the primary diagnosis with its ICD-10 code', () => {
    expect(composeDiagnosticPreview({ primary: { label: 'Bronchite aiguë', icd10_code: 'J20.9' }, secondary: [] }))
      .toBe('Bronchite aiguë (J20.9)');
  });

  it('joins secondary diagnoses with " ; "', () => {
    expect(composeDiagnosticPreview({
      primary: { label: 'Bronchite aiguë', icd10_code: 'J20.9' },
      secondary: [{ label: 'Rhinite' }],
    })).toBe('Bronchite aiguë (J20.9) ; Rhinite');
  });

  it('returns empty string when there is no primary diagnosis', () => {
    expect(composeDiagnosticPreview({ secondary: [] })).toBe('');
    expect(composeDiagnosticPreview(undefined)).toBe('');
  });
});

describe('composeTraitementPreview', () => {
  it('joins formatted treatment lines with newlines', () => {
    expect(composeTraitementPreview([
      { medication: 'Amoxicilline', dosage: '1g', posology: '1 comprimé', frequency: '3 fois/jour', duration: '7 jours' },
      { medication: 'Paracétamol', dosage: '1g' },
    ])).toBe('Amoxicilline 1g — 1 comprimé — 3 fois/jour — 7 jours\nParacétamol 1g');
  });

  it('returns empty string when there are no lines', () => {
    expect(composeTraitementPreview([])).toBe('');
    expect(composeTraitementPreview(undefined)).toBe('');
  });
});
