import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PaginationControls } from "../ui/pagination-controls";
import {
  ArrowLeft,
  CreditCard,
  Search,
  Calendar as CalendarIcon,
  AlertCircle,
  Plus,
  Edit,
  Trash2,
  Loader2,
  CheckCircle,
  Clock,
  Banknote,
  Printer
} from "lucide-react";
import { Payment } from "../../../shared/types";
import { getFormattedPaymentDate, getMethodLabel, formatAmount } from "./paymentHelpers";

interface PaymentStats {
  total: number;
  completed: number;
  pending: number;
  debt: number;
  totalAmount: number;
  debtAmount: number;
}

interface PaymentListProps {
  payments: Payment[];
  stats: PaymentStats | null;
  canViewTotalFinancialStats: boolean;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  filterStatus: "all" | "pending" | "completed" | "debt";
  setFilterStatus: (value: "all" | "pending" | "completed" | "debt") => void;
  filterMethod: "all" | "cash" | "card";
  setFilterMethod: (value: "all" | "cash" | "card") => void;
  isLoading: boolean;
  currentPage: number;
  totalPages: number;
  goToPage: (page: number) => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
  startIndex: number;
  endIndex: number;
  totalItems: number;
  onBack: () => void;
  onNewPayment: () => void;
  onOpenCollectModal: (payment: Payment) => void;
  onPrintReceipt: (payment: Payment) => void;
  onEdit: (payment: Payment) => void;
  onDelete: (paymentId: number) => void;
}

export const PaymentList = ({
  payments,
  stats,
  canViewTotalFinancialStats,
  searchTerm,
  setSearchTerm,
  filterStatus,
  setFilterStatus,
  filterMethod,
  setFilterMethod,
  isLoading,
  currentPage,
  totalPages,
  goToPage,
  canGoNext,
  canGoPrevious,
  startIndex,
  endIndex,
  totalItems,
  onBack,
  onNewPayment,
  onOpenCollectModal,
  onPrintReceipt,
  onEdit,
  onDelete,
}: PaymentListProps) => {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border px-8 flex items-center" style={{ height: '64px' }}>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon-sm" onClick={onBack}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Gestion des Paiements</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Gérez les paiements et facturations du cabinet</p>
            </div>
          </div>
          <Button onClick={onNewPayment}>
            <Plus className="w-4 h-4" />
            Nouveau Paiement
          </Button>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Statistiques - Sobres & Élégantes */}
        {canViewTotalFinancialStats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              {
                label: "Total paiements",
                value: stats?.total || 0,
                icon: CreditCard,
                isAmount: false
              },
              {
                label: "Paiements réglés",
                value: stats?.completed || 0,
                icon: CheckCircle,
                isAmount: false,
                accent: "text-emerald-600 dark:text-emerald-400"
              },
              {
                label: "En attente",
                value: stats?.pending || 0,
                icon: Clock,
                isAmount: false,
                accent: "text-amber-600 dark:text-amber-400"
              },
              {
                label: "Dettes en cours",
                value: stats?.debt || 0,
                icon: AlertCircle,
                isAmount: false,
                accent: "text-red-600 dark:text-red-400"
              },
              {
                label: "Montant perçu",
                value: formatAmount(stats?.totalAmount || 0),
                icon: Banknote,
                isAmount: true,
                accent: "text-emerald-600 dark:text-emerald-400"
              },
              {
                label: "Reste à recouvrer",
                value: formatAmount(stats?.debtAmount || 0),
                icon: AlertCircle,
                isAmount: true,
                accent: "text-red-600 dark:text-red-400"
              }
            ].map(({ label, value, icon: Icon, isAmount, accent }) => (
              <div
                key={label}
                className="rounded-xl border border-border bg-card p-4 flex flex-col items-start justify-between gap-2 shadow-sm hover:border-border/80 transition-colors"
              >
                <div className="flex items-center justify-between w-full text-muted-foreground">
                  <span className="text-xs font-medium truncate">{label}</span>
                  <Icon className="w-4 h-4 shrink-0 text-muted-foreground/70" />
                </div>
                <span className={`font-bold tracking-tight text-foreground ${isAmount ? 'text-sm sm:text-base' : 'text-2xl'} ${accent || ''}`}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Filtres et recherche */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un patient..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-border"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Select value={filterStatus} onValueChange={(value: "all" | "pending" | "completed" | "debt") => setFilterStatus(value)}>
              <SelectTrigger className="w-48 border-border">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="completed">Payés</SelectItem>
                <SelectItem value="debt">Dettes</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterMethod} onValueChange={(value: "all" | "cash" | "card") => setFilterMethod(value)}>
              <SelectTrigger className="w-48 border-border">
                <SelectValue placeholder="Filtrer par méthode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les méthodes</SelectItem>
                <SelectItem value="cash">Espèces</SelectItem>
                <SelectItem value="card">Carte</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Liste des paiements */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          {/* Header de la liste */}
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Liste des Paiements</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{totalItems} paiement(s) trouvé(s)</p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-14 gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Chargement des paiements...</span>
            </div>
          ) : totalItems > 0 ? (
            <div>
              <div className="divide-y divide-border">
                {payments.map((payment) => {
                  const patientName = payment.patient?.first_name && payment.patient?.last_name
                    ? `${payment.patient.first_name} ${payment.patient.last_name}`
                    : "Patient anonyme";

                  const initials = payment.patient?.first_name && payment.patient?.last_name
                    ? `${payment.patient.first_name[0]}${payment.patient.last_name[0]}`.toUpperCase()
                    : "P";

                  const isCompleted = payment.status === 'completed';
                  const isDebt = payment.status === 'debt';

                  return (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/40 transition-colors group gap-4"
                    >
                      {/* 1. Colonne Gauche : Patient + Date + Mode */}
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        {/* Avatar Initiales / Icône */}
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border ${
                          isCompleted
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                            : isDebt
                            ? "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400"
                            : "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400"
                        }`}>
                          {initials}
                        </div>

                        {/* Infos patient & Date Consultation */}
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-foreground truncate">{patientName}</p>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground flex-wrap">
                            <span className="inline-flex items-center gap-1 font-medium text-foreground/90 bg-muted/60 px-2 py-0.5 rounded-md border border-border/80">
                              <CalendarIcon className="w-3.5 h-3.5 text-primary" />
                              <span>Consultation du {getFormattedPaymentDate(payment.date, payment.created_at)}</span>
                            </span>
                            <span className="inline-flex items-center gap-1 font-medium text-[11px] px-2 py-0.5 rounded-md bg-muted border border-border">
                              {payment.method === 'cash' ? <Banknote className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> : <CreditCard className="w-3 h-3 text-blue-600 dark:text-blue-400" />}
                              {getMethodLabel(payment.method)}
                            </span>
                            {payment.notes && (
                              <span className="italic text-[11px] truncate max-w-[200px] text-muted-foreground">
                                · {payment.notes}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 2. Colonne Centre : Badge de Statut */}
                      <div className="w-32 flex flex-col items-center justify-center shrink-0">
                        {isCompleted ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            Payé
                          </span>
                        ) : isDebt ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/30">
                              <AlertCircle className="w-3 h-3 text-red-600 dark:text-red-400" />
                              Dette
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                            <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            En attente
                          </span>
                        )}
                      </div>

                      {/* 3. Colonne Montant */}
                      <div className="min-w-[130px] text-right shrink-0 pr-1">
                        <p className={`font-bold font-mono text-base leading-tight ${
                          isCompleted ? 'text-emerald-600 dark:text-emerald-400' : isDebt ? 'text-red-600 dark:text-red-400' : 'text-foreground'
                        }`}>
                          {formatAmount(payment.amount)}
                        </p>
                        {isDebt && (
                          <div className="text-[11px] mt-0.5 space-y-0.5">
                            <p className="text-emerald-600 dark:text-emerald-400 font-medium">
                              Versé: {formatAmount(payment.amount - (payment.debt_amount || 0))}
                            </p>
                            <p className="text-red-600 dark:text-red-400 font-bold">
                              Reste: {formatAmount(payment.debt_amount || 0)}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* 4. Colonne Actions : Boutons harmonisés et réajustés */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {!isCompleted && (
                          <Button
                            size="sm"
                            onClick={() => onOpenCollectModal(payment)}
                            className="text-xs h-8 px-3 gap-1.5 font-bold bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 rounded-lg"
                            title="Encaisser ce paiement"
                          >
                            <Banknote className="w-3.5 h-3.5" />
                            <span>Encaisser</span>
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onPrintReceipt(payment)}
                          className="text-xs h-8 px-2.5 gap-1.5 border-border bg-card text-foreground hover:bg-muted rounded-lg shadow-sm"
                          title="Imprimer Ticket Thermique (80mm)"
                        >
                          <Printer className="w-3.5 h-3.5 text-primary" />
                          <span>Ticket</span>
                        </Button>

                        <div className="flex items-center gap-1 border-l border-border pl-1.5 ml-0.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(payment)}
                            disabled={isLoading}
                            title="Modifier les détails"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground rounded-lg"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { if (confirm(`Supprimer ce paiement de ${patientName} ?`)) onDelete(payment.id); }}
                            className="text-destructive/80 hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0 rounded-lg"
                            disabled={isLoading}
                            title="Supprimer ce paiement"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              <div className="px-5 py-3 border-t border-border">
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={goToPage}
                  canGoPrevious={canGoPrevious}
                  canGoNext={canGoNext}
                  startIndex={startIndex}
                  endIndex={endIndex}
                  totalItems={totalItems}
                />
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-muted border border-border flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-7 h-7 text-muted-foreground" />
              </div>
              <h3 className="text-base font-semibold mb-1">Aucun paiement trouvé</h3>
              <p className="text-sm text-muted-foreground mb-5">
                {searchTerm || filterStatus !== "all" || filterMethod !== "all"
                  ? "Aucun paiement ne correspond à vos critères de recherche."
                  : "Commencez par enregistrer votre premier paiement."}
              </p>
              <Button onClick={onNewPayment} className="gap-2">
                <Plus className="w-4 h-4" />
                Nouveau Paiement
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
