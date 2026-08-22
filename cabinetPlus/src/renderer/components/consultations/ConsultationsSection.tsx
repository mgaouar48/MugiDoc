import { useState, useEffect } from "react";
import { useConsultations } from "../../hooks/useConsultations";
import { useConsultationsList } from "../../hooks/useConsultationsList";
import { usePatients } from "../../hooks/usePatients";
import { useAppointments } from "../../hooks/useAppointments";
import { useToast } from "../../hooks/use-toast";
import { useConsultationClosure } from "../../hooks/useConsultationClosure";
import { useDataUpdateOptional } from "../../contexts/DataUpdateContext";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { Patient, Appointment } from "../../../shared/types";
import { format } from "date-fns";

import { ConsultationUI, convertConsultationToUI, convertUIToCreateRequest } from "./consultationMappers";
import { ConsultationForm } from "./ConsultationForm";
import { ConsultationList } from "./ConsultationList";

interface ConsultationsSectionProps {
  onBack: () => void;
  autoOpenForm?: boolean;
  preSelectedPatient?: any;
  onOpenPrescription?: (patient: Patient, prescription?: any) => void;
}

type ViewMode = 'list' | 'form';

export const ConsultationsSection = ({ onBack, autoOpenForm = false, preSelectedPatient, onOpenPrescription }: ConsultationsSectionProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>(autoOpenForm ? 'form' : 'list');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingConsultation, setEditingConsultation] = useState<ConsultationUI | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [expandedConsultation, setExpandedConsultation] = useState<string | null>(null);

  // Hooks pour la gestion des données
  const {
    isLoading: consultationsLoading,
    error: consultationsError,
    stats: consultationStats,
    createConsultation,
    updateConsultation,
    deleteConsultation,
    clearError: clearConsultationsError
  } = useConsultations();

  const {
    consultations: dbConsultations,
    isLoading: isListLoading,
    error: listError,
    load: loadConsultationsList,
    reload: reloadConsultationsList,
    currentPage: consultationsCurrentPage,
    totalPages: consultationsTotalPages,
    goToPage: consultationsGoToPage,
    canGoNext: consultationsCanGoNext,
    canGoPrevious: consultationsCanGoPrevious,
    startIndex: consultationsStartIndex,
    endIndex: consultationsEndIndex,
    totalItems: consultationsTotalItems,
  } = useConsultationsList();

  const {
    patients,
    isLoading: patientsLoading,
    error: patientsError,
    loadPatients,
    getPatientById
  } = usePatients();

  useEffect(() => {
    if (viewMode === 'form') {
      loadPatients();
    }
  }, [viewMode, loadPatients]);

  const {
    appointments,
    isLoading: appointmentsLoading,
    getAppointmentsByPatient
  } = useAppointments();

  const { applyConsultationClosure } = useConsultationClosure();
  const triggerDashboardUpdate = useDataUpdateOptional()?.triggerDashboardUpdate;

  const { toast } = useToast();

  /**
   * Répercute la clôture d'une consultation : sortie de la salle d'attente,
   * rendez-vous marqué comme terminé, puis rafraîchissement du tableau de bord.
   */
  const propagateClosure = async (
    patientId: number,
    appointmentId: number | null | undefined,
    status: string
  ) => {
    if (status !== 'completed') return;

    const { warnings } = await applyConsultationClosure(patientId, appointmentId ?? null);

    if (warnings.length > 0) {
      toast({
        title: "Clôture partielle",
        description: `Consultation enregistrée, mais ${warnings.join(' et ')}.`,
        variant: "destructive",
      });
    }

    triggerDashboardUpdate?.();
  };

  // Convertir les consultations DB (page courante) vers UI
  const consultations = (dbConsultations || []).map(convertConsultationToUI);

  // Recharger la liste paginée depuis le serveur à chaque changement de recherche
  const debouncedConsultationsSearch = useDebouncedValue(searchTerm, 300);
  useEffect(() => {
    loadConsultationsList({ search: debouncedConsultationsSearch || undefined });
  }, [debouncedConsultationsSearch, loadConsultationsList]);

  // Gestion du patient pré-sélectionné
  useEffect(() => {
    if (preSelectedPatient) {
      setSelectedPatient(preSelectedPatient);
      if (autoOpenForm) {
        setViewMode('form');
      }
    }
  }, [preSelectedPatient, autoOpenForm]);

  // Formulaire
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    time: format(new Date(), 'HH:mm'),
    motif: '',
    diagnostic: '',
    traitement: '',
    status: 'scheduled' as 'completed' | 'cancelled' | 'scheduled' | 'no_show',
    notes: ''
  });

  // Gestion de la création d'une consultation
  const handleCreateConsultation = async () => {
    if (!selectedPatient) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un patient",
        variant: "destructive",
      });
      return;
    }

    if (!formData.date || !formData.time) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    try {
      const consultationData = convertUIToCreateRequest(
        formData,
        selectedPatient.id,
        selectedAppointment?.id
      );
      await createConsultation(consultationData);
      await propagateClosure(selectedPatient.id, selectedAppointment?.id, formData.status);
      await reloadConsultationsList();

      toast({
        title: "Consultation créée",
        description: `Consultation créée pour ${selectedPatient.first_name} ${selectedPatient.last_name}`,
      });

      // Réinitialiser le formulaire
      setFormData({
        date: format(new Date(), 'yyyy-MM-dd'),
        time: format(new Date(), 'HH:mm'),
        motif: '',
        diagnostic: '',
        traitement: '',
        status: 'scheduled',
        notes: ''
      });
      setSelectedPatient(null);
      setSelectedAppointment(null);
      setViewMode("list");
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de créer la consultation",
        variant: "destructive",
      });
    }
  };

  // Gestion de la modification d'une consultation
  const handleUpdateConsultation = async () => {
    if (!selectedPatient || !editingConsultation) {
      toast({
        title: "Erreur",
        description: "Données manquantes pour la modification",
        variant: "destructive",
      });
      return;
    }

    if (!formData.date || !formData.time) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    try {
      const consultationData = {
        patient_id: selectedPatient.id,
        appointment_id: selectedAppointment?.id || null,
        date: formData.date,
        time: formData.time,
        motif: formData.motif,
        diagnostic: formData.diagnostic || null,
        traitement: formData.traitement || null,
        status: formData.status === 'cancelled' || formData.status === 'no_show' ? 'scheduled' : formData.status as 'completed' | 'in-progress' | 'scheduled',
        notes: formData.notes || null
      };

      await updateConsultation(parseInt(editingConsultation.id), consultationData);
      await propagateClosure(selectedPatient.id, consultationData.appointment_id, consultationData.status);
      await reloadConsultationsList();

      toast({
        title: "Consultation modifiée",
        description: `Consultation modifiée pour ${selectedPatient.first_name} ${selectedPatient.last_name}`,
      });

      // Réinitialiser le formulaire
      setFormData({
        date: format(new Date(), 'yyyy-MM-dd'),
        time: format(new Date(), 'HH:mm'),
        motif: '',
        diagnostic: '',
        traitement: '',
        status: 'scheduled',
        notes: ''
      });
      setSelectedPatient(null);
      setSelectedAppointment(null);
      setEditingConsultation(null);
      setViewMode("list");
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de modifier la consultation",
        variant: "destructive",
      });
    }
  };

  // Gestion de la suppression d'une consultation
  const handleDeleteConsultation = async (consultationId: string) => {
    try {
      await deleteConsultation(parseInt(consultationId));
      await reloadConsultationsList();
      toast({
        title: "Consultation supprimée",
        description: "La consultation a été supprimée avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de supprimer la consultation",
        variant: "destructive",
      });
    }
  };

  // Charger les rendez-vous d'un patient sélectionné
  const handlePatientSelect = async (patient: Patient) => {
    setSelectedPatient(patient);

    try {
      const appointments = await getAppointmentsByPatient(patient.id);
      // Si il y a des rendez-vous, on peut proposer de lier la consultation
      if (appointments.length > 0) {
        // Pour l'instant, on ne sélectionne pas automatiquement
        // L'utilisateur pourra choisir manuellement
      }
    } catch (error) {
      console.error('Erreur lors du chargement des rendez-vous:', error);
    }
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
    if (consultationsError) {
      toast({
        title: "Erreur",
        description: consultationsError,
        variant: "destructive",
      });
      clearConsultationsError();
    }
  }, [consultationsError, toast, clearConsultationsError]);

  const handleNewConsultation = () => {
    setEditingConsultation(null);
    setSelectedPatient(null);
    setSelectedAppointment(null);
    setFormData({
      date: format(new Date(), 'yyyy-MM-dd'),
      time: format(new Date(), 'HH:mm'),
      motif: '',
      diagnostic: '',
      traitement: '',
      status: 'scheduled',
      notes: ''
    });
    setViewMode('form');
  };

  const handleEditConsultation = async (consultation: ConsultationUI) => {
    setEditingConsultation({ ...consultation });

    // Charger les données dans le formulaire
    setFormData({
      date: consultation.date,
      time: consultation.time,
      motif: consultation.motif,
      diagnostic: consultation.diagnostic || '',
      traitement: consultation.traitement || '',
      status: consultation.status,
      notes: consultation.notes || ''
    });

    // Charger les informations du patient
    try {
      const patient = await getPatientById(parseInt(consultation.patientId));
      if (patient) {
        setSelectedPatient(patient);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du patient:', error);
    }

    setViewMode('form');
  };

  const handleViewDetails = (consultation: ConsultationUI) => {
    setExpandedConsultation(
      expandedConsultation === consultation.id ? null : consultation.id
    );
  };

  // Vue du formulaire
  if (viewMode === 'form') {
    return (
      <ConsultationForm
        formData={formData}
        setFormData={setFormData}
        patients={patients}
        selectedPatient={selectedPatient}
        onPatientSelect={setSelectedPatient}
        editingConsultation={editingConsultation}
        isLoading={consultationsLoading}
        onSubmit={editingConsultation ? handleUpdateConsultation : handleCreateConsultation}
        onCancel={() => setViewMode('list')}
      />
    );
  }

  // Vue liste (par défaut)
  return (
    <ConsultationList
      onBack={onBack}
      consultations={consultations}
      consultationsLoading={consultationsLoading}
      isListLoading={isListLoading}
      consultationsError={consultationsError}
      listError={listError}
      consultationStats={consultationStats}
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
      expandedConsultation={expandedConsultation}
      onNewConsultation={handleNewConsultation}
      onViewDetails={handleViewDetails}
      onEditConsultation={handleEditConsultation}
      onDeleteConsultation={handleDeleteConsultation}
      consultationsTotalItems={consultationsTotalItems}
      consultationsCurrentPage={consultationsCurrentPage}
      consultationsTotalPages={consultationsTotalPages}
      consultationsGoToPage={consultationsGoToPage}
      consultationsCanGoPrevious={consultationsCanGoPrevious}
      consultationsCanGoNext={consultationsCanGoNext}
      consultationsStartIndex={consultationsStartIndex}
      consultationsEndIndex={consultationsEndIndex}
    />
  );
};
