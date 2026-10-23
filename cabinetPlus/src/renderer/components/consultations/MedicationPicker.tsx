import { useEffect, useState } from "react";
import { Input } from "../ui/input";
import { Popover, PopoverContent, PopoverAnchor } from "../ui/popover";
import { Command, CommandGroup, CommandItem, CommandList } from "../ui/command";
import { Loader2, Pill } from "lucide-react";
import { MedicationRecord } from "../../../shared/types";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";

interface MedicationPickerProps {
  /** Texte actuellement saisi dans le champ (nom du médicament). */
  value: string;
  onQueryChange: (value: string) => void;
  /** Une présentation du répertoire a été choisie — la ligne est structurée automatiquement (L9.4). */
  onSelect: (medication: MedicationRecord) => void;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * Recherche débattue (250 ms) sur le répertoire national des médicaments
 * (5375 présentations, cf. décision n°4) — même pattern que `Icd10Picker`
 * (Popover/Command contrôlés). La saisie libre reste toujours possible : ne
 * rien sélectionner dans la liste n'empêche pas d'enregistrer la ligne.
 */
export const MedicationPicker = ({ value, onQueryChange, onSelect, disabled, placeholder }: MedicationPickerProps) => {
  // `TreatmentSection.setField` remet le champ à `undefined` dès qu'il est
  // vidé (`v || undefined`) : sans ce repli, effacer un nom de médicament
  // pour le retaper faisait planter toute la consultation.
  const query = value ?? '';
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<MedicationRecord[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedQuery = useDebouncedValue(query, 250);

  useEffect(() => {
    if (!open || !debouncedQuery.trim()) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setIsSearching(true);

    window.electronAPI.medications
      .search(debouncedQuery, 20)
      .then(list => { if (!cancelled) setResults(list || []); })
      .catch(err => {
        console.error('Erreur recherche médicaments:', err);
        if (!cancelled) setResults([]);
      })
      .finally(() => { if (!cancelled) setIsSearching(false); });

    return () => { cancelled = true; };
  }, [debouncedQuery, open]);

  const handleSelect = (item: MedicationRecord) => {
    onSelect(item);
    setOpen(false);
    if (item.id) {
      window.electronAPI.medications.incrementPopularity(item.id).catch(err =>
        console.error('Erreur incrementPopularity:', err)
      );
    }
  };

  const showList = open && query.trim().length > 0;

  return (
    <Popover open={showList} onOpenChange={(next) => { if (!next) setOpen(false); }}>
      <PopoverAnchor asChild>
        <Input
          value={query}
          onChange={(e) => { onQueryChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder || "Nom du médicament..."}
          disabled={disabled}
          className="h-9 text-sm"
        />
      </PopoverAnchor>
      <PopoverContent
        className="w-96 p-0"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <Command shouldFilter={false}>
          <CommandList>
            {isSearching && (
              <div className="flex items-center justify-center gap-2 py-4 text-xs text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin" />
                Recherche...
              </div>
            )}
            {!isSearching && results.length === 0 && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Aucun médicament trouvé. Le nom saisi reste valide tel quel.
              </div>
            )}
            <CommandGroup>
              {results.map(item => (
                <CommandItem
                  key={item.id}
                  onMouseDown={(e) => e.preventDefault()}
                  onSelect={() => handleSelect(item)}
                  className="cursor-pointer items-start gap-2"
                >
                  <Pill className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-sm truncate">{item.brand_name}</span>
                      {item.dosage && (
                        <span className="text-xs font-mono text-primary flex-shrink-0">{item.dosage}</span>
                      )}
                    </div>
                    {(item.dci || item.form) && (
                      <div className="text-xs text-muted-foreground truncate">
                        {[item.dci, item.form].filter(Boolean).join(' · ')}
                      </div>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
