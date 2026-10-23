/**
 * Logique pure du sélecteur d'heure de consultation (`ui/time-picker.tsx`).
 * Extraite du composant pour rester testable sans environnement DOM.
 */

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export const pad2 = (n: number): string => String(n).padStart(2, '0');

export const currentTime = (): string => {
  const now = new Date();
  return `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
};

export type Period = 'Matin' | 'Après-midi' | 'Soir';
export const PERIODS: Period[] = ['Matin', 'Après-midi', 'Soir'];
export const periodOf = (hour: number): Period => (hour < 12 ? 'Matin' : hour < 18 ? 'Après-midi' : 'Soir');

export interface TimeSlot {
  value: string;
  period: Period;
}

/** Toutes les heures par pas de 5 minutes, regroupées par moment de la journée. */
export const SLOTS: TimeSlot[] = (() => {
  const slots: TimeSlot[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 5) {
      slots.push({ value: `${pad2(h)}:${pad2(m)}`, period: periodOf(h) });
    }
  }
  return slots;
})();

/**
 * Insère `value` dans la grille des créneaux si elle n'y figure pas déjà
 * (saisie manuelle hors pas de 5 minutes, ou heure héritée d'une ancienne
 * consultation) — pour qu'elle reste toujours visible dans la liste.
 */
export const slotsWithValue = (value: string): TimeSlot[] => {
  if (!value || !TIME_REGEX.test(value) || SLOTS.some(s => s.value === value)) {
    return SLOTS;
  }
  const hour = Number(value.split(':')[0]);
  return [...SLOTS, { value, period: periodOf(hour) }].sort((a, b) => a.value.localeCompare(b.value));
};

/** Normalise une saisie libre ("1430", "14h30", "14:3") vers "HH:MM" si possible. */
export const tryParseTime = (raw: string): string | null => {
  const trimmed = raw.trim();
  if (TIME_REGEX.test(trimmed)) return trimmed;

  const digits = trimmed.replace(/\D/g, '');
  if (digits.length === 3) {
    const candidate = `${digits.slice(0, 1).padStart(2, '0')}:${digits.slice(1)}`;
    return TIME_REGEX.test(candidate) ? candidate : null;
  }
  if (digits.length === 4) {
    const candidate = `${digits.slice(0, 2)}:${digits.slice(2)}`;
    return TIME_REGEX.test(candidate) ? candidate : null;
  }
  return null;
};
