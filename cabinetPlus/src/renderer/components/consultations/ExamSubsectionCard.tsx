import { Checkbox } from "../ui/checkbox";
import { Input } from "../ui/input";
import { X } from "lucide-react";
import { ClinicalExamSection } from "../../../shared/types";
import { ClinicalExamCatalogEntry } from "../../constants/clinicalExam";
import { applyNormalExam, summarizeExamSection, toggleCheckedItem } from "../../utils/clinicalExam";

interface ExamSubsectionCardProps {
  section: ClinicalExamSection;
  catalogEntry: ClinicalExamCatalogEntry;
  onChange: (section: ClinicalExamSection) => void;
  onRemove: () => void;
  disabled?: boolean;
}

/** Une sous-section ajoutée de l'examen clinique — cf. PLAN_CONSULTATION.md L7.4/L7.5/L7.6. */
export const ExamSubsectionCard = ({ section, catalogEntry, onChange, onRemove, disabled }: ExamSubsectionCardProps) => {
  const summary = summarizeExamSection(section);

  return (
    <div className="border border-border rounded-md p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-foreground">{catalogEntry.label}</span>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={() => onChange(applyNormalExam(section, catalogEntry.key))}
            disabled={disabled}
            className="text-xs px-2 py-1 rounded-md border border-success/30 text-success hover:bg-success/5 transition-colors"
          >
            Examen normal
          </button>
          <button
            type="button"
            onClick={onRemove}
            disabled={disabled}
            aria-label={`Retirer ${catalogEntry.label}`}
            className="p-1 text-muted-foreground hover:text-destructive transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
        {catalogEntry.items.map(item => (
          <label key={item.label} className="flex items-center gap-2 text-sm cursor-pointer text-foreground">
            <Checkbox
              checked={section.checked_items.includes(item.label)}
              onCheckedChange={() => onChange(toggleCheckedItem(section, item.label))}
              disabled={disabled}
            />
            <span>{item.label}</span>
          </label>
        ))}
        <label className="flex items-center gap-2 text-sm cursor-pointer text-foreground">
          <Checkbox
            checked={!!section.other_checked}
            onCheckedChange={(checked) => onChange({ ...section, other_checked: !!checked })}
            disabled={disabled}
          />
          <span>Autre</span>
        </label>
      </div>

      {section.other_checked && (
        <Input
          value={section.other_text || ''}
          onChange={(e) => onChange({ ...section, other_text: e.target.value })}
          placeholder="Préciser..."
          disabled={disabled}
          className="h-8 text-sm"
        />
      )}

      {summary && (
        <div className="text-xs text-muted-foreground pt-1.5 border-t border-border">
          {summary}
        </div>
      )}
    </div>
  );
};
