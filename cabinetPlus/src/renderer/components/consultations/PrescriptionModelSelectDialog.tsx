import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Search, FileText } from "lucide-react";

export interface PrescriptionTemplateOption {
  id: number;
  name: string;
  description?: string;
  medications?: { name: string; dosage?: string }[];
}

interface PrescriptionModelSelectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Modèles créés par le médecin (table `prescription_templates`). */
  userTemplates?: PrescriptionTemplateOption[];
  onSelectUserTemplate?: (template: PrescriptionTemplateOption) => void;
  /** Ouvre le formulaire de création de modèle quand la liste est vide. */
  onCreateTemplate?: () => void;
}

/**
 * Sélection d'un modèle d'ordonnance.
 *
 * Les ordonnances prédéfinies livrées avec l'application ont été retirées :
 * seuls les modèles enregistrés par le médecin sont proposés, d'où l'onglet
 * unique.
 */
export const PrescriptionModelSelectDialog = ({
  open,
  onOpenChange,
  userTemplates = [],
  onSelectUserTemplate,
  onCreateTemplate
}: PrescriptionModelSelectDialogProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  const needle = searchTerm.trim().toLowerCase();
  const filteredUserTemplates = needle
    ? userTemplates.filter(t =>
        t.name.toLowerCase().includes(needle) ||
        (t.description && t.description.toLowerCase().includes(needle)) ||
        (t.medications && t.medications.some(m => m.name.toLowerCase().includes(needle)))
      )
    : userTemplates;

  const close = () => {
    onOpenChange(false);
    setSearchTerm("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col p-6">
        <DialogHeader className="pb-3 border-b">
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
            <FileText className="w-5 h-5 text-primary" />
            Mes modèles d'ordonnance
          </DialogTitle>
        </DialogHeader>

        {/* Barre de recherche avec autofocus */}
        <div className="relative my-2">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher un modèle par nom, description ou médicament..."
            className="pl-9 h-10 text-xs font-medium"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[300px]">
          {filteredUserTemplates.length > 0 ? (
            <>
              <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-1">
                {filteredUserTemplates.length} modèle{filteredUserTemplates.length > 1 ? 's' : ''}
              </div>
              <div className="grid grid-cols-1 gap-2">
                {filteredUserTemplates.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      onSelectUserTemplate?.(t);
                      close();
                    }}
                    className="w-full text-left p-3 border border-border rounded-xl bg-card hover:bg-primary/5 hover:border-primary/40 transition-all group flex flex-col gap-1.5 shadow-2xs"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-bold text-xs text-foreground group-hover:text-primary transition-colors truncate">
                        {t.name}
                      </span>
                      <span className="shrink-0 text-[11px] font-mono font-semibold bg-muted group-hover:bg-primary/10 text-muted-foreground group-hover:text-primary px-2 py-0.5 rounded">
                        {t.medications?.length || 0} médicament(s)
                      </span>
                    </div>

                    {t.description && (
                      <p className="text-[11px] text-muted-foreground line-clamp-1">
                        {t.description}
                      </p>
                    )}

                    {t.medications && t.medications.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {t.medications.map((m, idx) => (
                          <span key={idx} className="text-[11px] bg-muted/60 text-foreground px-2 py-0.5 rounded font-mono">
                            {m.name}{m.dosage ? ` (${m.dosage})` : ''}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12 space-y-3 text-muted-foreground">
              <FileText className="w-8 h-8 mx-auto opacity-40" />
              <p className="text-xs">
                {needle
                  ? `Aucun modèle ne correspond à "${searchTerm}".`
                  : "Vous n'avez pas encore enregistré de modèle d'ordonnance."}
              </p>
              {!needle && onCreateTemplate && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onCreateTemplate();
                    close();
                  }}
                >
                  Créer un modèle
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
