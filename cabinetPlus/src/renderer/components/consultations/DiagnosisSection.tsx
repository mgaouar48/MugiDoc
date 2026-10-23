import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Plus, X } from "lucide-react";
import { ConsultationDiagnostics, ConsultationDiagnosisEntry } from "../../../shared/types";
import { Icd10Picker } from "./Icd10Picker";
import { ConsultationSection } from "./ConsultationSection";
import { composeDiagnosticPreview } from "../../utils/consultationText";

interface DiagnosisSectionProps {
  value: ConsultationDiagnostics;
  onChange: (value: ConsultationDiagnostics) => void;
  disabled?: boolean;
}

/** Une ligne de diagnostic : libellé libre + code CIM-10 optionnel. */
const DiagnosisRow = ({
  entry,
  placeholder,
  onChange,
  onRemove,
  disabled,
}: {
  entry: ConsultationDiagnosisEntry;
  placeholder: string;
  onChange: (entry: ConsultationDiagnosisEntry) => void;
  onRemove?: () => void;
  disabled?: boolean;
}) => (
  <div className="flex items-center gap-2">
    <Input
      value={entry.label}
      onChange={(e) => onChange({ ...entry, label: e.target.value })}
      placeholder={placeholder}
      disabled={disabled}
      className="flex-1 h-9 text-sm"
    />
    <Icd10Picker
      value={entry.icd10_code}
      onChange={(icd10_code) => onChange({ ...entry, icd10_code })}
      initialQuery={entry.label}
      disabled={disabled}
    />
    {onRemove && (
      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        aria-label="Retirer ce diagnostic"
        className="p-1 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    )}
  </div>
);

/**
 * Diagnostic principal + diagnostics secondaires, avec code CIM-10 optionnel
 * par ligne — cf. PLAN_CONSULTATION.md L8. Le champ hérité `diagnostic`
 * (texte) est recomposé côté service à l'enregistrement (L8.6/décision n°2),
 * donc les écrans existants (liste, impression, statistiques) continuent de
 * fonctionner sans modification.
 */
export const DiagnosisSection = ({ value, onChange, disabled }: DiagnosisSectionProps) => {
  const primary = value.primary || { label: '' };
  const secondary = value.secondary || [];
  const isEmpty = !primary.label?.trim() && secondary.every(s => !s.label?.trim());
  const summary = composeDiagnosticPreview(value);

  const setPrimary = (entry: ConsultationDiagnosisEntry) => {
    onChange({ ...value, primary: entry, secondary });
  };

  const setSecondaryAt = (index: number, entry: ConsultationDiagnosisEntry) => {
    onChange({ ...value, primary: value.primary, secondary: secondary.map((s, i) => (i === index ? entry : s)) });
  };

  const addSecondary = () => {
    onChange({ ...value, primary: value.primary, secondary: [...secondary, { label: '' }] });
  };

  const removeSecondaryAt = (index: number) => {
    onChange({ ...value, primary: value.primary, secondary: secondary.filter((_, i) => i !== index) });
  };

  return (
    <ConsultationSection title="Diagnostic" summary={summary || undefined} defaultOpen={!isEmpty}>
      <div className="space-y-1.5">
        <Label className="text-xs font-normal text-muted-foreground">Diagnostic principal</Label>
        <DiagnosisRow
          entry={primary}
          placeholder="Diagnostic retenu"
          onChange={setPrimary}
          disabled={disabled}
        />
      </div>

      {secondary.length > 0 && (
        <div className="space-y-1.5">
          <Label className="text-xs font-normal text-muted-foreground">Diagnostics secondaires</Label>
          {secondary.map((entry, index) => (
            <DiagnosisRow
              key={index}
              entry={entry}
              placeholder={`Diagnostic secondaire ${index + 1}`}
              onChange={(updated) => setSecondaryAt(index, updated)}
              onRemove={() => removeSecondaryAt(index)}
              disabled={disabled}
            />
          ))}
        </div>
      )}

      <Button type="button" variant="outline" size="sm" onClick={addSecondary} disabled={disabled}>
        <Plus className="w-4 h-4" />
        Ajouter un diagnostic
      </Button>
    </ConsultationSection>
  );
};
