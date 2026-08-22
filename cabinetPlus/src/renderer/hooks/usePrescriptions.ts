import { useState, useCallback } from 'react';
import { useElectron } from './useElectron';
import { 
  Prescription, 
  CreatePrescriptionRequest, 
  UpdatePrescriptionRequest, 
  PrescriptionSearchFilters,
  PrescriptionTemplate,
  CreatePrescriptionTemplateRequest,
  UpdatePrescriptionTemplateRequest
} from '../../shared/types';

export const usePrescriptions = () => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [templates, setTemplates] = useState<PrescriptionTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { isElectron } = useElectron();

  // Charger toutes les ordonnances
  const loadPrescriptions = useCallback(async (filters?: PrescriptionSearchFilters): Promise<void> => {
    if (!isElectron) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await window.electronAPI.prescriptions.getAll(filters);
      setPrescriptions(data);
    } catch (err) {
      setError('Impossible de charger les ordonnances');
      console.error('Erreur lors du chargement des ordonnances:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isElectron]);

  // Charger tous les modèles
  const loadTemplates = useCallback(async (): Promise<void> => {
    if (!isElectron) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await window.electronAPI.prescriptionTemplates.getAll();
      setTemplates(data);
    } catch (err) {
      setError('Impossible de charger les modèles');
      console.error('Erreur lors du chargement des modèles:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isElectron]);

  // Récupérer une ordonnance par ID
  const getPrescriptionById = useCallback(async (id: number): Promise<Prescription | null> => {
    if (!isElectron) return null;
    
    try {
      return await window.electronAPI.prescriptions.getById(id);
    } catch (err) {
      console.error('Erreur lors de la récupération de l\'ordonnance:', err);
      return null;
    }
  }, [isElectron]);

  // Récupérer un modèle par ID
  const getTemplateById = useCallback(async (id: number): Promise<PrescriptionTemplate | null> => {
    if (!isElectron) return null;
    
    try {
      return await window.electronAPI.prescriptionTemplates.getById(id);
    } catch (err) {
      console.error('Erreur lors de la récupération du modèle:', err);
      return null;
    }
  }, [isElectron]);

  // Créer une nouvelle ordonnance
  const createPrescription = useCallback(async (prescriptionData: CreatePrescriptionRequest): Promise<Prescription | null> => {
    if (!isElectron) return null;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const newPrescription = await window.electronAPI.prescriptions.create(prescriptionData);
      setPrescriptions(prev => [newPrescription, ...prev]);
      return newPrescription;
    } catch (err: any) {
      setError(err.message || 'Impossible de créer l\'ordonnance');
      console.error('Erreur lors de la création de l\'ordonnance:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isElectron]);

  // Mettre à jour une ordonnance
  const updatePrescription = useCallback(async (id: number, prescriptionData: UpdatePrescriptionRequest): Promise<Prescription | null> => {
    if (!isElectron) return null;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedPrescription = await window.electronAPI.prescriptions.update(id, prescriptionData);
      setPrescriptions(prev => prev.map(p => p.id === id ? updatedPrescription : p));
      return updatedPrescription;
    } catch (err: any) {
      setError(err.message || 'Impossible de mettre à jour l\'ordonnance');
      console.error('Erreur lors de la mise à jour de l\'ordonnance:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isElectron]);

  // Supprimer une ordonnance
  const deletePrescription = useCallback(async (id: number): Promise<void> => {
    if (!isElectron) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await window.electronAPI.prescriptions.delete(id);
      setPrescriptions(prev => prev.filter(p => p.id !== id));
    } catch (err: any) {
      setError(err.message || 'Impossible de supprimer l\'ordonnance');
      console.error('Erreur lors de la suppression de l\'ordonnance:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isElectron]);

  // Récupérer les ordonnances d'un patient
  const getPrescriptionsByPatientId = useCallback(async (patientId: number): Promise<Prescription[]> => {
    if (!isElectron) return [];
    
    try {
      return await window.electronAPI.prescriptions.getByPatientId(patientId);
    } catch (err) {
      console.error('Erreur lors de la récupération des ordonnances du patient:', err);
      return [];
    }
  }, [isElectron]);

  // Imprimer une ordonnance
  const printPrescription = useCallback(async (id: number): Promise<void> => {
    if (!isElectron) return;
    
    try {
      await window.electronAPI.prescriptions.print(id);
    } catch (err) {
      console.error('Erreur lors de l\'impression de l\'ordonnance:', err);
      throw err;
    }
  }, [isElectron]);

  // Créer un nouveau modèle
  const createTemplate = useCallback(async (templateData: CreatePrescriptionTemplateRequest): Promise<PrescriptionTemplate | null> => {
    if (!isElectron) return null;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const newTemplate = await window.electronAPI.prescriptionTemplates.create(templateData);
      setTemplates(prev => [newTemplate, ...prev]);
      return newTemplate;
    } catch (err: any) {
      setError(err.message || 'Impossible de créer le modèle');
      console.error('Erreur lors de la création du modèle:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isElectron]);

  // Mettre à jour un modèle
  const updateTemplate = useCallback(async (id: number, templateData: UpdatePrescriptionTemplateRequest): Promise<PrescriptionTemplate | null> => {
    if (!isElectron) return null;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedTemplate = await window.electronAPI.prescriptionTemplates.update(id, templateData);
      setTemplates(prev => prev.map(t => t.id === id ? updatedTemplate : t));
      return updatedTemplate;
    } catch (err: any) {
      setError(err.message || 'Impossible de mettre à jour le modèle');
      console.error('Erreur lors de la mise à jour du modèle:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isElectron]);

  // Supprimer un modèle
  const deleteTemplate = useCallback(async (id: number): Promise<void> => {
    if (!isElectron) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await window.electronAPI.prescriptionTemplates.delete(id);
      setTemplates(prev => prev.filter(t => t.id !== id));
    } catch (err: any) {
      setError(err.message || 'Impossible de supprimer le modèle');
      console.error('Erreur lors de la suppression du modèle:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isElectron]);

  // Rechercher des ordonnances
  const searchPrescriptions = useCallback(async (filters: PrescriptionSearchFilters): Promise<void> => {
    await loadPrescriptions(filters);
  }, [loadPrescriptions]);

  // Actualiser les données
  const refreshPrescriptions = useCallback(async (): Promise<void> => {
    await Promise.all([
      loadPrescriptions(),
      loadTemplates()
    ]);
  }, [loadPrescriptions, loadTemplates]);

  // Effacer les erreurs
  const clearError = useCallback((): void => {
    setError(null);
  }, []);

  return {
    // État
    prescriptions,
    templates,
    isLoading,
    error,
    
    // Actions pour les ordonnances
    loadPrescriptions,
    getPrescriptionById,
    createPrescription,
    updatePrescription,
    deletePrescription,
    getPrescriptionsByPatientId,
    printPrescription,
    searchPrescriptions,
    
    // Actions pour les modèles
    loadTemplates,
    getTemplateById,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    
    // Utilitaires
    refreshPrescriptions,
    clearError
  };
};

// Hook spécialisé pour un patient spécifique
export const usePatientPrescriptions = (patientId: number | null) => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { isElectron } = useElectron();

  const loadPatientPrescriptions = useCallback(async (): Promise<void> => {
    if (!isElectron || !patientId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await window.electronAPI.prescriptions.getByPatientId(patientId);
      setPrescriptions(data);
    } catch (err) {
      setError('Impossible de charger les ordonnances du patient');
      console.error('Erreur lors du chargement des ordonnances du patient:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isElectron, patientId]);

  return {
    prescriptions,
    isLoading,
    error,
    loadPatientPrescriptions,
    clearError: () => setError(null)
  };
};
