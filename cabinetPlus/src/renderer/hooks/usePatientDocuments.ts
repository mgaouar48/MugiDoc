import { useState, useEffect, useCallback } from 'react';
import { PatientDocument } from '@/shared/types';
import { useToast } from './use-toast';
import { useElectron } from './useElectron';

export const usePatientDocuments = (patientId?: number | null) => {
  const [documents, setDocuments] = useState<PatientDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { isElectron } = useElectron();

  const loadDocuments = useCallback(async () => {
    if (!isElectron || !patientId) {
      setDocuments([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const docs = await window.electronAPI.documents.getByPatient(patientId);
      setDocuments(docs);
    } catch (err) {
      console.error('Erreur lors du chargement des documents:', err);
      setError('Impossible de charger les documents');
    } finally {
      setIsLoading(false);
    }
  }, [isElectron, patientId]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const selectAndUpload = async (category: string = 'Autre', notes?: string) => {
    if (!isElectron || !patientId) return null;
    try {
      const doc = await window.electronAPI.documents.selectAndUpload({
        patientId,
        category,
        notes,
      });
      if (doc) {
        toast({
          title: "Document ajouté",
          description: `Le fichier ${doc.original_name} a été rattaché avec succès.`,
        });
        await loadDocuments();
      }
      return doc;
    } catch (err) {
      console.error('Erreur lors du téléversement du document:', err);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le fichier.",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteDocument = async (id: number) => {
    if (!isElectron) return false;
    try {
      await window.electronAPI.documents.delete(id);
      toast({
        title: "Document supprimé",
        description: "La pièce jointe a été supprimée.",
      });
      await loadDocuments();
      return true;
    } catch (err) {
      console.error('Erreur lors de la suppression du document:', err);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le document.",
        variant: "destructive",
      });
      return false;
    }
  };

  const openDocument = async (id: number) => {
    if (!isElectron) return;
    try {
      const res = await window.electronAPI.documents.open(id);
      if (res) {
        toast({
          title: "Erreur d'ouverture",
          description: res,
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error('Erreur lors de l\'ouverture du document:', err);
      toast({
        title: "Erreur",
        description: "Impossible d'ouvrir le fichier.",
        variant: "destructive",
      });
    }
  };

  return {
    documents,
    isLoading,
    error,
    loadDocuments,
    selectAndUpload,
    deleteDocument,
    openDocument,
  };
};
