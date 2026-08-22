import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import {
  Users,
  ArrowLeft,
  AlertCircle,
  Weight,
  Ruler,
  Activity,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { calculateAge, PatientFormData } from "../../utils/validation";
import { PatientUI } from "./patientMappers";

interface PatientFormProps {
  formData: PatientFormData;
  setFormData: (data: PatientFormData) => void;
  formErrors: string[];
  isSubmitting: boolean;
  editingPatient: PatientUI | null;
  canEditMedicalInfo: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  onPhoneChange: (value: string) => void;
}

export const PatientForm = ({
  formData,
  setFormData,
  formErrors,
  isSubmitting,
  editingPatient,
  canEditMedicalInfo,
  onSubmit,
  onCancel,
  onPhoneChange,
}: PatientFormProps) => {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border px-8 flex items-center" style={{ height: '64px' }}>
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
                {editingPatient ? 'Modifier le Dossier Patient' : 'Nouveau Patient'}
              </h2>
              <p className="text-xs text-muted-foreground">
                {editingPatient ? `Édition des données de ${editingPatient.firstName} ${editingPatient.lastName}` : 'Remplissez les informations médicales et administratives'}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="p-8 max-w-4xl mx-auto space-y-6">
        <Card className="shadow-card">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Informations Personnelles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-6">
              {formErrors.length > 0 && (
                <div className="bg-destructive/8 border border-destructive/20 rounded-md p-3 text-destructive text-xs space-y-1">
                  <div className="font-semibold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" /> Erreurs de saisie :
                  </div>
                  {formErrors.map((err, idx) => <p key={idx}>• {err}</p>)}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Civilité / Sexe *</Label>
                  <Select
                    value={formData.gender || 'M'}
                    onValueChange={(val: 'M' | 'F') => setFormData({ ...formData, gender: val })}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Masculin (M.)</SelectItem>
                      <SelectItem value="F">Féminin (Mme)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Prénom *</Label>
                  <Input
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="Ex: Karim"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nom *</Label>
                  <Input
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Ex: Amara"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date de Naissance *</Label>
                  <Input
                    type="date"
                    value={formData.date_of_birth || ''}
                    onChange={(e) => {
                      const dob = e.target.value;
                      const computedAge = dob ? calculateAge(dob).toString() : '';
                      setFormData({ ...formData, date_of_birth: dob, age: computedAge });
                    }}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Âge (calculé)</Label>
                  <div className="h-11 px-4 bg-muted rounded-md text-foreground text-sm font-semibold flex items-center">
                    {formData.date_of_birth ? `${calculateAge(formData.date_of_birth)} ans` : '–'}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Téléphone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => onPhoneChange(e.target.value)}
                    placeholder="0550 00 00 00"
                  />
                </div>

                <div className="sm:col-span-2 md:col-span-3 space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Adresse résidence</Label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Adresse complète"
                  />
                </div>
              </div>

              {canEditMedicalInfo && (
                <>
                  <Separator className="my-4" />
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Activity className="w-4 h-4 text-success" />
                      Données Médicales & Biométriques
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                          <Weight className="w-3.5 h-3.5 text-muted-foreground/60" /> Poids (kg)
                        </Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={formData.weight}
                          onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                          placeholder="Ex: 75.5"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                          <Ruler className="w-3.5 h-3.5 text-muted-foreground/60" /> Taille (cm)
                        </Label>
                        <Input
                          type="number"
                          value={formData.height}
                          onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                          placeholder="Ex: 178"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Maladies actuelles</Label>
                      <Textarea
                        value={formData.diseases}
                        onChange={(e) => setFormData({ ...formData, diseases: e.target.value })}
                        placeholder="Ex: Hypertension, Asthme, Diabète..."
                        className="min-h-[60px]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-500" /> Allergies connues (Détection automatique)
                      </Label>
                      <Textarea
                        value={formData.allergies || ''}
                        onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                        placeholder="Ex: Pénicilline, Aspirine, Amoxicilline, AINS, Paracétamol..."
                        className="min-h-[60px] border-red-200 dark:border-red-950 focus:border-red-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Antécédents médicaux / Chirurgicaux</Label>
                      <Textarea
                        value={formData.medical_history}
                        onChange={(e) => setFormData({ ...formData, medical_history: e.target.value })}
                        placeholder="Historique chirurgical, antécédents familiaux..."
                        className="min-h-[70px]"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-w-[140px]"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {editingPatient ? 'Mettre à jour' : 'Enregistrer'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
