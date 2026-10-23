import { useMemo, useState } from "react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from "../ui/command";
import { Check, ListChecks, X } from "lucide-react";
import { cn } from "../../lib/utils";
import { COMMON_SYMPTOMS } from "../../constants/symptoms";
import { hasSegment, matchesQuery, parseMotifSegments, removeMotifSegment, toggleMotifSegment } from "../../utils/motifs";

interface SymptomPickerProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

/**
 * Champ « Symptômes » de l'anamnèse : même mécanique que `MotifPicker`
 * (puces + recherche + saisie libre + combinaison) — cf. PLAN_CONSULTATION.md
 * L6.3 — mais adossée à une liste statique (`COMMON_SYMPTOMS`), sans
 * persistance ni compteur d'usage : le vocabulaire des symptômes est trop
 * vaste pour un catalogue qui grossirait à chaque saisie.
 */
export const SymptomPicker = ({ value, onChange, disabled }: SymptomPickerProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const segments = parseMotifSegments(value);

  const filtered = useMemo(
    () => COMMON_SYMPTOMS.filter(s => matchesQuery(`${s.label} ${s.category}`, query)),
    [query]
  );

  const groups = useMemo(() => {
    const map = new Map<string, typeof COMMON_SYMPTOMS>();
    for (const symptom of filtered) {
      const list = map.get(symptom.category);
      if (list) list.push(symptom);
      else map.set(symptom.category, [symptom]);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const pick = (label: string) => {
    onChange(toggleMotifSegment(value, label));
  };

  return (
    <div className="space-y-2">
      {segments.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {segments.map((segment, index) => (
            <Badge key={`${segment}-${index}`} variant="secondary" className="gap-1 pr-1 font-normal">
              {segment}
              <button
                type="button"
                onClick={() => onChange(removeMotifSegment(value, index))}
                className="hover:text-destructive"
                disabled={disabled}
                aria-label={`Retirer « ${segment} »`}
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Symptômes rapportés (texte libre)"
          disabled={disabled}
          className="flex-1"
        />
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" size="icon" disabled={disabled} title="Symptômes fréquents">
              <ListChecks className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <Command shouldFilter={false}>
              <CommandInput placeholder="Rechercher un symptôme..." value={query} onValueChange={setQuery} />
              <CommandList>
                {groups.map(([category, items]) => (
                  <CommandGroup key={category} heading={category}>
                    {items.map(symptom => (
                      <CommandItem key={symptom.label} onSelect={() => pick(symptom.label)} className="cursor-pointer">
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            hasSegment(value, symptom.label) ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <span className="flex-1">{symptom.label}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ))}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};
