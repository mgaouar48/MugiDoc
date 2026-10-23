import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ShieldCheck, Clock, CheckCircle, Send, BadgeCheck, XCircle, Loader2 } from "lucide-react";
import { useConsultations } from "../../hooks/useConsultations";
import { ChifaStatut } from "../../../shared/types";
import { formatAmount } from "./paymentHelpers";

interface ChifaTrackingViewProps {
  onBack: () => void;
}

interface ChifaStats {
  total: number;
  aTraiter: number;
  traite: number;
  transmis: number;
  valide: number;
  rejete: number;
  montantPartPatient: number;
  montantPartAssurance: number;
}

const STATUT_LABELS: Record<ChifaStatut, string> = {
  a_traiter: 'À traiter',
  traite: 'Traité',
  transmis: 'Transmis',
  valide: 'Validé',
  rejete: 'Rejeté',
};

const STATUT_OPTIONS: ChifaStatut[] = ['a_traiter', 'traite', 'transmis', 'valide', 'rejete'];

/**
 * Suivi administratif CHIFA/CNAS, dans Facturation — cf. plan CHIFA §10.
 * Purement local : les statuts sont saisis à la main par le médecin/secrétaire
 * après avoir effectué la procédure réelle dans le logiciel CHIFA. Rien ici
 * n'est présenté comme un statut connu de la CNAS.
 */
export const ChifaTrackingView = ({ onBack }: ChifaTrackingViewProps) => {
  const { consultations, isLoading, loadConsultations, updateConsultation } = useConsultations();
  const [stats, setStats] = useState<ChifaStats | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    loadConsultations({ care_mode: 'chifa' });
  }, [loadConsultations]);

  const loadStats = async () => {
    try {
      const data = await window.electronAPI.consultations.getChifaStats();
      setStats(data);
    } catch (err) {
      console.error('Erreur lors du chargement des statistiques CHIFA:', err);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const chifaConsultations = consultations.filter(c => c.care_mode === 'chifa');

  const handleStatutChange = async (id: number, statut: ChifaStatut) => {
    setUpdatingId(id);
    try {
      await updateConsultation(id, { chifa_statut: statut });
      await loadStats();
    } catch (err) {
      console.error('Erreur lors de la mise à jour du statut CHIFA:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border px-8 flex items-center" style={{ height: '64px' }}>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon-sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              Suivi CHIFA
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Suivi administratif local des consultations prises en charge CHIFA/CNAS
            </p>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { label: "À traiter", value: stats?.aTraiter ?? 0, icon: Clock, accent: "text-amber-600 dark:text-amber-400" },
            { label: "Traitées", value: stats?.traite ?? 0, icon: CheckCircle, accent: "text-blue-600 dark:text-blue-400" },
            { label: "Transmises", value: stats?.transmis ?? 0, icon: Send, accent: "text-indigo-600 dark:text-indigo-400" },
            { label: "Validées", value: stats?.valide ?? 0, icon: BadgeCheck, accent: "text-emerald-600 dark:text-emerald-400" },
            { label: "Rejetées", value: stats?.rejete ?? 0, icon: XCircle, accent: "text-red-600 dark:text-red-400" },
          ].map(({ label, value, icon: Icon, accent }) => (
            <div key={label} className="rounded-xl border border-border bg-card p-4 flex flex-col items-start justify-between gap-2 shadow-sm">
              <div className="flex items-center justify-between w-full text-muted-foreground">
                <span className="text-xs font-medium truncate">{label}</span>
                <Icon className="w-4 h-4 shrink-0 text-muted-foreground/70" />
              </div>
              <span className={`font-bold tracking-tight text-2xl text-foreground ${accent}`}>{value}</span>
            </div>
          ))}
        </div>

        {stats && (stats.montantPartPatient > 0 || stats.montantPartAssurance > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-border bg-card p-4">
              <span className="text-xs font-medium text-muted-foreground">Total part patient (CHIFA)</span>
              <p className="text-lg font-bold text-foreground">{formatAmount(stats.montantPartPatient)}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <span className="text-xs font-medium text-muted-foreground">Total part assurance déclarée (CHIFA)</span>
              <p className="text-lg font-bold text-foreground">{formatAmount(stats.montantPartAssurance)}</p>
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Chargement...
            </div>
          ) : chifaConsultations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Aucune consultation CHIFA/CNAS enregistrée.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs text-muted-foreground uppercase">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Date</th>
                  <th className="text-left px-4 py-3 font-medium">Patient</th>
                  <th className="text-left px-4 py-3 font-medium">Acte</th>
                  <th className="text-left px-4 py-3 font-medium">Montant</th>
                  <th className="text-left px-4 py-3 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {chifaConsultations.map(c => (
                  <tr key={c.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3 whitespace-nowrap">{new Date(c.date).toLocaleDateString('fr-FR')}</td>
                    <td className="px-4 py-3">{c.patient ? `${c.patient.first_name} ${c.patient.last_name}` : '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">Consultation médicale</td>
                    <td className="px-4 py-3 font-medium">
                      {c.chifa_tarif_conventionnel !== undefined ? formatAmount(c.chifa_tarif_conventionnel) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Select
                        value={c.chifa_statut || 'a_traiter'}
                        onValueChange={(value: ChifaStatut) => handleStatutChange(c.id, value)}
                        disabled={updatingId === c.id}
                      >
                        <SelectTrigger className="w-40 h-8 border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUT_OPTIONS.map(s => (
                            <SelectItem key={s} value={s}>{STATUT_LABELS[s]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
