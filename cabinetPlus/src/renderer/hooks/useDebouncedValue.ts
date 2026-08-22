import { useState, useEffect } from 'react';

/**
 * Retourne `value`, mais mis à jour seulement après `delayMs` sans changement.
 * Utilisé pour éviter une requête IPC à chaque frappe dans les champs de recherche.
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
