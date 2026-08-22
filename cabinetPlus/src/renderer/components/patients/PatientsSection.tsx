import { useState, useEffect } from "react";
import { usePatients } from "../../hooks/usePatients";
import { usePatientsList } from "../../hooks/usePatientsList";
import { useConsultations } from "../../hooks/useConsultations";
import { usePrescriptions } from "../../hooks/usePrescriptions";
import { useWaitingRoom } from "../../hooks/useWaitingRoom";
import { usePermissions } from "../../hooks/usePermissions";
import { useToast } from "../../hooks/use-toast";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { validatePatientForm, formatPhoneNumber, PatientFormData } from "../../utils/validation";
import { PatientUI, convertPatientToUI, convertUIToCreateRequest, convertUIToUpdateRequest } from "./patientMappers";
import { PatientList } from "./PatientList";
import { PatientDetail } from "./PatientDetail";
import { PatientForm } from "./PatientForm";

interface PatientsSectionProps {
  onBack: () => void;
  autoOpenForm?: boolean;
  onOpenConsultation?: (patient: PatientUI) => void;
  onOpenAppointment?: (patient: PatientUI) => void;
  onOpenPrescription?: (patient: PatientUI, prescription?: any) => void;
  onOpenPayment?: (patient: PatientUI) => void;
}

export const PatientsSection = ({
  onBack,
  autoOpenForm = false,
  onOpenConsultation,
  onOpenAppointment,
  onOpenPrescription,
  onOpenPayment
}: PatientsSectionProps) => {
  const permissions = usePermissions();
  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState<string>("all");
  const [view, setView] = useState<'list' | 'form'>(autoOpenForm ? 'form' : 'list');
  const [selectedPatient, setSelectedPatient] = useState<PatientUI | null>(null);
  const [formData, setFormData] = useState<PatientFormData>({
    firstName: '',
    lastName: '',
    gender: 'M',
    age: '',
    date_of_birth: '',
    phone: '',
    address: '',
    weight: '',
    height: '',
    diseases: '',
    medical_history: '',
    allergies: ''
  });
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    isLoading,
    error,
    createPatient,
    updatePatient,
    deletePatient,
  } = usePatients();

  const {
    patients: dbPatients,
    isLoading: isListLoading,
    error: listError,
    load: loadPatientsList,
    reload: reloadPatientsList,
    currentPage,
    totalPages,
    goToPage,
    canGoNext,
    canGoPrevious,
    startIndex,
    endIndex,
    totalItems,
  } = usePatientsList();

  const { toast } = useToast();

  const {
    consultations: dbConsultations,
    getConsultationsByPatient
  } = useConsultations();

  const {
    getPrescriptionsByPatientId
  } = usePrescriptions();

  const [patientConsultations, setPatientConsultations] = useState<any[]>([]);
  const [patientPrescriptions, setPatientPrescriptions] = useState<any[]>([]);
  const [expandedConsultation, setExpandedConsultation] = useState<number | null>(null);
  const [expandedPrescription, setExpandedPrescription] = useState<number | null>(null);
  const [editingPatient, setEditingPatient] = useState<PatientUI | null>(null);

  const { addToQueue } = useWaitingRoom();

  useEffect(() => {
    const loadPatientData = async () => {
      if (selectedPatient) {
        try {
          const consultations = await getConsultationsByPatient(parseInt(selectedPatient.id));
          setPatientConsultations(consultations);
          setExpandedConsultation(null);

          const prescriptions = await getPrescriptionsByPatientId(parseInt(selectedPatient.id));
          setPatientPrescriptions(prescriptions);
          setExpandedPrescription(null);
        } catch (error) {
          console.error('Erreur chargement patient data:', error);
          setPatientConsultations([]);
          setPatientPrescriptions([]);
        }
      } else {
        setPatientConsultations([]);
        setPatientPrescriptions([]);
      }
    };

    loadPatientData();
  }, [selectedPatient, getConsultationsByPatient, getPrescriptionsByPatientId]);

  const patients = (dbPatients || []).map(convertPatientToUI);

  // Recharger depuis le serveur (page 1) à chaque changement de recherche/filtre
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);
  useEffect(() => {
    loadPatientsList({
      search: debouncedSearchTerm || undefined,
      gender: genderFilter === 'all' ? undefined : (genderFilter as 'M' | 'F'),
    });
  }, [debouncedSearchTerm, genderFilter, loadPatientsList]);

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    setFormData({ ...formData, phone: formatted });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validatePatientForm(formData);

    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }

    setFormErrors([]);
    setIsSubmitting(true);

    try {
      if (editingPatient) {
        const updateData = convertUIToUpdateRequest(formData);
        await updatePatient(parseInt(editingPatient.id), updateData);
        toast({
          title: "Patient modifié",
          description: `Les informations de ${formData.firstName} ${formData.lastName} ont été mises à jour.`
        });
      } else {
        const createData = convertUIToCreateRequest(formData);
        await createPatient(createData);
        toast({
          title: "Patient créé",
          description: `Le dossier de ${formData.firstName} ${formData.lastName} a été créé.`
        });
      }

      await reloadPatientsList();
      setView('list');
      setEditingPatient(null);
      setFormData({
        firstName: '',
        lastName: '',
        gender: 'M',
        age: '',
        date_of_birth: '',
        phone: '',
        address: '',
        weight: '',
        height: '',
        diseases: '',
        medical_history: ''
      });
    } catch (err: any) {
      setFormErrors([err.message || "Erreur lors de l'enregistrement"]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePatient = async (patientId: string) => {
    try {
      await deletePatient(parseInt(patientId));
      await reloadPatientsList();
      toast({
        title: "Patient supprimé",
        description: "Le dossier patient a été supprimé avec succès."
      });
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message || "Impossible de supprimer le patient",
        variant: "destructive"
      });
    }
  };

  const getLastConsultationDate = (patientId: string): string | null => {
    if (!dbConsultations || !Array.isArray(dbConsultations)) return null;
    const pid = parseInt(patientId);
    const patientConsults = dbConsultations.filter(c => c && c.patient_id === pid);
    if (!patientConsults || patientConsults.length === 0) return null;
    const sorted = [...patientConsults].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return sorted[0]?.date || null;
  };

  const handleOpenNewPatientForm = () => {
    setEditingPatient(null);
    setFormData({
      firstName: '',
      lastName: '',
      gender: 'M',
      age: '',
      date_of_birth: '',
      phone: '',
      address: ''
    });
    setView('form');
  };

  // Note : ce pré-remplissage (déclenché depuis le tableau) n'inclut pas `allergies`,
  // contrairement à celui déclenché depuis la vue détail — comportement préexistant conservé tel quel.
  const handleEditFromList = (patient: PatientUI) => {
    setEditingPatient(patient);
    setFormData({
      firstName: patient.firstName,
      lastName: patient.lastName,
      gender: patient.gender || 'M',
      age: patient.age.toString(),
      date_of_birth: patient.dateOfBirth || '',
      phone: patient.phone,
      address: patient.address,
      weight: patient.weight?.toString() || '',
      height: patient.height?.toString() || '',
      diseases: patient.diseases || '',
      medical_history: patient.medical_history || ''
    });
    setView('form');
  };

  const handleEditFromDetail = (patient: PatientUI) => {
    setEditingPatient(patient);
    setFormData({
      firstName: patient.firstName,
      lastName: patient.lastName,
      gender: patient.gender || 'M',
      age: patient.age.toString(),
      date_of_birth: patient.dateOfBirth || '',
      phone: patient.phone,
      address: patient.address,
      weight: patient.weight?.toString() || '',
      height: patient.height?.toString() || '',
      diseases: patient.diseases || '',
      medical_history: patient.medical_history || '',
      allergies: patient.allergies || ''
    });
    setView('form');
  };

  const handleAddToWaitingRoom = async (patient: PatientUI) => {
    try {
      await addToQueue({ patient_id: parseInt(patient.id) });
      toast({ title: "Ajouté à la salle d'attente" });
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: 'destructive' });
    }
  };

  if (view === 'form') {
    return (
      <PatientForm
        formData={formData}
        setFormData={setFormData}
        formErrors={formErrors}
        isSubmitting={isSubmitting}
        editingPatient={editingPatient}
        canEditMedicalInfo={permissions.canEditPatientMedicalInfo}
        onSubmit={handleSubmit}
        onCancel={() => { setView('list'); setEditingPatient(null); }}
        onPhoneChange={handlePhoneChange}
      />
    );
  }

  if (selectedPatient) {
    return (
      <PatientDetail
        patient={selectedPatient}
        patientConsultations={patientConsultations}
        patientPrescriptions={patientPrescriptions}
        canCreateConsultation={permissions.canCreateConsultation}
        canViewPrescriptions={permissions.canViewPrescriptions}
        onBack={() => setSelectedPatient(null)}
        onEdit={() => handleEditFromDetail(selectedPatient)}
        onDelete={() => {
          handleDeletePatient(selectedPatient.id);
          setSelectedPatient(null);
        }}
        onOpenConsultation={onOpenConsultation}
        onOpenAppointment={onOpenAppointment}
      />
    );
  }

  return (
    <PatientList
      patients={patients}
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
      genderFilter={genderFilter}
      setGenderFilter={setGenderFilter}
      isLoading={isLoading || isListLoading}
      error={error || listError}
      currentPage={currentPage}
      totalPages={totalPages}
      goToPage={goToPage}
      canGoNext={canGoNext}
      canGoPrevious={canGoPrevious}
      startIndex={startIndex}
      endIndex={endIndex}
      totalItems={totalItems}
      onBack={onBack}
      onNewPatient={handleOpenNewPatientForm}
      onSelectPatient={setSelectedPatient}
      onEditPatient={handleEditFromList}
      onDeletePatient={handleDeletePatient}
      onAddToWaitingRoom={handleAddToWaitingRoom}
      getLastConsultationDate={getLastConsultationDate}
      onOpenConsultation={onOpenConsultation}
      onOpenAppointment={onOpenAppointment}
      onOpenPayment={onOpenPayment}
      onOpenPrescription={onOpenPrescription}
    />
  );
};
