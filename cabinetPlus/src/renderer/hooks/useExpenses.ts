import { useState, useEffect } from 'react';
import { Expense, CreateExpenseRequest, UpdateExpenseRequest, ExpenseSearchFilters } from '../../shared/types';

const isElectron = typeof window !== 'undefined' && window.electronAPI;

export const useExpenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger tous les frais
  const loadExpenses = async (filters?: ExpenseSearchFilters): Promise<void> => {
    if (!isElectron) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await window.electronAPI.expenses.getAll(filters);
      setExpenses(data);
    } catch (err) {
      setError('Impossible de charger les frais');
      console.error('Erreur lors du chargement des frais:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Créer un nouveau frais
  const createExpense = async (expenseData: CreateExpenseRequest): Promise<Expense | null> => {
    if (!isElectron) return null;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const newExpense = await window.electronAPI.expenses.create(expenseData);
      setExpenses(prev => [newExpense, ...prev]);
      return newExpense;
    } catch (err) {
      setError('Impossible de créer le frais');
      console.error('Erreur lors de la création du frais:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Mettre à jour un frais
  const updateExpense = async (id: number, expenseData: UpdateExpenseRequest): Promise<Expense | null> => {
    if (!isElectron) return null;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedExpense = await window.electronAPI.expenses.update(id, expenseData);
      setExpenses(prev => prev.map(expense => 
        expense.id === id ? updatedExpense : expense
      ));
      return updatedExpense;
    } catch (err) {
      setError('Impossible de modifier le frais');
      console.error('Erreur lors de la modification du frais:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Supprimer un frais
  const deleteExpense = async (id: number): Promise<void> => {
    if (!isElectron) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await window.electronAPI.expenses.delete(id);
      setExpenses(prev => prev.filter(expense => expense.id !== id));
    } catch (err) {
      setError('Impossible de supprimer le frais');
      console.error('Erreur lors de la suppression du frais:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Récupérer les statistiques des frais avec filtres optionnels
  const getExpenseStats = async (filters?: ExpenseSearchFilters): Promise<{ total: number; totalAmount: number } | null> => {
    if (!isElectron) return null;

    try {
      return await window.electronAPI.expenses.getStats(filters);
    } catch (err) {
      setError('Impossible de charger les statistiques des frais');
      console.error('Erreur lors du chargement des statistiques:', err);
      return null;
    }
  };

  // Charger les frais au montage du composant
  useEffect(() => {
    loadExpenses();
  }, []);

  return {
    expenses,
    isLoading,
    error,
    loadExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
    getExpenseStats
  };
};
