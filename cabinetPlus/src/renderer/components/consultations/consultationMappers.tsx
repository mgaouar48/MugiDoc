import { Badge } from "../ui/badge";
import { Consultation as ConsultationType, CreateConsultationRequest } from "../../../shared/types";

// Interface locale pour compatibilité avec l'UI existante
export interface ConsultationUI {
  id: string;
  patientName: string;
  patientId: string;
  date: string;
  time: string;
  motif: string;
  diagnostic: string;
  traitement: string;
  status: 'completed' | 'cancelled' | 'scheduled' | 'no_show';
  notes: string;
  appointmentId?: string;
}

// Fonction pour convertir Consultation (DB) vers ConsultationUI
export const convertConsultationToUI = (consultation: ConsultationType): ConsultationUI => ({
  id: (consultation?.id ?? 0).toString(),
  patientName: consultation?.patient ? `${consultation.patient.first_name || ''} ${consultation.patient.last_name || ''}`.trim() : 'Patient inconnu',
  patientId: (consultation?.patient_id ?? 0).toString(),
  date: consultation?.date || '',
  time: consultation?.time || '',
  motif: consultation?.motif || '',
  diagnostic: consultation?.diagnostic || '',
  traitement: consultation?.traitement || '',
  status: consultation?.status || 'scheduled',
  notes: consultation?.notes || '',
  appointmentId: consultation?.appointment_id?.toString()
});

// Fonction pour convertir les données du formulaire vers CreateConsultationRequest
export const convertUIToCreateRequest = (formData: any, patientId: number, appointmentId?: number): CreateConsultationRequest => ({
  patient_id: patientId,
  appointment_id: appointmentId,
  date: formData.date,
  time: formData.time,
  motif: formData.motif,
  diagnostic: formData.diagnostic || undefined,
  traitement: formData.traitement || undefined,
  status: formData.status || 'scheduled',
  notes: formData.notes || undefined
});

export const getStatusBadge = (status: string) => {
  switch (status) {
    case 'completed':
      return <Badge variant="success">Terminée</Badge>;
    case 'cancelled':
      return <Badge variant="destructive">Annulée</Badge>;
    case 'scheduled':
      return <Badge variant="info">Programmée</Badge>;
    case 'no_show':
      return <Badge variant="secondary">Absent</Badge>;
    default:
      return <Badge variant="secondary">Inconnu</Badge>;
  }
};
