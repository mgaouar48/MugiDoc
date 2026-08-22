import { useState, useEffect } from "react";
import { MAX_MEDICATIONS } from "../../constants/prescriptions";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { ArrowLeft, Save } from "lucide-react";
import { MedicationForm } from "./MedicationForm";
import { usePrescriptions } from "../../hooks/usePrescriptions";
import { useToast } from "../../hooks/use-toast";
import { 
  PrescriptionTemplate, 
  Medication, 
  CreatePrescriptionTemplateRequest, 
  UpdatePrescriptionTemplateRequest 
} from "../../../shared/types";

interface PrescriptionTemplateFormProps {
  template?: PrescriptionTemplate | null;
  onBack: () => void;
  onSave?: (template: PrescriptionTemplate) => void;
}

interface FormData {
  name: string;
  description: string;
  medications: Medication[];
}

export const PrescriptionTemplateForm = ({ 
  template, 
  onBack, 
  onSave 
}: PrescriptionTemplateFormProps) => {
  const [formData, setFormData] = useState<FormData>({
    name: template?.name || '',
    description: template?.description || '',
    medications: template?.medications || [{
      name: '',
      dosage: '',
      instructions: '',
      duration: ''
    }]
  });

  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    createTemplate,
    updateTemplate
  } = usePrescriptions();

  const { toast } = useToast();

  // Validation du formulaire
  const validateForm = (): string[] => {
    const errors: string[] = [];

    if (!formData.name.trim()) {
      errors.push('Le nom du modèle est obligatoire');
    }

    if (formData.medications.length === 0) {
      errors.push('Au moins un médicament est requis');
    }

    if (formData.medications.length > MAX_MEDICATIONS) {
      errors.push(`Maximum ${MAX_MEDICATIONS} médicaments autorisés par modèle`);
    }

    // Validation des médicaments
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
      if (template) {
        // Mise à jour
        const updateData: UpdatePrescriptionTemplateRequest = {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          medications: formData.medications
        };
        
        const updatedTemplate = await updateTemplate(template.id, updateData);
        if (updatedTemplate) {
          toast({
            title: "Succès",
            description: "Modèle mis à jour avec succès",
          });
          onSave?.(updatedTemplate);
        }
      } else {
        // Création
        const createData: CreatePrescriptionTemplateRequest = {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          medications: formData.medications
        };
        
        const newTemplate = await createTemplate(createData);
        if (newTemplate) {
          toast({
            title: "Succès",
            description: "Modèle créé avec succès",
          });
          onSave?.(newTemplate);
        }
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de sauvegarder le modèle",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
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
                {template ? 'Modifier le modèle' : 'Nouveau modèle d\'ordonnance'}
              </h1>
              <p className="text-muted-foreground">
                {template ? 'Modifiez les informations du modèle' : 'Créez un nouveau modèle d\'ordonnance réutilisable'}
              </p>
            </div>
          </div>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            <Save className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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
            <CardTitle>Informations du modèle</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Nom du modèle <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Ex: Traitement grippe, Antibiotique standard..."
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className={formErrors.some(error => error.includes('nom du modèle')) ? 'border-red-500' : ''}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optionnelle)</Label>
              <Textarea
                id="description"
                placeholder="Description du modèle, indications d'usage..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
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
            />
          </CardContent>
        </Card>

        
      </form>
    </div>
  );
};
