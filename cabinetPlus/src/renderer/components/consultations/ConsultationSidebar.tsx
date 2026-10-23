import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { User, ShieldAlert, Stethoscope, History, Loader2 } from "lucide-react";
import { Patient, ConsultationVitals, ConsultationDiagnostics, TreatmentLine, ConsultationCarePlan } from "../../../shared/types";
import { calculateAge } from "../../utils/validation";
import { composeDiagnosticPreview } from "../../utils/consultationText";
import { addDaysToDate } from "../../utils/carePlan";
import { usePatientConsultations } from "../../hooks/useConsultations";
import { useConsultationDocuments } from "../../hooks/useConsultationDocuments";
import { PatientDebtAlert } from "../patients/PatientDebtAlert";
import { ConsultationUI, getStatusBadge, convertConsultationToUI, resolveDiagnostics } from "./consultationMappers";
import { ConsultationHistoryViewDialog } from "./ConsultationHistoryViewDialog";

const MAX_HISTORY_ITEMS = 5;

interface ConsultationSidebarProps {
  patient: Patient | null;
  motif: string;
  vitals: ConsultationVitals;
  diagnostics: ConsultationDiagnostics;
  treatmentLines: TreatmentLine[];
  carePlan: ConsultationCarePlan;
  consultationDate: string;
  editingConsultationId: number | null;
}

const SidebarCard = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
  <Card className="border-border">
    <CardHeader className="p-3 pb-1.5">
      <CardTitle className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {icon}
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="p-3 pt-1.5 text-sm text-foreground">
      {children}
    </CardContent>
  </Card>
);

/**
 * Panneau latéral de résumé + historique — cf. PLAN_CONSULTATION.md L13.
 * Purement dérivé des props (`formData` du formulaire en cours) et de la
 * fiche patient : aucun état propre au formulaire, pour que chaque bloc se
 * mette à jour en direct sans aller-retour. L'historique et le nombre de
 * documents sont chargés séparément (mêmes hooks que `ConsultationPatientHeader`
 * L3.2 et `ConsultationDocumentsSection` L11) selon le même principe déjà
 * établi : chaque composant appelle lui-même les données dont il a besoin.
 */
export const ConsultationSidebar = ({
  patient,
  motif,
  vitals,
  diagnostics,
  treatmentLines,
  carePlan,
  consultationDate,
  editingConsultationId,
}: ConsultationSidebarProps) => {
  const { consultations: history, isLoading: historyLoading } = usePatientConsultations(patient?.id ?? null);
  const { documents, loadByConsultation } = useConsultationDocuments();
  const [historyViewTarget, setHistoryViewTarget] = useState<ConsultationUI | null>(null);

  useEffect(() => {
    if (editingConsultationId) loadByConsultation(editingConsultationId);
  }, [editingConsultationId, loadByConsultation]);

  if (!patient) return null;

  const age = calculateAge(patient.date_of_birth);
  const diagnosticText = composeDiagnosticPreview(diagnostics);
  const controlDate = carePlan.control_days ? addDaysToDate(consultationDate, carePlan.control_days) : null;

  const pastConsultations = history
    .filter(c => c.id !== editingConsultationId)
    .sort((a, b) => `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`))
    .slice(0, MAX_HISTORY_ITEMS);

  const hasAlert = Boolean(patient.allergies?.trim() || patient.chronic_diseases?.trim());

  return (
    <div className="space-y-3">
      <SidebarCard title="Patient" icon={<User className="w-3.5 h-3.5" />}>
        <p className="font-semibold">{patient.first_name} {patient.last_name}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {age} ans · {patient.gender === 'F' ? 'Féminin' : 'Masculin'}
        </p>
      </SidebarCard>

      <SidebarCard title="Alertes" icon={<ShieldAlert className="w-3.5 h-3.5" />}>
        <div className="space-y-2">
          {patient.allergies?.trim() && (
            <p className="text-xs bg-red-50 text-red-900 border border-red-200 rounded-md p-2">
              <span className="font-bold">Allergies :</span> {patient.allergies}
            </p>
          )}
          {patient.chronic_diseases?.trim() && (
            <p className="text-xs bg-amber-50 text-amber-900 border border-amber-200 rounded-md p-2">
              <span className="font-bold">Maladies chroniques :</span> {patient.chronic_diseases}
            </p>
          )}
          <PatientDebtAlert patientId={patient.id} compact />
          {!hasAlert && <p className="text-xs text-muted-foreground italic">Aucune alerte</p>}
        </div>
      </SidebarCard>

      <SidebarCard title="Consultation" icon={<Stethoscope className="w-3.5 h-3.5" />}>
        <dl className="space-y-1 text-xs">
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Motif</dt>
            <dd className="text-right font-medium truncate max-w-[65%]">{motif || '—'}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">TA</dt>
            <dd className="text-right font-medium">
              {vitals.blood_pressure_systolic && vitals.blood_pressure_diastolic
                ? `${vitals.blood_pressure_systolic}/${vitals.blood_pressure_diastolic} mmHg`
                : '—'}
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Température</dt>
            <dd className="text-right font-medium">{vitals.temperature ? `${vitals.temperature} °C` : '—'}</dd>
          </div>
        </dl>
      </SidebarCard>

      <SidebarCard title="Synthèse" icon={<Stethoscope className="w-3.5 h-3.5" />}>
        <dl className="space-y-1 text-xs">
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Diagnostic</dt>
            <dd className="text-right font-medium truncate max-w-[65%]">{diagnosticText || '—'}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Traitement</dt>
            <dd className="text-right font-medium">
              {treatmentLines.length > 0 ? `${treatmentLines.length} médicament${treatmentLines.length > 1 ? 's' : ''}` : 'Aucun'}
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Documents</dt>
            <dd className="text-right font-medium">
              {editingConsultationId ? documents.length : '—'}
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Suivi</dt>
            <dd className="text-right font-medium">
              {controlDate ? `Contrôle : ${format(parseISO(controlDate), 'dd/MM')}` : '—'}
            </dd>
          </div>
        </dl>
      </SidebarCard>

      <SidebarCard title="Historique" icon={<History className="w-3.5 h-3.5" />}>
        {historyLoading ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Chargement...
          </div>
        ) : pastConsultations.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">Aucune consultation antérieure</p>
        ) : (
          <ul className="space-y-1.5">
            {pastConsultations.map((c) => {
              const ui = convertConsultationToUI(c);
              const pastDiagnostic = composeDiagnosticPreview(resolveDiagnostics(ui));
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setHistoryViewTarget(ui)}
                    className="w-full text-left text-xs rounded-md border border-border p-2 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{new Date(c.date).toLocaleDateString('fr-FR')}</span>
                      {getStatusBadge(c.status)}
                    </div>
                    {ui.motif && <p className="text-muted-foreground truncate mt-0.5">{ui.motif}</p>}
                    {pastDiagnostic && <p className="text-muted-foreground truncate">Diagnostic : {pastDiagnostic}</p>}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </SidebarCard>

      <ConsultationHistoryViewDialog
        open={historyViewTarget !== null}
        onOpenChange={(open) => !open && setHistoryViewTarget(null)}
        consultation={historyViewTarget}
      />
    </div>
  );
};
