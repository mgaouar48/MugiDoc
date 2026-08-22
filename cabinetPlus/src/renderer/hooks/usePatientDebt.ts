import { useState, useEffect, useCallback } from 'react';
import { Payment } from '../../shared/types';
import { useElectron } from './useElectron';

export interface PatientDebt {
  /** Total restant dû par le patient, tous paiements confondus. */
  totalDue: number;
  /** Paiements encore partiellement ou totalement impayés, du plus ancien au plus récent. */
  openPayments: Payment[];
  /** Date du plus ancien impayé (YYYY-MM-DD), utile pour l'ancienneté de la dette. */
  oldestDate: string | null;
}

const NO_DEBT: PatientDebt = { totalDue: 0, openPayments: [], oldestDate: null };

/**
 * Somme restant due par un patient.
 *
 * S'appuie sur `debt_amount`, dont le sens canonique est le RESTE À PAYER
 * (voir `Payment` dans shared/types). Un paiement en dette dont le reste est
 * nul est ignoré.
 */
export const usePatientDebt = (patientId?: number | null) => {
  const { isElectron } = useElectron();
  const [debt, setDebt] = useState<PatientDebt>(NO_DEBT);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async () => {
    if (!isElectron || !patientId) {
      setDebt(NO_DEBT);
      return;
    }

    setIsLoading(true);
    try {
      const payments: Payment[] = await window.electronAPI.payments.getByPatient(patientId);
      const openPayments = (payments || [])
        .filter(p => p.status === 'debt' && (p.debt_amount || 0) > 0)
        .sort((a, b) => (a.date || '').localeCompare(b.date || ''));

      setDebt({
        totalDue: Math.round(openPayments.reduce((sum, p) => sum + (p.debt_amount || 0), 0) * 100) / 100,
        openPayments,
        oldestDate: openPayments.length > 0 ? openPayments[0].date : null
      });
    } catch (err) {
      console.error('Impossible de charger la dette du patient:', err);
      setDebt(NO_DEBT);
    } finally {
      setIsLoading(false);
    }
  }, [isElectron, patientId]);

  useEffect(() => {
    load();
  }, [load]);

  return { debt, isLoading, reload: load };
};
