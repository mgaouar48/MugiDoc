// Types partagés entre le processus principal et le processus de rendu

export interface Setting {
  id: number;
  key: string;
  value: string;
  category: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

// Types pour la gestion des patients
export interface Patient {
  id: number;
  first_name: string;
  last_name: string;
  gender?: 'M' | 'F';
  date_of_birth: string;
  phone?: string;
  email?: string;
  address?: string;
  weight?: number; // Poids en kg
  height?: number; // Taille en cm
  diseases?: string; // Maladies actuelles
  medical_history?: string; // Antécédents médicaux
  allergies?: string; // Allergies connues
  status: 'actif' | 'inactif';
  created_at: string;
  updated_at: string;
}

export interface CreatePatientRequest {
  first_name: string;
  last_name: string;
  gender?: 'M' | 'F';
  date_of_birth: string;
  phone?: string;
  email?: string;
  address?: string;
  weight?: number;
  height?: number;
  diseases?: string;
  medical_history?: string;
  allergies?: string;
  status?: 'actif' | 'inactif';
}

export interface UpdatePatientRequest {
  first_name?: string;
  last_name?: string;
  gender?: 'M' | 'F';
  date_of_birth?: string;
  phone?: string;
  email?: string;
  address?: string;
  weight?: number;
  height?: number;
  diseases?: string;
  medical_history?: string;
  allergies?: string;
  status?: 'actif' | 'inactif';
}

export interface PatientDocument {
  id: number;
  patient_id: number;
  filename: string;
  original_name: string;
  file_type: string;
  file_size: number;
  category: string;
  file_path: string;
  notes?: string;
  created_at: string;
}

export interface PatientSearchFilters {
  search?: string;
  status?: 'actif' | 'inactif' | 'all';
  gender?: 'M' | 'F' | 'all';
  limit?: number;
  offset?: number;
}

// Types pour la gestion des rendez-vous
export interface Appointment {
  id: number;
  patient_id: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  duration: number; // en minutes
  type: string;
  status: 'confirmé' | 'en_attente' | 'annulé' | 'terminé';
  notes?: string;
  created_at: string;
  updated_at: string;
  // Relations
  patient?: Patient;
}

export interface CreateAppointmentRequest {
  patient_id: number;
  date: string;
  time: string;
  duration?: number;
  type: string;
  status?: 'confirmé' | 'en_attente' | 'annulé' | 'terminé';
  notes?: string;
}

export interface UpdateAppointmentRequest {
  patient_id?: number;
  date?: string;
  time?: string;
  duration?: number;
  type?: string;
  status?: 'confirmé' | 'en_attente' | 'annulé' | 'terminé';
  notes?: string;
}

export interface AppointmentSearchFilters {
  search?: string;
  patient_id?: number;
  date?: string;
  date_from?: string;
  date_to?: string;
  status?: 'confirmé' | 'en_attente' | 'annulé' | 'terminé' | 'all';
  type?: string;
  limit?: number;
  offset?: number;
}

// Types pour la gestion de la salle d'attente
export interface WaitingRoomEntry {
  id: number;
  patient_id: number;
  appointment_id?: number;
  ticket_number?: number;
  arrival_time: string;
  status: 'en_attente' | 'en_consultation' | 'termine' | 'absent';
  priority: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  patient?: Patient;
}

// Types pour la gestion des consultations
export interface Consultation {
  id: number;
  patient_id: number;
  appointment_id?: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  motif: string;
  diagnostic?: string;
  traitement?: string;
  status: 'completed' | 'cancelled' | 'scheduled' | 'no_show';
  price: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Relations
  patient?: Patient;
  appointment?: Appointment;
}

export interface CreateConsultationRequest {
  patient_id: number;
  appointment_id?: number;
  date: string;
  time: string;
  motif: string;
  diagnostic?: string;
  traitement?: string;
  status?: 'completed' | 'cancelled' | 'scheduled' | 'no_show';
  price?: number;
  notes?: string;
}

export interface UpdateConsultationRequest {
  patient_id?: number;
  appointment_id?: number;
  date?: string;
  time?: string;
  motif?: string;
  diagnostic?: string;
  traitement?: string;
  status?: 'completed' | 'in-progress' | 'scheduled';
  price?: number;
  notes?: string;
}

export interface ConsultationSearchFilters {
  search?: string;
  patient_id?: number;
  appointment_id?: number;
  date?: string;
  date_from?: string;
  date_to?: string;
  status?: 'completed' | 'in-progress' | 'scheduled' | 'all';
  is_paid?: boolean;
  limit?: number;
  offset?: number;
}

// Types pour la gestion des paiements
export interface Payment {
  id: number;
  patient_id: number | null; // Null pour patient anonyme
  consultation_id?: number | null;
  amount: number;
  method: 'cash' | 'card';
  status: 'pending' | 'completed' | 'debt';
  date: string; // YYYY-MM-DD
  /**
   * RESTE À PAYER sur ce paiement (sens canonique, unique dans tout le code).
   * Vaut 0 pour un paiement soldé. Pour une dette : montant total - déjà réglé.
   * Les revenus se calculent donc avec `amount - debt_amount`, les impayes
   * avec `debt_amount`.
   */
  debt_amount?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Relations
  patient?: Patient;
}

export interface CreatePaymentRequest {
  patient_id: number | null; // Null pour patient anonyme
  consultation_id?: number | null;
  amount: number;
  method: 'cash' | 'card';
  status?: 'pending' | 'completed' | 'debt';
  date: string;
  debt_amount?: number;
  notes?: string;
}

export interface UpdatePaymentRequest {
  patient_id?: number | null; // Null pour patient anonyme
  consultation_id?: number | null;
  amount?: number;
  method?: 'cash' | 'card';
  status?: 'pending' | 'completed' | 'debt';
  date?: string;
  debt_amount?: number;
  notes?: string;
}

export interface PaymentSearchFilters {
  search?: string;
  patient_id?: number;
  consultation_id?: number;
  date?: string;
  date_from?: string;
  date_to?: string;
  method?: 'cash' | 'card' | 'all';
  status?: 'pending' | 'completed' | 'debt' | 'all';
  limit?: number;
  offset?: number;
}

export interface BackupInfo {
  filename: string;
  path: string;
  size: number;
  created_at: string;
}

// Types pour la gestion des frais
export interface Expense {
  id: number;
  amount: number;
  description: string;
  date: string; // YYYY-MM-DD
  created_at: string;
  updated_at: string;
}

export interface CreateExpenseRequest {
  amount: number;
  description: string;
  date?: string; // Optionnel, par défaut date du jour
}

export interface UpdateExpenseRequest {
  amount?: number;
  description?: string;
  date?: string;
}

export interface ExpenseSearchFilters {
  search?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}

export interface DatabaseStats {
  patients: { count: number };
  appointments: { count: number };
  consultations: { count: number };
  payments: { count: number };
  expenses: { count: number };
  settings: { count: number };
  dbSize: number;
}

export type UserRole = 'doctor' | 'secretary';

export interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  speciality?: string;
  license_number?: string;
  role: UserRole;
  is_active: boolean;
  must_change_password?: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  speciality?: string;
  license_number?: string;
  role: UserRole;
}

export interface UpdateUserRequest {
  username?: string;
  password?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  speciality?: string;
  license_number?: string;
  role?: UserRole;
  is_active?: boolean;
}

export interface ActivityLog {
  id: number;
  user_id: number | null;
  username?: string;
  user_name?: string;
  user_role?: UserRole;
  action: string;
  resource: string;
  details?: string;
  created_at: string;
}

export interface ActivityLogSearchFilters {
  user_id?: number;
  resource?: string;
  action?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}

export interface ElectronAPI {
  getAppVersion: () => Promise<string>;
  getPlatform: () => Promise<string>;
  onMenuAction: (callback: (action: string) => void) => void;
  removeAllListeners: (channel: string) => void;

  // API Paramètres
  settings: {
    getAll: () => Promise<Setting[]>;
    getByCategory: (category: string) => Promise<Setting[]>;
    get: (key: string) => Promise<Setting | null>;
    update: (key: string, value: string) => Promise<void>;
    create: (key: string, value: string, category: string, description?: string) => Promise<void>;
    delete: (key: string) => Promise<void>;
    uploadLogo: (logoData: LogoUploadRequest) => Promise<CabinetLogo>;
    getLogo: () => Promise<CabinetLogo | null>;
    deleteLogo: () => Promise<void>;
  };

  // API Sauvegardes
  backup: {
    create: (customPath?: string) => Promise<BackupInfo>;
    restore: (backupPath?: string) => Promise<void>;
    getAutoBackups: () => Promise<BackupInfo[]>;
    createAuto: () => Promise<BackupInfo>;
  };

  // API Base de données
  database: {
    getStats: () => Promise<DatabaseStats>;
  };

  // API Authentification
  auth: {
    login: (loginData: any) => Promise<User | null>;
    getUserById: (id: number) => Promise<User | null>;
    getAllUsers: () => Promise<User[]>;
    createUser: (userData: CreateUserRequest) => Promise<User>;
    updateUser: (userId: number, userData: UpdateUserRequest) => Promise<User>;
    deleteUser: (userId: number) => Promise<void>;
    toggleUserActive: (userId: number) => Promise<void>;
    resetPassword: (userId: number, newPassword: string) => Promise<void>;
    changePassword: (userId: number, passwordData: any) => Promise<void>;
    changeCredentials: (userId: number, credentialsData: any) => Promise<void>;
  };

  // API Logs d'activité
  logs: {
    getAll: (filters?: ActivityLogSearchFilters) => Promise<ActivityLog[]>;
    create: (action: string, resource: string, details?: string) => Promise<void>;
  };

  // API Patients
  patients: {
    getAll: (filters?: PatientSearchFilters) => Promise<Patient[]>;
    getCount: (filters?: PatientSearchFilters) => Promise<number>;
    getById: (id: number) => Promise<Patient | null>;
    create: (patient: CreatePatientRequest) => Promise<Patient>;
    update: (id: number, patient: UpdatePatientRequest) => Promise<Patient>;
    delete: (id: number, transferPayments?: boolean) => Promise<void>;
    search: (query: string) => Promise<Patient[]>;
    getStats: (filters?: { date_from?: string; date_to?: string }) => Promise<{ total: number }>;
  };

  // API Rendez-vous
  appointments: {
    getAll: (filters?: AppointmentSearchFilters) => Promise<Appointment[]>;
    getCount: (filters?: AppointmentSearchFilters) => Promise<number>;
    getById: (id: number) => Promise<Appointment | null>;
    create: (appointment: CreateAppointmentRequest) => Promise<Appointment>;
    update: (id: number, appointment: UpdateAppointmentRequest) => Promise<Appointment>;
    delete: (id: number) => Promise<void>;
    getByPatient: (patientId: number) => Promise<Appointment[]>;
    getByDate: (date: string) => Promise<Appointment[]>;
    getStats: () => Promise<{ total: number; confirmed: number; pending: number; cancelled: number; completed: number }>;
  };

  // API Consultations
  consultations: {
    getAll: (filters?: ConsultationSearchFilters) => Promise<Consultation[]>;
    getCount: (filters?: ConsultationSearchFilters) => Promise<number>;
    getById: (id: number) => Promise<Consultation | null>;
    create: (consultation: CreateConsultationRequest) => Promise<Consultation>;
    update: (id: number, consultation: UpdateConsultationRequest) => Promise<Consultation>;
    delete: (id: number) => Promise<void>;
    getByPatient: (patientId: number) => Promise<Consultation[]>;
    getByAppointment: (appointmentId: number) => Promise<Consultation[]>;
    getStats: () => Promise<{ total: number; completed: number; inProgress: number; scheduled: number; totalRevenue: number; paidRevenue: number; unpaidRevenue: number }>;
  };

  // API Paiements
  payments: {
    getAll: (filters?: PaymentSearchFilters) => Promise<Payment[]>;
    getCount: (filters?: PaymentSearchFilters) => Promise<number>;
    getById: (id: number) => Promise<Payment | null>;
    create: (payment: CreatePaymentRequest) => Promise<Payment>;
    update: (id: number, payment: UpdatePaymentRequest) => Promise<Payment>;
    delete: (id: number) => Promise<void>;
    getByPatient: (patientId: number) => Promise<Payment[]>;
    getByConsultation: (consultationId: number) => Promise<Payment[]>;
    getStats: () => Promise<{ total: number; pending: number; completed: number; debt: number; totalAmount: number; pendingAmount: number; debtAmount: number }>;
  };

  // API Frais
  expenses: {
    getAll: (filters?: ExpenseSearchFilters) => Promise<Expense[]>;
    getById: (id: number) => Promise<Expense | null>;
    create: (expense: CreateExpenseRequest) => Promise<Expense>;
    update: (id: number, expense: UpdateExpenseRequest) => Promise<Expense>;
    delete: (id: number) => Promise<void>;
    getStats: () => Promise<{ total: number; totalAmount: number }>;
  };

  // API Ordonnances
  prescriptions: {
    getAll: (filters?: PrescriptionSearchFilters) => Promise<Prescription[]>;
    getCount: (filters?: PrescriptionSearchFilters) => Promise<number>;
    getById: (id: number) => Promise<Prescription | null>;
    create: (prescription: CreatePrescriptionRequest) => Promise<Prescription>;
    update: (id: number, prescription: UpdatePrescriptionRequest) => Promise<Prescription>;
    delete: (id: number) => Promise<void>;
    getByPatientId: (patientId: number) => Promise<Prescription[]>;
    print: (id: number) => Promise<void>;
  };

  // API Modèles d'ordonnances
  prescriptionTemplates: {
    getAll: () => Promise<PrescriptionTemplate[]>;
    getById: (id: number) => Promise<PrescriptionTemplate | null>;
    create: (template: CreatePrescriptionTemplateRequest) => Promise<PrescriptionTemplate>;
    update: (id: number, template: UpdatePrescriptionTemplateRequest) => Promise<PrescriptionTemplate>;
    delete: (id: number) => Promise<void>;
  };

  // API Activation
  activation: {
    checkLicenseStatus: () => Promise<LicenseStatusResponse>;
    activateWithKey: (activationKey: string) => Promise<ActivationResponse>;
    getCurrentLicenseInfo: () => Promise<LocalLicenseInfo | null>;
    getTrialDaysRemaining: () => Promise<number>;
    resetLicense: () => Promise<void>;
  };

  isDev: boolean;
}

// Types pour la gestion des ordonnances
export interface Medication {
  name: string;
  dosage: string;
  instructions: string;
  duration: string;
}

export interface Prescription {
  id: number;
  patient_id: number;
  consultation_id?: number;
  template_id?: number;
  medications: Medication[];
  date: string;
  created_at: string;
  updated_at: string;
  // Relations
  patient?: Patient;
  consultation?: Consultation;
  template?: PrescriptionTemplate;
}

export interface CreatePrescriptionRequest {
  patient_id: number;
  consultation_id?: number;
  template_id?: number;
  medications: Medication[];
  date: string;
}

export interface UpdatePrescriptionRequest {
  patient_id?: number;
  consultation_id?: number;
  template_id?: number;
  medications?: Medication[];
  date?: string;
}

export interface PrescriptionTemplate {
  id: number;
  name: string;
  description?: string;
  medications: Medication[];
  created_at: string;
  updated_at: string;
}

export interface CreatePrescriptionTemplateRequest {
  name: string;
  description?: string;
  medications: Medication[];
}

export interface UpdatePrescriptionTemplateRequest {
  name?: string;
  description?: string;
  medications?: Medication[];
}

export interface PrescriptionSearchFilters {
  search?: string;
  patient_id?: number;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}

// Déclaration globale pour TypeScript
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

// Actions possibles depuis le menu
export type MenuAction = 
  | 'new-patient'
  | 'new-appointment'
  | 'about';

// Configuration de l'application
export interface AppConfig {
  name: string;
  version: string;
  description: string;
}

// Types pour les spécialités médicales prédéfinies
export const MEDICAL_SPECIALTIES = [
  'Cardiologie',
  'Dermatologie', 
  'Endocrinologie',
  'Gastro-entérologie',
  'Hématologie',
  'Néphrologie',
  'Neurologie',
  'Oncologie',
  'Ophtalmologie',
  'Oto-rhino-laryngologie (ORL)',
  'Pédiatrie',
  'Pneumologie',
  'Psychiatrie',
  'Radiologie',
  'Rhumatologie',
  'Urologie',
  'Médecine générale',
  'Autre'
] as const;

export type MedicalSpecialty = typeof MEDICAL_SPECIALTIES[number];

// Types pour la gestion du logo du cabinet
export interface CabinetLogo {
  filename: string;
  path: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
}

export interface LogoUploadRequest {
  filename: string;
  data: string; // Base64 encoded image data
  mimeType: string;
}

// Types pour le système d'activation
export interface LocalLicenseInfo {
  isActivated: boolean;
  activationKey?: string;
  macAddress: string;
  trialStartDate?: string;
  trialEndDate?: string;
  activatedAt?: string;
  clientName?: string;
  status: 'trial' | 'active' | 'expired';
}

export interface LicenseStatusResponse {
  isValid: boolean;
  licenseInfo: LocalLicenseInfo | null;
  message: string;
}

export interface ActivationResponse {
  success: boolean;
  message: string;
  licenseInfo?: LocalLicenseInfo;
}

