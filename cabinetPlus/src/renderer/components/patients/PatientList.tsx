import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { PaginationControls } from "../ui/pagination-controls";
import {
  UserPlus,
  Search,
  Phone,
  Calendar,
  ArrowLeft,
  Edit,
  Eye,
  Trash2,
  Stethoscope,
  AlertCircle,
  Loader2,
  FileText,
  Activity,
  Banknote,
} from "lucide-react";
import { PatientUI } from "./patientMappers";

interface PatientListProps {
  patients: PatientUI[];
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  genderFilter: string;
  setGenderFilter: (value: string) => void;
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
  onBack: () => void;
  onNewPatient: () => void;
  onSelectPatient: (patient: PatientUI) => void;
  onEditPatient: (patient: PatientUI) => void;
  onDeletePatient: (patientId: string) => void;
  onAddToWaitingRoom: (patient: PatientUI) => void;
  getLastConsultationDate: (patientId: string) => string | null;
  onOpenConsultation?: (patient: PatientUI) => void;
  onOpenAppointment?: (patient: PatientUI) => void;
  onOpenPayment?: (patient: PatientUI) => void;
  onOpenPrescription?: (patient: PatientUI) => void;
}

export const PatientList = ({
  patients,
  searchTerm,
  setSearchTerm,
  genderFilter,
  setGenderFilter,
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
  onBack,
  onNewPatient,
  onSelectPatient,
  onEditPatient,
  onDeletePatient,
  onAddToWaitingRoom,
  getLastConsultationDate,
  onOpenConsultation,
  onOpenAppointment,
  onOpenPayment,
  onOpenPrescription,
}: PatientListProps) => {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border px-8 flex items-center" style={{ height: '64px' }}>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon-sm" onClick={onBack}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h2 className="text-xl font-semibold text-foreground">Gestion des Patients</h2>
          </div>

          <Button onClick={onNewPatient}>
            <UserPlus className="w-4 h-4" />
            Nouveau Patient
          </Button>
        </div>
      </header>

      <div className="p-8 space-y-6">
        {isLoading && (
          <div className="flex items-center justify-center p-8 bg-card rounded-lg shadow-card text-muted-foreground text-xs gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-primary" /> Chargement des dossiers patients...
          </div>
        )}

        {error && (
          <div className="p-4 bg-destructive/8 border border-destructive/20 rounded-lg text-destructive text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        {/* Search & Filter bar */}
        <div className="bg-card p-4 rounded-lg shadow-card flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 w-4 h-4" />
            <Input
              placeholder="Rechercher par nom, téléphone, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-muted border-transparent focus:bg-card"
            />
          </div>

          <div className="w-full sm:w-48">
            <Select value={genderFilter} onValueChange={setGenderFilter}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Tous les genres" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les genres</SelectItem>
                <SelectItem value="M">Hommes (M.)</SelectItem>
                <SelectItem value="F">Femmes (Mme)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Patients Table */}
        <div className="bg-card rounded-lg shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                  <th className="py-3.5 px-6">Patient</th>
                  <th className="py-3.5 px-6">Âge</th>
                  <th className="py-3.5 px-6">Téléphone</th>
                  <th className="py-3.5 px-6">Adresse</th>
                  <th className="py-3.5 px-6">Dernière Visite</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm text-foreground">
                {patients.length > 0 ? (
                  patients.map((patient) => {
                    const lastVisit = getLastConsultationDate(patient.id);
                    return (
                      <tr
                        key={patient.id}
                        onClick={() => onSelectPatient(patient)}
                        className="hover:bg-muted/40 cursor-pointer transition-colors"
                      >
                        <td className="py-3.5 px-6">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                              patient.gender === 'F' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {patient.gender === 'F' ? 'Mme' : 'M.'}
                            </div>
                            <div>
                              <span className="font-semibold text-foreground hover:text-primary block">
                                {patient.firstName} {patient.lastName}
                              </span>
                              <span className="text-[11px] text-muted-foreground">{patient.gender === 'F' ? 'Féminin' : 'Masculin'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-6 font-medium text-muted-foreground">{patient.age} ans</td>
                        <td className="py-3.5 px-6 text-muted-foreground font-mono">{patient.phone || '–'}</td>
                        <td className="py-3.5 px-6 text-muted-foreground max-w-xs truncate">{patient.address || '–'}</td>
                        <td className="py-3.5 px-6 text-muted-foreground">
                          {lastVisit ? new Date(lastVisit).toLocaleDateString('fr-FR') : 'Aucune'}
                        </td>
                        <td className="py-3.5 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            {onOpenConsultation && (
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => onOpenConsultation(patient)}
                                title="Nouvelle Consultation"
                                className="text-primary hover:bg-primary/10"
                              >
                                <Stethoscope className="w-4 h-4" />
                              </Button>
                            )}
                            {onOpenAppointment && (
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => onOpenAppointment(patient)}
                                title="Prendre RDV"
                                className="text-primary hover:bg-primary/10"
                              >
                                <Calendar className="w-4 h-4" />
                              </Button>
                            )}
                            {onOpenPayment && (
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => onOpenPayment(patient)}
                                title="Encaisser"
                                className="text-emerald-600 hover:bg-emerald-100"
                              >
                                <Banknote className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => onAddToWaitingRoom(patient)}
                              title="Ajouter à la salle d'attente"
                              className="text-amber-600 hover:bg-amber-100"
                            >
                              <Activity className="w-4 h-4" />
                            </Button>
                            {onOpenPrescription && (
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => onOpenPrescription(patient)}
                                title="Créer Ordonnance"
                                className="text-primary hover:bg-primary/10"
                              >
                                <FileText className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => onEditPatient(patient)}
                              title="Modifier"
                              className="text-muted-foreground hover:bg-muted"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => onSelectPatient(patient)}
                              title="Voir dossier"
                              className="text-muted-foreground hover:bg-muted"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => {
                                if (confirm(`Supprimer ${patient.firstName} ${patient.lastName} ?`)) {
                                  onDeletePatient(patient.id);
                                }
                              }}
                              title="Supprimer"
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted-foreground">
                      Aucun patient trouvé.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-border">
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
          </div>
        </div>
      </div>
    </div>
  );
};
