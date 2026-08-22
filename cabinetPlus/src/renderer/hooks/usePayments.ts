import { useState, useEffect, useCallback } from 'react';
import { Payment, CreatePaymentRequest, UpdatePaymentRequest, PaymentSearchFilters } from '../../shared/types';
import { useElectron } from './useElectron';
import { useDataUpdateOptional } from '../contexts/DataUpdateContext';

interface UsePayments {
  payments: Payment[];
  isLoading: boolean;
  error: string | null;
  stats: { 
    total: number; 
    pending: number; 
    completed: number; 
    debt: number;
    totalAmount: number;
    pendingAmount: number;
    debtAmount: number;
  } | null;
  
  // Actions
  loadPayments: (filters?: PaymentSearchFilters) => Promise<void>;
  getPaymentById: (id: number) => Promise<Payment | null>;
  createPayment: (paymentData: CreatePaymentRequest) => Promise<Payment>;
  updatePayment: (id: number, paymentData: UpdatePaymentRequest) => Promise<Payment>;
  deletePayment: (id: number) => Promise<void>;
  getPaymentsByPatient: (patientId: number) => Promise<Payment[]>;
  loadStats: () => Promise<void>;
  
  // Utilitaires
  refreshPayments: () => Promise<void>;
  clearError: () => void;
}

export const usePayments = (): UsePayments => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{ 
    total: number; 
    pending: number; 
    completed: number; 
    debt: number;
    totalAmount: number;
    pendingAmount: number;
    debtAmount: number;
  } | null>(null);
  const [currentFilters, setCurrentFilters] = useState<PaymentSearchFilters | undefined>(undefined);
  
  const { isElectron } = useElectron();

  // Rafraîchissement du tableau de bord quand le provider est monté.
  // (Auparavant chargé via `require()`, indisponible dans le bundle ESM du
  // renderer : l'appel échouait silencieusement et n'était jamais déclenché.)
  const triggerDashboardUpdate = useDataUpdateOptional()?.triggerDashboardUpdate;

  // Charger les paiements avec filtres optionnels
  const loadPayments = useCallback(async (filters?: PaymentSearchFilters) => {
    if (!isElectron) return;
    
    setIsLoading(true);
    setError(null);
    setCurrentFilters(filters);
    
    try {
      const paymentsData = await window.electronAPI.payments.getAll(filters);
      setPayments(paymentsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Impossible de charger les paiements';
      setError(errorMessage);
      console.error('Erreur lors du chargement des paiements:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isElectron]);

  // Charger les statistiques
  const loadStats = useCallback(async () => {
    if (!isElectron) return;
    
    try {
      const statsData = await window.electronAPI.payments.getStats();
      setStats(statsData);
    } catch (err) {
      console.error('Erreur lors du chargement des statistiques:', err);
    }
  }, [isElectron]);

  // Récupérer un paiement par ID
  const getPaymentById = useCallback(async (id: number): Promise<Payment | null> => {
    if (!isElectron) return null;
    
    try {
      return await window.electronAPI.payments.getById(id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Impossible de récupérer le paiement ${id}`;
      setError(errorMessage);
      throw err;
    }
  }, [isElectron]);

  // Créer un nouveau paiement
  const createPayment = useCallback(async (paymentData: CreatePaymentRequest): Promise<Payment> => {
    if (!isElectron) throw new Error('Fonctionnalité non disponible');
    
    setIsLoading(true);
    setError(null);
    
    try {
      const newPayment = await window.electronAPI.payments.create(paymentData);
      
      // Recharger la liste des paiements et les statistiques
      await Promise.all([
        loadPayments(currentFilters),
        loadStats()
      ]);

      // Déclencher la mise à jour du dashboard
      if (triggerDashboardUpdate) {
        triggerDashboardUpdate();
      }

      return newPayment;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Impossible de créer le paiement';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isElectron, loadPayments, loadStats, currentFilters]);

  // Mettre à jour un paiement
  const updatePayment = useCallback(async (id: number, paymentData: UpdatePaymentRequest): Promise<Payment> => {
    if (!isElectron) throw new Error('Fonctionnalité non disponible');
    
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedPayment = await window.electronAPI.payments.update(id, paymentData);
      
      // Mettre à jour la liste locale
      setPayments(prevPayments => 
        prevPayments.map(payment => 
          payment.id === id ? updatedPayment : payment
        )
      );
      
      // Recharger les statistiques si le statut ou le montant a changé
      if (paymentData.status || paymentData.amount !== undefined) {
        await loadStats();

        // Déclencher la mise à jour du dashboard
        if (triggerDashboardUpdate) {
          triggerDashboardUpdate();
        }
      }

      return updatedPayment;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Impossible de mettre à jour le paiement ${id}`;
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isElectron, loadStats]);

  // Supprimer un paiement
  const deletePayment = useCallback(async (id: number): Promise<void> => {
    if (!isElectron) throw new Error('Fonctionnalité non disponible');
    
    setIsLoading(true);
    setError(null);
    
    try {
      await window.electronAPI.payments.delete(id);
      
      // Retirer le paiement de la liste locale
      setPayments(prevPayments => prevPayments.filter(payment => payment.id !== id));
      
      // Recharger les statistiques
      await loadStats();

      // Déclencher la mise à jour du dashboard
      if (triggerDashboardUpdate) {
        triggerDashboardUpdate();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Impossible de supprimer le paiement ${id}`;
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isElectron, loadStats]);

  // Récupérer les paiements d'un patient
  const getPaymentsByPatient = useCallback(async (patientId: number): Promise<Payment[]> => {
    if (!isElectron) return [];
    
    try {
      return await window.electronAPI.payments.getByPatient(patientId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la récupération des paiements du patient';
      setError(errorMessage);
      throw err;
    }
  }, [isElectron]);



  // Rafraîchir les paiements avec les derniers filtres
  const refreshPayments = useCallback(async () => {
    await loadPayments(currentFilters);
  }, [loadPayments, currentFilters]);

  // Effacer l'erreur
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Charger les paiements et statistiques au montage
  useEffect(() => {
    if (isElectron) {
      Promise.all([
        loadPayments(),
        loadStats()
      ]);
    }
  }, [isElectron, loadPayments, loadStats]);

  return {
    payments,
    isLoading,
    error,
    stats,
    loadPayments,
    getPaymentById,
    createPayment,
    updatePayment,
    deletePayment,
    getPaymentsByPatient,
    loadStats,
    refreshPayments,
    clearError
  };
};

// Hook spécialisé pour un paiement spécifique
export const usePayment = (id: number | null) => {
  const [payment, setPayment] = useState<Payment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { isElectron } = useElectron();

  const loadPayment = useCallback(async () => {
    if (!isElectron || !id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const paymentData = await window.electronAPI.payments.getById(id);
      setPayment(paymentData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Impossible de charger le paiement ${id}`;
      setError(errorMessage);
      console.error('Erreur lors du chargement du paiement:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isElectron, id]);

  useEffect(() => {
    if (id) {
      loadPayment();
    } else {
      setPayment(null);
    }
  }, [id, loadPayment]);

  return {
    payment,
    isLoading,
    error,
    reload: loadPayment,
    clearError: () => setError(null)
  };
};

// Hook pour les paiements d'un patient
export const usePatientPayments = (patientId: number | null) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { getPaymentsByPatient } = usePayments();

  const loadPatientPayments = useCallback(async () => {
    if (!patientId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const paymentsData = await getPaymentsByPatient(patientId);
      setPayments(paymentsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des paiements du patient';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [patientId, getPaymentsByPatient]);

  useEffect(() => {
    if (patientId) {
      loadPatientPayments();
    } else {
      setPayments([]);
    }
  }, [patientId, loadPatientPayments]);

  return {
    payments,
    isLoading,
    error,
    reload: loadPatientPayments,
    clearError: () => setError(null)
  };
};

// Hook pour calculer le total des revenus par période
export const useRevenueStats = (dateFrom?: string, dateTo?: string) => {
  const [revenue, setRevenue] = useState({
    total: 0,
    paid: 0,
    pending: 0,
    byMethod: {
      cash: 0,
      card: 0,
      check: 0,
      transfer: 0
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  
  const { loadPayments } = usePayments();

  const calculateRevenue = useCallback(async () => {
    if (!dateFrom && !dateTo) return;
    
    setIsLoading(true);
    
    try {
      // Charger les paiements pour la période
      await loadPayments({
        date_from: dateFrom,
        date_to: dateTo,
        status: 'all'
      });
      
      // Les calculs seront faits côté composant avec les données chargées
    } catch (err) {
      console.error('Erreur lors du calcul des revenus:', err);
    } finally {
      setIsLoading(false);
    }
  }, [dateFrom, dateTo, loadPayments]);

  useEffect(() => {
    calculateRevenue();
  }, [calculateRevenue]);

  return {
    revenue,
    isLoading,
    reload: calculateRevenue
  };
};
