import { format } from "date-fns";
import {
  Users,
  Calendar,
  Banknote,
  Clock,
  Check,
  X,
  ArrowRight,
  Stethoscope,
} from "lucide-react";
import { Appointment, WaitingRoomEntry } from "../../../shared/types";
import { UnpaidAlertBanner } from "./UnpaidAlertBanner";

const getAppointmentStatusBadge = (status: string) => {
  switch (status) {
    case 'confirmé':
      return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-green-500/10 text-green-600">Confirmé</span>;
    case 'en_attente':
      return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600">En attente</span>;
    case 'annulé':
      return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-500/10 text-red-500">Annulé</span>;
    case 'terminé':
      return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-500">Terminé</span>;
    default:
      return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-500/10 text-gray-500">{status}</span>;
  }
};

const parseSafeDate = (dateStr: string) => {
  if (!dateStr) return new Date();
  if (dateStr.includes('T') || dateStr.endsWith('Z')) return new Date(dateStr);
  return new Date(dateStr.replace(' ', 'T') + 'Z');
};

interface AgendaPanelProps {
  dashboardTab: 'agenda' | 'waiting';
  setDashboardTab: (tab: 'agenda' | 'waiting') => void;
  todayApts: Appointment[];
  activeWaitingQueue: WaitingRoomEntry[];
  waitingCount: number;
  isSecretary: boolean;
  canCreateConsultation: boolean;
  isAlreadyInWaitingRoom: (apt: any) => boolean;
  onSendToWaitingRoom: (apt: any) => void;
  onUpdateAppointmentStatus: (id: number, status: 'confirmé' | 'annulé' | 'terminé') => void;
  onStartConsultation: (patient: any) => void;
  onOpenPayment: (patient: any) => void;
  onNavigate: (section: string) => void;
  canViewTotalFinancialStats: boolean;
  unpaidAmount: number;
  formatAmount: (amount: number) => string;
}

export const AgendaPanel = ({
  dashboardTab,
  setDashboardTab,
  todayApts,
  activeWaitingQueue,
  waitingCount,
  isSecretary,
  canCreateConsultation,
  isAlreadyInWaitingRoom,
  onSendToWaitingRoom,
  onUpdateAppointmentStatus,
  onStartConsultation,
  onOpenPayment,
  onNavigate,
  canViewTotalFinancialStats,
  unpaidAmount,
  formatAmount,
}: AgendaPanelProps) => {
  return (
    <div className="lg:col-span-8 bg-card border border-border/70 rounded-xl shadow-2xs flex flex-col h-full overflow-hidden">

      {/* Header du panneau */}
      <div className="px-6 py-3.5 border-b border-border/60 flex items-center justify-between shrink-0 bg-muted/20">
        <div className="flex items-center gap-4">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Programme du Jour</h3>
          <div className="flex bg-muted p-0.5 rounded-lg border border-border">
            <button
              onClick={() => setDashboardTab('agenda')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all duration-150 ${dashboardTab === 'agenda' ? 'bg-card text-foreground shadow-2xs font-bold' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Agenda ({todayApts.length})
            </button>
            <button
              onClick={() => setDashboardTab('waiting')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all duration-150 ${dashboardTab === 'waiting' ? 'bg-card text-amber-600 dark:text-amber-400 shadow-2xs font-bold' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Salle d'attente ({waitingCount})
            </button>
          </div>
        </div>
        <button
          onClick={() => onNavigate(dashboardTab === 'agenda' ? "appointments" : "waiting-room")}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-all duration-150 flex items-center gap-1.5"
        >
          <span>{dashboardTab === 'agenda' ? "Voir l'agenda complet" : "Voir la salle d'attente"}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Liste de RDV / Salle d'attente (S'étend sur toute la hauteur disponible) */}
      <div className="p-4 flex-1 overflow-y-auto flex flex-col justify-between">
        {dashboardTab === 'agenda' ? (
          todayApts.length > 0 ? (
            <div className="divide-y divide-border/50 space-y-1">
              {todayApts.map((apt) => {
                const patientName = apt.patient ? `${apt.patient.first_name} ${apt.patient.last_name}` : 'Patient inconnu';
                const inWaiting = isAlreadyInWaitingRoom(apt);
                return (
                  <div key={apt.id} className="py-3 flex items-center justify-between group hover:bg-muted/40 px-3.5 rounded-xl transition-colors">
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Heure */}
                      <div className="flex flex-col items-center justify-center bg-muted/80 w-14 h-12 rounded-lg border border-border flex-shrink-0">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground mb-0.5" />
                        <span className="text-xs font-bold text-foreground font-mono leading-none">{apt.time}</span>
                      </div>

                      {/* Patient & Type */}
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">{patientName}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-xs font-medium text-muted-foreground truncate">{apt.type}</span>
                          <span className="text-muted-foreground/30 text-[11px]">·</span>
                          {getAppointmentStatusBadge(apt.status)}
                          {inWaiting && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                              <Users className="w-2.5 h-2.5" />
                              En salle d'attente
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions rapides */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Inscription directe en salle d'attente : seulement si pas encore en attente */}
                      {apt.status !== 'annulé' && apt.status !== 'terminé' && !inWaiting && (
                        <button
                          onClick={() => onSendToWaitingRoom(apt)}
                          className="h-8 px-2.5 flex items-center justify-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold hover:bg-amber-500/20 transition-colors"
                          title="Inscrire en Salle d'Attente"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>Salle d'attente</span>
                        </button>
                      )}

                      {(apt.status === 'terminé' || isSecretary) && apt.patient && (
                        <button
                          onClick={() => onOpenPayment(apt.patient)}
                          className="px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-all shadow-2xs"
                          title="Encaisser le paiement de cette consultation"
                        >
                          <Banknote className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Encaissement</span>
                        </button>
                      )}

                      {apt.status === 'en_attente' && !isSecretary && (
                        <button
                          onClick={() => onUpdateAppointmentStatus(apt.id, 'confirmé')}
                          className="h-8 px-2.5 flex items-center justify-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 text-xs font-semibold hover:bg-emerald-500/20 transition-colors"
                          title="Confirmer la présence"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Présent</span>
                        </button>
                      )}

                      {canCreateConsultation && apt.status !== 'terminé' && apt.status !== 'annulé' && (
                        <button
                          onClick={() => {
                            if (apt.patient) {
                              const convertedPatient = {
                                id: apt.patient.id.toString(),
                                firstName: apt.patient.first_name,
                                lastName: apt.patient.last_name,
                                phone: apt.patient.phone,
                                address: apt.patient.address,
                                age: apt.patient.date_of_birth ? new Date().getFullYear() - new Date(apt.patient.date_of_birth).getFullYear() : 0,
                                gender: apt.patient.gender
                              };
                              onStartConsultation(convertedPatient);
                            }
                          }}
                          className="h-8 px-2.5 flex items-center justify-center gap-1 rounded-lg border border-primary/30 bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
                          title="Commencer la consultation"
                        >
                          <Stethoscope className="w-3.5 h-3.5" />
                          <span>Consulter</span>
                        </button>
                      )}

                      {apt.status !== 'terminé' && apt.status !== 'annulé' && (
                        <button
                          onClick={() => {
                            if (confirm(`Annuler le rendez-vous de ${patientName} ?`)) {
                              onUpdateAppointmentStatus(apt.id, 'annulé');
                            }
                          }}
                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-destructive/20 bg-destructive/5 text-destructive hover:bg-destructive/10 transition-colors"
                          title="Annuler le RDV"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground p-8 my-auto bg-muted/10 rounded-xl border border-dashed border-border">
              <Calendar className="w-10 h-10 mb-3 text-muted-foreground/40" />
              <p className="text-base font-bold text-foreground">
                Aucun rendez-vous planifié aujourd'hui
              </p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                Consultez l'agenda pour inscrire un rendez-vous ou lancer une consultation rapide.
              </p>
            </div>
          )
        ) : (
          /* Onglet Salle d'Attente */
          activeWaitingQueue.length > 0 ? (
            <div className="divide-y divide-border/50 space-y-1">
              {activeWaitingQueue.map((entry) => {
                const patientName = entry.patient ? `${entry.patient.first_name} ${entry.patient.last_name}` : `Patient #${entry.patient_id}`;
                const arrivalDate = parseSafeDate(entry.arrival_time);
                const arrivalTimeFormatted = !isNaN(arrivalDate.getTime()) ? format(arrivalDate, "HH:mm") : "–";
                return (
                  <div key={entry.id} className="py-3 flex items-center justify-between group hover:bg-muted/40 px-3.5 rounded-xl transition-colors">
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Numéro de Ticket */}
                      <div className={`flex flex-col items-center justify-center w-14 h-12 rounded-lg border flex-shrink-0 ${
                        entry.status === 'en_consultation'
                          ? "bg-blue-500/15 border-blue-500/30 text-blue-600 dark:text-blue-400 font-bold"
                          : "bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold"
                      }`}>
                        <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Ticket</span>
                        <span className="text-xs font-mono font-extrabold leading-none">
                          N° {entry.ticket_number ? String(entry.ticket_number).padStart(2, '0') : '–'}
                        </span>
                      </div>

                      {/* Patient & Statut en attente */}
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">{patientName}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap text-xs">
                          <span className="text-muted-foreground">Arrivé à {arrivalTimeFormatted}</span>
                          <span className="text-muted-foreground/30 text-[11px]">·</span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            entry.status === 'en_consultation'
                              ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30"
                              : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                          }`}>
                            {entry.status === 'en_consultation' ? "En consultation" : "En attente"}
                          </span>
                          {entry.notes && (
                            <span className="text-[11px] text-muted-foreground truncate italic">
                              · {entry.notes}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions rapides Salle d'attente */}
                    <div className="flex items-center gap-2 shrink-0">
                      {isSecretary && entry.patient && (
                        <button
                          onClick={() => onOpenPayment(entry.patient)}
                          className="px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-all shadow-2xs"
                          title="Encaisser"
                        >
                          <Banknote className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Encaissement</span>
                        </button>
                      )}

                      {canCreateConsultation && entry.patient && (
                        <button
                          onClick={() => {
                            const convertedPatient = {
                              id: entry.patient.id.toString(),
                              firstName: entry.patient.first_name,
                              lastName: entry.patient.last_name,
                              phone: entry.patient.phone,
                              address: entry.patient.address,
                              age: entry.patient.date_of_birth ? new Date().getFullYear() - new Date(entry.patient.date_of_birth).getFullYear() : 0,
                              gender: entry.patient.gender
                            };
                            onStartConsultation(convertedPatient);
                          }}
                          className="h-8 px-2.5 flex items-center justify-center gap-1 rounded-lg border border-primary/30 bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
                          title="Commencer la consultation"
                        >
                          <Stethoscope className="w-3.5 h-3.5" />
                          <span>Consulter</span>
                        </button>
                      )}

                      <button
                        onClick={() => onNavigate("waiting-room")}
                        className="h-8 px-2.5 flex items-center justify-center gap-1 rounded-lg border border-border bg-muted/60 text-muted-foreground hover:text-foreground text-xs font-medium transition-colors"
                        title="Gérer dans la Salle d'Attente"
                      >
                        <span>Gérer</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground p-8 my-auto bg-muted/10 rounded-xl border border-dashed border-border">
              <Users className="w-10 h-10 mb-3 text-muted-foreground/40" />
              <p className="text-base font-bold text-foreground">
                La salle d'attente est vide
              </p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                Aucun patient n'est actuellement en salle d'attente.
              </p>
            </div>
          )
        )}

        {canViewTotalFinancialStats && unpaidAmount > 0 && (
          <UnpaidAlertBanner
            unpaidAmount={unpaidAmount}
            formatAmount={formatAmount}
            onGoToPayments={() => onNavigate("payments")}
          />
        )}
      </div>

    </div>
  );
};
