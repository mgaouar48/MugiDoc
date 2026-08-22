import { DatabaseService } from './DatabaseService';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { app, dialog } from 'electron';
import { CabinetLogo, LogoUploadRequest } from '../../shared/types';

export interface Setting {
  id: number;
  key: string;
  value: string;
  category: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface BackupInfo {
  filename: string;
  path: string;
  size: number;
  created_at: string;
}

export class SettingsService {
  private dbService: DatabaseService;

  constructor(dbService: DatabaseService) {
    this.dbService = dbService;
  }

  /**
   * Récupère tous les paramètres
   */
  public getAllSettings(): Setting[] {
    const db = this.dbService.getDatabase();
    return db.prepare('SELECT * FROM settings ORDER BY category, key').all() as Setting[];
  }

  /**
   * Récupère les paramètres par catégorie
   */
  public getSettingsByCategory(category: string): Setting[] {
    const db = this.dbService.getDatabase();
    return db.prepare('SELECT * FROM settings WHERE category = ? ORDER BY key').all(category) as Setting[];
  }

  /**
   * Récupère un paramètre par sa clé
   */
  public getSetting(key: string): Setting | null {
    const db = this.dbService.getDatabase();
    return db.prepare('SELECT * FROM settings WHERE key = ?').get(key) as Setting | null;
  }

  /**
   * Met à jour un paramètre
   */
  public updateSetting(key: string, value: string): void {
    const db = this.dbService.getDatabase();
    const stmt = db.prepare(`
      UPDATE settings 
      SET value = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE key = ?
    `);
    
    const result = stmt.run(value, key);
    
    if (result.changes === 0) {
      throw new Error(`Paramètre '${key}' introuvable`);
    }
  }

  /**
   * Crée un nouveau paramètre
   */
  public createSetting(key: string, value: string, category: string, description?: string): void {
    const db = this.dbService.getDatabase();
    const stmt = db.prepare(`
      INSERT INTO settings (key, value, category, description)
      VALUES (?, ?, ?, ?)
    `);

    stmt.run(key, value, category, description);
  }

  /**
   * Crée un paramètre s'il n'existe pas déjà
   */
  public createSettingIfNotExists(key: string, value: string, category: string, description?: string): void {
    const existing = this.getSetting(key);
    if (!existing) {
      this.createSetting(key, value, category, description);
    }
  }

  /**
   * Récupère le token d'authentification du serveur réseau local,
   * en le générant une seule fois par installation s'il n'existe pas encore
   */
  public getOrCreateNetworkToken(): string {
    this.createSettingIfNotExists(
      'network_auth_token',
      crypto.randomBytes(24).toString('hex'),
      'network',
      "Jeton d'authentification unique pour le serveur réseau local"
    );
    return this.getSetting('network_auth_token')!.value;
  }

  /**
   * Initialise les paramètres manquants
   */
  public initializeMissingSettings(): void {
    const defaultSettings = [
      // Paramètres du médecin
      { key: 'doctor_first_name', value: '', category: 'profile', description: 'Prénom du médecin' },
      { key: 'doctor_last_name', value: '', category: 'profile', description: 'Nom du médecin' },
      { key: 'doctor_email', value: '', category: 'profile', description: 'Email du médecin' },
      { key: 'doctor_speciality', value: 'Médecine générale', category: 'profile', description: 'Spécialité du médecin' },

      // Paramètres du cabinet
      { key: 'cabinet_name', value: 'Cabinet Médical', category: 'cabinet', description: 'Nom du cabinet' },
      { key: 'cabinet_address', value: '[Adresse du cabinet]', category: 'cabinet', description: 'Adresse du cabinet' },
      { key: 'cabinet_phone', value: '[Téléphone]', category: 'cabinet', description: 'Téléphone du cabinet' },
      { key: 'cabinet_email', value: '[Email]', category: 'cabinet', description: 'Email du cabinet' },

      // Paramètres de consultation
      { key: 'default_consultation_price', value: '25', category: 'consultation', description: 'Prix par défaut d\'une consultation' },
      { key: 'default_consultation_duration', value: '30', category: 'consultation', description: 'Durée par défaut d\'une consultation (minutes)' },

      // Paramètres d'horaires
      { key: 'work_start_time', value: '08:00', category: 'schedule', description: 'Heure de début de travail' },
      { key: 'work_end_time', value: '18:00', category: 'schedule', description: 'Heure de fin de travail' },
      { key: 'lunch_start_time', value: '12:00', category: 'schedule', description: 'Heure de début de pause déjeuner' },
      { key: 'lunch_end_time', value: '14:00', category: 'schedule', description: 'Heure de fin de pause déjeuner' },

      // Paramètres des jours de travail
      { key: 'work_days_monday', value: 'true', category: 'schedule', description: 'Travail le lundi' },
      { key: 'work_days_tuesday', value: 'true', category: 'schedule', description: 'Travail le mardi' },
      { key: 'work_days_wednesday', value: 'true', category: 'schedule', description: 'Travail le mercredi' },
      { key: 'work_days_thursday', value: 'true', category: 'schedule', description: 'Travail le jeudi' },
      { key: 'work_days_friday', value: 'true', category: 'schedule', description: 'Travail le vendredi' },
      { key: 'work_days_saturday', value: 'false', category: 'schedule', description: 'Travail le samedi' },
      { key: 'work_days_sunday', value: 'false', category: 'schedule', description: 'Travail le dimanche' },
    ];

    for (const setting of defaultSettings) {
      this.createSettingIfNotExists(setting.key, setting.value, setting.category, setting.description);
    }
  }

  /**
   * Supprime un paramètre
   */
  public deleteSetting(key: string): void {
    const db = this.dbService.getDatabase();
    const stmt = db.prepare('DELETE FROM settings WHERE key = ?');
    stmt.run(key);
  }

  /**
   * Crée une sauvegarde de la base de données
   */
  public async createBackup(customPath?: string): Promise<BackupInfo> {
    try {
      let backupPath: string;
      
      if (customPath) {
        backupPath = customPath;
      } else {
        // Ouvrir le dialogue de sauvegarde
        const result = await dialog.showSaveDialog({
          title: 'Sauvegarder la base de données',
          defaultPath: `cabinetplus-backup-${new Date().toISOString().split('T')[0]}.db`,
          filters: [
            { name: 'Base de données SQLite', extensions: ['db'] },
            { name: 'Tous les fichiers', extensions: ['*'] }
          ]
        });

        if (result.canceled || !result.filePath) {
          throw new Error('Sauvegarde annulée par l\'utilisateur');
        }

        backupPath = result.filePath;
      }

      // Créer la sauvegarde
      await this.dbService.createBackup(backupPath);
      
      // Obtenir les informations du fichier
      const stats = await fs.promises.stat(backupPath);
      
      return {
        filename: path.basename(backupPath),
        path: backupPath,
        size: stats.size,
        created_at: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Erreur lors de la création de la sauvegarde:', error);
      throw error;
    }
  }

  /**
   * Restaure une sauvegarde de la base de données
   */
  public async restoreBackup(backupPath?: string): Promise<void> {
    try {
      let restorePath: string;
      
      if (backupPath) {
        restorePath = backupPath;
      } else {
        // Ouvrir le dialogue de restauration
        const result = await dialog.showOpenDialog({
          title: 'Restaurer une sauvegarde',
          filters: [
            { name: 'Base de données SQLite', extensions: ['db'] },
            { name: 'Tous les fichiers', extensions: ['*'] }
          ],
          properties: ['openFile']
        });

        if (result.canceled || result.filePaths.length === 0) {
          throw new Error('Restauration annulée par l\'utilisateur');
        }

        restorePath = result.filePaths[0];
      }

      // Vérifier que le fichier existe
      if (!fs.existsSync(restorePath)) {
        throw new Error('Fichier de sauvegarde introuvable');
      }

      // Restaurer la sauvegarde
      await this.dbService.restoreBackup(restorePath);
      
      
    } catch (error) {
      console.error('❌ Erreur lors de la restauration:', error);
      throw error;
    }
  }

  /**
   * Liste les sauvegardes automatiques dans le dossier de l'application
   */
  public getAutoBackups(): BackupInfo[] {
    try {
      const userDataPath = app.getPath('userData');
      const backupDir = path.join(userDataPath, 'backups');
      
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
        return [];
      }

      const files = fs.readdirSync(backupDir);
      const backups: BackupInfo[] = [];

      for (const file of files) {
        if (file.endsWith('.db')) {
          const filePath = path.join(backupDir, file);
          const stats = fs.statSync(filePath);
          
          backups.push({
            filename: file,
            path: filePath,
            size: stats.size,
            created_at: stats.mtime.toISOString()
          });
        }
      }

      // Trier par date de création (plus récent en premier)
      return backups.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des sauvegardes:', error);
      return [];
    }
  }

  /**
   * Crée une sauvegarde automatique
   */
  public async createAutoBackup(): Promise<BackupInfo> {
    const userDataPath = app.getPath('userData');
    const backupDir = path.join(userDataPath, 'backups');
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `auto-backup-${timestamp}.db`);
    
    return await this.createBackup(backupPath);
  }

  /**
   * Nettoie les anciennes sauvegardes automatiques (garde les 10 plus récentes)
   */
  public cleanupOldBackups(): void {
    try {
      const backups = this.getAutoBackups();
      
      if (backups.length > 10) {
        const toDelete = backups.slice(10);
        
        for (const backup of toDelete) {
          fs.unlinkSync(backup.path);
          console.log(`🗑️ Ancienne sauvegarde supprimée: ${backup.filename}`);
        }
      }
    } catch (error) {
      console.error('❌ Erreur lors du nettoyage des sauvegardes:', error);
    }
  }

  /**
   * Obtient les statistiques de la base de données
   */
  public getDatabaseStats(): any {
    const db = this.dbService.getDatabase();

    const stats = {
      patients: db.prepare('SELECT COUNT(*) as count FROM patients').get() as { count: number },
      appointments: db.prepare('SELECT COUNT(*) as count FROM appointments').get() as { count: number },
      consultations: db.prepare('SELECT COUNT(*) as count FROM consultations').get() as { count: number },
      payments: db.prepare('SELECT COUNT(*) as count FROM payments').get() as { count: number },
      expenses: db.prepare('SELECT COUNT(*) as count FROM expenses').get() as { count: number },
      settings: db.prepare('SELECT COUNT(*) as count FROM settings').get() as { count: number },
      dbSize: this.getDatabaseSize()
    };

    return stats;
  }

  /**
   * Obtient la taille de la base de données
   */
  private getDatabaseSize(): number {
    try {
      const stats = fs.statSync(this.dbService.getDatabasePath());
      return stats.size;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Upload et sauvegarde le logo du cabinet
   */
  public async uploadLogo(logoData: LogoUploadRequest): Promise<CabinetLogo> {
    try {
      // Créer le dossier logos s'il n'existe pas
      const userDataPath = app.getPath('userData');
      const logoDir = path.join(userDataPath, 'logos');
      
      if (!fs.existsSync(logoDir)) {
        fs.mkdirSync(logoDir, { recursive: true });
      }

      // Générer un nom de fichier unique
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const extension = logoData.filename.split('.').pop() || 'png';
      const filename = `cabinet-logo-${timestamp}.${extension}`;
      const logoPath = path.join(logoDir, filename);

      // Décoder et sauvegarder l'image
      const imageData = logoData.data.replace(/^data:image\/[a-z]+;base64,/, '');
      const buffer = Buffer.from(imageData, 'base64');
      fs.writeFileSync(logoPath, buffer);

      // Obtenir les informations du fichier
      const stats = fs.statSync(logoPath);
      
      const logoInfo: CabinetLogo = {
        filename,
        path: logoPath,
        size: stats.size,
        mimeType: logoData.mimeType,
        uploadedAt: new Date().toISOString()
      };

      // Sauvegarder le chemin dans les paramètres
      this.createSettingIfNotExists('cabinet_logo_path', logoPath, 'cabinet', 'Chemin vers le logo du cabinet');
      this.updateSetting('cabinet_logo_path', logoPath);

      return logoInfo;
    } catch (error) {
      console.error('❌ Erreur lors de l\'upload du logo:', error);
      throw error;
    }
  }

  /**
   * Récupère les informations du logo du cabinet
   */
  public getLogo(): CabinetLogo | null {
    try {
      const logoPathSetting = this.getSetting('cabinet_logo_path');
      
      if (!logoPathSetting || !logoPathSetting.value) {
        return null;
      }

      const logoPath = logoPathSetting.value;
      
      if (!fs.existsSync(logoPath)) {
        // Le fichier n'existe plus, supprimer le paramètre
        this.deleteSetting('cabinet_logo_path');
        return null;
      }

      const stats = fs.statSync(logoPath);
      const filename = path.basename(logoPath);
      
      // Déterminer le type MIME basé sur l'extension
      const extension = filename.split('.').pop()?.toLowerCase();
      let mimeType = 'image/png';
      
      switch (extension) {
        case 'jpg':
        case 'jpeg':
          mimeType = 'image/jpeg';
          break;
        case 'png':
          mimeType = 'image/png';
          break;
        case 'gif':
          mimeType = 'image/gif';
          break;
        case 'webp':
          mimeType = 'image/webp';
          break;
      }

      return {
        filename,
        path: logoPath,
        size: stats.size,
        mimeType,
        uploadedAt: stats.mtime.toISOString()
      };
    } catch (error) {
      console.error('❌ Erreur lors de la récupération du logo:', error);
      return null;
    }
  }

  /**
   * Supprime le logo du cabinet
   */
  public deleteLogo(): void {
    try {
      const logoPathSetting = this.getSetting('cabinet_logo_path');
      
      if (logoPathSetting && logoPathSetting.value) {
        const logoPath = logoPathSetting.value;
        
        // Supprimer le fichier s'il existe
        if (fs.existsSync(logoPath)) {
          fs.unlinkSync(logoPath);
        }
        
        // Supprimer le paramètre
        this.deleteSetting('cabinet_logo_path');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la suppression du logo:', error);
      throw error;
    }
  }
}
