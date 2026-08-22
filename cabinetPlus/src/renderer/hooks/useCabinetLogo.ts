import { useState, useEffect } from 'react';
import { useElectron } from './useElectron';
import { CabinetLogo } from '../../shared/types';

export const useCabinetLogo = () => {
  const [logo, setLogo] = useState<CabinetLogo | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isElectron } = useElectron();

  const loadLogo = async () => {
    if (!isElectron) return;

    setIsLoading(true);
    setError(null);

    try {
      const logoInfo = await window.electronAPI.settings.getLogo();
      setLogo(logoInfo);
      
      if (logoInfo) {
        // Créer une URL de fichier local pour l'affichage
        setLogoUrl(`file://${logoInfo.path}`);
      } else {
        setLogoUrl(null);
      }
    } catch (err) {
      console.error('Erreur lors du chargement du logo:', err);
      setError('Impossible de charger le logo');
      setLogo(null);
      setLogoUrl(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogo();
  }, [isElectron]);

  const refreshLogo = () => {
    loadLogo();
  };

  return {
    logo,
    logoUrl,
    isLoading,
    error,
    refreshLogo,
    hasLogo: !!logo
  };
};
