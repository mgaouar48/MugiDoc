import { AlertCircle } from "lucide-react";

interface UnpaidAlertBannerProps {
  unpaidAmount: number;
  formatAmount: (amount: number) => string;
  onGoToPayments: () => void;
}

export const UnpaidAlertBanner = ({ unpaidAmount, formatAmount, onGoToPayments }: UnpaidAlertBannerProps) => {
  return (
    <div className="mt-4 px-4 py-3 rounded-xl flex items-center justify-between gap-3 bg-rose-500/10 border border-rose-500/20 shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600 dark:text-rose-400" />
        <div className="min-w-0">
          <p className="text-xs font-bold text-rose-700 dark:text-rose-300">Paiements & Impayés en attente</p>
          <p className="text-xs text-muted-foreground font-mono">{formatAmount(unpaidAmount)} à encaisser</p>
        </div>
      </div>
      <button
        onClick={onGoToPayments}
        className="px-3 py-1.5 text-xs font-bold rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-colors shrink-0"
      >
        Régler en caisse
      </button>
    </div>
  );
};
