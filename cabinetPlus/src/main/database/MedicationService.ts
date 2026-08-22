import Database from 'better-sqlite3';
import { DatabaseService } from './DatabaseService';
import medicationsData from './medications_data.json';

export interface MedicationRecord {
  id?: number;
  brand_name: string;
  dci?: string;
  form?: string;
  dosage?: string;
  packaging?: string;
  registration_number?: string;
  code?: string;
  popularity?: number;
  created_at?: string;
}

export class MedicationService {
  private static instance: MedicationService;
  private dbService: DatabaseService;

  public constructor(dbService: DatabaseService) {
    this.dbService = dbService;
    this.initTable();
    this.seedDatabaseIfNeeded();
  }

  public static getInstance(dbService?: DatabaseService): MedicationService {
    if (!MedicationService.instance) {
      if (!dbService) {
        throw new Error('DatabaseService is required to initialize MedicationService instance');
      }
      MedicationService.instance = new MedicationService(dbService);
    }
    return MedicationService.instance;
  }

  private getDb(): Database.Database {
    return this.dbService.getDatabase();
  }

  private initTable(): void {
    const db = this.getDb();
    db.exec(`
      CREATE TABLE IF NOT EXISTS medications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        brand_name TEXT NOT NULL,
        dci TEXT,
        form TEXT,
        dosage TEXT,
        packaging TEXT,
        registration_number TEXT,
        code TEXT,
        popularity INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_medications_brand ON medications(brand_name);
      CREATE INDEX IF NOT EXISTS idx_medications_dci ON medications(dci);
      CREATE INDEX IF NOT EXISTS idx_medications_popularity ON medications(popularity DESC);
    `);
  }

  private seedDatabaseIfNeeded(): void {
    const db = this.getDb();
    const countRow = db.prepare('SELECT COUNT(*) as count FROM medications').get() as { count: number };
    const medsList: MedicationRecord[] = medicationsData as MedicationRecord[];

    if (countRow && countRow.count >= medsList.length) {
      return; // Déjà alimenté au complet
    }

    try {
      const insertStmt = db.prepare(`
        INSERT OR IGNORE INTO medications (brand_name, dci, form, dosage, packaging, registration_number, code, popularity)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const insertMany = db.transaction((items: MedicationRecord[]) => {
        for (const item of items) {
          insertStmt.run(
            item.brand_name,
            item.dci || null,
            item.form || null,
            item.dosage || null,
            item.packaging || null,
            item.registration_number || null,
            item.code || null,
            item.popularity || 0
          );
        }
      });

      insertMany(medsList);
      console.log(`[MedicationService] Seeded/Updated medications database (${medsList.length} items).`);
    } catch (error) {
      console.error('[MedicationService] Failed to seed medications:', error);
    }
  }

  public searchMedications(query: string, limit = 100): MedicationRecord[] {
    const db = this.getDb();
    const cleanQuery = query ? query.trim() : '';

    if (!cleanQuery) {
      return db.prepare(`
        SELECT * FROM medications
        ORDER BY popularity DESC, brand_name ASC
        LIMIT ?
      `).all(limit) as MedicationRecord[];
    }

    const searchPattern = `%${cleanQuery}%`;
    const startsWithPattern = `${cleanQuery}%`;

    return db.prepare(`
      SELECT *, 
        CASE 
          WHEN brand_name LIKE ? THEN 4
          WHEN brand_name LIKE ? THEN 3 
          WHEN dci LIKE ? THEN 2 
          ELSE 1 
        END as match_score
      FROM medications
      WHERE brand_name LIKE ? OR dci LIKE ? OR code LIKE ?
      ORDER BY match_score DESC, popularity DESC, brand_name ASC
      LIMIT ?
    `).all(startsWithPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, limit) as MedicationRecord[];
  }

  public getAllMedications(limit = 100): MedicationRecord[] {
    const db = this.getDb();
    return db.prepare(`
      SELECT * FROM medications
      ORDER BY popularity DESC, brand_name ASC
      LIMIT ?
    `).all(limit) as MedicationRecord[];
  }

  public addMedication(data: MedicationRecord): MedicationRecord {
    const db = this.getDb();
    const stmt = db.prepare(`
      INSERT INTO medications (brand_name, dci, form, dosage, packaging, registration_number, code, popularity)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const res = stmt.run(
      data.brand_name,
      data.dci || null,
      data.form || null,
      data.dosage || null,
      data.packaging || null,
      data.registration_number || null,
      data.code || null,
      data.popularity || 10
    );

    return {
      id: res.lastInsertRowid as number,
      ...data
    };
  }

  public incrementPopularity(id: number): void {
    const db = this.getDb();
    db.prepare(`
      UPDATE medications
      SET popularity = popularity + 10
      WHERE id = ?
    `).run(id);
  }
}
