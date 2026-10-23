import { useCallback, useEffect, useState } from 'react';
import { ConsultationMotif } from '../../shared/types';
import { useElectron } from './useElectron';

const byUsageThenLabel = (a: ConsultationMotif, b: ConsultationMotif) =>
  b.usage_count - a.usage_count || a.label.localeCompare(b.label, 'fr');

/**
 * Motifs de consultation prédéfinis (puces + recherche du `MotifPicker`) —
 * cf. PLAN_CONSULTATION.md L4. Le compteur d'usage est mis à jour de façon
 * optimiste (tri local immédiat) pour que les motifs fréquents remontent en
 * tête sans attendre un aller-retour IPC.
 */
export const useConsultationMotifs = () => {
  const { isElectron } = useElectron();
  const [motifs, setMotifs] = useState<ConsultationMotif[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    if (!isElectron) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const list = await window.electronAPI.consultationMotifs.getAll();
      setMotifs([...list].sort(byUsageThenLabel));
    } catch (err) {
      console.error('Erreur chargement des motifs de consultation:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isElectron]);

  useEffect(() => {
    load();
  }, [load]);

  /** Incrémente le compteur d'usage (motif choisi dans une consultation) — IPC en tâche de fond, tri local immédiat. */
  const recordUsage = useCallback((id: number) => {
    setMotifs(prev =>
      prev
        .map(m => (m.id === id ? { ...m, usage_count: m.usage_count + 1 } : m))
        .sort(byUsageThenLabel)
    );
    window.electronAPI.consultationMotifs.incrementUsage(id).catch(err => {
      console.error('Erreur mise à jour du compteur d\'usage du motif:', err);
    });
  }, []);

  /** Enregistre un motif saisi librement comme motif récurrent (idempotent côté service). */
  const createMotif = useCallback(async (label: string, category?: string): Promise<ConsultationMotif> => {
    const created = await window.electronAPI.consultationMotifs.create(label, category);
    setMotifs(prev => {
      const withoutExisting = prev.filter(m => m.id !== created.id);
      return [...withoutExisting, created].sort(byUsageThenLabel);
    });
    return created;
  }, []);

  return { motifs, isLoading, recordUsage, createMotif };
};
