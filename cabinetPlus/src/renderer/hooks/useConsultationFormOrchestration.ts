import { useCallback, useEffect, useRef, useState } from "react";
import { Payment } from "../../shared/types";
import { useToast } from "./use-toast";
import { useKeyboardShortcuts } from "./useKeyboardShortcuts";
import { usePayments } from "./usePayments";
import { ConsultationDocumentsSectionHandle } from "../components/consultations/ConsultationDocumentsSection";
import { ConsultationFormData, ConsultationUI } from "../components/consultations/consultationMappers";
import { Patient } from "../../shared/types";

/** Sauvegarde automatique du brouillon toutes les 2 minutes (L14.5). */
const AUTOSAVE_INTERVAL_MS = 2 * 60 * 1000;

interface UseConsultationFormOrchestrationParams {
  formData: ConsultationFormData;
  selectedPatient: Patient | null;
  editingConsultation: ConsultationUI | null;
  isLoading: boolean;
  onSubmit: (options?: { finalize?: boolean; stayOpen?: boolean }) => Promise<boolean>;
}

/**
 * Orchestration de la barre d'actions fixe (L14) et de la clôture de
 * consultation (L15) : brouillon manuel/automatique, raccourcis clavier,
 * validation minimale avant clôture, facturation, écran récapitulatif.
 * Extrait de `ConsultationForm.tsx` en L16.5 pour n'y laisser que
 * l'assemblage visuel (conteneur + un composant par section).
 */
export const useConsultationFormOrchestration = ({
  formData,
  selectedPatient,
  editingConsultation,
  isLoading,
  onSubmit,
}: UseConsultationFormOrchestrationParams) => {
  const { toast } = useToast();
  const { updatePayment, getPaymentsByConsultation } = usePayments();

  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [sidebarSheetOpen, setSidebarSheetOpen] = useState(false);
  const [lastDraftSavedAt, setLastDraftSavedAt] = useState<Date | null>(null);

  const [paymentToCollect, setPaymentToCollect] = useState<Payment | null>(null);
  const [collectDialogOpen, setCollectDialogOpen] = useState(false);
  const [thermalReceiptOpen, setThermalReceiptOpen] = useState(false);
  const [thermalPayment, setThermalPayment] = useState<Payment | null>(null);
  const [thermalPaidNow, setThermalPaidNow] = useState<number | undefined>(undefined);
  const [finalizeWarningOpen, setFinalizeWarningOpen] = useState(false);
  const [completionDialogOpen, setCompletionDialogOpen] = useState(false);

  const documentsRef = useRef<ConsultationDocumentsSectionHandle>(null);

  const consultationIdForDialogs = editingConsultation ? parseInt(editingConsultation.id) : null;
  // `!completionDialogOpen` : une fois clôturée, la consultation ne doit plus
  // jamais être ré-enregistrée en tâche de fond (brouillon manuel, Ctrl+S ou
  // sauvegarde automatique) — `formData.status` local n'est jamais remonté à
  // `completed` après la finalisation, un enregistrement tardif écraserait
  // silencieusement le statut et `completed_at` en base.
  const canSave = !isLoading && !!selectedPatient && !!formData.date && !!formData.time && !completionDialogOpen;

  const handleSaveDraft = useCallback(async () => {
    if (!canSave) return;
    const ok = await onSubmit({ stayOpen: true });
    if (ok) setLastDraftSavedAt(new Date());
  }, [canSave, onSubmit]);

  // Enregistrement complet + statut → completed, mais sans quitter le
  // formulaire : l'écran récapitulatif (L15.7) s'affiche par-dessus, la
  // sortie réelle vers la liste n'a lieu que lorsqu'il est refermé.
  const doFinalize = useCallback(async () => {
    const ok = await onSubmit({ finalize: true, stayOpen: true });
    if (ok) setCompletionDialogOpen(true);
  }, [onSubmit]);

  // Validation minimale non bloquante (L15.1) : un avertissement
  // contournable si ni motif ni diagnostic n'ont été renseignés, jamais un
  // blocage — le médecin reste libre de terminer quand même.
  const handleFinalize = useCallback(() => {
    if (!canSave) return;
    const hasMotifOrDiagnostic = !!formData.motif?.trim() || !!formData.diagnostics?.primary?.label?.trim();
    if (!hasMotifOrDiagnostic) {
      setFinalizeWarningOpen(true);
      return;
    }
    doFinalize();
  }, [canSave, formData.motif, formData.diagnostics, doFinalize]);

  useKeyboardShortcuts({
    onSaveDraft: handleSaveDraft,
    onFinalize: handleFinalize,
  });

  // handleSaveDraft change d'identité à chaque frappe (il dépend de `onSubmit`,
  // recréé à chaque rendu de ConsultationsSection puisque `formData` y vit) :
  // passer par une ref évite que l'effet ci-dessous ne relance la minuterie
  // en boucle avant qu'elle n'atteigne jamais AUTOSAVE_INTERVAL_MS.
  const handleSaveDraftRef = useRef(handleSaveDraft);
  useEffect(() => {
    handleSaveDraftRef.current = handleSaveDraft;
  }, [handleSaveDraft]);

  // Sauvegarde automatique périodique du brouillon (L14.5) : ne redémarre
  // que si le patient change réellement, jamais au fil de la frappe.
  const selectedPatientId = selectedPatient?.id ?? null;
  useEffect(() => {
    if (!selectedPatientId) return;
    const interval = setInterval(() => {
      handleSaveDraftRef.current();
    }, AUTOSAVE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [selectedPatientId]);

  const handleFacturer = async () => {
    if (!selectedPatient) {
      toast({ title: "Patient requis", description: "Veuillez d'abord sélectionner un patient.", variant: "destructive" });
      return;
    }
    if (!consultationIdForDialogs) {
      toast({ title: "Consultation non enregistrée", description: "Enregistrez d'abord un brouillon avant de facturer.", variant: "destructive" });
      return;
    }
    try {
      const consultationPayments = await getPaymentsByConsultation(consultationIdForDialogs);
      const target = consultationPayments.find(p => p.status !== 'completed') ?? null;
      if (!target) {
        toast({ title: "Aucun paiement à encaisser", description: "Le paiement de cette consultation est déjà soldé." });
        return;
      }
      setPaymentToCollect(target);
      setCollectDialogOpen(true);
    } catch {
      toast({ title: "Erreur", description: "Impossible de récupérer le paiement de cette consultation.", variant: "destructive" });
    }
  };

  const handleCollectSuccess = (updatedPayment: Payment, printReceipt: boolean, paidNow: number) => {
    if (printReceipt) {
      setThermalPayment(updatedPayment);
      setThermalPaidNow(paidNow);
      setThermalReceiptOpen(true);
    }
  };

  return {
    printModalOpen,
    setPrintModalOpen,
    sidebarSheetOpen,
    setSidebarSheetOpen,
    lastDraftSavedAt,
    paymentToCollect,
    collectDialogOpen,
    setCollectDialogOpen,
    thermalReceiptOpen,
    setThermalReceiptOpen,
    thermalPayment,
    thermalPaidNow,
    finalizeWarningOpen,
    setFinalizeWarningOpen,
    completionDialogOpen,
    setCompletionDialogOpen,
    documentsRef,
    consultationIdForDialogs,
    canSave,
    handleSaveDraft,
    handleFinalize,
    doFinalize,
    handleFacturer,
    handleCollectSuccess,
    updatePayment,
  };
};
