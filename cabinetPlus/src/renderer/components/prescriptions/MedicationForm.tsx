import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Trash2, Plus, GripVertical, Pill, Sparkles } from "lucide-react";
import { Medication, Patient } from "../../../shared/types";
import { COMMON_MEDICATIONS } from "../../constants/medications";
import { MAX_MEDICATIONS } from "../../constants/prescriptions";

interface MedicationFormProps {
  medications: Medication[];
  onChange: (medications: Medication[]) => void;
  errors?: string[];
  selectedPatient?: Patient | null;
}

interface MedicationItemProps {
  medication: Medication;
  index: number;
  onUpdate: (index: number, medication: Medication) => void;
  onRemove: (index: number) => void;
  error?: string;
  selectedPatient?: Patient | null;
}

const MedicationItem = ({ medication, index, onUpdate, onRemove, error, selectedPatient }: MedicationItemProps) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [dbSuggestions, setDbSuggestions] = useState<any[]>([]);

  const handleChange = (field: keyof Medication, value: string) => {
    onUpdate(index, { ...medication, [field]: value });
  };

  useEffect(() => {
    let isMounted = true;
    const fetchMeds = async () => {
      try {
        let dbResults: any[] = [];
        if ((window as any).electronAPI?.medications) {
          dbResults = (await (window as any).electronAPI.medications.search(medication.name || '', 100)) || [];
        }

        const query = (medication.name || '').toLowerCase().trim();
        const commonMatches = COMMON_MEDICATIONS.filter(m =>
          !query || m.name.toLowerCase().includes(query) || (m.category && m.category.toLowerCase().includes(query))
        ).map((m, idx) => ({
          id: `common-${idx}`,
          brand_name: m.name,
          form: m.instructions,
          dosage: m.dosage,
          dci: m.category || 'Présélection'
        }));

        // Combiner DB et COMMON_MEDICATIONS sans doublons
        const combined = [...dbResults];
        const existingNames = new Set(combined.map(r => (r.brand_name || '').toLowerCase()));

        for (const common of commonMatches) {
          if (!existingNames.has(common.brand_name.toLowerCase())) {
            combined.push(common);
            existingNames.add(common.brand_name.toLowerCase());
          }
        }

        if (isMounted) {
          setDbSuggestions(combined);
        }
      } catch (err) {
        console.error('Erreur recherche médicaments:', err);
      }
    };

    fetchMeds();
    return () => { isMounted = false; };
  }, [medication.name]);

  const handleSelectMedication = (item: any) => {
    const defaultInstructions = item.form ? `${item.form}` : '';
    const formattedDosage = item.dosage ? item.dosage : '1 fois par jour';

    onUpdate(index, {
      ...medication,
      name: item.brand_name,
      dosage: formattedDosage,
      instructions: medication.instructions ? medication.instructions : defaultInstructions
    });

    if (item.id && (window as any).electronAPI?.medications) {
      (window as any).electronAPI.medications.incrementPopularity(item.id);
    }
    setShowSuggestions(false);
  };

  return (
    <Card className={`mb-4 ${error ? 'border-red-500' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
            Médicament {index + 1}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRemove(index)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor={`medication-name-${index}`}>
              Nom du médicament <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id={`medication-name-${index}`}
                placeholder="Tapez un nom (Doliprane, Xydol, Amoxicilline...)"
                value={medication.name}
                onChange={(e) => {
                  handleChange('name', e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 250)}
                className={error && !medication.name.trim() ? 'border-red-500' : ''}
              />
              {showSuggestions && dbSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto p-1.5 backdrop-blur-md">
                  <div className="px-2 py-1 text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between border-b border-border/40 mb-1">
                    <span>Répertoire National (2025)</span>
                    <Sparkles className="w-3 h-3 text-amber-500" />
                  </div>
                  {dbSuggestions.map((item, i) => (
                    <button
                      key={item.id || i}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectMedication(item);
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
          </div>

          <div className="space-y-2">
            <Label htmlFor={`medication-dosage-${index}`}>
              Posologie
            </Label>
            <Input
              id={`medication-dosage-${index}`}
              placeholder="Ex: 1 comp 1 fois par jour"
              value={medication.dosage}
              onChange={(e) => handleChange('dosage', e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`medication-instructions-${index}`}>
            Instructions
          </Label>
          <Textarea
            id={`medication-instructions-${index}`}
            placeholder="Ex: Avant ou après les repas de 30 minutes."
            value={medication.instructions}
            onChange={(e) => handleChange('instructions', e.target.value)}
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`medication-duration-${index}`}>
            Durée (QSP)
          </Label>
          <Input
            id={`medication-duration-${index}`}
            placeholder="Ex: 5 jours"
            value={medication.duration}
            onChange={(e) => handleChange('duration', e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export const MedicationForm = ({ medications, onChange, errors = [], selectedPatient }: MedicationFormProps) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);


  const addMedication = () => {
    if (medications.length >= MAX_MEDICATIONS) {
      return; // Ne pas ajouter si on a déjà atteint la limite
    }

    const newMedication: Medication = {
      name: '',
      dosage: '',
      instructions: '',
      duration: ''
    };
    onChange([...medications, newMedication]);
  };

  const updateMedication = (index: number, medication: Medication) => {
    const updatedMedications = [...medications];
    updatedMedications[index] = medication;
    onChange(updatedMedications);
  };

  const removeMedication = (index: number) => {
    if (medications.length <= 1) {
      // Toujours garder au moins un médicament
      return;
    }

    const updatedMedications = medications.filter((_, i) => i !== index);
    onChange(updatedMedications);
  };

  const moveMedication = (fromIndex: number, toIndex: number) => {
    const updatedMedications = [...medications];
    const [movedItem] = updatedMedications.splice(fromIndex, 1);
    updatedMedications.splice(toIndex, 0, movedItem);
    onChange(updatedMedications);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      moveMedication(draggedIndex, index);
      setDraggedIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Validation des médicaments - seul le nom est obligatoire
  const validateMedication = (medication: Medication, index: number): string | undefined => {
    const medicationErrors: string[] = [];

    if (!medication.name.trim()) {
      medicationErrors.push('Le nom du médicament est obligatoire');
    }

    return medicationErrors.length > 0 ? medicationErrors.join(', ') : undefined;
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-lg font-semibold">Médicaments prescrits</h3>
          <p className="text-sm text-muted-foreground">
            Ajoutez les médicaments à prescrire avec leurs posologies (maximum {MAX_MEDICATIONS} médicaments)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={addMedication}
            variant="outline"
            disabled={medications.length >= MAX_MEDICATIONS}
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un médicament
            {medications.length >= MAX_MEDICATIONS && (
              <span className="ml-2 text-xs text-muted-foreground">
                (Max {MAX_MEDICATIONS})
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Erreurs générales */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h4 className="text-sm font-medium text-red-800 mb-2">Erreurs de validation :</h4>
          <ul className="text-sm text-red-700 list-disc list-inside">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Liste des médicaments */}
      <div className="space-y-4">
        {medications.map((medication, index) => (
          <div
            key={index}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`transition-opacity ${draggedIndex === index ? 'opacity-50' : ''}`}
          >
            <MedicationItem
              medication={medication}
              index={index}
              onUpdate={updateMedication}
              onRemove={removeMedication}
              error={validateMedication(medication, index)}
              selectedPatient={selectedPatient}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
