import { ClinicalExamSection } from '../../shared/types';
import { CLINICAL_EXAM_CATALOG } from '../constants/clinicalExam';

/**
 * Logique pure de l'examen clinique modulaire — cf. PLAN_CONSULTATION.md L7.
 */

/** Coche/décoche un item de la sous-section (bascule). */
export const toggleCheckedItem = (section: ClinicalExamSection, item: string): ClinicalExamSection => {
  const checked = section.checked_items.includes(item)
    ? section.checked_items.filter(i => i !== item)
    : [...section.checked_items, item];
  return { ...section, checked_items: checked };
};

/** Libellés des items marqués « normal » pour une sous-section du catalogue. */
export const getNormalItems = (key: string): string[] =>
  CLINICAL_EXAM_CATALOG.find(entry => entry.key === key)?.items
    .filter(item => item.normal)
    .map(item => item.label) ?? [];

/**
 * Raccourci « Examen normal » (L7.5) : remplace les items cochés par
 * exactement les items normaux de la sous-section — pas additif, pour que
 * le résultat reste un état cohérent (« cet examen était normal »).
 * `other_checked`/`other_text` ne sont pas touchés.
 */
export const applyNormalExam = (section: ClinicalExamSection, key: string): ClinicalExamSection => ({
  ...section,
  checked_items: getNormalItems(key),
});

/**
 * Rendu synthétique en une phrase (L7.6), réutilisable dans le compte rendu
 * et le résumé latéral. Chaîne vide si la sous-section n'a rien à résumer.
 */
export const summarizeExamSection = (section: ClinicalExamSection): string => {
  const parts = [...section.checked_items];
  if (section.other_checked && section.other_text?.trim()) {
    parts.push(section.other_text.trim());
  }
  if (parts.length === 0 && section.free_text?.trim()) {
    return section.free_text.trim();
  }
  return parts.join(', ');
};
