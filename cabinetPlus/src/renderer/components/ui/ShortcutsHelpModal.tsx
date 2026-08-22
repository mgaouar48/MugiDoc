import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";
import { Keyboard, Command } from "lucide-react";

interface ShortcutsHelpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ShortcutsHelpModal = ({ open, onOpenChange }: ShortcutsHelpModalProps) => {
  const shortcuts = [
    { key: "Ctrl + N", description: "Nouveau Patient (Formulaire rapide)" },
    { key: "Ctrl + Shift + C", description: "Nouvelle Consultation" },
    { key: "Ctrl + Shift + R", description: "Nouveau Rendez-vous" },
    { key: "Ctrl + Shift + S", description: "Ouvrir la gestion du Stock & Consommables" },
    { key: "F1", description: "Afficher l'aide des raccourcis clavier" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <Keyboard className="w-5 h-5 text-primary" />
            Raccourcis Clavier Rapides
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2 text-xs">
          <p className="text-muted-foreground">
            Utilisez ces raccourcis globaux pour naviguer et créer des éléments plus rapidement dans le cabinet.
          </p>

          <div className="border border-border rounded-lg divide-y divide-border overflow-hidden">
            {shortcuts.map((sc, i) => (
              <div key={i} className="p-3 bg-card flex items-center justify-between">
                <span className="text-foreground font-medium">{sc.description}</span>
                <kbd className="px-2 py-1 bg-muted font-mono font-bold text-[11px] rounded border border-border text-primary shadow-2xs">
                  {sc.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
