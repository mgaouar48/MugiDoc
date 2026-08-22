import { useEffect } from 'react';

interface ShortcutHandlers {
  onNewPatient?: () => void;
  onNewConsultation?: () => void;
  onNewAppointment?: () => void;
  onOpenInventory?: () => void;
  onFocusSearch?: () => void;
  onShowShortcutsHelp?: () => void;
}

export const useKeyboardShortcuts = ({
  onNewPatient,
  onNewConsultation,
  onNewAppointment,
  onOpenInventory,
  onFocusSearch,
  onShowShortcutsHelp
}: ShortcutHandlers) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorer si l'utilisateur saisit du texte dans un input/textarea sauf pour F1 ou Ctrl+Focus
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName);

      // Ctrl + N : Nouveau Patient
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n' && !e.shiftKey) {
        e.preventDefault();
        onNewPatient?.();
      }
      // Ctrl + Shift + C : Nouvelle Consultation
      else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        onNewConsultation?.();
      }
      // Ctrl + Shift + R : Nouveau Rendez-vous
      else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        onNewAppointment?.();
      }
      // Ctrl + Shift + S : Inventaire / Stock
      else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        onOpenInventory?.();
      }
      // F1 ou Ctrl + / : Guide raccourcis
      else if (e.key === 'F1' || ((e.ctrlKey || e.metaKey) && e.key === '/')) {
        e.preventDefault();
        onShowShortcutsHelp?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNewPatient, onNewConsultation, onNewAppointment, onOpenInventory, onFocusSearch, onShowShortcutsHelp]);
};
