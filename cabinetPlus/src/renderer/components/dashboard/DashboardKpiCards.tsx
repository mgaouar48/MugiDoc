import { Calendar, Users, Stethoscope, TrendingUp } from "lucide-react";

interface DashboardKpiCardsProps {
  loading: boolean;
  appointmentsToday?: number;
  waitingCount: number;
  consultationsToday?: number;
  totalPatients?: number;
  monthlyRevenue?: number;
  canViewTotalFinancialStats: boolean;
  formatAmount: (amount: number) => string;
}

export const DashboardKpiCards = ({
  loading,
  appointmentsToday,
  waitingCount,
  consultationsToday,
  totalPatients,
  monthlyRevenue,
  canViewTotalFinancialStats,
  formatAmount,
}: DashboardKpiCardsProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 shrink-0">
      <div className="bg-card border border-border/70 rounded-xl p-4 flex items-center gap-3.5 shadow-2xs hover:border-primary/40 transition-all">
        <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
          <Calendar className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider truncate">RDV Aujourd'hui</p>
          <p className="text-xl font-extrabold text-foreground font-mono leading-tight">{loading ? "–" : appointmentsToday ?? 0}</p>
        </div>
      </div>

      <div className="bg-card border border-border/70 rounded-xl p-4 flex items-center gap-3.5 shadow-2xs hover:border-amber-500/40 transition-all">
        <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
          <Users className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider truncate">En Salle d'Attente</p>
          <p className="text-xl font-extrabold text-amber-600 dark:text-amber-400 font-mono leading-tight">{loading ? "–" : waitingCount}</p>
        </div>
      </div>

      <div className="bg-card border border-border/70 rounded-xl p-4 flex items-center gap-3.5 shadow-2xs hover:border-primary/40 transition-all">
        <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
          <Stethoscope className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider truncate">Consultations</p>
          <p className="text-xl font-extrabold text-foreground font-mono leading-tight">{loading ? "–" : consultationsToday ?? 0}</p>
        </div>
      </div>

      <div className="bg-card border border-border/70 rounded-xl p-4 flex items-center gap-3.5 shadow-2xs hover:border-primary/40 transition-all">
        <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
          <Users className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider truncate">Patients Actifs</p>
          <p className="text-xl font-extrabold text-foreground font-mono leading-tight">{loading ? "–" : totalPatients ?? 0}</p>
        </div>
      </div>

      {canViewTotalFinancialStats && (
        <div className="bg-card border border-emerald-500/30 rounded-xl p-4 flex items-center gap-3.5 shadow-2xs hover:border-emerald-500/60 transition-all col-span-2 md:col-span-4 lg:col-span-1">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider truncate">Revenus du Mois</p>
            <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono leading-tight">
              {loading ? "–" : formatAmount(monthlyRevenue ?? 0)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
