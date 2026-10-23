import { useMemo, useState } from "react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from "../ui/command";
import { Check, Plus, Tag, X } from "lucide-react";
import { cn } from "../../lib/utils";
import { useToast } from "../../hooks/use-toast";
import { useConsultationMotifs } from "../../hooks/useConsultationMotifs";
import {
  hasSegment,
  matchesQuery,
  normalize,
  parseMotifSegments,
  removeMotifSegment,
  toggleMotifSegment,
} from "../../utils/motifs";

interface MotifPickerProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const QUICK_ACCESS_COUNT = 6;

/**
 * Champ « Motif de consultation » : saisie libre inchangée (rétro-compatible)
 * + puces rapides des motifs les plus utilisés + recherche dans le
 * répertoire complet, plusieurs motifs combinables — cf. PLAN_CONSULTATION.md L4.
 */
export const MotifPicker = ({ value, onChange, disabled }: MotifPickerProps) => {
  const { toast } = useToast();
  const { motifs, recordUsage, createMotif } = useConsultationMotifs();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const segments = parseMotifSegments(value);

  const quickChips = useMemo(
    () => motifs.filter(m => !hasSegment(value, m.label)).slice(0, QUICK_ACCESS_COUNT),
    [motifs, value]
  );

  const filtered = useMemo(
    () => motifs.filter(m => matchesQuery(`${m.label} ${m.category || ''}`, query)),
    [motifs, query]
  );

  const groups = useMemo(() => {
    const map = new Map<string, typeof motifs>();
    for (const motif of filtered) {
      const key = motif.category || 'Autre';
      const list = map.get(key);
      if (list) list.push(motif);
      else map.set(key, [motif]);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const trimmedQuery = query.trim();
  const hasExactMatch = motifs.some(m => normalize(m.label) === normalize(trimmedQuery));
  const showCreateOption = trimmedQuery.length > 0 && !hasExactMatch;

  const pick = (motif: { id: number; label: string }) => {
    const wasSelected = hasSegment(value, motif.label);
    onChange(toggleMotifSegment(value, motif.label));
    if (!wasSelected) recordUsage(motif.id);
  };

  const handleCreate = async () => {
    if (!trimmedQuery || isCreating) return;
    setIsCreating(true);
    try {
      const created = await createMotif(trimmedQuery);
      onChange(toggleMotifSegment(value, created.label));
      recordUsage(created.id);
      setQuery("");
      toast({ title: "Motif enregistré", description: `« ${created.label} » est désormais proposé dans les motifs récurrents.` });
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible d'enregistrer ce motif",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
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
          id="motif"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Raison de la consultation (optionnel)"
          disabled={disabled}
          className="flex-1"
        />
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" size="icon" disabled={disabled} title="Motifs fréquents">
              <Tag className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <Command shouldFilter={false}>
              <CommandInput placeholder="Rechercher un motif..." value={query} onValueChange={setQuery} />
              <CommandList>
                {groups.map(([category, items]) => (
                  <CommandGroup key={category} heading={category}>
                    {items.map(motif => (
                      <CommandItem key={motif.id} onSelect={() => pick(motif)} className="cursor-pointer">
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            hasSegment(value, motif.label) ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <span className="flex-1">{motif.label}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ))}
                {showCreateOption && (
                  <CommandGroup heading="Nouveau">
                    <CommandItem onSelect={handleCreate} disabled={isCreating} className="cursor-pointer text-primary">
                      <Plus className="mr-2 h-4 w-4" />
                      <span>Enregistrer « {trimmedQuery} » comme motif récurrent</span>
                    </CommandItem>
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {quickChips.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {quickChips.map(motif => (
            <button
              key={motif.id}
              type="button"
              onClick={() => pick(motif)}
              disabled={disabled}
              className="text-xs px-2 py-1 rounded-full border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              + {motif.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
