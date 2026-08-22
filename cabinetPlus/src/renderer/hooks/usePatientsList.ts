import { useState, useEffect, useCallback } from 'react';
import { Patient, PatientSearchFilters } from '../../shared/types';
import { useElectron } from './useElectron';
import { useServerPagination } from './useServerPagination';

const PAGE_SIZE = 10;

/**
 * Liste de patients paginée côté serveur, réservée à l'écran Patients (PatientsSection).
 * Séparé de usePatients() car ce dernier est réutilisé ailleurs dans l'app (sélecteurs de
 * patient, dialogues) qui ont besoin de la liste complète, pas d'une page de 10 éléments.
 */
export const usePatientsList = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFilters, setCurrentFilters] = useState<PatientSearchFilters | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const { isElectron } = useElectron();

  const loadPage = useCallback(async (filters: PatientSearchFilters | undefined, targetPage: number) => {
    if (!isElectron) return;

    setIsLoading(true);
    setError(null);
    setCurrentFilters(filters);
    setPage(targetPage);

    try {
      const offset = (targetPage - 1) * PAGE_SIZE;
      const [data, count] = await Promise.all([
        window.electronAPI.patients.getAll({ ...filters, limit: PAGE_SIZE, offset }),
        window.electronAPI.patients.getCount(filters)
      ]);
      setPatients(data);
      setTotal(count);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Impossible de charger les patients';
      setError(errorMessage);
      console.error('Erreur lors du chargement de la liste des patients:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isElectron]);

  // Charge avec de nouveaux filtres — revient à la page 1
  const load = useCallback((filters?: PatientSearchFilters) => loadPage(filters, 1), [loadPage]);

  // Recharge la page courante avec les filtres actuels (après création/modification/suppression)
  const reload = useCallback(() => loadPage(currentFilters, page), [loadPage, currentFilters, page]);

  const goToPage = useCallback((targetPage: number) => loadPage(currentFilters, targetPage), [loadPage, currentFilters]);

  const pagination = useServerPagination(total, page, goToPage, PAGE_SIZE);

  useEffect(() => {
    if (isElectron) load();
  }, [isElectron, load]);

  return {
    patients,
    isLoading,
    error,
    load,
    reload,
    ...pagination
  };
};
