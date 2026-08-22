import { useState, useEffect, useCallback } from 'react';
import { Appointment, AppointmentSearchFilters } from '../../shared/types';
import { useElectron } from './useElectron';
import { useServerPagination } from './useServerPagination';

const PAGE_SIZE = 10;

/**
 * Liste de rendez-vous paginée côté serveur, réservée à l'écran Rendez-vous
 * (AppointmentsSection). Séparé de useAppointments() car ce dernier est réutilisé
 * ailleurs dans l'app pour des besoins nécessitant la liste complète.
 */
export const useAppointmentsList = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFilters, setCurrentFilters] = useState<AppointmentSearchFilters | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const { isElectron } = useElectron();

  const loadPage = useCallback(async (filters: AppointmentSearchFilters | undefined, targetPage: number) => {
    if (!isElectron) return;

    setIsLoading(true);
    setError(null);
    setCurrentFilters(filters);
    setPage(targetPage);

    try {
      const offset = (targetPage - 1) * PAGE_SIZE;
      const [data, count] = await Promise.all([
        window.electronAPI.appointments.getAll({ ...filters, limit: PAGE_SIZE, offset }),
        window.electronAPI.appointments.getCount(filters)
      ]);
      setAppointments(data);
      setTotal(count);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Impossible de charger les rendez-vous';
      setError(errorMessage);
      console.error('Erreur lors du chargement de la liste des rendez-vous:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isElectron]);

  const load = useCallback((filters?: AppointmentSearchFilters) => loadPage(filters, 1), [loadPage]);
  const reload = useCallback(() => loadPage(currentFilters, page), [loadPage, currentFilters, page]);
  const goToPage = useCallback((targetPage: number) => loadPage(currentFilters, targetPage), [loadPage, currentFilters]);

  const pagination = useServerPagination(total, page, goToPage, PAGE_SIZE);

  useEffect(() => {
    if (isElectron) load();
  }, [isElectron, load]);

  return {
    appointments,
    isLoading,
    error,
    load,
    reload,
    ...pagination
  };
};
