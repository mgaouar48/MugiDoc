import { useCallback, useState } from 'react';
import { ConsultationDocument } from '../../shared/types';
import { useElectron } from './useElectron';

/**
 * Trace des documents produits depuis une consultation (état généré/imprimé)
 * — cf. PLAN_CONSULTATION.md L11.5. Ne gère pas le contenu des documents
 * (chaque dialogue garde son propre mécanisme), uniquement l'audit :
 * qui a été généré, quand, et si l'impression a eu lieu.
 */
export const useConsultationDocuments = () => {
  const { isElectron } = useElectron();
  const [documents, setDocuments] = useState<ConsultationDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadByConsultation = useCallback(async (consultationId: number) => {
    if (!isElectron) return;
    setIsLoading(true);
    try {
      const list = await window.electronAPI.consultationDocuments.getByConsultation(consultationId);
      setDocuments(list);
    } catch (err) {
      console.error('Erreur chargement des documents de la consultation:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isElectron]);

  const loadByPatient = useCallback(async (patientId: number) => {
    if (!isElectron) return;
    setIsLoading(true);
    try {
      const list = await window.electronAPI.consultationDocuments.getByPatient(patientId);
      setDocuments(list);
    } catch (err) {
      console.error('Erreur chargement des documents du patient:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isElectron]);

  /** Enregistre un document généré et le place en tête de la liste locale. */
  const recordGenerated = useCallback(async (input: {
    patient_id: number;
    consultation_id?: number | null;
    document_type: string;
    title: string;
  }): Promise<ConsultationDocument | null> => {
    if (!isElectron) return null;
    try {
      const created = await window.electronAPI.consultationDocuments.create(input);
      setDocuments(prev => [created, ...prev]);
      return created;
    } catch (err) {
      console.error('Erreur enregistrement du document généré:', err);
      return null;
    }
  }, [isElectron]);

  /** Enregistre directement un document comme imprimé (ex. formulaire sans étape de sauvegarde distincte). */
  const recordPrinted = useCallback(async (input: {
    patient_id: number;
    consultation_id?: number | null;
    document_type: string;
    title: string;
  }): Promise<ConsultationDocument | null> => {
    if (!isElectron) return null;
    try {
      const created = await window.electronAPI.consultationDocuments.create({ ...input, status: 'printed' });
      setDocuments(prev => [created, ...prev]);
      return created;
    } catch (err) {
      console.error('Erreur enregistrement du document imprimé:', err);
      return null;
    }
  }, [isElectron]);

  /** Fait passer un document déjà enregistré à l'état imprimé. */
  const markPrinted = useCallback((id: number) => {
    setDocuments(prev => prev.map(d => (d.id === id ? { ...d, status: 'printed' } : d)));
    window.electronAPI.consultationDocuments.markPrinted(id).catch(err => {
      console.error('Erreur mise à jour du statut « imprimé » :', err);
    });
  }, []);

  /** Retire une entrée de la trace (ex. document généré par erreur) — ne supprime jamais le document lui-même. */
  const deleteDocument = useCallback((id: number) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
    window.electronAPI.consultationDocuments.delete(id).catch(err => {
      console.error('Erreur suppression du document de la trace:', err);
    });
  }, []);

  return { documents, isLoading, loadByConsultation, loadByPatient, recordGenerated, recordPrinted, markPrinted, deleteDocument };
};
