import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useToast } from "../../hooks/use-toast";
import { usePayments } from "../../hooks/usePayments";
import { usePaymentsList } from "../../hooks/usePaymentsList";
import { usePatients } from "../../hooks/usePatients";
import { useSettings } from "../../hooks/useSettings";
import { usePermissions } from "../../hooks/usePermissions";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { Payment, CreatePaymentRequest, Patient } from "../../../shared/types";
import { ThermalReceiptModal } from "./ThermalReceiptModal";
import { PaymentForm } from "./PaymentForm";
import { PaymentList } from "./PaymentList";
import { CollectPaymentDialog } from "./CollectPaymentDialog";
import { remainingDebt } from "./paymentHelpers";

interface PaymentsSectionProps {
  onBack: () => void;
}

export const PaymentsSection = ({ onBack }: PaymentsSectionProps) => {
  const permissions = usePermissions();
  // États pour la gestion des vues
  const [view, setView] = useState<"list" | "form" | "details">("list");
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "completed" | "debt">("all");
  const [filterMethod, setFilterMethod] = useState<"all" | "cash" | "card">("all");
  const [thermalReceiptOpen, setThermalReceiptOpen] = useState(false);
  const [thermalPayment, setThermalPayment] = useState<Payment | null>(null);
  const [thermalPaidNow, setThermalPaidNow] = useState<number | undefined>(undefined);

  // État pour la modale d'encaissement direct
  const [collectPaymentModalOpen, setCollectPaymentModalOpen] = useState(false);
  const [paymentToCollect, setPaymentToCollect] = useState<Payment | null>(null);

  // Hooks pour la gestion des données
  const {
    isLoading: paymentsLoading,
    error: paymentsError,
    stats: paymentStats,
    createPayment,
    updatePayment,
    deletePayment,
    getPaymentById,
    clearError: clearPaymentsError
  } = usePayments();

  const {
    payments,
    isLoading: isListLoading,
    error: listError,
    load: loadPaymentsList,
    reload: reloadPaymentsList,
    currentPage: paymentsCurrentPage,
    totalPages: paymentsTotalPages,
    goToPage: paymentsGoToPage,
    canGoNext: paymentsCanGoNext,
    canGoPrevious: paymentsCanGoPrevious,
    startIndex: paymentsStartIndex,
    endIndex: paymentsEndIndex,
    totalItems: paymentsTotalItems,
  } = usePaymentsList();

  const {
    patients,
    isLoading: patientsLoading,
    searchPatients,
    getPatientById,
    loadPatients
  } = usePatients();

  useEffect(() => {
    if (view === 'form') {
      loadPatients();
    }
  }, [view, loadPatients]);

  const {
    settings,
    getSetting
  } = useSettings();

  const { toast } = useToast();

  // Formulaire
  const [formData, setFormData] = useState({
    date: new Date(),
    amount: "",
    method: "" as "cash" | "card" | "",
    status: "pending" as "pending" | "completed" | "debt",
    paid_amount: "",
    notes: ""
  });

  // Recharger la liste paginée depuis le serveur à chaque changement de recherche/filtre
  const debouncedPaymentsSearch = useDebouncedValue(searchTerm, 300);
  useEffect(() => {
    loadPaymentsList({
      search: debouncedPaymentsSearch || undefined,
      status: filterStatus === 'all' ? undefined : filterStatus,
      method: filterMethod === 'all' ? undefined : filterMethod,
    });
  }, [debouncedPaymentsSearch, filterStatus, filterMethod, loadPaymentsList]);

  // Sélection d'un patient
  const handlePatientSelect = async (patient: Patient) => {
    setSelectedPatient(patient);

    // Pré-remplir le montant avec le prix par défaut des consultations
    const defaultPrice = getSetting('default_consultation_price', '8000');
    setFormData(prev => ({
      ...prev,
      amount: defaultPrice
    }));
  };

  // Gestion de la création d'un paiement
  const handleCreatePayment = async () => {
    if (!formData.amount || !formData.method) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    try {
      const paymentData: CreatePaymentRequest = {
        patient_id: selectedPatient?.id || null, // Permettre null pour patient anonyme
        amount: parseFloat(formData.amount),
        method: formData.method,
        status: formData.status,
        date: format(formData.date, 'yyyy-MM-dd'),
        // `debt_amount` en base = RESTE À PAYER, alors que le formulaire saisit
        // le montant déjà réglé : on convertit, en bornant à [0, montant].
        debt_amount: formData.status === 'debt' ? remainingDebt(formData) : 0,
        notes: formData.notes || undefined
      };

      await createPayment(paymentData);
      await reloadPaymentsList();

      toast({
        title: "Paiement créé",
        description: selectedPatient
          ? `Paiement créé pour ${selectedPatient.first_name} ${selectedPatient.last_name}`
          : "Paiement créé pour patient anonyme",
      });

      // Réinitialiser le formulaire
      setFormData({
        date: new Date(),
        amount: "",
        method: "",
        status: "pending",
        paid_amount: "",
        notes: ""
      });
      setSelectedPatient(null);
      setView("list");
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de créer le paiement",
        variant: "destructive",
      });
    }
  };

  // Gestion de la modification d'un paiement
  const handleEditPayment = async (payment: Payment) => {
    try {
      // Charger les données du patient si il existe
      if (payment.patient_id) {
        try {
          const patient = await getPatientById(payment.patient_id);
          setSelectedPatient(patient);
        } catch (error) {
          // Patient supprimé - permettre la modification en mode anonyme
          setSelectedPatient(null);
          toast({
            title: "Information",
            description: "Le patient associé à ce paiement n'existe plus. Modification en mode anonyme.",
            variant: "default",
          });
        }
      } else {
        // Paiement anonyme
        setSelectedPatient(null);
      }

      // Pré-remplir le formulaire avec les données du paiement
      setFormData({
        date: new Date(payment.date),
        amount: payment.amount.toString(),
        method: payment.method,
        status: payment.status,
        // Sens inverse à l'édition : la colonne porte le reste à payer,
        // le formulaire affiche ce qui a déjà été réglé.
        paid_amount: payment.status === 'debt' ?
          Math.max(payment.amount - (payment.debt_amount || 0), 0).toString() : "",
        notes: payment.notes || ""
      });

      setEditingPayment(payment);
      setView("form");
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les données du paiement",
        variant: "destructive",
      });
    }
  };

  // Gestion de la mise à jour d'un paiement
  const handleUpdatePayment = async () => {
    if (!editingPayment) {
      toast({
        title: "Erreur",
        description: "Aucun paiement à modifier",
        variant: "destructive",
      });
      return;
    }

    if (!formData.amount || !formData.method) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    try {
      const paymentData = {
        patient_id: selectedPatient?.id || null, // Permettre null pour patient anonyme
        amount: parseFloat(formData.amount),
        method: formData.method,
        status: formData.status,
        date: format(formData.date, 'yyyy-MM-dd'),
        // `debt_amount` en base = RESTE À PAYER, alors que le formulaire saisit
        // le montant déjà réglé : on convertit, en bornant à [0, montant].
        debt_amount: formData.status === 'debt' ? remainingDebt(formData) : 0,
        notes: formData.notes || undefined
      };

      await updatePayment(editingPayment.id, paymentData);
      await reloadPaymentsList();

      toast({
        title: "Paiement modifié",
        description: selectedPatient
          ? `Paiement modifié pour ${selectedPatient.first_name} ${selectedPatient.last_name}`
          : "Paiement modifié pour patient anonyme",
      });

      // Réinitialiser le formulaire
      setFormData({
        date: new Date(),
        amount: "",
        method: "",
        status: "pending",
        paid_amount: "",
        notes: ""
      });
      setSelectedPatient(null);
      setEditingPayment(null);
      setView("list");
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de modifier le paiement",
        variant: "destructive",
      });
    }
  };

  // Gestion de la suppression d'un paiement
  const handleDeletePayment = async (paymentId: number) => {
    try {
      await deletePayment(paymentId);
      await reloadPaymentsList();
      toast({
        title: "Paiement supprimé",
        description: "Le paiement a été supprimé avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de supprimer le paiement",
        variant: "destructive",
      });
    }
  };

  // Gestion du nouveau paiement
  const handleNewPayment = () => {
    setEditingPayment(null);
    setSelectedPatient(null);

    // Pré-remplir avec le prix par défaut
    const defaultPrice = getSetting('default_consultation_price', '8000');
    setFormData({
      date: new Date(),
      amount: defaultPrice,
      method: "",
      status: "pending",
      paid_amount: "",
      notes: ""
    });
    setView("form");
  };

  // Ouverture de la modale d'encaissement direct
  const handleOpenCollectModal = (payment: Payment) => {
    setPaymentToCollect(payment);
    setCollectPaymentModalOpen(true);
  };

  // Après un encaissement réussi : recharger la liste et proposer le ticket thermique
  const handleCollectSuccess = async (updatedPayment: Payment, printReceipt: boolean, paidNow: number) => {
    await reloadPaymentsList();
    if (printReceipt) {
      setThermalPayment(updatedPayment);
      // Le ticket doit porter la somme encaissée à l'instant, pas le total de
      // la consultation déjà réglé en partie lors d'un passage précédent.
      setThermalPaidNow(paidNow);
      setThermalReceiptOpen(true);
    }
  };

  // Ouvrir le ticket thermique pour un paiement (hors flux d'encaissement)
  const handlePrintReceipt = (payment: Payment) => {
    setThermalPayment(payment);
    // Réimpression hors encaissement : pas de montant du jour, le ticket
    // retombe sur la part réglée globalement.
    setThermalPaidNow(undefined);
    setThermalReceiptOpen(true);
  };

  // Gestion des erreurs
  useEffect(() => {
    if (paymentsError) {
      toast({
        title: "Erreur",
        description: paymentsError,
        variant: "destructive",
      });
      clearPaymentsError();
    }
  }, [paymentsError, toast, clearPaymentsError]);

  useEffect(() => {
    if (listError) {
      toast({
        title: "Erreur",
        description: listError,
        variant: "destructive",
      });
    }
  }, [listError, toast]);

  if (view === "form") {
    return (
      <PaymentForm
        formData={formData}
        setFormData={setFormData}
        patients={patients}
        selectedPatient={selectedPatient}
        onPatientSelect={(patient) => {
          if (patient) {
            handlePatientSelect(patient);
          } else {
            setSelectedPatient(null);
          }
        }}
        loadPatients={loadPatients}
        editingPayment={editingPayment}
        isLoading={paymentsLoading}
        onSubmit={editingPayment ? handleUpdatePayment : handleCreatePayment}
        onCancel={() => setView("list")}
      />
    );
  }

  return (
    <>
      <PaymentList
        payments={payments}
        stats={paymentStats}
        canViewTotalFinancialStats={permissions.canViewTotalFinancialStats}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        filterMethod={filterMethod}
        setFilterMethod={setFilterMethod}
        isLoading={paymentsLoading || isListLoading}
        currentPage={paymentsCurrentPage}
        totalPages={paymentsTotalPages}
        goToPage={paymentsGoToPage}
        canGoNext={paymentsCanGoNext}
        canGoPrevious={paymentsCanGoPrevious}
        startIndex={paymentsStartIndex}
        endIndex={paymentsEndIndex}
        totalItems={paymentsTotalItems}
        onBack={onBack}
        onNewPayment={handleNewPayment}
        onOpenCollectModal={handleOpenCollectModal}
        onPrintReceipt={handlePrintReceipt}
        onEdit={handleEditPayment}
        onDelete={handleDeletePayment}
      />

      <CollectPaymentDialog
        open={collectPaymentModalOpen}
        payment={paymentToCollect}
        onClose={() => setCollectPaymentModalOpen(false)}
        updatePayment={updatePayment}
        onSuccess={handleCollectSuccess}
      />

      <ThermalReceiptModal
        open={thermalReceiptOpen}
        onOpenChange={setThermalReceiptOpen}
        payment={thermalPayment}
        patient={thermalPayment?.patient}
        amount={thermalPayment?.amount}
        paidNow={thermalPaidNow}
      />
    </>
  );
};
