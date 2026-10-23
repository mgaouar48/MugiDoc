import { describe, it, expect } from 'vitest';
import { hasAllergyConflict } from './allergies';

describe('hasAllergyConflict', () => {
  it('detects a medication name mentioned in the allergies text', () => {
    expect(hasAllergyConflict('Amoxicilline', 'Allergie à la pénicilline et amoxicilline')).toBe(true);
  });

  it('is accent- and case-insensitive', () => {
    expect(hasAllergyConflict('AMOXICILLINE', 'allergie a l\'amoxicilline')).toBe(true);
    expect(hasAllergyConflict('Céphalosporine', 'cephalosporine')).toBe(true);
  });

  it('matches when the allergy token is a substring of the term (dosage suffix)', () => {
    expect(hasAllergyConflict('Aspirine 500mg', 'aspirine')).toBe(true);
  });

  it('returns false when there is no overlap', () => {
    expect(hasAllergyConflict('Paracétamol', 'Allergie à la pénicilline')).toBe(false);
  });

  it('returns false when allergies text or term is empty', () => {
    expect(hasAllergyConflict('Amoxicilline', undefined)).toBe(false);
    expect(hasAllergyConflict('Amoxicilline', '')).toBe(false);
    expect(hasAllergyConflict('', 'amoxicilline')).toBe(false);
  });

  it('ignores tokens shorter than 4 characters to avoid false positives', () => {
    expect(hasAllergyConflict('Ibuprofène', 'la, de, et poussière')).toBe(false);
  });
});
