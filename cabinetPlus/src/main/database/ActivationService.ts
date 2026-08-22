import { createClient } from '@supabase/supabase-js';
import * as CryptoJS from 'crypto-js';
import * as os from 'os';
import { DatabaseService } from './DatabaseService';
import { LocalLicenseInfo, LicenseStatusResponse, ActivationResponse } from '../../shared/types';

export interface ActivationKey {
  id: string;
  key_code: string;
  client_name?: string;
  client_phone?: string;
  mac_address?: string;
  is_used: boolean;
  is_active: boolean;
  created_at: string;
  activated_at?: string;
  expires_at?: string;
  notes?: string;
}

export interface LicenseValidation {
  id: string;
  activation_key_id?: string;
  mac_address: string;
  validation_type: 'activation' | 'check' | 'trial_start';
  success: boolean;
  error_message?: string;
  app_version?: string;
  created_at: string;
}

/**
 * Service d'activation avec période d'essai de 15 jours
 */
export class ActivationService {
  private supabase;
  private encryptionKey = 'MediMemo-Cabinet-2024-Secure-Key-v1.0';
  
  constructor(private db: DatabaseService) {
    this.supabase = createClient(
      'https://uvdbnvmvxucldrbkafsx.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2ZGJudm12eHVjbGRyYmthZnN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyNTYwNDQsImV4cCI6MjA3MDgzMjA0NH0.CfiH1dnAn8K00uZpLHvIK1fvc7Bod8GoFbVWfVxJlAA'
    );
    
    this.initializeLicenseTable();
  }

  
  private initializeLicenseTable(): void {
    try {
      this.db.getDatabase().exec(`
        CREATE TABLE IF NOT EXISTS license_info (
          id INTEGER PRIMARY KEY,
          encrypted_data TEXT NOT NULL,
          checksum TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation de la table license_info:', error);
    }
  }

  getMachineId(): string {
    try {
      const hostname = os.hostname();
      const platform = os.platform();
      const arch = os.arch();
      const cpus = os.cpus();
      const totalMem = os.totalmem();
      
      const networkInterfaces = os.networkInterfaces();
      const macAddresses: string[] = [];
      
      for (const [name, interfaces] of Object.entries(networkInterfaces)) {
        if (interfaces) {
          for (const iface of interfaces) {
            if (iface.mac && iface.mac !== '00:00:00:00:00:00') {
              macAddresses.push(iface.mac);
            }
          }
        }
      }
      
      const machineInfo = [
        hostname,
        platform,
        arch,
        cpus.length.toString(),
        cpus[0] ? cpus[0].model : '',
        totalMem.toString(),
        macAddresses.sort().join(',')
      ].join('|');
      
      let hash = 0;
      for (let i = 0; i < machineInfo.length; i++) {
        const char = machineInfo.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      
      const machineId = Math.abs(hash).toString(16).padStart(16, '0');
      return machineId;
    } catch (error) {
      console.error('❌ Erreur lors de l\'obtention de l\'ID machine:', error);
      const fallbackId = (Date.now().toString(16) + Math.random().toString(16).substr(2, 8)).substr(0, 16);
      return fallbackId;
    }
  }

  private encryptData(data: any): string {
    return CryptoJS.AES.encrypt(JSON.stringify(data), this.encryptionKey).toString();
  }

  private decryptData(encryptedData: string): any {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
      const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
      return JSON.parse(decryptedData);
    } catch (error) {
      throw new Error('Données de licence corrompues');
    }
  }

  private generateChecksum(data: string): string {
    return CryptoJS.SHA256(data + this.encryptionKey).toString();
  }

  private saveLicenseInfoLocally(licenseInfo: LocalLicenseInfo): void {
    try {
      const encryptedData = this.encryptData(licenseInfo);
      const checksum = this.generateChecksum(encryptedData);

      const stmt = this.db.getDatabase().prepare(`
        INSERT OR REPLACE INTO license_info (id, encrypted_data, checksum, updated_at)
        VALUES (1, ?, ?, datetime('now'))
      `);

      stmt.run(encryptedData, checksum);
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde locale:', error);
      throw new Error('Impossible de sauvegarder les informations de licence');
    }
  }

  private getLocalLicenseInfo(): LocalLicenseInfo | null {
    try {
      const stmt = this.db.getDatabase().prepare(`
        SELECT encrypted_data, checksum FROM license_info WHERE id = 1
      `);
      
      const result = stmt.get() as { encrypted_data: string; checksum: string } | undefined;
      
      if (!result) {
        return null;
      }

      const expectedChecksum = this.generateChecksum(result.encrypted_data);
      if (result.checksum !== expectedChecksum) {
        console.warn('⚠️ Checksum des données de licence invalide');
        return null;
      }

      return this.decryptData(result.encrypted_data);
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des informations locales:', error);
      return null;
    }
  }

  async startTrialPeriod(): Promise<LocalLicenseInfo> {
    const macAddress = this.getMachineId();
    const trialStartDate = new Date().toISOString();
    const trialEndDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString();

    const licenseInfo: LocalLicenseInfo = {
      isActivated: false,
      macAddress,
      trialStartDate,
      trialEndDate,
      status: 'trial'
    };

    this.saveLicenseInfoLocally(licenseInfo);

    try {
      await this.logValidation({
        mac_address: macAddress,
        validation_type: 'trial_start',
        success: true,
        app_version: '1.0.0'
      });
    } catch (error) {
      console.warn('⚠️ Impossible d\'enregistrer le début d\'essai dans Supabase:', error);
    }

    return licenseInfo;
  }

  async checkLicenseStatus(): Promise<{ isValid: boolean; licenseInfo: LocalLicenseInfo | null; message: string }> {
    try {
      let localInfo = this.getLocalLicenseInfo();

      if (!localInfo) {
        const trialInfo = await this.startTrialPeriod();
        return {
          isValid: true,
          licenseInfo: trialInfo,
          message: 'Bienvenue sur MugiDoc'
        };
      }

      // Toujours valide — la vérification d'expiration est désactivée
      localInfo.status = 'active';
      localInfo.isActivated = true;
      this.saveLicenseInfoLocally(localInfo);
      return {
        isValid: true,
        licenseInfo: localInfo,
        message: 'Licence active'
      };
    } catch (error) {
      console.error('❌ Erreur lors de la vérification de licence:', error);
      // En cas d'erreur, on autorise quand même l'accès
      return {
        isValid: true,
        licenseInfo: null,
        message: 'MugiDoc actif'
      };
    }
  }

  async activateWithKey(activationKey: string): Promise<{ success: boolean; message: string; licenseInfo?: LocalLicenseInfo }> {
    try {
      const macAddress = this.getMachineId();

      // Vérifier si la clé existe et est active
      const { data: keyData, error } = await this.supabase
        .from('activation_keys')
        .select('*')
        .eq('key_code', activationKey)
        .eq('is_active', true)
        .single();

      if (error || !keyData) {
        await this.logValidation({
          mac_address: macAddress,
          validation_type: 'activation',
          success: false,
          error_message: 'Clé d\'activation invalide',
          app_version: '1.0.0'
        });

        return {
          success: false,
          message: 'Clé d\'activation invalide'
        };
      }

      // Si la clé est déjà utilisée, vérifier si c'est la même machine
      if (keyData.is_used) {
        if (keyData.mac_address === macAddress) {
          // Même machine - réactiver la licence
          const licenseInfo: LocalLicenseInfo = {
            isActivated: true,
            activationKey,
            macAddress,
            activatedAt: keyData.activated_at || new Date().toISOString(),
            clientName: keyData.client_name,
            status: 'active'
          };

          this.saveLicenseInfoLocally(licenseInfo);

          return {
            success: true,
            message: 'Licence réactivée avec succès',
            licenseInfo
          };
        } else {
          // Machine différente - refuser
          await this.logValidation({
            mac_address: macAddress,
            validation_type: 'activation',
            success: false,
            error_message: 'Clé déjà utilisée sur une autre machine',
            app_version: '1.0.0'
          });

          return {
            success: false,
            message: 'Cette clé d\'activation est déjà utilisée sur une autre machine'
          };
        }
      }

      // Première activation - enregistrer la machine
      const { error: updateError } = await this.supabase
        .from('activation_keys')
        .update({
          is_used: true,
          mac_address: macAddress,
          activated_at: new Date().toISOString()
        })
        .eq('id', keyData.id);

      if (updateError) {
        throw new Error('Erreur lors de la mise à jour de la clé');
      }

      const licenseInfo: LocalLicenseInfo = {
        isActivated: true,
        activationKey,
        macAddress,
        activatedAt: new Date().toISOString(),
        clientName: keyData.client_name,
        status: 'active'
      };

      this.saveLicenseInfoLocally(licenseInfo);

      await this.logValidation({
        activation_key_id: keyData.id,
        mac_address: macAddress,
        validation_type: 'activation',
        success: true,
        app_version: '1.0.0'
      });

      return {
        success: true,
        message: 'Application activée avec succès',
        licenseInfo
      };

    } catch (error) {
      console.error('❌ Erreur lors de l\'activation:', error);
      return {
        success: false,
        message: 'Erreur lors de l\'activation: ' + (error as Error).message
      };
    }
  }

  private async logValidation(validation: Omit<LicenseValidation, 'id' | 'created_at'>): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('license_validations')
        .insert(validation);

      if (error) {
        console.warn('⚠️ Impossible d\'enregistrer la validation:', error);
      }
    } catch (error) {
      console.warn('⚠️ Erreur réseau lors de l\'enregistrement:', error);
    }
  }

  getCurrentLicenseInfo(): LocalLicenseInfo | null {
    return this.getLocalLicenseInfo();
  }

  getTrialDaysRemaining(): number {
    const localInfo = this.getLocalLicenseInfo();
    if (!localInfo || localInfo.isActivated || !localInfo.trialEndDate) {
      return 0;
    }

    const now = new Date();
    const trialEnd = new Date(localInfo.trialEndDate);
    const diffTime = trialEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays);
  }

  resetLicense(): void {
    try {
      this.db.getDatabase().prepare('DELETE FROM license_info').run();
    } catch (error) {
      console.error('❌ Erreur lors de la réinitialisation:', error);
    }
  }
}
