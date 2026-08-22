import { useState, useEffect, useCallback } from 'react';

export interface LicenseInfo {
  status: 'trial' | 'active' | 'expired';
  isActivated: boolean;
  expiryDate?: string;
  activationDate?: string;
  trialDaysRemaining?: number;
}

export interface ActivationResponse {
  success: boolean;
  message: string;
  licenseInfo?: LicenseInfo;
}

export const useActivation = () => {
  const [isValid, setIsValid] = useState<boolean>(false);
  const [licenseInfo, setLicenseInfo] = useState<LicenseInfo | null>(null);
  const [message, setMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const refreshLicenseStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      const status = await window.electronAPI.activation.checkLicenseStatus();
      setIsValid(status.isValid);
      setLicenseInfo(status.licenseInfo);
      setMessage(status.message);
      setError(''); // Clear any previous errors on success
    } catch (err) {
      console.error('Erreur lors de la vérification de la licence:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la vérification de la licence';
      setIsValid(false);
      setMessage(errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const activateWithKey = useCallback(async (key: string): Promise<ActivationResponse> => {
    try {
      setError('');
      const response = await window.electronAPI.activation.activateWithKey(key);
      if (response.success) {
        await refreshLicenseStatus();
      }
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'activation';
      setError(errorMessage);
      return {
        success: false,
        message: errorMessage
      };
    }
  }, [refreshLicenseStatus]);

  const getTrialDaysRemaining = useCallback(async (): Promise<number> => {
    try {
      return await window.electronAPI.activation.getTrialDaysRemaining();
    } catch (err) {
      console.error('Erreur lors de la récupération des jours d\'essai:', err);
      return 0;
    }
  }, []);

  const clearError = useCallback(() => {
    setError('');
  }, []);

  useEffect(() => {
    refreshLicenseStatus();
  }, [refreshLicenseStatus]);

  return {
    isValid,
    licenseInfo,
    message,
    isLoading,
    error,
    activateWithKey,
    getTrialDaysRemaining,
    refreshLicenseStatus,
    clearError
  };
};
