import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../ui/select";
import { Plus, X } from "lucide-react";
import { ExamRequestEntry } from "../../../shared/types";
import { ConsultationSection } from "./ConsultationSection";
import { EXAM_CATEGORIES, getFrequentExams } from "../../constants/complementaryExams";

interface ComplementaryExamsSectionProps {
  value: ExamRequestEntry[];
  onChange: (value: ExamRequestEntry[]) => void;
  disabled?: boolean;
}

const emptyRequest = (): ExamRequestEntry => ({ category: 'biologie', label: '' });

interface ExamRequestRowProps {
  entry: ExamRequestEntry;
  onChange: (entry: ExamRequestEntry) => void;
  onRemove: () => void;
  disabled?: boolean;
}

const ExamRequestRow = ({ entry, onChange, onRemove, disabled }: ExamRequestRowProps) => {
  const frequentExams = getFrequentExams(entry.category);

  return (
    <div className="border border-border rounded-md p-3 space-y-2.5">
      <div className="flex items-start gap-2">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
          <Select
            value={entry.category}
            onValueChange={(category: ExamRequestEntry['category']) => onChange({ ...entry, category })}
            disabled={disabled}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EXAM_CATEGORIES.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={entry.label}
            onChange={(e) => onChange({ ...entry, label: e.target.value })}
            placeholder="Examen demandé (ex: NFS)"
            disabled={disabled}
            className="h-9 text-sm"
          />
        </div>
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          aria-label="Retirer cet examen"
          className="p-1.5 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {frequentExams.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {frequentExams.map(exam => (
            <button
              key={exam}
              type="button"
              onClick={() => onChange({ ...entry, label: exam })}
              disabled={disabled}
              className="text-xs px-2 py-0.5 rounded-full border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              {exam}
            </button>
          ))}
        </div>
      )}

      <Input
        value={entry.indication || ''}
        onChange={(e) => onChange({ ...entry, indication: e.target.value || undefined })}
        placeholder="Indication (ex: recherche syndrome infectieux)"
        disabled={disabled}
        className="h-9 text-sm"
      />
    </div>
  );
};

/**
 * Examens complémentaires demandés — cf. PLAN_CONSULTATION.md L10. Chaque
 * demande porte une catégorie (avec examens fréquents en raccourci, L10.2),
 * un libellé et une indication clinique optionnelle (L10.3). Aucun champ
 * hérité à recomposer ici (contrairement à L8/L9) : `exam_requests` est une
 * donnée entièrement nouvelle, pas la structuration d'un champ texte existant.
 */
export const ComplementaryExamsSection = ({ value, onChange, disabled }: ComplementaryExamsSectionProps) => {
  const requests = value || [];
  const isEmpty = requests.length === 0;
  const summary = requests.map(r => r.label).filter(Boolean).join(', ');

  const addRequest = () => onChange([...requests, emptyRequest()]);
  const updateRequest = (index: number, entry: ExamRequestEntry) => onChange(requests.map((r, i) => i === index ? entry : r));
  const removeRequest = (index: number) => onChange(requests.filter((_, i) => i !== index));

  return (
    <ConsultationSection title="Examens complémentaires" summary={summary || undefined} defaultOpen={!isEmpty}>
      <div className="space-y-3">
        {requests.map((entry, index) => (
          <ExamRequestRow
            key={index}
            entry={entry}
            onChange={(e) => updateRequest(index, e)}
            onRemove={() => removeRequest(index)}
            disabled={disabled}
          />
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addRequest} disabled={disabled}>
          <Plus className="w-4 h-4" />
          Demander un examen
        </Button>
      </div>
    </ConsultationSection>
  );
};
