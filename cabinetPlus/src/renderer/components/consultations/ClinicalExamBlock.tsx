import { useMemo, useState } from "react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Command, CommandGroup, CommandItem, CommandInput, CommandList } from "../ui/command";
import { Plus } from "lucide-react";
import { ClinicalExamSection } from "../../../shared/types";
import { CLINICAL_EXAM_CATALOG } from "../../constants/clinicalExam";
import { matchesQuery } from "../../utils/motifs";
import { ConsultationSection } from "./ConsultationSection";
import { ExamSubsectionCard } from "./ExamSubsectionCard";

interface ClinicalExamBlockProps {
  value: ClinicalExamSection[];
  onChange: (value: ClinicalExamSection[]) => void;
  disabled?: boolean;
}

const OVERVIEW_KEY = 'overview';
const OVERVIEW_LABEL = 'Examen clinique (notes libres)';

/**
 * Examen clinique modulaire — cf. PLAN_CONSULTATION.md L7. Zone de texte
 * libre toujours visible (L7.1) + sous-sections ajoutées à la demande parmi
 * `CLINICAL_EXAM_CATALOG` (L7.2/L7.3), chacune supprimable.
 */
export const ClinicalExamBlock = ({ value, onChange, disabled }: ClinicalExamBlockProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const overviewText = value.find(s => s.key === OVERVIEW_KEY)?.free_text || '';
  const subsections = value.filter(s => s.key !== OVERVIEW_KEY);

  const available = useMemo(() => {
    const activeKeys = new Set(subsections.map(s => s.key));
    return CLINICAL_EXAM_CATALOG.filter(entry => !activeKeys.has(entry.key) && matchesQuery(entry.label, query));
  }, [subsections, query]);

  const setOverviewText = (text: string) => {
    const rest = value.filter(s => s.key !== OVERVIEW_KEY);
    onChange(text.trim() ? [{ key: OVERVIEW_KEY, label: OVERVIEW_LABEL, checked_items: [], free_text: text }, ...rest] : rest);
  };

  const addSubsection = (key: string) => {
    const entry = CLINICAL_EXAM_CATALOG.find(c => c.key === key);
    if (!entry) return;
    onChange([...value, { key: entry.key, label: entry.label, checked_items: [] }]);
    setQuery("");
    setOpen(false);
  };

  const updateSubsection = (key: string, updated: ClinicalExamSection) => {
    onChange(value.map(s => (s.key === key ? updated : s)));
  };

  const removeSubsection = (key: string) => {
    onChange(value.filter(s => s.key !== key));
  };

  const summary = [
    ...(overviewText ? [overviewText.slice(0, 40)] : []),
    ...subsections.map(s => s.label),
  ].join(' · ');

  const hasContent = value.length > 0;

  return (
    <ConsultationSection title="Examen clinique" summary={summary || undefined} defaultOpen={hasContent}>
      <Textarea
        value={overviewText}
        onChange={(e) => setOverviewText(e.target.value)}
        placeholder="Examen clinique — notes libres..."
        rows={2}
        disabled={disabled}
        className="text-sm"
      />

      {subsections.map(section => {
        const catalogEntry = CLINICAL_EXAM_CATALOG.find(c => c.key === section.key);
        if (!catalogEntry) return null;
        return (
          <ExamSubsectionCard
            key={section.key}
            section={section}
            catalogEntry={catalogEntry}
            onChange={(updated) => updateSubsection(section.key, updated)}
            onRemove={() => removeSubsection(section.key)}
            disabled={disabled}
          />
        );
      })}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" size="sm" disabled={disabled || available.length === 0}>
            <Plus className="w-4 h-4" />
            Ajouter un examen
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput placeholder="Rechercher une sous-section..." value={query} onValueChange={setQuery} />
            <CommandList>
              <CommandGroup>
                {available.map(entry => (
                  <CommandItem key={entry.key} onSelect={() => addSubsection(entry.key)} className="cursor-pointer">
                    {entry.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </ConsultationSection>
  );
};
