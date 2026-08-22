import { useState, useEffect, useCallback } from 'react';
import { Patient, CreatePatientRequest, UpdatePatientRequest, PatientSearchFilters } from '../../shared/types';
import { useElectron } from './useElectron';

interface UsePatients {
  patients: Patient[];
  isLoading: boolean;
  error: string | null;
  stats: { total: number } | null;

  // Actions
  loadPatients: (filters?: PatientSearchFilters) => Promise<void>;
  getPatientById: (id: number) => Promise<Patient | null>;
  createPatient: (patientData: CreatePatientRequest) => Promise<Patient>;
  updatePatient: (id: number, patientData: UpdatePatientRequest) => Promise<Patient>;
  deletePatient: (id: number, transferPayments?: boolean) => Promise<void>;
  searchPatients: (query: string) => Promise<Patient[]>;
  loadStats: (filters?: { date_from?: string; date_to?: string }) => Promise<void>;

  // Utilitaires
  refreshPatients: () => Promise<void>;
  clearError: () => void;
}

export const usePatients = (): UsePatients => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{ total: number } | null>(null);
  const [currentFilters, setCurrentFilters] = useState<PatientSearchFilters | undefined>(undefined);

  const { isElectron } = useElectron();

  // Charger les patients avec filtres optionnels
  const loadPatients = useCallback(async (filters?: PatientSearchFilters) => {
    if (!isElectron) return;

    setIsLoading(true);
    setError(null);
    setCurrentFilters(filters);

    try {
      const patientsData = await window.electronAPI.patients.getAll(filters);
      setPatients(patientsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Impossible de charger les patients';
      setError(errorMessage);
      console.error('Erreur lors du chargement des patients:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isElectron]);

  // Charger les statistiques
  const loadStats = useCallback(async (filters?: { date_from?: string; date_to?: string }) => {
    if (!isElectron) return;

    try {
      const statsData = await window.electronAPI.patients.getStats(filters);
      setStats(statsData);
    } catch (err) {
      console.error('Erreur lors du chargement des statistiques:', err);
    }
  }, [isElectron]);

  // Récupérer un patient par ID
  const getPatientById = useCallback(async (id: number): Promise<Patient | null> => {
    if (!isElectron) return null;

    try {
      return await window.electronAPI.patients.getById(id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Impossible de récupérer le patient ${id}`;
      setError(errorMessage);
      throw err;
    }
  }, [isElectron]);

  // Créer un nouveau patient
  const createPatient = useCallback(async (patientData: CreatePatientRequest): Promise<Patient> => {
    if (!isElectron) throw new Error('Fonctionnalité non disponible');

    setIsLoading(true);
    setError(null);

    try {
      const newPatient = await window.electronAPI.patients.create(patientData);

      // Recharger la liste des patients et les statistiques
      await Promise.all([
        loadPatients(currentFilters),
        loadStats()
      ]);

      return newPatient;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Impossible de créer le patient';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isElectron, loadPatients, loadStats, currentFilters]);

  // Mettre à jour un patient
  const updatePatient = useCallback(async (id: number, patientData: UpdatePatientRequest): Promise<Patient> => {
    if (!isElectron) throw new Error('Fonctionnalité non disponible');

    setIsLoading(true);
    setError(null);

    try {
      const updatedPatient = await window.electronAPI.patients.update(id, patientData);

      // Mettre à jour la liste locale
      setPatients(prevPatients =>
        prevPatients.map(patient =>
          patient.id === id ? updatedPatient : patient
        )
      );

      // Recharger les statistiques si le statut a changé
      if (patientData.status) {
        await loadStats();
      }

      return updatedPatient;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Impossible de mettre à jour le patient ${id}`;
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isElectron, loadStats]);

  // Supprimer un patient
  const deletePatient = useCallback(async (id: number, transferPayments: boolean = true): Promise<void> => {
    if (!isElectron) throw new Error('Fonctionnalité non disponible');

    setIsLoading(true);
    setError(null);

    try {
      await window.electronAPI.patients.delete(id, transferPayments);

      // Retirer le patient de la liste locale
      setPatients(prevPatients => prevPatients.filter(patient => patient.id !== id));

      // Recharger les statistiques
      await loadStats();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Impossible de supprimer le patient ${id}`;
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isElectron, loadStats]);

  // Rechercher des patients
  const searchPatients = useCallback(async (query: string): Promise<Patient[]> => {
    if (!isElectron) return [];

    try {
      return await window.electronAPI.patients.search(query);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la recherche';
      setError(errorMessage);
      throw err;
    }
  }, [isElectron]);

  // Rafraîchir les patients avec les derniers filtres
  const refreshPatients = useCallback(async () => {
    await loadPatients(currentFilters);
  }, [loadPatients, currentFilters]);

  // Effacer l'erreur
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Charger les patients et statistiques au montage
  useEffect(() => {
    if (isElectron) {
      Promise.all([
        loadPatients(),
        loadStats()
      ]);
    }
  }, [isElectron, loadPatients, loadStats]);

  return {
    patients,
    isLoading,
    error,
    stats,
    loadPatients,
    getPatientById,
    createPatient,
    updatePatient,
    deletePatient,
    searchPatients,
    loadStats,
    refreshPatients,
    clearError
  };
};

// Hook spécialisé pour un patient spécifique
export const usePatient = (id: number | null) => {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { isElectron } = useElectron();

  const loadPatient = useCallback(async () => {
    if (!isElectron || !id) return;

    setIsLoading(true);
    setError(null);

    try {
      const patientData = await window.electronAPI.patients.getById(id);
      setPatient(patientData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Impossible de charger le patient ${id}`;
      setError(errorMessage);
      console.error('Erreur lors du chargement du patient:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isElectron, id]);

  useEffect(() => {
    if (id) {
      loadPatient();
    } else {
      setPatient(null);
    }
  }, [id, loadPatient]);

  return {
    patient,
    isLoading,
    error,
    reload: loadPatient,
    clearError: () => setError(null)
  };
};
