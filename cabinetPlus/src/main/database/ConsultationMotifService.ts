import Database from 'better-sqlite3';
import { DatabaseService } from './DatabaseService';

export interface ConsultationMotifRecord {
  id?: number;
  label: string;
  category?: string;
  usage_count: number;
  is_custom: boolean;
  created_at?: string;
}

/**
 * Motifs de consultation récurrents (médecine générale), proposés en puces
 * dans le formulaire de consultation pour éviter la ressaisie répétée des
 * motifs les plus courants — cf. todo_consultation.
 *
 * Semée une seule fois à la création de la table : au-delà, la liste
 * appartient au médecin (motifs personnalisés ajoutés depuis la consultation,
 * cf. `create`), on ne la réinitialise donc jamais.
 */
const SEED_MOTIFS: { label: string; category: string }[] = [
  { label: 'Fièvre', category: 'Symptôme général' },
  { label: 'Fatigue / Asthénie', category: 'Symptôme général' },
  { label: 'Perte de poids', category: 'Symptôme général' },
  { label: 'Douleur généralisée', category: 'Symptôme général' },
  { label: 'Vertiges', category: 'Symptôme général' },
  { label: 'Insomnie', category: 'Symptôme général' },
  { label: 'Anxiété', category: 'Symptôme général' },

  { label: 'Toux', category: 'ORL / Respiratoire' },
  { label: 'Mal de gorge', category: 'ORL / Respiratoire' },
  { label: 'Rhume / Rhinopharyngite', category: 'ORL / Respiratoire' },
  { label: 'Essoufflement / Dyspnée', category: 'ORL / Respiratoire' },
  { label: 'Otalgie (douleur d\'oreille)', category: 'ORL / Respiratoire' },
  { label: 'Sinusite', category: 'ORL / Respiratoire' },

  { label: 'Douleur abdominale', category: 'Digestif' },
  { label: 'Diarrhée', category: 'Digestif' },
  { label: 'Vomissements / Nausées', category: 'Digestif' },
  { label: 'Constipation', category: 'Digestif' },
  { label: 'Brûlures d\'estomac', category: 'Digestif' },

  { label: 'Douleur thoracique', category: 'Cardio-vasculaire' },
  { label: 'Palpitations', category: 'Cardio-vasculaire' },
  { label: 'Contrôle tension artérielle', category: 'Cardio-vasculaire' },
  { label: 'Œdème des membres inférieurs', category: 'Cardio-vasculaire' },

  { label: 'Douleur lombaire / Mal de dos', category: 'Ostéo-articulaire' },
  { label: 'Douleur articulaire', category: 'Ostéo-articulaire' },
  { label: 'Entorse / Traumatisme', category: 'Ostéo-articulaire' },
  { label: 'Céphalées / Maux de tête', category: 'Ostéo-articulaire' },

  { label: 'Éruption cutanée', category: 'Dermatologique' },
  { label: 'Allergie', category: 'Dermatologique' },
  { label: 'Piqûre d\'insecte / Morsure', category: 'Dermatologique' },
  { label: 'Plaie', category: 'Dermatologique' },

  { label: 'Brûlures mictionnelles', category: 'Génito-urinaire' },

  { label: 'Suivi diabète', category: 'Suivi / Administratif' },
  { label: 'Grossesse — suivi', category: 'Suivi / Administratif' },
  { label: 'Renouvellement d\'ordonnance', category: 'Suivi / Administratif' },
  { label: 'Certificat médical', category: 'Suivi / Administratif' },
  { label: 'Vaccination', category: 'Suivi / Administratif' },
  { label: 'Contrôle post-opératoire', category: 'Suivi / Administratif' },
  { label: 'Bilan de santé / Check-up', category: 'Suivi / Administratif' },
  { label: 'Consultation de contrôle', category: 'Suivi / Administratif' },
];

export class ConsultationMotifService {
  private static instance: ConsultationMotifService;
  private dbService: DatabaseService;

  public constructor(dbService: DatabaseService) {
    this.dbService = dbService;
    this.initTable();
    this.seedIfEmpty();
  }

  public static getInstance(dbService?: DatabaseService): ConsultationMotifService {
    if (!ConsultationMotifService.instance) {
      if (!dbService) {
        throw new Error('DatabaseService is required to initialize ConsultationMotifService instance');
      }
      ConsultationMotifService.instance = new ConsultationMotifService(dbService);
    }
    return ConsultationMotifService.instance;
  }

  private getDb(): Database.Database {
    return this.dbService.getDatabase();
  }

  private initTable(): void {
    const db = this.getDb();
    db.exec(`
      CREATE TABLE IF NOT EXISTS consultation_motifs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        label TEXT NOT NULL UNIQUE,
        category TEXT,
        usage_count INTEGER DEFAULT 0,
        is_custom INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_consultation_motifs_usage ON consultation_motifs(usage_count DESC);
    `);
  }

  private seedIfEmpty(): void {
    const db = this.getDb();
    const { count } = db.prepare('SELECT COUNT(*) as count FROM consultation_motifs').get() as { count: number };
    if (count > 0) return;

    try {
      const insertStmt = db.prepare(`
        INSERT OR IGNORE INTO consultation_motifs (label, category, usage_count, is_custom)
        VALUES (?, ?, 0, 0)
      `);
      const insertMany = db.transaction((items: typeof SEED_MOTIFS) => {
        for (const item of items) {
          insertStmt.run(item.label, item.category);
        }
      });
      insertMany(SEED_MOTIFS);
    } catch (error) {
      console.error('[ConsultationMotifService] Failed to seed motifs:', error);
    }
  }

  private mapRow(row: any): ConsultationMotifRecord {
    return {
      id: row.id,
      label: row.label,
      category: row.category || undefined,
      usage_count: row.usage_count,
      is_custom: !!row.is_custom,
      created_at: row.created_at,
    };
  }

  public getAll(): ConsultationMotifRecord[] {
    const db = this.getDb();
    const rows = db.prepare(`
      SELECT * FROM consultation_motifs
      ORDER BY usage_count DESC, label ASC
    `).all() as any[];
    return rows.map(row => this.mapRow(row));
  }

  /**
   * Enregistre un motif saisi librement comme motif récurrent. Idempotent :
   * un libellé déjà connu renvoie l'entrée existante plutôt que d'en créer
   * un doublon.
   */
  public create(label: string, category?: string): ConsultationMotifRecord {
    const trimmed = (label || '').trim();
    if (!trimmed) {
      throw new Error('Le libellé du motif est obligatoire');
    }

    const db = this.getDb();
    const existing = db.prepare('SELECT * FROM consultation_motifs WHERE label = ?').get(trimmed) as any;
    if (existing) {
      return this.mapRow(existing);
    }

    const result = db.prepare(`
      INSERT INTO consultation_motifs (label, category, usage_count, is_custom)
      VALUES (?, ?, 0, 1)
    `).run(trimmed, category?.trim() || null);

    const created = db.prepare('SELECT * FROM consultation_motifs WHERE id = ?').get(result.lastInsertRowid);
    return this.mapRow(created);
  }

  public incrementUsage(id: number): void {
    const db = this.getDb();
    db.prepare('UPDATE consultation_motifs SET usage_count = usage_count + 1 WHERE id = ?').run(id);
  }
}
