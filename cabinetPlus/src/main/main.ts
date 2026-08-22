import { app, BrowserWindow, Menu, shell, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { isDev } from './utils';
import { DatabaseService } from './database/DatabaseService';
import { SettingsService } from './database/SettingsService';
import { PatientService } from './database/PatientService';
import { AppointmentService } from './database/AppointmentService';
import { ConsultationService } from './database/ConsultationService';
import { PaymentService } from './database/PaymentService';
import { ExpenseService } from './database/ExpenseService';
import { AuthService } from './database/AuthService';
import { ActivityLogService } from './database/ActivityLogService';
import { PrescriptionService } from './database/PrescriptionService';
import { PrescriptionTemplateService } from './database/PrescriptionTemplateService';
import { ActivationService } from './database/ActivationService';
import { MedicationService } from './database/MedicationService';
import { DocumentService } from './database/DocumentService';
import { InventoryService } from './database/InventoryService';
import { WaitingRoomService } from './database/WaitingRoomService';
import { NetworkService } from './network/NetworkService';

// Garde une référence globale de l'objet window
let mainWindow: BrowserWindow | null = null;
let displayWindow: BrowserWindow | null = null;

// Services de base de données
let startupError: Error | null = null;
let databaseService: DatabaseService;
let settingsService: SettingsService;
let patientService: PatientService;
let appointmentService: AppointmentService;
let consultationService: ConsultationService;
let paymentService: PaymentService;
let expenseService: ExpenseService;
let authService: AuthService;
let activityLogService: ActivityLogService;
let prescriptionService: PrescriptionService;
let prescriptionTemplateService: PrescriptionTemplateService;
let activationService: ActivationService;
let medicationService: MedicationService;
let documentService: DocumentService;
let inventoryService: InventoryService;
let waitingRoomService: WaitingRoomService;
let networkService: NetworkService;

const createWindow = (): void => {
  // Créer la fenêtre du navigateur
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    show: true, // Afficher immédiatement
    autoHideMenuBar: true, // Masquer complètement la barre de menu système
    icon: fs.existsSync(path.join(__dirname, '../../public/icon.ico'))
      ? path.join(__dirname, '../../public/icon.ico')
      : path.join(__dirname, '../../public/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../preload/preload.cjs'),
      webSecurity: true,
      // Améliorations pour la réactivité des champs de texte
      spellcheck: false, // Désactiver la vérification orthographique qui peut causer des blocages
      backgroundThrottling: false, // Empêcher la limitation en arrière-plan
    },
    titleBarStyle: 'default',
    // Améliorations pour la gestion du focus
    acceptFirstMouse: true,
    skipTaskbar: false,
    resizable: true,
  });

  // Supprimer définitivement le menu système supérieur (Fichier, Affichage, Aide...)
  mainWindow.setMenu(null);
  mainWindow.removeMenu();

  // Charger l'application
  const indexPath = path.join(__dirname, '../renderer/index.html');
  if (fs.existsSync(indexPath)) {
    mainWindow.loadFile(indexPath).catch(err => {
      console.error('Failed to load file:', err);
    });
  } else {
    mainWindow.loadURL('http://localhost:5173').catch(err => {
      console.error('Failed to load URL:', err);
    });
  }

  // Ouvrir les DevTools uniquement en développement
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.show();
  mainWindow.focus();

  // Écouter les erreurs de chargement
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('Failed to load:', errorCode, errorDescription, validatedURL);
  });

  // Forcer le focus sur la fenêtre au démarrage
  mainWindow.once('ready-to-show', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
      // Forcer le focus sur le contenu web
      mainWindow.webContents.focus();
    }
  });

  // Gérer les événements de focus pour maintenir la réactivité
  mainWindow.on('focus', () => {
    if (mainWindow) {
      mainWindow.webContents.focus();
    }
  });

  // Gérer les changements de visibilité
  mainWindow.on('show', () => {
    if (mainWindow) {
      mainWindow.webContents.focus();
    }
  });

  // Forcer le rafraîchissement lors du redimensionnement pour éviter les blocages
  let resizeTimeout: NodeJS.Timeout;
  mainWindow.on('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        // Forcer un léger rafraîchissement du rendu
        mainWindow.webContents.invalidate();
      }
    }, 100);
  });

  // Gérer la fermeture de la fenêtre
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Ouvrir les liens externes dans le navigateur par défaut
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Empêcher la navigation vers des sites externes
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);

    if (parsedUrl.origin !== 'http://localhost:5173' && !navigationUrl.startsWith('file://')) {
      event.preventDefault();
    }
  });
};

// Sauvegarde automatique de la base de données
const AUTO_BACKUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24h
let autoBackupTimer: NodeJS.Timeout | null = null;

const runAutoBackupIfDue = async (svc: SettingsService) => {
  try {
    const backups = await svc.getAutoBackups();
    const last = backups[0]; // déjà trié du plus récent au plus ancien
    const lastAgeMs = last ? Date.now() - new Date(last.created_at).getTime() : Infinity;
    if (lastAgeMs >= AUTO_BACKUP_INTERVAL_MS) {
      console.log('💾 Sauvegarde automatique en cours...');
      await svc.createAutoBackup();
      svc.cleanupOldBackups();
      console.log('✅ Sauvegarde automatique terminée');
    }
  } catch (error) {
    console.error('❌ Échec de la sauvegarde automatique:', error);
  }
};

const scheduleAutoBackups = (svc: SettingsService) => {
  runAutoBackupIfDue(svc);
  autoBackupTimer = setInterval(() => runAutoBackupIfDue(svc), AUTO_BACKUP_INTERVAL_MS);
};

// Cette méthode sera appelée quand Electron aura fini de s'initialiser
app.whenReady().then(async () => {
  // Initialiser la base de données en premier
  try {
    console.log('🔧 Initialisation de la base de données...');
    databaseService = new DatabaseService();
    databaseService.initialize();
    console.log('✅ Base de données initialisée avec succès');

    // Initialiser tous les services de base en premier
    console.log('🔧 Initialisation des services de base...');
    settingsService = new SettingsService(databaseService);
    patientService = new PatientService(databaseService);
    appointmentService = new AppointmentService(databaseService);
    consultationService = new ConsultationService(databaseService);
    paymentService = new PaymentService(databaseService);
    expenseService = new ExpenseService(databaseService);
    authService = new AuthService(databaseService);
    activityLogService = new ActivityLogService(databaseService);
    prescriptionService = new PrescriptionService(databaseService);
    prescriptionTemplateService = new PrescriptionTemplateService(databaseService);
    documentService = new DocumentService(databaseService);
    inventoryService = new InventoryService(databaseService);

    // Initialiser le compte admin par défaut si nécessaire
    console.log('👤 Vérification/Initialisation du compte administrateur...');
    authService.initializeDefaultAdmin();

    // Initialiser les paramètres manquants
    console.log('⚙️ Initialisation des paramètres...');
    settingsService.initializeMissingSettings();

    // Planifier la sauvegarde automatique de la base de données
    scheduleAutoBackups(settingsService);

    // MAINTENANT initialiser le service d'activation après que tout soit prêt
    console.log('🔐 Initialisation du service d\'activation...');
    activationService = new ActivationService(databaseService);

    // Initialiser le répertoire des médicaments
    console.log('💊 Initialisation du dictionnaire de médicaments...');
    medicationService = MedicationService.getInstance(databaseService);

    console.log('🛋️ Initialisation de la salle d\'attente...');
    waitingRoomService = new WaitingRoomService(databaseService);

    // Initialiser le service réseau
    console.log('🌐 Initialisation du service réseau...');
    networkService = new NetworkService(
      patientService,
      appointmentService,
      consultationService,
      settingsService,
      authService,
      prescriptionService,
      paymentService,
      waitingRoomService
    );

  } catch (error) {
    startupError = error instanceof Error ? error : new Error(String(error));
    console.error('❌ Erreur lors de l\'initialisation de la base de données:', error);
    console.error('🔧 L\'application va démarrer en mode dégradé');
    // Même en cas d'erreur, créer la fenêtre pour permettre à l'utilisateur de voir l'erreur
  }

  createWindow();

  // En mode dégradé, tous les services restent `undefined` : chaque appel IPC
  // échoue et l'interface se retrouve vide sans explication. On affiche donc
  // explicitement la cause plutôt que de laisser l'utilisateur face à des
  // compteurs à zéro.
  if (startupError) {
    const isAbiMismatch = /NODE_MODULE_VERSION|different Node\.js version|better_sqlite3\.node/i
      .test(startupError.message);

    const cause = isAbiMismatch
      ? "Cause : le module natif better-sqlite3 est compilé pour Node et non pour Electron.\nCorrectif : fermez l'application, lancez « npm run electron:rebuild », puis relancez-la."
      : 'Détail technique :';

    dialog.showErrorBox(
      'MugiDoc — base de données indisponible',
      [
        "L'application a démarré en mode dégradé : la base de données n'a pas pu être ouverte.",
        "Aucune donnée ne sera affichée ni enregistrée tant que le problème persiste.",
        '',
        cause,
        '',
        startupError.message
      ].join('\n')
    );
  }

  // Supprimer définitivement la barre de menu système d'Electron
  Menu.setApplicationMenu(null);

  app.on('activate', () => {
    // Sur macOS, il est courant de recréer une fenêtre quand l'icône du dock est cliquée
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quitter quand toutes les fenêtres sont fermées
app.on('window-all-closed', () => {
  // Arrêter la sauvegarde automatique planifiée
  if (autoBackupTimer) {
    clearInterval(autoBackupTimer);
  }

  // Fermer la base de données avant de quitter
  if (databaseService) {
    databaseService.close();
  }

  // Sur macOS, il est courant que les applications restent actives jusqu'à ce que l'utilisateur quitte explicitement
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Fonction pour créer le menu de l'application
const createMenu = (): void => {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'Fichier',
      submenu: [
        {
          label: 'Nouveau Patient',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu-action', 'new-patient');
            }
          }
        },
        {
          label: 'Nouveau Rendez-vous',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu-action', 'new-appointment');
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Quitter',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Édition',
      submenu: [
        { role: 'undo', label: 'Annuler' },
        { role: 'redo', label: 'Rétablir' },
        { type: 'separator' },
        { role: 'cut', label: 'Couper' },
        { role: 'copy', label: 'Copier' },
        { role: 'paste', label: 'Coller' },
        { role: 'selectAll', label: 'Tout sélectionner' }
      ]
    },
    {
      label: 'Affichage',
      submenu: [
        { role: 'reload', label: 'Actualiser' },
        { role: 'forceReload', label: 'Actualiser (forcé)' },
        { role: 'toggleDevTools', label: 'Outils de développement' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Zoom normal' },
        { role: 'zoomIn', label: 'Zoom avant' },
        { role: 'zoomOut', label: 'Zoom arrière' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Plein écran' }
      ]
    },
    {
      label: 'Fenêtre',
      submenu: [
        { role: 'minimize', label: 'Réduire' },
        { role: 'close', label: 'Fermer' }
      ]
    },
    {
      label: 'Aide',
      submenu: [
        {
          label: 'À propos de cabinetplus',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu-action', 'about');
            }
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
};

// Gestion des événements IPC
ipcMain.handle('app-version', () => {
  return app.getVersion();
});

ipcMain.handle('platform', () => {
  return process.platform;
});

// IPC Réseau local
ipcMain.handle('network:startServer', async () => {
  if (!networkService) throw new Error('Service réseau non initialisé');
  return await networkService.start();
});

ipcMain.handle('network:stopServer', () => {
  if (!networkService) throw new Error('Service réseau non initialisé');
  networkService.stop();
  return true;
});

ipcMain.handle('network:getLocalIP', () => {
  if (!networkService) return '127.0.0.1';
  return networkService.getLocalIP();
});

ipcMain.handle('network:isRunning', () => {
  if (!networkService) return false;
  return networkService.isServerRunning();
});

ipcMain.handle('network:getToken', () => {
  if (!networkService) throw new Error('Service réseau non initialisé');
  return networkService.getToken();
});

// Helper pour diffuser les mises à jour de la salle d'attente à la fenêtre principale et à l'écran TV
const broadcastWaitingRoomUpdate = (calledPatient?: any) => {
  if (!waitingRoomService) return;
  try {
    const queue = waitingRoomService.getTodayQueue();
    if (displayWindow && !displayWindow.isDestroyed()) {
      displayWindow.webContents.send('waitingRoom:queueUpdated', queue);
      if (calledPatient) {
        displayWindow.webContents.send('waitingRoom:calledNext', { patient: calledPatient, queue });
      }
    }
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('waitingRoom:queueUpdated', queue);
      if (calledPatient) {
        mainWindow.webContents.send('waitingRoom:calledNext', { patient: calledPatient, queue });
      }
    }
  } catch (err) {
    console.error('Erreur diffusion mise à jour salle d\'attente:', err);
  }
};

// IPC Salle d'attente
ipcMain.handle('waitingRoom:getTodayQueue', () => {
  return waitingRoomService.getTodayQueue();
});
ipcMain.handle('waitingRoom:addToQueue', (_, data) => {
  const result = waitingRoomService.addToQueue(data);
  broadcastWaitingRoomUpdate();
  return result;
});
ipcMain.handle('waitingRoom:updateStatus', (_, id, status) => {
  const result = waitingRoomService.updateStatus(id, status);
  broadcastWaitingRoomUpdate(status === 'en_consultation' ? result : undefined);
  return result;
});
ipcMain.handle('waitingRoom:updateEntry', (_, id, data) => {
  const result = waitingRoomService.updateEntry(id, data);
  broadcastWaitingRoomUpdate();
  return result;
});
ipcMain.handle('waitingRoom:removeFromQueue', (_, id) => {
  waitingRoomService.removeFromQueue(id);
  broadcastWaitingRoomUpdate();
  return { success: true };
});

// IPC pour les paramètres
ipcMain.handle('settings:getAll', () => {
  return settingsService.getAllSettings();
});

ipcMain.handle('settings:getByCategory', (_, category: string) => {
  return settingsService.getSettingsByCategory(category);
});

ipcMain.handle('settings:get', (_, key: string) => {
  return settingsService.getSetting(key);
});

ipcMain.handle('settings:update', (_, key: string, value: string) => {
  return settingsService.updateSetting(key, value);
});

ipcMain.handle('settings:create', (_, key: string, value: string, category: string, description?: string) => {
  return settingsService.createSetting(key, value, category, description);
});

ipcMain.handle('settings:delete', (_, key: string) => {
  return settingsService.deleteSetting(key);
});

// IPC pour la gestion du logo du cabinet
ipcMain.handle('settings:uploadLogo', async (_, logoData) => {
  return await settingsService.uploadLogo(logoData);
});

ipcMain.handle('settings:getLogo', () => {
  return settingsService.getLogo();
});

ipcMain.handle('settings:deleteLogo', () => {
  return settingsService.deleteLogo();
});

ipcMain.handle('auth:login', async (_, loginData) => {
  if (!authService) throw new Error('Service d\'authentification non disponible');
  const user = authService.authenticateUser(loginData);
  if (user && activityLogService) {
    activityLogService.logActivity(user.id, 'Connexion', 'Authentification', `Connexion réussie (Rôle: ${user.role})`);
  }
  return user;
});

ipcMain.handle('auth:getUserById', (_, id: number) => {
  if (!authService) return null;
  return authService.getUserById(id);
});

ipcMain.handle('auth:getAllUsers', () => {
  if (!authService) return [];
  return authService.getAllUsers();
});

ipcMain.handle('auth:createUser', (_, userData) => {
  if (!authService) throw new Error('Service d\'authentification non disponible');
  const newUser = authService.createUser(userData);
  if (activityLogService) {
    activityLogService.logActivity(null, 'Création utilisateur', 'Utilisateurs', `Création du compte ${newUser.username} (${newUser.role})`);
  }
  return newUser;
});

ipcMain.handle('auth:updateUser', (_, userId: number, userData) => {
  if (!authService) throw new Error('Service d\'authentification non disponible');
  const updated = authService.updateUser(userId, userData);
  if (activityLogService) {
    activityLogService.logActivity(userId, 'Mise à jour utilisateur', 'Utilisateurs', `Mise à jour du compte ID #${userId}`);
  }
  return updated;
});

ipcMain.handle('auth:deleteUser', (_, userId: number) => {
  if (!authService) throw new Error('Service d\'authentification non disponible');
  authService.deleteUser(userId);
  if (activityLogService) {
    activityLogService.logActivity(null, 'Suppression utilisateur', 'Utilisateurs', `Suppression du compte ID #${userId}`);
  }
});

ipcMain.handle('auth:toggleUserActive', (_, userId: number) => {
  if (!authService) throw new Error('Service d\'authentification non disponible');
  authService.toggleUserActive(userId);
  if (activityLogService) {
    activityLogService.logActivity(null, 'Statut utilisateur', 'Utilisateurs', `Changement du statut (actif/inactif) pour ID #${userId}`);
  }
});

ipcMain.handle('auth:resetPassword', (_, userId: number, newPassword: string) => {
  if (!authService) throw new Error('Service d\'authentification non disponible');
  authService.resetPassword(userId, newPassword);
  if (activityLogService) {
    activityLogService.logActivity(null, 'Réinitialisation mot de passe', 'Utilisateurs', `Réinitialisation du mot de passe de l'utilisateur ID #${userId}`);
  }
});

ipcMain.handle('auth:changePassword', (_, userId: number, passwordData) => {
  if (!authService) throw new Error('Service d\'authentification non disponible');
  authService.changePassword(userId, passwordData);
  if (activityLogService) {
    activityLogService.logActivity(userId, 'Changement mot de passe', 'Authentification', 'Modification du mot de passe');
  }
});

ipcMain.handle('auth:changeCredentials', (_, userId: number, credentialsData) => {
  if (!authService) throw new Error('Service d\'authentification non disponible');
  authService.changeCredentials(userId, credentialsData);
  if (activityLogService) {
    activityLogService.logActivity(userId, 'Changement identifiants', 'Authentification', 'Modification du profil/identifiants');
  }
});

// IPC pour le journal d'activité (logs)
ipcMain.handle('logs:getAll', (_, filters) => {
  if (!activityLogService) return [];
  return activityLogService.getAllLogs(filters);
});

ipcMain.handle('logs:create', (_, action: string, resource: string, details?: string) => {
  if (activityLogService) {
    activityLogService.logActivity(null, action, resource, details);
  }
});

// IPC pour les sauvegardes
ipcMain.handle('backup:create', async (_, customPath?: string) => {
  return await settingsService.createBackup(customPath);
});

ipcMain.handle('backup:restore', async (_, backupPath?: string) => {
  return await settingsService.restoreBackup(backupPath);
});

ipcMain.handle('backup:getAutoBackups', () => {
  return settingsService.getAutoBackups();
});

ipcMain.handle('backup:createAuto', async () => {
  return await settingsService.createAutoBackup();
});

ipcMain.handle('database:getStats', () => {
  return settingsService.getDatabaseStats();
});

// IPC pour les patients
ipcMain.handle('patients:getAll', (_, filters) => {
  return patientService.getAllPatients(filters);
});

ipcMain.handle('patients:getCount', (_, filters) => {
  return patientService.getPatientsCount(filters);
});

ipcMain.handle('patients:getById', (_, id: number) => {
  return patientService.getPatientById(id);
});

ipcMain.handle('patients:create', (_, patientData) => {
  return patientService.createPatient(patientData);
});

ipcMain.handle('patients:update', (_, id: number, patientData) => {
  return patientService.updatePatient(id, patientData);
});

ipcMain.handle('patients:delete', (_, id: number, transferPayments?: boolean) => {
  return patientService.deletePatient(id, transferPayments);
});

ipcMain.handle('patients:search', (_, query: string) => {
  return patientService.searchPatients(query);
});

ipcMain.handle('patients:getStats', (event, filters) => {
  return patientService.getPatientStats(filters);
});

// IPC pour les rendez-vous
ipcMain.handle('appointments:getAll', (_, filters) => {
  return appointmentService.getAllAppointments(filters);
});

ipcMain.handle('appointments:getCount', (_, filters) => {
  return appointmentService.getAppointmentsCount(filters);
});

ipcMain.handle('appointments:getById', (_, id: number) => {
  return appointmentService.getAppointmentById(id);
});

ipcMain.handle('appointments:create', (_, appointmentData) => {
  return appointmentService.createAppointment(appointmentData);
});

ipcMain.handle('appointments:update', (_, id: number, appointmentData) => {
  return appointmentService.updateAppointment(id, appointmentData);
});

ipcMain.handle('appointments:delete', (_, id: number) => {
  return appointmentService.deleteAppointment(id);
});

ipcMain.handle('appointments:getByPatient', (_, patientId: number) => {
  return appointmentService.getAppointmentsByPatient(patientId);
});

ipcMain.handle('appointments:getByDate', (_, date: string) => {
  return appointmentService.getAppointmentsByDate(date);
});

ipcMain.handle('appointments:getStats', () => {
  return appointmentService.getAppointmentStats();
});

// IPC pour les consultations
ipcMain.handle('consultations:getAll', (_, filters) => {
  return consultationService.getAllConsultations(filters);
});

ipcMain.handle('consultations:getCount', (_, filters) => {
  return consultationService.getConsultationsCount(filters);
});

ipcMain.handle('consultations:getById', (_, id: number) => {
  return consultationService.getConsultationById(id);
});

ipcMain.handle('consultations:create', (_, consultationData) => {
  return consultationService.createConsultation(consultationData);
});

ipcMain.handle('consultations:update', (_, id: number, consultationData) => {
  return consultationService.updateConsultation(id, consultationData);
});

ipcMain.handle('consultations:delete', (_, id: number) => {
  return consultationService.deleteConsultation(id);
});

ipcMain.handle('consultations:getByPatient', (_, patientId: number) => {
  return consultationService.getConsultationsByPatient(patientId);
});

ipcMain.handle('consultations:getByAppointment', (_, appointmentId: number) => {
  return consultationService.getConsultationsByAppointment(appointmentId);
});

ipcMain.handle('consultations:getStats', () => {
  return consultationService.getConsultationStats();
});

// IPC pour les paiements
ipcMain.handle('payments:getAll', (_, filters) => {
  return paymentService.getAllPayments(filters);
});

ipcMain.handle('payments:getCount', (_, filters) => {
  return paymentService.getPaymentsCount(filters);
});

ipcMain.handle('payments:getById', (_, id: number) => {
  return paymentService.getPaymentById(id);
});

ipcMain.handle('payments:create', (_, paymentData) => {
  return paymentService.createPayment(paymentData);
});

ipcMain.handle('payments:update', (_, id: number, paymentData) => {
  return paymentService.updatePayment(id, paymentData);
});

ipcMain.handle('payments:delete', (_, id: number) => {
  return paymentService.deletePayment(id);
});

ipcMain.handle('payments:getByPatient', (_, patientId: number) => {
  return paymentService.getPaymentsByPatient(patientId);
});



ipcMain.handle('payments:getStats', () => {
  return paymentService.getPaymentStats();
});

// IPC pour les frais
ipcMain.handle('expenses:getAll', (_, filters) => {
  return expenseService.getAllExpenses(filters);
});

ipcMain.handle('expenses:getById', (_, id: number) => {
  return expenseService.getExpenseById(id);
});

ipcMain.handle('expenses:create', (_, expenseData) => {
  return expenseService.createExpense(expenseData);
});

ipcMain.handle('expenses:update', (_, id: number, expenseData) => {
  return expenseService.updateExpense(id, expenseData);
});

ipcMain.handle('expenses:delete', (_, id: number) => {
  return expenseService.deleteExpense(id);
});

ipcMain.handle('expenses:getStats', (_, filters) => {
  return expenseService.getExpenseStats(filters);
});

// IPC pour les ordonnances
ipcMain.handle('prescriptions:getAll', (_, filters) => {
  return prescriptionService.getAllPrescriptions(filters);
});

ipcMain.handle('prescriptions:getCount', (_, filters) => {
  return prescriptionService.getPrescriptionsCount(filters);
});

ipcMain.handle('prescriptions:getById', (_, id: number) => {
  return prescriptionService.getPrescriptionById(id);
});

ipcMain.handle('prescriptions:create', (_, prescriptionData) => {
  return prescriptionService.createPrescription(prescriptionData);
});

ipcMain.handle('prescriptions:update', (_, id: number, prescriptionData) => {
  return prescriptionService.updatePrescription(id, prescriptionData);
});

ipcMain.handle('prescriptions:delete', (_, id: number) => {
  return prescriptionService.deletePrescription(id);
});

ipcMain.handle('prescriptions:getByPatientId', (_, patientId: number) => {
  return prescriptionService.getPrescriptionsByPatientId(patientId);
});

ipcMain.handle('prescriptions:print', (_, id: number) => {
  // TODO: Implémenter la fonctionnalité d'impression
  return Promise.resolve();
});

// IPC pour le dictionnaire de médicaments
ipcMain.handle('medications:search', (_, query: string, limit?: number) => {
  if (!medicationService) return [];
  return medicationService.searchMedications(query, limit);
});

ipcMain.handle('medications:getAll', (_, limit?: number) => {
  if (!medicationService) return [];
  return medicationService.getAllMedications(limit);
});

ipcMain.handle('medications:add', (_, data) => {
  if (!medicationService) return null;
  return medicationService.addMedication(data);
});

ipcMain.handle('medications:incrementPopularity', (_, id: number) => {
  if (medicationService) {
    medicationService.incrementPopularity(id);
  }
});

// IPC pour les modèles d'ordonnances
ipcMain.handle('prescriptionTemplates:getAll', () => {
  return prescriptionTemplateService.getAllTemplates();
});

ipcMain.handle('prescriptionTemplates:getById', (_, id: number) => {
  return prescriptionTemplateService.getTemplateById(id);
});

ipcMain.handle('prescriptionTemplates:create', (_, templateData) => {
  return prescriptionTemplateService.createTemplate(templateData);
});

ipcMain.handle('prescriptionTemplates:update', (_, id: number, templateData) => {
  return prescriptionTemplateService.updateTemplate(id, templateData);
});

ipcMain.handle('prescriptionTemplates:delete', (_, id: number) => {
  return prescriptionTemplateService.deleteTemplate(id);
});

// IPC pour l'activation - Simplifié (application libre)
ipcMain.handle('activation:checkLicenseStatus', async () => {
  if (!activationService) {
    return {
      isValid: true,
      licenseInfo: {
        isActivated: false,
        status: 'trial',
        trialStartDate: new Date().toISOString(),
        trialEndDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        macAddress: 'unknown'
      },
      message: 'Période d\'essai de 15 jours démarrée (mode dégradé)'
    };
  }
  return await activationService.checkLicenseStatus();
});

ipcMain.handle('activation:activateWithKey', async (_, activationKey: string) => {
  if (!activationService) {
    return {
      success: false,
      message: 'Service d\'activation non disponible'
    };
  }
  return await activationService.activateWithKey(activationKey);
});

ipcMain.handle('activation:getCurrentLicenseInfo', () => {
  if (!activationService) {
    return {
      isActivated: false,
      status: 'trial',
      trialStartDate: new Date().toISOString(),
      trialEndDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      macAddress: 'unknown'
    };
  }
  return activationService.getCurrentLicenseInfo();
});

ipcMain.handle('activation:getTrialDaysRemaining', () => {
  if (!activationService) {
    return 15; // Retourner 15 jours par défaut en mode dégradé
  }
  return activationService.getTrialDaysRemaining();
});

ipcMain.handle('activation:resetLicense', () => {
  if (!activationService) {
    return;
  }
  return activationService.resetLicense();
});

// Document Handlers (EDFA / Imagerie)
ipcMain.handle('documents:getByPatient', (_, patientId: number) => {
  if (!documentService) return [];
  return documentService.getDocumentsByPatient(patientId);
});

ipcMain.handle('documents:upload', (_, data: { patientId: number; filePath: string; category?: string; notes?: string }) => {
  if (!documentService) throw new Error('Service de documents indisponible');
  return documentService.uploadDocument(data);
});

ipcMain.handle('documents:delete', (_, id: number) => {
  if (!documentService) throw new Error('Service de documents indisponible');
  return documentService.deleteDocument(id);
});

ipcMain.handle('documents:open', (_, id: number) => {
  if (!documentService) throw new Error('Service de documents indisponible');
  return documentService.openDocument(id);
});

ipcMain.handle('documents:selectAndUpload', async (_, data: { patientId: number; category?: string; notes?: string }) => {
  if (!documentService) throw new Error('Service de documents indisponible');
  const result = await dialog.showOpenDialog({
    title: 'Sélectionner une pièce jointe / imagerie',
    properties: ['openFile'],
    filters: [
      { name: 'Tous les fichiers supportés', extensions: ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'doc', 'docx'] },
      { name: 'Images & Radiographies', extensions: ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'] },
      { name: 'Documents PDF', extensions: ['pdf'] }
    ]
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const filePath = result.filePaths[0];
    return await documentService.uploadDocument({
      patientId: data.patientId,
      filePath,
      category: data.category,
      notes: data.notes
    });
  }
  return null;
});

// Inventory / Stock Handlers
ipcMain.handle('inventory:getAll', () => {
  if (!inventoryService) return [];
  return inventoryService.getAllItems();
});

ipcMain.handle('inventory:create', (_, data) => {
  if (!inventoryService) throw new Error('Service inventaire indisponible');
  return inventoryService.createItem(data);
});

ipcMain.handle('inventory:update', (_, id: number, data) => {
  if (!inventoryService) throw new Error('Service inventaire indisponible');
  return inventoryService.updateItem(id, data);
});

ipcMain.handle('inventory:delete', (_, id: number) => {
  if (!inventoryService) throw new Error('Service inventaire indisponible');
  return inventoryService.deleteItem(id);
});

ipcMain.handle('inventory:updateQuantity', (_, id: number, delta: number) => {
  if (!inventoryService) throw new Error('Service inventaire indisponible');
  return inventoryService.updateQuantity(id, delta);
});

// ── Fenêtre Système Indépendante pour Écran TV Salle d'Attente ──
const createWaitingRoomDisplayWindow = (): void => {
  if (displayWindow && !displayWindow.isDestroyed()) {
    displayWindow.show();
    displayWindow.focus();
    return;
  }

  displayWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 900,
    minHeight: 600,
    show: true, // Forcer l'affichage immédiat de la fenêtre
    title: "Écran Salle d'Attente - MugiDoc TV",
    autoHideMenuBar: true,
    icon: fs.existsSync(path.join(__dirname, '../../public/icon.ico'))
      ? path.join(__dirname, '../../public/icon.ico')
      : path.join(__dirname, '../../public/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../preload/preload.cjs'),
      webSecurity: false, // autoriser les chargements locaux pour la seconde fenêtre
      backgroundThrottling: false,
      autoplayPolicy: 'no-user-gesture-required',
    }
  });

  displayWindow.setMenu(null);
  displayWindow.removeMenu();

  const indexPath = path.join(__dirname, '../renderer/index.html');
  if (fs.existsSync(indexPath)) {
    displayWindow.loadFile(indexPath, { hash: 'display' }).catch(err => {
      console.error('Failed to load display window file:', err);
    });
  } else {
    displayWindow.loadURL('http://localhost:5173/#/display').catch(err => {
      console.error('Failed to load display window URL:', err);
    });
  }

  displayWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('Display window failed to load:', errorCode, errorDescription, validatedURL);
  });

  displayWindow.once('ready-to-show', () => {
    if (displayWindow && !displayWindow.isDestroyed()) {
      displayWindow.show();
      displayWindow.focus();
    }
  });

  displayWindow.on('closed', () => {
    displayWindow = null;
  });
};

// Handlers Salle d'Attente & Appels
ipcMain.handle('waitingRoom:openDisplayWindow', () => {
  createWaitingRoomDisplayWindow();
});

ipcMain.handle('waitingRoom:callNextPatient', async () => {
  if (!waitingRoomService) return null;
  const queue = waitingRoomService.getTodayQueue();
  const nextPatient = queue.find((q: any) => q.status === 'en_attente');
  if (nextPatient) {
    const updated = waitingRoomService.updateStatus(nextPatient.id, 'en_consultation');
    broadcastWaitingRoomUpdate(updated);
    return updated;
  }
  return null;
});
