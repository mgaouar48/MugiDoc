import { useState } from "react";
import { CalendarPlus } from "lucide-react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { TimePicker } from "../ui/time-picker";
import { ConsultationCarePlan, Patient } from "../../../shared/types";
import { ConsultationSection } from "./ConsultationSection";
import { useAppointments } from "../../hooks/useAppointments";
import { useToast } from "../../hooks/use-toast";
import { currentTime } from "../../utils/timeSlots";
import { addDaysToDate, formatDateFr, formatAppointmentDisplay } from "../../utils/carePlan";

interface NextAppointmentInfo {
  id?: number;
  date?: string;
  time?: string;
}

interface CarePlanSectionProps {
  value: ConsultationCarePlan;
  onChange: (value: ConsultationCarePlan) => void;
  /** Date de la consultation — base du calcul des dates de repos/contrôle. */
  consultationDate: string;
  patient: Patient | null;
  nextAppointment: NextAppointmentInfo;
  onAppointmentScheduled: (appt: { id: number; date: string; time: string }) => void;
  onAppointmentCleared: () => void;
  disabled?: boolean;
}

const REST_DEFAULT_DAYS = 3;
const CONTROL_DEFAULT_DAYS = 7;

const plural = (n: number) => (n > 1 ? 's' : '');

/** Ajoute `line` en fin de texte si elle n'y figure pas déjà (clic répété idempotent). */
const appendLine = (text: string | undefined, line: string): string => {
  const lines = (text || '').split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.includes(line)) return lines.join('\n');
  return [...lines, line].join('\n');
};

/**
 * Plan / conduite à tenir — cf. PLAN_CONSULTATION.md L12. Texte libre assisté
 * de modèles rapides + deux champs "nombre de jours" (repos, contrôle) dont
 * la date n'est jamais mémorisée, seulement calculée à l'affichage
 * (`utils/carePlan.ts`). Le rendez-vous de contrôle est une donnée séparée
 * (`next_appointment_*`) : le planifier crée un vrai rendez-vous
 * (`appointments.create`), il ne se déduit pas seulement de `control_days`.
 */
export const CarePlanSection = ({
  value,
  onChange,
  consultationDate,
  patient,
  nextAppointment,
  onAppointmentScheduled,
  onAppointmentCleared,
  disabled,
}: CarePlanSectionProps) => {
  const { createAppointment } = useAppointments();
  const { toast } = useToast();
  const [isScheduling, setIsScheduling] = useState(false);
  const [draftDate, setDraftDate] = useState('');
  const [draftTime, setDraftTime] = useState(currentTime());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasAppointment = Boolean(nextAppointment.id && nextAppointment.date && nextAppointment.time);
  const isEmpty = !value.text && !value.rest_days && !value.control_days && !hasAppointment;
  const summary = value.text ? value.text.split('\n')[0] : undefined;

  const restUntil = value.rest_days ? addDaysToDate(consultationDate, value.rest_days) : null;
  const controlDate = value.control_days ? addDaysToDate(consultationDate, value.control_days) : null;

  const setField = <K extends keyof ConsultationCarePlan>(field: K, v: ConsultationCarePlan[K]) => {
    onChange({ ...value, [field]: v });
  };

  const applySymptomaticTemplate = () => {
    onChange({ ...value, text: appendLine(value.text, 'Traitement symptomatique + hydratation') });
  };

  const applyRestTemplate = () => {
    const days = value.rest_days || REST_DEFAULT_DAYS;
    onChange({ ...value, rest_days: days, text: appendLine(value.text, `Repos ${days} jour${plural(days)}`) });
  };

  const applyControlTemplate = () => {
    const days = value.control_days || CONTROL_DEFAULT_DAYS;
    onChange({ ...value, control_days: days, text: appendLine(value.text, `Contrôle dans ${days} jour${plural(days)}`) });
  };

  const openScheduler = () => {
    setDraftDate(controlDate || consultationDate);
    setDraftTime(currentTime());
    setIsScheduling(true);
  };

  const handleSchedule = async () => {
    if (!patient || !draftDate || !draftTime) return;
    setIsSubmitting(true);
    try {
      const created = await createAppointment({
        patient_id: patient.id,
        date: draftDate,
        time: draftTime,
        type: 'Contrôle',
      });
      onAppointmentScheduled({ id: created.id, date: created.date, time: created.time });
      setIsScheduling(false);
      toast({ title: "Rendez-vous planifié", description: `Prochain rendez-vous : ${formatAppointmentDisplay(created.date, created.time)}.` });
    } catch (error) {
      toast({
        title: "Impossible de planifier ce rendez-vous",
        description: error instanceof Error ? error.message : "Ce créneau est peut-être déjà occupé.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ConsultationSection title="Plan / conduite à tenir" summary={summary} defaultOpen={!isEmpty}>
      <div className="space-y-1.5">
        <Label className="text-xs font-normal text-muted-foreground">Conduite à tenir</Label>
        <Textarea
          value={value.text || ''}
          onChange={(e) => setField('text', e.target.value || undefined)}
          placeholder="Conduite à tenir, conseils, surveillance..."
          rows={3}
          disabled={disabled}
          className="text-sm"
        />
        <div className="flex flex-wrap gap-1.5">
          <button type="button" onClick={applySymptomaticTemplate} disabled={disabled} className="text-xs px-2 py-0.5 rounded-full border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            Traitement symptomatique + hydratation
          </button>
          <button type="button" onClick={applyRestTemplate} disabled={disabled} className="text-xs px-2 py-0.5 rounded-full border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            Repos {value.rest_days || REST_DEFAULT_DAYS} jour{plural(value.rest_days || REST_DEFAULT_DAYS)}
          </button>
          <button type="button" onClick={applyControlTemplate} disabled={disabled} className="text-xs px-2 py-0.5 rounded-full border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            Contrôle dans {value.control_days || CONTROL_DEFAULT_DAYS} jour{plural(value.control_days || CONTROL_DEFAULT_DAYS)}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-normal text-muted-foreground">Repos (jours)</Label>
          <Input
            type="number"
            min={0}
            value={value.rest_days ?? ''}
            onChange={(e) => setField('rest_days', e.target.value ? parseInt(e.target.value, 10) : undefined)}
            onWheel={(e) => (e.target as HTMLInputElement).blur()}
            disabled={disabled}
            className="h-9 text-sm"
          />
          {restUntil && (
            <p className="text-xs text-muted-foreground">Jusqu'au {formatDateFr(restUntil)}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-normal text-muted-foreground">Contrôle dans (jours)</Label>
          <Input
            type="number"
            min={0}
            value={value.control_days ?? ''}
            onChange={(e) => setField('control_days', e.target.value ? parseInt(e.target.value, 10) : undefined)}
            onWheel={(e) => (e.target as HTMLInputElement).blur()}
            disabled={disabled}
            className="h-9 text-sm"
          />
          {controlDate && (
            <p className="text-xs text-muted-foreground">Conseillé le {formatDateFr(controlDate)}</p>
          )}
        </div>
      </div>

      <div className="pt-2 border-t border-border/60 space-y-2">
        <Label className="text-xs font-normal text-muted-foreground">Prochain rendez-vous</Label>
        {hasAppointment ? (
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="font-medium text-foreground">
              {formatAppointmentDisplay(nextAppointment.date!, nextAppointment.time!)}
            </span>
            <button type="button" onClick={onAppointmentCleared} disabled={disabled} className="text-xs text-muted-foreground hover:text-destructive">
              Changer
            </button>
          </div>
        ) : isScheduling ? (
          <div className="flex flex-wrap items-end gap-2">
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Date</Label>
              <Input type="date" value={draftDate} onChange={(e) => setDraftDate(e.target.value)} disabled={disabled || isSubmitting} className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Heure</Label>
              <TimePicker value={draftTime} onChange={setDraftTime} disabled={disabled || isSubmitting} />
            </div>
            <Button type="button" size="sm" onClick={handleSchedule} disabled={disabled || isSubmitting || !patient || !draftDate || !draftTime}>
              <CalendarPlus className="w-4 h-4" />
              Planifier
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setIsScheduling(false)} disabled={disabled || isSubmitting}>
              Annuler
            </Button>
          </div>
        ) : (
          <>
            <Button type="button" variant="outline" size="sm" onClick={openScheduler} disabled={disabled || !patient}>
              <CalendarPlus className="w-4 h-4" />
              Planifier un rendez-vous
            </Button>
            {!patient && (
              <p className="text-xs text-muted-foreground">Sélectionnez un patient pour planifier un rendez-vous.</p>
            )}
          </>
        )}
      </div>
    </ConsultationSection>
  );
};
