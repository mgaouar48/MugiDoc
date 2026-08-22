import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Search, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Patient } from "../../../shared/types";
import { calculateAge } from "../../utils/validation";

/** Minuscules + suppression des accents, pour une recherche tolérante. */
const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim();

interface PatientComboboxProps {
  patients: Patient[];
  selectedPatient: Patient | null;
  onPatientSelect: (patient: Patient | null) => void;
  onOpen?: () => void;
  placeholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
}

export function PatientCombobox({
  patients,
  selectedPatient,
  onPatientSelect,
  onOpen,
  placeholder = "Sélectionner un patient...",
  emptyMessage = "Aucun patient trouvé.",
  disabled = false,
  className
}: PatientComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen && onOpen) {
      onOpen();
    }
  };

  // Filtrage maison : accents ignorés et recherche par mots, pour que
  // « dupont jean », « jean dupont » ou « benali » (patient « Bénali »)
  // remontent tous la bonne fiche. cmdk appliquait sinon son propre filtre
  // flou par-dessus, qui masquait une partie des résultats.
  const filteredPatients = patients.filter(patient => {
    const tokens = normalize(searchValue).split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return true;

    const haystack = normalize(
      [patient.first_name, patient.last_name, patient.phone, patient.email]
        .filter(Boolean)
        .join(' ')
    );

    return tokens.every(token => haystack.includes(token));
  });

  // Réinitialiser la recherche quand on ferme
  useEffect(() => {
    if (!open) {
      setSearchValue("");
    }
  }, [open]);

  const handleSelect = (patient: Patient) => {
    onPatientSelect(patient);
    setOpen(false);
  };

  const handleClear = () => {
    onPatientSelect(null);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between border-border",
            !selectedPatient && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4" />
            <span className="truncate">
              {selectedPatient
                ? `${selectedPatient.first_name} ${selectedPatient.last_name}`
                : selectedPatient === null && placeholder.includes("anonyme")
                ? "Patient anonyme"
                : placeholder
              }
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput
              placeholder="Rechercher un patient..."
              value={searchValue}
              onValueChange={setSearchValue}
              className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <CommandList>
            <CommandGroup>
              {selectedPatient && (
                <CommandItem
                  onSelect={handleClear}
                  className="text-muted-foreground"
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4" />
                    <span>Aucun patient sélectionné</span>
                  </div>
                </CommandItem>
              )}
              <CommandItem
                onSelect={() => onPatientSelect(null)}
                className="text-muted-foreground border-t"
              >
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>Patient anonyme</span>
                </div>
              </CommandItem>
              {searchValue.trim() && filteredPatients.length === 0 && (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  {emptyMessage}
                </div>
              )}
              {filteredPatients.map((patient) => (
                <CommandItem
                  key={patient.id}
                  onSelect={() => handleSelect(patient)}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedPatient?.id === patient.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {patient.first_name} {patient.last_name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {calculateAge(patient.date_of_birth)} ans
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-1">
                      {patient.phone && (
                        <span>{patient.phone}</span>
                      )}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
