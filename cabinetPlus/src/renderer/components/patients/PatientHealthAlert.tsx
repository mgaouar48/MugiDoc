import React from 'react';
import { AlertTriangle, Activity, ShieldAlert } from 'lucide-react';
import { Patient } from '../../../shared/types';

interface PatientHealthAlertProps {
  patient: Patient | null;
  className?: string;
}

export const PatientHealthAlert: React.FC<PatientHealthAlertProps> = ({ patient, className = '' }) => {
  if (!patient) return null;

  const hasDiseases = Boolean(patient.diseases && patient.diseases.trim());
  const hasHistory = Boolean(patient.medical_history && patient.medical_history.trim());

  if (!hasDiseases && !hasHistory) return null;

  const fullText = `${patient.diseases || ''} ${patient.medical_history || ''}`.toLowerCase();
  
  const isCritical = fullText.includes('allergie') || 
                     fullText.includes('penicilline') || 
                     fullText.includes('pénicilline') || 
                     fullText.includes('grossesse') || 
                     fullText.includes('insuffisance') ||
                     fullText.includes('asthme');

  return (
    <div 
      className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
        isCritical 
          ? 'bg-red-50/90 border-red-200 text-red-900' 
          : 'bg-amber-50/90 border-amber-200 text-amber-900'
      } ${className}`}
    >
      <div className={`p-2 rounded-lg flex-shrink-0 ${isCritical ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
        {isCritical ? <ShieldAlert className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="text-xs font-bold uppercase tracking-wider">
            {isCritical ? 'Alerte Médicale & Contre-indications' : 'Antécédents & Pathologies du Patient'}
          </h4>
        </div>
        
        {patient.diseases && (
          <p className="text-xs font-medium leading-relaxed">
            <span className="font-bold">Maladies actuelles :</span> {patient.diseases}
          </p>
        )}
        
        {patient.medical_history && (
          <p className="text-xs font-medium leading-relaxed mt-0.5">
            <span className="font-bold">Antécédents / Allergies :</span> {patient.medical_history}
          </p>
        )}
      </div>
    </div>
  );
};
