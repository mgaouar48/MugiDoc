import { Button } from "../ui/button";
import { ArrowLeft, Printer as PrinterIcon, PanelRight } from "lucide-react";
import { Patient } from "../../../shared/types";

interface ConsultationFormHeaderProps {
  isEditing: boolean;
  selectedPatient: Patient | null;
  onCancel: () => void;
  onPrint: () => void;
  onOpenSidebarSheet: () => void;
}

/**
 * En-tête de la page consultation : retour, titre, et actions secondaires
 * (Imprimer / Résumé mobile) — extrait de `ConsultationForm.tsx` en L16.5.
 */
export const ConsultationFormHeader = ({
  isEditing,
  selectedPatient,
  onCancel,
  onPrint,
  onOpenSidebarSheet,
}: ConsultationFormHeaderProps) => {
  return (
    <header className="bg-card border-b border-border px-8 py-0 flex items-center" style={{ height: '64px' }}>
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon-sm" onClick={onCancel}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              {isEditing ? 'Modifier la Consultation' : 'Nouvelle Consultation'}
            </h2>
            <p className="text-xs text-muted-foreground">
              {isEditing ? 'Mettre à jour les informations' : 'Enregistrer une nouvelle consultation médicale'}
            </p>
          </div>
        </div>
        {selectedPatient && (
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onPrint}>
              <PrinterIcon className="w-4 h-4" />
              Imprimer
            </Button>
            <Button type="button" variant="outline" size="sm" className="xl:hidden" onClick={onOpenSidebarSheet}>
              <PanelRight className="w-4 h-4" />
              Résumé
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};
