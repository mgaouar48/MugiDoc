import { useEffect, useState } from "react";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { Plus, X, AlertTriangle } from "lucide-react";
import { TreatmentLine, Patient, MedicationRecord } from "../../../shared/types";
import { ConsultationSection } from "./ConsultationSection";
import { MedicationPicker } from "./MedicationPicker";
import { FREQUENCY_OPTIONS, DURATION_OPTIONS, calculateQuantity, formatTreatmentLine, suggestPosologyUnit } from "../../utils/treatment";
import { getAllergyWarning } from "../../utils/allergies";
import { useDciResolver } from "../../hooks/useDciResolver";
import { cn } from "../../lib/utils";

interface TreatmentSectionProps {
  value: TreatmentLine[];
  onChange: (value: TreatmentLine[]) => void;
  patient?: Patient | null;
  disabled?: boolean;
}

const emptyLine = (): TreatmentLine => ({ medication: '' });

interface TreatmentLineRowProps {
  line: TreatmentLine;
  onChange: (line: TreatmentLine) => void;
  onRemove: () => void;
  patientAllergies?: string;
  disabled?: boolean;
}

/**
 * Une ligne de traitement structurée — cf. PLAN_CONSULTATION.md L9.2. La
 * quantité se recalcule automatiquement (L9.5) tant que le médecin ne l'a
 * pas modifiée directement, même logique de "pré-remplissage tant que non
 * touché manuellement" que L5.5 (poids/taille).
 */
const TreatmentLineRow = ({ line, onChange, onRemove, patientAllergies, disabled }: TreatmentLineRowProps) => {
  const [quantityTouched, setQuantityTouched] = useState(!!line.quantity);
  // Résout la DCI quand le nom a été tapé à la main : sans elle, le contrôle
  // ne verrait qu'un nom commercial, qui ne dit rien de la famille.
  const effectiveDci = useDciResolver(line.medication, line.dci);
  const allergyWarning = getAllergyWarning(line.medication, patientAllergies, effectiveDci);

  const setField = (field: keyof TreatmentLine, v: string) => {
    // Saisir le nom à la main invalide la DCI reprise d'une sélection
    // précédente : la conserver ferait porter le contrôle d'allergie sur une
    // molécule qui n'est plus celle prescrite.
    const invalidatesDci = field === 'medication';
    onChange({ ...line, [field]: v || undefined, ...(invalidatesDci ? { dci: undefined } : {}) });
  };

  useEffect(() => {
    if (quantityTouched) return;
    const suggested = calculateQuantity(line);
    if (suggested) onChange({ ...line, quantity: suggested });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [line.posology, line.frequency, line.duration, line.form]);

  const handleSelectMedication = (item: MedicationRecord) => {
    const unit = suggestPosologyUnit(item.form);
    onChange({
      ...line,
      medication: item.brand_name,
      // Seul lien fiable vers la famille thérapeutique (contrôle d'allergie).
      dci: item.dci || undefined,
      dosage: item.dosage || line.dosage,
      form: unit || line.form,
      posology: line.posology || (unit ? `1 ${unit}` : line.posology),
    });
  };

  const preview = formatTreatmentLine(line);

  return (
    <div className="border border-border rounded-md p-3 space-y-2.5">
      <div className="flex items-start gap-2">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
          <MedicationPicker
            value={line.medication}
            onQueryChange={(v) => setField('medication', v)}
            onSelect={handleSelectMedication}
            disabled={disabled}
          />
          <Input
            value={line.dosage || ''}
            onChange={(e) => setField('dosage', e.target.value)}
            placeholder="Dosage (ex: 1g)"
            disabled={disabled}
            className="h-9 text-sm"
          />
        </div>
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          aria-label="Retirer ce médicament"
          className="p-1.5 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {allergyWarning && (
        <div
          className={cn(
            "flex items-start gap-1.5 text-xs rounded px-2 py-1.5 border",
            allergyWarning.severity === 'danger'
              ? "text-destructive bg-destructive/10 border-destructive/30"
              : "text-warning bg-warning/10 border-warning/30"
          )}
        >
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>
            {allergyWarning.severity === 'danger' ? (
              <><strong>Allergie déclarée</strong> — {allergyWarning.familyLabel}.</>
            ) : (
              <><strong>Réaction croisée possible</strong> — {allergyWarning.familyLabel} chez un patient allergique : {allergyWarning.allergyLabel}.</>
            )}
            {allergyWarning.note && <span className="block opacity-80">{allergyWarning.note}</span>}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <Input
          value={line.form || ''}
          onChange={(e) => setField('form', e.target.value)}
          placeholder="Forme (comprimé, sirop...)"
          disabled={disabled}
          className="h-9 text-sm"
        />
        <Input
          value={line.posology || ''}
          onChange={(e) => setField('posology', e.target.value)}
          placeholder="Posologie (ex: 1 comprimé)"
          disabled={disabled}
          className="h-9 text-sm"
        />
      </div>

      <div className="space-y-1">
        <Input
          value={line.frequency || ''}
          onChange={(e) => setField('frequency', e.target.value)}
          placeholder="Fréquence (ex: 3 fois/jour)"
          disabled={disabled}
          className="h-9 text-sm"
        />
        <div className="flex flex-wrap gap-1.5">
          {FREQUENCY_OPTIONS.map(opt => (
            <button
              key={opt.label}
              type="button"
              onClick={() => setField('frequency', opt.label)}
              disabled={disabled}
              className="text-xs px-2 py-0.5 rounded-full border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <Input
          value={line.duration || ''}
          onChange={(e) => setField('duration', e.target.value)}
          placeholder="Durée (ex: 7 jours)"
          disabled={disabled}
          className="h-9 text-sm"
        />
        <div className="flex flex-wrap gap-1.5">
          {DURATION_OPTIONS.map(opt => (
            <button
              key={opt.label}
              type="button"
              onClick={() => setField('duration', opt.label)}
              disabled={disabled}
              className="text-xs px-2 py-0.5 rounded-full border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <Input
        value={line.quantity || ''}
        onChange={(e) => { setQuantityTouched(true); setField('quantity', e.target.value); }}
        placeholder="Quantité à délivrer"
        disabled={disabled}
        className="h-9 text-sm"
      />

      <Textarea
        value={line.instructions || ''}
        onChange={(e) => setField('instructions', e.target.value)}
        placeholder="Instructions (ex: à prendre après les repas)"
        rows={2}
        disabled={disabled}
        className="text-sm"
      />

      {preview && (
        <p className="text-xs text-muted-foreground italic">{preview}</p>
      )}
    </div>
  );
};

/**
 * Traitement / prescription structurée — cf. PLAN_CONSULTATION.md L9. Une
 * ligne par médicament, recherche débattue sur le répertoire national
 * (`MedicationPicker`), quantité calculée automatiquement (L9.5), alerte
 * d'allergie non bloquante (L9.7). Recomposée côté service dans le champ
 * hérité `traitement` (décision n°2, `ConsultationService.composeTraitementText`).
 */
export const TreatmentSection = ({ value, onChange, patient, disabled }: TreatmentSectionProps) => {
  const lines = value || [];
  const isEmpty = lines.length === 0;
  const summary = lines.map(l => [l.medication, l.dosage].filter(Boolean).join(' ')).filter(Boolean).join(', ');

  const addLine = () => onChange([...lines, emptyLine()]);
  const updateLine = (index: number, line: TreatmentLine) => onChange(lines.map((l, i) => i === index ? line : l));
  const removeLine = (index: number) => onChange(lines.filter((_, i) => i !== index));

  return (
    <ConsultationSection title="Traitement" summary={summary || undefined} defaultOpen={!isEmpty}>
      <div className="space-y-3">
        {lines.map((line, index) => (
          <TreatmentLineRow
            key={index}
            line={line}
            onChange={(l) => updateLine(index, l)}
            onRemove={() => removeLine(index)}
            patientAllergies={patient?.allergies}
            disabled={disabled}
          />
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addLine} disabled={disabled}>
          <Plus className="w-4 h-4" />
          Ajouter un médicament
        </Button>
      </div>
    </ConsultationSection>
  );
};
