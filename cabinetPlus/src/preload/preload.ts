import { contextBridge, ipcRenderer } from 'electron';

// API exposée au processus de rendu
const electronAPI = {
  // Informations sur l'application
  getAppVersion: () => ipcRenderer.invoke('app-version'),
  getPlatform: () => ipcRenderer.invoke('platform'),

  // Gestion des événements du menu
  onMenuAction: (callback: (action: string) => void) => {
    ipcRenderer.on('menu-action', (_, action) => callback(action));
  },

  // Nettoyage des listeners
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel);
  },

  // API Paramètres
  settings: {
    getAll: () => ipcRenderer.invoke('settings:getAll'),
    getByCategory: (category: string) => ipcRenderer.invoke('settings:getByCategory', category),
    get: (key: string) => ipcRenderer.invoke('settings:get', key),
    update: (key: string, value: string) => ipcRenderer.invoke('settings:update', key, value),
    create: (key: string, value: string, category: string, description?: string) =>
      ipcRenderer.invoke('settings:create', key, value, category, description),
    delete: (key: string) => ipcRenderer.invoke('settings:delete', key),
    uploadLogo: (logoData: any) => ipcRenderer.invoke('settings:uploadLogo', logoData),
    getLogo: () => ipcRenderer.invoke('settings:getLogo'),
    deleteLogo: () => ipcRenderer.invoke('settings:deleteLogo'),
  },

  // API Authentification
  auth: {
    login: (loginData: any) => ipcRenderer.invoke('auth:login', loginData),
    getUserById: (id: number) => ipcRenderer.invoke('auth:getUserById', id),
    getAllUsers: () => ipcRenderer.invoke('auth:getAllUsers'),
    createUser: (userData: any) => ipcRenderer.invoke('auth:createUser', userData),
    updateUser: (userId: number, userData: any) => ipcRenderer.invoke('auth:updateUser', userId, userData),
    deleteUser: (userId: number) => ipcRenderer.invoke('auth:deleteUser', userId),
    toggleUserActive: (userId: number) => ipcRenderer.invoke('auth:toggleUserActive', userId),
    resetPassword: (userId: number, newPassword: string) => ipcRenderer.invoke('auth:resetPassword', userId, newPassword),
    changePassword: (userId: number, passwordData: any) => ipcRenderer.invoke('auth:changePassword', userId, passwordData),
    changeCredentials: (userId: number, credentialsData: any) => ipcRenderer.invoke('auth:changeCredentials', userId, credentialsData),
  },

  // API Logs d'activité
  logs: {
    getAll: (filters?: any) => ipcRenderer.invoke('logs:getAll', filters),
    create: (action: string, resource: string, details?: string) => ipcRenderer.invoke('logs:create', action, resource, details),
  },

  // API Sauvegardes
  backup: {
    create: (customPath?: string) => ipcRenderer.invoke('backup:create', customPath),
    restore: (backupPath?: string) => ipcRenderer.invoke('backup:restore', backupPath),
    getAutoBackups: () => ipcRenderer.invoke('backup:getAutoBackups'),
    createAuto: () => ipcRenderer.invoke('backup:createAuto'),
  },

  // API Base de données
  database: {
    getStats: () => ipcRenderer.invoke('database:getStats'),
  },

  // API Patients
  patients: {
    getAll: (filters?: any) => ipcRenderer.invoke('patients:getAll', filters),
    getCount: (filters?: any) => ipcRenderer.invoke('patients:getCount', filters),
    getById: (id: number) => ipcRenderer.invoke('patients:getById', id),
    create: (patientData: any) => ipcRenderer.invoke('patients:create', patientData),
    update: (id: number, patientData: any) => ipcRenderer.invoke('patients:update', id, patientData),
    delete: (id: number) => ipcRenderer.invoke('patients:delete', id),
    search: (query: string) => ipcRenderer.invoke('patients:search', query),
    getStats: (filters?: any) => ipcRenderer.invoke('patients:getStats', filters),
  },

  // API Rendez-vous
  appointments: {
    getAll: (filters?: any) => ipcRenderer.invoke('appointments:getAll', filters),
    getCount: (filters?: any) => ipcRenderer.invoke('appointments:getCount', filters),
    getById: (id: number) => ipcRenderer.invoke('appointments:getById', id),
    create: (appointmentData: any) => ipcRenderer.invoke('appointments:create', appointmentData),
    update: (id: number, appointmentData: any) => ipcRenderer.invoke('appointments:update', id, appointmentData),
    delete: (id: number) => ipcRenderer.invoke('appointments:delete', id),
    getByPatient: (patientId: number) => ipcRenderer.invoke('appointments:getByPatient', patientId),
    getByDate: (date: string) => ipcRenderer.invoke('appointments:getByDate', date),
    getStats: () => ipcRenderer.invoke('appointments:getStats'),
  },

  // API Consultations
  consultations: {
    getAll: (filters?: any) => ipcRenderer.invoke('consultations:getAll', filters),
    getCount: (filters?: any) => ipcRenderer.invoke('consultations:getCount', filters),
    getById: (id: number) => ipcRenderer.invoke('consultations:getById', id),
    create: (consultationData: any) => ipcRenderer.invoke('consultations:create', consultationData),
    update: (id: number, consultationData: any) => ipcRenderer.invoke('consultations:update', id, consultationData),
    delete: (id: number) => ipcRenderer.invoke('consultations:delete', id),
    getByPatient: (patientId: number) => ipcRenderer.invoke('consultations:getByPatient', patientId),
    getByAppointment: (appointmentId: number) => ipcRenderer.invoke('consultations:getByAppointment', appointmentId),
    getStats: () => ipcRenderer.invoke('consultations:getStats'),
  },

  // API Paiements
  payments: {
    getAll: (filters?: any) => ipcRenderer.invoke('payments:getAll', filters),
    getCount: (filters?: any) => ipcRenderer.invoke('payments:getCount', filters),
    getById: (id: number) => ipcRenderer.invoke('payments:getById', id),
    create: (paymentData: any) => ipcRenderer.invoke('payments:create', paymentData),
    update: (id: number, paymentData: any) => ipcRenderer.invoke('payments:update', id, paymentData),
    delete: (id: number) => ipcRenderer.invoke('payments:delete', id),
    getByPatient: (patientId: number) => ipcRenderer.invoke('payments:getByPatient', patientId),
    getStats: () => ipcRenderer.invoke('payments:getStats'),
  },

  // API Frais
  expenses: {
    getAll: (filters?: any) => ipcRenderer.invoke('expenses:getAll', filters),
    getById: (id: number) => ipcRenderer.invoke('expenses:getById', id),
    create: (expenseData: any) => ipcRenderer.invoke('expenses:create', expenseData),
    update: (id: number, expenseData: any) => ipcRenderer.invoke('expenses:update', id, expenseData),
    delete: (id: number) => ipcRenderer.invoke('expenses:delete', id),
    getStats: (filters?: any) => ipcRenderer.invoke('expenses:getStats', filters),
  },

  // API Ordonnances
  prescriptions: {
    getAll: (filters?: any) => ipcRenderer.invoke('prescriptions:getAll', filters),
    getCount: (filters?: any) => ipcRenderer.invoke('prescriptions:getCount', filters),
    getById: (id: number) => ipcRenderer.invoke('prescriptions:getById', id),
    create: (prescriptionData: any) => ipcRenderer.invoke('prescriptions:create', prescriptionData),
    update: (id: number, prescriptionData: any) => ipcRenderer.invoke('prescriptions:update', id, prescriptionData),
    delete: (id: number) => ipcRenderer.invoke('prescriptions:delete', id),
    getByPatientId: (patientId: number) => ipcRenderer.invoke('prescriptions:getByPatientId', patientId),
    print: (id: number) => ipcRenderer.invoke('prescriptions:print', id),
  },

  // API Modèles d'ordonnances
  prescriptionTemplates: {
    getAll: () => ipcRenderer.invoke('prescriptionTemplates:getAll'),
    getById: (id: number) => ipcRenderer.invoke('prescriptionTemplates:getById', id),
    create: (templateData: any) => ipcRenderer.invoke('prescriptionTemplates:create', templateData),
    update: (id: number, templateData: any) => ipcRenderer.invoke('prescriptionTemplates:update', id, templateData),
    delete: (id: number) => ipcRenderer.invoke('prescriptionTemplates:delete', id),
  },

  // API Répertoire des médicaments (Registre National 2025)
  medications: {
    search: (query: string, limit?: number) => ipcRenderer.invoke('medications:search', query, limit),
    getAll: (limit?: number) => ipcRenderer.invoke('medications:getAll', limit),
    add: (data: any) => ipcRenderer.invoke('medications:add', data),
    incrementPopularity: (id: number) => ipcRenderer.invoke('medications:incrementPopularity', id),
  },

  // API Activation
  activation: {
    checkLicenseStatus: () => ipcRenderer.invoke('activation:checkLicenseStatus'),
    activateWithKey: (activationKey: string) => ipcRenderer.invoke('activation:activateWithKey', activationKey),
    getCurrentLicenseInfo: () => ipcRenderer.invoke('activation:getCurrentLicenseInfo'),
    getTrialDaysRemaining: () => ipcRenderer.invoke('activation:getTrialDaysRemaining'),
    resetLicense: () => ipcRenderer.invoke('activation:resetLicense'),
  },

  // API Documents & EDFA
  documents: {
    getByPatient: (patientId: number) => ipcRenderer.invoke('documents:getByPatient', patientId),
    upload: (data: { patientId: number; filePath: string; category?: string; notes?: string }) => ipcRenderer.invoke('documents:upload', data),
    delete: (id: number) => ipcRenderer.invoke('documents:delete', id),
    open: (id: number) => ipcRenderer.invoke('documents:open', id),
    selectAndUpload: (data: { patientId: number; category?: string; notes?: string }) => ipcRenderer.invoke('documents:selectAndUpload', data),
  },

  // API Inventaire / Consommables
  inventory: {
    getAll: () => ipcRenderer.invoke('inventory:getAll'),
    create: (data: any) => ipcRenderer.invoke('inventory:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('inventory:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('inventory:delete', id),
    updateQuantity: (id: number, delta: number) => ipcRenderer.invoke('inventory:updateQuantity', id, delta),
  },

  // API Salle d'attente
  waitingRoom: {
    getTodayQueue: () => ipcRenderer.invoke('waitingRoom:getTodayQueue'),
    addToQueue: (data: any) => ipcRenderer.invoke('waitingRoom:addToQueue', data),
    updateStatus: (id: number, status: string) => ipcRenderer.invoke('waitingRoom:updateStatus', id, status),
    updateEntry: (id: number, data: any) => ipcRenderer.invoke('waitingRoom:updateEntry', id, data),
    removeFromQueue: (id: number) => ipcRenderer.invoke('waitingRoom:removeFromQueue', id),
    openDisplayWindow: () => ipcRenderer.invoke('waitingRoom:openDisplayWindow'),
    callNextPatient: () => ipcRenderer.invoke('waitingRoom:callNextPatient'),
    onCallNext: (callback: (data: any) => void) => {
      const listener = (_: any, data: any) => callback(data);
      ipcRenderer.on('waitingRoom:calledNext', listener);
      return () => ipcRenderer.removeListener('waitingRoom:calledNext', listener);
    },
    onQueueUpdated: (callback: (queue: any) => void) => {
      const listener = (_: any, queue: any) => callback(queue);
      ipcRenderer.on('waitingRoom:queueUpdated', listener);
      return () => ipcRenderer.removeListener('waitingRoom:queueUpdated', listener);
    },
  },

  // API Réseau local
  network: {
    startServer: () => ipcRenderer.invoke('network:startServer'),
    stopServer: () => ipcRenderer.invoke('network:stopServer'),
    getLocalIP: () => ipcRenderer.invoke('network:getLocalIP'),
    isRunning: () => ipcRenderer.invoke('network:isRunning'),
    getToken: () => ipcRenderer.invoke('network:getToken'),
  },

  // Indicateur de mode développement
  isDev: process.env.NODE_ENV === 'development',
};

// Exposition de l'API dans le contexte global
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Types pour TypeScript
export type ElectronAPI = typeof electronAPI;
