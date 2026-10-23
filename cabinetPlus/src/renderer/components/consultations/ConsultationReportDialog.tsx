import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Printer, Save, ClipboardList } from "lucide-react";
import { Patient, ConsultationAnamnese, ConsultationVitals, ClinicalExamSection, ConsultationDiagnostics, TreatmentLine, ExamRequestEntry, ConsultationCarePlan } from "../../../shared/types";
import { useSettings } from "../../hooks/useSettings";
import { useCabinetLogo } from "../../hooks/useCabinetLogo";
import { useAuth } from "../../hooks/useAuth";
import { composeDiagnosticPreview } from "../../utils/consultationText";
import { formatTreatmentLine } from "../../utils/treatment";
import { summarizeExamSection } from "../../utils/clinicalExam";
import { formatAppointmentDisplay } from "../../utils/carePlan";
import { formatAnamneseLines, formatVitalsLines, formatCarePlanLines } from "../../utils/consultationSummary";
import { resolveDoctorName, resolveDoctorSpeciality } from "../../utils/doctorIdentity";

interface ConsultationReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: Patient | null;
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
  onSaved?: () => void;
  onPrinted?: () => void;
}

/**
 * Compte rendu de consultation — cf. PLAN_CONSULTATION.md L11.3. Contrairement
 * aux 6 autres documents (rédigés par le médecin), celui-ci n'a rien à
 * saisir : il recompose en lecture seule les blocs déjà remplis dans le
 * formulaire (motif → anamnèse → constantes → examen → diagnostic →
 * traitement → examens → plan), avec les mêmes fonctions déjà utilisées pour
 * l'aperçu d'impression (`consultationText.ts`, `clinicalExam.ts`,
 * `treatment.ts`, `carePlan.ts`) pour ne jamais diverger de ce qui sera
 * réellement enregistré.
 */
export const ConsultationReportDialog = ({
  open,
  onOpenChange,
  patient,
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
  onSaved,
  onPrinted,
}: ConsultationReportDialogProps) => {
  const { getSetting, loadSettings } = useSettings();
  const { logoUrl, hasLogo } = useCabinetLogo();
  const { user } = useAuth();
  const [paperFormat, setPaperFormat] = useState<'A4' | 'A5'>('A4');

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const doctorName = resolveDoctorName(user, getSetting);
  const doctorSpeciality = resolveDoctorSpeciality(user, getSetting);
  const cabinetName = getSetting("cabinet_name", "Cabinet Médical");
  const cabinetAddress = getSetting("cabinet_address", "");

  const patientFullName = patient ? `${patient.first_name} ${patient.last_name}` : "Patient";
  const patientAge = patient?.date_of_birth
    ? new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()
    : null;

  const anamneseLines = formatAnamneseLines(anamnese);
  const vitalsLines = formatVitalsLines(vitals);
  const activeExamSections = clinicalExam.filter(s => summarizeExamSection(s).trim().length > 0);
  const diagnosticText = composeDiagnosticPreview(diagnostics);
  const treatmentTexts = treatmentLines.map(formatTreatmentLine).filter(Boolean);
  const examLabels = examRequests.map(e => e.label).filter(Boolean);
  const carePlanLines = formatCarePlanLines(carePlan, consultationDate);

  const handlePrint = () => {
    window.print();
    onPrinted?.();
  };

  const handleSave = () => {
    onSaved?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <ClipboardList className="w-5 h-5 text-cyan-600" />
              Compte Rendu de Consultation
            </DialogTitle>
            <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
              <Button type="button" variant={paperFormat === 'A4' ? 'secondary' : 'ghost'} size="sm" onClick={() => setPaperFormat('A4')} className="h-7 text-xs font-semibold px-2.5">
                Format A4
              </Button>
              <Button type="button" variant={paperFormat === 'A5' ? 'secondary' : 'ghost'} size="sm" onClick={() => setPaperFormat('A5')} className="h-7 text-xs font-semibold px-2.5">
                Format A5
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="bg-slate-200/70 dark:bg-slate-900/80 p-4 sm:p-6 rounded-xl overflow-x-auto flex justify-center border border-border shadow-inner">
          <div className={`printable-document ${paperFormat === 'A5' ? 'format-a5 max-w-[148mm] min-h-[210mm] p-6' : 'max-w-[210mm] min-h-[297mm] p-10'} w-full bg-white text-gray-900 shadow-2xl rounded-sm border border-gray-300 flex flex-col justify-between font-sans transition-all duration-200`}>
            <div>
              <div className="flex justify-between items-start border-b pb-4">
                <div>
                  <h2 className="text-lg font-bold uppercase">{doctorName}</h2>
                  <p className="text-sm text-gray-600">{doctorSpeciality}</p>
                  <p className="text-xs text-gray-500">{cabinetName} - {cabinetAddress}</p>
                </div>
                {hasLogo && logoUrl && (
                  <img src={logoUrl} alt="Logo Cabinet" className="w-16 h-16 object-contain" />
                )}
              </div>

              <div className="text-center my-4">
                <h1 className="text-xl font-bold uppercase tracking-wider text-gray-900 border-b-2 border-gray-900 inline-block pb-1">
                  COMPTE RENDU DE CONSULTATION
                </h1>
              </div>

              <div className="flex justify-between text-xs text-gray-600 mb-4 bg-gray-50 p-2 rounded">
                <span>Patient : <strong>{patientFullName}</strong>{patientAge !== null ? ` (${patientAge} ans)` : ''}</span>
                <span>Date : {new Date().toLocaleDateString("fr-FR")}</span>
              </div>

              <div className="space-y-4 py-2 text-sm text-gray-900">
                <div>
                  <h3 className="text-xs font-bold uppercase text-gray-500 mb-1">Motif</h3>
                  <p>{motif || 'Non renseigné'}</p>
                </div>

                {anamneseLines.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold uppercase text-gray-500 mb-1">Anamnèse</h3>
                    <ul className="space-y-0.5">
                      {anamneseLines.map((line, i) => <li key={i}>{line}</li>)}
                    </ul>
                  </div>
                )}

                {vitalsLines.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold uppercase text-gray-500 mb-1">Constantes</h3>
                    <p>{vitalsLines.join(' — ')}</p>
                  </div>
                )}

                {activeExamSections.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold uppercase text-gray-500 mb-1">Examen clinique</h3>
                    <ul className="space-y-0.5">
                      {activeExamSections.map(s => (
                        <li key={s.key}><strong>{s.label} :</strong> {summarizeExamSection(s)}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <h3 className="text-xs font-bold uppercase text-gray-500 mb-1">Diagnostic</h3>
                  <p>{diagnosticText || 'Non renseigné'}</p>
                </div>

                {treatmentTexts.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold uppercase text-gray-500 mb-1">Traitement</h3>
                    <ul className="list-disc list-inside space-y-0.5">
                      {treatmentTexts.map((t, i) => <li key={i}>{t}</li>)}
                    </ul>
                  </div>
                )}

                {examLabels.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold uppercase text-gray-500 mb-1">Examens complémentaires demandés</h3>
                    <p>{examLabels.join(', ')}</p>
                  </div>
                )}

                <div>
                  <h3 className="text-xs font-bold uppercase text-gray-500 mb-1">Conduite à tenir</h3>
                  {carePlanLines.length > 0 ? (
                    <ul className="space-y-0.5">
                      {carePlanLines.map((line, i) => <li key={i}>{line}</li>)}
                    </ul>
                  ) : (
                    <p className="italic text-gray-500">Non renseigné</p>
                  )}
                </div>

                {nextAppointmentDate && nextAppointmentTime && (
                  <div>
                    <h3 className="text-xs font-bold uppercase text-gray-500 mb-1">Prochain rendez-vous</h3>
                    <p>{formatAppointmentDisplay(nextAppointmentDate, nextAppointmentTime)}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-8 text-right">
              <p className="text-sm font-semibold">Signature & Cachet du Médecin</p>
              <div className="h-16"></div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between pt-4 border-t border-border">
          <p className="text-[11px] text-muted-foreground">
            Généré automatiquement à partir des blocs de la consultation.
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={handlePrint} className="gap-1.5">
              <Printer className="w-4 h-4" />
              Imprimer / PDF
            </Button>
            <Button type="button" onClick={handleSave} className="gap-1.5">
              <Save className="w-4 h-4" />
              Enregistrer au dossier
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
