import Database from 'better-sqlite3';
import { DatabaseService } from './DatabaseService';

export interface ConsultationDocumentRecord {
  id: number;
  patient_id: number;
  consultation_id: number | null;
  document_type: string;
  title: string;
  status: 'generated' | 'printed';
  created_at: string;
}

export interface CreateConsultationDocumentInput {
  patient_id: number;
  consultation_id?: number | null;
  document_type: string;
  title: string;
  status?: 'generated' | 'printed';
}

/**
 * Trace d'audit des documents produits depuis une consultation (ordonnance,
 * certificat, arrêt de travail...) — cf. PLAN_CONSULTATION.md L11.5. Les
 * dialogues existants gardent chacun leur propre mécanisme de génération
 * (impression, `prescriptions`, `localStorage`...) ; cette table ne duplique
 * pas leur contenu, elle enregistre uniquement qu'un document d'un type donné
 * a été produit pour cette consultation, avec son état (généré / imprimé),
 * pour L11.1 (liste) et L11.5 (rattachement au dossier patient).
 */
export class ConsultationDocumentService {
  private static instance: ConsultationDocumentService;
  private dbService: DatabaseService;

  public constructor(dbService: DatabaseService) {
    this.dbService = dbService;
    this.initTable();
  }

  public static getInstance(dbService?: DatabaseService): ConsultationDocumentService {
    if (!ConsultationDocumentService.instance) {
      if (!dbService) {
        throw new Error('DatabaseService is required to initialize ConsultationDocumentService instance');
      }
      ConsultationDocumentService.instance = new ConsultationDocumentService(dbService);
    }
    return ConsultationDocumentService.instance;
  }

  private getDb(): Database.Database {
    return this.dbService.getDatabase();
  }

  private initTable(): void {
    const db = this.getDb();
    db.exec(`
      CREATE TABLE IF NOT EXISTS consultation_documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL,
        consultation_id INTEGER,
        document_type TEXT NOT NULL,
        title TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'generated',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients (id) ON DELETE CASCADE,
        FOREIGN KEY (consultation_id) REFERENCES consultations (id) ON DELETE SET NULL
      );

      CREATE INDEX IF NOT EXISTS idx_consultation_documents_consultation ON consultation_documents(consultation_id);
      CREATE INDEX IF NOT EXISTS idx_consultation_documents_patient ON consultation_documents(patient_id);
    `);
  }

  private mapRow(row: any): ConsultationDocumentRecord {
    return {
      id: row.id,
      patient_id: row.patient_id,
      consultation_id: row.consultation_id ?? null,
      document_type: row.document_type,
      title: row.title,
      status: row.status,
      created_at: row.created_at,
    };
  }

  public create(input: CreateConsultationDocumentInput): ConsultationDocumentRecord {
    const db = this.getDb();
    const result = db.prepare(`
      INSERT INTO consultation_documents (patient_id, consultation_id, document_type, title, status)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      input.patient_id,
      input.consultation_id ?? null,
      input.document_type,
      input.title,
      input.status || 'generated'
    );

    const created = db.prepare('SELECT * FROM consultation_documents WHERE id = ?').get(result.lastInsertRowid);
    return this.mapRow(created);
  }

  public markPrinted(id: number): void {
    const db = this.getDb();
    db.prepare(`UPDATE consultation_documents SET status = 'printed' WHERE id = ?`).run(id);
  }

  /** Retire une entrée de la trace (ex. document généré par erreur). Ne touche jamais au document lui-même (prescription, historique certificat...), seulement à son suivi. */
  public delete(id: number): void {
    const db = this.getDb();
    db.prepare(`DELETE FROM consultation_documents WHERE id = ?`).run(id);
  }

  public getByConsultation(consultationId: number): ConsultationDocumentRecord[] {
    const db = this.getDb();
    const rows = db.prepare(`
      SELECT * FROM consultation_documents WHERE consultation_id = ? ORDER BY created_at DESC
    `).all(consultationId) as any[];
    return rows.map(row => this.mapRow(row));
  }

  public getByPatient(patientId: number): ConsultationDocumentRecord[] {
    const db = this.getDb();
    const rows = db.prepare(`
      SELECT * FROM consultation_documents WHERE patient_id = ? ORDER BY created_at DESC
    `).all(patientId) as any[];
    return rows.map(row => this.mapRow(row));
  }
}
