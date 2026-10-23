import { useEffect, useMemo } from "react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "../../lib/utils";
import { Patient, ConsultationVitals } from "../../../shared/types";
import { calculateAge } from "../../utils/validation";
import { calculateBmi, interpretBmi, evaluateVitals } from "../../utils/vitals";
import { usePatients } from "../../hooks/usePatients";
import { useToast } from "../../hooks/use-toast";
import { ConsultationSection } from "./ConsultationSection";
import { formatVitalsLines } from "../../utils/consultationSummary";

interface VitalSignsSectionProps {
  value: ConsultationVitals;
  onChange: (vitals: ConsultationVitals) => void;
  patient: Patient;
  onPatientUpdated: (patient: Patient) => void;
  disabled?: boolean;
}

interface VitalFieldProps {
  label: string;
  unit: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  flag?: string;
  step?: string;
  disabled?: boolean;
  readOnly?: boolean;
}

const VitalField = ({ label, unit, value, onChange, flag, step = "1", disabled, readOnly }: VitalFieldProps) => (
  <div className="space-y-1">
    <Label className="text-xs font-normal text-muted-foreground">{label}</Label>
    <div className="relative">
      <Input
        type="number"
        step={step}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
        onWheel={(e) => (e.target as HTMLInputElement).blur()}
        disabled={disabled}
        readOnly={readOnly}
        className={cn(
          "h-9 pr-10 text-sm",
          flag && "border-destructive/60 focus-visible:border-destructive focus-visible:ring-destructive/20",
          readOnly && "bg-muted"
        )}
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
        {unit}
      </span>
    </div>
    {flag && (
      <div className="flex items-center gap-1 text-[11px] text-destructive">
        <AlertTriangle className="w-3 h-3 flex-shrink-0" />
        {flag}
      </div>
    )}
  </div>
);

/**
 * Constantes vitales de la consultation en cours — cf. PLAN_CONSULTATION.md L5.
 * Toujours optionnel, jamais bloquant : `evaluateVitals` ne fait que signaler
 * une valeur hors norme, elle n'empêche jamais l'enregistrement.
 */
export const VitalSignsSection = ({ value, onChange, patient, onPatientUpdated, disabled }: VitalSignsSectionProps) => {
  const { updatePatient } = usePatients();
  const { toast } = useToast();
  const age = calculateAge(patient.date_of_birth);

  useEffect(() => {
    const patch: Partial<ConsultationVitals> = {};
    if (value.weight === undefined && patient.weight !== undefined) patch.weight = patient.weight;
    if (value.height === undefined && patient.height !== undefined) patch.height = patient.height;
    if (Object.keys(patch).length === 0) return;

    const weight = patch.weight ?? value.weight;
    const height = patch.height ?? value.height;
    onChange({ ...value, ...patch, bmi: calculateBmi(weight, height) });
    // Pré-remplissage une seule fois à la sélection du patient — ne doit pas
    // se redéclencher si le médecin efface volontairement la valeur ensuite.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient.id]);

  const setField = (field: keyof ConsultationVitals, num: number | undefined) => {
    const next: ConsultationVitals = { ...value, [field]: num };
    if (field === 'weight' || field === 'height') {
      next.bmi = calculateBmi(next.weight, next.height);
    }
    onChange(next);
  };

  const flags = useMemo(() => evaluateVitals(value, age), [value, age]);
  const flagFor = (field: keyof ConsultationVitals) => flags.find(f => f.field === field)?.label;
  const bmiInfo = value.bmi !== undefined ? interpretBmi(value.bmi, age) : undefined;

  const weightChanged = value.weight !== undefined && value.weight !== patient.weight;
  const heightChanged = value.height !== undefined && value.height !== patient.height;

  const vitalsLines = formatVitalsLines(value);
  const isEmpty = vitalsLines.length === 0;
  const summary = vitalsLines.join(', ');

  const syncPatientRecord = async () => {
    try {
      const updated = await updatePatient(patient.id, {
        weight: value.weight ?? patient.weight,
        height: value.height ?? patient.height,
      });
      onPatientUpdated(updated);
      toast({ title: "Dossier patient mis à jour", description: "Poids/taille synchronisés avec la fiche patient." });
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de mettre à jour la fiche patient",
        variant: "destructive",
      });
    }
  };

  return (
    <ConsultationSection title="Constantes" summary={summary || undefined} defaultOpen={!isEmpty}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <VitalField label="Poids" unit="kg" step="0.1" value={value.weight} onChange={(v) => setField('weight', v)} flag={flagFor('weight')} disabled={disabled} />
        <VitalField label="Taille" unit="cm" value={value.height} onChange={(v) => setField('height', v)} flag={flagFor('height')} disabled={disabled} />
        <VitalField label="IMC" unit="kg/m²" value={value.bmi} onChange={() => {}} disabled={disabled} readOnly />
        <VitalField label="Température" unit="°C" step="0.1" value={value.temperature} onChange={(v) => setField('temperature', v)} flag={flagFor('temperature')} disabled={disabled} />
        <VitalField label="TA systolique" unit="mmHg" value={value.blood_pressure_systolic} onChange={(v) => setField('blood_pressure_systolic', v)} flag={flagFor('blood_pressure_systolic')} disabled={disabled} />
        <VitalField label="TA diastolique" unit="mmHg" value={value.blood_pressure_diastolic} onChange={(v) => setField('blood_pressure_diastolic', v)} flag={flagFor('blood_pressure_diastolic')} disabled={disabled} />
        <VitalField label="Fréquence cardiaque" unit="bpm" value={value.heart_rate} onChange={(v) => setField('heart_rate', v)} flag={flagFor('heart_rate')} disabled={disabled} />
        <VitalField label="SpO₂" unit="%" value={value.spo2} onChange={(v) => setField('spo2', v)} flag={flagFor('spo2')} disabled={disabled} />
        <VitalField label="Fréquence respiratoire" unit="/min" value={value.respiratory_rate} onChange={(v) => setField('respiratory_rate', v)} flag={flagFor('respiratory_rate')} disabled={disabled} />
        <VitalField label="Glycémie" unit="g/L" step="0.01" value={value.glycemia} onChange={(v) => setField('glycemia', v)} flag={flagFor('glycemia')} disabled={disabled} />
      </div>

      {bmiInfo && bmiInfo.severity !== 'normal' && (
        <div className="text-xs text-warning">IMC {value.bmi} — {bmiInfo.label}</div>
      )}

      {(weightChanged || heightChanged) && (
        <Button type="button" variant="ghost" size="sm" onClick={syncPatientRecord} className="text-xs text-primary h-7 px-2">
          <RefreshCw className="w-3 h-3" />
          Mettre à jour le dossier patient (poids/taille)
        </Button>
      )}
    </ConsultationSection>
  );
};
