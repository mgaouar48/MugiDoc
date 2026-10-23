import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Info } from "lucide-react";
import { useSettings } from "../../hooks/useSettings";
import { ConsultationFormData } from "./consultationMappers";

interface CareModeSectionProps {
  formData: ConsultationFormData;
  onChange: (patch: Partial<ConsultationFormData>) => void;
  disabled?: boolean;
}

const CHIFA_STEPS = [
  "Ouvrir le logiciel CHIFA.",
  "Effectuer la prise en charge du patient.",
  "Effectuer la procédure demandée par CHIFA.",
  "Revenir dans MugiDoc.",
  "Mettre à jour le statut de la consultation depuis Facturation → Suivi CHIFA.",
];

/**
 * Mode de prise en charge — visible uniquement si le module CHIFA/CNAS est
 * activé (`chifa_enabled`). Décision administrative, pas clinique : affichée
 * au même niveau que patient/date/heure, jamais repliée par défaut comme les
 * blocs du récit médical (cf. PLAN_CONSULTATION.md L16.3, verrouillé pour le
 * récit clinique uniquement).
 *
 * Aucune intégration technique avec CHIFA/CNAS : ces champs n'enregistrent
 * que le choix du médecin. Le traitement réel reste dans le logiciel CHIFA.
 */
export const CareModeSection = ({ formData, onChange, disabled }: CareModeSectionProps) => {
  const { getSetting } = useSettings();
  const isChifa = formData.care_mode === 'chifa';

  const handleSelectChifa = () => {
    // Ne préremplit que si rien n'a encore été saisi (nouvelle consultation,
    // ou consultation privée jamais passée en CHIFA) — ne jamais écraser des
    // montants déjà enregistrés sur une consultation existante.
    const patch: Partial<ConsultationFormData> = { care_mode: 'chifa', chifa_organisme: formData.chifa_organisme || 'CNAS' };
    if (formData.chifa_tarif_conventionnel === undefined) {
      const defaultTarif = parseFloat(getSetting('chifa_tarif_conventionnel', ''));
      if (!isNaN(defaultTarif)) patch.chifa_tarif_conventionnel = defaultTarif;
    }
    if (formData.chifa_part_patient === undefined) {
      const defaultPart = parseFloat(getSetting('chifa_part_patient_default', ''));
      if (!isNaN(defaultPart)) patch.chifa_part_patient = defaultPart;
    }
    const tarif = patch.chifa_tarif_conventionnel ?? formData.chifa_tarif_conventionnel;
    const partPatient = patch.chifa_part_patient ?? formData.chifa_part_patient;
    if (tarif !== undefined && partPatient !== undefined) {
      patch.chifa_part_assurance = Math.max(0, tarif - partPatient);
    }
    onChange(patch);
  };

  const updateAmount = (field: 'chifa_tarif_conventionnel' | 'chifa_part_patient', value: string) => {
    const parsed = value === '' ? undefined : parseFloat(value);
    const tarif = field === 'chifa_tarif_conventionnel' ? parsed : formData.chifa_tarif_conventionnel;
    const partPatient = field === 'chifa_part_patient' ? parsed : formData.chifa_part_patient;
    // Part assurance = reste du tarif conventionnel une fois la part patient
    // retirée — une simple soustraction, jamais une règle CNAS codée en dur.
    const partAssurance = tarif !== undefined && partPatient !== undefined
      ? Math.max(0, tarif - partPatient)
      : undefined;
    onChange({ [field]: parsed, chifa_part_assurance: partAssurance });
  };

  return (
    <div className="space-y-3">
      <Label>Mode de prise en charge</Label>
      <div className="flex flex-col sm:flex-row gap-3">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="radio"
            name="care_mode"
            checked={!isChifa}
            onChange={() => onChange({ care_mode: 'private' })}
            disabled={disabled}
          />
          Consultation privée
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="radio"
            name="care_mode"
            checked={isChifa}
            onChange={handleSelectChifa}
            disabled={disabled}
          />
          Prise en charge CHIFA / CNAS
        </label>
      </div>

      {isChifa && (
        <div className="rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/20 p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
            Prise en charge CHIFA
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div><span className="text-muted-foreground">Organisme : </span><span className="font-medium">{formData.chifa_organisme || 'CNAS'}</span></div>
            <div><span className="text-muted-foreground">Type : </span><span className="font-medium">Médecin conventionné</span></div>
            <div className="sm:col-span-2"><span className="text-muted-foreground">Acte : </span><span className="font-medium">Consultation médicale</span></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1.5">
              <Label className="text-xs">Tarif conventionnel (DA)</Label>
              <Input
                type="number"
                min="0"
                value={formData.chifa_tarif_conventionnel ?? ''}
                onChange={(e) => updateAmount('chifa_tarif_conventionnel', e.target.value)}
                disabled={disabled}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Part patient (DA)</Label>
              <Input
                type="number"
                min="0"
                value={formData.chifa_part_patient ?? ''}
                onChange={(e) => updateAmount('chifa_part_patient', e.target.value)}
                disabled={disabled}
              />
            </div>
            {formData.chifa_part_assurance !== undefined && (
              <div className="sm:col-span-2 text-xs text-muted-foreground">
                Part assurance estimée : <span className="font-medium text-foreground">{formData.chifa_part_assurance} DA</span>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Notes CHIFA <span className="font-normal text-muted-foreground">(optionnel)</span></Label>
            <Textarea
              rows={2}
              value={formData.chifa_notes || ''}
              onChange={(e) => onChange({ chifa_notes: e.target.value })}
              disabled={disabled}
              className="text-sm"
            />
          </div>

          <p className="text-xs text-muted-foreground flex items-start gap-1.5 pt-1 border-t border-emerald-200/60 dark:border-emerald-900/60">
            <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            Le traitement de la prise en charge sera effectué dans le logiciel CHIFA.
          </p>
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer select-none hover:text-foreground">Procédure à suivre</summary>
            <ol className="list-decimal list-inside mt-1.5 space-y-0.5">
              {CHIFA_STEPS.map(step => <li key={step}>{step}</li>)}
            </ol>
          </details>
        </div>
      )}
    </div>
  );
};
