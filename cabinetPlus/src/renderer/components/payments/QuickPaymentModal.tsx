import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import { Receipt } from "lucide-react";
import { Patient, Payment } from "../../../shared/types";
import { usePayments } from "../../hooks/usePayments";
import { useSettings } from "../../hooks/useSettings";
import { useToast } from "../../hooks/use-toast";
import { ThermalReceiptModal } from "./ThermalReceiptModal";
import { PaymentCollectForm, CollectFormResult } from "./PaymentCollectForm";

interface QuickPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: Patient | null;
  consultationId?: number | null;
  onSuccess?: () => void;
}

/**
 * Encaissement rapide en fin de consultation.
 *
 * Partage le corps du formulaire avec `CollectPaymentDialog` via
 * `PaymentCollectForm` : ici on crée un paiement au lieu d'en mettre un à jour.
 */
export const QuickPaymentModal = ({
  open,
  onOpenChange,
  patient,
  consultationId,
  onSuccess
}: QuickPaymentModalProps) => {
  const { getSetting } = useSettings();
  const { createPayment } = usePayments();
  const { toast } = useToast();

  const [createdPayment, setCreatedPayment] = useState<Payment | null>(null);
  const [collectedNow, setCollectedNow] = useState<number>(0);
  const [receiptModalOpen, setReceiptModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const defaultFee = getSetting("consultation_default_fee", "2000");

  const handleSubmit = async ({ total, paidNow, debt, method, status, printReceipt }: CollectFormResult) => {
    if (!patient) {
      toast({ title: "Patient manquant", description: "Aucun patient sélectionné.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const paymentRecord = await createPayment({
        patient_id: parseInt(String(patient.id), 10),
        consultation_id: consultationId || undefined,
        // `amount` = montant total de l'acte, jamais la seule part encaissée :
        // les revenus se calculent en `amount - debt_amount`, une part
        // encaissée stockée ici rendrait ce calcul négatif.
        amount: total,
        date: new Date().toISOString().split("T")[0],
        method,
        status,
        debt_amount: debt,
        notes: `Règlement consultation du ${new Date().toLocaleDateString("fr-FR")}`
      });

      toast({
        title: "Encaissement validé",
        description: `Règlement de ${paidNow.toLocaleString("fr-FR")} DA enregistré pour ${patient.first_name} ${patient.last_name}.`,
      });

      if (onSuccess) onSuccess();

      if (printReceipt) {
        setCreatedPayment(paymentRecord);
        setCollectedNow(paidNow);
        setReceiptModalOpen(true);
      } else {
        onOpenChange(false);
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Erreur d'encaissement",
        description: "Impossible d'enregistrer le paiement.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const patientFullName = patient ? `${patient.last_name} ${patient.first_name}` : "Patient";

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-sm p-5 rounded-xl border border-border shadow-md">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Receipt className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-sm font-bold text-foreground truncate">
                  Encaissement
                </DialogTitle>
                <p className="text-xs text-muted-foreground truncate">
                  {patientFullName}
                </p>
              </div>
            </div>
          </div>

          <PaymentCollectForm
            resetKey={open ? `${patient?.id ?? "none"}-${defaultFee}` : "closed"}
            initialTotal={defaultFee}
            totalLabel="Montant total de l'acte"
            isSubmitting={isSubmitting}
            onCancel={() => onOpenChange(false)}
            onSubmit={handleSubmit}
          />
        </DialogContent>
      </Dialog>

      {/* Ticket thermique si demandé */}
      {createdPayment && (
        <ThermalReceiptModal
          open={receiptModalOpen}
          onOpenChange={(isOpen) => {
            setReceiptModalOpen(isOpen);
            if (!isOpen) {
              onOpenChange(false);
            }
          }}
          payment={createdPayment}
          patient={patient}
          actName="Consultation Médicale"
          amount={createdPayment.amount}
          paidNow={collectedNow}
        />
      )}
    </>
  );
};
