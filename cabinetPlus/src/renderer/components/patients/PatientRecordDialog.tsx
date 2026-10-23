import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import { Loader2, FolderOpen } from "lucide-react";
import { Consultation, Prescription } from "../../../shared/types";
import { usePatients } from "../../hooks/usePatients";
import { useConsultations } from "../../hooks/useConsultations";
import { usePrescriptions } from "../../hooks/usePrescriptions";
import { usePermissions } from "../../hooks/usePermissions";
import { PatientDetail } from "./PatientDetail";
import { PatientUI, convertPatientToUI } from "./patientMappers";

interface PatientRecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: number | null;
}

/**
 * Consultation en lecture seule du dossier d'un patient, dans une fenêtre
 * superposée — pour pouvoir le vérifier sans quitter (et sans perdre) un
 * écran en cours (ex. une consultation en train d'être saisie).
 *
 * Si le dossier n'a aucun historique (aucune consultation, aucune
 * ordonnance, aucune information médicale), affiche un bandeau « Dossier
 * vide » plutôt qu'un écran silencieusement clairsemé.
 */
export const PatientRecordDialog = ({ open, onOpenChange, patientId }: PatientRecordDialogProps) => {
  const { getPatientById } = usePatients();
  const { getConsultationsByPatient } = useConsultations();
  const { getPrescriptionsByPatientId } = usePrescriptions();
  const permissions = usePermissions();

  const [patient, setPatient] = useState<PatientUI | null>(null);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!open || !patientId) return;

    let cancelled = false;
    setIsLoading(true);
    setNotFound(false);

    (async () => {
      try {
        const [rawPatient, consultationsData, prescriptionsData] = await Promise.all([
          getPatientById(patientId),
          getConsultationsByPatient(patientId),
          getPrescriptionsByPatientId(patientId),
        ]);
        if (cancelled) return;

        if (!rawPatient) {
          setNotFound(true);
          setPatient(null);
        } else {
          setPatient(convertPatientToUI(rawPatient));
        }
        setConsultations(consultationsData || []);
        setPrescriptions(prescriptionsData || []);
      } catch (error) {
        console.error('Erreur chargement du dossier patient:', error);
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [open, patientId, getPatientById, getConsultationsByPatient, getPrescriptionsByPatientId]);

  const hasMedicalInfo = Boolean(
    patient?.diseases || patient?.medical_history || patient?.allergies || patient?.chronic_diseases
  );
  const isEmptyDossier = Boolean(
    patient && !isLoading && consultations.length === 0 && prescriptions.length === 0 && !hasMedicalInfo
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[96vw] w-[96vw] xl:max-w-[1300px] h-[92vh] max-h-[92vh] flex flex-col overflow-hidden p-0">
        <DialogTitle className="sr-only">Dossier du patient</DialogTitle>
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Chargement du dossier...</span>
          </div>
        ) : notFound || !patient ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 text-muted-foreground p-8">
            <FolderOpen className="w-10 h-10 mb-2" />
            <p className="text-base font-bold text-foreground">Dossier vide</p>
            <p className="text-sm text-center max-w-sm">
              Ce patient est introuvable ou son dossier n'a pas pu être chargé.
            </p>
          </div>
        ) : (
          <PatientDetail
            patient={patient}
            patientConsultations={consultations}
            patientPrescriptions={prescriptions}
            canCreateConsultation={false}
            canViewPrescriptions={permissions.canViewPrescriptions}
            onBack={() => onOpenChange(false)}
            readOnly
            emptyBanner={isEmptyDossier}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
