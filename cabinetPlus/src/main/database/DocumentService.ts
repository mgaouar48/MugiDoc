import * as path from 'path';
import * as fs from 'fs';
import { app, shell } from 'electron';
import { DatabaseService } from './DatabaseService';

export interface PatientDocument {
  id: number;
  patient_id: number;
  filename: string;
  original_name: string;
  file_type: string;
  file_size: number;
  category: string;
  file_path: string;
  notes?: string;
  created_at: string;
}

export class DocumentService {
  private dbService: DatabaseService;
  private storageDir: string;

  constructor(dbService: DatabaseService) {
    this.dbService = dbService;
    const userDataPath = app.getPath('userData');
    this.storageDir = path.join(userDataPath, 'patient_documents');
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  public async getDocumentsByPatient(patientId: number): Promise<PatientDocument[]> {
    const db = this.dbService.getDatabase();
    return db
      .prepare('SELECT * FROM patient_documents WHERE patient_id = ? ORDER BY created_at DESC')
      .all(patientId) as PatientDocument[];
  }

  public async uploadDocument(data: {
    patientId: number;
    filePath: string;
    category?: string;
    notes?: string;
  }): Promise<PatientDocument> {
    const db = this.dbService.getDatabase();
    const originalName = path.basename(data.filePath);
    const ext = path.extname(originalName);
    const uniqueFilename = `doc_${data.patientId}_${Date.now()}${ext}`;
    const destPath = path.join(this.storageDir, uniqueFilename);

    await fs.promises.copyFile(data.filePath, destPath);
    const stats = await fs.promises.stat(destPath);
    const category = data.category || 'Autre';

    const result = db.prepare(`
      INSERT INTO patient_documents (patient_id, filename, original_name, file_type, file_size, category, file_path, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.patientId,
      uniqueFilename,
      originalName,
      ext.replace('.', '').toLowerCase(),
      stats.size,
      category,
      destPath,
      data.notes || null
    );

    return db
      .prepare('SELECT * FROM patient_documents WHERE id = ?')
      .get(result.lastInsertRowid) as PatientDocument;
  }

  public async deleteDocument(id: number): Promise<boolean> {
    const db = this.dbService.getDatabase();
    const doc = db.prepare('SELECT * FROM patient_documents WHERE id = ?').get(id) as PatientDocument | undefined;
    if (doc) {
      if (fs.existsSync(doc.file_path)) {
        try {
          await fs.promises.unlink(doc.file_path);
        } catch (e) {
          console.error('Erreur lors de la suppression du fichier sur disque:', e);
        }
      }
      db.prepare('DELETE FROM patient_documents WHERE id = ?').run(id);
      return true;
    }
    return false;
  }

  public async openDocument(id: number): Promise<string> {
    const db = this.dbService.getDatabase();
    const doc = db.prepare('SELECT * FROM patient_documents WHERE id = ?').get(id) as PatientDocument | undefined;
    if (doc && fs.existsSync(doc.file_path)) {
      const res = await shell.openPath(doc.file_path);
      return res;
    }
    throw new Error('Fichier introuvable');
  }
}
