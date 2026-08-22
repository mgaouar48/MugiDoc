import { useState, useMemo, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Plus,
  Search,
  Clock,
  UserCheck,
  CalendarCheck,
  FileText,
  ShieldCheck,
  FileCheck,
  History,
  Trash2,
  ArrowRight,
} from "lucide-react";
import { MedicalCertificateDialog, SavedCertificate } from "./MedicalCertificateDialog";
import { Patient } from "../../../shared/types";

interface CertificatesSectionProps {
  onBack: () => void;
  onOpenDialog?: (typeKey?: string) => void;
}

const HISTORY_KEY = "mugidoc_certificates_history";

const CERTIFICATE_TYPES = [
  {
    typeKey: "general",
    title: "Repos médical",
    subtitle: "Arrêt de travail",
    description: "Repos et arrêt de travail, avec durée en jours et dates calculées.",
    icon: Clock,
  },
  {
    typeKey: "aptitude",
    title: "Aptitude physique",
    subtitle: "Sport & travail",
    description: "Aptitude à la pratique sportive ou professionnelle.",
    icon: UserCheck,
  },
  {
    typeKey: "reprise",
    title: "Reprise d'activité",
    subtitle: "Travail ou école",
    description: "Autorise la reprise du travail ou des cours à une date donnée.",
    icon: CalendarCheck,
  },
  {
    typeKey: "presence",
    title: "Présence au cabinet",
    subtitle: "Justificatif horaire",
    description: "Justifie la présence du patient au cabinet sur une plage horaire.",
    icon: FileText,
  },
  {
    typeKey: "non_contre_indication",
    title: "Non-contre-indication",
    subtitle: "Pratique sportive",
    description: "Atteste l'absence de contre-indication médicale décelable.",
    icon: ShieldCheck,
  },
  {
    typeKey: "custom",
    title: "Certificat libre",
    subtitle: "Sur-mesure",
    description: "Rédaction entièrement libre d'une attestation imprimable.",
    icon: FileCheck,
  },
];

const readHistory = (): SavedCertificate[] => {
  try {
    const raw = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
};

const formatDay = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString("fr-FR");
};

export const CertificatesSection = ({ onBack, onOpenDialog }: CertificatesSectionProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCertType, setSelectedCertType] = useState<string>("general");
  const [selectedPatient] = useState<Patient | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [history, setHistory] = useState<SavedCertificate[]>([]);

  const refreshHistory = useCallback(() => setHistory(readHistory()), []);

  useEffect(() => {
    refreshHistory();
  }, [refreshHistory]);

  const handleOpenDialog = (typeKey = "general") => {
    setSelectedCertType(typeKey);
    if (onOpenDialog) {
      onOpenDialog(typeKey);
    } else {
      setDialogOpen(true);
    }
  };

  const clearHistory = () => {
    if (!confirm("Effacer l'historique des certificats délivrés ?")) return;
    localStorage.removeItem(HISTORY_KEY);
    refreshHistory();
  };

  const term = searchTerm.trim().toLowerCase();

  const filteredTypes = useMemo(() => {
    if (!term) return CERTIFICATE_TYPES;
    return CERTIFICATE_TYPES.filter(
      (cert) =>
        cert.title.toLowerCase().includes(term) ||
        cert.subtitle.toLowerCase().includes(term) ||
        cert.description.toLowerCase().includes(term)
    );
  }, [term]);

  const filteredHistory = useMemo(() => {
    if (!term) return history;
    return history.filter(
      (c) =>
        c.patientName.toLowerCase().includes(term) ||
        c.typeTitle.toLowerCase().includes(term)
    );
  }, [history, term]);

  return (
    <div className="h-full min-h-0 bg-background flex flex-col">
      <header
        className="bg-card border-b border-border px-6 flex items-center justify-between shrink-0 gap-4"
        style={{ height: "64px" }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon-sm" onClick={onBack} title="Retour">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-foreground leading-none">Certificats médicaux</h2>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              Choisissez un modèle pour rédiger une attestation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="relative w-56 hidden md:block">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-7 text-xs h-8"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                aria-label="Effacer la recherche"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            )}
          </div>

          <Button onClick={() => handleOpenDialog("general")} size="sm" className="gap-1.5 text-xs font-semibold">
            <Plus className="w-4 h-4" />
            Nouveau
          </Button>
        </div>
      </header>

      {/*
        Deux colonnes : modèles à gauche, historique à droite. La zone vide
        sous la grille ne servait à rien ; elle porte désormais les derniers
        certificats délivrés.
      */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="p-6 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
          <section className="space-y-3">
            <div className="flex items-baseline justify-between">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Modèles disponibles
              </h3>
              <span className="text-[11px] text-muted-foreground tabular-nums">
                {filteredTypes.length} / {CERTIFICATE_TYPES.length}
              </span>
            </div>

            {/* Recherche également accessible en écran étroit */}
            <div className="relative md:hidden">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un modèle..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 text-xs h-9 bg-card"
              />
            </div>

            {filteredTypes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-3">
                {filteredTypes.map((cert) => {
                  const Icon = cert.icon;
                  return (
                    <button
                      key={cert.typeKey}
                      type="button"
                      onClick={() => handleOpenDialog(cert.typeKey)}
                      className="group text-left rounded-xl border border-border bg-card p-4 flex flex-col gap-3 transition-all hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                    >
                      <div className="flex items-start gap-3">
                        <span className="shrink-0 w-9 h-9 rounded-lg bg-primary/10 text-primary border border-primary/15 flex items-center justify-center transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                          <Icon className="w-4 h-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-foreground leading-tight group-hover:text-primary transition-colors">
                            {cert.title}
                          </span>
                          <span className="block text-[11px] uppercase tracking-wide text-muted-foreground mt-0.5">
                            {cert.subtitle}
                          </span>
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground leading-relaxed flex-1">
                        {cert.description}
                      </p>

                      <span className="text-xs font-medium text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity">
                        Rédiger <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border py-12 text-center text-xs text-muted-foreground">
                Aucun modèle ne correspond à « {searchTerm} ».
              </div>
            )}
          </section>

          <aside className="rounded-xl border border-border bg-card p-4 space-y-3 xl:sticky xl:top-6">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <History className="w-3.5 h-3.5" />
                Derniers délivrés
              </h3>
              {history.length > 0 && (
                <button
                  type="button"
                  onClick={clearHistory}
                  title="Effacer l'historique"
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {filteredHistory.length > 0 ? (
              <ul className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                {filteredHistory.slice(0, 25).map((cert) => (
                  <li key={cert.id} className="rounded-lg border border-border/70 bg-muted/30 px-3 py-2">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-xs font-semibold text-foreground truncate">
                        {cert.patientCivility} {cert.patientName}
                      </span>
                      <span className="text-[11px] text-muted-foreground tabular-nums shrink-0">
                        {formatDay(cert.date)}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">{cert.typeTitle}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground py-6 text-center">
                {history.length === 0
                  ? "Aucun certificat délivré pour l'instant."
                  : `Aucun certificat ne correspond à « ${searchTerm} ».`}
              </p>
            )}
          </aside>
        </div>
      </div>

      {!onOpenDialog && (
        <MedicalCertificateDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          patient={selectedPatient}
          initialCertType={selectedCertType}
          onSuccess={refreshHistory}
        />
      )}
    </div>
  );
};
