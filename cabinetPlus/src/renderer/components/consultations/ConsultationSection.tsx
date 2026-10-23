import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { cn } from "../../lib/utils";

interface ConsultationSectionProps {
  title: string;
  /** Résumé affiché à côté du titre quand la section est repliée et non vide. */
  summary?: string;
  /** État initial (non contrôlé par la suite) — cf. PLAN_CONSULTATION.md L16.2 : repliée par défaut sauf si déjà remplie. */
  defaultOpen?: boolean;
  children: React.ReactNode;
}

/**
 * Bloc pliable réutilisé par les sections de la consultation (anamnèse,
 * examen clinique...) — cf. PLAN_CONSULTATION.md L6.4. `defaultOpen` ne fixe
 * que l'état initial : le repli/dépli ensuite reste au choix du médecin.
 */
export const ConsultationSection = ({ title, summary, defaultOpen = false, children }: ConsultationSectionProps) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="border border-border rounded-md">
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm font-semibold text-foreground hover:bg-muted/50 rounded-md transition-colors"
        >
          <span className="flex items-center gap-2 min-w-0">
            <span className="flex-shrink-0">{title}</span>
            {!open && summary && (
              <span className="text-xs font-normal text-muted-foreground truncate">— {summary}</span>
            )}
          </span>
          <ChevronDown className={cn("w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform", open && "rotate-180")} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-3 pb-3 pt-1 space-y-3">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
};
