import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PERIODS, currentTime, slotsWithValue, tryParseTime } from "@/utils/timeSlots";

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Saisie de l'heure de consultation : champ libre (accepte "14:30" ou
 * "1430") + liste déroulante par pas de 5 minutes groupée par moment de la
 * journée, avec un raccourci "Maintenant" toujours en tête.
 *
 * La valeur courante reste visible dans la liste même si elle tombe hors de
 * la grille des 5 minutes (saisie manuelle ou consultation existante).
 */
export function TimePicker({ value, onChange, id, disabled, className }: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const commitDraft = () => {
    const parsed = tryParseTime(draft);
    if (parsed) {
      onChange(parsed);
      setDraft(parsed);
    } else {
      setDraft(value);
    }
  };

  const handleSelectSlot = (slotValue: string) => {
    onChange(slotValue);
    setDraft(slotValue);
    setOpen(false);
  };

  return (
    <div className={cn("flex gap-1.5", className)}>
      <Input
        id={id}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commitDraft}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commitDraft();
          }
        }}
        placeholder="HH:MM"
        inputMode="numeric"
        disabled={disabled}
        className="flex-1"
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={disabled}
            aria-label="Choisir une heure dans la liste"
          >
            <Clock className="w-4 h-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-52 p-0" align="end">
          <Command>
            <CommandList className="max-h-72">
              <CommandGroup>
                <CommandItem
                  onSelect={() => handleSelectSlot(currentTime())}
                  className="font-semibold text-primary"
                >
                  Maintenant — {currentTime()}
                </CommandItem>
              </CommandGroup>
              {PERIODS.map(period => (
                <CommandGroup key={period} heading={period}>
                  {slotsWithValue(value)
                    .filter(slot => slot.period === period)
                    .map(slot => (
                      <CommandItem
                        key={slot.value}
                        onSelect={() => handleSelectSlot(slot.value)}
                        className={cn(slot.value === value && "font-semibold text-primary")}
                      >
                        {slot.value}
                      </CommandItem>
                    ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
