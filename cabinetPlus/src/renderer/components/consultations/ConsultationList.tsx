import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  ArrowLeft,
  Search,
  Plus,
  Calendar,
  User,
  Clock,
  Stethoscope,
  Edit,
  Eye,
  Loader2,
  AlertCircle,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import { PaginationControls } from "../ui/pagination-controls";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ConsultationUI, getStatusBadge } from "./consultationMappers";

interface ConsultationStats {
  total?: number;
  completed?: number;
  inProgress?: number;
}

interface ConsultationListProps {
  onBack: () => void;
  consultations: ConsultationUI[];
  consultationsLoading: boolean;
  isListLoading: boolean;
  consultationsError: string | null;
  listError: string | null;
  consultationStats: ConsultationStats | null;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  expandedConsultation: string | null;
  onNewConsultation: () => void;
  onViewDetails: (consultation: ConsultationUI) => void;
  onEditConsultation: (consultation: ConsultationUI) => void;
  onDeleteConsultation: (consultationId: string) => void;
  consultationsTotalItems: number;
  consultationsCurrentPage: number;
  consultationsTotalPages: number;
  consultationsGoToPage: (page: number) => void;
  consultationsCanGoPrevious: boolean;
  consultationsCanGoNext: boolean;
  consultationsStartIndex: number;
  consultationsEndIndex: number;
}

export const ConsultationList = ({
  onBack,
  consultations,
  consultationsLoading,
  isListLoading,
  consultationsError,
  listError,
  consultationStats,
  searchTerm,
  setSearchTerm,
  expandedConsultation,
  onNewConsultation,
  onViewDetails,
  onEditConsultation,
  onDeleteConsultation,
  consultationsTotalItems,
  consultationsCurrentPage,
  consultationsTotalPages,
  consultationsGoToPage,
  consultationsCanGoPrevious,
  consultationsCanGoNext,
  consultationsStartIndex,
  consultationsEndIndex,
}: ConsultationListProps) => {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border px-8 flex items-center" style={{ height: '64px' }}>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon-sm" onClick={onBack}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h2 className="text-xl font-semibold text-foreground">Consultations</h2>
          </div>
          <Button onClick={onNewConsultation}>
            <Plus className="w-4 h-4" />
            Nouvelle Consultation
          </Button>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Indicateur de chargement global */}
        {(consultationsLoading || isListLoading) && (
          <Card className="border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Chargement des consultations...</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Indicateur d'erreur */}
        {(consultationsError || listError) && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2 text-red-700">
                <AlertCircle className="w-4 h-4" />
                <span>{consultationsError || listError}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card rounded-lg shadow-card p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-md kpi-icon-bg flex items-center justify-center flex-shrink-0">
              <Stethoscope className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-xl font-bold text-foreground">{consultationStats?.total || 0}</p>
            </div>
          </div>

          <div className="bg-card rounded-lg shadow-card p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-md kpi-icon-success flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-4 h-4 text-success" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Terminées</p>
              <p className="text-xl font-bold text-foreground">{consultationStats?.completed || 0}</p>
            </div>
          </div>

          <div className="bg-card rounded-lg shadow-card p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-md kpi-icon-warning flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4 text-warning" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">En cours</p>
              <p className="text-xl font-bold text-foreground">{consultationStats?.inProgress || 0}</p>
            </div>
          </div>
        </div>

        {/* Barre de recherche */}
        <div className="flex items-center gap-4">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Rechercher une consultation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-muted border-transparent focus:bg-card"
            />
          </div>
        </div>

        {/* Liste des consultations */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center text-foreground">
              <Stethoscope className="w-5 h-5 mr-2 text-primary" />
              Liste des consultations
            </CardTitle>
            <CardDescription>
              {consultationsTotalItems} consultation(s) trouvée(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {consultationsTotalItems === 0 ? (
              <div className="text-center py-8">
                <Stethoscope className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">Aucune consultation</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? 'Aucune consultation ne correspond à votre recherche.' : 'Commencez par créer votre première consultation.'}
                </p>
                <Button
                  onClick={onNewConsultation}
                  className="bg-primary hover:bg-primary-hover"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvelle Consultation
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-4">
                  {consultations.map((consultation) => (
                    <div
                      key={consultation.id}
                      className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <Stethoscope className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-foreground">{consultation.motif || 'Consultation générale'}</h4>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <span className="flex items-center">
                                <Calendar className="w-3 h-3 mr-1" />
                                {format(new Date(consultation.date), 'dd/MM/yyyy', { locale: fr })}
                              </span>
                              <span className="flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {consultation.time}
                              </span>
                              <span className="flex items-center">
                                <User className="w-3 h-3 mr-1" />
                                {consultation.patientName}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(consultation.status)}
                        </div>
                      </div>

                      {/* Détails affichés conditionnellement */}
                      {expandedConsultation === consultation.id && (
                        <div className="mt-4 space-y-4">
                          {consultation.diagnostic && (
                            <div>
                              <Label className="text-muted-foreground font-medium">Diagnostic</Label>
                              <p className="text-foreground mt-1 text-sm whitespace-pre-wrap break-words bg-muted/30 p-3 rounded-md">
                                {consultation.diagnostic}
                              </p>
                            </div>
                          )}
                          {consultation.traitement && (
                            <div>
                              <Label className="text-muted-foreground font-medium">Traitement</Label>
                              <p className="text-foreground mt-1 text-sm whitespace-pre-wrap break-words bg-muted/30 p-3 rounded-md">
                                {consultation.traitement}
                              </p>
                            </div>
                          )}
                          {consultation.notes && (
                            <div>
                              <Label className="text-muted-foreground font-medium">Notes</Label>
                              <p className="text-foreground mt-1 text-sm whitespace-pre-wrap break-words bg-muted/30 p-3 rounded-md">
                                {consultation.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="mt-3 pt-3 border-t border-border flex justify-between items-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewDetails(consultation)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          {expandedConsultation === consultation.id ? 'Masquer détails' : 'Voir détails'}
                        </Button>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditConsultation(consultation)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm(`Êtes-vous sûr de vouloir supprimer la consultation de ${consultation.patientName} ?`)) {
                                onDeleteConsultation(consultation.id);
                              }
                            }}
                            className="text-destructive hover:text-destructive"
                            disabled={consultationsLoading}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Contrôles de pagination pour les consultations */}
                <PaginationControls
                  currentPage={consultationsCurrentPage}
                  totalPages={consultationsTotalPages}
                  onPageChange={consultationsGoToPage}
                  canGoPrevious={consultationsCanGoPrevious}
                  canGoNext={consultationsCanGoNext}
                  startIndex={consultationsStartIndex}
                  endIndex={consultationsEndIndex}
                  totalItems={consultationsTotalItems}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
