import React, { createContext, useContext, useCallback } from 'react';

interface DataUpdateContextType {
  triggerDashboardUpdate: () => void;
  triggerStatsUpdate: () => void;
}

const DataUpdateContext = createContext<DataUpdateContextType | undefined>(undefined);

interface DataUpdateProviderProps {
  children: React.ReactNode;
  onDashboardUpdate?: () => void;
  onStatsUpdate?: () => void;
}

export const DataUpdateProvider: React.FC<DataUpdateProviderProps> = ({
  children,
  onDashboardUpdate,
  onStatsUpdate
}) => {
  const triggerDashboardUpdate = useCallback(() => {
    if (onDashboardUpdate) {
      onDashboardUpdate();
    }
  }, [onDashboardUpdate]);

  const triggerStatsUpdate = useCallback(() => {
    if (onStatsUpdate) {
      onStatsUpdate();
    }
  }, [onStatsUpdate]);

  return (
    <DataUpdateContext.Provider value={{
      triggerDashboardUpdate,
      triggerStatsUpdate
    }}>
      {children}
    </DataUpdateContext.Provider>
  );
};

/**
 * Variante non bloquante : renvoie `undefined` hors d'un DataUpdateProvider.
 * Permet aux hooks partages (usePayments, consultations...) de declencher un
 * rafraichissement du tableau de bord quand il est monte, sans imposer le
 * provider a tous leurs appelants.
 */
export const useDataUpdateOptional = (): DataUpdateContextType | undefined =>
  useContext(DataUpdateContext);

export const useDataUpdate = () => {
  const context = useContext(DataUpdateContext);
  if (context === undefined) {
    throw new Error('useDataUpdate must be used within a DataUpdateProvider');
  }
  return context;
};
