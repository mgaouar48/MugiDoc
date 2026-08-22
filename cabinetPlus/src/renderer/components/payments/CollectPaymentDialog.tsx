import { useState } from "react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Receipt } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import { Payment, UpdatePaymentRequest } from "../../../shared/types";
import { PaymentCollectForm, CollectFormResult } from "./PaymentCollectForm";

interface CollectPaymentDialogProps {
  open: boolean;
  payment: Payment | null;
  onClose: () => void;
  updatePayment: (id: number, data: UpdatePaymentRequest) => Promise<Payment>;
  /** `paidNow` = montant encaisse lors de cette operation, pour le ticket. */
  onSuccess: (updatedPayment: Payment, printReceipt: boolean, paidNow: number) => void;
}

/**
 * Encaissement d'un paiement déjà enregistré (relance d'un impayé).
 *
 * Le corps du formulaire est partagé avec `QuickPaymentModal` via
 * `PaymentCollectForm` : seule la persistance diffère.
 */
export const CollectPaymentDialog = ({
  open,
  payment,
  onClose,
  updatePayment,
  onSuccess,
}: CollectPaymentDialogProps) => {
  const { toast } = useToast();
  const [isCollecting, setIsCollecting] = useState<boolean>(false);

  const handleSubmit = async ({ total, paidNow, debt, method, status, printReceipt }: CollectFormResult) => {
    if (!payment) return;

    setIsCollecting(true);
    try {
      const todayStr = format(new Date(), "yyyy-MM-dd");
      const updated = await updatePayment(payment.id, {
        status,
        amount: total,
        method,
        date: todayStr,
        debt_amount: debt,
        notes: payment.notes,
      });

      toast({
        title: "Encaissement validé",
        description:
          status === "completed"
            ? `Paiement de ${total.toLocaleString("fr-FR")} DA soldé et marqué comme Payé.`
            : `Versement de ${paidNow.toLocaleString("fr-FR")} DA enregistré (reste ${debt.toLocaleString("fr-FR")} DA).`,
      });

      onClose();
      onSuccess(
        updated || {
          ...payment,
          status,
          method,
          amount: total,
          debt_amount: debt,
          date: todayStr,
        },
        printReceipt,
        paidNow
      );
    } catch (err: any) {
      toast({
        title: "Erreur d'encaissement",
        description: err?.message || "Impossible de valider l'encaissement.",
        variant: "destructive",
      });
    } finally {
      setIsCollecting(false);
    }
  };

  // Sur un impayé, `debt_amount` est le reste dû : la part déjà encaissée
  // lors des passages précédents vaut donc `amount - debt_amount`. Sans cette
  // valeur, la fenêtre redemandait la totalité de la facture au patient.
  const total = payment?.amount ?? 0;
  const alreadyPaid =
    payment?.status === "debt" && payment.debt_amount !== undefined
      ? Math.max(0, total - payment.debt_amount)
      : 0;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-sm p-5 rounded-xl border border-border shadow-md">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Receipt className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-sm font-bold text-foreground tracking-tight truncate">
                Encaissement
              </DialogTitle>
              <p className="text-xs text-muted-foreground truncate">
                {payment?.patient?.last_name && payment?.patient?.first_name
                  ? `${payment.patient.last_name} ${payment.patient.first_name}`
                  : "Patient"}
              </p>
            </div>
          </div>
        </div>

        <PaymentCollectForm
          resetKey={open ? payment?.id ?? "none" : "closed"}
          initialTotal={total.toString()}
          alreadyPaid={alreadyPaid}
          initialMethod={payment?.method === "card" ? "card" : "cash"}
          initialPrintReceipt
          totalLabel="Montant total de la facture"
          isSubmitting={isCollecting}
          onCancel={onClose}
          onSubmit={handleSubmit}
        />
      </DialogContent>
    </Dialog>
  );
};
