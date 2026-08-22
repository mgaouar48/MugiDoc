import { DatabaseService } from './DatabaseService';
import { PrescriptionTemplate, CreatePrescriptionTemplateRequest, UpdatePrescriptionTemplateRequest, Medication } from '../../shared/types';

export class PrescriptionTemplateService {
  private dbService: DatabaseService;

  constructor(dbService: DatabaseService) {
    this.dbService = dbService;
  }

  /**
   * Récupère tous les modèles d'ordonnances
   */
  public getAllTemplates(): PrescriptionTemplate[] {
    const db = this.dbService.getDatabase();
    const results = db.prepare('SELECT * FROM prescription_templates ORDER BY name ASC').all() as any[];
    
    return results.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      medications: JSON.parse(row.medications) as Medication[],
      created_at: row.created_at,
      updated_at: row.updated_at
    }));
  }

  /**
   * Récupère un modèle d'ordonnance par son ID
   */
  public getTemplateById(id: number): PrescriptionTemplate | null {
    const db = this.dbService.getDatabase();
    const result = db.prepare('SELECT * FROM prescription_templates WHERE id = ?').get(id) as any;
    
    if (!result) {
      return null;
    }

    return {
      id: result.id,
      name: result.name,
      description: result.description,
      medications: JSON.parse(result.medications) as Medication[],
      created_at: result.created_at,
      updated_at: result.updated_at
    };
  }

  /**
   * Crée un nouveau modèle d'ordonnance
   */
  public createTemplate(templateData: CreatePrescriptionTemplateRequest): PrescriptionTemplate {
    const db = this.dbService.getDatabase();

    // Validation des données
    if (!templateData.name?.trim()) {
      throw new Error('Le nom du modèle est obligatoire');
    }

    if (!templateData.medications || templateData.medications.length === 0) {
      throw new Error('Au moins un médicament est requis');
    }

    // Validation des médicaments
    for (const medication of templateData.medications) {
      if (!medication.name?.trim()) {
        throw new Error('Le nom du médicament est obligatoire');
      }
    }

    // Vérifier l'unicité du nom
    const existingTemplate = db.prepare('SELECT id FROM prescription_templates WHERE name = ?').get(templateData.name.trim());
    if (existingTemplate) {
      throw new Error('Un modèle avec ce nom existe déjà');
    }

    const stmt = db.prepare(`
      INSERT INTO prescription_templates (name, description, medications)
      VALUES (?, ?, ?)
    `);

    const result = stmt.run(
      templateData.name.trim(),
      templateData.description?.trim() || null,
      JSON.stringify(templateData.medications)
    );

    // Récupérer le modèle créé
    const createdTemplate = this.getTemplateById(result.lastInsertRowid as number);
    if (!createdTemplate) {
      throw new Error('Erreur lors de la création du modèle');
    }

    return createdTemplate;
  }

  /**
   * Met à jour un modèle d'ordonnance
   */
  public updateTemplate(id: number, templateData: UpdatePrescriptionTemplateRequest): PrescriptionTemplate {
    const db = this.dbService.getDatabase();

    // Vérifier que le modèle existe
    const existingTemplate = this.getTemplateById(id);
    if (!existingTemplate) {
      throw new Error(`Modèle avec l'ID ${id} introuvable`);
    }

    // Construire la requête de mise à jour dynamiquement
    const updates: string[] = [];
    const values: any[] = [];

    if (templateData.name !== undefined) {
      if (!templateData.name.trim()) {
        throw new Error('Le nom du modèle ne peut pas être vide');
      }
      
      // Vérifier l'unicité du nom (sauf pour le modèle actuel)
      const existingWithName = db.prepare('SELECT id FROM prescription_templates WHERE name = ? AND id != ?').get(templateData.name.trim(), id);
      if (existingWithName) {
        throw new Error('Un modèle avec ce nom existe déjà');
      }
      
      updates.push('name = ?');
      values.push(templateData.name.trim());
    }

    if (templateData.description !== undefined) {
      updates.push('description = ?');
      values.push(templateData.description?.trim() || null);
    }

    if (templateData.medications !== undefined) {
      if (templateData.medications.length === 0) {
        throw new Error('Au moins un médicament est requis');
      }

      // Validation des médicaments
      for (const medication of templateData.medications) {
        if (!medication.name?.trim()) {
          throw new Error('Le nom du médicament est obligatoire');
        }
      }

      updates.push('medications = ?');
      values.push(JSON.stringify(templateData.medications));
    }

    if (updates.length === 0) {
      return existingTemplate; // Aucune modification
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const stmt = db.prepare(`
      UPDATE prescription_templates 
      SET ${updates.join(', ')} 
      WHERE id = ?
    `);

    const result = stmt.run(...values);

    if (result.changes === 0) {
      throw new Error(`Impossible de mettre à jour le modèle avec l'ID ${id}`);
    }

    // Récupérer le modèle mis à jour
    const updatedTemplate = this.getTemplateById(id);
    if (!updatedTemplate) {
      throw new Error('Erreur lors de la mise à jour du modèle');
    }

    return updatedTemplate;
  }

  /**
   * Supprime un modèle d'ordonnance
   */
  public deleteTemplate(id: number): void {
    const db = this.dbService.getDatabase();

    // Vérifier que le modèle existe
    const existingTemplate = this.getTemplateById(id);
    if (!existingTemplate) {
      throw new Error(`Modèle avec l'ID ${id} introuvable`);
    }

    // Vérifier s'il y a des ordonnances qui utilisent ce modèle
    const prescriptionCount = db.prepare('SELECT COUNT(*) as count FROM prescriptions WHERE template_id = ?').get(id) as { count: number };
    if (prescriptionCount.count > 0) {
      throw new Error('Impossible de supprimer un modèle utilisé par des ordonnances existantes');
    }

    const stmt = db.prepare('DELETE FROM prescription_templates WHERE id = ?');
    const result = stmt.run(id);

    if (result.changes === 0) {
      throw new Error(`Impossible de supprimer le modèle avec l'ID ${id}`);
    }
  }

  /**
   * Recherche des modèles par nom
   */
  public searchTemplates(query: string): PrescriptionTemplate[] {
    const db = this.dbService.getDatabase();
    const searchTerm = `%${query.trim()}%`;
    
    const results = db.prepare(`
      SELECT * FROM prescription_templates 
      WHERE name LIKE ? OR description LIKE ?
      ORDER BY name ASC
    `).all(searchTerm, searchTerm) as any[];
    
    return results.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      medications: JSON.parse(row.medications) as Medication[],
      created_at: row.created_at,
      updated_at: row.updated_at
    }));
  }

  /**
   * Obtient les statistiques des modèles
   */
  public getTemplateStats(): { total: number; mostUsed: { templateId: number; templateName: string; usageCount: number }[] } {
    const db = this.dbService.getDatabase();
    
    const totalCount = db.prepare('SELECT COUNT(*) as count FROM prescription_templates').get() as { count: number };
    
    const mostUsed = db.prepare(`
      SELECT 
        pt.id as templateId,
        pt.name as templateName,
        COUNT(p.id) as usageCount
      FROM prescription_templates pt
      LEFT JOIN prescriptions p ON pt.id = p.template_id
      GROUP BY pt.id, pt.name
      ORDER BY usageCount DESC
      LIMIT 5
    `).all() as { templateId: number; templateName: string; usageCount: number }[];

    return {
      total: totalCount.count,
      mostUsed
    };
  }
}
