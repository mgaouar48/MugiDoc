import { useState, useEffect, useCallback } from 'react';
import { Consultation, ConsultationSearchFilters } from '../../shared/types';
import { useElectron } from './useElectron';
import { useServerPagination } from './useServerPagination';

const PAGE_SIZE = 10;

/**
 * Liste de consultations paginée côté serveur, réservée à l'écran Consultations
 * (ConsultationsSection). Séparé de useConsultations() car ce dernier est réutilisé
 * ailleurs dans l'app (ex: PatientsSection dérive les consultations d'un patient à
 * partir de la liste complète) pour des besoins nécessitant la liste complète.
 */
export const useConsultationsList = () => {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFilters, setCurrentFilters] = useState<ConsultationSearchFilters | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const { isElectron } = useElectron();

  const loadPage = useCallback(async (filters: ConsultationSearchFilters | undefined, targetPage: number) => {
    if (!isElectron) return;

    setIsLoading(true);
    setError(null);
    setCurrentFilters(filters);
    setPage(targetPage);

    try {
      const offset = (targetPage - 1) * PAGE_SIZE;
      const [data, count] = await Promise.all([
        window.electronAPI.consultations.getAll({ ...filters, limit: PAGE_SIZE, offset }),
        window.electronAPI.consultations.getCount(filters)
      ]);
      setConsultations(data);
      setTotal(count);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Impossible de charger les consultations';
      setError(errorMessage);
      console.error('Erreur lors du chargement de la liste des consultations:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isElectron]);

  const load = useCallback((filters?: ConsultationSearchFilters) => loadPage(filters, 1), [loadPage]);
  const reload = useCallback(() => loadPage(currentFilters, page), [loadPage, currentFilters, page]);
  const goToPage = useCallback((targetPage: number) => loadPage(currentFilters, targetPage), [loadPage, currentFilters]);

  const pagination = useServerPagination(total, page, goToPage, PAGE_SIZE);

  useEffect(() => {
    if (isElectron) load();
  }, [isElectron, load]);

  return {
    consultations,
    isLoading,
    error,
    load,
    reload,
    ...pagination
  };
};
