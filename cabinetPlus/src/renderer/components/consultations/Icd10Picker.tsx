import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from "../ui/command";
import { Hash, Loader2, X } from "lucide-react";
import { Icd10Code } from "../../../shared/types";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";

interface Icd10PickerProps {
  /** Code actuellement rattaché, ou undefined. */
  value?: string;
  onChange: (code: string | undefined) => void;
  /** Pré-remplit la recherche avec le libellé du diagnostic déjà saisi. */
  initialQuery?: string;
  disabled?: boolean;
}

/**
 * Rattachement d'un code CIM-10 à un diagnostic — toujours **optionnel**
 * (cf. PLAN_CONSULTATION.md L8.5) : un diagnostic sans code reste valide, le
 * code ne bloque jamais la saisie.
 */
export const Icd10Picker = ({ value, onChange, initialQuery, disabled }: Icd10PickerProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Icd10Code[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedQuery = useDebouncedValue(query, 250);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setIsSearching(true);

    window.electronAPI.icd10
      .search(debouncedQuery, 30)
      .then(list => {
        if (!cancelled) setResults(list || []);
      })
      .catch(err => {
        console.error('Erreur recherche CIM-10:', err);
        if (!cancelled) setResults([]);
      })
      .finally(() => {
        if (!cancelled) setIsSearching(false);
      });

    return () => { cancelled = true; };
  }, [debouncedQuery, open]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) setQuery(initialQuery?.trim() || "");
  };

  if (value) {
    return (
      <Badge variant="outline" className="gap-1 pr-1 font-mono text-[11px] flex-shrink-0">
        <Hash className="w-3 h-3" />
        {value}
        <button
          type="button"
          onClick={() => onChange(undefined)}
          disabled={disabled}
          aria-label={`Retirer le code ${value}`}
          className="hover:text-destructive"
        >
          <X className="w-3 h-3" />
        </button>
      </Badge>
    );
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button type="button" variant="ghost" size="sm" disabled={disabled} className="h-8 text-xs text-muted-foreground flex-shrink-0">
          <Hash className="w-3.5 h-3.5" />
          Code CIM-10
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Rechercher un code ou un libellé..." value={query} onValueChange={setQuery} />
          <CommandList>
            {isSearching && (
              <div className="flex items-center justify-center gap-2 py-4 text-xs text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin" />
                Recherche...
              </div>
            )}
            {!isSearching && results.length === 0 && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Aucun code trouvé. Le diagnostic reste valide sans code.
              </div>
            )}
            <CommandGroup>
              {results.map(entry => (
                <CommandItem
                  key={entry.code}
                  onSelect={() => { onChange(entry.code); setOpen(false); }}
                  className="cursor-pointer"
                >
                  <span className="font-mono text-xs text-primary w-16 flex-shrink-0">{entry.code}</span>
                  <span className="flex-1 text-sm">{entry.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
