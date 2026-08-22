import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { BookmarkPlus, Pill } from "lucide-react";
import { Medication } from "../../../shared/types";

interface SaveTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Médicaments qui composeront le modèle. */
  medications: Medication[];
  isSaving?: boolean;
  onConfirm: (name: string, description: string) => void;
}

/**
 * Nommage d'un modèle d'ordonnance.
 *
 * Remplace un `window.prompt()` : Chromium ne l'implémente pas dans Electron,
 * il renvoyait toujours `null` et la sauvegarde était donc systématiquement
 * abandonnée sans le moindre message.
 */
export const SaveTemplateDialog = ({
  open,
  onOpenChange,
  medications,
  isSaving = false,
  onConfirm,
}: SaveTemplateDialogProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (open) {
      setName("");
      setDescription("");
    }
  }, [open]);

  const trimmedName = name.trim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trimmedName || isSaving) return;
    onConfirm(trimmedName, description.trim());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-5">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <BookmarkPlus className="w-4.5 h-4.5 text-primary" />
            Sauvegarder comme modèle
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="templateName" className="text-xs font-semibold">
              Nom du modèle *
            </Label>
            <Input
              id="templateName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex : HTA, syndrome grippal, diabète..."
              autoFocus
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="templateDescription" className="text-xs font-semibold">
              Description (optionnel)
            </Label>
            <Textarea
              id="templateDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contexte d'utilisation, précautions..."
              rows={2}
            />
          </div>

          <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Pill className="w-3.5 h-3.5" />
              {medications.length} médicament{medications.length > 1 ? "s" : ""} enregistré
              {medications.length > 1 ? "s" : ""}
            </span>
            <ul className="space-y-0.5">
              {medications.map((m, i) => (
                <li key={i} className="text-xs text-foreground truncate">
                  • {m.name}
                  {m.dosage ? <span className="text-muted-foreground"> — {m.dosage}</span> : null}
                </li>
              ))}
            </ul>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Annuler
            </Button>
            <Button type="submit" size="sm" disabled={!trimmedName || isSaving} className="gap-1.5">
              <BookmarkPlus className="w-4 h-4" />
              {isSaving ? "Enregistrement..." : "Enregistrer le modèle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
