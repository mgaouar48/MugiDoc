import { useState, useEffect, useCallback } from 'react';
import { Appointment, CreateAppointmentRequest, UpdateAppointmentRequest, AppointmentSearchFilters } from '../../shared/types';
import { useElectron } from './useElectron';

interface UseAppointments {
  appointments: Appointment[];
  isLoading: boolean;
  error: string | null;
  stats: { total: number; confirmed: number; pending: number; cancelled: number; completed: number } | null;

  // Actions
  loadAppointments: (filters?: AppointmentSearchFilters) => Promise<void>;
  getAppointmentById: (id: number) => Promise<Appointment | null>;
  createAppointment: (appointmentData: CreateAppointmentRequest) => Promise<Appointment>;
  updateAppointment: (id: number, appointmentData: UpdateAppointmentRequest) => Promise<Appointment>;
  deleteAppointment: (id: number) => Promise<void>;
  getAppointmentsByPatient: (patientId: number) => Promise<Appointment[]>;
  getAppointmentsByDate: (date: string) => Promise<Appointment[]>;
  loadStats: () => Promise<void>;

  // Utilitaires
  refreshAppointments: () => Promise<void>;
  clearError: () => void;
}

export const useAppointments = (): UseAppointments => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{ total: number; confirmed: number; pending: number; cancelled: number; completed: number } | null>(null);
  const [currentFilters, setCurrentFilters] = useState<AppointmentSearchFilters | undefined>(undefined);

  const { isElectron } = useElectron();

  // Charger les rendez-vous avec filtres optionnels
  const loadAppointments = useCallback(async (filters?: AppointmentSearchFilters) => {
    if (!isElectron) return;

    setIsLoading(true);
    setError(null);
    setCurrentFilters(filters);

    try {
      const appointmentsData = await window.electronAPI.appointments.getAll(filters);
      console.log('Rendez-vous chargés:', appointmentsData.length, 'rendez-vous');
      setAppointments(appointmentsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Impossible de charger les rendez-vous';
      setError(errorMessage);
      console.error('Erreur lors du chargement des rendez-vous:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isElectron]);

  // Charger les statistiques
  const loadStats = useCallback(async () => {
    if (!isElectron) return;

    try {
      const statsData = await window.electronAPI.appointments.getStats();
      console.log('Statistiques des rendez-vous chargées:', statsData);
      setStats(statsData);
    } catch (err) {
      console.error('Erreur lors du chargement des statistiques:', err);
    }
  }, [isElectron]);

  // Récupérer un rendez-vous par ID
  const getAppointmentById = useCallback(async (id: number): Promise<Appointment | null> => {
    if (!isElectron) return null;

    try {
      return await window.electronAPI.appointments.getById(id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Impossible de récupérer le rendez-vous ${id}`;
      setError(errorMessage);
      throw err;
    }
  }, [isElectron]);

  // Créer un nouveau rendez-vous
  const createAppointment = useCallback(async (appointmentData: CreateAppointmentRequest): Promise<Appointment> => {
    if (!isElectron) throw new Error('Fonctionnalité non disponible');

    setIsLoading(true);
    setError(null);

    try {
      const newAppointment = await window.electronAPI.appointments.create(appointmentData);

      // Recharger la liste des rendez-vous et les statistiques
      await Promise.all([
        loadAppointments(currentFilters),
        loadStats()
      ]);

      return newAppointment;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Impossible de créer le rendez-vous';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isElectron, loadAppointments, loadStats, currentFilters]);

  // Mettre à jour un rendez-vous
  const updateAppointment = useCallback(async (id: number, appointmentData: UpdateAppointmentRequest): Promise<Appointment> => {
    if (!isElectron) throw new Error('Fonctionnalité non disponible');

    setIsLoading(true);
    setError(null);

    try {
      const updatedAppointment = await window.electronAPI.appointments.update(id, appointmentData);

      // Mettre à jour la liste locale
      setAppointments(prevAppointments =>
        prevAppointments.map(appointment =>
          appointment.id === id ? updatedAppointment : appointment
        )
      );

      // Recharger les statistiques si le statut a changé
      if (appointmentData.status) {
        await loadStats();
      }

      return updatedAppointment;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Impossible de mettre à jour le rendez-vous ${id}`;
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isElectron, loadStats]);

  // Supprimer un rendez-vous
  const deleteAppointment = useCallback(async (id: number): Promise<void> => {
    if (!isElectron) throw new Error('Fonctionnalité non disponible');

    setIsLoading(true);
    setError(null);

    try {
      await window.electronAPI.appointments.delete(id);

      // Retirer le rendez-vous de la liste locale
      setAppointments(prevAppointments => prevAppointments.filter(appointment => appointment.id !== id));

      // Recharger les statistiques
      await loadStats();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Impossible de supprimer le rendez-vous ${id}`;
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isElectron, loadStats]);

  // Récupérer les rendez-vous d'un patient
  const getAppointmentsByPatient = useCallback(async (patientId: number): Promise<Appointment[]> => {
    if (!isElectron) return [];

    try {
      return await window.electronAPI.appointments.getByPatient(patientId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la récupération des rendez-vous du patient';
      setError(errorMessage);
      throw err;
    }
  }, [isElectron]);

  // Récupérer les rendez-vous d'une date
  const getAppointmentsByDate = useCallback(async (date: string): Promise<Appointment[]> => {
    if (!isElectron) return [];

    try {
      return await window.electronAPI.appointments.getByDate(date);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la récupération des rendez-vous de la date';
      setError(errorMessage);
      throw err;
    }
  }, [isElectron]);

  // Rafraîchir les rendez-vous avec les derniers filtres
  const refreshAppointments = useCallback(async () => {
    await loadAppointments(currentFilters);
  }, [loadAppointments, currentFilters]);

  // Effacer l'erreur
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Charger les rendez-vous et statistiques au montage
  useEffect(() => {
    if (isElectron) {
      Promise.all([
        loadAppointments(),
        loadStats()
      ]);
    }
  }, [isElectron, loadAppointments, loadStats]);

  return {
    appointments,
    isLoading,
    error,
    stats,
    loadAppointments,
    getAppointmentById,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    getAppointmentsByPatient,
    getAppointmentsByDate,
    loadStats,
    refreshAppointments,
    clearError
  };
};

// Hook spécialisé pour un rendez-vous spécifique
export const useAppointment = (id: number | null) => {
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { isElectron } = useElectron();

  const loadAppointment = useCallback(async () => {
    if (!isElectron || !id) return;

    setIsLoading(true);
    setError(null);

    try {
      const appointmentData = await window.electronAPI.appointments.getById(id);
      setAppointment(appointmentData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Impossible de charger le rendez-vous ${id}`;
      setError(errorMessage);
      console.error('Erreur lors du chargement du rendez-vous:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isElectron, id]);

  useEffect(() => {
    if (id) {
      loadAppointment();
    } else {
      setAppointment(null);
    }
  }, [id, loadAppointment]);

  return {
    appointment,
    isLoading,
    error,
    reload: loadAppointment,
    clearError: () => setError(null)
  };
};

// Hook pour les créneaux disponibles avec paramètres de travail
export const useAvailableSlots = (date: string, duration: number = 30) => {
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [workingHours, setWorkingHours] = useState<{
    start: string;
    end: string;
    lunchStart: string;
    lunchEnd: string;
    workDays: { [key: string]: boolean };
  } | null>(null);

  const { getAppointmentsByDate } = useAppointments();
  const { isElectron } = useElectron();

  // Charger les paramètres de travail
  const loadWorkingHours = useCallback(async () => {
    if (!isElectron) return;

    try {
      const settings = await window.electronAPI.settings.getAll();
      const settingsMap = settings.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {} as { [key: string]: string });

      // Valeurs par défaut si aucun paramètre n'est configuré
      const defaultWorkDays = {
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: false,
        sunday: false,
      };

      setWorkingHours({
        start: settingsMap.work_start_time || '08:00',
        end: settingsMap.work_end_time || '18:00',
        lunchStart: settingsMap.lunch_start_time || '12:00',
        lunchEnd: settingsMap.lunch_end_time || '14:00',
        workDays: {
          monday: settingsMap.work_days_monday ? settingsMap.work_days_monday === 'true' : defaultWorkDays.monday,
          tuesday: settingsMap.work_days_tuesday ? settingsMap.work_days_tuesday === 'true' : defaultWorkDays.tuesday,
          wednesday: settingsMap.work_days_wednesday ? settingsMap.work_days_wednesday === 'true' : defaultWorkDays.wednesday,
          thursday: settingsMap.work_days_thursday ? settingsMap.work_days_thursday === 'true' : defaultWorkDays.thursday,
          friday: settingsMap.work_days_friday ? settingsMap.work_days_friday === 'true' : defaultWorkDays.friday,
          saturday: settingsMap.work_days_saturday ? settingsMap.work_days_saturday === 'true' : defaultWorkDays.saturday,
          sunday: settingsMap.work_days_sunday ? settingsMap.work_days_sunday === 'true' : defaultWorkDays.sunday,
        }
      });
    } catch (err) {
      console.error('Erreur lors du chargement des paramètres de travail:', err);
      // En cas d'erreur, utiliser des valeurs par défaut
      setWorkingHours({
        start: '08:00',
        end: '18:00',
        lunchStart: '12:00',
        lunchEnd: '14:00',
        workDays: {
          monday: true,
          tuesday: true,
          wednesday: true,
          thursday: true,
          friday: true,
          saturday: false,
          sunday: false,
        }
      });
    }
  }, [isElectron]);

  // Générer les créneaux disponibles selon les paramètres
  const generateTimeSlots = useCallback((workHours: typeof workingHours) => {
    if (!workHours) return [];

    const slots: string[] = [];
    const startTime = new Date(`2000-01-01T${workHours.start}:00`);
    const endTime = new Date(`2000-01-01T${workHours.end}:00`);
    const lunchStart = new Date(`2000-01-01T${workHours.lunchStart}:00`);
    const lunchEnd = new Date(`2000-01-01T${workHours.lunchEnd}:00`);

    let currentTime = new Date(startTime);

    while (currentTime < endTime) {
      const timeString = currentTime.toTimeString().slice(0, 5);

      // Vérifier si le créneau n'est pas pendant la pause déjeuner
      const slotTime = new Date(`2000-01-01T${timeString}:00`);
      const slotEndTime = new Date(slotTime.getTime() + duration * 60000);

      const isInLunchBreak = (slotTime >= lunchStart && slotTime < lunchEnd) ||
                            (slotEndTime > lunchStart && slotEndTime <= lunchEnd) ||
                            (slotTime < lunchStart && slotEndTime > lunchEnd);

      if (!isInLunchBreak && slotEndTime <= endTime) {
        slots.push(timeString);
      }

      currentTime.setMinutes(currentTime.getMinutes() + duration);
    }

    return slots;
  }, [duration]);

  // Vérifier si un jour est ouvrable
  const isWorkingDay = useCallback((dateStr: string) => {
    if (!workingHours) return false;

    const date = new Date(dateStr);
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[date.getDay()];

    return workingHours.workDays[dayName] || false;
  }, [workingHours]);

  const loadAvailableSlots = useCallback(async () => {
    if (!date || !workingHours) return;

    setIsLoading(true);

    try {
      // Vérifier si c'est un jour ouvrable
      if (!isWorkingDay(date)) {
        setAvailableSlots([]);
        return;
      }

      // Générer tous les créneaux possibles
      const allSlots = generateTimeSlots(workingHours);

      // Récupérer les rendez-vous existants
      const appointments = await getAppointmentsByDate(date);

      // Filtrer les créneaux occupés
      const occupiedSlots = new Set<string>();

      appointments
        .filter(apt => apt.status !== 'annulé')
        .forEach(apt => {
          const startTime = new Date(`2000-01-01T${apt.time}:00`);
          const endTime = new Date(startTime.getTime() + apt.duration * 60000);

          // Marquer tous les créneaux qui se chevauchent comme occupés
          allSlots.forEach(slot => {
            const slotTime = new Date(`2000-01-01T${slot}:00`);
            const slotEndTime = new Date(slotTime.getTime() + duration * 60000);

            // Vérifier le chevauchement
            if ((slotTime >= startTime && slotTime < endTime) ||
                (slotEndTime > startTime && slotEndTime <= endTime) ||
                (slotTime < startTime && slotEndTime > endTime)) {
              occupiedSlots.add(slot);
            }
          });
        });

      const available = allSlots.filter(slot => !occupiedSlots.has(slot));
      setAvailableSlots(available);
    } catch (err) {
      console.error('Erreur lors du chargement des créneaux disponibles:', err);
      setAvailableSlots([]);
    } finally {
      setIsLoading(false);
    }
  }, [date, workingHours, duration, getAppointmentsByDate, isWorkingDay, generateTimeSlots]);

  useEffect(() => {
    loadWorkingHours();
  }, [loadWorkingHours]);

  useEffect(() => {
    if (workingHours) {
      loadAvailableSlots();
    }
  }, [loadAvailableSlots, workingHours]);

  return {
    availableSlots,
    isLoading,
    workingHours,
    isWorkingDay: isWorkingDay(date),
    reload: loadAvailableSlots
  };
};
