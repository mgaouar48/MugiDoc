import { ConsultationAnamnese, ConsultationVitals, ConsultationCarePlan } from '../../shared/types';
import { addDaysToDate, formatDateFr } from './carePlan';

/**
 * Recompose en lignes de texte les blocs anamnèse / constantes / conduite à
 * tenir d'une consultation — extrait de `ConsultationReportDialog` (L11) pour
 * être réutilisé tel quel par le panneau latéral (L13.7, lecture seule d'une
 * consultation antérieure) sans dupliquer le format.
 */
export const formatAnamneseLines = (a: ConsultationAnamnese): string[] => {
  const lines: string[] = [];
  if (a.onset_date) lines.push(`Début des symptômes : ${new Date(a.onset_date).toLocaleDateString("fr-FR")}`);
  if (a.symptoms) lines.push(`Symptômes : ${a.symptoms}`);
  if (a.evolution) lines.push(`Évolution : ${a.evolution}`);
  if (a.aggravating_factors) lines.push(`Facteurs aggravants / soulageants : ${a.aggravating_factors}`);
  if (a.prior_treatment) lines.push(`Traitement déjà pris : ${a.prior_treatment}`);
  if (a.related_history) lines.push(`Antécédents liés : ${a.related_history}`);
  if (a.observations) lines.push(`Observations : ${a.observations}`);
  return lines;
};

export const formatVitalsLines = (v: ConsultationVitals): string[] => {
  const lines: string[] = [];
  if (v.weight) lines.push(`Poids : ${v.weight} kg`);
  if (v.height) lines.push(`Taille : ${v.height} cm`);
  if (v.bmi) lines.push(`IMC : ${v.bmi} kg/m²`);
  if (v.temperature) lines.push(`Température : ${v.temperature} °C`);
  if (v.blood_pressure_systolic && v.blood_pressure_diastolic) {
    lines.push(`TA : ${v.blood_pressure_systolic}/${v.blood_pressure_diastolic} mmHg`);
  }
  if (v.heart_rate) lines.push(`Fréquence cardiaque : ${v.heart_rate} bpm`);
  if (v.spo2) lines.push(`SpO₂ : ${v.spo2} %`);
  if (v.respiratory_rate) lines.push(`Fréquence respiratoire : ${v.respiratory_rate} /min`);
  if (v.glycemia) lines.push(`Glycémie : ${v.glycemia} g/L`);
  return lines;
};

export const formatCarePlanLines = (c: ConsultationCarePlan, consultationDate: string): string[] => {
  const lines: string[] = [];
  if (c.text) lines.push(...c.text.split('\n').map(l => l.trim()).filter(Boolean));
  if (c.rest_days) lines.push(`Repos : ${c.rest_days} jour${c.rest_days > 1 ? 's' : ''}`);
  if (c.control_days) {
    const date = addDaysToDate(consultationDate, c.control_days);
    lines.push(`Contrôle : dans ${c.control_days} jour${c.control_days > 1 ? 's' : ''}${date ? ` (${formatDateFr(date)})` : ''}`);
  }
  return lines;
};
