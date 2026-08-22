import { useState, useEffect, useCallback } from 'react';
import { Consultation, CreateConsultationRequest, UpdateConsultationRequest, ConsultationSearchFilters } from '../../shared/types';
import { useElectron } from './useElectron';

interface UseConsultations {
  consultations: Consultation[];
  isLoading: boolean;
  error: string | null;
  stats: {
    total: number;
    completed: number;
    inProgress: number;
    scheduled: number;
  } | null;
  
  // Actions
  loadConsultations: (filters?: ConsultationSearchFilters) => Promise<void>;
  getConsultationById: (id: number) => Promise<Consultation | null>;
  createConsultation: (consultationData: CreateConsultationRequest) => Promise<Consultation>;
  updateConsultation: (id: number, consultationData: UpdateConsultationRequest) => Promise<Consultation>;
  deleteConsultation: (id: number) => Promise<void>;
  getConsultationsByPatient: (patientId: number) => Promise<Consultation[]>;
  getConsultationsByAppointment: (appointmentId: number) => Promise<Consultation[]>;
  loadStats: () => Promise<void>;
  
  // Utilitaires
  refreshConsultations: () => Promise<void>;
  clearError: () => void;
}

export const useConsultations = (): UseConsultations => {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    total: number;
    completed: number;
    inProgress: number;
    scheduled: number;
  } | null>(null);
  const [currentFilters, setCurrentFilters] = useState<ConsultationSearchFilters | undefined>(undefined);
  
  const { isElectron } = useElectron();

  // Charger les consultations avec filtres optionnels
  const loadConsultations = useCallback(async (filters?: ConsultationSearchFilters) => {
    if (!isElectron) return;
    
    setIsLoading(true);
    setError(null);
    setCurrentFilters(filters);
    
    try {
      const consultationsData = await window.electronAPI.consultations.getAll(filters);
      setConsultations(consultationsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Impossible de charger les consultations';
      setError(errorMessage);
      console.error('Erreur lors du chargement des consultations:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isElectron]);

  // Charger les statistiques
  const loadStats = useCallback(async () => {
    if (!isElectron) return;
    
    try {
      const statsData = await window.electronAPI.consultations.getStats();
      setStats(statsData);
    } catch (err) {
      console.error('Erreur lors du chargement des statistiques:', err);
    }
  }, [isElectron]);

  // Récupérer une consultation par ID
  const getConsultationById = useCallback(async (id: number): Promise<Consultation | null> => {
    if (!isElectron) return null;
    
    try {
      return await window.electronAPI.consultations.getById(id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Impossible de récupérer la consultation ${id}`;
      setError(errorMessage);
      throw err;
    }
  }, [isElectron]);

  // Créer une nouvelle consultation
  const createConsultation = useCallback(async (consultationData: CreateConsultationRequest): Promise<Consultation> => {
    if (!isElectron) throw new Error('Fonctionnalité non disponible');
    
    setIsLoading(true);
    setError(null);
    
    try {
      const newConsultation = await window.electronAPI.consultations.create(consultationData);
      
      // Recharger la liste des consultations et les statistiques
      await Promise.all([
        loadConsultations(currentFilters),
        loadStats()
      ]);
      
      return newConsultation;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Impossible de créer la consultation';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isElectron, loadConsultations, loadStats, currentFilters]);

  // Mettre à jour une consultation
  const updateConsultation = useCallback(async (id: number, consultationData: UpdateConsultationRequest): Promise<Consultation> => {
    if (!isElectron) throw new Error('Fonctionnalité non disponible');
    
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedConsultation = await window.electronAPI.consultations.update(id, consultationData);
      
      // Mettre à jour la liste locale
      setConsultations(prevConsultations => 
        prevConsultations.map(consultation => 
          consultation.id === id ? updatedConsultation : consultation
        )
      );
      
      // Recharger les statistiques si le statut a changé
      if (consultationData.status) {
        await loadStats();
      }
      
      return updatedConsultation;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Impossible de mettre à jour la consultation ${id}`;
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isElectron, loadStats]);

  // Supprimer une consultation
  const deleteConsultation = useCallback(async (id: number): Promise<void> => {
    if (!isElectron) throw new Error('Fonctionnalité non disponible');
    
    setIsLoading(true);
    setError(null);
    
    try {
      await window.electronAPI.consultations.delete(id);
      
      // Retirer la consultation de la liste locale
      setConsultations(prevConsultations => prevConsultations.filter(consultation => consultation.id !== id));
      
      // Recharger les statistiques
      await loadStats();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Impossible de supprimer la consultation ${id}`;
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isElectron, loadStats]);

  // Récupérer les consultations d'un patient
  const getConsultationsByPatient = useCallback(async (patientId: number): Promise<Consultation[]> => {
    if (!isElectron) return [];
    
    try {
      return await window.electronAPI.consultations.getByPatient(patientId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la récupération des consultations du patient';
      setError(errorMessage);
      throw err;
    }
  }, [isElectron]);

  // Récupérer les consultations d'un rendez-vous
  const getConsultationsByAppointment = useCallback(async (appointmentId: number): Promise<Consultation[]> => {
    if (!isElectron) return [];
    
    try {
      return await window.electronAPI.consultations.getByAppointment(appointmentId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la récupération des consultations du rendez-vous';
      setError(errorMessage);
      throw err;
    }
  }, [isElectron]);

  // Rafraîchir les consultations avec les derniers filtres
  const refreshConsultations = useCallback(async () => {
    await loadConsultations(currentFilters);
  }, [loadConsultations, currentFilters]);

  // Effacer l'erreur
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Charger les consultations et statistiques au montage
  useEffect(() => {
    if (isElectron) {
      Promise.all([
        loadConsultations(),
        loadStats()
      ]);
    }
  }, [isElectron, loadConsultations, loadStats]);

  return {
    consultations,
    isLoading,
    error,
    stats,
    loadConsultations,
    getConsultationById,
    createConsultation,
    updateConsultation,
    deleteConsultation,
    getConsultationsByPatient,
    getConsultationsByAppointment,
    loadStats,
    refreshConsultations,
    clearError
  };
};

// Hook spécialisé pour une consultation spécifique
export const useConsultation = (id: number | null) => {
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { isElectron } = useElectron();

  const loadConsultation = useCallback(async () => {
    if (!isElectron || !id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const consultationData = await window.electronAPI.consultations.getById(id);
      setConsultation(consultationData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Impossible de charger la consultation ${id}`;
      setError(errorMessage);
      console.error('Erreur lors du chargement de la consultation:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isElectron, id]);

  useEffect(() => {
    if (id) {
      loadConsultation();
    } else {
      setConsultation(null);
    }
  }, [id, loadConsultation]);

  return {
    consultation,
    isLoading,
    error,
    reload: loadConsultation,
    clearError: () => setError(null)
  };
};

// Hook pour les consultations d'un patient
export const usePatientConsultations = (patientId: number | null) => {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { getConsultationsByPatient } = useConsultations();

  const loadPatientConsultations = useCallback(async () => {
    if (!patientId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const consultationsData = await getConsultationsByPatient(patientId);
      setConsultations(consultationsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des consultations du patient';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [patientId, getConsultationsByPatient]);

  useEffect(() => {
    if (patientId) {
      loadPatientConsultations();
    } else {
      setConsultations([]);
    }
  }, [patientId, loadPatientConsultations]);

  return {
    consultations,
    isLoading,
    error,
    reload: loadPatientConsultations,
    clearError: () => setError(null)
  };
};
