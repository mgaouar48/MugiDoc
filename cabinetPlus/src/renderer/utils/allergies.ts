import { normalize } from "./motifs";
import { checkAllergy, AllergyWarning } from "./drugSafety";

export type { AllergyWarning } from "./drugSafety";

/** Sépare un champ texte libre d'allergies en tokens comparables individuellement. */
const splitAllergyTokens = (allergiesText: string): string[] =>
  allergiesText
    .split(/[,;/\n]|(?:\bet\b)/i)
    .map(token => normalize(token))
    .filter(token => token.length >= 4); // évite les faux positifs sur des tokens trop courts ("la", "de"...)

/**
 * Rapprochement littéral entre un terme et le champ libre d'allergies, dans les
 * deux sens. Repli historique (L9.7), conservé parce qu'il reste le seul à
 * couvrir les cas où aucune famille n'est reconnue mais où le texte parle de
 * lui-même — « Aspirine 500mg » face à « aspirine ».
 */
const hasLiteralOverlap = (term: string, allergiesText: string): boolean => {
  const normalizedTerm = normalize(term);
  if (normalizedTerm.length < 4) return false;

  return splitAllergyTokens(allergiesText).some(
    token => normalizedTerm.includes(token) || token.includes(normalizedTerm)
  );
};

/**
 * Alerte d'allergie pour un médicament prescrit — cf. PLAN_CONSULTATION.md L9.7
 * et le lot « sécurité médicamenteuse ».
 *
 * Raisonne d'abord par **famille thérapeutique** (`drugSafety`) : c'est la seule
 * façon de relier « CLAMOXYL » à « allergie à la pénicilline », le nom
 * commercial ne portant aucune information exploitable. La DCI est donc le
 * paramètre déterminant ; à défaut, on retombe sur la comparaison littérale.
 */
export const getAllergyWarning = (
  term: string,
  allergiesText?: string,
  dci?: string
): AllergyWarning | null => {
  if (!term || !allergiesText || !allergiesText.trim()) return null;

  const familyWarning = checkAllergy(term, dci, allergiesText);
  if (familyWarning) return familyWarning;

  if (hasLiteralOverlap(term, allergiesText)) {
    return {
      severity: 'danger',
      familyId: 'literal',
      familyLabel: term,
      allergyLabel: term,
      note: null,
    };
  }

  return null;
};

/**
 * Variante booléenne, conservée pour les appelants qui n'ont pas besoin du
 * détail (gravité, famille).
 */
export const hasAllergyConflict = (
  term: string,
  allergiesText?: string,
  dci?: string
): boolean => getAllergyWarning(term, allergiesText, dci) !== null;
