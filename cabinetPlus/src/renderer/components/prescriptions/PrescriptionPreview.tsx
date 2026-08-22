import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { ArrowLeft, Printer, Download } from 'lucide-react';
import { useSettings } from '../../hooks/useSettings';
import { useElectron } from '../../hooks/useElectron';
import { useCabinetLogo } from '../../hooks/useCabinetLogo';
import { useAuth } from '../../hooks/useAuth';
import { Prescription } from '../../../shared/types';

interface PrescriptionPreviewProps {
  prescription: Prescription;
  onBack: () => void;
  onPrint?: () => void;
}

export const PrescriptionPreview = ({ 
  prescription, 
  onBack, 
  onPrint 
}: PrescriptionPreviewProps) => {
  const [doctorInfo, setDoctorInfo] = useState<any>(null);
  const { settings, loadSettings, getSetting } = useSettings();
  const { logoUrl, hasLogo } = useCabinetLogo();
  const { user } = useAuth();

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    let fullName = '';
    let specialty = user?.speciality || getSetting('doctor_speciality', 'Médecine générale');

    if (user && (user.first_name || user.last_name)) {
      fullName = `DR. ${(user.first_name || '').toUpperCase()} ${(user.last_name || '').toUpperCase()}`.trim();
    } else if (settings && settings.length > 0) {
      const firstName = getSetting('doctor_first_name', '');
      const lastName = getSetting('doctor_last_name', '');
      if (firstName || lastName) {
        fullName = `DR. ${firstName.toUpperCase()} ${lastName.toUpperCase()}`.trim();
      } else {
        fullName = getSetting('doctor_name', 'DR. [NOM DU MÉDECIN]').toUpperCase();
      }
    }

    setDoctorInfo({
      name: fullName || 'DR. [NOM DU MÉDECIN]',
      specialty,
      address: getSetting('cabinet_address', '[Adresse du cabinet]'),
      phone: getSetting('cabinet_phone', '[Téléphone]'),
      email: getSetting('doctor_email', '[Email]'),
      cabinetName: getSetting('cabinet_name', 'Cabinet Médical')
    });
  }, [settings, getSetting, user]);

  const handlePrint = () => {
    window.print();
    onPrint?.();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  if (!doctorInfo) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header avec actions (masqué à l'impression) */}
      <div className="mb-6 print:hidden">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Imprimer
            </Button>
          </div>
        </div>
      </div>

      {/* Contenu de l'ordonnance - Format A5 */}
      <div className="w-[148mm] h-[210mm] mx-auto bg-white print:shadow-none print:max-w-none print:w-full print:h-full overflow-hidden">
        <div className="p-6 print:p-3 h-full relative">
          {/* En-tête avec deux logos et titre centré */}
          <div className="flex items-center justify-center mb-6 gap-4">
            {/* Premier logo */}
            {hasLogo && logoUrl && (
              <div className="flex-shrink-0">
                <img
                  src={logoUrl}
                  alt="Logo du cabinet"
                  className="w-16 h-16 object-contain print:w-12 print:h-12"
                />
              </div>
            )}
            
            {/* Titre ORDONNANCE avec police élégante */}
            <div className="text-center">
              <h1 className="text-3xl font-serif font-bold text-gray-800 mb-3 tracking-wide print:text-2xl" style={{fontFamily: 'Georgia, "Times New Roman", serif'}}>
                ORDONNANCE
              </h1>
            </div>
            
            {/* Deuxième logo */}
            {hasLogo && logoUrl && (
              <div className="flex-shrink-0">
                <img
                  src={logoUrl}
                  alt="Logo du cabinet"
                  className="w-16 h-16 object-contain print:w-14 print:h-14"
                />
              </div>
            )}
          </div>

          {/* Informations du médecin */}
          <div className="mb-2 flex justify-between">
            <div>
              {doctorInfo.name && (
                <h2 className="text-lg font-bold text-blue-800 mb-0.5 leading-tight">{doctorInfo.name}</h2>
              )}
              
              {doctorInfo.specialty && doctorInfo.specialty !== 'Médecine générale' && (
                <p className="text-sm font-semibold text-blue-600 mb-0.5 leading-tight">{doctorInfo.specialty}</p>
              )}
              
              {doctorInfo.cabinetName && (
                <p className="text-md text-gray-700 mb-0.5 leading-tight">{doctorInfo.cabinetName}</p>
              )}
              
              <div className="mt-3">
                <p className="text-xs text-gray-600">Date: {formatDate(prescription.date)}</p>
              </div>
            </div>
            
            
          </div>

          {/* Informations du patient */}
          <div className="mb-2">
            <h2 className="text-sm font-semibold mb-1.5 text-gray-800">PATIENT</h2>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm font-semibold">
                {prescription.patient?.first_name} {prescription.patient?.last_name}
                {prescription.patient?.date_of_birth && (
                  <span className="text-gray-600 font-normal ml-4">
                    Âge: {calculateAge(prescription.patient.date_of_birth)} ans
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Médicaments prescrits - Format traditionnel une ligne par médicament */}
          <div className="mb-4" style={{height: '448px', overflow: 'auto'}}>
            <h2 className="text-sm font-semibold mb-2 text-gray-800"></h2>
            <div className="space-y-4">
              {prescription.medications.map((medication, index) => (
                <div key={index} className="medication-item">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      {/* Nom du médicament en gras */}
                      <h3 className="text-base font-bold text-gray-900 mb-1 leading-tight">
                        {index + 1}. {medication.name}
                      </h3>
                      
                      {/* Informations de posologie et instructions sur la même ligne */}
                      <div className="ml-4 text-gray-700 text-sm leading-relaxed">
                        {(medication.dosage || medication.instructions) && (
                          <p className="mb-0.5">
                            {medication.dosage}
                            {medication.dosage && medication.instructions && ' / '}
                            {medication.instructions}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* QSP à droite */}
                    {medication.duration && (
                      <div className="ml-4 text-right flex-shrink-0">
                        <p className="text-sm font-semibold text-gray-800">
                          QSP {medication.duration}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
          </div>

          {/* Pied de page avec signature - Positionnement absolu en bas sans ligne de séparation */}
          <div className="absolute bottom-4 left-6 right-6 pt-4 bg-white print:bottom-2 print:left-3 print:right-3">
            <div className="flex justify-between items-end">
            <div className="text-xs text-gray-600 leading-tight text-left">
              {doctorInfo.phone && doctorInfo.phone !== '[Téléphone]' && <p className="mb-0.5">Tél: {doctorInfo.phone}</p>}
              {doctorInfo.address && doctorInfo.address !== '[Adresse du cabinet]' && <p className="mb-0.5">Adresse:{doctorInfo.address}</p>}
              {doctorInfo.email && doctorInfo.email !== '[Email]' && <p>Email: {doctorInfo.email}</p>}
            </div>
              <div className="text-center">
                <div className="h-12 w-32 border-b border-gray-400 mb-1"></div>
                <p className="text-xs font-semibold">signature</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Styles d'impression */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            @page {
              size: 148mm 210mm;
              margin: 0;
            }
            body { 
              margin: 0; 
              font-size: 10pt;
            }
            .print\:hidden { display: none !important; }
            .print\:shadow-none { box-shadow: none !important; }
            .print\:max-w-none { max-width: none !important; }
            .print\:w-full { width: 100% !important; }
            .print\:h-full { height: 100% !important; }
            .print\:p-3 { padding: 0.75rem !important; }
            .print\:w-12 { width: 3rem !important; }
            .print\:h-12 { height: 3rem !important; }
            .print\:text-2xl { font-size: 1.5rem !important; }
            .print\:bottom-2 { bottom: 0.5rem !important; }
            .print\:left-3 { left: 0.75rem !important; }
            .print\:right-3 { right: 0.75rem !important; }
            
            /* Assurer que les logos s'affichent correctement */
            img {
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
          
          /* Éviter les coupures de page dans les médicaments */
          .medication-item { 
            page-break-inside: avoid; 
            break-inside: avoid;
          }
          
          /* Forcer une nouvelle page si nécessaire */
          .page-break { 
            page-break-before: always; 
            break-before: page;
          }
        `
      }} />
    </div>
  );
};
