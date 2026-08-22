import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Printer, Save, FileText, Send, UserCheck } from "lucide-react";
import { Patient } from "../../../shared/types";
import { useSettings } from "../../hooks/useSettings";
import { useCabinetLogo } from "../../hooks/useCabinetLogo";
import { useToast } from "../../hooks/use-toast";
import { PatientCombobox } from "../ui/patient-combobox";
import { usePatients } from "../../hooks/usePatients";

import { useAuth } from "../../hooks/useAuth";

interface ReferralLetterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: Patient | null;
}

export const ReferralLetterDialog = ({
  open,
  onOpenChange,
  patient: initialPatient
}: ReferralLetterDialogProps) => {
  const { patients, loadPatients } = usePatients();
  const { user } = useAuth();
  const [patient, setPatient] = useState<Patient | null>(initialPatient);

  useEffect(() => {
    if (open) {
      loadPatients();
      setIsPreview(false);
    }
  }, [open, loadPatients]);

  useEffect(() => {
    if (initialPatient) setPatient(initialPatient);
  }, [initialPatient]);

  const [specialty, setSpecialty] = useState<string>("Cardiologie");
  const [confrereName, setConfrereName] = useState<string>("");
  const [letterType, setLetterType] = useState<string>("orientation");
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [clinicalNotes, setClinicalNotes] = useState<string>("");
  const [letterContent, setLetterContent] = useState<string>("");
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
  const cabinetPhone = getSetting("cabinet_phone", "");

  const patientFullName = patient ? `${patient.first_name} ${patient.last_name}` : "[Nom du Patient]";
  const civility = patient?.gender === 'F' ? 'Mme' : 'M.';
  const dateFormatted = new Date(date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const patientAge = patient?.date_of_birth
    ? new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()
    : null;

  useEffect(() => {
    let text = "";
    const confrereTitle = confrereName ? `Cher(e) confrère ${confrereName}` : `Cher(e) Cher Confrère`;
    const ageText = patientAge ? `âgé(e) de ${patientAge} ans` : "";

    switch (letterType) {
      case "orientation":
        text = `${confrereTitle},\n\nJe vous adresse en consultation ${civility} ${patientFullName} ${ageText}, pour un avis spécialisé en ${specialty}.\n\n${clinicalNotes ? `Considérations cliniques :\n${clinicalNotes}\n\n` : ""}Je vous remercie par avance pour la prise en charge de ce(tte) patient(e) et reste à votre entière disposition pour tout renseignement complémentaire.\n\nBien confraternellement,`;
        break;
      case "radiologie":
        text = `${confrereTitle},\n\nJe vous adresse ${civility} ${patientFullName} ${ageText}, pour la réalisation des examens d'imagerie suivants en ${specialty} :\n\n${clinicalNotes ? `${clinicalNotes}\n\n` : "Examens demandés : ...\n\n"}En vous remerciant par avance.\n\nCordialement,`;
        break;
      case "hospitalisation":
        text = `${confrereTitle},\n\nJe vous adresse en urgence pour hospitalisation/prise en charge ${civility} ${patientFullName} ${ageText}.\n\n${clinicalNotes ? `Motif & Tableau clinique :\n${clinicalNotes}\n\n` : ""}Merci de me tenir informé(e) des suites données.\n\nConfraternellement,`;
        break;
      default:
        text = `${confrereTitle},\n\nConcerne : ${civility} ${patientFullName}\n\n${clinicalNotes}\n\nBien confraternellement,`;
        break;
    }
    setLetterContent(text);
  }, [letterType, specialty, confrereName, clinicalNotes, patient, patientFullName, civility, patientAge]);

  const handlePrint = () => {
    window.print();
  };

  const handleSave = () => {
    if (!patient) {
      toast({ title: "Patient requis", description: "Veuillez sélectionner un patient.", variant: "destructive" });
      return;
    }
    toast({
      title: "Lettre enregistrée",
      description: `La lettre d'orientation pour ${civility} ${patientFullName} a été générée avec succès.`,
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
              <Send className="w-5 h-5 text-primary" />
              Rédaction d'une Lettre d'Orientation & Liaison
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
            {!initialPatient ? (
              <div className="space-y-1.5">
                <Label className="font-semibold text-foreground">Sélectionner le Patient *</Label>
                <PatientCombobox
                  patients={patients}
                  selectedPatient={patient}
                  onPatientSelect={(p) => setPatient(p)}
                  onOpen={loadPatients}
                  placeholder="Rechercher un patient..."
                  emptyMessage="Aucun patient trouvé."
                />
              </div>
            ) : (
              <div className="bg-muted/40 p-3 rounded-lg border border-border flex items-center justify-between text-sm">
                <div>
                  <span className="text-muted-foreground">Patient : </span>
                  <span className="font-bold text-foreground">{civility} {patientFullName}</span>
                </div>
                <span className="text-xs text-muted-foreground">Date : {dateFormatted}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="font-medium text-xs">Spécialité du Confrère</Label>
                <Select value={specialty} onValueChange={setSpecialty}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Spécialité" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cardiologie">Cardiologie</SelectItem>
                    <SelectItem value="Radiologie & Imagerie">Radiologie & Imagerie</SelectItem>
                    <SelectItem value="Biologie & Analyses">Biologie & Analyses</SelectItem>
                    <SelectItem value="Neurologie">Neurologie</SelectItem>
                    <SelectItem value="Pneumologie">Pneumologie</SelectItem>
                    <SelectItem value="Gastro-entérologie">Gastro-entérologie</SelectItem>
                    <SelectItem value="ORL">ORL</SelectItem>
                    <SelectItem value="Ophtalmologie">Ophtalmologie</SelectItem>
                    <SelectItem value="Chirurgie">Chirurgie Générale</SelectItem>
                    <SelectItem value="Pédiatrie">Pédiatrie</SelectItem>
                    <SelectItem value="Dermatologie">Dermatologie</SelectItem>
                    <SelectItem value="Autre Spécialité">Autre Spécialité</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="font-medium text-xs">Nom du Confrère / Médecin (Optionnel)</Label>
                <Input
                  value={confrereName}
                  onChange={(e) => setConfrereName(e.target.value)}
                  placeholder="Ex: Dr. Benali"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="font-medium text-xs">Type de Courrier</Label>
              <Select value={letterType} onValueChange={setLetterType}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Type de courrier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="orientation">Lettre d'orientation / Avis spécialisé</SelectItem>
                  <SelectItem value="radiologie">Demande d'imagerie / Radiologie</SelectItem>
                  <SelectItem value="hospitalisation">Demande d'hospitalisation d'urgence</SelectItem>
                  <SelectItem value="custom">Courrier personnalisé libre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="font-medium text-xs">Considérations cliniques / Motif</Label>
              <Textarea
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                placeholder="Renseignez le contexte médical, symptômes ou examens à réaliser..."
                className="min-h-[80px] text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="font-medium text-xs">Texte final du courrier (modifiable)</Label>
              <Textarea
                value={letterContent}
                onChange={(e) => setLetterContent(e.target.value)}
                className="min-h-[160px] font-mono text-xs leading-relaxed"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
              <Button variant="secondary" onClick={() => setIsPreview(true)} className="gap-1.5">
                <Printer className="w-4 h-4" /> Aperçu & Impression
              </Button>
              <Button onClick={handleSave} className="gap-1.5">
                <Save className="w-4 h-4" /> Enregistrer
              </Button>
            </div>
          </div>
        ) : (
          /* Preview Mode - Sublime Imprimé Officiel */
          <div className="space-y-6">
            <div className="bg-slate-200/70 dark:bg-slate-900/80 p-4 sm:p-6 rounded-xl overflow-x-auto flex justify-center border border-border shadow-inner">
              <div className={`printable-document ${paperFormat === 'A5' ? 'format-a5 max-w-[148mm] min-h-[210mm] p-6' : 'max-w-[210mm] min-h-[297mm] p-10'} w-full bg-white text-gray-900 shadow-2xl rounded-sm border border-gray-300 flex flex-col justify-between font-sans transition-all duration-200`}>
              <div>
                {/* En-tête Officiel */}
                <div className="flex justify-between items-start border-b-2 border-blue-900/40 pb-4 mb-4">
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold uppercase tracking-wide text-blue-950">{doctorName}</h2>
                    <p className="text-sm font-semibold text-gray-700">{doctorSpeciality}</p>
                    {getSetting("doctor_agrement_number") && (
                      <p className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-0.5 rounded inline-block">
                        N° Agrément / Ordre : {getSetting("doctor_agrement_number")}
                      </p>
                    )}
                  </div>
                  
                  {hasLogo && logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="h-16 object-contain" />
                  ) : (
                    <div className="text-center px-4 py-2 border-2 border-blue-900/30 rounded-lg bg-blue-50/40">
                      <span className="text-xs font-bold text-blue-900 block uppercase">Cabinet Médical</span>
                      <span className="text-[11px] text-gray-600 font-medium">{cabinetName}</span>
                    </div>
                  )}

                  <div className="text-right space-y-1 text-xs text-gray-700">
                    <p className="font-bold text-sm text-gray-900">{cabinetName}</p>
                    {cabinetAddress && <p>{cabinetAddress}</p>}
                    {cabinetPhone && <p>Tél : {cabinetPhone}</p>}
                  </div>
                </div>

                {/* Titre du document */}
                <div className="text-center my-6">
                  <h1 className="text-2xl font-extrabold uppercase tracking-widest text-blue-950 border-b-2 border-blue-900 inline-block px-6 pb-1">
                    LETTRE DE LIAISON / ORIENTATION
                  </h1>
                </div>

                {/* Encadré Patient & Destinataire */}
                <div className="bg-slate-50 border border-slate-300 rounded-lg p-3 flex justify-between items-center text-xs font-medium text-slate-800 mb-6">
                  <div><strong>Patient(e) :</strong> <span className="text-sm font-bold uppercase text-blue-950">{civility} {patientFullName}</span> {patientAge ? `(${patientAge} ans)` : ''}</div>
                  <div><strong>Destinataire :</strong> <span className="font-bold">{confrereName ? `À l'attention du ${confrereName}` : `Avis spécialisé en ${specialty}`}</span></div>
                  <div><strong>Date :</strong> <span className="font-bold">{dateFormatted}</span></div>
                </div>

                {/* Corps du courrier */}
                <div className="bg-slate-50/40 border border-slate-200 rounded-xl p-6 text-sm leading-relaxed text-justify whitespace-pre-wrap font-serif text-gray-900 shadow-2xs min-h-[220px]">
                  {letterContent}
                </div>
              </div>

              {/* Signature */}
              <div className="pt-6 border-t border-gray-300 mt-8">
                <div className="flex justify-between items-end text-xs">
                  <div className="text-[11px] text-gray-400 italic">
                    Remis en mains propres au patient pour transmission au confrère.
                  </div>

                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 w-56 text-center">
                    <p className="font-bold text-gray-900 uppercase text-[11px]">Signature et Cachet du Médecin</p>
                    <div className="h-16 flex items-center justify-center text-gray-300 italic text-[11px]">
                      [Emplacement Cachet Officiel]
                    </div>
                    <p className="font-bold text-blue-950 text-xs">{doctorName}</p>
                  </div>
                </div>
              </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <Button variant="outline" onClick={() => setIsPreview(false)}>
                Retour à l'édition
              </Button>
              <div className="flex gap-2">
                <Button onClick={handlePrint} className="gap-2">
                  <Printer className="w-4 h-4" /> Imprimer
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
