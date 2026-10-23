import { describe, it, expect } from 'vitest';
import { toggleCheckedItem, getNormalItems, applyNormalExam, summarizeExamSection } from './clinicalExam';

const emptySection = (key: string, label: string) => ({ key, label, checked_items: [] as string[] });

describe('toggleCheckedItem', () => {
  it('checks an item not yet present', () => {
    const section = toggleCheckedItem(emptySection('cardiovascular', 'Cardiovasculaire'), 'Souffle cardiaque');
    expect(section.checked_items).toEqual(['Souffle cardiaque']);
  });

  it('unchecks an item already present', () => {
    const withItem = { ...emptySection('cardiovascular', 'Cardiovasculaire'), checked_items: ['Souffle cardiaque'] };
    const section = toggleCheckedItem(withItem, 'Souffle cardiaque');
    expect(section.checked_items).toEqual([]);
  });

  it('does not affect other fields', () => {
    const withOther = { ...emptySection('cardiovascular', 'Cardiovasculaire'), other_checked: true, other_text: 'test' };
    const section = toggleCheckedItem(withOther, 'Souffle cardiaque');
    expect(section.other_checked).toBe(true);
    expect(section.other_text).toBe('test');
  });
});

describe('getNormalItems', () => {
  it('returns only items flagged normal for a known catalog key', () => {
    const items = getNormalItems('cardiovascular');
    expect(items).toContain('Bruits du cœur réguliers');
    expect(items).not.toContain('Souffle cardiaque');
  });

  it('returns an empty array for an unknown key', () => {
    expect(getNormalItems('does-not-exist')).toEqual([]);
  });
});

describe('applyNormalExam', () => {
  it('replaces checked_items with exactly the normal items', () => {
    const withAbnormal = { ...emptySection('cardiovascular', 'Cardiovasculaire'), checked_items: ['Souffle cardiaque'] };
    const section = applyNormalExam(withAbnormal, 'cardiovascular');
    expect(section.checked_items).toEqual(getNormalItems('cardiovascular'));
    expect(section.checked_items).not.toContain('Souffle cardiaque');
  });

  it('does not touch other_checked/other_text', () => {
    const withOther = { ...emptySection('respiratory', 'Respiratoire'), other_checked: true, other_text: 'note libre' };
    const section = applyNormalExam(withOther, 'respiratory');
    expect(section.other_checked).toBe(true);
    expect(section.other_text).toBe('note libre');
  });
});

describe('summarizeExamSection', () => {
  it('returns an empty string when there is nothing to summarize', () => {
    expect(summarizeExamSection(emptySection('general', 'Général'))).toBe('');
  });

  it('joins checked items with a comma', () => {
    const section = { ...emptySection('cardiovascular', 'Cardiovasculaire'), checked_items: ['Bruits du cœur réguliers', 'Pas de souffle audible'] };
    expect(summarizeExamSection(section)).toBe('Bruits du cœur réguliers, Pas de souffle audible');
  });

  it('appends the "Autre" free text when checked', () => {
    const section = {
      ...emptySection('dermatological', 'Dermatologique'),
      checked_items: ['Peau saine'],
      other_checked: true,
      other_text: 'petit hématome au tibia gauche',
    };
    expect(summarizeExamSection(section)).toBe('Peau saine, petit hématome au tibia gauche');
  });

  it('ignores "Autre" text when the checkbox is not checked', () => {
    const section = {
      ...emptySection('dermatological', 'Dermatologique'),
      checked_items: ['Peau saine'],
      other_checked: false,
      other_text: 'texte oublié non pertinent',
    };
    expect(summarizeExamSection(section)).toBe('Peau saine');
  });

  it('falls back to free_text when there are no checked items', () => {
    const section = { ...emptySection('overview', 'Examen clinique'), free_text: 'Patient calme, examen globalement rassurant.' };
    expect(summarizeExamSection(section)).toBe('Patient calme, examen globalement rassurant.');
  });
});
