import { useEffect, useState } from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Weight, FolderOpen, Pencil, Check, X, Loader2 } from "lucide-react";
import { Patient, Consultation } from "../../../shared/types";
import { calculateAge } from "../../utils/validation";
import { usePatients } from "../../hooks/usePatients";
import { useConsultations } from "../../hooks/useConsultations";
import { useToast } from "../../hooks/use-toast";
import { PatientHealthAlert } from "../patients/PatientHealthAlert";
import { PatientDebtAlert } from "../patients/PatientDebtAlert";
import { PatientRecordDialog } from "../patients/PatientRecordDialog";
import { formatAppointmentDisplay } from "../../utils/carePlan";

interface ConsultationPatientHeaderProps {
  patient: Patient;
  /** Notifié quand le poids est mis à jour en ligne, pour propager le patient à jour au parent. */
  onPatientUpdated: (patient: Patient) => void;
}

/**
 * En-tête patient affiché en début de consultation : identité, sexe, âge,
 * poids (modifiable en ligne), groupe sanguin, dernière consultation, et
 * accès au dossier complet — cf. todo_consultation.
 */
export const ConsultationPatientHeader = ({ patient, onPatientUpdated }: ConsultationPatientHeaderProps) => {
  const { updatePatient } = usePatients();
  const { getConsultationsByPatient } = useConsultations();
  const { toast } = useToast();

  const [lastConsultation, setLastConsultation] = useState<Consultation | null>(null);
  const [isLoadingLast, setIsLoadingLast] = useState(true);
  const [recordDialogOpen, setRecordDialogOpen] = useState(false);

  const [editingWeight, setEditingWeight] = useState(false);
  const [weightDraft, setWeightDraft] = useState(patient.weight?.toString() || '');
  const [isSavingWeight, setIsSavingWeight] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoadingLast(true);

    getConsultationsByPatient(patient.id)
      .then(list => {
        if (cancelled) return;
        const sorted = [...(list || [])].sort((a, b) =>
          `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`)
        );
        setLastConsultation(sorted[0] || null);
      })
      .catch(err => {
        console.error('Erreur chargement de la dernière consultation:', err);
        if (!cancelled) setLastConsultation(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingLast(false);
      });

    return () => { cancelled = true; };
  }, [patient.id, getConsultationsByPatient]);

  useEffect(() => {
    setWeightDraft(patient.weight?.toString() || '');
  }, [patient.id, patient.weight]);

  const saveWeight = async () => {
    const trimmed = weightDraft.trim();
    const parsed = trimmed ? parseFloat(trimmed) : undefined;

    if (trimmed && (parsed === undefined || isNaN(parsed) || parsed <= 0 || parsed > 1000)) {
      toast({ title: "Poids invalide", description: "Le poids doit être un nombre entre 0 et 1000 kg.", variant: "destructive" });
      return;
    }

    setIsSavingWeight(true);
    try {
      const updated = await updatePatient(patient.id, { weight: parsed });
      onPatientUpdated(updated);
      setEditingWeight(false);
      toast({ title: "Poids mis à jour", description: `${updated.first_name} ${updated.last_name} — ${parsed ? `${parsed} kg` : 'poids effacé'}.` });
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de mettre à jour le poids",
        variant: "destructive",
      });
    } finally {
      setIsSavingWeight(false);
    }
  };

  const cancelWeightEdit = () => {
    setWeightDraft(patient.weight?.toString() || '');
    setEditingWeight(false);
  };

  const age = calculateAge(patient.date_of_birth);

  return (
    <Card className="border-border">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${
              patient.gender === 'F' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'
            }`}>
              {patient.gender === 'F' ? 'Mme' : 'M.'}
            </div>
            <div>
              <div className="font-semibold text-foreground leading-tight">
                {patient.first_name} {patient.last_name}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
                <span>{age} ans</span>
                <span>·</span>
                <span>{patient.gender === 'F' ? 'Féminin' : 'Masculin'}</span>
                {patient.blood_group && (
                  <>
                    <span>·</span>
                    <Badge variant="outline" className="text-[10px] font-bold text-red-600 border-red-200 dark:border-red-950 px-1.5 py-0">
                      {patient.blood_group}
                    </Badge>
                  </>
                )}
                <span>·</span>
                {editingWeight ? (
                  <span className="inline-flex items-center gap-1">
                    <Weight className="w-3.5 h-3.5" />
                    <Input
                      type="number"
                      step="0.1"
                      value={weightDraft}
                      onChange={(e) => setWeightDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { e.preventDefault(); saveWeight(); }
                        if (e.key === 'Escape') { e.preventDefault(); cancelWeightEdit(); }
                      }}
                      autoFocus
                      className="h-6 w-20 text-xs px-1.5 py-0"
                      disabled={isSavingWeight}
                    />
                    <span>kg</span>
                    <Button type="button" size="icon-sm" variant="ghost" className="h-5 w-5" onClick={saveWeight} disabled={isSavingWeight}>
                      {isSavingWeight ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3 text-success" />}
                    </Button>
                    <Button type="button" size="icon-sm" variant="ghost" className="h-5 w-5" onClick={cancelWeightEdit} disabled={isSavingWeight}>
                      <X className="w-3 h-3 text-muted-foreground" />
                    </Button>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditingWeight(true)}
                    className="inline-flex items-center gap-1 hover:text-foreground underline decoration-dotted underline-offset-2"
                  >
                    <Weight className="w-3.5 h-3.5" />
                    {patient.weight ? `${patient.weight} kg` : 'Poids non renseigné'}
                    <Pencil className="w-2.5 h-2.5 opacity-50" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setRecordDialogOpen(true)}
          >
            <FolderOpen className="w-4 h-4" />
            Dossier du patient
          </Button>
        </div>

        <div className="text-xs pt-2 border-t border-border">
          <span className="font-semibold text-muted-foreground">Dernière consultation : </span>
          {isLoadingLast ? (
            <span className="text-muted-foreground">Chargement...</span>
          ) : lastConsultation ? (
            <span className="text-foreground">
              {new Date(lastConsultation.date).toLocaleDateString('fr-FR')}
              {lastConsultation.motif && ` — ${lastConsultation.motif}`}
              {lastConsultation.diagnostic && ` — ${lastConsultation.diagnostic}`}
            </span>
          ) : (
            <span className="text-muted-foreground italic">Aucune consultation antérieure</span>
          )}
          {lastConsultation?.next_appointment_date && lastConsultation?.next_appointment_time && (
            <div className="mt-1">
              <span className="font-semibold text-muted-foreground">Prochain rendez-vous : </span>
              <span className="text-foreground">
                {formatAppointmentDisplay(lastConsultation.next_appointment_date, lastConsultation.next_appointment_time)}
              </span>
            </div>
          )}
        </div>

        <PatientHealthAlert patient={patient} />
        <PatientDebtAlert patientId={patient.id} compact />
      </CardContent>

      <PatientRecordDialog
        open={recordDialogOpen}
        onOpenChange={setRecordDialogOpen}
        patientId={patient.id}
      />
    </Card>
  );
};
