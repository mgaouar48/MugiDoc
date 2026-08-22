import { Badge } from "../ui/badge";
import { Appointment as AppointmentType, CreateAppointmentRequest } from "../../../shared/types";
import { format } from "date-fns";

// Interface locale pour compatibilité avec l'UI existante
export interface AppointmentUI {
  id: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  date: Date;
  time: string;
  duration: number;
  type: string;
  status: "confirmé" | "en_attente" | "annulé" | "terminé";
  notes?: string;
  patientId?: number;
}

// Fonction pour convertir Appointment (DB) vers AppointmentUI
export const convertAppointmentToUI = (appointment: AppointmentType): AppointmentUI => ({
  id: appointment.id.toString(),
  patientName: appointment.patient ? `${appointment.patient.first_name} ${appointment.patient.last_name}` : 'Patient inconnu',
  patientPhone: appointment.patient?.phone || '',
  patientEmail: appointment.patient?.email || '',
  date: new Date(appointment.date),
  time: appointment.time,
  duration: appointment.duration,
  type: appointment.type,
  status: appointment.status,
  notes: appointment.notes || '',
  patientId: appointment.patient_id
});

// Fonction pour convertir les données du formulaire vers CreateAppointmentRequest
export const convertUIToCreateRequest = (formData: any, patientId: number, duration: number): CreateAppointmentRequest => ({
  patient_id: patientId,
  date: format(formData.date, 'yyyy-MM-dd'),
  time: formData.time,
  duration: duration,
  type: formData.type,
  status: 'en_attente',
  notes: formData.notes || undefined
});

// Types de rendez-vous disponibles
export const appointmentTypes = [
  "Consultation générale",
  "Urgence",
  "Suivi",
  "Contrôle"
];

// Fonction pour obtenir le badge de statut (partagée entre vue calendrier et vue liste)
export const getStatusBadge = (status: AppointmentUI['status']) => {
  switch (status) {
    case 'confirmé':
      return <Badge variant="success">Confirmé</Badge>;
    case 'en_attente':
      return <Badge variant="warning">En attente</Badge>;
    case 'annulé':
      return <Badge variant="destructive">Annulé</Badge>;
    case 'terminé':
      return <Badge variant="info">Terminé</Badge>;
    default:
      return <Badge variant="secondary">{(status as string).replace("_", " ")}</Badge>;
  }
};
