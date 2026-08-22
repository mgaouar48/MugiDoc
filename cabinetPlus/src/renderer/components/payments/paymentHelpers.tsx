import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, AlertCircle } from "lucide-react";
import { Payment } from "../../../shared/types";

export const getFormattedPaymentDate = (dateStr?: string, createdAt?: string) => {
  const raw = dateStr || createdAt;
  if (!raw) return "Date du jour";
  try {
    if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
      const [y, m, d] = raw.slice(0, 10).split('-').map(Number);
      return format(new Date(y, m - 1, d), "d MMMM yyyy", { locale: fr });
    }
    const parsed = new Date(raw);
    if (isNaN(parsed.getTime())) return raw;
    return format(parsed, "d MMMM yyyy", { locale: fr });
  } catch {
    return raw;
  }
};

// Fonction pour obtenir le badge de statut
export const getStatusBadge = (status: Payment['status']) => {
  const statusConfig = {
    pending: { label: "En attente", variant: "secondary" as const, icon: Clock },
    completed: { label: "Payé", variant: "default" as const, icon: CheckCircle },
    debt: { label: "Dette", variant: "destructive" as const, icon: AlertCircle }
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="flex items-center space-x-1">
      <Icon className="w-3 h-3" />
      <span>{config.label}</span>
    </Badge>
  );
};

// Fonction pour obtenir le label de méthode de paiement
export const getMethodLabel = (method: Payment['method']) => {
  const methodLabels = {
    cash: "Espèces",
    card: "Carte"
  };
  return methodLabels[method] || method;
};

// Fonction pour formater le montant
export const formatAmount = (amount: number) => {
  return new Intl.NumberFormat('fr-DZ', {
    style: 'currency',
    currency: 'DZD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
};

/**
 * Convertit une saisie de formulaire (montant total + montant déjà réglé)
 * vers la colonne comptable `debt_amount`, dont le sens canonique est le
 * RESTE À PAYER. Le résultat est toujours borné à [0, montant total] : une
 * valeur négative gonflerait les revenus du mois et rendrait le total des
 * impayés faux dans le mauvais sens.
 */
export const remainingDebt = (form: { amount: string; paid_amount: string }): number => {
  const total = parseFloat(form.amount || '0');
  const paid = parseFloat(form.paid_amount || '0');
  if (!Number.isFinite(total) || total <= 0) return 0;
  const safePaid = Number.isFinite(paid) ? Math.min(Math.max(paid, 0), total) : 0;
  return Math.round((total - safePaid) * 100) / 100;
};
