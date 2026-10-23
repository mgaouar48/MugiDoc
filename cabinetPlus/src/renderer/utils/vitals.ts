import { ConsultationVitals } from '../../shared/types';

/**
 * Calculs et seuils d'anormalité des constantes vitales de consultation —
 * cf. PLAN_CONSULTATION.md L5. Jamais bloquant : ces fonctions ne font que
 * qualifier une valeur pour un signalement visuel, elles ne valident rien.
 */

export interface VitalFlag {
  field: keyof ConsultationVitals;
  label: string;
}

export interface BmiInterpretation {
  label: string;
  severity: 'low' | 'normal' | 'high';
}

/** IMC = poids (kg) / taille (m)², arrondi à une décimale. */
export const calculateBmi = (weightKg?: number, heightCm?: number): number | undefined => {
  if (!weightKg || !heightCm || weightKg <= 0 || heightCm <= 0) return undefined;
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
};

/**
 * Classification OMS de l'IMC — **adulte uniquement** (≥ 18 ans). Chez
 * l'enfant, l'interprétation de l'IMC dépend de courbes de corpulence par
 * âge et sexe (percentiles), non modélisées ici : mieux vaut ne rien
 * afficher qu'afficher une catégorie fausse.
 */
export const interpretBmi = (bmi: number, age: number): BmiInterpretation | undefined => {
  if (age < 18) return undefined;
  if (bmi < 18.5) return { label: 'Dénutrition', severity: 'low' };
  if (bmi < 25) return { label: 'Corpulence normale', severity: 'normal' };
  if (bmi < 30) return { label: 'Surpoids', severity: 'high' };
  if (bmi < 35) return { label: 'Obésité modérée (grade I)', severity: 'high' };
  if (bmi < 40) return { label: 'Obésité sévère (grade II)', severity: 'high' };
  return { label: 'Obésité morbide (grade III)', severity: 'high' };
};

/**
 * Signale les valeurs hors norme, avec des seuils de fréquence
 * cardiaque/respiratoire adaptés à l'enfant (< 12 ans). La tension
 * artérielle n'est évaluée que chez l'adulte : ses normes pédiatriques
 * dépendent de percentiles âge/taille/sexe, non modélisées ici.
 */
export const evaluateVitals = (vitals: ConsultationVitals, age: number): VitalFlag[] => {
  const flags: VitalFlag[] = [];
  const isChild = age < 12;

  if (vitals.temperature !== undefined) {
    if (vitals.temperature >= 38) flags.push({ field: 'temperature', label: 'Fièvre' });
    else if (vitals.temperature < 35) flags.push({ field: 'temperature', label: 'Hypothermie' });
  }

  if (vitals.heart_rate !== undefined) {
    const [low, high] = isChild ? [70, 120] : [60, 100];
    if (vitals.heart_rate < low) flags.push({ field: 'heart_rate', label: 'Bradycardie' });
    else if (vitals.heart_rate > high) flags.push({ field: 'heart_rate', label: 'Tachycardie' });
  }

  if (vitals.respiratory_rate !== undefined) {
    const [low, high] = isChild ? [20, 30] : [12, 20];
    if (vitals.respiratory_rate < low) flags.push({ field: 'respiratory_rate', label: 'Bradypnée' });
    else if (vitals.respiratory_rate > high) flags.push({ field: 'respiratory_rate', label: 'Tachypnée' });
  }

  if (vitals.spo2 !== undefined && vitals.spo2 < 95) {
    flags.push({ field: 'spo2', label: 'Désaturation' });
  }

  if (!isChild && vitals.blood_pressure_systolic !== undefined && vitals.blood_pressure_diastolic !== undefined) {
    if (vitals.blood_pressure_systolic >= 140 || vitals.blood_pressure_diastolic >= 90) {
      flags.push({ field: 'blood_pressure_systolic', label: 'Hypertension' });
      flags.push({ field: 'blood_pressure_diastolic', label: 'Hypertension' });
    } else if (vitals.blood_pressure_systolic < 90 || vitals.blood_pressure_diastolic < 60) {
      flags.push({ field: 'blood_pressure_systolic', label: 'Hypotension' });
      flags.push({ field: 'blood_pressure_diastolic', label: 'Hypotension' });
    }
  }

  if (vitals.glycemia !== undefined) {
    if (vitals.glycemia < 0.7) flags.push({ field: 'glycemia', label: 'Hypoglycémie' });
    else if (vitals.glycemia > 1.1) flags.push({ field: 'glycemia', label: 'Hyperglycémie' });
  }

  return flags;
};
