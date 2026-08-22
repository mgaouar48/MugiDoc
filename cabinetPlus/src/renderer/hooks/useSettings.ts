import { useState, useEffect } from 'react';
import { useElectron } from './useElectron';
import { Setting, BackupInfo, DatabaseStats } from '@/shared/types';

export const useSettings = () => {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { isElectron } = useElectron();

  // Charger tous les paramètres
  const loadSettings = async () => {
    if (!isElectron) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const allSettings = await window.electronAPI.settings.getAll();
      setSettings(allSettings);
    } catch (err) {
      setError('Impossible de charger les paramètres');
      console.error('Erreur lors du chargement des paramètres:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Charger les paramètres au montage
  useEffect(() => {
    loadSettings();
  }, [isElectron]);

  // Obtenir un paramètre par sa clé
  const getSetting = (key: string, defaultValue: string = ''): string => {
    const setting = settings.find(s => s.key === key);
    return setting ? setting.value : defaultValue;
  };

  // Obtenir les paramètres par catégorie
  const getSettingsByCategory = (category: string): Setting[] => {
    return settings.filter(s => s.category === category);
  };

  // Mettre à jour un paramètre
  const updateSetting = async (key: string, value: string): Promise<void> => {
    if (!isElectron) return;
    
    try {
      await window.electronAPI.settings.update(key, value);
      await loadSettings(); // Recharger les paramètres
    } catch (err) {
      setError(`Impossible de mettre à jour le paramètre ${key}`);
      throw err;
    }
  };

  // Créer un nouveau paramètre
  const createSetting = async (key: string, value: string, category: string, description?: string): Promise<void> => {
    if (!isElectron) return;
    
    try {
      await window.electronAPI.settings.create(key, value, category, description);
      await loadSettings(); // Recharger les paramètres
    } catch (err) {
      setError(`Impossible de créer le paramètre ${key}`);
      throw err;
    }
  };

  // Supprimer un paramètre
  const deleteSetting = async (key: string): Promise<void> => {
    if (!isElectron) return;
    
    try {
      await window.electronAPI.settings.delete(key);
      await loadSettings(); // Recharger les paramètres
    } catch (err) {
      setError(`Impossible de supprimer le paramètre ${key}`);
      throw err;
    }
  };

  return {
    settings,
    isLoading,
    error,
    loadSettings,
    getSetting,
    getSettingsByCategory,
    updateSetting,
    createSetting,
    deleteSetting,
  };
};

export const useBackup = () => {
  const [dbStats, setDbStats] = useState<DatabaseStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { isElectron } = useElectron();

  // Charger les informations de backup
  const loadBackupInfo = async () => {
    if (!isElectron) return;

    setIsLoading(true);
    setError(null);

    try {
      const statsData = await window.electronAPI.database.getStats();
      setDbStats(statsData);
    } catch (err) {
      setError('Impossible de charger les informations de sauvegarde');
      console.error('Erreur lors du chargement des informations de backup:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Charger les informations au montage
  useEffect(() => {
    loadBackupInfo();
  }, [isElectron]);

  // Créer une sauvegarde
  const createBackup = async (customPath?: string): Promise<BackupInfo> => {
    if (!isElectron) throw new Error('Fonctionnalité non disponible');
    
    try {
      const backupInfo = await window.electronAPI.backup.create(customPath);
      await loadBackupInfo(); // Recharger les informations
      return backupInfo;
    } catch (err) {
      setError('Impossible de créer la sauvegarde');
      throw err;
    }
  };



  // Restaurer une sauvegarde
  const restoreBackup = async (backupPath?: string): Promise<void> => {
    if (!isElectron) throw new Error('Fonctionnalité non disponible');
    
    try {
      await window.electronAPI.backup.restore(backupPath);
      await loadBackupInfo(); // Recharger les informations
    } catch (err) {
      setError('Impossible de restaurer la sauvegarde');
      throw err;
    }
  };

  return {
    dbStats,
    isLoading,
    error,
    loadBackupInfo,
    createBackup,
    restoreBackup,
  };
};
