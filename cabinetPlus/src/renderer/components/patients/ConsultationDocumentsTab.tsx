import { useEffect } from "react";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { FileText, FileCheck, Microscope, Scan, ClipboardList, Stethoscope, Send, FlaskConical, FileClock, X } from "lucide-react";
import { useConsultationDocuments } from "../../hooks/useConsultationDocuments";

interface ConsultationDocumentsTabProps {
  patientId: number;
}

const DOCUMENT_ICONS: Record<string, React.ElementType> = {
  ordonnance: FileText,
  certificat: FileCheck,
  analyses: Microscope,
  imagerie: Scan,
  compte_rendu: ClipboardList,
  arret_travail: Stethoscope,
  orientation: Send,
  bilan_vierge: FlaskConical,
};

/**
 * Historique des documents générés depuis les consultations de ce patient
 * (ordonnances, certificats, arrêts de travail...) — cf.
 * PLAN_CONSULTATION.md L11.5. Distinct de l'onglet « Documents & Imagerie
 * (EDFA) » (`PatientDocumentsTab`), qui gère des fichiers externes importés,
 * pas les documents produits par le cabinet.
 */
export const ConsultationDocumentsTab = ({ patientId }: ConsultationDocumentsTabProps) => {
  const { documents, isLoading, loadByPatient, deleteDocument } = useConsultationDocuments();

  useEffect(() => {
    loadByPatient(patientId);
  }, [patientId, loadByPatient]);

  return (
    <Card className="shadow-card">
      <CardContent className="p-6 space-y-3">
        {isLoading ? (
          <p className="text-xs text-center py-8 text-muted-foreground">Chargement des documents...</p>
        ) : documents.length > 0 ? (
          documents.map(doc => {
            const Icon = DOCUMENT_ICONS[doc.document_type] || FileClock;
            return (
              <div key={doc.id} className="flex items-center justify-between gap-3 p-3.5 border border-border rounded-xl bg-card">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-muted border border-border/50 shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{doc.title}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(doc.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={doc.status === 'printed' ? 'success' : 'secondary'}>
                    {doc.status === 'printed' ? 'Imprimé' : 'Généré'}
                  </Badge>
                  <button
                    type="button"
                    onClick={() => deleteDocument(doc.id)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Retirer cette entrée"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-xs text-center py-8 text-muted-foreground">Aucun document généré pour ce patient.</p>
        )}
      </CardContent>
    </Card>
  );
};
