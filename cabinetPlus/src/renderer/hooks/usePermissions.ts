import { User, UserRole } from '../../shared/types';
import { useAuth } from './useAuth';

export const usePermissions = (customUser?: User | null) => {
  const { user: authUser } = useAuth();
  const user = customUser !== undefined ? customUser : authUser;

  const role: UserRole = user?.role === 'secretary' ? 'secretary' : 'doctor';

  const isSecretary = role === 'secretary';
  const isDoctor = role === 'doctor';
  const isAdmin = isDoctor;

  return {
    role,
    isAdmin,
    isDoctor,
    isSecretary,

    // Patients
    canViewPatients: true,
    canCreatePatient: true,
    canEditPatientAdminInfo: true,
    canEditPatientMedicalInfo: isDoctor,
    canDeletePatient: isDoctor,

    // Consultations & Diagnostics
    canViewConsultations: isDoctor,
    canCreateConsultation: isDoctor,
    canEditConsultation: isDoctor,
    canDeleteConsultation: isDoctor,

    // Ordonnances & Certificats
    canViewPrescriptions: isDoctor,
    canManagePrescriptions: isDoctor,
    canValidatePrescription: isDoctor,

    // Planning & RDV
    canViewAppointments: true,
    canManageAppointments: true,

    // Facturation & Paiements
    canViewPayments: true,
    canManagePayments: true,
    canViewTotalFinancialStats: isDoctor, // La secrétaire ne voit que les paiements individuels

    // Administration & Utilisateurs
    canManageUsers: isDoctor,
    canViewActivityLogs: isDoctor,
    canAccessSettings: isDoctor,
    canAccessBackup: isDoctor,
    canViewGlobalStats: isDoctor,
  };
};
