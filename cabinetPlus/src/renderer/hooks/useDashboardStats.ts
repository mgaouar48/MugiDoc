import { useState, useEffect, useCallback, useRef } from 'react';
import { useElectron } from './useElectron';
import { useAuth } from './useAuth';
import { Appointment } from '../../shared/types';

export interface DashboardStats {
  totalPatients: number;
  appointmentsToday: number;
  appointmentsTotal: number;
  monthlyRevenue: number;
  unpaidAmount: number;
  consultationsToday: number;
  consultationsTotal: number;
  todayAppointmentsList: Appointment[];
}

export interface CabinetInfo {
  name: string;
  address: string;
  phone: string;
  doctorName: string;
  doctorSpeciality: string;
}

const EMPTY_STATS: DashboardStats = {
  totalPatients: 0,
  appointmentsToday: 0,
  appointmentsTotal: 0,
  monthlyRevenue: 0,
  unpaidAmount: 0,
  consultationsToday: 0,
  consultationsTotal: 0,
  todayAppointmentsList: []
};

/**
 * Exécute un chargement de bloc sans faire échouer les autres. Un service
 * indisponible ne doit pas remettre à zéro l'ensemble du tableau de bord :
 * chaque bloc échoue indépendamment et son nom est remonté à l'appelant.
 */
const settle = async <T>(
  label: string,
  loader: () => Promise<T>,
  failures: string[]
): Promise<T | null> => {
  try {
    return await loader();
  } catch (err) {
    console.error(`Dashboard — chargement "${label}" en échec:`, err);
    failures.push(label);
    return null;
  }
};

export const useDashboardStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);

  const [cabinetInfo, setCabinetInfo] = useState<CabinetInfo>({
    name: 'Cabinet Médical',
    address: '',
    phone: '',
    doctorName: 'Docteur',
    doctorSpeciality: 'Médecine générale'
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isElectron } = useElectron();

  // Dernières valeurs connues : un rafraîchissement partiellement en échec
  // garde l'ancienne valeur du bloc concerné au lieu d'afficher 0.
  const lastStats = useRef<DashboardStats>(EMPTY_STATS);
  // Une fois des données obtenues, on ne repasse plus par l'état « chargement » :
  // les compteurs ne doivent plus jamais clignoter vers un tiret.
  const hasLoadedOnce = useRef(false);
  // L'identité de l'objet `user` changeait à chaque connexion et relançait
  // l'effet ; on la lit via une ref et on ne dépend que de son identifiant.
  const userRef = useRef(user);
  userRef.current = user;

  const loadDashboardData = useCallback(async (isSilent = false) => {
    if (!isElectron) return;

    if (!isSilent && !hasLoadedOnce.current) setLoading(true);

    const failures: string[] = [];
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

    // `finally` garantit la sortie de l'état « chargement » quoi qu'il arrive :
    // une exception non prévue y laissait les compteurs bloqués sur « – ».
    try {
      const [
        patientStats,
        appointmentStats,
        consultationStats,
        settings,
        todayAppointments,
        todayConsultations,
        monthlyPayments,
        unpaidPayments
      ] = await Promise.all([
        settle('patients', () => window.electronAPI.patients.getStats(), failures),
        settle('rendez-vous', () => window.electronAPI.appointments.getStats(), failures),
        settle('consultations', () => window.electronAPI.consultations.getStats(), failures),
        settle('paramètres', () => window.electronAPI.settings.getAll(), failures),
        settle('rendez-vous du jour', () => window.electronAPI.appointments.getAll({ date: today }), failures),
        settle('consultations du jour', () => window.electronAPI.consultations.getAll({ date: today }), failures),
        settle('revenus du mois', () => window.electronAPI.payments.getAll({
          date_from: `${currentMonth}-01`,
          date_to: `${currentMonth}-31`
        }), failures),
        settle('impayés', () => window.electronAPI.payments.getAll({ status: 'debt' }), failures)
      ]);

      const previous = lastStats.current;

      const appointmentsToday = todayAppointments
        ? todayAppointments.filter(apt => apt.status === 'confirmé' || apt.status === 'en_attente').length
        : previous.appointmentsToday;

      const consultationsToday = todayConsultations
        ? todayConsultations.filter(cons => cons.status === 'completed').length
        : previous.consultationsToday;

      // Revenus = paiements soldés + part déjà réglée des dettes.
      // `debt_amount` est le RESTE À PAYER, donc la part encaissée d'une dette
      // vaut `amount - debt_amount`.
      let monthlyRevenue = previous.monthlyRevenue;
      if (monthlyPayments) {
        const completedRevenue = monthlyPayments
          .filter(payment => payment.status === 'completed')
          .reduce((sum, payment) => sum + payment.amount, 0);

        const partiallyPaidRevenue = monthlyPayments
          .filter(payment => payment.status === 'debt')
          .reduce((sum, payment) => sum + Math.max(0, payment.amount - (payment.debt_amount || 0)), 0);

        monthlyRevenue = completedRevenue + partiallyPaidRevenue;
      }

      const unpaidAmount = unpaidPayments
        ? unpaidPayments.reduce((sum, payment) => sum + (payment.debt_amount || 0), 0)
        : previous.unpaidAmount;

      const nextStats: DashboardStats = {
        totalPatients: patientStats ? patientStats.total : previous.totalPatients,
        appointmentsToday,
        appointmentsTotal: appointmentStats ? appointmentStats.total : previous.appointmentsTotal,
        monthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
        unpaidAmount: Math.round(unpaidAmount * 100) / 100,
        consultationsToday,
        consultationsTotal: consultationStats ? consultationStats.total : previous.consultationsTotal,
        todayAppointmentsList: todayAppointments ?? previous.todayAppointmentsList
      };

      lastStats.current = nextStats;
      setStats(nextStats);

      if (settings) {
        const getSetting = (key: string, defaultValue: string) => {
          const setting = settings.find(s => s.key === key);
          return setting ? setting.value : defaultValue;
        };

        const currentUser = userRef.current;
        const doctorFirstName = currentUser?.first_name || getSetting('doctor_first_name', '');
        const doctorLastName = currentUser?.last_name || getSetting('doctor_last_name', '');
        const doctorName = (doctorFirstName || doctorLastName)
          ? `Dr. ${doctorFirstName} ${doctorLastName}`.trim()
          : getSetting('doctor_name', 'Dr. Médecin');

        setCabinetInfo({
          name: getSetting('cabinet_name', 'Cabinet Médical'),
          address: getSetting('cabinet_address', ''),
          phone: getSetting('cabinet_phone', ''),
          doctorName,
          doctorSpeciality: currentUser?.speciality || getSetting('doctor_speciality', 'Médecine générale')
        });
      }

      if (failures.length === 0) {
        setError(null);
      } else if (failures.length >= 6) {
        setError(
          "Base de données inaccessible — l'application a démarré en mode dégradé. " +
          "Fermez l'application, lancez « npm run electron:rebuild », puis relancez-la."
        );
      } else {
        setError(`Statistiques partiellement indisponibles : ${failures.join(', ')}.`);
      }

      hasLoadedOnce.current = true;
    } catch (err) {
      console.error('Dashboard — erreur inattendue pendant le chargement:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
    // `user?.id` plutôt que `user` : l'objet est recréé à chaque récupération
    // du profil et relançait l'effet en boucle, d'où le clignotement.
  }, [isElectron, user?.id]);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(() => {
      loadDashboardData(true);
    }, 4000);
    return () => clearInterval(interval);
  }, [loadDashboardData]);

  return {
    stats,
    cabinetInfo,
    loading,
    error,
    refresh: () => loadDashboardData(false)
  };
};
