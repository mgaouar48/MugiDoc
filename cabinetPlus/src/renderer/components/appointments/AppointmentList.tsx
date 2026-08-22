import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PaginationControls } from "../ui/pagination-controls";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Clock,
  Phone,
  Mail,
  Plus,
  Search,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Banknote,
  Users
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { AppointmentUI, getStatusBadge } from "./appointmentMappers";

interface AppointmentListProps {
  appointments: AppointmentUI[];
  stats: { total: number; confirmed: number; pending: number; cancelled: number } | null;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  filterStatus: string;
  setFilterStatus: (value: string) => void;
  isLoading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  goToPage: (page: number) => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
  startIndex: number;
  endIndex: number;
  totalItems: number;
  isSecretary: boolean;
  isAlreadyInWaitingRoom: (appointment: AppointmentUI) => boolean;
  onBack: () => void;
  onSwitchToCalendar: () => void;
  onNewAppointment: () => void;
  onSendToWaitingRoom: (appointment: AppointmentUI) => void;
  onOpenPayment: (appointment: AppointmentUI) => void;
  onConfirm: (appointmentId: string) => void;
  onCancelAppointment: (appointmentId: string) => void;
  onEdit: (appointment: AppointmentUI) => void;
  onDelete: (appointmentId: string) => void;
}

export const AppointmentList = ({
  appointments,
  stats,
  searchTerm,
  setSearchTerm,
  filterStatus,
  setFilterStatus,
  isLoading,
  error,
  currentPage,
  totalPages,
  goToPage,
  canGoNext,
  canGoPrevious,
  startIndex,
  endIndex,
  totalItems,
  isSecretary,
  isAlreadyInWaitingRoom,
  onBack,
  onSwitchToCalendar,
  onNewAppointment,
  onSendToWaitingRoom,
  onOpenPayment,
  onConfirm,
  onCancelAppointment,
  onEdit,
  onDelete,
}: AppointmentListProps) => {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border px-8 flex items-center" style={{ height: '64px' }}>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon-sm" onClick={onBack}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h2 className="text-xl font-semibold text-foreground">Planning & Rendez-vous</h2>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onSwitchToCalendar}>
              <CalendarIcon className="w-4 h-4" />
              Calendrier
            </Button>
            <Button onClick={onNewAppointment}>
              <Plus className="w-4 h-4" />
              Nouveau RDV
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {isLoading && (
          <Card className="border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span>Chargement des rendez-vous...</span>
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2 text-red-700">
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="border-border">
            <CardContent className="p-3">
              <div className="flex items-center space-x-2">
                <CalendarIcon className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-lg font-bold text-foreground">{stats?.total || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-3">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Confirmés</p>
                  <p className="text-lg font-bold text-foreground">
                    {stats?.confirmed || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-3">
              <div className="flex items-center space-x-2">
                <div>
                  <p className="text-xs text-muted-foreground">En attente</p>
                  <p className="text-lg font-bold text-foreground">
                    {stats?.pending || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-3">
              <div className="flex items-center space-x-2">
                <XCircle className="w-4 h-4 text-red-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Annulés</p>
                  <p className="text-lg font-bold text-foreground">
                    {stats?.cancelled || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres et recherche */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un patient..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-border"
              />
            </div>
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-48 border-border">
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="confirmé">Confirmés</SelectItem>
              <SelectItem value="en_attente">En attente</SelectItem>
              <SelectItem value="annulé">Annulés</SelectItem>
              <SelectItem value="terminé">Terminés</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Liste des rendez-vous */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Liste des Rendez-vous</CardTitle>
            <CardDescription>
              {totalItems} rendez-vous trouvé(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-4">
                {appointments.map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="flex flex-col items-center justify-center w-16 h-16 bg-primary/10 rounded-lg">
                      <span className="text-xs text-primary font-medium">
                        {format(appointment.date, "dd")}
                      </span>
                      <span className="text-xs text-primary">
                        {format(appointment.date, "MMM", { locale: fr })}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold text-foreground">{appointment.patientName}</h3>
                        {getStatusBadge(appointment.status)}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {appointment.time} ({appointment.duration} min)
                        </span>
                        <span className="flex items-center">
                          <Phone className="w-3 h-3 mr-1" />
                          {appointment.patientPhone}
                        </span>
                        <span className="flex items-center">
                          <Mail className="w-3 h-3 mr-1" />
                          {appointment.patientEmail}
                        </span>
                      </div>
                      <p className="text-sm text-foreground mt-1">{appointment.type}</p>
                      {appointment.notes && (
                        <p className="text-xs text-muted-foreground mt-1">{appointment.notes}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Bouton Envoyer en Salle d'Attente : seulement si pas encore en attente */}
                    {format(appointment.date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd") && appointment.status !== 'annulé' && appointment.status !== 'terminé' && !isAlreadyInWaitingRoom(appointment) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onSendToWaitingRoom(appointment)}
                        className="border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 font-bold gap-1 text-xs"
                        title="Marquer comme arrivé en Salle d'Attente"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>Salle d'attente</span>
                      </Button>
                    )}

                    {/* Bouton Encaissement du paiement - mis en avant pour la secrétaire et consultations effectuées */}
                    {(appointment.status === 'terminé' || isSecretary) && (
                      <Button
                        size="sm"
                        onClick={() => onOpenPayment(appointment)}
                        className="bg-primary text-primary-foreground font-semibold gap-1 text-xs shadow-sm hover:bg-primary/90"
                        title="Encaisser le paiement de la consultation"
                      >
                        <Banknote className="w-3.5 h-3.5" />
                        <span>Encaisser</span>
                      </Button>
                    )}

                    {/* Bouton Confirmer - seulement si en attente */}
                    {appointment.status === 'en_attente' && !isSecretary && (
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
              </div>

              {/* Contrôles de pagination pour les rendez-vous */}
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={goToPage}
                canGoPrevious={canGoPrevious}
                canGoNext={canGoNext}
                startIndex={startIndex}
                endIndex={endIndex}
                totalItems={totalItems}
              />

              {totalItems === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun rendez-vous trouvé</p>
                  <p className="text-sm">Utilisez les filtres ou créez un nouveau rendez-vous</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
