import { useCallback } from 'react';
import { useFocus } from '../contexts/FocusProvider';

/**
 * Hook simplifié pour utiliser la gestion globale du focus
 * Compatible avec tous les composants existants sans modification
 */
export const useGlobalFocus = () => {
  const { forceFocus, restoreFocus } = useFocus();

  // Gestionnaire pour les champs de texte avec auto-sélection
  const handleInputFocus = useCallback((e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    try {
      e.target.select();
    } catch (error) {
      // Ignorer les erreurs de sélection
    }
  }, []);

  // Gestionnaire pour forcer le focus après un changement
  const handleInputChange = useCallback((callback: () => void) => {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      callback();
      
      // Maintenir le focus sur l'élément actuel après le changement
      setTimeout(() => {
        if (e.target && document.contains(e.target)) {
          forceFocus(e.target);
        }
      }, 0);
    };
  }, [forceFocus]);

  return {
    forceFocus,
    restoreFocus,
    handleInputFocus,
    handleInputChange
  };
};
