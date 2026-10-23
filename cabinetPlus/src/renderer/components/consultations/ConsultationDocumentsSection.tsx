import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { FileText, FileCheck, Send, Stethoscope, Microscope, Scan, ClipboardList, FlaskConical, FileClock, X } from "lucide-react";
import { Patient, ConsultationAnamnese, ConsultationVitals, ClinicalExamSection, ConsultationDiagnostics, TreatmentLine, ExamRequestEntry, ConsultationCarePlan } from "../../../shared/types";
import { useToast } from "../../hooks/use-toast";
import { useConsultationDocuments } from "../../hooks/useConsultationDocuments";
import { ConsultationSection } from "./ConsultationSection";
import { MedicalCertificateDialog } from "./MedicalCertificateDialog";
import { ReferralLetterDialog } from "./ReferralLetterDialog";
import { WorkStopDialog } from "./WorkStopDialog";
import { ExamPrescriptionDialog } from "./ExamPrescriptionDialog";
import { PrescriptionQuickModal } from "./PrescriptionQuickModal";
import { LabRequestDialog } from "./LabRequestDialog";
import { ConsultationReportDialog } from "./ConsultationReportDialog";
import { composeDiagnosticPreview } from "../../utils/consultationText";

interface ConsultationDocumentsSectionProps {
  patient: Patient | null;
  consultationId: number | null;
  motif: string;
  anamnese: ConsultationAnamnese;
  vitals: ConsultationVitals;
  clinicalExam: ClinicalExamSection[];
  diagnostics: ConsultationDiagnostics;
  treatmentLines: TreatmentLine[];
  examRequests: ExamRequestEntry[];
  carePlan: ConsultationCarePlan;
  consultationDate: string;
  nextAppointmentDate?: string;
  nextAppointmentTime?: string;
  disabled?: boolean;
}

/**
 * Ouvre l'un des dialogues de documents depuis l'extérieur (barre d'actions
 * fixe, cf. PLAN_CONSULTATION.md L14) sans dupliquer leur état ni la trace
 * d'audit `useConsultationDocuments`, gérés uniquement ici.
 */
export interface ConsultationDocumentsSectionHandle {
  openOrdonnance: () => void;
  openAnalyses: () => void;
  openImagerie: () => void;
  openCertificat: () => void;
}

const DOCUMENT_LABELS: Record<string, string> = {
  ordonnance: 'Ordonnance',
  certificat: 'Certificat médical',
  analyses: "Demande d'analyses",
  imagerie: "Demande d'imagerie",
  compte_rendu: 'Compte rendu de consultation',
  arret_travail: 'Arrêt de travail',
  orientation: "Lettre d'orientation",
  bilan_vierge: 'Demande de bilan (formulaire vierge)',
};

const DOCUMENT_ICONS: Record<string, React.ElementType> = {
  ordonnance: FileText,
  certificat: FileCheck,
  analyses: Microscope,
  imagerie: Scan,
  compte_rendu: ClipboardList,
  arret_travail: Stethoscope,
  orientation: Send,
  bilan_vierge: FlaskConical,
};

/**
 * Barre des 7 documents de consultation + liste des documents produits avec
 * leur état (généré / imprimé) — cf. PLAN_CONSULTATION.md L11. Remplace la
 * partie "documents" de l'ancienne barre d'actions de `ConsultationForm.tsx`
 * (Imprimer la consultation, Joindre un fichier et Clôturer restent dans
 * cette dernière : ce ne sont pas des documents parmi les 7).
 *
 * Chaque dialogue garde son propre mécanisme de génération (impression,
 * `prescriptions`, `localStorage`...) ; cette section ne fait qu'observer les
 * événements « enregistré » / « imprimé » de chacun via `onSaved`/`onPrinted`
 * pour tenir la trace d'audit (L11.5), sans dupliquer leur contenu.
 */
export const ConsultationDocumentsSection = forwardRef<ConsultationDocumentsSectionHandle, ConsultationDocumentsSectionProps>(({
  patient,
  consultationId,
  motif,
  anamnese,
  vitals,
  clinicalExam,
  diagnostics,
  treatmentLines,
  examRequests,
  carePlan,
  consultationDate,
  nextAppointmentDate,
  nextAppointmentTime,
  disabled,
}, ref) => {
  const { toast } = useToast();
  const { documents, loadByConsultation, recordGenerated, recordPrinted, markPrinted, deleteDocument } = useConsultationDocuments();

  const [certOpen, setCertOpen] = useState(false);
  const [referralOpen, setReferralOpen] = useState(false);
  const [workStopOpen, setWorkStopOpen] = useState(false);
  const [analysesOpen, setAnalysesOpen] = useState(false);
  const [imagerieOpen, setImagerieOpen] = useState(false);
  const [prescriptionOpen, setPrescriptionOpen] = useState(false);
  const [labRequestOpen, setLabRequestOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    if (consultationId) loadByConsultation(consultationId);
  }, [consultationId, loadByConsultation]);

  // Une seule trace par ouverture de dialogue : réinitialisé à chaque fois
  // qu'un des boutons ouvre son document, réutilisé si « enregistré » et
  // « imprimé » sont tous deux déclenchés pendant la même ouverture.
  const pendingIds = useRef<Record<string, number | null>>({});

  const openDocument = (documentType: string, setOpen: (v: boolean) => void) => {
    if (!patient) {
      toast({ title: "Patient requis", description: "Veuillez d'abord sélectionner un patient.", variant: "destructive" });
      return;
    }
    pendingIds.current[documentType] = null;
    setOpen(true);
  };

  useImperativeHandle(ref, () => ({
    openOrdonnance: () => openDocument('ordonnance', setPrescriptionOpen),
    openAnalyses: () => openDocument('analyses', setAnalysesOpen),
    openImagerie: () => openDocument('imagerie', setImagerieOpen),
    openCertificat: () => openDocument('certificat', setCertOpen),
  }));

  const handleGenerated = (documentType: string) => {
    if (!patient || pendingIds.current[documentType] != null) return;
    recordGenerated({
      patient_id: patient.id,
      consultation_id: consultationId,
      document_type: documentType,
      title: DOCUMENT_LABELS[documentType],
    }).then(created => {
      if (created) pendingIds.current[documentType] = created.id;
    });
  };

  const handlePrinted = (documentType: string) => {
    if (!patient) return;
    const pendingId = pendingIds.current[documentType];
    if (pendingId != null) {
      markPrinted(pendingId);
      return;
    }
    recordPrinted({
      patient_id: patient.id,
      consultation_id: consultationId,
      document_type: documentType,
      title: DOCUMENT_LABELS[documentType],
    }).then(created => {
      if (created) pendingIds.current[documentType] = created.id;
    });
  };

  const diagnosticText = composeDiagnosticPreview(diagnostics);
  const analysesExams = examRequests.filter(e => e.category === 'biologie').map(e => e.label).filter(Boolean);
  const imagerieExams = examRequests.filter(e => e.category !== 'biologie' && e.category !== 'autre').map(e => e.label).filter(Boolean);

  const summary = documents.length > 0
    ? `${documents.length} document${documents.length > 1 ? 's' : ''} généré${documents.length > 1 ? 's' : ''}`
    : undefined;

  return (
    <ConsultationSection title="Documents de consultation" summary={summary} defaultOpen={false}>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => openDocument('ordonnance', setPrescriptionOpen)} className="border-primary/30 text-primary hover:bg-primary/5">
          <FileText className="w-4 h-4" /> Ordonnance
        </Button>
        <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => openDocument('certificat', setCertOpen)} className="border-success/30 text-success hover:bg-success/5">
          <FileCheck className="w-4 h-4" /> Certificat médical
        </Button>
        <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => openDocument('analyses', setAnalysesOpen)} className="border-border text-muted-foreground hover:bg-muted">
          <Microscope className="w-4 h-4" /> Demande d'analyses
        </Button>
        <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => openDocument('imagerie', setImagerieOpen)} className="border-border text-muted-foreground hover:bg-muted">
          <Scan className="w-4 h-4" /> Demande d'imagerie
        </Button>
        <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => openDocument('compte_rendu', setReportOpen)} className="border-cyan-500/30 text-cyan-700 hover:bg-cyan-50 dark:text-cyan-400 dark:hover:bg-cyan-900/20">
          <ClipboardList className="w-4 h-4" /> Compte rendu
        </Button>
        <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => openDocument('arret_travail', setWorkStopOpen)} className="border-destructive/30 text-destructive hover:bg-destructive/5">
          <Stethoscope className="w-4 h-4" /> Arrêt de travail
        </Button>
        <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => openDocument('orientation', setReferralOpen)} className="border-indigo-500/30 text-indigo-600 hover:bg-indigo-500/5">
          <Send className="w-4 h-4" /> Lettre d'orientation
        </Button>
        <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => openDocument('bilan_vierge', setLabRequestOpen)} className="border-teal-500/30 text-teal-700 hover:bg-teal-50 dark:text-teal-400 dark:hover:bg-teal-900/20">
          <FlaskConical className="w-4 h-4" /> Bilan vierge
        </Button>
      </div>

      {documents.length > 0 && (
        <div className="space-y-1.5 pt-1">
          {documents.map(doc => {
            const Icon = DOCUMENT_ICONS[doc.document_type] || FileClock;
            return (
              <div key={doc.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-md border border-border bg-muted/20 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="font-medium text-foreground truncate">{doc.title}</span>
                  <span className="text-muted-foreground shrink-0">
                    {new Date(doc.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={doc.status === 'printed' ? 'success' : 'secondary'}>
                    {doc.status === 'printed' ? 'Imprimé' : 'Généré'}
                  </Badge>
                  <button
                    type="button"
                    onClick={() => deleteDocument(doc.id)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Retirer cette entrée"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <PrescriptionQuickModal
        open={prescriptionOpen}
        onOpenChange={setPrescriptionOpen}
        patient={patient}
        consultationId={consultationId}
        initialMedications={treatmentLines
          .filter(l => l.medication?.trim())
          .map(l => ({
            name: l.medication as string,
            dosage: l.dosage || '',
            instructions: [l.posology, l.frequency, l.instructions].filter(Boolean).join(' — '),
            duration: l.duration || '',
          }))}
        onSaved={() => handleGenerated('ordonnance')}
      />

      <MedicalCertificateDialog
        open={certOpen}
        onOpenChange={setCertOpen}
        patient={patient}
        consultationId={consultationId}
        onSuccess={() => handleGenerated('certificat')}
        onPrinted={() => handlePrinted('certificat')}
      />

      <ExamPrescriptionDialog
        open={analysesOpen}
        onOpenChange={setAnalysesOpen}
        patient={patient}
        consultationId={consultationId}
        kind="analyses"
        initialExams={analysesExams}
        onSaved={() => handleGenerated('analyses')}
        onPrinted={() => handlePrinted('analyses')}
      />

      <ExamPrescriptionDialog
        open={imagerieOpen}
        onOpenChange={setImagerieOpen}
        patient={patient}
        consultationId={consultationId}
        kind="imagerie"
        initialExams={imagerieExams}
        onSaved={() => handleGenerated('imagerie')}
        onPrinted={() => handlePrinted('imagerie')}
      />

      <ConsultationReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        patient={patient}
        motif={motif}
        anamnese={anamnese}
        vitals={vitals}
        clinicalExam={clinicalExam}
        diagnostics={diagnostics}
        treatmentLines={treatmentLines}
        examRequests={examRequests}
        carePlan={carePlan}
        consultationDate={consultationDate}
        nextAppointmentDate={nextAppointmentDate}
        nextAppointmentTime={nextAppointmentTime}
        onSaved={() => handleGenerated('compte_rendu')}
        onPrinted={() => handlePrinted('compte_rendu')}
      />

      <WorkStopDialog
        open={workStopOpen}
        onOpenChange={setWorkStopOpen}
        patient={patient}
        consultationId={consultationId}
        initialNotes={diagnosticText}
        onSaved={() => handleGenerated('arret_travail')}
        onPrinted={() => handlePrinted('arret_travail')}
      />

      <ReferralLetterDialog
        open={referralOpen}
        onOpenChange={setReferralOpen}
        patient={patient}
        initialClinicalNotes={diagnosticText}
        onSaved={() => handleGenerated('orientation')}
        onPrinted={() => handlePrinted('orientation')}
      />

      <LabRequestDialog
        open={labRequestOpen}
        onOpenChange={setLabRequestOpen}
        patient={patient}
        consultationId={consultationId}
        onPrinted={() => handlePrinted('bilan_vierge')}
      />
    </ConsultationSection>
  );
});

ConsultationDocumentsSection.displayName = 'ConsultationDocumentsSection';
