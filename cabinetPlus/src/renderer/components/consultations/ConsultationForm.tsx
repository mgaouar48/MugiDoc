import { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Badge } from "../ui/badge";
import {
  ArrowLeft,
  FileText,
  Stethoscope,
  Loader2,
  FileCheck,
  CheckCircle2,
  Paperclip,
  Printer as PrinterIcon,
  Microchip as Microscope,
  Save,
  Send,
  FlaskConical
} from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import { PatientCombobox } from "../ui/patient-combobox";
import { Patient } from "../../../shared/types";
import { PatientHealthAlert } from "../patients/PatientHealthAlert";
import { PatientDebtAlert } from "../patients/PatientDebtAlert";
import { MedicalCertificateDialog } from "./MedicalCertificateDialog";
import { ReferralLetterDialog } from "./ReferralLetterDialog";
import { WorkStopDialog } from "./WorkStopDialog";
import { ExamPrescriptionDialog } from "./ExamPrescriptionDialog";
import { PrescriptionQuickModal } from "./PrescriptionQuickModal";
import { LabRequestDialog } from "./LabRequestDialog";
import { ConsultationPrintPreviewDialog } from "./ConsultationPrintPreviewDialog";
import { ConsultationUI } from "./consultationMappers";

interface ConsultationFormData {
  date: string;
  time: string;
  motif: string;
  diagnostic: string;
  traitement: string;
  status: 'completed' | 'cancelled' | 'scheduled' | 'no_show';
  notes: string;
}

interface ConsultationFormProps {
  formData: ConsultationFormData;
  setFormData: (data: ConsultationFormData) => void;
  patients: Patient[];
  selectedPatient: Patient | null;
  onPatientSelect: (patient: Patient | null) => void;
  editingConsultation: ConsultationUI | null;
  isLoading: boolean;
  onSubmit: () => void;
  onCancel: () => void;
}

export const ConsultationForm = ({
  formData,
  setFormData,
  patients,
  selectedPatient,
  onPatientSelect,
  editingConsultation,
  isLoading,
  onSubmit,
  onCancel,
}: ConsultationFormProps) => {
  const { toast } = useToast();

  // Modales d'actions rapides — état interne, uniquement utilisé depuis cette barre d'actions
  const [certModalOpen, setCertModalOpen] = useState(false);
  const [referralModalOpen, setReferralModalOpen] = useState(false);
  const [workStopModalOpen, setWorkStopModalOpen] = useState(false);
  const [examModalOpen, setExamModalOpen] = useState(false);
  const [prescriptionModalOpen, setPrescriptionModalOpen] = useState(false);
  const [labRequestModalOpen, setLabRequestModalOpen] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [attachedDocName, setAttachedDocName] = useState<string | null>(null);

  const requirePatient = (openFn: () => void) => () => {
    if (!selectedPatient) {
      toast({ title: "Patient requis", description: "Veuillez d'abord sélectionner un patient.", variant: "destructive" });
      return;
    }
    openFn();
  };

  const consultationIdForDialogs = editingConsultation ? parseInt(editingConsultation.id) : null;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border px-8 py-0 flex items-center" style={{ height: '64px' }}>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onCancel}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                {editingConsultation?.id ? 'Modifier la Consultation' : 'Nouvelle Consultation'}
              </h2>
              <p className="text-xs text-muted-foreground">
                {editingConsultation?.id ? 'Mettre à jour les informations' : 'Enregistrer une nouvelle consultation médicale'}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6 max-w-4xl mx-auto">
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
            {/* Indicateur de chargement */}
            {isLoading && (
              <div className="flex items-center justify-center space-x-2 p-4">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Chargement...</span>
              </div>
            )}

            <form onSubmit={(e) => {
              e.preventDefault();
              onSubmit();
            }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Sélecteur de patient */}
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
                  <div className="md:col-span-2 space-y-3">
                    <PatientHealthAlert patient={selectedPatient} />
                    <PatientDebtAlert patientId={selectedPatient.id} compact />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="status">Statut</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: 'completed' | 'cancelled' | 'scheduled' | 'no_show') => {
                      setFormData({ ...formData, status: value });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">Programmée</SelectItem>
                      <SelectItem value="completed">Terminée</SelectItem>
                      <SelectItem value="cancelled">Annulée</SelectItem>
                      <SelectItem value="no_show">Absent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

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
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="motif">Motif de consultation <span className="text-xs text-muted-foreground font-normal">(optionnel)</span></Label>
                  <Input
                    id="motif"
                    value={formData.motif}
                    onChange={(e) => setFormData({ ...formData, motif: e.target.value })}
                    placeholder="Raison de la consultation (optionnel)"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="diagnostic">Diagnostic</Label>
                  <Textarea
                    id="diagnostic"
                    value={formData.diagnostic}
                    onChange={(e) => setFormData({ ...formData, diagnostic: e.target.value })}
                    placeholder="Diagnostic médical"
                    rows={3}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="traitement">Traitement</Label>
                  <Textarea
                    id="traitement"
                    value={formData.traitement}
                    onChange={(e) => setFormData({ ...formData, traitement: e.target.value })}
                    placeholder="Traitement prescrit"
                    rows={3}
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

                {/* ── Barre d'actions clinique ── */}
                <div className="pt-5 border-t border-border md:col-span-2">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Stethoscope className="w-4 h-4 text-primary" />
                      Actions de fin de consultation
                    </Label>
                    {attachedDocName && (
                      <Badge variant="warning" className="text-xs">
                        📎 {attachedDocName}
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={requirePatient(() => setPrescriptionModalOpen(true))}
                      className="border-primary/30 text-primary hover:bg-primary/5"
                    >
                      <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>Ordonnance</span>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={requirePatient(() => setCertModalOpen(true))}
                      className="border-success/30 text-success hover:bg-success/5"
                    >
                      <FileCheck className="w-4 h-4" />
                      Certificat médical
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={requirePatient(() => setReferralModalOpen(true))}
                      className="border-indigo-500/30 text-indigo-600 hover:bg-indigo-500/5"
                    >
                      <Send className="w-4 h-4" />
                      Lettre d'orientation
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={requirePatient(() => setWorkStopModalOpen(true))}
                      className="border-destructive/30 text-destructive hover:bg-destructive/5"
                    >
                      <Stethoscope className="w-4 h-4" />
                      Arrêt de travail
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={requirePatient(() => setExamModalOpen(true))}
                      className="border-border text-muted-foreground hover:bg-muted"
                    >
                      <Microscope className="w-4 h-4" />
                      Examen
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={requirePatient(() => setLabRequestModalOpen(true))}
                      className="border-teal-500/30 text-teal-700 hover:bg-teal-50 dark:text-teal-400 dark:hover:bg-teal-900/20"
                    >
                      <FlaskConical className="w-4 h-4" />
                      Demande de Bilan
                    </Button>

                    <label className="cursor-pointer">
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            setAttachedDocName(file.name);
                            toast({ title: "Document joint", description: `Fichier "${file.name}" rattaché à cette consultation.` });
                          }
                        }}
                      />
                      <div className="flex items-center gap-1.5 border border-warning/30 text-warning hover:bg-warning/5 text-xs py-2 px-3 h-9 rounded-md font-medium transition-colors cursor-pointer">
                        <Paperclip className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{attachedDocName ? attachedDocName : 'Joindre'}</span>
                      </div>
                    </label>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={requirePatient(() => setPrintModalOpen(true))}
                      className="border-border hover:bg-muted text-muted-foreground"
                    >
                      <PrinterIcon className="w-4 h-4" />
                      Imprimer
                    </Button>

                    <Button
                      type="button"
                      variant="success"
                      size="sm"
                      onClick={() => {
                        setFormData({ ...formData, status: 'completed' });
                        toast({ title: "Statut mis à jour", description: "La consultation sera clôturée lors de l'enregistrement." });
                      }}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Clôturer la consultation
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  className="border-border"
                  disabled={isLoading}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 gap-2"
                  disabled={isLoading || !selectedPatient || !formData.date || !formData.time}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {editingConsultation ? 'Modification...' : 'Enregistrement...'}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Enregistrer la Consultation</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Modales d'actions rapides */}
      <MedicalCertificateDialog
        open={certModalOpen}
        onOpenChange={setCertModalOpen}
        patient={selectedPatient}
        consultationId={consultationIdForDialogs}
      />

      <ReferralLetterDialog
        open={referralModalOpen}
        onOpenChange={setReferralModalOpen}
        patient={selectedPatient}
      />

      <WorkStopDialog
        open={workStopModalOpen}
        onOpenChange={setWorkStopModalOpen}
        patient={selectedPatient}
        consultationId={consultationIdForDialogs}
      />

      <ExamPrescriptionDialog
        open={examModalOpen}
        onOpenChange={setExamModalOpen}
        patient={selectedPatient}
        consultationId={consultationIdForDialogs}
      />

      <PrescriptionQuickModal
        open={prescriptionModalOpen}
        onOpenChange={setPrescriptionModalOpen}
        patient={selectedPatient}
        consultationId={consultationIdForDialogs}
      />

      <LabRequestDialog
        open={labRequestModalOpen}
        onOpenChange={setLabRequestModalOpen}
        patient={selectedPatient}
        consultationId={consultationIdForDialogs}
      />

      <ConsultationPrintPreviewDialog
        open={printModalOpen}
        onOpenChange={setPrintModalOpen}
        patient={selectedPatient}
        consultationData={formData}
      />
    </div>
  );
};
