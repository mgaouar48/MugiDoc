import { Banknote, Stethoscope, FileCheck, FileText, Users } from "lucide-react";

interface QuickActionsCardProps {
  isSecretary: boolean;
  canCreateConsultation: boolean;
  canViewPrescriptions: boolean;
  cabinetName?: string;
  doctorSpeciality?: string;
  cabinetPhone?: string;
  doctorName: string;
  onNavigate: (section: string, quickActionType?: string) => void;
}

export const QuickActionsCard = ({
  isSecretary,
  canCreateConsultation,
  canViewPrescriptions,
  cabinetName,
  doctorSpeciality,
  cabinetPhone,
  doctorName,
  onNavigate,
}: QuickActionsCardProps) => {
  const items = [
    isSecretary && {
      label: "Encaissement du Paiement", icon: Banknote,
      color: "text-emerald-600 dark:text-emerald-400 font-bold", bg: "bg-emerald-500/10 border border-emerald-500/30",
      action: () => onNavigate("payments"),
    },
    canCreateConsultation && {
      label: "Nouvelle Consultation", icon: Stethoscope,
      color: "text-primary", bg: "bg-primary/10 border border-primary/20",
      action: () => onNavigate("consultations", "newConsultation"),
    },
    canCreateConsultation && {
      label: "Certificat Médical", icon: FileCheck,
      color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10 border border-emerald-500/20",
      action: () => onNavigate("certificates"),
    },
    canViewPrescriptions && {
      label: "Ordonnances", icon: FileText,
      color: "text-primary", bg: "bg-primary/10 border border-primary/20",
      action: () => onNavigate("prescriptions"),
    },
    !isSecretary && {
      label: "Caisse & Paiements", icon: Banknote,
      color: "text-emerald-600 dark:text-emerald-400 font-bold", bg: "bg-emerald-500/10 border border-emerald-500/20",
      action: () => onNavigate("payments"),
    },
    {
      label: "Base de Données Patients", icon: Users,
      color: "text-muted-foreground", bg: "bg-muted border border-border",
      action: () => onNavigate("patients"),
    },
  ].filter(Boolean) as { label: string; icon: any; color: string; bg: string; action: () => void }[];

  return (
    <div className="bg-card border border-border/70 rounded-xl shadow-2xs p-5 flex flex-col justify-between flex-1">
      <div>
        <div className="pb-3 mb-3 border-b border-border/60 flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Raccourcis & Actions</h3>
          <span className="text-[10px] font-medium text-muted-foreground">Accès direct</span>
        </div>
        <div className="space-y-2">
          {items.map((item) => (
            <button
              key={item.label}
              onClick={item.action}
              className="w-full flex items-center gap-3.5 px-3.5 py-3 rounded-lg text-sm text-left transition-all duration-150 hover:bg-muted/80 border border-transparent hover:border-border/60 group"
            >
              <div className={`w-9 h-9 rounded-lg ${item.bg} flex items-center justify-center flex-shrink-0 transition-transform duration-150 group-hover:scale-105`}>
                <item.icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <span className="font-semibold text-foreground text-xs sm:text-sm">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Info Cabinet */}
      <div className="mt-4 pt-4 border-t border-border/60 flex items-center gap-3 bg-muted/40 p-3 rounded-xl">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-primary-foreground font-bold text-base flex-shrink-0 bg-primary shadow-2xs">
          {cabinetName ? cabinetName.charAt(0).toUpperCase() : 'M'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold truncate text-foreground">{cabinetName || 'Cabinet Médical'}</p>
          <p className="text-[10px] truncate text-muted-foreground mt-0.5">
            {doctorName} · {doctorSpeciality || 'Médecin'}{cabinetPhone ? ` · ${cabinetPhone}` : ''}
          </p>
        </div>
      </div>
    </div>
  );
};
