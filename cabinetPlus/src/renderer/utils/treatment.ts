import { TreatmentLine } from "../../shared/types";

export interface FrequencyOption {
  label: string;
  perDay: number | null;
}

/** Raccourcis proposés — laissent toujours la saisie libre possible (cf. MotifPicker). */
export const FREQUENCY_OPTIONS: FrequencyOption[] = [
  { label: '1 fois/jour', perDay: 1 },
  { label: '2 fois/jour', perDay: 2 },
  { label: '3 fois/jour', perDay: 3 },
  { label: '4 fois/jour', perDay: 4 },
  { label: 'Si besoin', perDay: null },
];

export interface DurationOption {
  label: string;
  days: number;
}

export const DURATION_OPTIONS: DurationOption[] = [
  { label: '3 jours', days: 3 },
  { label: '5 jours', days: 5 },
  { label: '7 jours', days: 7 },
  { label: '10 jours', days: 10 },
  { label: '1 mois', days: 30 },
];

/**
 * Extrait le nombre de prises par jour d'une fréquence en texte libre
 * ("3 fois/jour", "3x/j", "3 fois par jour"). `null` si non interprétable
 * (ex. "Si besoin", ou toute formulation personnalisée) — jamais bloquant,
 * le calcul de quantité (L9.5) s'abstient simplement dans ce cas.
 */
export const parseFrequencyPerDay = (frequency?: string): number | null => {
  if (!frequency) return null;
  const match = frequency.match(/(\d+)\s*(?:fois|x)/i);
  return match ? parseInt(match[1], 10) : null;
};

/**
 * Extrait le nombre de jours d'une durée en texte libre ("7 jours", "1 mois",
 * "2 semaines"). `null` si non interprétable.
 */
export const parseDurationDays = (duration?: string): number | null => {
  if (!duration) return null;
  const match = duration.match(/(\d+)\s*(jour|semaine|mois)/i);
  if (!match) return null;
  const amount = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  if (unit.startsWith('semaine')) return amount * 7;
  if (unit.startsWith('mois')) return amount * 30;
  return amount;
};

/**
 * Extrait le nombre d'unités par prise d'une posologie en texte libre
 * ("1 comprimé", "2 gélules"). 1 par défaut si non interprétable (ex.
 * "1/2 comprimé", ou champ vide).
 */
export const parseUnitsPerDose = (posology?: string): number => {
  if (!posology) return 1;
  const match = posology.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : 1;
};

/**
 * Formes solides discrètes du répertoire national (chaînes officielles en
 * majuscules, souvent verbeuses — ex. "COMPRIME PELLICULE SECABLE") pour
 * lesquelles une posologie par défaut du type "1 comprimé" a du sens.
 * Les formes liquides/injectables sont volontairement ignorées : leur
 * posologie (mL, cuillères, unités internationales...) ne peut pas être
 * devinée de façon fiable — mieux vaut laisser le champ vide que suggérer
 * une unité fausse (même philosophie que L5.2/L5.3 : jamais de fausse précision).
 */
const SOLID_FORM_UNITS: [RegExp, string][] = [
  [/GELULE/, 'gélule'],
  [/COMPRIME/, 'comprimé'],
  [/SACHET/, 'sachet'],
  [/SUPPOSITOIRE/, 'suppositoire'],
  [/OVULE/, 'ovule'],
  [/CAPSULE/, 'capsule'],
];

/**
 * Déduit une unité de posologie simple et lisible ("comprimé", "gélule"...)
 * à partir de la forme officielle du répertoire, pour L9.4 (structuration
 * automatique à la sélection). `undefined` si la forme n'est pas une forme
 * solide discrète reconnue.
 */
export const suggestPosologyUnit = (form?: string): string | undefined => {
  if (!form) return undefined;
  const upper = form.toUpperCase();
  const match = SOLID_FORM_UNITS.find(([pattern]) => pattern.test(upper));
  return match ? match[1] : undefined;
};

const pluralizeForm = (form?: string): string => {
  if (!form || !form.trim()) return 'unités';
  const lower = form.trim().toLowerCase();
  return lower.endsWith('s') ? lower : `${lower}s`;
};

/**
 * Calcule la quantité totale à délivrer (unités par prise × prises/jour ×
 * jours), cf. L9.5. Retourne `null` si la fréquence ou la durée n'est pas
 * interprétable — le médecin renseigne alors la quantité à la main, le
 * calcul automatique n'étant qu'une aide, jamais une contrainte.
 */
export const calculateQuantity = (
  line: Pick<TreatmentLine, 'posology' | 'frequency' | 'duration' | 'form'>
): string | null => {
  const perDay = parseFrequencyPerDay(line.frequency);
  const days = parseDurationDays(line.duration);
  if (perDay === null || days === null) return null;

  const units = parseUnitsPerDose(line.posology) * perDay * days;
  return `${units} ${pluralizeForm(line.form)}`;
};

/**
 * Rendu lisible d'une ligne de traitement (L9.6) — reproduit exactement le
 * format de recomposition côté service (`ConsultationService.formatTreatmentLine`)
 * pour que l'aperçu affiché corresponde à ce qui sera persisté dans le champ
 * hérité `traitement`.
 */
export const formatTreatmentLine = (line: TreatmentLine): string => {
  const heading = [line.medication, line.dosage].filter(Boolean).join(' ');
  const posology = [line.posology, line.frequency, line.duration].filter(Boolean).join(' — ');
  return [heading, posology].filter(Boolean).join(' — ');
};
