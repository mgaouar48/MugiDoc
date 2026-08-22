import { useEffect } from 'react';

/**
 * Hook pour faire défiler automatiquement vers le haut de la page
 * Utile lors du changement de section/page
 */
export const useScrollToTop = (trigger?: any) => {
  useEffect(() => {
    // Scroll vers le haut de la page
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
    
    // Alternative pour les cas où window.scrollTo ne fonctionne pas
    const mainContainer = document.querySelector('main') || document.body;
    if (mainContainer) {
      mainContainer.scrollTop = 0;
    }
  }, [trigger]);
};

/**
 * Fonction utilitaire pour scroll immédiat vers le haut
 */
export const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    left: 0,
    behavior: 'smooth'
  });
  
  // Alternative pour les cas où window.scrollTo ne fonctionne pas
  const mainContainer = document.querySelector('main') || document.body;
  if (mainContainer) {
    mainContainer.scrollTop = 0;
  }
};
