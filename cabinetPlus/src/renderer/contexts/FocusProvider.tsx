import React, { createContext, useContext, useEffect, useCallback, useRef } from 'react';

interface FocusContextType {
  forceFocus: (element?: HTMLInputElement | HTMLTextAreaElement) => void;
  restoreFocus: () => void;
}

const FocusContext = createContext<FocusContextType | undefined>(undefined);

export const useFocus = () => {
  const context = useContext(FocusContext);
  if (!context) {
    throw new Error('useFocus must be used within a FocusProvider');
  }
  return context;
};

interface FocusProviderProps {
  children: React.ReactNode;
}

export const FocusProvider: React.FC<FocusProviderProps> = ({ children }) => {
  const lastFocusedRef = useRef<HTMLElement | null>(null);
  const focusTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Forcer le focus sur un élément
  const forceFocus = useCallback((element?: HTMLInputElement | HTMLTextAreaElement) => {
    if (element) {
      requestAnimationFrame(() => {
        try {
          element.focus();
          if (element.type === 'text' || element.tagName === 'TEXTAREA') {
            element.select();
          }
        } catch (error) {
          console.warn('Erreur lors du focus:', error);
        }
      });
    }
  }, []);

  // Restaurer le focus sur le dernier élément focalisé
  const restoreFocus = useCallback(() => {
    if (lastFocusedRef.current && document.contains(lastFocusedRef.current)) {
      forceFocus(lastFocusedRef.current as HTMLInputElement | HTMLTextAreaElement);
    }
  }, [forceFocus]);

  // Gestionnaire global des événements de focus
  const handleGlobalFocus = useCallback((event: FocusEvent) => {
    const target = event.target as HTMLElement;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
      lastFocusedRef.current = target;
    }
  }, []);

  // Gestionnaire global des événements de blur
  const handleGlobalBlur = useCallback((event: FocusEvent) => {
    const target = event.target as HTMLElement;
    const relatedTarget = event.relatedTarget as HTMLElement;
    
    // Si le focus sort de l'application, sauvegarder l'élément pour restauration
    if (!relatedTarget || !document.contains(relatedTarget)) {
      lastFocusedRef.current = target;
    }
  }, []);

  // Gestionnaire pour les clics sur des éléments non-focalisables
  const handleGlobalClick = useCallback((event: MouseEvent) => {
    const target = event.target as HTMLElement;
    
    // Si on clique sur un élément de formulaire qui semble bloqué
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
      const inputElement = target as HTMLInputElement | HTMLTextAreaElement;
      
      // Vérifier si l'élément est vraiment focalisé
      setTimeout(() => {
        if (document.activeElement !== inputElement) {
          // L'élément n'a pas reçu le focus, le forcer
          forceFocus(inputElement);
        }
      }, 50);
    }
  }, [forceFocus]);

  // Gestionnaire pour le redimensionnement de la fenêtre
  const handleResize = useCallback(() => {
    if (focusTimeoutRef.current) {
      clearTimeout(focusTimeoutRef.current);
    }
    
    focusTimeoutRef.current = setTimeout(() => {
      // Restaurer le focus après redimensionnement
      restoreFocus();
    }, 150);
  }, [restoreFocus]);

  // Gestionnaire pour la visibilité de la page
  const handleVisibilityChange = useCallback(() => {
    if (!document.hidden) {
      // La page redevient visible, restaurer le focus
      setTimeout(restoreFocus, 100);
    }
  }, [restoreFocus]);

  // Gestionnaire pour le focus de la fenêtre
  const handleWindowFocus = useCallback(() => {
    // Restaurer le focus quand la fenêtre reprend le focus
    setTimeout(restoreFocus, 100);
  }, [restoreFocus]);

  // Fonction pour détecter et corriger les champs bloqués
  const detectAndFixBlockedInputs = useCallback(() => {
    const inputs = document.querySelectorAll('input, textarea, select');
    
    inputs.forEach((input) => {
      const element = input as HTMLInputElement | HTMLTextAreaElement;
      
      // Vérifier si l'élément semble bloqué (pas de réponse aux événements)
      if (element.style.pointerEvents === 'none' || element.disabled) {
        return; // Ignorer les éléments intentionnellement désactivés
      }
      
      // Ajouter des gestionnaires pour forcer la réactivité
      element.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        setTimeout(() => forceFocus(element), 0);
      }, { passive: true });
      
      element.addEventListener('touchstart', (e) => {
        e.stopPropagation();
        setTimeout(() => forceFocus(element), 0);
      }, { passive: true });
    });
  }, [forceFocus]);

  // Initialisation et nettoyage des événements
  useEffect(() => {
    // Ajouter les gestionnaires d'événements globaux
    document.addEventListener('focusin', handleGlobalFocus, true);
    document.addEventListener('focusout', handleGlobalBlur, true);
    document.addEventListener('click', handleGlobalClick, true);
    window.addEventListener('resize', handleResize);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);

    // Détecter et corriger les champs bloqués au montage
    detectAndFixBlockedInputs();

    // Observer les changements dans le DOM pour les nouveaux éléments
    const observer = new MutationObserver(() => {
      detectAndFixBlockedInputs();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Nettoyage
    return () => {
      document.removeEventListener('focusin', handleGlobalFocus, true);
      document.removeEventListener('focusout', handleGlobalBlur, true);
      document.removeEventListener('click', handleGlobalClick, true);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
      observer.disconnect();
      
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current);
      }
    };
  }, [
    handleGlobalFocus,
    handleGlobalBlur,
    handleGlobalClick,
    handleResize,
    handleVisibilityChange,
    handleWindowFocus,
    detectAndFixBlockedInputs
  ]);

  const contextValue: FocusContextType = {
    forceFocus,
    restoreFocus
  };

  return (
    <FocusContext.Provider value={contextValue}>
      {children}
    </FocusContext.Provider>
  );
};
