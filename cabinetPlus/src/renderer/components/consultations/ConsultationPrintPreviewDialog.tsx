import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Printer, FileText } from "lucide-react";
import { Patient } from "../../../shared/types";
import { useSettings } from "../../hooks/useSettings";
import { useCabinetLogo } from "../../hooks/useCabinetLogo";
import { useAuth } from "../../hooks/useAuth";

interface ConsultationPrintPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: Patient | null;
  consultationData: {
    date: string;
    time: string;
    motif: string;
    diagnostic?: string;
    traitement?: string;
    notes?: string;
  };
}

export const ConsultationPrintPreviewDialog = ({
  open,
  onOpenChange,
  patient,
  consultationData
}: ConsultationPrintPreviewDialogProps) => {
  const { getSetting } = useSettings();
  const { logoUrl, hasLogo } = useCabinetLogo();

  const { user } = useAuth();
  const doctorName = user && (user.first_name || user.last_name)
    ? `Dr. ${user.first_name || ''} ${user.last_name || ''}`.trim()
    : (getSetting("doctor_first_name") && getSetting("doctor_last_name")
        ? `Dr. ${getSetting("doctor_first_name")} ${getSetting("doctor_last_name")}`
        : getSetting("doctor_name", "Dr. [Nom du Médecin]"));
  const doctorSpeciality = user?.speciality || getSetting("doctor_speciality", "Médecine Générale");
  const cabinetName = getSetting("cabinet_name", "Cabinet Médical");
  const cabinetAddress = getSetting("cabinet_address", "");
  const cabinetPhone = getSetting("cabinet_phone", "");

  const patientFullName = patient ? `${patient.first_name} ${patient.last_name}` : "Patient";

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Printer className="w-5 h-5 text-primary" />
            Impression de la Fiche de Consultation
          </DialogTitle>
        </DialogHeader>

        <div className="printable-document p-8 bg-white text-gray-900 rounded-xl border-2 border-primary/20 shadow-lg space-y-6 min-h-[650px] flex flex-col justify-between font-sans">
          <div className="flex justify-between items-start border-b pb-4">
            <div>
              <h2 className="text-lg font-bold uppercase">{doctorName}</h2>
              <p className="text-sm text-gray-600">{doctorSpeciality}</p>
              <p className="text-xs text-gray-500">{cabinetName} - {cabinetAddress}</p>
              <p className="text-xs text-gray-500">Tél: {cabinetPhone}</p>
            </div>
            {hasLogo && logoUrl && (
              <img src={logoUrl} alt="Logo Cabinet" className="w-16 h-16 object-contain" />
            )}
          </div>

          <div className="text-center my-4">
            <h1 className="text-2xl font-bold uppercase tracking-wider text-gray-900 border-b-2 border-gray-900 inline-block pb-1">
              RAPPORT DE CONSULTATION MEDICALE
            </h1>
          </div>

          <div className="grid grid-cols-2 text-sm text-gray-700 bg-gray-50 p-3 rounded border">
            <div>
              <p>Patient : <strong>{patientFullName}</strong></p>
              <p>Téléphone : {patient?.phone || 'Non renseigné'}</p>
            </div>
            <div className="text-right">
              <p>Date : <strong>{new Date(consultationData.date).toLocaleDateString("fr-FR")} à {consultationData.time}</strong></p>
            </div>
          </div>

          <div className="space-y-4">
            {consultationData.motif && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Motif de consultation</h3>
                <p className="text-base font-semibold text-gray-900 mt-1">{consultationData.motif}</p>
              </div>
            )}

            {consultationData.diagnostic && (
              <div className="border-t pt-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Diagnostic Médical</h3>
                <p className="text-sm text-gray-800 mt-1 whitespace-pre-line">{consultationData.diagnostic}</p>
              </div>
            )}

            {consultationData.traitement && (
              <div className="border-t pt-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Traitement Prescrit</h3>
                <p className="text-sm text-gray-800 mt-1 whitespace-pre-line">{consultationData.traitement}</p>
              </div>
            )}

            {consultationData.notes && (
              <div className="border-t pt-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Notes Additionnelles</h3>
                <p className="text-xs text-gray-600 mt-1 whitespace-pre-line italic">{consultationData.notes}</p>
              </div>
            )}
          </div>

          <div className="pt-10 text-right">
            <p className="text-sm font-semibold">Signature & Cachet du Médecin</p>
            <div className="h-16"></div>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-end gap-2 pt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Fermer
          </Button>

          <Button
            type="button"
            onClick={handlePrint}
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5"
          >
            <Printer className="w-4 h-4" />
            Imprimer / PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
