import { useState, useEffect, useCallback } from 'react';
import { useElectron } from './useElectron';

export interface WorkingHours {
  start: string;
  end: string;
  lunchStart: string;
  lunchEnd: string;
  workDays: {
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
  };
  consultationDuration: number;
}

export const useWorkingHours = () => {
  const [workingHours, setWorkingHours] = useState<WorkingHours | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { isElectron } = useElectron();

  const loadWorkingHours = useCallback(async () => {
    if (!isElectron) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const settings = await window.electronAPI.settings.getAll();
      const settingsMap = settings.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {} as { [key: string]: string });

      setWorkingHours({
        start: settingsMap.work_start_time || '08:00',
        end: settingsMap.work_end_time || '18:00',
        lunchStart: settingsMap.lunch_start_time || '12:00',
        lunchEnd: settingsMap.lunch_end_time || '14:00',
        consultationDuration: parseInt(settingsMap.default_consultation_duration || '30'),
        workDays: {
          monday: settingsMap.work_days_monday === 'true',
          tuesday: settingsMap.work_days_tuesday === 'true',
          wednesday: settingsMap.work_days_wednesday === 'true',
          thursday: settingsMap.work_days_thursday === 'true',
          friday: settingsMap.work_days_friday === 'true',
          saturday: settingsMap.work_days_saturday === 'true',
          sunday: settingsMap.work_days_sunday === 'true',
        }
      });
    } catch (err) {
      setError('Erreur lors du chargement des paramètres de travail');
      console.error('Erreur lors du chargement des paramètres de travail:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isElectron]);

  // Vérifier si un jour est ouvrable
  const isWorkingDay = useCallback((date: Date | string) => {
    if (!workingHours) return false;
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dateObj.getDay()] as keyof typeof workingHours.workDays;
    
    return workingHours.workDays[dayName] || false;
  }, [workingHours]);

  // Générer les créneaux disponibles pour une date
  const generateTimeSlots = useCallback((date: Date | string, duration?: number) => {
    if (!workingHours) return [];

    const slotDuration = duration || workingHours.consultationDuration;
    const slots: string[] = [];
    
    // Vérifier si c'est un jour ouvrable
    if (!isWorkingDay(date)) return [];

    const startTime = new Date(`2000-01-01T${workingHours.start}:00`);
    const endTime = new Date(`2000-01-01T${workingHours.end}:00`);
    const lunchStart = new Date(`2000-01-01T${workingHours.lunchStart}:00`);
    const lunchEnd = new Date(`2000-01-01T${workingHours.lunchEnd}:00`);

    let currentTime = new Date(startTime);

    while (currentTime < endTime) {
      const timeString = currentTime.toTimeString().slice(0, 5);
      
      // Vérifier si le créneau n'est pas pendant la pause déjeuner
      const slotTime = new Date(`2000-01-01T${timeString}:00`);
      const slotEndTime = new Date(slotTime.getTime() + slotDuration * 60000);
      
      const isInLunchBreak = (slotTime >= lunchStart && slotTime < lunchEnd) ||
                            (slotEndTime > lunchStart && slotEndTime <= lunchEnd) ||
                            (slotTime < lunchStart && slotEndTime > lunchEnd);

      if (!isInLunchBreak && slotEndTime <= endTime) {
        slots.push(timeString);
      }

      currentTime.setMinutes(currentTime.getMinutes() + slotDuration);
    }

    return slots;
  }, [workingHours, isWorkingDay]);

  // Obtenir les jours de travail sous forme de texte
  const getWorkingDaysText = useCallback(() => {
    if (!workingHours) return '';
    
    const dayLabels = {
      monday: 'Lun',
      tuesday: 'Mar',
      wednesday: 'Mer',
      thursday: 'Jeu',
      friday: 'Ven',
      saturday: 'Sam',
      sunday: 'Dim'
    };

    const workingDaysList = Object.entries(workingHours.workDays)
      .filter(([_, isWorking]) => isWorking)
      .map(([day, _]) => dayLabels[day as keyof typeof dayLabels]);

    return workingDaysList.join(', ');
  }, [workingHours]);

  useEffect(() => {
    loadWorkingHours();
  }, [loadWorkingHours]);

  return {
    workingHours,
    isLoading,
    error,
    loadWorkingHours,
    isWorkingDay,
    generateTimeSlots,
    getWorkingDaysText
  };
};
