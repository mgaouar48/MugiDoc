import { useState, useEffect, useCallback } from 'react';
import { useToast } from './use-toast';
import { useElectron } from './useElectron';

export interface InventoryItem {
  id: number;
  name: string;
  category: string;
  quantity: number;
  min_threshold: number;
  unit: string;
  unit_price: number;
  supplier?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const useInventory = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { isElectron } = useElectron();

  const loadItems = useCallback(async () => {
    if (!isElectron) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await window.electronAPI.inventory.getAll();
      setItems(data);
    } catch (err) {
      console.error('Erreur chargement inventaire:', err);
      setError('Impossible de charger le stock.');
    } finally {
      setIsLoading(false);
    }
  }, [isElectron]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const createItem = async (data: any) => {
    if (!isElectron) return null;
    try {
      const newItem = await window.electronAPI.inventory.create(data);
      toast({
        title: "Article ajouté",
        description: `${newItem.name} a été ajouté au stock.`,
      });
      await loadItems();
      return newItem;
    } catch (err) {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter l'article.",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateItem = async (id: number, data: any) => {
    if (!isElectron) return null;
    try {
      const updated = await window.electronAPI.inventory.update(id, data);
      toast({
        title: "Article mis à jour",
        description: `${updated.name} a été mis à jour.`,
      });
      await loadItems();
      return updated;
    } catch (err) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour l'article.",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteItem = async (id: number) => {
    if (!isElectron) return false;
    try {
      await window.electronAPI.inventory.delete(id);
      toast({
        title: "Article supprimé",
        description: "L'article a été retiré du stock.",
      });
      await loadItems();
      return true;
    } catch (err) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'article.",
        variant: "destructive",
      });
      return false;
    }
  };

  const updateQuantity = async (id: number, delta: number) => {
    if (!isElectron) return;
    try {
      await window.electronAPI.inventory.updateQuantity(id, delta);
      await loadItems();
    } catch (err) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier la quantité.",
        variant: "destructive",
      });
    }
  };

  const lowStockCount = items.filter(item => item.quantity <= item.min_threshold).length;

  return {
    items,
    isLoading,
    error,
    lowStockCount,
    loadItems,
    createItem,
    updateItem,
    deleteItem,
    updateQuantity,
  };
};
