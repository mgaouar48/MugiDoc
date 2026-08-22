import { Patient as PatientType, CreatePatientRequest, UpdatePatientRequest } from "../../../shared/types";
import { calculateAge } from "../../utils/validation";

export interface PatientUI {
  id: string;
  firstName: string;
  lastName: string;
  gender: 'M' | 'F';
  age: number;
  dateOfBirth: string;
  phone: string;
  address: string;
  weight?: number;
  height?: number;
  diseases?: string;
  medical_history?: string;
  allergies?: string;
  lastVisit: string;
  nextAppointment?: string;
  status: 'actif' | 'inactif';
}

export const convertPatientToUI = (patient: PatientType): PatientUI => ({
  id: (patient?.id ?? 0).toString(),
  firstName: patient?.first_name || '',
  lastName: patient?.last_name || '',
  gender: patient?.gender || 'M',
  dateOfBirth: patient?.date_of_birth || '',
  age: calculateAge(patient?.date_of_birth),
  phone: patient?.phone || '',
  address: patient?.address || '',
  weight: patient?.weight,
  height: patient?.height,
  diseases: patient?.diseases,
  medical_history: patient?.medical_history,
  allergies: patient?.allergies,
  lastVisit: new Date().toISOString().split('T')[0],
  nextAppointment: undefined,
  status: 'actif'
});

export const convertUIToPatient = (patientUI: PatientUI): PatientType => ({
  id: parseInt(patientUI.id),
  first_name: patientUI.firstName,
  last_name: patientUI.lastName,
  gender: patientUI.gender || 'M',
  date_of_birth: patientUI.dateOfBirth || ageToDateOfBirth(patientUI.age.toString()),
  phone: patientUI.phone || undefined,
  address: patientUI.address || undefined,
  allergies: patientUI.allergies || undefined,
  status: 'actif',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
});

export const ageToDateOfBirth = (age: string): string => {
  const currentYear = new Date().getFullYear();
  const birthYear = currentYear - parseInt(age || '0');
  return `${birthYear}-01-01`;
};

export const convertUIToCreateRequest = (formData: any): CreatePatientRequest => ({
  first_name: formData.firstName,
  last_name: formData.lastName,
  gender: formData.gender || 'M',
  date_of_birth: formData.date_of_birth || ageToDateOfBirth(formData.age),
  phone: formData.phone || undefined,
  address: formData.address || undefined,
  weight: formData.weight ? parseFloat(formData.weight) : undefined,
  height: formData.height ? parseFloat(formData.height) : undefined,
  diseases: formData.diseases || undefined,
  medical_history: formData.medical_history || undefined,
  allergies: formData.allergies || undefined,
  status: 'actif'
});

export const convertUIToUpdateRequest = (formData: any): UpdatePatientRequest => ({
  first_name: formData.firstName,
  last_name: formData.lastName,
  gender: formData.gender || 'M',
  date_of_birth: formData.date_of_birth || ageToDateOfBirth(formData.age),
  phone: formData.phone || undefined,
  address: formData.address || undefined,
  weight: formData.weight ? parseFloat(formData.weight) : undefined,
  height: formData.height ? parseFloat(formData.height) : undefined,
  diseases: formData.diseases || undefined,
  medical_history: formData.medical_history || undefined,
  allergies: formData.allergies || undefined,
  status: 'actif'
});
