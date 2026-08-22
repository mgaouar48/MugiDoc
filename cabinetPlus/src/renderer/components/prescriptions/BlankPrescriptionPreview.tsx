import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { ArrowLeft, Printer, Download } from 'lucide-react';
import { useSettings } from '../../hooks/useSettings';
import { useCabinetLogo } from '../../hooks/useCabinetLogo';
import { useAuth } from '../../hooks/useAuth';

interface BlankPrescriptionPreviewProps {
  onBack: () => void;
  onPrint?: () => void;
}

export const BlankPrescriptionPreview = ({ 
  onBack, 
  onPrint 
}: BlankPrescriptionPreviewProps) => {
  const [doctorInfo, setDoctorInfo] = useState<any>(null);
  const { settings, loadSettings, getSetting } = useSettings();
  const { logoUrl, hasLogo } = useCabinetLogo();
  const { user } = useAuth();

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    let fullName = '';
    let specialty = user?.speciality || getSetting('doctor_speciality', '');

    if (user && (user.first_name || user.last_name)) {
      fullName = `DR. ${(user.first_name || '').toUpperCase()} ${(user.last_name || '').toUpperCase()}`.trim();
    } else if (settings && settings.length > 0) {
      const firstName = getSetting('doctor_first_name', '');
      const lastName = getSetting('doctor_last_name', '');
      if (firstName || lastName) {
        fullName = `DR. ${firstName.toUpperCase()} ${lastName.toUpperCase()}`.trim();
      } else {
        fullName = getSetting('doctor_name', '').toUpperCase();
      }
    }

    setDoctorInfo({
      name: fullName,
      specialty,
      address: getSetting('cabinet_address', ''),
      phone: getSetting('cabinet_phone', ''),
      email: getSetting('doctor_email', ''),
      cabinetName: getSetting('cabinet_name', '')
    });
  }, [settings, getSetting, user]);

  const handlePrint = () => {
    window.print();
    onPrint?.();
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

      {/* Contenu de l'ordonnance vierge - Format A5 */}
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
              <h1 className="text-3xl font-serif font-bold text-gray-800 mb-2 tracking-wide print:text-2xl" style={{fontFamily: 'Georgia, "Times New Roman", serif'}}>
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
          <div className="mb-4 flex justify-between">
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
            </div>
            
           
          </div>

          {/* Date avec points */}
          <div className="mb-5">
            <p className="text-sm">
              Date: ............................
            </p>
          </div>

          {/* Informations du patient avec points */}
          <div className="mb-5">
            <h2 className="text-sm font-semibold mb-3 text-gray-800">PATIENT</h2>
            <div className="space-y-2">
              <p className="text-sm">
                Nom: .................................................. Prénom: .............................................. Âge: .........
              </p>
            </div>
          </div>

          {/* Zone de prescription - Hauteur encore plus augmentée */}
          <div className="mb-6" style={{height: '425px', overflow: 'hidden'}}>
            <h2 className="text-sm font-semibold mb-4 text-gray-800"></h2>
            <div className="h-full">
              
            </div>
          </div>

          {/* Signature - Positionnement absolu en bas sans ligne de séparation */}
          <div className="absolute bottom-6 left-6 right-6 pt-4 bg-white print:bottom-3 print:left-3 print:right-3">
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

      {/* Styles d'impression pour format A5 */}
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
            .print\:bottom-3 { bottom: 0.75rem !important; }
            .print\:left-3 { left: 0.75rem !important; }
            .print\:right-3 { right: 0.75rem !important; }
            
            /* Assurer que les logos s'affichent correctement */
            img {
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        `
      }} />
    </div>
  );
};
