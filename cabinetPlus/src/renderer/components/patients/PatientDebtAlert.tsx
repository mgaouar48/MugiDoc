import { Wallet } from 'lucide-react';
import { usePatientDebt } from '../../hooks/usePatientDebt';
import { formatAmount } from '../payments/paymentHelpers';

interface PatientDebtAlertProps {
  patientId?: number | null;
  className?: string;
  /** Variante dense, pour un formulaire plutôt qu'une fiche. */
  compact?: boolean;
}

const formatDate = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
};

/**
 * Rappel de dette du patient.
 *
 * Affiché sur la fiche patient et à la sélection du patient en consultation,
 * pour que le montant restant dû soit visible au moment où le médecin peut
 * agir dessus. Ne rend rien quand le patient est à jour.
 */
export const PatientDebtAlert = ({ patientId, className = '', compact = false }: PatientDebtAlertProps) => {
  const { debt } = usePatientDebt(patientId);

  if (debt.totalDue <= 0) return null;

  const count = debt.openPayments.length;

  return (
    <div
      role="status"
      className={`rounded-xl border border-amber-200 bg-amber-50/90 text-amber-900 flex items-start gap-3 ${
        compact ? 'p-3' : 'p-4'
      } ${className}`}
    >
      <div className="p-2 rounded-lg shrink-0 bg-amber-100 text-amber-600">
        <Wallet className={compact ? 'w-4 h-4' : 'w-5 h-5'} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline flex-wrap gap-x-2 gap-y-0.5">
          <h4 className="text-xs font-bold uppercase tracking-wider">Dette en cours</h4>
          <span className="text-sm font-bold tabular-nums">{formatAmount(debt.totalDue)}</span>
        </div>
        <p className={`text-xs mt-0.5 ${compact ? '' : 'mt-1'}`}>
          {count} paiement{count > 1 ? 's' : ''} non soldé{count > 1 ? 's' : ''}
          {debt.oldestDate ? ` · le plus ancien du ${formatDate(debt.oldestDate)}` : ''}.
        </p>
      </div>
    </div>
  );
};
