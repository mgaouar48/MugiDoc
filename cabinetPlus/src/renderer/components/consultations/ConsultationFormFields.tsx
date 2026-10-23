import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Stethoscope, Loader2 } from "lucide-react";
import { PatientCombobox } from "../ui/patient-combobox";
import { TimePicker } from "../ui/time-picker";
import { Patient } from "../../../shared/types";
import { ConsultationPatientHeader } from "./ConsultationPatientHeader";
import { MotifPicker } from "./MotifPicker";
import { VitalSignsSection } from "./VitalSignsSection";
import { AnamnesisSection } from "./AnamnesisSection";
import { ClinicalExamBlock } from "./ClinicalExamBlock";
import { DiagnosisSection } from "./DiagnosisSection";
import { TreatmentSection } from "./TreatmentSection";
import { ComplementaryExamsSection } from "./ComplementaryExamsSection";
import { CarePlanSection } from "./CarePlanSection";
import { ConsultationDocumentsSection, ConsultationDocumentsSectionHandle } from "./ConsultationDocumentsSection";
import { CareModeSection } from "./CareModeSection";
import { ConsultationFormData } from "./consultationMappers";
import { RefObject } from "react";
import { useSettings } from "../../hooks/useSettings";

interface ConsultationFormFieldsProps {
  formData: ConsultationFormData;
  setFormData: (data: ConsultationFormData) => void;
  patients: Patient[];
  selectedPatient: Patient | null;
  onPatientSelect: (patient: Patient | null) => void;
  isLoading: boolean;
  consultationIdForDialogs: number | null;
  documentsRef: RefObject<ConsultationDocumentsSectionHandle>;
  onSubmitDraft: () => void;
}

/**
 * Saisie de la consultation — cf. PLAN_CONSULTATION.md L16.3 : ordre imposé
 * Motif → Anamnèse → Constantes → Examen clinique → Diagnostic → Traitement →
 * Examens → Plan, chaque bloc repliable géré par sa propre section (L16.2).
 * Extrait de `ConsultationForm.tsx` en L16.5.
 */
export const ConsultationFormFields = ({
  formData,
  setFormData,
  patients,
  selectedPatient,
  onPatientSelect,
  isLoading,
  consultationIdForDialogs,
  documentsRef,
  onSubmitDraft,
}: ConsultationFormFieldsProps) => {
  const { getSetting } = useSettings();
  const chifaEnabled = getSetting('chifa_enabled', 'false') === 'true';

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center text-foreground">
          <Stethoscope className="w-5 h-5 mr-2 text-primary" />
          Informations de la Consultation
        </CardTitle>
        <CardDescription>
          Remplissez les détails de la consultation médicale
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading && (
          <div className="flex items-center justify-center space-x-2 p-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Chargement...</span>
          </div>
        )}

        <form onSubmit={(e) => {
          e.preventDefault();
          onSubmitDraft();
        }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="patient">Patient *</Label>
              <PatientCombobox
                patients={patients}
                selectedPatient={selectedPatient}
                onPatientSelect={onPatientSelect}
                placeholder="Sélectionner un patient..."
                emptyMessage="Aucun patient trouvé."
                disabled={isLoading}
              />
            </div>

            {selectedPatient && (
              <div className="md:col-span-2">
                <ConsultationPatientHeader
                  patient={selectedPatient}
                  onPatientUpdated={onPatientSelect}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Heure *</Label>
              <TimePicker
                id="time"
                value={formData.time}
                onChange={(time) => setFormData({ ...formData, time })}
              />
            </div>

            {chifaEnabled && (
              <div className="md:col-span-2">
                <CareModeSection
                  formData={formData}
                  onChange={(patch) => setFormData({ ...formData, ...patch })}
                  disabled={isLoading}
                />
              </div>
            )}

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="motif">Motif de consultation <span className="text-xs text-muted-foreground font-normal">(optionnel)</span></Label>
              <MotifPicker
                value={formData.motif}
                onChange={(motif) => setFormData({ ...formData, motif })}
                disabled={isLoading}
              />
            </div>

            <div className="md:col-span-2">
              <AnamnesisSection
                value={formData.anamnese}
                onChange={(anamnese) => setFormData({ ...formData, anamnese })}
                disabled={isLoading}
              />
            </div>

            {selectedPatient && (
              <div className="md:col-span-2">
                <VitalSignsSection
                  value={formData.vitals}
                  onChange={(vitals) => setFormData({ ...formData, vitals })}
                  patient={selectedPatient}
                  onPatientUpdated={onPatientSelect}
                  disabled={isLoading}
                />
              </div>
            )}

            <div className="md:col-span-2">
              <ClinicalExamBlock
                value={formData.clinical_exam}
                onChange={(clinical_exam) => setFormData({ ...formData, clinical_exam })}
                disabled={isLoading}
              />
            </div>

            <div className="md:col-span-2">
              <DiagnosisSection
                value={formData.diagnostics}
                onChange={(diagnostics) => setFormData({ ...formData, diagnostics })}
                disabled={isLoading}
              />
            </div>

            <div className="md:col-span-2">
              <TreatmentSection
                value={formData.treatment_lines}
                onChange={(treatment_lines) => setFormData({ ...formData, treatment_lines })}
                patient={selectedPatient}
                disabled={isLoading}
              />
            </div>

            <div className="md:col-span-2">
              <ComplementaryExamsSection
                value={formData.exam_requests}
                onChange={(exam_requests) => setFormData({ ...formData, exam_requests })}
                disabled={isLoading}
              />
            </div>

            <div className="md:col-span-2">
              <CarePlanSection
                value={formData.care_plan}
                onChange={(care_plan) => setFormData({ ...formData, care_plan })}
                consultationDate={formData.date}
                patient={selectedPatient}
                nextAppointment={{
                  id: formData.next_appointment_id ?? undefined,
                  date: formData.next_appointment_date || undefined,
                  time: formData.next_appointment_time || undefined,
                }}
                onAppointmentScheduled={(appt) => setFormData({
                  ...formData,
                  next_appointment_id: appt.id,
                  next_appointment_date: appt.date,
                  next_appointment_time: appt.time,
                })}
                onAppointmentCleared={() => setFormData({
                  ...formData,
                  next_appointment_id: null,
                  next_appointment_date: '',
                  next_appointment_time: '',
                })}
                disabled={isLoading}
              />
            </div>

            <div className="md:col-span-2">
              <ConsultationDocumentsSection
                ref={documentsRef}
                patient={selectedPatient}
                consultationId={consultationIdForDialogs}
                motif={formData.motif}
                anamnese={formData.anamnese}
                vitals={formData.vitals}
                clinicalExam={formData.clinical_exam}
                diagnostics={formData.diagnostics}
                treatmentLines={formData.treatment_lines}
                examRequests={formData.exam_requests}
                carePlan={formData.care_plan}
                consultationDate={formData.date}
                nextAppointmentDate={formData.next_appointment_date || undefined}
                nextAppointmentTime={formData.next_appointment_time || undefined}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notes additionnelles..."
                rows={3}
              />
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
