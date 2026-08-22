import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Phone,
  MapPin,
  Stethoscope,
  Calendar,
  FileText,
  AlertTriangle,
  HardDrive,
} from "lucide-react";
import { PatientDocumentsTab } from "./PatientDocumentsTab";
import { PatientHealthAlert } from "./PatientHealthAlert";
import { PatientDebtAlert } from "./PatientDebtAlert";
import { PatientUI, convertUIToPatient } from "./patientMappers";

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'completed': return <Badge variant="success">Terminée</Badge>;
    case 'cancelled': return <Badge variant="destructive">Annulée</Badge>;
    case 'scheduled': return <Badge variant="info">Programmée</Badge>;
    default: return <Badge variant="secondary">En cours</Badge>;
  }
};

interface PatientDetailProps {
  patient: PatientUI;
  patientConsultations: any[];
  patientPrescriptions: any[];
  canCreateConsultation: boolean;
  canViewPrescriptions: boolean;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onOpenConsultation?: (patient: PatientUI) => void;
  onOpenAppointment?: (patient: PatientUI) => void;
}

export const PatientDetail = ({
  patient,
  patientConsultations,
  patientPrescriptions,
  canCreateConsultation,
  canViewPrescriptions,
  onBack,
  onEdit,
  onDelete,
  onOpenConsultation,
  onOpenAppointment,
}: PatientDetailProps) => {
  const bmi = (patient.weight && patient.height)
    ? (patient.weight / Math.pow(patient.height / 100, 2)).toFixed(1)
    : null;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border px-8 flex items-center" style={{ height: '64px' }}>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onBack}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                patient.gender === 'F' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {patient.gender === 'F' ? 'Mme' : 'M.'}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground leading-tight">
                  {patient.gender === 'F' ? 'Mme' : 'M.'} {patient.firstName} {patient.lastName}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {patient.age} ans · Né(e) le {patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString('fr-FR') : 'inconnue'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canCreateConsultation && onOpenConsultation && (
              <Button
                size="sm"
                onClick={() => onOpenConsultation(patient)}
              >
                <Stethoscope className="w-4 h-4" /> Consultation
              </Button>
            )}
            {onOpenAppointment && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onOpenAppointment(patient)}
              >
                <Calendar className="w-4 h-4" /> RDV
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={onEdit}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => {
                if (confirm(`Supprimer le dossier de ${patient.firstName} ${patient.lastName} ?`)) {
                  onDelete();
                }
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto p-8 max-w-6xl mx-auto space-y-6">
        {/* Patient Health Alert */}
        <PatientHealthAlert patient={convertUIToPatient(patient)} />

        {/* Rappel de dette */}
        <PatientDebtAlert patientId={parseInt(patient.id)} />

        {/* Overview cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-[11px] uppercase font-bold text-muted-foreground tracking-widest">Coordonnées</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-foreground">
                <Phone className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="font-semibold">{patient.phone || 'Non renseigné'}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4 text-muted-foreground/60 flex-shrink-0" />
                <span>{patient.address || 'Adresse non spécifiée'}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-[11px] uppercase font-bold text-muted-foreground tracking-widest">Biométrie</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-around text-center">
              <div>
                <p className="text-xs text-muted-foreground">Poids</p>
                <p className="text-lg font-bold text-foreground mt-0.5">{patient.weight ? `${patient.weight} kg` : '–'}</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div>
                <p className="text-xs text-muted-foreground">Taille</p>
                <p className="text-lg font-bold text-foreground mt-0.5">{patient.height ? `${patient.height} cm` : '–'}</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div>
                <p className="text-xs text-muted-foreground">IMC</p>
                <p className="text-lg font-bold text-primary mt-0.5">{bmi ? bmi : '–'}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-[11px] uppercase font-bold text-muted-foreground tracking-widest">Dossier Médical</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              {patient.allergies && (
                <div className="bg-red-500/10 border border-red-200 dark:border-red-950 p-2 rounded-md">
                  <span className="font-bold text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Allergies déclarées :
                  </span>
                  <span className="text-red-700 dark:text-red-300 font-semibold">{patient.allergies}</span>
                </div>
              )}
              <div>
                <span className="font-bold text-muted-foreground">Maladies actuelles : </span>
                <span className="text-foreground">{patient.diseases || 'Aucune'}</span>
              </div>
              <div>
                <span className="font-bold text-muted-foreground">Antécédents : </span>
                <span className="text-foreground">{patient.medical_history || 'Aucun'}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs: Consultations, Ordonnances & Documents EDFA */}
        <Tabs defaultValue="consultations" className="space-y-4">
          <TabsList>
            <TabsTrigger value="consultations">
              Consultations ({patientConsultations.length})
            </TabsTrigger>
            {canViewPrescriptions && (
              <TabsTrigger value="prescriptions">
                Ordonnances ({patientPrescriptions.length})
              </TabsTrigger>
            )}
            <TabsTrigger value="documents" className="flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5" /> Documents & Imagerie (EDFA)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="consultations">
            <Card className="shadow-card">
              <CardContent className="p-6 space-y-3">
                {patientConsultations.length > 0 ? (
                  patientConsultations.map((consult) => (
                    <div key={consult.id} className="p-4 border border-border rounded-lg bg-muted/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Stethoscope className="w-4 h-4 text-primary" />
                          <span className="font-semibold text-sm text-foreground">
                            Consultation du {new Date(consult.date).toLocaleDateString('fr-FR')}
                          </span>
                          {getStatusBadge(consult.status)}
                        </div>
                        <span className="text-xs text-muted-foreground font-mono">
                          {consult.price ? `${consult.price} DA` : ''}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground font-medium">Motif: {consult.reason}</p>
                      {consult.diagnosis && (
                        <p className="text-xs text-foreground bg-card p-3 rounded-md border border-border mt-2">
                          <strong>Diagnostic:</strong> {consult.diagnosis}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-center py-8 text-muted-foreground">Aucune consultation enregistrée.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {canViewPrescriptions && (
            <TabsContent value="prescriptions">
              <Card className="shadow-card">
                <CardContent className="p-6 space-y-3">
                  {patientPrescriptions.length > 0 ? (
                    patientPrescriptions.map((presc) => (
                      <div key={presc.id} className="p-4 border border-border rounded-lg bg-muted/30 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm text-foreground flex items-center gap-2">
                            <FileText className="w-4 h-4 text-primary" />
                            Ordonnance du {new Date(presc.date).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {presc.medications?.map((m: any, i: number) => (
                            <span key={i} className="text-xs bg-card border border-border px-2.5 py-1 rounded font-medium text-foreground">
                              {m.name} ({m.dosage})
                            </span>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-center py-8 text-muted-foreground">Aucune ordonnance enregistrée.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="documents">
            <PatientDocumentsTab patientId={parseInt(patient.id)} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
