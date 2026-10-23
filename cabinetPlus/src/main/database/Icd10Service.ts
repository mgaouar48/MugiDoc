import Database from 'better-sqlite3';
import { DatabaseService } from './DatabaseService';
import icd10Data from './icd10_data.json';

export interface Icd10CodeRecord {
  code: string;
  label: string;
  chapter?: string;
  chapter_label?: string;
}

/**
 * Recherche de code CIM-10 pour le diagnostic — toujours une aide optionnelle,
 * jamais un champ bloquant : le diagnostic en texte libre reste la donnée de
 * référence (cf. todo_consultation, section Diagnostic).
 *
 * Table alimentée depuis icd10_data.json, un sous-ensemble curé (~600 codes)
 * orienté médecine générale, avec libellés en français.
 */
export class Icd10Service {
  private static instance: Icd10Service;
  private dbService: DatabaseService;

  public constructor(dbService: DatabaseService) {
    this.dbService = dbService;
    this.initTable();
    this.seedCodes();
  }

  public static getInstance(dbService?: DatabaseService): Icd10Service {
    if (!Icd10Service.instance) {
      if (!dbService) {
        throw new Error('DatabaseService is required to initialize Icd10Service instance');
      }
      Icd10Service.instance = new Icd10Service(dbService);
    }
    return Icd10Service.instance;
  }

  private getDb(): Database.Database {
    return this.dbService.getDatabase();
  }

  private initTable(): void {
    const db = this.getDb();
    db.exec(`
      CREATE TABLE IF NOT EXISTS icd10_codes (
        code TEXT PRIMARY KEY,
        label TEXT NOT NULL,
        chapter TEXT,
        chapter_label TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_icd10_label ON icd10_codes(label);
    `);

    // `search_label` : libellé sans accents ni casse, calculé côté JS (SQLite
    // ne sait ni replier les accents ni normaliser l'Unicode). Sans lui,
    // « cephalees » ne remonterait jamais « Céphalées ».
    const columns = db.prepare('PRAGMA table_info(icd10_codes)').all() as { name: string }[];
    if (!columns.some(column => column.name === 'search_label')) {
      db.exec(`ALTER TABLE icd10_codes ADD COLUMN search_label TEXT`);
      db.exec(`CREATE INDEX IF NOT EXISTS idx_icd10_search_label ON icd10_codes(search_label)`);
    }
  }

  /** Minuscules + suppression des accents, pour une recherche tolérante. */
  private normalize(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .trim();
  }

  /**
   * Upsert par code (clé naturelle unique) : sûr à rejouer à chaque
   * démarrage, y compris pour propager une correction de libellé apportée
   * à icd10_data.json sur une base déjà alimentée.
   */
  private seedCodes(): void {
    const db = this.getDb();
    const list = icd10Data as Icd10CodeRecord[];

    try {
      const upsert = db.prepare(`
        INSERT INTO icd10_codes (code, label, chapter, chapter_label, search_label)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(code) DO UPDATE SET
          label = excluded.label,
          chapter = excluded.chapter,
          chapter_label = excluded.chapter_label,
          search_label = excluded.search_label
      `);

      const insertMany = db.transaction((items: Icd10CodeRecord[]) => {
        for (const item of items) {
          upsert.run(item.code, item.label, item.chapter || null, item.chapter_label || null, this.normalize(item.label));
        }
      });

      insertMany(list);
    } catch (error) {
      console.error('[Icd10Service] Failed to seed ICD-10 codes:', error);
    }
  }

  public searchCodes(query: string, limit = 50): Icd10CodeRecord[] {
    const db = this.getDb();
    const cleanQuery = query ? query.trim() : '';

    if (!cleanQuery) {
      return db.prepare(`
        SELECT * FROM icd10_codes
        ORDER BY code ASC
        LIMIT ?
      `).all(limit) as Icd10CodeRecord[];
    }

    // Recherche sur `search_label` (sans accents) plutôt que `label` : le
    // médecin tape « cephalees » aussi souvent que « céphalées ».
    const normalizedQuery = this.normalize(cleanQuery);
    const searchPattern = `%${normalizedQuery}%`;
    const startsWithPattern = `${normalizedQuery}%`;
    const codePattern = `${cleanQuery.toUpperCase()}%`;

    return db.prepare(`
      SELECT *,
        CASE
          WHEN code LIKE ? THEN 3
          WHEN search_label LIKE ? THEN 2
          ELSE 1
        END as match_score
      FROM icd10_codes
      WHERE code LIKE ? OR search_label LIKE ?
      ORDER BY match_score DESC, label ASC
      LIMIT ?
    `).all(codePattern, startsWithPattern, codePattern, searchPattern, limit) as Icd10CodeRecord[];
  }
}
