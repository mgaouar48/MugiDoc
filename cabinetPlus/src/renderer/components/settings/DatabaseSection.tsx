import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useBackup } from "@/hooks/useSettings";
import {
  ArrowLeft,
  Database,
  Download,
  Upload,
  HardDrive,
  AlertCircle,
  RefreshCw,
  Users,
  Calendar,
  Stethoscope,
  CreditCard,
  Settings,
  FileArchive,
  ShieldCheck,
  Info,
  CheckCircle2,
  Loader2,
} from "lucide-react";

interface DatabaseSectionProps {
  onBack?: () => void;
}

export const DatabaseSection = ({ onBack }: DatabaseSectionProps) => {
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const { toast } = useToast();
  const {
    dbStats,
    isLoading,
    error,
    loadBackupInfo,
    createBackup,
    restoreBackup,
  } = useBackup();

  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    try {
      const backupInfo = await createBackup();
      toast({
        title: "✅ Sauvegarde créée",
        description: `Fichier : ${backupInfo.filename}`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer la sauvegarde",
        variant: "destructive",
      });
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleRestoreBackup = async () => {
    setIsRestoring(true);
    try {
      await restoreBackup();
      toast({
        title: "✅ Restauration réussie",
        description: "La base de données a été restaurée avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de restaurer la sauvegarde",
        variant: "destructive",
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  useEffect(() => {
    if (error) {
      toast({ title: "Erreur", description: error, variant: "destructive" });
    }
  }, [error, toast]);

  const kpiItems = dbStats
    ? [
        { label: "Patients", value: dbStats.patients.count, icon: Users },
        { label: "Rendez-vous", value: dbStats.appointments.count, icon: Calendar },
        { label: "Consultations", value: dbStats.consultations.count, icon: Stethoscope },
        { label: "Paiements", value: dbStats.payments.count, icon: CreditCard },
        { label: "Paramètres", value: dbStats.settings.count, icon: Settings },
        { label: "Taille BD", value: formatFileSize(dbStats.dbSize), icon: FileArchive },
      ]
    : [];

  if (!dbStats) {
    return (
      <div className="p-6 min-h-[400px] flex flex-col items-center justify-center">
        {isLoading ? (
          <>
            <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground text-sm">Chargement des données...</p>
          </>
        ) : (
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-muted border border-border flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="font-semibold text-foreground">Base de données indisponible</p>
            <p className="text-sm text-muted-foreground max-w-xs">
              Cette fonctionnalité n'est disponible que dans l'application Electron desktop.
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="icon-sm" onClick={onBack}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center shrink-0">
              <Database className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground leading-tight">Base de Données</h2>
              <p className="text-xs text-muted-foreground">Sauvegarde & restauration des données du cabinet</p>
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadBackupInfo}
          disabled={isLoading}
          className="gap-2 text-xs border-border"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Actualiser
        </Button>
      </div>

      {/* KPIs - Statistiques sobres */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Statistiques de la base de données
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {kpiItems.map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="rounded-xl border border-border bg-card p-4 flex flex-col items-start justify-between gap-2 shadow-2xs"
            >
              <div className="flex items-center justify-between w-full text-muted-foreground">
                <span className="text-xs font-medium truncate">{label}</span>
                <Icon className="w-4 h-4 shrink-0 text-muted-foreground/70" />
              </div>
              <span className="text-xl font-bold tracking-tight text-foreground leading-none">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions Sauvegarde / Restauration */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Gestion des sauvegardes
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Créer sauvegarde */}
          <div className="rounded-2xl border border-border bg-card p-5 flex flex-col justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <Download className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">Créer une sauvegarde</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Exporte toutes vos données dans un fichier sécurisé sur votre disque.
                </p>
              </div>
            </div>
            <Button
              onClick={handleCreateBackup}
              disabled={isCreatingBackup}
              className="w-full gap-2 h-10 text-sm font-semibold"
            >
              {isCreatingBackup ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sauvegarde en cours...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Sauvegarder maintenant
                </>
              )}
            </Button>
          </div>

          {/* Restaurer sauvegarde */}
          <div className="rounded-2xl border border-border bg-card p-5 flex flex-col justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center shrink-0">
                <Upload className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">Restaurer une sauvegarde</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Importe et remplace les données actuelles depuis un fichier de sauvegarde.
                </p>
              </div>
            </div>
            <Button
              onClick={handleRestoreBackup}
              disabled={isRestoring}
              variant="outline"
              className="w-full border-border text-foreground hover:bg-muted gap-2 h-10 text-sm font-semibold"
            >
              {isRestoring ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Restauration en cours...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Sélectionner un fichier
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Bonnes pratiques */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <p className="text-sm font-semibold text-foreground">Bonnes pratiques de sauvegarde</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            "Les sauvegardes contiennent toutes vos données : patients, rendez-vous, consultations et paiements.",
            "La restauration remplacera intégralement la base de données actuelle — aucune récupération possible.",
            "Créez toujours une sauvegarde avant d'effectuer une restauration ou une migration.",
            "Stockez vos sauvegardes dans un endroit sécurisé : disque externe, clé USB ou cloud.",
          ].map((tip, i) => (
            <div key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span>{tip}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
