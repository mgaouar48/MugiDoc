import { useMemo } from "react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { ConsultationAnamnese } from "../../../shared/types";
import { ConsultationSection } from "./ConsultationSection";
import { SymptomPicker } from "./SymptomPicker";

interface AnamnesisSectionProps {
  value: ConsultationAnamnese;
  onChange: (value: ConsultationAnamnese) => void;
  disabled?: boolean;
}

const EVOLUTION_PRESETS = ['Amélioration', 'Stable', 'Aggravation'];

/**
 * Anamnèse / interrogatoire structuré — cf. PLAN_CONSULTATION.md L6. Tous les
 * champs sont optionnels ; la section démarre repliée sauf si elle contient
 * déjà des données (édition d'une consultation existante).
 */
export const AnamnesisSection = ({ value, onChange, disabled }: AnamnesisSectionProps) => {
  const isEmpty = useMemo(() => !Object.values(value).some(v => v && v.trim()), [value]);
  const summary = [value.symptoms, value.evolution].filter(Boolean).join(' — ');

  const setField = (field: keyof ConsultationAnamnese, v: string) => {
    onChange({ ...value, [field]: v || undefined });
  };

  return (
    <ConsultationSection title="Anamnèse" summary={summary || undefined} defaultOpen={!isEmpty}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-normal text-muted-foreground">Début des symptômes</Label>
          <Input
            type="date"
            value={value.onset_date || ''}
            onChange={(e) => setField('onset_date', e.target.value)}
            disabled={disabled}
            className="h-9 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-normal text-muted-foreground">Évolution</Label>
          <Input
            value={value.evolution || ''}
            onChange={(e) => setField('evolution', e.target.value)}
            placeholder="Évolution depuis le début"
            disabled={disabled}
            className="h-9 text-sm"
          />
          <div className="flex flex-wrap gap-1.5">
            {EVOLUTION_PRESETS.map(preset => (
              <button
                key={preset}
                type="button"
                onClick={() => setField('evolution', preset)}
                disabled={disabled}
                className="text-xs px-2 py-0.5 rounded-full border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-normal text-muted-foreground">Symptômes</Label>
        <SymptomPicker value={value.symptoms || ''} onChange={(v) => setField('symptoms', v)} disabled={disabled} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-normal text-muted-foreground">Facteurs aggravants / soulageants</Label>
          <Input
            value={value.aggravating_factors || ''}
            onChange={(e) => setField('aggravating_factors', e.target.value)}
            disabled={disabled}
            className="h-9 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-normal text-muted-foreground">Traitement déjà pris</Label>
          <Input
            value={value.prior_treatment || ''}
            onChange={(e) => setField('prior_treatment', e.target.value)}
            disabled={disabled}
            className="h-9 text-sm"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-normal text-muted-foreground">Antécédents liés au problème actuel</Label>
        <Input
          value={value.related_history || ''}
          onChange={(e) => setField('related_history', e.target.value)}
          disabled={disabled}
          className="h-9 text-sm"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-normal text-muted-foreground">Observations / interrogatoire</Label>
        <Textarea
          value={value.observations || ''}
          onChange={(e) => setField('observations', e.target.value)}
          placeholder="Notes libres de l'interrogatoire..."
          rows={2}
          disabled={disabled}
          className="text-sm"
        />
      </div>
    </ConsultationSection>
  );
};
