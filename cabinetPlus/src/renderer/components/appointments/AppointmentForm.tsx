import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Calendar as CalendarIcon, Plus, Edit, Loader2, AlertCircle } from "lucide-react";
import { PatientCombobox } from "../ui/patient-combobox";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Patient } from "../../../shared/types";
import { AppointmentUI, appointmentTypes } from "./appointmentMappers";

interface AppointmentFormData {
  date: Date;
  time: string;
  type: string;
  notes: string;
}

interface AppointmentFormProps {
  formData: AppointmentFormData;
  setFormData: (data: AppointmentFormData) => void;
  patients: Patient[];
  selectedPatient: Patient | null;
  setSelectedPatient: (patient: Patient | null) => void;
  editingAppointment: AppointmentUI | null;
  workingHours: { consultationDuration: number } | null;
  isWorkingDay: (date: Date) => boolean;
  displaySlots: string[];
  slotsLoading: boolean;
  fallbackSlots: string[];
  isLoading: boolean;
  onSubmit: () => void;
  onCancel: () => void;
}

export const AppointmentForm = ({
  formData,
  setFormData,
  patients,
  selectedPatient,
  setSelectedPatient,
  editingAppointment,
  workingHours,
  isWorkingDay,
  displaySlots,
  slotsLoading,
  fallbackSlots,
  isLoading,
  onSubmit,
  onCancel,
}: AppointmentFormProps) => {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border px-8 flex items-center" style={{ height: '64px' }}>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon-sm" onClick={onCancel}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                {editingAppointment ? "Modifier le Rendez-vous" : "Nouveau Rendez-vous"}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">Saisissez les détails du rendez-vous médical</p>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6 max-w-2xl mx-auto">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">
              {editingAppointment ? 'Modifier le Rendez-vous' : 'Nouveau Rendez-vous'}
            </CardTitle>
            <CardDescription>
              {editingAppointment
                ? 'Modifiez les informations du rendez-vous médical'
                : 'Saisissez les détails du nouveau rendez-vous médical'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Indicateur de chargement */}
            {isLoading && (
              <div className="flex items-center justify-center space-x-2 p-4">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Chargement...</span>
              </div>
            )}

            {/* Sélecteur de patient */}
            <div className="space-y-2">
              <Label htmlFor="patient">Patient *</Label>
              <PatientCombobox
                patients={patients}
                selectedPatient={selectedPatient}
                onPatientSelect={setSelectedPatient}
                placeholder="Sélectionner un patient..."
                emptyMessage="Aucun patient trouvé."
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.date ? format(formData.date, "PPP", { locale: fr }) : "Sélectionner"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.date}
                      onSelect={(date) => date && setFormData({ ...formData, date })}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>

                {/* Message pour les jours de repos */}
                {formData.date && workingHours && !isWorkingDay(formData.date) && (
                  <div className="p-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4" />
                      <span>
                        Ce jour n'est pas dans vos jours de travail configurés.
                        Vous pouvez quand même planifier un rendez-vous si nécessaire.
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Heure *</Label>
                <Select value={formData.time} onValueChange={(time) => setFormData({ ...formData, time })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Heure" />
                  </SelectTrigger>
                  <SelectContent>
                    {slotsLoading ? (
                      <div className="p-2 text-center">
                        <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                      </div>
                    ) : displaySlots.length > 0 ? (
                      displaySlots.map((time) => (
                        <SelectItem key={time} value={time}>{time}</SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-center text-muted-foreground">
                        Aucun créneau disponible
                      </div>
                    )}
                  </SelectContent>
                </Select>
                {formData.date && displaySlots.length === 0 && !slotsLoading && (
                  <p className="text-sm text-orange-600">
                    Aucun créneau disponible pour cette date
                  </p>
                )}
                {displaySlots === fallbackSlots && (
                  <p className="text-sm text-blue-600">
                    Créneaux par défaut (configurez vos horaires dans Paramètres)
                  </p>
                )}

                {/* Information sur la durée */}
                {workingHours && (
                  <p className="text-xs text-muted-foreground">
                    Durée: {workingHours.consultationDuration} min (selon vos paramètres)
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Type de Consultation</Label>
              <Select value={formData.type} onValueChange={(type) => setFormData({ ...formData, type })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le type" />
                </SelectTrigger>
                <SelectContent>
                  {appointmentTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notes additionnelles..."
                rows={3}
              />
            </div>

            <div className="flex space-x-3">
              <Button
                onClick={onSubmit}
                className="flex-1 bg-primary hover:bg-primary-hover"
                disabled={isLoading || !selectedPatient || !formData.time || !formData.type}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {editingAppointment ? 'Modification...' : 'Création...'}
                  </>
                ) : (
                  <>
                    {editingAppointment ? (
                      <>
                        <Edit className="w-4 h-4 mr-2" />
                        Modifier le Rendez-vous
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Créer le Rendez-vous
                      </>
                    )}
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={onCancel}
                className="border-border"
                disabled={isLoading}
              >
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
