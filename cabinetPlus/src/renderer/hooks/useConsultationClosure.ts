import { useCallback } from 'react';
import { Appointment, WaitingRoomEntry } from '../../shared/types';
import { useElectron } from './useElectron';
import { getNetworkConfig, buildNetworkAPI } from '../lib/networkClient';

export interface ConsultationClosureResult {
  waitingRoomClosed: boolean;
  appointmentClosed: boolean;
  warnings: string[];
}

/**
 * Répercussions d'une clôture de consultation sur le reste du dossier du jour.
 *
 * Enregistrer une consultation terminée n'écrivait jusqu'ici que dans la table
 * consultations : le patient restait affiché « en consultation » en salle
 * d'attente et son rendez-vous restait « confirmé » dans le programme du jour.
 * Ce hook effectue les deux mises à jour manquantes.
 *
 * Les échecs ne sont jamais propagés : la consultation, elle, est déjà
 * enregistrée. Ils sont remontés dans `warnings` pour information.
 */
export const useConsultationClosure = () => {
  const { isElectron } = useElectron();

  const resolveApi = useCallback(() => {
    const netConfig = getNetworkConfig();
    if (netConfig.enabled && netConfig.serverIP && netConfig.serverIP !== 'server') {
      return buildNetworkAPI(netConfig);
    }
    if (isElectron && window.electronAPI) {
      return window.electronAPI as any;
    }
    return null;
  }, [isElectron]);

  /**
   * Passe l'entrée salle d'attente du patient à `termine` et le rendez-vous
   * lié à `terminé`. Sans effet si la consultation n'est pas clôturée.
   */
  const applyConsultationClosure = useCallback(async (
    patientId: number,
    appointmentId?: number | null
  ): Promise<ConsultationClosureResult> => {
    const result: ConsultationClosureResult = {
      waitingRoomClosed: false,
      appointmentClosed: false,
      warnings: []
    };

    const api = resolveApi();
    if (!api) return result;

    // 1. Salle d'attente : sortir le patient de la file du jour.
    //    L'entrée porte aussi le rendez-vous d'origine, qui sert de repli
    //    quand la consultation n'a pas été rattachée explicitement à un RDV.
    let linkedAppointmentId = appointmentId ?? null;

    try {
      const queue: WaitingRoomEntry[] = await api.waitingRoom.getTodayQueue();
      const entry = (queue || []).find(
        q => q.patient_id === patientId &&
             (q.status === 'en_consultation' || q.status === 'en_attente')
      );
      if (entry) {
        if (!linkedAppointmentId && entry.appointment_id) {
          linkedAppointmentId = entry.appointment_id;
        }
        await api.waitingRoom.updateStatus(entry.id, 'termine');
        result.waitingRoomClosed = true;
      }
    } catch (err) {
      console.error("Clôture consultation — mise à jour salle d'attente impossible:", err);
      result.warnings.push("la salle d'attente n'a pas pu être mise à jour");
    }

    // 2. Rendez-vous lié : le marquer comme honoré.
    //    Dernier repli : le rendez-vous du jour encore ouvert pour ce patient
    //    (parcours salle d'attente, qui ne transmet aucun identifiant de RDV).
    try {
      if (!linkedAppointmentId) {
        const today = new Date().toISOString().split('T')[0];
        const patientAppointments: Appointment[] = api.appointments.getByPatient
          ? await api.appointments.getByPatient(patientId)
          : ((await api.appointments.getAll()) || []).filter(
              (a: Appointment) => a.patient_id === patientId
            );

        const openToday = (patientAppointments || []).find(
          a => a.date === today && (a.status === 'confirmé' || a.status === 'en_attente')
        );
        if (openToday) linkedAppointmentId = openToday.id;
      }

      if (linkedAppointmentId) {
        await api.appointments.update(linkedAppointmentId, { status: 'terminé' });
        result.appointmentClosed = true;
      }
    } catch (err) {
      console.error('Clôture consultation — mise à jour du rendez-vous impossible:', err);
      result.warnings.push("le rendez-vous n'a pas pu être marqué comme terminé");
    }

    return result;
  }, [resolveApi]);

  return { applyConsultationClosure };
};
