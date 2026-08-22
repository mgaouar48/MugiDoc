import { useState, useEffect, useCallback } from 'react';
import { Prescription, PrescriptionSearchFilters } from '../../shared/types';
import { useElectron } from './useElectron';
import { useServerPagination } from './useServerPagination';

const PAGE_SIZE = 10;

/**
 * Liste d'ordonnances paginée côté serveur, réservée à l'onglet "Ordonnances" de
 * PrescriptionsSection. Séparé de usePrescriptions() car ce dernier est réutilisé
 * ailleurs dans l'app (PatientsSection, PrescriptionQuickModal, PrescriptionForm)
 * pour des besoins nécessitant la liste complète.
 */
export const usePrescriptionsList = () => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFilters, setCurrentFilters] = useState<PrescriptionSearchFilters | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const { isElectron } = useElectron();

  const loadPage = useCallback(async (filters: PrescriptionSearchFilters | undefined, targetPage: number) => {
    if (!isElectron) return;

    setIsLoading(true);
    setError(null);
    setCurrentFilters(filters);
    setPage(targetPage);

    try {
      const offset = (targetPage - 1) * PAGE_SIZE;
      const [data, count] = await Promise.all([
        window.electronAPI.prescriptions.getAll({ ...filters, limit: PAGE_SIZE, offset }),
        window.electronAPI.prescriptions.getCount(filters)
      ]);
      setPrescriptions(data);
      setTotal(count);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Impossible de charger les ordonnances';
      setError(errorMessage);
      console.error('Erreur lors du chargement de la liste des ordonnances:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isElectron]);

  const load = useCallback((filters?: PrescriptionSearchFilters) => loadPage(filters, 1), [loadPage]);
  const reload = useCallback(() => loadPage(currentFilters, page), [loadPage, currentFilters, page]);
  const goToPage = useCallback((targetPage: number) => loadPage(currentFilters, targetPage), [loadPage, currentFilters]);

  const pagination = useServerPagination(total, page, goToPage, PAGE_SIZE);

  useEffect(() => {
    if (isElectron) load();
  }, [isElectron, load]);

  return {
    prescriptions,
    isLoading,
    error,
    load,
    reload,
    ...pagination
  };
};
