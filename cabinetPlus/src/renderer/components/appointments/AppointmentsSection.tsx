import { useState, useEffect, useMemo, useCallback } from "react";
import { format } from "date-fns";
import { useAppointments, useAvailableSlots } from "../../hooks/useAppointments";
import { useAppointmentsList } from "../../hooks/useAppointmentsList";
import { usePatients } from "../../hooks/usePatients";
import { useWaitingRoom } from "../../hooks/useWaitingRoom";
import { useToast } from "../../hooks/use-toast";
import { usePermissions } from "../../hooks/usePermissions";
import { QuickPaymentModal } from "../payments/QuickPaymentModal";
import { useWorkingHours } from "../../hooks/useWorkingHours";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { validateAppointmentForm } from "../../utils/appointmentValidation";
import { Patient } from "../../../shared/types";
import { AppointmentUI, convertAppointmentToUI, convertUIToCreateRequest } from "./appointmentMappers";
import { AppointmentForm } from "./AppointmentForm";
import { AppointmentCalendarView } from "./AppointmentCalendarView";
import { AppointmentList } from "./AppointmentList";

interface AppointmentsSectionProps {
  onBack: () => void;
  autoOpenForm?: boolean;
  preSelectedPatient?: any;
}

export const AppointmentsSection = ({ onBack, autoOpenForm = false, preSelectedPatient }: AppointmentsSectionProps) => {
  const permissions = usePermissions();
  const [view, setView] = useState<"list" | "calendar" | "form">(autoOpenForm ? "form" : "list");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [editingAppointment, setEditingAppointment] = useState<AppointmentUI | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const [quickPaymentModalOpen, setQuickPaymentModalOpen] = useState<boolean>(false);
  const [selectedPatientForPayment, setSelectedPatientForPayment] = useState<any>(null);

  // Hooks pour la gestion des données
  const {
    appointments: dbAppointments,
    isLoading: appointmentsLoading,
    error: appointmentsError,
    stats: appointmentStats,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    getAppointmentsByDate,
    clearError: clearAppointmentsError,
  } = useAppointments();

  const {
    appointments: dbAppointmentsList,
    isLoading: appointmentsListLoading,
    error: appointmentsListError,
    load: loadAppointmentsList,
    reload: reloadAppointmentsList,
    currentPage: appointmentsCurrentPage,
    totalPages: appointmentsTotalPages,
    goToPage: appointmentsGoToPage,
    canGoNext: appointmentsCanGoNext,
    canGoPrevious: appointmentsCanGoPrevious,
    startIndex: appointmentsStartIndex,
    endIndex: appointmentsEndIndex,
    totalItems: appointmentsTotalItems,
  } = useAppointmentsList();

  const {
    patients,
    isLoading: patientsLoading,
    searchPatients,
    getPatientById,
    loadPatients
  } = usePatients();

  const { addToQueue, queue: waitingQueue } = useWaitingRoom();

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  const { toast } = useToast();

  // Déterminer les patients/rendez-vous déjà en salle d'attente
  const waitingPatientIds = useMemo(() => {
    return new Set(
      waitingQueue
        .filter(e => e.status === 'en_attente' || e.status === 'en_consultation')
        .map(e => e.patient_id)
    );
  }, [waitingQueue]);

  const waitingAppointmentIds = useMemo(() => {
    return new Set(
      waitingQueue
        .filter(e => (e.status === 'en_attente' || e.status === 'en_consultation') && e.appointment_id)
        .map(e => e.appointment_id)
    );
  }, [waitingQueue]);

  const isAlreadyInWaitingRoom = (appointment: AppointmentUI) => {
    if (!appointment) return false;
    const numId = parseInt(appointment.id);
    if (!isNaN(numId) && waitingAppointmentIds.has(numId)) return true;
    if (appointment.patientId && waitingPatientIds.has(appointment.patientId)) return true;
    return false;
  };

  // Inscrire directement le patient en salle d'attente depuis son RDV
  const handleSendToWaitingRoom = async (appointment: AppointmentUI) => {
    if (!appointment.patientId) {
      toast({ title: 'Erreur', description: 'Patient introuvable pour ce rendez-vous', variant: 'destructive' });
      return;
    }
    try {
      await addToQueue({
        patient_id: appointment.patientId,
        appointment_id: parseInt(appointment.id),
        priority: 2,
        notes: `RDV ${appointment.time} - ${appointment.type}`
      });
      toast({
        title: 'Patient ajouté en salle d\'attente',
        description: `${appointment.patientName} a été inscrit dans la file d'attente.`
      });
    } catch (err: any) {
      toast({
        title: 'Information',
        description: err.message || 'Impossible d\'ajouter le patient en salle d\'attente',
        variant: err.message?.includes('déjà') ? 'default' : 'destructive'
      });
    }
  };

  // Ouvrir l'encaissement rapide pour un rendez-vous
  const handleOpenPaymentForAppointment = (appointment: AppointmentUI) => {
    const dbAppt = dbAppointments.find(a => a.id.toString() === appointment.id);
    let targetPatient: Patient | null = null;

    if (dbAppt?.patient) {
      targetPatient = {
        id: String(dbAppt.patient.id),
        first_name: dbAppt.patient.first_name,
        last_name: dbAppt.patient.last_name,
        phone: dbAppt.patient.phone,
        gender: dbAppt.patient.gender,
        date_of_birth: dbAppt.patient.date_of_birth
      };
    } else if (appointment.patientId) {
      const found = patients.find(p => p.id === String(appointment.patientId));
      if (found) {
        targetPatient = found;
      } else {
        const parts = appointment.patientName.split(' ');
        targetPatient = {
          id: String(appointment.patientId),
          first_name: parts[0] || appointment.patientName,
          last_name: parts.slice(1).join(' ') || '',
          phone: appointment.patientPhone
        };
      }
    }

    if (!targetPatient) {
      toast({
        title: "Patient non identifié",
        description: "Impossible d'identifier le patient pour ce rendez-vous.",
        variant: "destructive"
      });
      return;
    }

    setSelectedPatientForPayment(targetPatient);
    setQuickPaymentModalOpen(true);
  };

  // Hook pour les paramètres de travail
  const { workingHours, isWorkingDay } = useWorkingHours();

  // Rendez-vous du jour sélectionné (vue calendrier) — chargés indépendamment de la liste
  // paginée, car cette vue a besoin de tous les RDV d'une date, pas d'une page de 10
  const [selectedDateAppointments, setSelectedDateAppointments] = useState<AppointmentUI[]>([]);
  const loadSelectedDateAppointments = useCallback(async (date: Date | undefined) => {
    const dateStr = format(date || new Date(), 'yyyy-MM-dd');
    const data = await getAppointmentsByDate(dateStr);
    setSelectedDateAppointments(data.map(convertAppointmentToUI));
  }, [getAppointmentsByDate]);

  useEffect(() => {
    loadSelectedDateAppointments(selectedDate);
  }, [selectedDate, loadSelectedDateAppointments]);

  // Rendez-vous de la liste paginée (recherche/statut/pagination), convertis pour l'UI
  const appointmentsListUI = dbAppointmentsList.map(convertAppointmentToUI);

  // Formulaire
  const [formData, setFormData] = useState({
    date: new Date(),
    time: "",
    type: "",
    notes: ""
  });

  // Hook pour les créneaux disponibles avec durée des paramètres
  const { availableSlots, isLoading: slotsLoading, workingHours: availableSlotsWorkingHours } = useAvailableSlots(
    formData.date ? format(formData.date, 'yyyy-MM-dd') : '',
    workingHours?.consultationDuration || 30
  );

  // Créneaux de fallback si aucun paramètre n'est configuré
  const fallbackSlots = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
    "11:00", "11:30", "14:00", "14:30", "15:00", "15:30",
    "16:00", "16:30", "17:00", "17:30", "18:00"
  ];

  // Utiliser les créneaux disponibles ou les créneaux de fallback
  const displaySlots = availableSlots.length > 0 || slotsLoading ? availableSlots : fallbackSlots;

  // Gestion de la création d'un rendez-vous
  const handleCreateAppointment = async () => {
    if (!selectedPatient) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un patient",
        variant: "destructive",
      });
      return;
    }

    const validation = validateAppointmentForm(formData);
    if (!validation.isValid) {
      toast({
        title: "Erreur",
        description: validation.errors.join('\n'),
        variant: "destructive",
      });
      return;
    }

    if (!workingHours) {
      toast({
        title: "Erreur",
        description: "Paramètres de travail non configurés",
        variant: "destructive",
      });
      return;
    }

    // Vérifier les conflits d'horaires
    const selectedDateTime = format(formData.date, 'yyyy-MM-dd');
    const appointmentsOnDate = await getAppointmentsByDate(selectedDateTime);
    const existingAppointments = appointmentsOnDate.filter(apt => apt.status !== 'annulé');

    const hasConflict = existingAppointments.some(apt => {
      const aptStart = new Date(`2000-01-01T${apt.time}:00`);
      const aptEnd = new Date(aptStart.getTime() + apt.duration * 60000);
      const newStart = new Date(`2000-01-01T${formData.time}:00`);
      const newEnd = new Date(newStart.getTime() + workingHours.consultationDuration * 60000);

      return (newStart >= aptStart && newStart < aptEnd) ||
             (newEnd > aptStart && newEnd <= aptEnd) ||
             (newStart < aptStart && newEnd > aptEnd);
    });

    if (hasConflict) {
      toast({
        title: "Conflit d'horaire",
        description: "Un rendez-vous existe déjà à cette heure. Veuillez choisir un autre créneau.",
        variant: "destructive",
      });
      return;
    }

    try {
      const appointmentData = convertUIToCreateRequest(formData, selectedPatient.id, workingHours.consultationDuration);
      await createAppointment(appointmentData);
      await Promise.all([
        reloadAppointmentsList(),
        loadSelectedDateAppointments(selectedDate)
      ]);

      toast({
        title: "Rendez-vous créé",
        description: `Rendez-vous créé pour ${selectedPatient.first_name} ${selectedPatient.last_name}`,
      });

      // Réinitialiser le formulaire
      setFormData({
        date: new Date(),
        time: "",
        type: "",
        notes: ""
      });
      setSelectedPatient(null);
      setView("list");
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de créer le rendez-vous",
        variant: "destructive",
      });
    }
  };

  // Gestion de la suppression d'un rendez-vous
  const handleDeleteAppointment = async (appointmentId: string) => {
    try {
      await deleteAppointment(parseInt(appointmentId));
      await Promise.all([
        reloadAppointmentsList(),
        loadSelectedDateAppointments(selectedDate)
      ]);
      toast({
        title: "Rendez-vous supprimé",
        description: "Le rendez-vous a été supprimé avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de supprimer le rendez-vous",
        variant: "destructive",
      });
    }
  };

  // Gestion de la modification d'un rendez-vous
  const handleEditAppointment = async (appointment: AppointmentUI) => {
    try {
      // Charger les données du patient
      if (appointment.patientId) {
        const patient = await getPatientById(appointment.patientId);
        setSelectedPatient(patient);
      }

      // Pré-remplir le formulaire avec les données du rendez-vous
      setFormData({
        date: appointment.date,
        time: appointment.time,
        type: appointment.type,
        notes: appointment.notes || ""
      });

      setEditingAppointment(appointment);
      setView("form");
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les données du rendez-vous",
        variant: "destructive",
      });
    }
  };

  // Gestion de la mise à jour d'un rendez-vous
  const handleUpdateAppointment = async () => {
    if (!editingAppointment || !selectedPatient) {
      toast({
        title: "Erreur",
        description: "Données manquantes pour la modification",
        variant: "destructive",
      });
      return;
    }

    const validation = validateAppointmentForm(formData);
    if (!validation.isValid) {
      toast({
        title: "Erreur",
        description: validation.errors.join('\n'),
        variant: "destructive",
      });
      return;
    }

    if (!workingHours) {
      toast({
        title: "Erreur",
        description: "Paramètres de travail non configurés",
        variant: "destructive",
      });
      return;
    }

    // Vérifier les conflits d'horaires (exclure le RDV en cours de modification)
    const selectedDateTimeForUpdate = format(formData.date, 'yyyy-MM-dd');
    const appointmentsOnDateForUpdate = await getAppointmentsByDate(selectedDateTimeForUpdate);
    const existingAppointments = appointmentsOnDateForUpdate.filter(apt =>
      apt.status !== 'annulé' &&
      apt.id.toString() !== editingAppointment.id
    );

    const hasConflict = existingAppointments.some(apt => {
      const aptStart = new Date(`2000-01-01T${apt.time}:00`);
      const aptEnd = new Date(aptStart.getTime() + apt.duration * 60000);
      const newStart = new Date(`2000-01-01T${formData.time}:00`);
      const newEnd = new Date(newStart.getTime() + workingHours.consultationDuration * 60000);

      return (newStart >= aptStart && newStart < aptEnd) ||
             (newEnd > aptStart && newEnd <= aptEnd) ||
             (newStart < aptStart && newEnd > aptEnd);
    });

    if (hasConflict) {
      toast({
        title: "Conflit d'horaire",
        description: "Un rendez-vous existe déjà à cette heure. Veuillez choisir un autre créneau.",
        variant: "destructive",
      });
      return;
    }

    try {
      const appointmentData = {
        patient_id: selectedPatient.id,
        date: format(formData.date, 'yyyy-MM-dd'),
        time: formData.time,
        duration: workingHours.consultationDuration,
        type: formData.type,
        notes: formData.notes || undefined
      };

      await updateAppointment(parseInt(editingAppointment.id), appointmentData);
      await Promise.all([
        reloadAppointmentsList(),
        loadSelectedDateAppointments(selectedDate)
      ]);

      toast({
        title: "Rendez-vous modifié",
        description: `Rendez-vous modifié pour ${selectedPatient.first_name} ${selectedPatient.last_name}`,
      });

      // Réinitialiser le formulaire
      setFormData({
        date: new Date(),
        time: "",
        type: "",
        notes: ""
      });
      setSelectedPatient(null);
      setEditingAppointment(null);
      setView("list");
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de modifier le rendez-vous",
        variant: "destructive",
      });
    }
  };

  // Gestion de la confirmation d'un rendez-vous
  const handleConfirmAppointment = async (appointmentId: string) => {
    try {
      await updateAppointment(parseInt(appointmentId), { status: 'confirmé' });
      await Promise.all([
        reloadAppointmentsList(),
        loadSelectedDateAppointments(selectedDate)
      ]);
      toast({
        title: "Rendez-vous confirmé",
        description: "Le rendez-vous a été confirmé avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de confirmer le rendez-vous",
        variant: "destructive",
      });
    }
  };

  // Gestion de l'annulation d'un rendez-vous
  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      await updateAppointment(parseInt(appointmentId), { status: 'annulé' });
      await Promise.all([
        reloadAppointmentsList(),
        loadSelectedDateAppointments(selectedDate)
      ]);
      toast({
        title: "Rendez-vous annulé",
        description: "Le rendez-vous a été annulé avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible d'annuler le rendez-vous",
        variant: "destructive",
      });
    }
  };

  // Gestion du nouveau rendez-vous
  const handleNewAppointment = () => {
    setEditingAppointment(null);
    setSelectedPatient(null);
    setFormData({
      date: new Date(),
      time: "",
      type: "",
      notes: ""
    });
    setView("form");
  };

  // Gérer le patient pré-sélectionné
  useEffect(() => {
    if (preSelectedPatient && autoOpenForm) {
      // Convertir le patient UI vers le format Patient de la DB
      const dbPatient = {
        id: parseInt(preSelectedPatient.id),
        first_name: preSelectedPatient.firstName,
        last_name: preSelectedPatient.lastName,
        date_of_birth: new Date().getFullYear() - preSelectedPatient.age + '-01-01', // Approximation
        phone: preSelectedPatient.phone,
        address: preSelectedPatient.address,
        status: 'actif' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setSelectedPatient(dbPatient);
    }
  }, [preSelectedPatient, autoOpenForm]);

  // Effacer les erreurs quand elles changent
  useEffect(() => {
    if (appointmentsError) {
      toast({
        title: "Erreur",
        description: appointmentsError,
        variant: "destructive",
      });
      clearAppointmentsError();
    }
  }, [appointmentsError, toast, clearAppointmentsError]);

  // Recharger la liste paginée depuis le serveur à chaque changement de recherche/statut
  const debouncedAppointmentsSearch = useDebouncedValue(searchTerm, 300);
  useEffect(() => {
    loadAppointmentsList({
      search: debouncedAppointmentsSearch || undefined,
      status: filterStatus === 'all' ? undefined : (filterStatus as 'confirmé' | 'en_attente' | 'annulé' | 'terminé'),
    });
  }, [debouncedAppointmentsSearch, filterStatus, loadAppointmentsList]);

  if (view === "form") {
    return (
      <AppointmentForm
        formData={formData}
        setFormData={setFormData}
        patients={patients}
        selectedPatient={selectedPatient}
        setSelectedPatient={setSelectedPatient}
        editingAppointment={editingAppointment}
        workingHours={workingHours}
        isWorkingDay={isWorkingDay}
        displaySlots={displaySlots}
        slotsLoading={slotsLoading}
        fallbackSlots={fallbackSlots}
        isLoading={appointmentsLoading}
        onSubmit={editingAppointment ? handleUpdateAppointment : handleCreateAppointment}
        onCancel={() => setView("list")}
      />
    );
  }

  if (view === "calendar") {
    return (
      <AppointmentCalendarView
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        selectedDateAppointments={selectedDateAppointments}
        isLoading={appointmentsLoading}
        isSecretary={permissions.isSecretary}
        isAlreadyInWaitingRoom={isAlreadyInWaitingRoom}
        onBack={onBack}
        onSwitchToList={() => setView("list")}
        onNewAppointment={handleNewAppointment}
        onSendToWaitingRoom={handleSendToWaitingRoom}
        onOpenPayment={handleOpenPaymentForAppointment}
        onConfirm={handleConfirmAppointment}
        onCancelAppointment={handleCancelAppointment}
        onEdit={handleEditAppointment}
        onDelete={handleDeleteAppointment}
      />
    );
  }

  return (
    <>
      <AppointmentList
        appointments={appointmentsListUI}
        stats={appointmentStats}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        isLoading={appointmentsLoading || appointmentsListLoading}
        error={appointmentsError || appointmentsListError}
        currentPage={appointmentsCurrentPage}
        totalPages={appointmentsTotalPages}
        goToPage={appointmentsGoToPage}
        canGoNext={appointmentsCanGoNext}
        canGoPrevious={appointmentsCanGoPrevious}
        startIndex={appointmentsStartIndex}
        endIndex={appointmentsEndIndex}
        totalItems={appointmentsTotalItems}
        isSecretary={permissions.isSecretary}
        isAlreadyInWaitingRoom={isAlreadyInWaitingRoom}
        onBack={onBack}
        onSwitchToCalendar={() => setView("calendar")}
        onNewAppointment={handleNewAppointment}
        onSendToWaitingRoom={handleSendToWaitingRoom}
        onOpenPayment={handleOpenPaymentForAppointment}
        onConfirm={handleConfirmAppointment}
        onCancelAppointment={handleCancelAppointment}
        onEdit={handleEditAppointment}
        onDelete={handleDeleteAppointment}
      />
      <QuickPaymentModal
        open={quickPaymentModalOpen}
        onOpenChange={setQuickPaymentModalOpen}
        patient={selectedPatientForPayment}
        onSuccess={() => {
          reloadAppointmentsList();
          loadSelectedDateAppointments(selectedDate);
        }}
      />
    </>
  );
};
