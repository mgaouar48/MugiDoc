import { useState, useEffect } from "react";
import { MAX_MEDICATIONS } from "../../constants/prescriptions";
import { SaveTemplateDialog } from "./SaveTemplateDialog";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { ArrowLeft, Save, Eye, FileText, User, Calendar, Search, X, BookmarkPlus, Zap } from "lucide-react";
import { PatientCombobox } from "../ui/patient-combobox";
import { MedicationForm } from "./MedicationForm";
import { PatientHealthAlert } from "../patients/PatientHealthAlert";
import { usePrescriptions } from "../../hooks/usePrescriptions";
import { usePatients } from "../../hooks/usePatients";
import { useToast } from "../../hooks/use-toast";
import { useSettings } from "../../hooks/useSettings";
import { PrescriptionModelSelectDialog } from "../consultations/PrescriptionModelSelectDialog";
import {
  Prescription,
  PrescriptionTemplate,
  Patient,
  Medication,
  CreatePrescriptionRequest,
  UpdatePrescriptionRequest
} from "../../../shared/types";

interface PrescriptionFormProps {
  prescription?: Prescription | null;
  template?: PrescriptionTemplate | null;
  preSelectedPatient?: Patient | null;
  onBack: () => void;
  onSave?: (prescription: Prescription) => void;
  onPreview?: (prescription: Prescription) => void;
}

interface FormData {
  patient_id: number | null;
  consultation_id: number | null;
  template_id: number | null;
  medications: Medication[];
  date: string;
}


export const PrescriptionForm = ({
  prescription,
  template,
  preSelectedPatient,
  onBack,
  onSave,
  onPreview
}: PrescriptionFormProps) => {
  const [formData, setFormData] = useState<FormData>({
    patient_id: preSelectedPatient?.id || prescription?.patient_id || null,
    consultation_id: prescription?.consultation_id || null,
    template_id: template?.id || prescription?.template_id || null,
    medications: template?.medications || prescription?.medications || [{
      name: '',
      dosage: '',
      instructions: '',
      duration: ''
    }],
    date: prescription?.date || new Date().toISOString().split('T')[0]
  });

  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(preSelectedPatient || null);
  const [modelDialogOpen, setModelDialogOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  const {
    templates,
    createPrescription,
    updatePrescription,
    createTemplate,
    loadTemplates
  } = usePrescriptions();

  const validTemplateMeds = formData.medications.filter(m => m.name.trim().length > 0);

  /** Ouvre le nommage du modèle après contrôle du contenu. */
  const handleSaveAsTemplate = () => {
    if (validTemplateMeds.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir au moins un médicament valide pour créer un modèle",
        variant: "destructive",
      });
      return;
    }
    setTemplateDialogOpen(true);
  };

  const handleConfirmSaveTemplate = async (name: string, description: string) => {
    setIsSavingTemplate(true);
    try {
      await createTemplate({
        name,
        description: description || "Créé depuis le formulaire d'ordonnance",
        medications: validTemplateMeds
      });
      setTemplateDialogOpen(false);
      toast({
        title: "Modèle enregistré",
        description: `« ${name} » est disponible dans vos modèles d'ordonnance.`,
      });
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message || "Impossible de sauvegarder le modèle",
        variant: "destructive",
      });
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const { patients, loadPatients } = usePatients();
  const { toast } = useToast();
  const { getSetting } = useSettings();

  // Charger les données nécessaires
  useEffect(() => {
    loadTemplates();
    loadPatients(); // Toujours charger les patients pour avoir les données complètes
  }, [loadTemplates, loadPatients]);

  // Mettre à jour le patient_id et selectedPatient quand preSelectedPatient change
  useEffect(() => {
    if (preSelectedPatient) {
      setSelectedPatient(preSelectedPatient);
      setFormData(prev => ({
        ...prev,
        patient_id: preSelectedPatient.id
      }));
    }
  }, [preSelectedPatient]);

  // Mettre à jour selectedPatient quand prescription change (pour l'édition)
  useEffect(() => {
    if (prescription && prescription.patient && patients.length > 0) {
      const patient = patients.find(p => p.id === prescription.patient_id);
      if (patient) {
        setSelectedPatient(patient);
      }
    }
  }, [prescription, patients]);

  // Sélection d'un patient
  const handlePatientSelect = async (patient: Patient | null) => {
    setSelectedPatient(patient);
    setFormData(prev => ({
      ...prev,
      patient_id: patient?.id || null
    }));
  };

  // Validation du formulaire
  const validateForm = (): string[] => {
    const errors: string[] = [];

    if (!formData.patient_id) {
      errors.push('Veuillez sélectionner un patient');
    }

    if (!formData.date) {
      errors.push('La date de l\'ordonnance est obligatoire');
    }

    if (formData.medications.length === 0) {
      errors.push('Au moins un médicament est requis');
    }

    if (formData.medications.length > MAX_MEDICATIONS) {
      errors.push(`Maximum ${MAX_MEDICATIONS} médicaments autorisés par ordonnance`);
    }

    // Validation des médicaments - seul le nom est obligatoire
    formData.medications.forEach((medication, index) => {
      if (!medication.name.trim()) {
        errors.push(`Médicament ${index + 1}: Le nom est obligatoire`);
      }
    });

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validateForm();
    if (errors.length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setFormErrors([]);

    try {
      if (prescription) {
        // Mise à jour
        const updateData: UpdatePrescriptionRequest = {
          patient_id: formData.patient_id!,
          consultation_id: formData.consultation_id,
          template_id: formData.template_id,
          medications: formData.medications,
          date: formData.date
        };

        const updatedPrescription = await updatePrescription(prescription.id, updateData);
        if (updatedPrescription) {
          toast({
            title: "Succès",
            description: "Ordonnance mise à jour avec succès",
          });
          onSave?.(updatedPrescription);
        }
      } else {
        // Création
        const createData: CreatePrescriptionRequest = {
          patient_id: formData.patient_id!,
          consultation_id: formData.consultation_id,
          template_id: formData.template_id,
          medications: formData.medications,
          date: formData.date
        };

        const newPrescription = await createPrescription(createData);
        if (newPrescription) {
          toast({
            title: "Succès",
            description: "Ordonnance créée avec succès",
          });
          onSave?.(newPrescription);
        }
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de sauvegarder l'ordonnance",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTemplateChange = (templateId: string) => {
    if (templateId === 'none') {
      setFormData(prev => ({
        ...prev,
        template_id: null,
        medications: [{
          name: '',
          dosage: '',
          instructions: '',
          duration: ''
        }]
      }));
      return;
    }

    const selectedTemplate = templates.find(t => t.id.toString() === templateId);
    if (selectedTemplate) {
      setFormData(prev => ({
        ...prev,
        template_id: selectedTemplate.id,
        medications: [...selectedTemplate.medications]
      }));
    }
  };

  const handlePreview = () => {
    const errors = validateForm();
    if (errors.length > 0) {
      setFormErrors(errors);
      toast({
        title: "Erreur",
        description: "Veuillez corriger les erreurs avant l'aperçu",
        variant: "destructive",
      });
      return;
    }

    // Créer un objet prescription temporaire pour l'aperçu
    const tempPrescription: Prescription = {
      id: prescription?.id || 0,
      patient_id: formData.patient_id!,
      consultation_id: formData.consultation_id,
      template_id: formData.template_id,
      medications: formData.medications,
      date: formData.date,
      created_at: prescription?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      patient: patients.find(p => p.id === formData.patient_id),
      template: templates.find(t => t.id === formData.template_id)
    };

    onPreview?.(tempPrescription);
  };


  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {prescription ? 'Modifier l\'ordonnance' : 'Nouvelle ordonnance'}
              </h1>
              <p className="text-muted-foreground">
                {prescription ? 'Modifiez les informations de l\'ordonnance' : 'Créez une nouvelle ordonnance médicale'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleSaveAsTemplate} disabled={isSubmitting}>
              <BookmarkPlus className="w-4 h-4 mr-2" />
              Sauvegarder comme modèle
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Alerte Santé Patient */}
        {selectedPatient && (
          <PatientHealthAlert patient={selectedPatient} />
        )}

        {/* Erreurs de validation */}
        {formErrors.length > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <h4 className="text-sm font-medium text-red-800 mb-2">Erreurs de validation :</h4>
              <ul className="text-sm text-red-700 list-disc list-inside">
                {formErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Informations générales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Informations générales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Sélection du patient */}
              <div className="space-y-2">
                <Label>Patient *</Label>
                <PatientCombobox
                  patients={patients}
                  selectedPatient={selectedPatient}
                  onPatientSelect={handlePatientSelect}
                  onOpen={loadPatients}
                  placeholder="Sélectionner un patient..."
                  emptyMessage="Aucun patient trouvé."
                  disabled={isSubmitting}
                />
              </div>

              {/* Date de l'ordonnance */}
              <div className="space-y-2">
                <Label htmlFor="date">
                  Date de l'ordonnance <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
            </div>

            {/* Modèles d'ordonnances avec Recherche */}
            <div className="p-3 bg-card border border-border rounded-lg flex items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-md bg-primary/10 text-primary">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">Modèles d'ordonnance</h4>
                  <p className="text-[11px] text-muted-foreground">Rechercher et appliquer un modèle préenregistré en 1 clic</p>
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

          </CardContent>
        </Card>

        {/* Médicaments */}
        <Card>
          <CardContent className="pt-6">
            <MedicationForm
              medications={formData.medications}
              onChange={(medications) => setFormData(prev => ({ ...prev, medications }))}
              errors={formErrors.filter(error => error.includes('Médicament'))}
              selectedPatient={selectedPatient}
            />
          </CardContent>
        </Card>

        {/* Aperçu du patient sélectionné */}
        {selectedPatient && (
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-base text-blue-800">
                Informations du patient
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Nom complet:</span>
                  <div>{selectedPatient.first_name} {selectedPatient.last_name}</div>
                </div>
                <div>
                  <span className="font-medium">Âge:</span>
                  <div>
                    {selectedPatient.date_of_birth
                      ? new Date().getFullYear() - new Date(selectedPatient.date_of_birth).getFullYear() + ' ans'
                      : 'Non renseigné'
                    }
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>
        )}
      </form>

      <SaveTemplateDialog
        open={templateDialogOpen}
        onOpenChange={setTemplateDialogOpen}
        medications={validTemplateMeds}
        isSaving={isSavingTemplate}
        onConfirm={handleConfirmSaveTemplate}
      />

      <PrescriptionModelSelectDialog
        open={modelDialogOpen}
        onOpenChange={setModelDialogOpen}
        userTemplates={templates}
        onSelectUserTemplate={(tpl) => handleTemplateChange(tpl.id.toString())}
      />
    </div>
  );
};
