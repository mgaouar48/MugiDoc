import { useEffect, useState } from 'react';

// Hook pour gérer les interactions avec Electron
export const useElectron = () => {
  const [isElectron, setIsElectron] = useState(false);
  const [appVersion, setAppVersion] = useState<string>('');
  const [platform, setPlatform] = useState<string>('');

  useEffect(() => {
    // Vérifier si nous sommes dans Electron
    if (typeof window !== 'undefined' && window.electronAPI) {
      setIsElectron(true);
      
      // Récupérer les informations de l'application
      window.electronAPI.getAppVersion().then(setAppVersion);
      window.electronAPI.getPlatform().then(setPlatform);
    }
  }, []);

  // Fonction pour écouter les actions du menu
  const onMenuAction = (callback: (action: string) => void) => {
    if (isElectron && window.electronAPI) {
      window.electronAPI.onMenuAction(callback);
    }
  };

  // Fonction pour nettoyer les listeners
  const removeAllListeners = (channel: string) => {
    if (isElectron && window.electronAPI) {
      window.electronAPI.removeAllListeners(channel);
    }
  };

  return {
    isElectron,
    appVersion,
    platform,
    onMenuAction,
    removeAllListeners,
  };
};
