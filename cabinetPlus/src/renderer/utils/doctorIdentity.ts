/**
 * Résolution centralisée du nom/spécialité du médecin, affichés partout dans
 * le logiciel (en-têtes de documents imprimés, tableau de bord, écran TV...).
 *
 * Deux sources coexistent et peuvent chacune être incomplètes : le compte
 * utilisateur connecté (`users`) et les réglages (`settings.doctor_*`, requis
 * pour les fenêtres séparées comme l'écran TV qui n'ont pas accès à la session
 * utilisateur). On fusionne champ par champ plutôt que de choisir une source
 * entière, pour ne pas perdre un nom saisi seulement d'un côté.
 */

export interface DoctorIdentitySource {
  first_name?: string;
  last_name?: string;
  speciality?: string;
}

export type SettingGetter = (key: string, defaultValue?: string) => string;

export const resolveDoctorName = (
  user: DoctorIdentitySource | null | undefined,
  getSetting: SettingGetter
): string => {
  const firstName = user?.first_name || getSetting('doctor_first_name', '');
  const lastName = user?.last_name || getSetting('doctor_last_name', '');
  if (firstName || lastName) {
    return `Dr. ${firstName} ${lastName}`.trim();
  }
  // Repli ultime : ancien champ unique, pour les bases jamais reconfigurées.
  return getSetting('doctor_name', 'Dr. [Nom du Médecin]');
};

export const resolveDoctorSpeciality = (
  user: DoctorIdentitySource | null | undefined,
  getSetting: SettingGetter
): string => {
  return user?.speciality || getSetting('doctor_speciality', 'Médecine générale');
};
