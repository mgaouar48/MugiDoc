// Validation du formulaire de rendez-vous

import { z } from 'zod';
import { ValidationResult } from './validation';

export interface AppointmentFormData {
  date: Date;
  time: string;
  type: string;
  notes?: string;
}

export const appointmentFormSchema = z.object({
  date: z.date({ required_error: 'La date est obligatoire', invalid_type_error: 'La date est obligatoire' }),
  time: z.string()
    .min(1, "L'heure est obligatoire")
    .regex(/^\d{2}:\d{2}$/, "Le format de l'heure n'est pas valide"),
  type: z.string().trim()
    .min(1, 'Le type de rendez-vous est obligatoire')
    .max(100, 'Le type de rendez-vous ne peut pas dépasser 100 caractères'),
  notes: z.string().max(1000, 'Les notes ne peuvent pas dépasser 1000 caractères').optional(),
});

/**
 * Valide les données du formulaire de rendez-vous (date/heure/type/notes).
 * Ne remplace pas les vérifications de pré-requis (patient sélectionné, horaires
 * de travail chargés) qui restent des gardes séparées avant l'appel.
 */
export const validateAppointmentForm = (data: AppointmentFormData): ValidationResult => {
  const result = appointmentFormSchema.safeParse(data);
  if (result.success) {
    return { isValid: true, errors: [] };
  }
  return { isValid: false, errors: result.error.issues.map(issue => issue.message) };
};
