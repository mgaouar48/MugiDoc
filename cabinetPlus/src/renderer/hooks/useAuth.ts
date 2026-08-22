import { useState, useCallback, useEffect } from 'react';
import { useElectron } from './useElectron';

export interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  speciality?: string;
  license_number?: string;
  must_change_password?: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ChangeCredentialsRequest {
  currentPassword: string;
  newUsername?: string;
  newPassword?: string;
}

export interface UpdateUserRequest {
  username?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  speciality?: string;
  license_number?: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isElectron } = useElectron();

  // Sync des paramètres médecin avec l'utilisateur connecté
  const syncDoctorSettings = useCallback(async (u: User) => {
    if (!isElectron) return;
    try {
      if (u.first_name) await window.electronAPI.settings.update('doctor_first_name', u.first_name);
      if (u.last_name) await window.electronAPI.settings.update('doctor_last_name', u.last_name);
      if (u.email) await window.electronAPI.settings.update('doctor_email', u.email);
      if (u.speciality) await window.electronAPI.settings.update('doctor_speciality', u.speciality);
    } catch (e) {
      // Ignorer si paramètre non trouvé
    }
  }, [isElectron]);

  // Auto-charger l'utilisateur au montage si un ID est stocké
  useEffect(() => {
    if (!user && isElectron && localStorage.getItem('userId')) {
      const fetchUser = async () => {
        try {
          const userId = localStorage.getItem('userId');
          if (userId) {
            const currentUser = await window.electronAPI.auth.getUserById(parseInt(userId));
            if (currentUser) {
              setUser(currentUser);
              syncDoctorSettings(currentUser);
            }
          }
        } catch (e) {
          console.error('Erreur lors du chargement auto de l\'utilisateur:', e);
        }
      };
      fetchUser();
    }
  }, [user, isElectron, syncDoctorSettings]);

  // Connexion
  const login = useCallback(async (loginData: LoginRequest): Promise<User | null> => {
    if (!isElectron) {
      throw new Error('Fonctionnalité non disponible');
    }

    setIsLoading(true);
    setError(null);

    try {
      // Vérifier d'abord le statut de la licence
      const licenseStatus = await window.electronAPI.activation.checkLicenseStatus();
      
      if (!licenseStatus.isValid) {
        setError(licenseStatus.message);
        throw new Error(licenseStatus.message);
      }

      const authenticatedUser = await window.electronAPI.auth.login(loginData);
      
      if (authenticatedUser) {
        setUser(authenticatedUser);
        localStorage.setItem('userId', authenticatedUser.id.toString());
        await syncDoctorSettings(authenticatedUser);
        return authenticatedUser;
      } else {
        setError('Nom d\'utilisateur ou mot de passe incorrect');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de connexion';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isElectron]);

  // Déconnexion
  const logout = useCallback(() => {
    setUser(null);
    setError(null);
    localStorage.removeItem('userId');
  }, []);

  // Récupérer l'utilisateur actuel depuis l'ID stocké
  const getCurrentUser = useCallback(async (): Promise<User | null> => {
    if (!isElectron) return null;

    const userId = localStorage.getItem('userId');
    if (!userId) return null;

    try {
      const currentUser = await window.electronAPI.auth.getUserById(parseInt(userId));
      if (currentUser) {
        setUser(currentUser);
        return currentUser;
      } else {
        // L'utilisateur n'existe plus, nettoyer la session
        logout();
        return null;
      }
    } catch (err) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', err);
      logout();
      return null;
    }
  }, [isElectron, logout]);

  // Changer le mot de passe
  const changePassword = useCallback(async (passwordData: ChangePasswordRequest): Promise<void> => {
    if (!isElectron || !user) {
      throw new Error('Utilisateur non connecté');
    }

    setIsLoading(true);
    setError(null);

    try {
      await window.electronAPI.auth.changePassword(user.id, passwordData);
      setUser({ ...user, must_change_password: false });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du changement de mot de passe';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isElectron, user]);

  // Changer les identifiants (nom d'utilisateur et/ou mot de passe)
  const changeCredentials = useCallback(async (credentialsData: ChangeCredentialsRequest): Promise<void> => {
    if (!isElectron || !user) {
      throw new Error('Utilisateur non connecté');
    }

    setIsLoading(true);
    setError(null);

    try {
      await window.electronAPI.auth.changeCredentials(user.id, credentialsData);

      // Rafraîchir l'utilisateur local (nom d'utilisateur et/ou indicateur de changement de mot de passe forcé)
      const updatedUser = await window.electronAPI.auth.getUserById(user.id);
      if (updatedUser) {
        setUser(updatedUser);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du changement des identifiants';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isElectron, user]);

  // Mettre à jour les informations utilisateur
  const updateUser = useCallback(async (userData: UpdateUserRequest): Promise<User> => {
    if (!isElectron || !user) {
      throw new Error('Utilisateur non connecté');
    }

    setIsLoading(true);
    setError(null);

    try {
      const updatedUser = await window.electronAPI.auth.updateUser(user.id, userData);
      setUser(updatedUser);
      return updatedUser;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isElectron, user]);

  // Vérifier si l'utilisateur est connecté
  const isAuthenticated = user !== null;

  // L'utilisateur doit changer son mot de passe avant d'accéder à l'application
  const mustChangePassword = !!user?.must_change_password;

  // Obtenir le nom complet de l'utilisateur
  const getFullName = useCallback((): string => {
    if (!user) return '';
    return `${user.first_name} ${user.last_name}`;
  }, [user]);

  return {
    user,
    isAuthenticated,
    mustChangePassword,
    isLoading,
    error,
    login,
    logout,
    getCurrentUser,
    changePassword,
    changeCredentials,
    updateUser,
    getFullName,
    clearError: () => setError(null)
  };
};
