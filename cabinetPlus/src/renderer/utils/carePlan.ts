import { addDays, format, parseISO } from 'date-fns';

/**
 * Logique pure du plan / conduite à tenir (`CarePlanSection`) — cf.
 * PLAN_CONSULTATION.md L12. Repos et contrôle ne stockent qu'un nombre de
 * jours (`ConsultationCarePlan.rest_days`/`control_days`) ; la date affichée
 * est toujours recalculée depuis la date de la consultation plutôt que
 * mémorisée, pour rester exacte même en rouvrant une ancienne consultation.
 */

/** `null` si `baseDate` est invalide ou `days` non interprétable — jamais de date fausse affichée. */
export const addDaysToDate = (baseDate: string, days: number): string | null => {
  if (!baseDate || !Number.isFinite(days) || days < 0) return null;
  const parsed = parseISO(baseDate);
  if (Number.isNaN(parsed.getTime())) return null;
  return format(addDays(parsed, days), 'yyyy-MM-dd');
};

export const formatDateFr = (isoDate: string): string => {
  const parsed = parseISO(isoDate);
  return Number.isNaN(parsed.getTime()) ? '' : format(parsed, 'dd/MM/yyyy');
};

/** Cible : `02/09/2026 à 10:30`. */
export const formatAppointmentDisplay = (date: string, time: string): string => {
  const formatted = formatDateFr(date);
  return formatted ? `${formatted} à ${time}` : time;
};
