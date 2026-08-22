import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { ArrowLeft, Calendar as CalendarIcon, Clock, Plus, CheckCircle, XCircle, Edit, Trash2, Banknote, Users } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { AppointmentUI, getStatusBadge } from "./appointmentMappers";

interface AppointmentCalendarViewProps {
  selectedDate: Date | undefined;
  setSelectedDate: (date: Date | undefined) => void;
  selectedDateAppointments: AppointmentUI[];
  isLoading: boolean;
  isSecretary: boolean;
  isAlreadyInWaitingRoom: (appointment: AppointmentUI) => boolean;
  onBack: () => void;
  onSwitchToList: () => void;
  onNewAppointment: () => void;
  onSendToWaitingRoom: (appointment: AppointmentUI) => void;
  onOpenPayment: (appointment: AppointmentUI) => void;
  onConfirm: (appointmentId: string) => void;
  onCancelAppointment: (appointmentId: string) => void;
  onEdit: (appointment: AppointmentUI) => void;
  onDelete: (appointmentId: string) => void;
}

export const AppointmentCalendarView = ({
  selectedDate,
  setSelectedDate,
  selectedDateAppointments,
  isLoading,
  isSecretary,
  isAlreadyInWaitingRoom,
  onBack,
  onSwitchToList,
  onNewAppointment,
  onSendToWaitingRoom,
  onOpenPayment,
  onConfirm,
  onCancelAppointment,
  onEdit,
  onDelete,
}: AppointmentCalendarViewProps) => {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border px-8 flex items-center" style={{ height: '64px' }}>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon-sm" onClick={onBack}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Planning - Vue Calendrier</h2>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onSwitchToList}>
              Liste
            </Button>
            <Button onClick={onNewAppointment}>
              <Plus className="w-4 h-4" />
              Nouveau RDV
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-sm text-foreground">Calendrier</CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border-border pointer-events-auto"
                />
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-foreground">
                  {selectedDate ? format(selectedDate, "EEEE d MMMM yyyy", { locale: fr }) : "Aujourd'hui"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {selectedDateAppointments
                    .slice()
                    .sort((a, b) => a.time.localeCompare(b.time))
                    .map((appointment) => (
                    <div key={appointment.id} className="flex items-center p-3 bg-muted rounded-lg border border-border">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium text-foreground">{appointment.time}</span>
                          <span className="text-sm text-muted-foreground">({appointment.duration} min)</span>
                          {getStatusBadge(appointment.status)}
                        </div>
                        <div className="mt-1">
                          <p className="font-medium text-foreground">{appointment.patientName}</p>
                          <p className="text-sm text-muted-foreground">{appointment.type}</p>
                        </div>
                      </div>

                      {/* Boutons d'action contextuels */}
                      <div className="flex items-center space-x-1">
                        {/* Bouton Envoyer en Salle d'Attente : seulement si pas encore en attente */}
                        {format(appointment.date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd") && appointment.status !== 'annulé' && appointment.status !== 'terminé' && !isAlreadyInWaitingRoom(appointment) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onSendToWaitingRoom(appointment)}
                            className="border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 font-semibold text-xs gap-1 h-8"
                            title="Marquer comme arrivé en Salle d'Attente"
                          >
                            <Users className="w-3.5 h-3.5" />
                            <span>Salle d'attente</span>
                          </Button>
                        )}

                        {/* Bouton Encaissement du paiement */}
                        {(appointment.status === 'terminé' || isSecretary) && (
                          <Button
                            size="sm"
                            onClick={() => onOpenPayment(appointment)}
                            className="bg-primary text-primary-foreground font-semibold text-xs gap-1 h-8 shadow-2xs hover:bg-primary/90"
                            title="Encaisser le paiement"
                          >
                            <Banknote className="w-3.5 h-3.5" />
                            <span>Encaisser</span>
                          </Button>
                        )}

                        {/* Bouton Confirmer - seulement si en attente */}
                        {appointment.status === 'en_attente' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onConfirm(appointment.id)}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            disabled={isLoading}
                            title="Confirmer le rendez-vous"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}

                        {/* Bouton Annuler - seulement si confirmé ou en attente */}
                        {(appointment.status === 'confirmé' || appointment.status === 'en_attente') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm(`Êtes-vous sûr de vouloir annuler le rendez-vous de ${appointment.patientName} ?`)) {
                                onCancelAppointment(appointment.id);
                              }
                            }}
                            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                            disabled={isLoading}
                            title="Annuler le rendez-vous"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        )}

                        {/* Bouton Modifier - seulement si pas terminé */}
                        {appointment.status !== 'terminé' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(appointment)}
                            disabled={isLoading}
                            title="Modifier le rendez-vous"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}

                        {/* Bouton Supprimer */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Êtes-vous sûr de vouloir supprimer le rendez-vous de ${appointment.patientName} ?`)) {
                              onDelete(appointment.id);
                            }
                          }}
                          className="text-destructive hover:text-destructive"
                          disabled={isLoading}
                          title="Supprimer le rendez-vous"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {selectedDateAppointments.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Aucun rendez-vous pour cette date
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
