import { useState, useEffect, useCallback } from 'react';
import { Payment, PaymentSearchFilters } from '../../shared/types';
import { useElectron } from './useElectron';
import { useServerPagination } from './useServerPagination';

const PAGE_SIZE = 10;

/**
 * Liste de paiements paginée côté serveur, réservée à l'écran Paiements
 * (PaymentsSection). Séparé de usePayments() car ce dernier est réutilisé ailleurs
 * dans l'app (ex: QuickPaymentModal, StatisticsSection) pour des besoins nécessitant
 * la liste complète.
 */
export const usePaymentsList = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFilters, setCurrentFilters] = useState<PaymentSearchFilters | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const { isElectron } = useElectron();

  const loadPage = useCallback(async (filters: PaymentSearchFilters | undefined, targetPage: number) => {
    if (!isElectron) return;

    setIsLoading(true);
    setError(null);
    setCurrentFilters(filters);
    setPage(targetPage);

    try {
      const offset = (targetPage - 1) * PAGE_SIZE;
      const [data, count] = await Promise.all([
        window.electronAPI.payments.getAll({ ...filters, limit: PAGE_SIZE, offset }),
        window.electronAPI.payments.getCount(filters)
      ]);
      setPayments(data);
      setTotal(count);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Impossible de charger les paiements';
      setError(errorMessage);
      console.error('Erreur lors du chargement de la liste des paiements:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isElectron]);

  const load = useCallback((filters?: PaymentSearchFilters) => loadPage(filters, 1), [loadPage]);
  const reload = useCallback(() => loadPage(currentFilters, page), [loadPage, currentFilters, page]);
  const goToPage = useCallback((targetPage: number) => loadPage(currentFilters, targetPage), [loadPage, currentFilters]);

  const pagination = useServerPagination(total, page, goToPage, PAGE_SIZE);

  useEffect(() => {
    if (isElectron) load();
  }, [isElectron, load]);

  return {
    payments,
    isLoading,
    error,
    load,
    reload,
    ...pagination
  };
};
