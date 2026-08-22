import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Printer, Save, Microscope, Plus, Trash2 } from "lucide-react";
import { Patient } from "../../../shared/types";
import { useSettings } from "../../hooks/useSettings";
import { useCabinetLogo } from "../../hooks/useCabinetLogo";
import { useToast } from "../../hooks/use-toast";

interface ExamPrescriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: Patient | null;
  consultationId?: number | null;
}

const COMMON_EXAMS = [
  "FNS / Numération Formule Sanguine",
  "Glycémie à jeun",
  "Bilan Rénal (Urée, Créatinine)",
  "Bilan Hépatique (ASAT, ALAT, Bilirubine)",
  "Bilan Lipidique (Cholestérol, Triglycérides)",
  "Radiographie du Thorax (Face)",
  "Échographie Abdomino-pelvienne",
  "Scanner (TDM)",
  "IRM"
];

import { useAuth } from "../../hooks/useAuth";
import { usePatients } from "../../hooks/usePatients";

export const ExamPrescriptionDialog = ({
  open,
  onOpenChange,
  patient,
  consultationId
}: ExamPrescriptionDialogProps) => {
  const { loadPatients } = usePatients();
  const { user } = useAuth();

  useEffect(() => {
    if (open) {
      loadPatients();
      setIsPreview(false);
    }
  }, [open, loadPatients]);
  const [examList, setExamList] = useState<string[]>(["FNS", "Glycémie à jeun"]);
  const [newExam, setNewExam] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isPreview, setIsPreview] = useState<boolean>(false);

  const { settings, getSetting, loadSettings } = useSettings();
  const { logoUrl, hasLogo } = useCabinetLogo();
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const doctorName = user && (user.first_name || user.last_name)
    ? `Dr. ${user.first_name || ''} ${user.last_name || ''}`.trim()
    : (getSetting("doctor_first_name") && getSetting("doctor_last_name")
        ? `Dr. ${getSetting("doctor_first_name")} ${getSetting("doctor_last_name")}`
        : getSetting("doctor_name", "Dr. [Nom du Médecin]"));
  const doctorSpeciality = user?.speciality || getSetting("doctor_speciality", "Médecine Générale");
  const cabinetName = getSetting("cabinet_name", "Cabinet Médical");
  const cabinetAddress = getSetting("cabinet_address", "");

  const patientFullName = patient ? `${patient.first_name} ${patient.last_name}` : "Patient";

  const handleAddExam = (examName: string) => {
    if (!examName.trim()) return;
    if (!examList.includes(examName.trim())) {
      setExamList([...examList, examName.trim()]);
    }
    setNewExam("");
  };

  const handleRemoveExam = (index: number) => {
    setExamList(examList.filter((_, i) => i !== index));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSave = () => {
    toast({
      title: "Demande d'examens enregistrée",
      description: `La prescription de ${examList.length} examen(s) pour ${patientFullName} a été enregistrée avec succès.`,
    });
    onOpenChange(false);
  };

  const [paperFormat, setPaperFormat] = useState<'A4' | 'A5'>('A4');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Microscope className="w-5 h-5 text-purple-600" />
              Demande d'Analyses & Imagerie Medicale
            </DialogTitle>
            {isPreview && (
              <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
                <Button
                  type="button"
                  variant={paperFormat === 'A4' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setPaperFormat('A4')}
                  className="h-7 text-xs font-semibold px-2.5"
                >
                  Format A4
                </Button>
                <Button
                  type="button"
                  variant={paperFormat === 'A5' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setPaperFormat('A5')}
                  className="h-7 text-xs font-semibold px-2.5"
                >
                  Format A5
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>

        {!isPreview ? (
          <div className="space-y-4 py-2">
            <div className="bg-muted/40 p-3 rounded-lg border border-border flex items-center justify-between text-sm">
              <div>
                <span className="text-muted-foreground">Patient : </span>
                <span className="font-semibold text-foreground">{patientFullName}</span>
              </div>
            </div>

            {/* Sélection rapide d'examens courants */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase">Raccourcis Examens Courants</Label>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_EXAMS.map((exam, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAddExam(exam)}
                    className="px-2.5 py-1 bg-primary/5 text-primary border border-primary/20 rounded-md text-xs hover:bg-primary/10 font-medium transition-colors"
                  >
                    + {exam}
                  </button>
                ))}
              </div>
            </div>

            {/* Saisie personnalisée */}
            <div className="flex gap-2">
              <Input
                placeholder="Ajouter un autre examen / analyse..."
                value={newExam}
                onChange={(e) => setNewExam(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddExam(newExam);
                  }
                }}
              />
              <Button type="button" onClick={() => handleAddExam(newExam)}>
                <Plus className="w-4 h-4 mr-1" /> Ajouter
              </Button>
            </div>

            {/* Liste des examens retenus */}
            <div className="space-y-2">
              <Label className="font-medium">Examens Prescrits ({examList.length})</Label>
              {examList.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">Aucun examen ajouté</p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {examList.map((exam, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-muted/30 rounded border border-border text-sm">
                      <span className="font-medium text-foreground">• {exam}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveExam(idx)}
                        className="text-red-500 hover:text-red-700 h-7 w-7 p-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Indication clinique */}
            <div className="space-y-2">
              <Label htmlFor="notes">Renseignements Cliniques / Remarques</Label>
              <Textarea
                id="notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Indication ou renseignements complémentaires pour le laboratoire / centre d'imagerie..."
              />
            </div>
          </div>
        ) : (
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
                    DEMANDE D'EXAMENS & ANALYSES
                  </h1>
                </div>

                <div className="flex justify-between text-xs text-gray-600 mb-4 bg-gray-50 p-2 rounded">
                  <span>Patient : <strong>{patientFullName}</strong></span>
                  <span>Date : {new Date().toLocaleDateString("fr-FR")}</span>
                </div>

                <div className="space-y-2 py-4">
                  <h3 className="text-xs font-bold uppercase text-gray-500">Examens Demandés :</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm font-semibold text-gray-900 pl-2">
                    {examList.map((exam, idx) => (
                      <li key={idx}>{exam}</li>
                    ))}
                  </ul>
                </div>

                {notes && (
                  <div className="text-xs text-gray-600 border-t pt-3">
                    <strong>Renseignements cliniques :</strong> {notes}
                  </div>
                )}
              </div>

              <div className="pt-8 text-right">
                <p className="text-sm font-semibold">Signature & Cachet du Médecin</p>
                <div className="h-16"></div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex items-center justify-between sm:justify-between pt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsPreview(!isPreview)}
          >
            {isPreview ? "Éditer" : "👁️ Aperçu d'impression"}
          </Button>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrint}
              className="gap-1.5"
            >
              <Printer className="w-4 h-4" />
              Imprimer / PDF
            </Button>

            <Button
              type="button"
              onClick={handleSave}
              className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5"
            >
              <Save className="w-4 h-4" />
              Enregistrer
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
