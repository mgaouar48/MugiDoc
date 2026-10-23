import { describe, it, expect } from 'vitest';
import { resolveDiagnostics, resolveTreatmentLines, ConsultationUI } from './consultationMappers';

const baseConsultation: ConsultationUI = {
  id: '1',
  patientName: 'Jean Dupont',
  patientId: '1',
  date: '2020-01-15',
  time: '09:00',
  motif: 'Contrôle',
  diagnostic: '',
  traitement: '',
  status: 'completed',
  notes: '',
};

/**
 * Non-régression L17.4 : une consultation créée avant l'introduction des
 * blocs structurés (L8/L9) n'a que les champs hérités `diagnostic`/`traitement`
 * en texte libre, jamais `diagnostics`/`treatment_lines`. Ces deux fonctions
 * sont ce que le formulaire d'édition et l'aperçu d'impression appellent pour
 * afficher une consultation quelle que soit son ancienneté — cf. décision
 * n°2 (L8.6/L9) : ne jamais perdre silencieusement le diagnostic/traitement
 * d'une ancienne consultation à l'ouverture.
 */
describe('resolveDiagnostics', () => {
  it('recomposes a structured diagnostic from the legacy free-text field when there is no structured block', () => {
    const legacy: ConsultationUI = { ...baseConsultation, diagnostic: 'Bronchite aiguë' };
    expect(resolveDiagnostics(legacy)).toEqual({ primary: { label: 'Bronchite aiguë' }, secondary: [] });
  });

  it('prefers the structured block over the legacy text field when both are present', () => {
    const consultation: ConsultationUI = {
      ...baseConsultation,
      diagnostic: 'ancien texte figé',
      diagnostics: { primary: { label: 'Rhinopharyngite', icd10_code: 'J00' }, secondary: [] },
    };
    expect(resolveDiagnostics(consultation)).toEqual({ primary: { label: 'Rhinopharyngite', icd10_code: 'J00' }, secondary: [] });
  });

  it('returns an empty structure when neither the legacy field nor the structured block is set', () => {
    expect(resolveDiagnostics(baseConsultation)).toEqual({ primary: undefined, secondary: [] });
  });
});

describe('resolveTreatmentLines', () => {
  it('wraps the legacy free-text treatment field as a single line when there is no structured block', () => {
    const legacy: ConsultationUI = { ...baseConsultation, traitement: 'Paracétamol 1g x3/j' };
    expect(resolveTreatmentLines(legacy)).toEqual([{ medication: 'Paracétamol 1g x3/j' }]);
  });

  it('prefers the structured lines over the legacy text field when both are present', () => {
    const consultation: ConsultationUI = {
      ...baseConsultation,
      traitement: 'ancien texte figé',
      treatment_lines: [{ medication: 'Amoxicilline', dosage: '1g' }],
    };
    expect(resolveTreatmentLines(consultation)).toEqual([{ medication: 'Amoxicilline', dosage: '1g' }]);
  });

  it('returns an empty array when neither the legacy field nor the structured block is set', () => {
    expect(resolveTreatmentLines(baseConsultation)).toEqual([]);
  });
});
