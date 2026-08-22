import { useState, useEffect, useCallback } from 'react';
import { WaitingRoomEntry } from '../../shared/types';
import { useElectron } from './useElectron';
import { getNetworkConfig, buildNetworkAPI } from '../lib/networkClient';

export const useWaitingRoom = () => {
  const [queue, setQueue] = useState<WaitingRoomEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { isElectron } = useElectron();

  const fetchQueue = useCallback(async () => {
    try {
      // Check network mode first
      const netConfig = getNetworkConfig();
      if (netConfig.enabled && netConfig.serverIP && netConfig.serverIP !== 'server') {
        const netApi = buildNetworkAPI(netConfig);
        const data = await netApi.waitingRoom.getTodayQueue();
        setQueue(data);
        setError(null);
        return;
      }

      // Local Electron mode
      if (isElectron && window.electronAPI) {
        const data = await window.electronAPI.waitingRoom.getTodayQueue();
        setQueue(data);
        setError(null);
      }
    } catch (err: any) {
      console.error('Erreur chargement salle attente:', err);
      setError(err.message || 'Erreur lors du chargement de la salle d\'attente');
    } finally {
      setIsLoading(false);
    }
  }, [isElectron]);

  useEffect(() => {
    fetchQueue();
    // Refresh every 5 seconds to keep waiting room real-time
    const interval = setInterval(fetchQueue, 5000);

    let unsubQueue: any = null;
    let unsubCall: any = null;

    if (isElectron && window.electronAPI?.waitingRoom) {
      if (window.electronAPI.waitingRoom.onQueueUpdated) {
        unsubQueue = window.electronAPI.waitingRoom.onQueueUpdated((updatedQueue: any) => {
          if (Array.isArray(updatedQueue)) {
            setQueue(updatedQueue);
          } else {
            fetchQueue();
          }
        });
      }

      if (window.electronAPI.waitingRoom.onCallNext) {
        unsubCall = window.electronAPI.waitingRoom.onCallNext((data: any) => {
          if (data?.queue && Array.isArray(data.queue)) {
            setQueue(data.queue);
          } else {
            fetchQueue();
          }
        });
      }
    }

    return () => {
      clearInterval(interval);
      if (unsubQueue) unsubQueue();
      if (unsubCall) unsubCall();
    };
  }, [fetchQueue, isElectron]);

  const addToQueue = async (data: { patient_id: number; appointment_id?: number; priority?: number; notes?: string }) => {
    try {
      const netConfig = getNetworkConfig();
      let newEntry: WaitingRoomEntry;
      if (netConfig.enabled && netConfig.serverIP && netConfig.serverIP !== 'server') {
        const netApi = buildNetworkAPI(netConfig);
        newEntry = await netApi.waitingRoom.addToQueue(data);
      } else if (isElectron && window.electronAPI) {
        newEntry = await window.electronAPI.waitingRoom.addToQueue(data);
      } else {
        throw new Error("Environnement non supporté");
      }
      
      setQueue(prev => {
        const newQueue = [...prev, newEntry];
        return newQueue.sort((a, b) => {
          if (a.status === 'en_consultation' && b.status !== 'en_consultation') return -1;
          if (b.status === 'en_consultation' && a.status !== 'en_consultation') return 1;
          if (a.priority !== b.priority) return a.priority - b.priority;
          return new Date(a.arrival_time).getTime() - new Date(b.arrival_time).getTime();
        });
      });
      return newEntry;
    } catch (err: any) {
      console.error('Erreur addToQueue:', err);
      throw err;
    }
  };

  const updateStatus = async (id: number, status: 'en_attente' | 'en_consultation' | 'termine' | 'absent') => {
    try {
      const netConfig = getNetworkConfig();
      if (netConfig.enabled && netConfig.serverIP && netConfig.serverIP !== 'server') {
        const netApi = buildNetworkAPI(netConfig);
        await netApi.waitingRoom.updateStatus(id, status);
      } else if (isElectron && window.electronAPI) {
        await window.electronAPI.waitingRoom.updateStatus(id, status);
      }
      await fetchQueue();
    } catch (err: any) {
      console.error('Erreur updateStatus:', err);
      throw err;
    }
  };

  const removeFromQueue = async (id: number) => {
    try {
      const netConfig = getNetworkConfig();
      if (netConfig.enabled && netConfig.serverIP && netConfig.serverIP !== 'server') {
        const netApi = buildNetworkAPI(netConfig);
        await netApi.waitingRoom.removeFromQueue(id);
      } else if (isElectron && window.electronAPI) {
        await window.electronAPI.waitingRoom.removeFromQueue(id);
      }
      setQueue(prev => prev.filter(q => q.id !== id));
    } catch (err: any) {
      console.error('Erreur removeFromQueue:', err);
      throw err;
    }
  };

  return {
    queue,
    isLoading,
    error,
    fetchQueue,
    addToQueue,
    updateStatus,
    removeFromQueue
  };
};
