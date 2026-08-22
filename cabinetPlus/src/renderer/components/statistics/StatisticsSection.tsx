import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, BarChart3, Users, DollarSign, FileText, Receipt, Filter, Loader2, AlertCircle, Printer, Download, TrendingUp, PieChart } from "lucide-react";
import { useConsultations } from "@/hooks/useConsultations";
import { usePayments } from "@/hooks/usePayments";
import { usePatients } from "@/hooks/usePatients";
import { useExpenses } from "@/hooks/useExpenses";

interface StatisticsSectionProps {
  onBack: () => void;
}

type FilterPeriod = "today" | "week" | "month" | "year" | "custom";

export const StatisticsSection = ({ onBack }: StatisticsSectionProps) => {
  // Hooks pour récupérer les données réelles
  const { consultations, stats: consultationStats, loadConsultations, loadStats: loadConsultationStats } = useConsultations();
  const { payments, stats: paymentStats, loadPayments, loadStats: loadPaymentStats } = usePayments();
  const { patients, stats: patientStats, loadStats: loadPatientStats } = usePatients();
  const { expenses, getExpenseStats, loadExpenses } = useExpenses();

  const [expenseStats, setExpenseStats] = useState<{ total: number; totalAmount: number } | null>(null);
  const [isLoadingFiltered, setIsLoadingFiltered] = useState(false);
  const [currentFilters, setCurrentFilters] = useState<{ dateFrom: string; dateTo: string } | null>(null);
  const [filterError, setFilterError] = useState<string | null>(null);

  // États pour stocker les données filtrées directement
  const [filteredConsultations, setFilteredConsultations] = useState<any[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<any[]>([]);
  const [filteredExpenseStats, setFilteredExpenseStats] = useState<{ total: number; totalAmount: number } | null>(null);
  const [filteredPatientStats, setFilteredPatientStats] = useState<{ total: number } | null>(null);
  const [isFilterActive, setIsFilterActive] = useState(false);

  // États pour les filtres
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>("month");
  const [customDateFrom, setCustomDateFrom] = useState("");
  const [customDateTo, setCustomDateTo] = useState("");

  // Calculer les dates selon le filtre
  const getFilterDates = useCallback(() => {
    const now = new Date();
    let dateFrom = "";
    let dateTo = "";

    switch (filterPeriod) {
      case "today": {
        dateFrom = now.toISOString().split('T')[0];
        dateTo = now.toISOString().split('T')[0];
        break;
      }

      case "week": {
        const startOfWeek = new Date(now);
        const day = now.getDay(); // 0 (dimanche) .. 6 (samedi)
        const diff = day === 0 ? -6 : 1 - day; // aller au lundi de la même semaine
        startOfWeek.setDate(now.getDate() + diff);
        dateFrom = startOfWeek.toISOString().split('T')[0];
        dateTo = now.toISOString().split('T')[0];
        break;
      }

      case "month":
        dateFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        dateTo = now.toISOString().split('T')[0];
        break;

      case "year":
        dateFrom = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
        dateTo = now.toISOString().split('T')[0];
        break;

      case "custom":
        dateFrom = customDateFrom;
        dateTo = customDateTo;
        break;
    }

    return { dateFrom, dateTo };
  }, [filterPeriod, customDateFrom, customDateTo]);

  // Charger les données filtrées (useCallback pour éviter les re-créations)
  const loadFilteredData = useCallback(async () => {
    const { dateFrom, dateTo } = getFilterDates();

    if (!dateFrom || !dateTo) {
      console.warn('Dates manquantes pour le filtrage:', { dateFrom, dateTo });
      setFilterError('Dates manquantes pour le filtrage');
      return;
    }

    // Validation des dates personnalisées
    if (filterPeriod === "custom") {
      if (dateFrom > dateTo) {
        const errorMsg = 'La date de début doit être antérieure à la date de fin';
        console.error(errorMsg);
        setFilterError(errorMsg);
        return;
      }
    }

    setIsLoadingFiltered(true);
    setFilterError(null);
    setCurrentFilters({ dateFrom, dateTo });

    try {
      const filters = {
        date_from: dateFrom,
        date_to: dateTo
      };

      console.log('Application des filtres:', filters, 'Période sélectionnée:', filterPeriod);

      // Charger les données filtrées directement depuis l'API pour les statistiques
      const [consultationsData, paymentsData, patientStatsData] = await Promise.all([
        // Récupérer les consultations filtrées directement
        window.electronAPI.consultations.getAll(filters),
        // Récupérer les paiements filtrés directement
        window.electronAPI.payments.getAll(filters),
        // Récupérer les statistiques patients filtrées par date de création
        window.electronAPI.patients.getStats(filters)
      ]);
      
      // Récupérer les frais filtrés séparément
      const expenseStatsData = await getExpenseStats(filters);

      // Stocker les données filtrées pour le calcul des statistiques
      setFilteredConsultations(consultationsData);
      setFilteredPayments(paymentsData);
      setFilteredExpenseStats(expenseStatsData);
      setFilteredPatientStats(patientStatsData);

      // Activer explicitement le mode filtre
      setIsFilterActive(true);

      // Charger aussi les données dans les hooks pour l'affichage dans les autres composants (non bloquant pour l'affichage des stats)
      Promise.all([
        loadConsultations(filters),
        loadPayments(filters),
        loadExpenses(filters)
      ]).catch(() => {});

      console.log('✅ Données filtrées chargées:', {
        filterPeriod,
        dateFrom,
        dateTo,
        expenseStats: expenseStatsData,
        consultationsCount: consultationsData.length,
        paymentsCount: paymentsData.length,
        patientStats: patientStatsData
      });
    } catch (error) {
      const errorMsg = 'Erreur lors du chargement des données filtrées';
      console.error(errorMsg, error);
      setFilterError(errorMsg);
    } finally {
      setIsLoadingFiltered(false);
    }
  }, [getFilterDates, filterPeriod, getExpenseStats]); // Suppression des dépendances qui causent la boucle

  // Réinitialiser les filtres et charger toutes les données
  const resetFilters = async () => {
    setIsLoadingFiltered(true);
    setFilterError(null);
    setCurrentFilters(null);
    setFilterPeriod("month");
    setCustomDateFrom("");
    setCustomDateTo("");

    // Réinitialiser les données filtrées
    setFilteredConsultations([]);
    setFilteredPayments([]);
    setFilteredExpenseStats(null);
    setFilteredPatientStats(null);

    try {
      // Charger toutes les données sans filtres
      await Promise.all([
        loadConsultations(),
        loadPayments(),
        loadExpenses()
      ]);

      // Recharger les statistiques globales
      await Promise.all([
        loadConsultationStats(),
        loadPaymentStats()
      ]);

      // Recharger les statistiques des frais sans filtres
      const stats = await getExpenseStats();
      setExpenseStats(stats);

      console.log('Données globales rechargées');
    } catch (error) {
      const errorMsg = 'Erreur lors du rechargement des données globales';
      console.error(errorMsg, error);
      setFilterError(errorMsg);
    } finally {
      setIsLoadingFiltered(false);
    }
  };

  // Les statistiques des frais sont maintenant chargées dans le useEffect principal

  // Recharger les données quand le filtre change
  useEffect(() => {
    // Appliquer automatiquement les filtres quand la période change (sauf custom qui nécessite des dates)
    if (filterPeriod !== "custom" && isFilterActive) {
      console.log('Application automatique du filtre pour la période:', filterPeriod);
      // Délai pour éviter les appels multiples
      const timeoutId = setTimeout(() => {
        loadFilteredData();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [filterPeriod, isFilterActive]); // Suppression de loadFilteredData des dépendances

  // Charger automatiquement quand les dates personnalisées changent
  useEffect(() => {
    if (filterPeriod === "custom" && customDateFrom && customDateTo && customDateFrom <= customDateTo) {
      console.log('Chargement automatique pour dates personnalisées:', { customDateFrom, customDateTo });
      setIsFilterActive(true);
      loadFilteredData();
    }
  }, [customDateFrom, customDateTo, filterPeriod]); // Suppression de loadFilteredData

  // Réinitialiser les dates personnalisées quand on change de filtre
  useEffect(() => {
    if (filterPeriod !== "custom") {
      setCustomDateFrom("");
      setCustomDateTo("");
    } else {
      // Si on passe à "custom" sans dates encore, ne pas activer le filtre
      if (!customDateFrom || !customDateTo) {
        setIsFilterActive(false);
      }
    }
  }, [filterPeriod]);

  // Charger les statistiques globales au démarrage (une seule fois)
  useEffect(() => {
    const loadGlobalStats = async () => {
      try {
        console.log('🔄 Chargement des statistiques globales...');

        // Charger les statistiques globales
        await Promise.all([
          loadConsultationStats(),
          loadPaymentStats(),
          loadPatientStats() // Charger les statistiques patients
        ]);

        // Charger les statistiques des frais globales
        const globalExpenseStats = await getExpenseStats();
        setExpenseStats(globalExpenseStats);

        console.log('✅ Statistiques globales chargées');
      } catch (error) {
        console.error('❌ Erreur lors du chargement des statistiques globales:', error);
      }
    };

    loadGlobalStats();
  }, []); // Pas de dépendances pour éviter la boucle infinie

  // Charger les données initiales au montage (sans filtres)
  useEffect(() => {
    console.log('Chargement initial des données');
    // Commencer sans filtres actifs pour utiliser les statistiques globales
    setIsFilterActive(false);
    // Ne pas charger automatiquement les données filtrées au démarrage
    // loadFilteredData();
  }, []);

  // Calculs basés sur les données filtrées ou globales (avec useMemo pour la réactivité)
  const stats = useMemo(() => {
    // Si on a des filtres actifs, calculer à partir des données filtrées stockées
    if (isFilterActive) {
      console.log('🔍 Calcul avec filtres actifs:', currentFilters);
      console.log('📊 Données filtrées disponibles:', {
        consultations: filteredConsultations.length,
        payments: filteredPayments.length,
        expenseStats: filteredExpenseStats,
        patientStats: filteredPatientStats
      });

      // Utiliser le nombre de nouveaux patients créés dans la période filtrée
      const totalPatients = filteredPatientStats?.total || 0;

      // Statistiques des consultations à partir des données filtrées
      const totalConsultations = filteredConsultations.length;
      const completedConsultations = filteredConsultations.filter(c => c.status === 'completed').length;
      const inProgressConsultations = filteredConsultations.filter(c => c.status === 'in-progress').length;
      const scheduledConsultations = filteredConsultations.filter(c => c.status === 'scheduled').length;

      // Statistiques des paiements à partir des données filtrées
      // Revenu global = seulement les paiements complétés + montants virés (amount - debt_amount pour les dettes)
      const completedRevenue = filteredPayments.filter(p => p.status === 'completed').reduce((sum, p) => sum + (p.amount || 0), 0);
      const transferredRevenue = filteredPayments.filter(p => p.status === 'debt').reduce((sum, p) => sum + ((p.amount || 0) - (p.debt_amount || 0)), 0);
      const totalRevenue = completedRevenue + transferredRevenue; // Revenu global = montant réellement reçu

      const completedPayments = filteredPayments.filter(p => p.status === 'completed').length;
      const pendingPayments = filteredPayments.filter(p => p.status === 'pending').length;
      const debtPayments = filteredPayments.filter(p => p.status === 'debt').length;
      const pendingAmount = filteredPayments.filter(p => p.status === 'pending').reduce((sum, p) => sum + (p.amount || 0), 0);
      // Impayés = montant restant après virement (debt_amount pour les dettes)
      const debtAmount = filteredPayments.filter(p => p.status === 'debt').reduce((sum, p) => sum + (p.debt_amount || 0), 0);

      // Statistiques des frais (déjà calculées avec filtres)
      const totalExpenses = filteredExpenseStats?.totalAmount || 0;

      const netProfit = totalRevenue - totalExpenses;
      const averageConsultationPrice = totalConsultations > 0 ? totalRevenue / totalConsultations : 0;

      console.log('📈 Statistiques calculées (filtrées):', {
        totalConsultations,
        totalPatients,
        totalRevenue,
        totalExpenses,
        netProfit
      });

      return {
        totalConsultations,
        totalPatients,
        totalRevenue,
        totalExpenses,
        netProfit,
        averageConsultationPrice,
        consultationStats: {
          total: totalConsultations,
          completed: completedConsultations,
          inProgress: inProgressConsultations,
          scheduled: scheduledConsultations
        },
        paymentStats: {
          total: filteredPayments.length,
          completed: completedPayments,
          pending: pendingPayments,
          debt: debtPayments,
          totalAmount: totalRevenue,
          pendingAmount,
          debtAmount
        }
      };
    } else {
      // Utiliser les statistiques globales (quand aucun filtre actif)
      console.log('🌍 Calcul avec statistiques globales (aucun filtre actif)');
      console.log('📊 Données disponibles:', {
        consultationStats,
        patientStats,
        paymentStats,
        expenseStats
      });

      const totalConsultations = consultationStats?.total || 0;
      const totalPatients = patientStats?.total || 0;
      const totalRevenue = paymentStats?.totalAmount || 0;
      const totalExpenses = expenseStats?.totalAmount || 0;
      const netProfit = totalRevenue - totalExpenses;
      const averageConsultationPrice = totalConsultations > 0 ? totalRevenue / totalConsultations : 0;

      console.log('📈 Statistiques calculées (globales):', {
        totalConsultations,
        totalPatients,
        totalRevenue,
        totalExpenses,
        netProfit
      });

      return {
        totalConsultations,
        totalPatients,
        totalRevenue,
        totalExpenses,
        netProfit,
        averageConsultationPrice,
        consultationStats,
        paymentStats
      };
    }
  }, [currentFilters, filteredConsultations, filteredPayments, filteredExpenseStats, filteredPatientStats, consultationStats, paymentStats, patientStats, expenseStats, isFilterActive]);

  const {
    totalConsultations,
    totalPatients,
    totalRevenue,
    totalExpenses,
    netProfit,
    averageConsultationPrice,
    consultationStats: currentConsultationStats,
    paymentStats: currentPaymentStats
  } = stats;

  // Frais: nombre et moyenne en respectant le filtre
  const expenseCount = currentFilters ? (filteredExpenseStats?.total || 0) : (expenseStats?.total || 0);
  const averageExpenseAmount = expenseCount > 0 ? (totalExpenses / expenseCount) : 0;

  // Formater les montants en DZD
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Obtenir le libellé de la période
  const getPeriodLabel = () => {
    if (isFilterActive && currentFilters) {
      const dateFrom = new Date(currentFilters.dateFrom).toLocaleDateString('fr-FR');
      const dateTo = new Date(currentFilters.dateTo).toLocaleDateString('fr-FR');
      return `Du ${dateFrom} au ${dateTo}`;
    }

    if (!isFilterActive) {
      return "Toutes les données";
    }

    switch (filterPeriod) {
      case "today": return "Aujourd'hui";
      case "week": return "Cette semaine";
      case "month": return "Ce mois";
      case "year": return "Cette année";
      case "custom": {
        if (customDateFrom && customDateTo) {
          const dateFrom = new Date(customDateFrom).toLocaleDateString('fr-FR');
          const dateTo = new Date(customDateTo).toLocaleDateString('fr-FR');
          return `Du ${dateFrom} au ${dateTo}`;
        }
        return "Sélectionnez les dates";
      }
      default: return "Toutes les données";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border px-8 flex items-center" style={{ height: '64px' }}>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onBack}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center justify-between w-full">
              <h2 className="text-xl font-semibold text-foreground">Statistiques & Bilan Financier</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="text-xs gap-1.5 border-border print:hidden"
              >
                <Printer className="w-3.5 h-3.5 text-primary" />
                <span>Imprimer Bilan / Rapport</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Section Filtres globale */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtres - {getPeriodLabel()}
              {isLoadingFiltered && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label>Période</Label>
                <Select value={filterPeriod} onValueChange={(value: FilterPeriod) => {
                  console.log('Changement de période vers:', value);
                  setFilterPeriod(value);
                  if (value !== "custom") {
                    console.log('Activation du filtre pour période:', value);
                    setIsFilterActive(true);
                    // Appeler directement loadFilteredData pour éviter les problèmes de timing
                    setTimeout(() => {
                      loadFilteredData();
                    }, 50);
                  } else {
                    // Pour custom, désactiver le filtre jusqu'à ce que les dates soient saisies
                    setIsFilterActive(false);
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Aujourd'hui</SelectItem>
                    <SelectItem value="week">Cette semaine</SelectItem>
                    <SelectItem value="month">Ce mois</SelectItem>
                    <SelectItem value="year">Cette année</SelectItem>
                    <SelectItem value="custom">Période personnalisée</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {filterPeriod === "custom" && (
                <>
                  <div className="space-y-2">
                    <Label>Date de début</Label>
                    <Input
                      type="date"
                      value={customDateFrom}
                      onChange={(e) => setCustomDateFrom(e.target.value)}
                      max={customDateTo || undefined}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Date de fin</Label>
                    <Input
                      type="date"
                      value={customDateTo}
                      onChange={(e) => setCustomDateTo(e.target.value)}
                      min={customDateFrom || undefined}
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  {filterPeriod === "custom" && customDateFrom && customDateTo && customDateFrom > customDateTo && (
                    <div className="col-span-full">
                      <p className="text-sm text-red-600 flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                        <span>La date de début doit être antérieure à la date de fin</span>
                      </p>
                    </div>
                  )}
                </>
              )}

              <div className="space-y-2">
                <Label>&nbsp;</Label>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsFilterActive(false);
                    setFilterPeriod("month");
                    setCustomDateFrom("");
                    setCustomDateTo("");
                    resetFilters();
                  }}
                  className="w-full"
                >
                  Toutes les données
                </Button>
              </div>

            </div>

            {/* Affichage des erreurs */}
            {filterError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{filterError}</span>
                </p>
              </div>
            )}

            {/* Indicateur de filtres actifs */}
            {isFilterActive && (
              <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg flex items-center justify-between text-xs">
                <span className="font-medium text-foreground flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-primary" />
                  <span>Filtres actifs : {getPeriodLabel()}</span>
                </span>
                <Button 
                  variant="ghost" 
                  size="xs" 
                  onClick={resetFilters} 
                  className="h-6 text-xs text-muted-foreground hover:text-foreground"
                >
                  Réinitialiser
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cartes de statistiques principales simplifiées */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:border-primary/30 transition-colors">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Consultations</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {isLoadingFiltered ? (
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    ) : (
                      totalConsultations
                    )}
                  </p>
                </div>
                <div className="p-2.5 bg-primary/10 rounded-lg text-primary">
                  <FileText className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:border-primary/30 transition-colors">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Nouveaux Patients</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {isLoadingFiltered ? (
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    ) : (
                      totalPatients
                    )}
                  </p>
                </div>
                <div className="p-2.5 bg-primary/10 rounded-lg text-primary">
                  <Users className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:border-emerald-500/30 transition-colors">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Revenus Reçus</p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 font-mono tracking-tight">
                    {formatAmount(totalRevenue)}
                  </p>
                </div>
                <div className="p-2.5 bg-emerald-500/10 rounded-lg text-emerald-600 dark:text-emerald-400">
                  <DollarSign className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:border-primary/30 transition-colors">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Bénéfice Net</p>
                  <p className={`text-2xl font-bold mt-1 font-mono tracking-tight ${netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {formatAmount(netProfit)}
                  </p>
                </div>
                <div className={`p-2.5 rounded-lg ${netProfit >= 0 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
                  <BarChart3 className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Statistiques détaillées unifiées */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <BarChart3 className="h-4 w-4 text-primary" />
              Statistiques Détaillées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Détail des Consultations */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-border/50">
                  <FileText className="h-3.5 w-3.5 text-primary" />
                  Consultations
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-3 bg-muted/40 border border-border/50 rounded-lg">
                    <span className="text-xs font-medium text-foreground">Total</span>
                    <span className="text-sm font-bold text-foreground font-mono">{totalConsultations}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/20 border border-border/40 rounded-lg">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      Terminées
                    </span>
                    <span className="text-sm font-semibold text-foreground font-mono">{currentConsultationStats?.completed || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/20 border border-border/40 rounded-lg">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      En cours
                    </span>
                    <span className="text-sm font-semibold text-foreground font-mono">{currentConsultationStats?.inProgress || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/20 border border-border/40 rounded-lg">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                      Programmées
                    </span>
                    <span className="text-sm font-semibold text-foreground font-mono">{currentConsultationStats?.scheduled || 0}</span>
                  </div>
                </div>
              </div>

              {/* Détail des Revenus */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-border/50">
                  <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                  Revenus & Paiements
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                    <span className="text-xs font-medium text-foreground">Reçu (Encaissements)</span>
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      {formatAmount(totalRevenue)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/20 border border-border/40 rounded-lg">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      En attente
                    </span>
                    <span className="text-sm font-semibold text-foreground font-mono">
                      {formatAmount(currentPaymentStats?.pendingAmount || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/20 border border-border/40 rounded-lg">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                      Reste dû (Dettes)
                    </span>
                    <span className="text-sm font-semibold text-rose-600 dark:text-rose-400 font-mono">
                      {formatAmount(currentPaymentStats?.debtAmount || 0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Détail des Frais */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-border/50">
                  <Receipt className="h-3.5 w-3.5 text-rose-600" />
                  Dépenses & Frais
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-3 bg-rose-500/5 border border-rose-500/20 rounded-lg">
                    <span className="text-xs font-medium text-foreground">Total Dépenses</span>
                    <span className="text-sm font-bold text-rose-600 dark:text-rose-400 font-mono">
                      {formatAmount(totalExpenses)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/20 border border-border/40 rounded-lg">
                    <span className="text-xs font-medium text-muted-foreground">Nombre de dépenses</span>
                    <span className="text-sm font-semibold text-foreground font-mono">
                      {expenseCount}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/20 border border-border/40 rounded-lg">
                    <span className="text-xs font-medium text-muted-foreground">Dépense moyenne</span>
                    <span className="text-sm font-semibold text-foreground font-mono">
                      {formatAmount(averageExpenseAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-primary/5 border border-primary/20 rounded-lg">
                    <span className="text-xs font-semibold text-foreground">Bénéfice Net Période</span>
                    <span className={`text-sm font-bold font-mono ${netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {formatAmount(netProfit)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};