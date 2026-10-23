import { normalize } from "../motifs";
import drugClassesData from "./drugClasses.json";

export interface DrugFamily {
  id: string;
  label: string;
  /** Termes tels qu'un médecin les écrit dans le champ libre `patients.allergies`. */
  allergyAliases: string[];
  /** Fragments de DCI curés — jamais un simple suffixe générique (cf. faux positifs ci-dessous). */
  dciStems: string[];
  /** Filet de sécurité, appliqué uniquement après échec des `dciStems`. */
  dciPatterns: string[];
  crossReactsWith: string[];
  crossReactionNote: string | null;
}

export type SafetySeverity = 'danger' | 'warning';

export interface AllergyWarning {
  severity: SafetySeverity;
  /** Famille du médicament prescrit. */
  familyId: string;
  familyLabel: string;
  /** Ce que le patient a déclaré (famille reconnue, ou le texte brut en repli). */
  allergyLabel: string;
  note: string | null;
}

const FAMILIES: DrugFamily[] = drugClassesData as DrugFamily[];

const FAMILY_BY_ID = new Map(FAMILIES.map(f => [f.id, f]));

/**
 * Une DCI du répertoire national mélange sels, formes et associations :
 * « AMOXICILLINE TRIHYDRATE EXPRIME EN AMOXICILLINE »,
 * « SUCCINATE DE DOXYLAMINE/CHLORHYDRATE DE PYRIDOXINE ».
 * On découpe pour tester chaque principe actif séparément.
 */
const splitDciSegments = (dci: string): string[] =>
  normalize(dci)
    .split(/[/+,()]/)
    .map(s => s.trim())
    .filter(Boolean);

/**
 * Familles auxquelles appartient un médicament, d'après son nom commercial
 * et/ou sa DCI. La DCI est de loin le signal fiable : « CLAMOXYL » ne dit rien,
 * « AMOXICILLINE TRIHYDRATE… » dit tout. Le nom commercial n'est testé que
 * parce que le médecin peut l'avoir saisi à la main sans passer par le
 * répertoire (auquel cas il vaut parfois DCI, ex. « AMOXICILLINE EG »).
 */
export const classifyDrug = (term?: string, dci?: string): string[] => {
  const candidates: string[] = [];
  if (dci?.trim()) candidates.push(...splitDciSegments(dci));
  if (term?.trim()) candidates.push(...splitDciSegments(term));
  if (candidates.length === 0) return [];

  const matched = new Set<string>();

  for (const family of FAMILIES) {
    const hitStem = family.dciStems.some(stem =>
      candidates.some(candidate => candidate.includes(stem))
    );
    if (hitStem) {
      matched.add(family.id);
      continue;
    }
    // Les motifs ne servent que de filet : ils rattrapent les coquilles du
    // répertoire officiel (CIOROFLOXACINE, CEFELAXINE) et les molécules non
    // listées nommément, sans jamais primer sur une correspondance de racine.
    const hitPattern = family.dciPatterns.some(pattern => {
      const re = new RegExp(pattern);
      return candidates.some(candidate => re.test(candidate));
    });
    if (hitPattern) matched.add(family.id);
  }

  return [...matched];
};

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Familles d'allergènes déclarées par le patient, lues dans le champ libre
 * `patients.allergies`. « Allergie à la pénicilline » doit reconnaître la
 * famille « pénicillines ».
 *
 * Comparaison bornée aux mots entiers, et non par simple sous-chaîne : des
 * alias courts et légitimes (« ains », « iode », « iec ») sont contenus dans
 * des mots français courants — « cert*ains* », « pér*iode* », « p*ièc*e » —
 * et déclencheraient des alertes fantômes. Or une alerte fantôme est le plus
 * sûr moyen d'apprendre au médecin à ignorer les vraies.
 */
export const classifyAllergyText = (allergiesText?: string): string[] => {
  if (!allergiesText?.trim()) return [];
  const normalized = normalize(allergiesText);
  return FAMILIES
    .filter(family => family.allergyAliases.some(alias => {
      const re = new RegExp(`\\b${escapeRegExp(normalize(alias))}\\b`);
      return re.test(normalized);
    }))
    .map(family => family.id);
};

/**
 * Confronte un médicament prescrit aux allergies déclarées du patient.
 *
 * `danger` : le médicament appartient à une famille explicitement déclarée.
 * `warning` : réaction croisée connue (pénicilline déclarée → céphalosporine).
 *
 * Renvoie `null` s'il n'y a rien à signaler. Ne bloque jamais : c'est à
 * l'appelant de décider comment le présenter (cf. philosophie « jamais
 * bloquant » de `vitals.ts`).
 */
export const checkAllergy = (
  term?: string,
  dci?: string,
  allergiesText?: string
): AllergyWarning | null => {
  const allergyFamilies = classifyAllergyText(allergiesText);
  if (allergyFamilies.length === 0) return null;

  const drugFamilies = classifyDrug(term, dci);
  if (drugFamilies.length === 0) return null;

  // Correspondance directe d'abord — toujours prioritaire sur une croisée.
  for (const drugFamilyId of drugFamilies) {
    if (allergyFamilies.includes(drugFamilyId)) {
      const family = FAMILY_BY_ID.get(drugFamilyId)!;
      return {
        severity: 'danger',
        familyId: family.id,
        familyLabel: family.label,
        allergyLabel: family.label,
        note: null,
      };
    }
  }

  for (const drugFamilyId of drugFamilies) {
    const family = FAMILY_BY_ID.get(drugFamilyId)!;
    const crossed = family.crossReactsWith.find(id => allergyFamilies.includes(id));
    if (crossed) {
      const declared = FAMILY_BY_ID.get(crossed)!;
      return {
        severity: 'warning',
        familyId: family.id,
        familyLabel: family.label,
        allergyLabel: declared.label,
        note: family.crossReactionNote ?? declared.crossReactionNote,
      };
    }
  }

  return null;
};

/** Exposé pour les écrans qui veulent proposer les familles connues (saisie structurée à venir). */
export const getDrugFamilies = (): DrugFamily[] => FAMILIES;
