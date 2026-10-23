import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { FileText, FileCheck, Microscope, Scan, Receipt, CheckCircle2, Save, ChevronDown, Loader2 } from "lucide-react";

interface ConsultationActionBarProps {
  canSave: boolean;
  isSaving: boolean;
  lastDraftSavedAt: Date | null;
  onSaveDraft: () => void;
  onOpenOrdonnance: () => void;
  onOpenAnalyses: () => void;
  onOpenImagerie: () => void;
  onOpenCertificat: () => void;
  onFacturer: () => void;
  onFinalize: () => void;
}

/**
 * Barre d'actions fixe en bas de l'écran (cf. PLAN_CONSULTATION.md L14) :
 * regroupe les actions les plus fréquentes en fin de saisie pour qu'elles
 * restent à portée sans avoir à faire défiler tout le formulaire. Les
 * documents moins courants (compte rendu, arrêt de travail, lettre
 * d'orientation, bilan vierge) demeurent accessibles via la section
 * « Documents de consultation » plus haut dans le formulaire.
 */
export const ConsultationActionBar = ({
  canSave,
  isSaving,
  lastDraftSavedAt,
  onSaveDraft,
  onOpenOrdonnance,
  onOpenAnalyses,
  onOpenImagerie,
  onOpenCertificat,
  onFacturer,
  onFinalize,
}: ConsultationActionBarProps) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-sm shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
      <div className="max-w-[1600px] mx-auto px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" disabled={!canSave} onClick={onSaveDraft}>
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Enregistrer brouillon
          </Button>
          {lastDraftSavedAt && (
            <span className="text-xs text-muted-foreground">
              Brouillon enregistré à {lastDraftSavedAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}

          <div className="w-px h-6 bg-border mx-1 hidden sm:block" />

          <Button type="button" variant="outline" size="sm" disabled={isSaving} onClick={onOpenOrdonnance} className="border-primary/30 text-primary hover:bg-primary/5">
            <FileText className="w-4 h-4" />
            Ordonnance
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" size="sm" disabled={isSaving} className="border-border text-muted-foreground hover:bg-muted">
                <Microscope className="w-4 h-4" />
                Examens
                <ChevronDown className="w-3.5 h-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={onOpenAnalyses}>
                <Microscope className="w-4 h-4" />
                Analyses biologiques
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onOpenImagerie}>
                <Scan className="w-4 h-4" />
                Imagerie médicale
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button type="button" variant="outline" size="sm" disabled={isSaving} onClick={onOpenCertificat} className="border-success/30 text-success hover:bg-success/5">
            <FileCheck className="w-4 h-4" />
            Certificat
          </Button>

          <Button type="button" variant="outline" size="sm" disabled={isSaving} onClick={onFacturer} className="border-warning/30 text-warning hover:bg-warning/5">
            <Receipt className="w-4 h-4" />
            Facturer
          </Button>
        </div>

        <Button
          type="button"
          variant="success"
          size="lg"
          disabled={!canSave}
          onClick={onFinalize}
          className="font-bold"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          Terminer la consultation
        </Button>
      </div>
    </div>
  );
};
