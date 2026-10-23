import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { CheckCircle2, Receipt, ArrowRight, FileClock } from "lucide-react";
import { composeDiagnosticPreview } from "../../utils/consultationText";
import { formatTreatmentLine } from "../../utils/treatment";
import { formatAppointmentDisplay } from "../../utils/carePlan";
import { useConsultationDocuments } from "../../hooks/useConsultationDocuments";
import { ConsultationUI, resolveDiagnostics, resolveTreatmentLines } from "./consultationMappers";

const DOCUMENT_LABELS: Record<string, string> = {
  ordonnance: 'Ordonnance',
  certificat: 'Certificat médical',
  analyses: "Demande d'analyses",
  imagerie: "Demande d'imagerie",
  compte_rendu: 'Compte rendu de consultation',
  arret_travail: 'Arrêt de travail',
  orientation: "Lettre d'orientation",
  bilan_vierge: 'Demande de bilan',
};

interface ConsultationCompletionDialogProps {
  open: boolean;
  consultation: ConsultationUI | null;
  onFacturer: () => void;
  onReturnToList: () => void;
}

/**
 * Écran de confirmation affiché juste après « Terminer la consultation »
 * (cf. PLAN_CONSULTATION.md L15.7) : ce qui a été enregistré, les documents
 * produits (relus via `useConsultationDocuments`, instance propre à ce
 * composant — même pattern que `ConsultationSidebar` en L13) et le prochain
 * rendez-vous. Reste superposé au formulaire (déjà clôturé, en lecture
 * passive derrière) tant que le médecin n'a pas choisi de revenir à la liste
 * ou de facturer — jamais de navigation automatique.
 */
export const ConsultationCompletionDialog = ({
  open,
  consultation,
  onFacturer,
  onReturnToList,
}: ConsultationCompletionDialogProps) => {
  const { documents, loadByConsultation } = useConsultationDocuments();

  useEffect(() => {
    if (open && consultation?.id) {
      loadByConsultation(parseInt(consultation.id));
    }
  }, [open, consultation?.id, loadByConsultation]);

  if (!consultation) return null;

  const diagnosticText = composeDiagnosticPreview(resolveDiagnostics(consultation));
  const treatmentTexts = resolveTreatmentLines(consultation).map(formatTreatmentLine).filter(Boolean);
  const nextAppointment = consultation.next_appointment_date && consultation.next_appointment_time
    ? formatAppointmentDisplay(consultation.next_appointment_date, consultation.next_appointment_time)
    : null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onReturnToList()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-success">
            <CheckCircle2 className="w-5 h-5" />
            Consultation terminée
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm text-foreground">
          <p className="text-muted-foreground">
            Consultation de <strong className="text-foreground">{consultation.patientName}</strong> enregistrée
            et clôturée le {new Date(consultation.date).toLocaleDateString('fr-FR')} à {consultation.time}.
          </p>

          <div className="rounded-md border border-border p-3 space-y-1.5">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Motif</span>
              <span className="text-right font-medium">{consultation.motif || 'Non renseigné'}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Diagnostic</span>
              <span className="text-right font-medium">{diagnosticText || 'Non renseigné'}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Traitement</span>
              <span className="text-right font-medium">
                {treatmentTexts.length > 0 ? `${treatmentTexts.length} ligne(s)` : 'Aucun'}
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase text-muted-foreground mb-1.5">Documents produits</h4>
            {documents.length > 0 ? (
              <ul className="space-y-1">
                {documents.map(doc => (
                  <li key={doc.id} className="flex items-center gap-2">
                    <FileClock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span>{DOCUMENT_LABELS[doc.document_type] || doc.title}</span>
                    <Badge variant={doc.status === 'printed' ? 'success' : 'secondary'} className="ml-auto">
                      {doc.status === 'printed' ? 'Imprimé' : 'Généré'}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground italic">Aucun document généré pour cette consultation.</p>
            )}
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase text-muted-foreground mb-1.5">Prochain rendez-vous</h4>
            <p>{nextAppointment || <span className="text-muted-foreground italic">Aucun rendez-vous programmé.</span>}</p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button type="button" variant="outline" onClick={onFacturer} className="border-warning/30 text-warning hover:bg-warning/5">
            <Receipt className="w-4 h-4" />
            Facturer maintenant
          </Button>
          <Button type="button" onClick={onReturnToList}>
            Retour à la liste
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
