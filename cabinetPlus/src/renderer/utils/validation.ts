// Utilitaires de validation pour les données patients

import { z } from 'zod';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface PatientFormData {
  firstName: string;
  lastName: string;
  gender?: 'M' | 'F';
  age: string;
  date_of_birth?: string;
  phone?: string;
  address?: string;
  weight?: string; // Poids en kg
  height?: string; // Taille en cm
  diseases?: string; // Maladies actuelles
  medical_history?: string; // Antécédents médicaux
  allergies?: string; // Allergies connues
  status?: 'actif' | 'inactif';
}

/**
 * Valide un format d'email
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valide un format de téléphone français
 */
export const isValidPhone = (phone: string): boolean => {
  // Accepte les formats: 06 12 34 56 78, 06.12.34.56.78, 06-12-34-56-78, 0612345678
  const phoneRegex = /^(?:(?:\+33|0)[1-9])(?:[-.\s]?\d{2}){4}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

/**
 * Valide un format de date (YYYY-MM-DD)
 */
export const isValidDate = (dateString: string): boolean => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    return false;
  }

  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime()) && date.toISOString().slice(0, 10) === dateString;
};

/**
 * Vérifie si une date de naissance est valide (pas dans le futur, pas trop ancienne)
 */
export const isValidBirthDate = (dateString: string): boolean => {
  if (!isValidDate(dateString)) {
    return false;
  }

  const birthDate = new Date(dateString);
  const today = new Date();
  const minDate = new Date();
  minDate.setFullYear(today.getFullYear() - 150); // Maximum 150 ans

  return birthDate <= today && birthDate >= minDate;
};

/**
 * Formate le résultat d'un schéma zod vers ValidationResult
 */
const toValidationResult = (result: z.SafeParseReturnType<unknown, unknown>): ValidationResult => {
  if (result.success) {
    return { isValid: true, errors: [] };
  }
  return { isValid: false, errors: result.error.issues.map(issue => issue.message) };
};

const numericString = (min: number, max: number, label: string) =>
  z.string().trim()
    .refine(val => val.length === 0 || (!isNaN(parseFloat(val)) && parseFloat(val) >= min && parseFloat(val) <= max), {
      message: `${label} doit être un nombre entre ${min} et ${max}`
    });

// Schéma de création d'un patient — champs obligatoires
export const patientFormSchema = z.object({
  firstName: z.string().trim()
    .min(1, 'Le prénom est obligatoire')
    .min(2, 'Le prénom doit contenir au moins 2 caractères')
    .max(50, 'Le prénom ne peut pas dépasser 50 caractères'),
  lastName: z.string().trim()
    .min(1, 'Le nom est obligatoire')
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(50, 'Le nom ne peut pas dépasser 50 caractères'),
  gender: z.enum(['M', 'F']).optional(),
  age: z.string().optional(),
  date_of_birth: z.string()
    .min(1, 'La date de naissance est obligatoire')
    .refine(isValidBirthDate, { message: 'La date de naissance n\'est pas valide' }),
  phone: z.string().optional().refine(val => !val || val.trim().length === 0 || isValidPhone(val), {
    message: 'Le format du téléphone n\'est pas valide (ex: 06 12 34 56 78)'
  }),
  address: z.string().max(500, 'L\'adresse ne peut pas dépasser 500 caractères').optional(),
  weight: numericString(0, 1000, 'Le poids').optional(),
  height: numericString(0, 300, 'La taille').optional(),
  diseases: z.string().max(1000, 'Les maladies ne peuvent pas dépasser 1000 caractères').optional(),
  medical_history: z.string().max(2000, 'Les antécédents médicaux ne peuvent pas dépasser 2000 caractères').optional(),
  allergies: z.string().optional(),
  status: z.enum(['actif', 'inactif']).optional(),
});

// Schéma de mise à jour d'un patient — tous les champs optionnels, mais validés s'ils sont fournis
export const patientUpdateFormSchema = z.object({
  firstName: z.string().trim()
    .min(1, 'Le prénom ne peut pas être vide')
    .min(2, 'Le prénom doit contenir au moins 2 caractères')
    .max(50, 'Le prénom ne peut pas dépasser 50 caractères')
    .optional(),
  lastName: z.string().trim()
    .min(1, 'Le nom ne peut pas être vide')
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(50, 'Le nom ne peut pas dépasser 50 caractères')
    .optional(),
  gender: z.enum(['M', 'F']).optional(),
  age: z.string().trim()
    .min(1, 'L\'âge ne peut pas être vide')
    .refine(val => {
      const age = parseInt(val);
      return !isNaN(age) && age >= 0 && age <= 150;
    }, { message: 'L\'âge doit être un nombre entre 0 et 150' })
    .optional(),
  date_of_birth: z.string().optional(),
  phone: z.string().optional().refine(val => !val || val.trim().length === 0 || isValidPhone(val), {
    message: 'Le format du téléphone n\'est pas valide (ex: 06 12 34 56 78)'
  }),
  address: z.string().max(500, 'L\'adresse ne peut pas dépasser 500 caractères').optional(),
  weight: numericString(0, 1000, 'Le poids').optional(),
  height: numericString(0, 300, 'La taille').optional(),
  diseases: z.string().max(1000, 'Les maladies ne peuvent pas dépasser 1000 caractères').optional(),
  medical_history: z.string().max(2000, 'Les antécédents médicaux ne peuvent pas dépasser 2000 caractères').optional(),
  allergies: z.string().optional(),
  status: z.enum(['actif', 'inactif']).optional(),
});

/**
 * Valide les données d'un formulaire patient
 */
export const validatePatientForm = (data: PatientFormData): ValidationResult => {
  return toValidationResult(patientFormSchema.safeParse(data));
};

/**
 * Valide les données de mise à jour d'un patient (tous les champs sont optionnels)
 */
export const validatePatientUpdateForm = (data: Partial<PatientFormData>): ValidationResult => {
  return toValidationResult(patientUpdateFormSchema.safeParse(data));
};

/**
 * Formate un numéro de téléphone français
 */
export const formatPhoneNumber = (phone: string): string => {
  // Supprime tous les caractères non numériques
  const cleaned = phone.replace(/\D/g, '');

  // Formate en 06 12 34 56 78
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
  }

  return phone; // Retourne tel quel si le format n'est pas reconnu
};

/**
 * Calcule l'âge à partir d'une date de naissance
 */
export const calculateAge = (birthDate?: string | null): number => {
  if (!birthDate) return 0;
  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return isNaN(age) || age < 0 ? 0 : age;
};
