import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';

export class DatabaseService {
  private db: Database.Database | null = null;
  private dbPath: string;

  constructor(dbPathOverride?: string) {
    // Permet aux tests d'utiliser une base en mémoire (':memory:') sans dépendre
    // d'Electron — évite tout appel à app.getPath() hors d'un vrai processus Electron.
    if (dbPathOverride) {
      this.dbPath = dbPathOverride;
      return;
    }

    // Créer le dossier de données utilisateur s'il n'existe pas
    const userDataPath = app.getPath('userData');
    const dbDir = path.join(userDataPath, 'database');

    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    this.dbPath = path.join(dbDir, 'cabinetplus.db');
  }

  /**
   * Initialise la connexion à la base de données
   */
  public initialize(): void {
    try {
      this.db = new Database(this.dbPath);
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('foreign_keys = ON');
      
      
      // Créer les tables si elles n'existent pas
      this.createTables();

      // Exécuter les migrations (peuvent ajouter des colonnes sur des bases existantes)
      this.runMigrations();
      this.addRbacFieldsToUsers();
      this.addGenderToPatients();
      this.addAllergiesToPatients();

      // Créer les index sur les colonnes filtrées en permanence — après les migrations,
      // pour garantir que toutes les colonnes indexées existent déjà (base neuve ou existante)
      this.createIndexes();

      // Insérer des données de démonstration si la base est vide
      this.seedDatabase();
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation de la base de données:', error);
      throw error;
    }
  }

  /**
   * Ferme la connexion à la base de données
   */
  public close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  /**
   * Obtient l'instance de la base de données
   */
  public getDatabase(): any {
    if (!this.db) {
      throw new Error('Base de données non initialisée');
    }
    return this.db;
  }

  /**
   * Obtient le chemin de la base de données
   */
  public getDatabasePath(): string {
    return this.dbPath;
  }

  /**
   * Crée une sauvegarde de la base de données
   */
  public async createBackup(backupPath: string): Promise<void> {
    try {
      if (!this.db) {
        throw new Error('Base de données non initialisée');
      }

      // Fermer temporairement la base pour la copier
      this.db.close();
      
      // Copier le fichier de base de données
      await fs.promises.copyFile(this.dbPath, backupPath);
      
      // Rouvrir la base de données
      this.db = new Database(this.dbPath);
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('foreign_keys = ON');
      
    } catch (error) {
      console.error('❌ Erreur lors de la création de la sauvegarde:', error);
      throw error;
    }
  }

  /**
   * Restaure une sauvegarde de la base de données
   */
  public async restoreBackup(backupPath: string): Promise<void> {
    try {
      if (!fs.existsSync(backupPath)) {
        throw new Error('Fichier de sauvegarde introuvable');
      }

      // Fermer la base de données actuelle
      if (this.db) {
        this.db.close();
      }
      
      // Remplacer la base de données actuelle par la sauvegarde
      await fs.promises.copyFile(backupPath, this.dbPath);
      
      // Rouvrir la base de données
      this.db = new Database(this.dbPath);
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('foreign_keys = ON');
      
    } catch (error) {
      console.error('❌ Erreur lors de la restauration:', error);
      throw error;
    }
  }

  /**
   * Crée les tables de la base de données
   */
  private createTables(): void {
    if (!this.db) return;

    // Table des utilisateurs (médecins, secrétaires, administrateurs)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        speciality TEXT,
        license_number TEXT,
        role TEXT CHECK(role IN ('admin', 'doctor', 'secretary')) DEFAULT 'admin',
        is_active INTEGER DEFAULT 1,
        must_change_password INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Table du journal d'activité (logs)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        action TEXT NOT NULL,
        resource TEXT NOT NULL,
        details TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
      )
    `);

    // Table des patients
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS patients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        gender TEXT DEFAULT 'M',
        date_of_birth DATE NOT NULL,
        phone TEXT,
        email TEXT,
        address TEXT,
        weight REAL,
        height REAL,
        diseases TEXT,
        medical_history TEXT,
        status TEXT CHECK(status IN ('actif', 'inactif')) DEFAULT 'actif',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Table des rendez-vous
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL,
        date DATE NOT NULL,
        time TEXT NOT NULL,
        duration INTEGER DEFAULT 30,
        type TEXT NOT NULL,
        status TEXT CHECK(status IN ('confirmé', 'en_attente', 'annulé', 'terminé')) DEFAULT 'en_attente',
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients (id) ON DELETE CASCADE
      )
    `);

    // Table de la salle d'attente
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS waiting_room (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL,
        appointment_id INTEGER,
        arrival_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT CHECK(status IN ('en_attente', 'en_consultation', 'termine', 'absent')) DEFAULT 'en_attente',
        priority INTEGER DEFAULT 2,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients (id) ON DELETE CASCADE,
        FOREIGN KEY (appointment_id) REFERENCES appointments (id) ON DELETE SET NULL
      )
    `);

    // Table des consultations
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS consultations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL,
        appointment_id INTEGER,
        date DATE NOT NULL,
        time TEXT NOT NULL,
        motif TEXT NOT NULL,
        diagnostic TEXT,
        traitement TEXT,
        status TEXT CHECK(status IN ('completed', 'in-progress', 'scheduled')) DEFAULT 'scheduled',
        price DECIMAL(10,2) DEFAULT 0,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients (id) ON DELETE CASCADE,
        FOREIGN KEY (appointment_id) REFERENCES appointments (id) ON DELETE SET NULL
      )
    `);

    // Table des paiements
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER,
        consultation_id INTEGER,
        amount DECIMAL(10,2) NOT NULL,
        method TEXT CHECK(method IN ('cash', 'card')) NOT NULL,
        status TEXT CHECK(status IN ('pending', 'completed', 'debt')) DEFAULT 'pending',
        date DATE NOT NULL,
        debt_amount DECIMAL(10,2) DEFAULT 0,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients (id) ON DELETE SET NULL,
        FOREIGN KEY (consultation_id) REFERENCES consultations (id) ON DELETE SET NULL
      )
    `);

    // Table des paramètres
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT,
        category TEXT DEFAULT 'general',
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Table des frais
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        amount DECIMAL(10,2) NOT NULL,
        description TEXT NOT NULL,
        date DATE NOT NULL DEFAULT CURRENT_DATE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Table des modèles d'ordonnances
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS prescription_templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        medications TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Table des ordonnances
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS prescriptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL,
        consultation_id INTEGER,
        template_id INTEGER,
        medications TEXT NOT NULL,
        date DATE NOT NULL,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients (id) ON DELETE CASCADE,
        FOREIGN KEY (consultation_id) REFERENCES consultations (id) ON DELETE SET NULL,
        FOREIGN KEY (template_id) REFERENCES prescription_templates (id) ON DELETE SET NULL
      )
    `);

    // Table des documents patients (EDFA / Imagerie)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS patient_documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL,
        filename TEXT NOT NULL,
        original_name TEXT NOT NULL,
        file_type TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        category TEXT DEFAULT 'Autre',
        file_path TEXT NOT NULL,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients (id) ON DELETE CASCADE
      )
    `);

    // Table d'inventaire & consommables
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS inventory_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT DEFAULT 'Consommable',
        quantity INTEGER NOT NULL DEFAULT 0,
        min_threshold INTEGER NOT NULL DEFAULT 5,
        unit TEXT DEFAULT 'unité',
        unit_price DECIMAL(10,2) DEFAULT 0,
        supplier TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

  }

  /**
   * Crée les index sur les colonnes filtrées en permanence par les services
   */
  private createIndexes(): void {
    if (!this.db) return;

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_patients_status ON patients(status);
      CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
      CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
      CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
      CREATE INDEX IF NOT EXISTS idx_appointments_type ON appointments(type);
      CREATE INDEX IF NOT EXISTS idx_consultations_patient_id ON consultations(patient_id);
      CREATE INDEX IF NOT EXISTS idx_consultations_appointment_id ON consultations(appointment_id);
      CREATE INDEX IF NOT EXISTS idx_consultations_date ON consultations(date);
      CREATE INDEX IF NOT EXISTS idx_consultations_status ON consultations(status);
      CREATE INDEX IF NOT EXISTS idx_payments_patient_id ON payments(patient_id);
      CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(date);
      CREATE INDEX IF NOT EXISTS idx_payments_consultation_id ON payments(consultation_id);
      CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
      CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON prescriptions(patient_id);
      CREATE INDEX IF NOT EXISTS idx_prescriptions_date ON prescriptions(date);
      CREATE INDEX IF NOT EXISTS idx_patient_documents_patient_id ON patient_documents(patient_id);
    `);
  }

  /**
   * Migration pour ajouter la colonne allergies à la table patients
   */
  private addAllergiesToPatients(): void {
    if (!this.db) return;
    try {
      const tableInfo = this.db.prepare("PRAGMA table_info(patients)").all() as any[];
      const hasAllergies = tableInfo.some((col: any) => col.name === 'allergies');
      if (!hasAllergies) {
        this.db.exec("ALTER TABLE patients ADD COLUMN allergies TEXT");
      }
    } catch (err) {
      console.error('Erreur lors de l\'ajout de la colonne allergies à la table patients:', err);
    }
  }

  /**
   * Exécute les migrations de base de données
   */
  private runMigrations(): void {
    if (!this.db) return;

    try {
      // Créer la table de migrations si elle n'existe pas
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS migrations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT UNIQUE NOT NULL,
          executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Migration 1: Mise à jour de la table payments
      const migration1Name = 'update_payments_table_structure';
      const migration1Exists = this.db.prepare('SELECT name FROM migrations WHERE name = ?').get(migration1Name);

      if (!migration1Exists) {
        this.db.transaction(() => {
          // Vérifier si l'ancienne table payments existe
          const tableExists = this.db.prepare(`
            SELECT name FROM sqlite_master
            WHERE type='table' AND name='payments'
          `).get();

          if (tableExists) {
            // Vérifier la structure actuelle
            const columns = this.db.prepare("PRAGMA table_info(payments)").all() as any[];
            const hasDateColumn = columns.some(col => col.name === 'date');
            const hasMethodColumn = columns.some(col => col.name === 'method');

            if (!hasDateColumn || !hasMethodColumn) {
              // Sauvegarder les données existantes
              const existingPayments = this.db.prepare('SELECT * FROM payments').all() as any[];

              // Supprimer l'ancienne table
              this.db.exec('DROP TABLE payments');

              // Recréer la table avec la nouvelle structure
              this.db.exec(`
                CREATE TABLE payments (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  patient_id INTEGER NOT NULL,
                  consultation_id INTEGER,
                  amount DECIMAL(10,2) NOT NULL,
                  method TEXT CHECK(method IN ('cash', 'card', 'check', 'transfer')) NOT NULL DEFAULT 'cash',
                  status TEXT CHECK(status IN ('pending', 'completed', 'failed', 'refunded')) DEFAULT 'pending',
                  date DATE NOT NULL,
                  notes TEXT,
                  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                  FOREIGN KEY (patient_id) REFERENCES patients (id) ON DELETE CASCADE,
                  FOREIGN KEY (consultation_id) REFERENCES consultations (id) ON DELETE SET NULL
                )
              `);

              // Restaurer les données avec mapping des colonnes
              if (existingPayments.length > 0) {
                const insertStmt = this.db.prepare(`
                  INSERT INTO payments (patient_id, consultation_id, amount, method, status, date, notes, created_at, updated_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `);

                for (const payment of existingPayments) {
                  // Mapper les anciennes colonnes vers les nouvelles
                  const mappedPayment = {
                    patient_id: payment.patient_id,
                    consultation_id: payment.consultation_id,
                    amount: payment.amount,
                    method: payment.payment_method || 'cash', // Ancienne colonne vers nouvelle
                    status: payment.status || 'pending',
                    date: payment.paid_date || payment.due_date || new Date().toISOString().split('T')[0],
                    notes: payment.description || null,
                    created_at: payment.created_at,
                    updated_at: payment.updated_at
                  };

                  insertStmt.run(
                    mappedPayment.patient_id,
                    mappedPayment.consultation_id,
                    mappedPayment.amount,
                    mappedPayment.method,
                    mappedPayment.status,
                    mappedPayment.date,
                    mappedPayment.notes,
                    mappedPayment.created_at,
                    mappedPayment.updated_at
                  );
                }
              }

            }
          }

          // Marquer la migration comme exécutée
          this.db.prepare('INSERT INTO migrations (name) VALUES (?)').run(migration1Name);
        })();
      }

      // Migration 2: Permettre patient_id NULL pour patients anonymes
      const migration2Name = 'allow_null_patient_id_in_payments';
      const migration2Exists = this.db.prepare('SELECT name FROM migrations WHERE name = ?').get(migration2Name);

      if (!migration2Exists) {
        console.log('🔄 Exécution de la migration: allow_null_patient_id_in_payments');

        this.db.transaction(() => {
          // Vérifier si la table payments existe
          const tableExists = this.db.prepare(`
            SELECT name FROM sqlite_master
            WHERE type='table' AND name='payments'
          `).get();

          if (tableExists) {
            // Sauvegarder les données existantes
            const existingPayments = this.db.prepare('SELECT * FROM payments').all() as any[];

            // Supprimer l'ancienne table
            this.db.exec('DROP TABLE payments');

            // Recréer la table avec patient_id nullable
            this.db.exec(`
              CREATE TABLE payments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                patient_id INTEGER,
                amount DECIMAL(10,2) NOT NULL,
                method TEXT CHECK(method IN ('cash', 'card')) NOT NULL,
                status TEXT CHECK(status IN ('pending', 'completed', 'debt')) DEFAULT 'pending',
                date DATE NOT NULL,
                debt_amount DECIMAL(10,2) DEFAULT 0,
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (patient_id) REFERENCES patients (id) ON DELETE SET NULL
              )
            `);

            // Restaurer les données existantes
            if (existingPayments.length > 0) {
              const insertStmt = this.db.prepare(`
                INSERT INTO payments (id, patient_id, amount, method, status, date, debt_amount, notes, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              `);

              for (const payment of existingPayments) {
                insertStmt.run(
                  payment.id,
                  payment.patient_id,
                  payment.amount,
                  payment.method,
                  payment.status,
                  payment.date,
                  payment.debt_amount || 0,
                  payment.notes,
                  payment.created_at,
                  payment.updated_at
                );
              }
            }

          }

          // Marquer la migration comme exécutée
          this.db.prepare('INSERT INTO migrations (name) VALUES (?)').run(migration2Name);
        })();
      }

      // Exécuter la migration pour permettre patient_id NULL
      this.runPaymentsMigration();

      // Migration 3: Ajouter les nouveaux champs optionnels à la table patients (pour bases existantes)
      this.addPatientOptionalFields();

      // Migration 4: Ajouter les champs RBAC (role, is_active) à la table users
      this.addRbacFieldsToUsers();

      // Migration 5: Ajouter la colonne ticket_number à waiting_room
      this.addTicketNumberToWaitingRoom();

      // Migration 6: Ajouter la colonne must_change_password à users
      this.addMustChangePasswordToUsers();

      // Migration 7: Ajouter la colonne consultation_id à payments
      this.addConsultationIdToPayments();

    } catch (error) {
      console.error('❌ Erreur lors des migrations:', error);
      throw error;
    }
  }

  /**
   * Ajoute la colonne ticket_number à la table waiting_room si absente
   */
  private addTicketNumberToWaitingRoom(): void {
    if (!this.db) return;
    try {
      const tableInfo = this.db.prepare("PRAGMA table_info(waiting_room)").all() as any[];
      const hasTicketNum = tableInfo.some((col: any) => col.name === 'ticket_number');

      if (!hasTicketNum) {
        this.db.exec("ALTER TABLE waiting_room ADD COLUMN ticket_number INTEGER");
        console.log("✅ Migration: Colonne 'ticket_number' ajoutée à la table 'waiting_room'");
      }
    } catch (error) {
      console.error("❌ Erreur lors de l'ajout de la colonne 'ticket_number':", error);
    }
  }

  /**
   * Ajoute la colonne consultation_id à la table payments si absente
   */
  private addConsultationIdToPayments(): void {
    if (!this.db) return;
    try {
      const columns = this.db.prepare("PRAGMA table_info(payments)").all() as any[];
      const hasConsultationId = columns.some(col => col.name === 'consultation_id');

      if (!hasConsultationId) {
        this.db.exec("ALTER TABLE payments ADD COLUMN consultation_id INTEGER REFERENCES consultations(id)");
        console.log("✅ Migration: Colonne 'consultation_id' ajoutée à la table 'payments'");
      }
    } catch (error) {
      console.error("❌ Erreur lors de l'ajout de la colonne 'consultation_id' à payments:", error);
    }
  }

  /**
   * Ajoute la colonne must_change_password à la table users si absente
   */
  private addMustChangePasswordToUsers(): void {
    if (!this.db) return;
    try {
      const userColumns = this.db.prepare("PRAGMA table_info(users)").all() as any[];
      const hasMustChangePassword = userColumns.some(col => col.name === 'must_change_password');

      if (!hasMustChangePassword) {
        this.db.exec("ALTER TABLE users ADD COLUMN must_change_password INTEGER DEFAULT 0");
        console.log("✅ Migration: Colonne 'must_change_password' ajoutée à la table 'users'");
      }
    } catch (error) {
      console.error("❌ Erreur lors de l'ajout de la colonne 'must_change_password':", error);
    }
  }

  /**
   * Ajoute les champs role et is_active à la table users s'ils n'existent pas
   */
  private addRbacFieldsToUsers(): void {
    if (!this.db) return;
    try {
      const userColumns = this.db.prepare("PRAGMA table_info(users)").all() as any[];
      const hasRole = userColumns.some(col => col.name === 'role');
      const hasIsActive = userColumns.some(col => col.name === 'is_active');

      if (!hasRole) {
        console.log('🔄 Ajout de la colonne role à la table users');
        this.db.exec("ALTER TABLE users ADD COLUMN role TEXT CHECK(role IN ('admin', 'doctor', 'secretary')) DEFAULT 'admin'");
      }
      if (!hasIsActive) {
        console.log('🔄 Ajout de la colonne is_active à la table users');
        this.db.exec("ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 1");
      }
    } catch (err) {
      console.error('Erreur lors de l\'ajout des colonnes RBAC à la table users:', err);
    }
  }

  /**
   * Migration pour permettre patient_id NULL dans payments
   */
  private runPaymentsMigration(): void {
    if (!this.db) return;

    try {
      // Migration: Permettre patient_id NULL dans payments pour les patients anonymes
      const migrationName = 'allow_null_patient_id_in_payments';
      const migrationExists = this.db.prepare('SELECT name FROM migrations WHERE name = ?').get(migrationName);

      if (!migrationExists) {
        console.log('🔄 Exécution de la migration: allow_null_patient_id_in_payments');

        this.db.transaction(() => {
          // Sauvegarder les données existantes
          const existingPayments = this.db.prepare('SELECT * FROM payments').all() as any[];

          // Supprimer l'ancienne table
          this.db.exec('DROP TABLE IF EXISTS payments');

          // Recréer la table avec patient_id nullable
          this.db.exec(`
            CREATE TABLE payments (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              patient_id INTEGER,
              amount DECIMAL(10,2) NOT NULL,
              method TEXT CHECK(method IN ('cash', 'card')) NOT NULL,
              status TEXT CHECK(status IN ('pending', 'completed', 'debt')) DEFAULT 'pending',
              date DATE NOT NULL,
              debt_amount DECIMAL(10,2) DEFAULT 0,
              notes TEXT,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (patient_id) REFERENCES patients (id) ON DELETE SET NULL
            )
          `);

          // Restaurer les données existantes
          if (existingPayments.length > 0) {
            const insertStmt = this.db.prepare(`
              INSERT INTO payments (id, patient_id, amount, method, status, date, debt_amount, notes, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            for (const payment of existingPayments) {
              insertStmt.run(
                payment.id,
                payment.patient_id,
                payment.amount,
                payment.method,
                payment.status,
                payment.date,
                payment.debt_amount || 0,
                payment.notes,
                payment.created_at,
                payment.updated_at
              );
            }
          }

          // Marquer la migration comme exécutée
          this.db.prepare('INSERT INTO migrations (name) VALUES (?)').run(migrationName);
        })();
        console.log('✅ Migration allow_null_patient_id_in_payments terminée');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la migration payments:', error);
      throw error;
    }
  }

  /**
   * Ajoute les champs optionnels à la table patients pour les bases existantes
   */
  private addPatientOptionalFields(): void {
    if (!this.db) return;

    try {
      const migrationName = 'add_optional_fields_to_patients';
      const migrationExists = this.db.prepare('SELECT name FROM migrations WHERE name = ?').get(migrationName);

      if (!migrationExists) {
        console.log('🔄 Mise à jour de la table patients avec les nouveaux champs optionnels');

        // Vérifier si les colonnes existent déjà
        const tableInfo = this.db.prepare("PRAGMA table_info(patients)").all() as any[];
        const hasWeight = tableInfo.some((col: any) => col.name === 'weight');
        const hasHeight = tableInfo.some((col: any) => col.name === 'height');
        const hasDiseases = tableInfo.some((col: any) => col.name === 'diseases');
        const hasMedicalHistory = tableInfo.some((col: any) => col.name === 'medical_history');

        // Ajouter les colonnes manquantes uniquement si elles n'existent pas
        if (!hasWeight) {
          this.db.exec('ALTER TABLE patients ADD COLUMN weight REAL');
          console.log('✅ Colonne weight ajoutée');
        }

        if (!hasHeight) {
          this.db.exec('ALTER TABLE patients ADD COLUMN height REAL');
          console.log('✅ Colonne height ajoutée');
        }

        if (!hasDiseases) {
          this.db.exec('ALTER TABLE patients ADD COLUMN diseases TEXT');
          console.log('✅ Colonne diseases ajoutée');
        }

        if (!hasMedicalHistory) {
          this.db.exec('ALTER TABLE patients ADD COLUMN medical_history TEXT');
          console.log('✅ Colonne medical_history ajoutée');
        }

        // Marquer la migration comme exécutée
        this.db.prepare('INSERT INTO migrations (name) VALUES (?)').run(migrationName);
        console.log('✅ Table patients mise à jour avec succès');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour de la table patients:', error);
    }
  }

  /**
   * Insère des données de démonstration si la base est vide
   */
  private seedDatabase(): void {
    if (!this.db) return;

    try {
      // Vérifier s'il y a déjà des paramètres
      const settingsCount = this.db.prepare('SELECT COUNT(*) as count FROM settings').get() as { count: number };

      if (settingsCount.count === 0) {
        // Insérer les paramètres par défaut
        this.db.prepare(`
          INSERT INTO settings (key, value) VALUES 
          ('clinic_name', 'Cabinet Médical'),
          ('doctor_name', 'Dr. Nom'),
          ('address', '123 Rue de la Santé'),
          ('phone', '01 23 45 67 89'),
          ('email', 'contact@cabinet.fr')
        `).run();
      }

      // Vérifier si des patients existent, sinon en créer
      const patientsCount = this.db.prepare('SELECT COUNT(*) as count FROM patients').get() as { count: number };
      if (patientsCount.count === 0) {
        const insertPatient = this.db.prepare(`
          INSERT INTO patients (first_name, last_name, gender, date_of_birth, phone, email, address, weight, height, diseases, allergies, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'actif')
        `);

        const demoPatients = [
          ['Mohamed', 'Gaouar', 'M', '2005-10-03', '05 58 47 76 37', 'm.gaouar@email.dz', 'Alger', 72, 175, 'Hypertension', 'Pénicilline'],
          ['Meriem', 'Kacemi', 'F', '2019-11-05', '07 35 65 52 74', 'm.kacemi@email.dz', 'Oran', 18, 105, '', ''],
          ['Sarah', 'Kacemi', 'F', '1956-02-03', '07 36 05 95 76', 's.kacemi@email.dz', 'Alger', 68, 160, 'Diabète Type 2', ''],
          ['Amel', 'Cherif', 'F', '1969-05-26', '07 92 76 67 78', 'a.cherif@email.dz', 'Blida', 62, 163, 'Asthme', 'Aspirine'],
          ['Ines', 'Kacemi', 'F', '1973-10-07', '07 36 93 38 59', 'i.kacemi@email.dz', 'Alger', 70, 168, '', ''],
          ['Meriem', 'Mansouri', 'F', '2014-12-07', '05 14 46 77 36', 'm.mansouri@email.dz', 'Boumerdès', 32, 135, '', ''],
          ['Sarah', 'Amrani', 'F', '1979-10-07', '07 66 41 57 83', 's.amrani@email.dz', 'Alger', 64, 165, '', ''],
          ['Amina', 'Taleb', 'F', '1989-06-18', '07 66 89 30 21', 'a.taleb@email.dz', 'Tipaza', 58, 162, '', 'Pollen'],
          ['Yasmine', 'Mansouri', 'F', '1969-03-27', '07 43 31 45 81', 'y.mansouri@email.dz', 'Alger', 65, 160, 'Asthme', ''],
          ['Oussama', 'Amrani', 'M', '2016-03-17', '05 38 16 74 83', 'o.amrani@email.dz', 'Alger', 26, 122, '', '']
        ];

        for (const p of demoPatients) {
          insertPatient.run(...p);
        }
      }

      // Vérifier s'il y a des rendez-vous aujourd'hui, sinon en insérer pour la liste d'attente
      const today = new Date().toISOString().split('T')[0];
      const todayApptsCount = this.db.prepare('SELECT COUNT(*) as count FROM appointments WHERE date = ?').get(today) as { count: number };

      if (todayApptsCount.count === 0) {
        const patients = this.db.prepare('SELECT id FROM patients ORDER BY id').all() as { id: number }[];
        if (patients.length > 0) {
          const insertAppt = this.db.prepare(`
            INSERT INTO appointments (patient_id, date, time, duration, type, status, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `);

          const demoAppts = [
            ['08:30', 30, 'Consultation Générale', 'terminé', 'Fièvre et céphalées depuis 2 jours'],
            ['09:00', 30, 'Contrôle tension', 'terminé', 'Suivi de traitement anti-hypertenseur'],
            ['09:30', 30, 'Pédiatrie', 'terminé', 'Contrôle annuel de croissance'],
            ['10:00', 30, 'Urgence', 'en_attente', 'Douleurs lombaires aiguës'],
            ['10:30', 30, 'Consultation Générale', 'en_attente', 'Toux sèche persistante'],
            ['11:00', 30, 'Renouvellement ordonnance', 'en_attente', 'Bilan sanguin et traitement antidiabétique'],
            ['11:30', 30, 'Suivi médical', 'en_attente', 'Contrôle de l asthme après crise'],
            ['14:00', 30, 'Consultation Générale', 'en_attente', 'Douleurs estomac post-prandiales'],
            ['14:30', 30, 'Bilan complet', 'en_attente', 'Visite médicale de routine'],
            ['15:00', 30, 'Certificat médical', 'en_attente', 'Certificat d aptitude au sport'],
            ['15:30', 30, 'Urgence', 'en_attente', 'Traumatisme cheville lors de footing'],
            ['16:00', 30, 'Consultation Générale', 'en_attente', 'Syndrome grippal et fatigue']
          ];

          demoAppts.forEach(([time, duration, type, status, notes], idx) => {
            const patientId = patients[idx % patients.length].id;
            insertAppt.run(patientId, today, time, duration, type, status, notes);
          });

          // Remplir aussi la salle d'attente s'il n'y a pas d'entrées aujourd'hui
          const waitCount = this.db.prepare('SELECT COUNT(*) as count FROM waiting_room').get() as { count: number };
          if (waitCount.count === 0) {
            const insertWait = this.db.prepare(`
              INSERT INTO waiting_room (patient_id, ticket_number, arrival_time, status, notes)
              VALUES (?, ?, ?, 'en_attente', ?)
            `);
            for (let k = 3; k < 11; k++) {
              const pid = patients[k % patients.length].id;
              const ticketNum = `A-${100 + k}`;
              const arrivalTime = `${String(8 + Math.floor(k / 2)).padStart(2, '0')}:${(k % 2) * 30 === 0 ? '15' : '45'}`;
              insertWait.run(pid, ticketNum, arrivalTime, 'Consultation');
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'insertion des données de démonstration:', error);
    }
  }

  /**
   * Ajoute la colonne gender à la table patients si absente
   */
  private addGenderToPatients(): void {
    if (!this.db) return;
    try {
      const tableInfo = this.db.prepare("PRAGMA table_info(patients)").all() as any[];
      const hasGender = tableInfo.some((col: any) => col.name === 'gender');

      if (!hasGender) {
        this.db.exec("ALTER TABLE patients ADD COLUMN gender TEXT DEFAULT 'M'");
        console.log("✅ Migration: Colonne 'gender' ajoutée à la table 'patients'");
      }
    } catch (error) {
      console.error("❌ Erreur lors de l'ajout de la colonne 'gender':", error);
    }
  }

}
