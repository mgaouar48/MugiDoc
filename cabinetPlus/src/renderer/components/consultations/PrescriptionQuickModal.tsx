import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Printer, Save, FileText, Plus, Trash2, AlertTriangle, Pill, Sparkles, BookOpen, Zap, Check, Search, ShieldAlert } from "lucide-react";
import { Patient, Medication } from "../../../shared/types";
import { usePrescriptions } from "../../hooks/usePrescriptions";
import { useSettings } from "../../hooks/useSettings";
import { useCabinetLogo } from "../../hooks/useCabinetLogo";
import { useToast } from "../../hooks/use-toast";
import { useAuth } from "../../hooks/useAuth";
import { usePatients } from "../../hooks/usePatients";
import { COMMON_MEDICATIONS } from "../../constants/medications";
import { MedicationDirectoryDialog } from "./MedicationDirectoryDialog";
import { PrescriptionModelSelectDialog } from "./PrescriptionModelSelectDialog";
import { MAX_MEDICATIONS } from "../../constants/prescriptions";

interface QuickMedicationRowProps {
  med: Medication;
  idx: number;
  totalCount: number;
  patient: Patient | null;
  onUpdate: (index: number, field: keyof Medication, value: string) => void;
  onSelectMedication: (index: number, item: any) => void;
  onRemove: (index: number) => void;
}

const QuickMedicationRow = ({
  med,
  idx,
  totalCount,
  patient,
  onUpdate,
  onSelectMedication,
  onRemove
}: QuickMedicationRowProps) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;
    const fetchMeds = async () => {
      try {
        let dbResults: any[] = [];
        if ((window as any).electronAPI?.medications) {
          dbResults = (await (window as any).electronAPI.medications.search(med.name || '', 100)) || [];
        }

        const query = (med.name || '').toLowerCase().trim();
        const commonMatches = COMMON_MEDICATIONS.filter(m =>
          !query || m.name.toLowerCase().includes(query) || (m.category && m.category.toLowerCase().includes(query))
        ).map((m, i) => ({
          id: `common-${i}`,
          brand_name: m.name,
          form: m.instructions,
          dosage: m.dosage,
          dci: m.category || 'Présélection'
        }));

        const combined = [...dbResults];
        const existingNames = new Set(combined.map(r => (r.brand_name || '').toLowerCase()));

        for (const common of commonMatches) {
          if (!existingNames.has(common.brand_name.toLowerCase())) {
            combined.push(common);
            existingNames.add(common.brand_name.toLowerCase());
          }
        }

        if (isMounted) {
          setSuggestions(combined);
        }
      } catch (err) {
        console.error('Erreur recherche médicaments:', err);
      }
    };

    fetchMeds();
    return () => { isMounted = false; };
  }, [med.name]);

  const checkAllergyConflict = (medName: string, patientAllergies?: string): string | null => {
    if (!medName || !patientAllergies) return null;
    const allergyList = patientAllergies.split(/[,;\n]/).map(a => a.trim().toLowerCase()).filter(Boolean);
    const nameLower = medName.toLowerCase();
    for (const allergy of allergyList) {
      if (allergy.length >= 3 && nameLower.includes(allergy)) {
        return allergy;
      }
    }
    return null;
  };

  const allergyConflict = checkAllergyConflict(med.name, patient?.allergies);

  return (
    <div className="p-3 bg-muted/20 border border-border rounded-lg space-y-2 relative">
      {allergyConflict && (
        <div className="bg-red-500/10 border border-red-300 dark:border-red-900 text-red-700 dark:text-red-300 p-2.5 rounded-md text-xs flex items-center gap-2 font-medium animate-pulse">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <span>
            <strong>ATTENTION ALLERGIE :</strong> Le patient a une allergie déclarée à "<strong>{allergyConflict}</strong>" qui peut correspondre à ce médicament.
          </span>
        </div>
      )}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-muted-foreground">Médicament #{idx + 1}</span>
        {totalCount > 1 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onRemove(idx)}
            className="text-red-500 hover:text-red-700 h-6 w-6 p-0"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <div className="relative md:col-span-2">
          <Input
            placeholder="Nom du médicament * (ex: Doliprane, Amoxicilline...)"
            value={med.name}
            onChange={(e) => {
              onUpdate(idx, "name", e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 250)}
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto p-1.5 backdrop-blur-md">
              <div className="px-2 py-1 text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between border-b border-border/40 mb-1">
                <span>Catalogue des Médicaments (Registre 2025)</span>
                <Sparkles className="w-3 h-3 text-amber-500" />
              </div>
              {suggestions.map((item, i) => (
                <button
                  key={item.id || i}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onSelectMedication(idx, item);
                    setShowSuggestions(false);
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-primary/10 transition-colors flex items-center justify-between text-xs group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Pill className="w-3.5 h-3.5 text-primary shrink-0" />
                    <div className="truncate">
                      <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {item.brand_name}
                      </span>
                      {item.dci && (
                        <span className="text-[11px] text-muted-foreground ml-1.5 truncate">
                          ({item.dci})
                        </span>
                      )}
                      {item.form && (
                        <p className="text-[11px] text-muted-foreground/80 truncate">{item.form}</p>
                      )}
                    </div>
                  </div>
                  {item.dosage && (
                    <span className="text-[11px] font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-md font-semibold shrink-0 ml-2">
                      {item.dosage}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        <Input
          placeholder="Dosage (ex: 500mg)"
          value={med.dosage}
          onChange={(e) => onUpdate(idx, "dosage", e.target.value)}
        />
        <Input
          placeholder="Durée (ex: 7 jours)"
          value={med.duration}
          onChange={(e) => onUpdate(idx, "duration", e.target.value)}
        />
      </div>

      <Input
        placeholder="Instructions / Posologie (ex: 1 cp matin et soir après les repas)"
        value={med.instructions}
        onChange={(e) => onUpdate(idx, "instructions", e.target.value)}
        className="text-sm"
      />
    </div>
  );
};

interface PrescriptionQuickModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: Patient | null;
  consultationId?: number | null;
}

export const PrescriptionQuickModal = ({
  open,
  onOpenChange,
  patient,
  consultationId
}: PrescriptionQuickModalProps) => {
  const [medications, setMedications] = useState<Medication[]>([
    { name: "", dosage: "", instructions: "", duration: "" }
  ]);
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [directoryOpen, setDirectoryOpen] = useState<boolean>(false);

  const [isPreview, setIsPreview] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const { createPrescription, templates, loadTemplates } = usePrescriptions();
  const { settings, getSetting, loadSettings } = useSettings();
  const { logoUrl, hasLogo } = useCabinetLogo();
  const { toast } = useToast();
  const { user } = useAuth();
  const { loadPatients } = usePatients();

  useEffect(() => {
    if (open) {
      loadPatients();
      // Modèles du médecin : seule source de préremplissage depuis le retrait
      // des ordonnances prédéfinies.
      loadTemplates();
      setIsPreview(false);
    }
  }, [open, loadPatients, loadTemplates]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const doctorName = user && (user.first_name || user.last_name)
    ? `Dr. ${user.first_name || ''} ${user.last_name || ''}`.trim()
    : (getSetting("doctor_first_name") && getSetting("doctor_last_name")
      ? `Dr. ${getSetting("doctor_first_name")} ${getSetting("doctor_last_name")}`
      : getSetting("doctor_name", "Dr. [Nom du Médecin]"));
  const doctorSpeciality = user?.speciality || getSetting("doctor_speciality", "Médecine Générale");
  const doctorAgrement = getSetting("doctor_agrement_number", "");
  const cabinetName = getSetting("cabinet_name", "Cabinet Médical");
  const cabinetAddress = getSetting("cabinet_address", "");

  const patientFullName = patient ? `${patient.first_name} ${patient.last_name}` : "Patient";

  /** Préremplit l'ordonnance depuis un modèle enregistré par le médecin. */
  const handleSelectTemplate = (template: { name: string; medications?: Medication[] }) => {
    const meds = (template.medications || []).slice(0, MAX_MEDICATIONS);
    if (meds.length === 0) return;

    setMedications(meds.map(m => ({
      name: m.name,
      dosage: m.dosage,
      instructions: m.instructions,
      duration: m.duration
    })));

    toast({
      title: "Modèle chargé",
      description: `« ${template.name} » (${meds.length} médicament(s)) prérempli avec succès.`,
    });
  };

  const atMedicationLimit = medications.length >= MAX_MEDICATIONS;

  const handleAddMedication = () => {
    // Même plafond que les autres ecrans d'ordonnance : au-delà, l'impression
    // déborde d'une page.
    if (atMedicationLimit) return;
    setMedications([...medications, { name: "", dosage: "", instructions: "", duration: "" }]);
  };

  const handleRemoveMedication = (index: number) => {
    if (medications.length > 1) {
      setMedications(medications.filter((_, i) => i !== index));
    }
  };

  const handleMedicationChange = (index: number, field: keyof Medication, value: string) => {
    const updated = [...medications];
    updated[index] = { ...updated[index], [field]: value };
    setMedications(updated);
  };

  const handleSelectMedication = (index: number, item: any) => {
    const defaultInstructions = item.form ? `${item.form}` : '';
    const formattedDosage = item.dosage ? item.dosage : '1 fois par jour';

    const updated = [...medications];
    updated[index] = {
      ...updated[index],
      name: item.brand_name,
      dosage: formattedDosage,
      instructions: updated[index].instructions || defaultInstructions
    };
    setMedications(updated);

    if (item.id && (window as any).electronAPI?.medications) {
      (window as any).electronAPI.medications.incrementPopularity(item.id);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSave = async () => {
    if (!patient) return;
    const validMeds = medications.filter(m => m.name.trim().length > 0);
    if (validMeds.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir au moins un médicament.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await createPrescription({
        patient_id: patient.id,
        consultation_id: consultationId || undefined,
        medications: validMeds,
        date: date
      });

      toast({
        title: "Ordonnance enregistrée",
        description: `L'ordonnance a été rattachée à la consultation de ${patientFullName}.`,
      });
      onOpenChange(false);
    } catch (err) {
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer l'ordonnance.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const [modelDialogOpen, setModelDialogOpen] = useState<boolean>(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-6 transition-all duration-200">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <FileText className="w-5 h-5 text-blue-600" />
            Créer une Ordonnance pour cette Consultation
          </DialogTitle>
        </DialogHeader>

        {!isPreview ? (
          <div className="space-y-4 py-2">
            <div className="bg-muted/40 p-3 rounded-lg border border-border flex items-center justify-between text-sm">
              <div>
                <span className="text-muted-foreground">Patient : </span>
                <span className="font-semibold text-foreground">{patientFullName}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Date : </span>
                <span className="font-medium text-foreground">{date}</span>
              </div>
            </div>

            {/* Sélection de Modèles avec Recherche */}
            <div className="p-3 bg-card border border-border rounded-lg flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-md bg-primary/10 text-primary">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">Modèles d'ordonnance</h4>
                  <p className="text-[11px] text-muted-foreground">Rechercher par maladie, médicament ou symptôme</p>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setModelDialogOpen(true)}
                className="gap-1.5 text-xs font-semibold text-primary border-primary/30 hover:bg-primary/5"
              >
                <Search className="w-3.5 h-3.5" />
                Rechercher un modèle...
              </Button>
            </div>

            {patient?.allergies && (
              <div className="bg-red-500/10 border border-red-300 dark:border-red-900 text-red-700 dark:text-red-300 p-3 rounded-lg text-xs flex items-center gap-2 font-medium">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <div>
                  <span className="font-bold">ALLERGIES DÉCLARÉES DU PATIENT : </span>
                  <span>{patient.allergies}</span>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <Label className="font-semibold">Médicaments et Posologies</Label>
                <div className="flex items-center gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => setDirectoryOpen(true)} className="gap-1.5 text-xs text-primary border-primary/30">
                    <BookOpen className="w-3.5 h-3.5" /> Dictionnaire (Registre 2025/2026)
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleAddMedication}
                    disabled={atMedicationLimit}
                    title={atMedicationLimit ? `Maximum ${MAX_MEDICATIONS} médicaments par ordonnance` : undefined}
                  >
                    <Plus className="w-4 h-4 mr-1" /> Ajouter une ligne
                    {atMedicationLimit && (
                      <span className="ml-1.5 text-xs text-muted-foreground">(Max {MAX_MEDICATIONS})</span>
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {medications.map((med, idx) => (
                  <QuickMedicationRow
                    key={idx}
                    med={med}
                    idx={idx}
                    totalCount={medications.length}
                    patient={patient}
                    onUpdate={handleMedicationChange}
                    onSelectMedication={handleSelectMedication}
                    onRemove={handleRemoveMedication}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Aperçu et Imprimé Officiel d'Ordonnance */
          <div className="p-8 bg-white text-gray-900 rounded-xl border-2 border-primary/20 shadow-lg space-y-6 print:border-none print:p-0 print:shadow-none min-h-[550px] flex flex-col justify-between font-sans">
            <div>
              {/* En-tête Officiel */}
              <div className="flex justify-between items-start border-b-2 border-blue-900/40 pb-4 mb-4">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold uppercase tracking-wide text-blue-950">{doctorName}</h2>
                  <p className="text-sm font-semibold text-gray-700">{doctorSpeciality}</p>
                  {doctorAgrement && (
                    <p className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-0.5 rounded inline-block">
                      N° Agrément / Ordre : {doctorAgrement}
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
                  {getSetting("cabinet_phone") && <p>Tél : {getSetting("cabinet_phone")}</p>}
                </div>
              </div>

              {/* Titre du document */}
              <div className="text-center my-6">
                <h1 className="text-2xl font-extrabold uppercase tracking-widest text-blue-950 border-b-2 border-blue-900 inline-block px-6 pb-1">
                  ORDONNANCE MEDICALE
                </h1>
              </div>

              {/* Encadré Patient */}
              <div className="bg-slate-50 border border-slate-300 rounded-lg p-3 flex justify-between items-center text-xs font-medium text-slate-800 mb-6">
                <div><strong>Patient :</strong> <span className="text-sm font-bold uppercase text-blue-950">{patientFullName}</span></div>
                {patient?.date_of_birth && (
                  <div><strong>Âge :</strong> {new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()} ans</div>
                )}
                <div><strong>Date :</strong> <span className="font-bold">{new Date(date).toLocaleDateString("fr-FR")}</span></div>
              </div>

              {/* Liste des Médicaments */}
              <div className="space-y-4 py-2">
                {medications.filter(m => m.name.trim()).map((m, i) => (
                  <div key={i} className="border-b border-gray-200 pb-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-base text-blue-950 uppercase tracking-tight">
                        {i + 1}. {m.name}
                      </span>
                      {m.dosage && (
                        <span className="text-xs font-mono font-bold bg-blue-100 text-blue-900 px-2.5 py-0.5 rounded-md border border-blue-200">
                          {m.dosage}
                        </span>
                      )}
                    </div>
                    {m.instructions && (
                      <p className="text-xs text-gray-800 font-medium pl-4 leading-relaxed">
                        • {m.instructions}
                      </p>
                    )}
                    {m.duration && (
                      <p className="text-[11px] text-gray-600 italic pl-4 font-semibold">
                        Durée du traitement : {m.duration}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Signature & Pied de page */}
            <div className="pt-6 border-t border-gray-300 mt-8">
              <div className="flex justify-end text-xs">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 w-56 text-center">
                  <p className="font-bold text-gray-900 uppercase text-[11px]">Signature et Cachet du Médecin</p>
                  <div className="h-16 flex items-center justify-center text-gray-300 italic text-[11px]">
                    [Emplacement Cachet Officiel]
                  </div>
                  <p className="font-bold text-blue-950 text-xs">{doctorName}</p>
                </div>
              </div>

              <div className="text-center mt-6 text-[11px] text-gray-500 font-medium">
                <p>Ne pas dépasser les doses prescrites • Conserver cette ordonnance pour le suivi médical</p>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex justify-between items-center pt-4 border-t">
          {!isPreview ? (
            <>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="secondary" onClick={() => setIsPreview(true)}>
                  Aperçu de l'ordonnance
                </Button>
                <Button type="button" onClick={handleSave} disabled={isSubmitting}>
                  <Save className="w-4 h-4 mr-1" /> Enregistrer et Valider
                </Button>
              </div>
            </>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={() => setIsPreview(false)}>
                Modifier
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="secondary" onClick={handlePrint}>
                  <Printer className="w-4 h-4 mr-1" /> Imprimer / PDF
                </Button>
                <Button type="button" onClick={handleSave} disabled={isSubmitting}>
                  <Save className="w-4 h-4 mr-1" /> Valider l'ordonnance
                </Button>
              </div>
            </>
          )}
        </DialogFooter>

        <MedicationDirectoryDialog
          open={directoryOpen}
          onOpenChange={setDirectoryOpen}
          onSelectMedication={(selectedMed) => {
            if (medications.length === 0) {
              setMedications([{ name: selectedMed.brand_name, dosage: selectedMed.dosage || "", instructions: selectedMed.form || "", duration: "" }]);
            } else {
              const lastIdx = medications.length - 1;
              handleSelectMedication(lastIdx, selectedMed);
            }
          }}
        />

        <PrescriptionModelSelectDialog
          open={modelDialogOpen}
          onOpenChange={setModelDialogOpen}
          userTemplates={templates as any}
          onSelectUserTemplate={(tpl) => handleSelectTemplate(tpl as any)}
        />
      </DialogContent>
    </Dialog>
  );
};
