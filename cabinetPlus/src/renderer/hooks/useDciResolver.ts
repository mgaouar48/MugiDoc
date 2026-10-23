import { useEffect, useState } from 'react';
import { useDebouncedValue } from './useDebouncedValue';
import { useElectron } from './useElectron';

/**
 * Retrouve la ou les DCI d'un médicament dont le nom a été **saisi à la main**,
 * sans passer par la liste déroulante (cas fréquent, et le seul où le contrôle
 * d'allergie serait autrement aveugle : un nom commercial seul n'apprend rien).
 *
 * N'interroge la base que lorsque la ligne n'a pas déjà sa DCI — une sélection
 * dans le répertoire reste toujours prioritaire. Résultats mis en cache pour la
 * durée de la consultation : le même nom n'est résolu qu'une fois, et le rendu
 * reste synchrone.
 */
export const useDciResolver = (brandText: string, knownDci?: string): string | undefined => {
  const { isElectron } = useElectron();
  const [cache, setCache] = useState<Record<string, string>>({});
  const debouncedBrand = useDebouncedValue(brandText, 400);

  const needsLookup = !knownDci && !!debouncedBrand?.trim() && isElectron;
  const cacheKey = debouncedBrand?.trim().toLowerCase() ?? '';

  useEffect(() => {
    if (!needsLookup || cacheKey in cache) return;

    let cancelled = false;
    window.electronAPI.medications
      .resolveDci(debouncedBrand)
      .then(candidates => {
        if (cancelled) return;
        // Plusieurs sels pour une même marque : on les concatène, la
        // classification par famille testant chaque segment séparément.
        setCache(prev => ({ ...prev, [cacheKey]: (candidates || []).join(' / ') }));
      })
      .catch(() => {
        // Un échec de résolution ne doit jamais interrompre la saisie : on
        // mémorise l'absence de résultat pour ne pas boucler sur l'erreur.
        if (!cancelled) setCache(prev => ({ ...prev, [cacheKey]: '' }));
      });

    return () => { cancelled = true; };
  }, [needsLookup, cacheKey, debouncedBrand, cache]);

  if (knownDci) return knownDci;
  return cache[cacheKey] || undefined;
};
