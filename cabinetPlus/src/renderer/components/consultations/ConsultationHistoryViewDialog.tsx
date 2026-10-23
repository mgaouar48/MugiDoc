import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { History } from "lucide-react";
import { composeDiagnosticPreview } from "../../utils/consultationText";
import { formatTreatmentLine } from "../../utils/treatment";
import { summarizeExamSection } from "../../utils/clinicalExam";
import { formatAppointmentDisplay } from "../../utils/carePlan";
import { formatAnamneseLines, formatVitalsLines, formatCarePlanLines } from "../../utils/consultationSummary";
import { ConsultationUI, getStatusBadge, getCareModeBadge, resolveDiagnostics, resolveTreatmentLines } from "./consultationMappers";
import { useSettings } from "../../hooks/useSettings";

interface ConsultationHistoryViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  consultation: ConsultationUI | null;
}

/**
 * Lecture seule du contenu complet d'une consultation antérieure, superposée
 * sans quitter la consultation en cours — cf. PLAN_CONSULTATION.md L13.7.
 * Recompose les mêmes blocs que `ConsultationReportDialog` (avec les mêmes
 * fonctions de `consultationSummary.ts`/`clinicalExam.ts`/`treatment.ts`/
 * `consultationText.ts`) mais sans le papier à en-tête ni les actions
 * imprimer/enregistrer, qui n'ont pas de sens pour un dossier déjà clos.
 */
export const ConsultationHistoryViewDialog = ({ open, onOpenChange, consultation }: ConsultationHistoryViewDialogProps) => {
  const { getSetting } = useSettings();
  const chifaEnabled = getSetting('chifa_enabled', 'false') === 'true';

  if (!consultation) return null;

  const anamneseLines = consultation.anamnese ? formatAnamneseLines(consultation.anamnese) : [];
  const vitalsLines = consultation.vitals ? formatVitalsLines(consultation.vitals) : [];
  const activeExamSections = (consultation.clinical_exam || []).filter(s => summarizeExamSection(s).trim().length > 0);
  const diagnosticText = composeDiagnosticPreview(resolveDiagnostics(consultation));
  const treatmentTexts = resolveTreatmentLines(consultation).map(formatTreatmentLine).filter(Boolean);
  const examLabels = (consultation.exam_requests || []).map(e => e.label).filter(Boolean);
  const carePlanLines = consultation.care_plan ? formatCarePlanLines(consultation.care_plan, consultation.date) : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            Consultation du {new Date(consultation.date).toLocaleDateString('fr-FR')}
            {consultation.time ? ` à ${consultation.time}` : ''}
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2">
          {chifaEnabled && getCareModeBadge(consultation.care_mode)}
          {getStatusBadge(consultation.status)}
          <span className="text-sm text-muted-foreground">{consultation.patientName}</span>
        </div>

        <div className="space-y-4 text-sm text-foreground">
          <div>
            <h4 className="text-xs font-bold uppercase text-muted-foreground mb-1">Motif</h4>
            <p>{consultation.motif || 'Non renseigné'}</p>
          </div>

          {anamneseLines.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase text-muted-foreground mb-1">Anamnèse</h4>
              <ul className="space-y-0.5">
                {anamneseLines.map((line, i) => <li key={i}>{line}</li>)}
              </ul>
            </div>
          )}

          {vitalsLines.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase text-muted-foreground mb-1">Constantes</h4>
              <p>{vitalsLines.join(' — ')}</p>
            </div>
          )}

          {activeExamSections.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase text-muted-foreground mb-1">Examen clinique</h4>
              <ul className="space-y-0.5">
                {activeExamSections.map(s => (
                  <li key={s.key}><strong>{s.label} :</strong> {summarizeExamSection(s)}</li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h4 className="text-xs font-bold uppercase text-muted-foreground mb-1">Diagnostic</h4>
            <p>{diagnosticText || 'Non renseigné'}</p>
          </div>

          {treatmentTexts.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase text-muted-foreground mb-1">Traitement</h4>
              <ul className="list-disc list-inside space-y-0.5">
                {treatmentTexts.map((t, i) => <li key={i}>{t}</li>)}
              </ul>
            </div>
          )}

          {examLabels.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase text-muted-foreground mb-1">Examens complémentaires demandés</h4>
              <p>{examLabels.join(', ')}</p>
            </div>
          )}

          {carePlanLines.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase text-muted-foreground mb-1">Conduite à tenir</h4>
              <ul className="space-y-0.5">
                {carePlanLines.map((line, i) => <li key={i}>{line}</li>)}
              </ul>
            </div>
          )}

          {consultation.next_appointment_date && consultation.next_appointment_time && (
            <div>
              <h4 className="text-xs font-bold uppercase text-muted-foreground mb-1">Prochain rendez-vous</h4>
              <p>{formatAppointmentDisplay(consultation.next_appointment_date, consultation.next_appointment_time)}</p>
            </div>
          )}

          {consultation.notes && (
            <div>
              <h4 className="text-xs font-bold uppercase text-muted-foreground mb-1">Notes</h4>
              <p className="whitespace-pre-wrap">{consultation.notes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
