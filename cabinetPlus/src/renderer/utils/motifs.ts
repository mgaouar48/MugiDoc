/**
 * Logique pure de composition du champ « Motif de consultation » (texte
 * libre historique), utilisée par `MotifPicker` pour combiner plusieurs
 * motifs prédéfinis dans le même champ — cf. PLAN_CONSULTATION.md L4.
 *
 * Le champ reste une simple chaîne (aucune migration de schéma) : les motifs
 * combinés y sont simplement juxtaposés avec « + », ex. "Fièvre + Toux".
 */

const SEPARATOR = ' + ';

/** Minuscules + suppression des accents, pour une recherche/comparaison tolérante. */
export const normalize = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim();

/** Découpe la valeur du champ en segments (motifs combinés), en ignorant les segments vides. */
export const parseMotifSegments = (value: string): string[] =>
  (value || '')
    .split(SEPARATOR)
    .map(segment => segment.trim())
    .filter(Boolean);

/** Un segment est-il déjà présent (comparaison insensible à la casse et aux accents) ? */
export const hasSegment = (value: string, label: string): boolean => {
  const target = normalize(label);
  return parseMotifSegments(value).some(segment => normalize(segment) === target);
};

/**
 * Ajoute un motif au champ. Si déjà présent, le retire à la place (sélection
 * en bascule, cohérent avec la coche des listes de recherche existantes).
 */
export const toggleMotifSegment = (value: string, label: string): string => {
  const trimmedLabel = label.trim();
  if (!trimmedLabel) return value;

  const segments = parseMotifSegments(value);
  const target = normalize(trimmedLabel);
  const index = segments.findIndex(segment => normalize(segment) === target);

  if (index >= 0) {
    segments.splice(index, 1);
  } else {
    segments.push(trimmedLabel);
  }

  return segments.join(SEPARATOR);
};

/** Retire le segment à l'index donné (puce supprimable). */
export const removeMotifSegment = (value: string, index: number): string => {
  const segments = parseMotifSegments(value);
  if (index < 0 || index >= segments.length) return value;
  segments.splice(index, 1);
  return segments.join(SEPARATOR);
};

/** Filtre par jetons (mots), insensible à la casse et aux accents — même mécanique que la recherche patient. */
export const matchesQuery = (haystack: string, query: string): boolean => {
  const tokens = normalize(query).split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;
  const normalizedHaystack = normalize(haystack);
  return tokens.every(token => normalizedHaystack.includes(token));
};
