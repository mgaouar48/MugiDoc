import { DatabaseService } from './DatabaseService';
import { Prescription, CreatePrescriptionRequest, UpdatePrescriptionRequest, PrescriptionSearchFilters, Medication, Patient, Consultation, PrescriptionTemplate } from '../../shared/types';

export class PrescriptionService {
  private dbService: DatabaseService;

  constructor(dbService: DatabaseService) {
    this.dbService = dbService;
  }

  /**
   * Récupère toutes les ordonnances avec filtres optionnels
   */
  public getAllPrescriptions(filters?: PrescriptionSearchFilters): Prescription[] {
    const db = this.dbService.getDatabase();
    
    let query = `
      SELECT 
        p.*,
        pt.first_name as patient_first_name,
        pt.last_name as patient_last_name,
        pt.phone as patient_phone,
        pt.email as patient_email,
        pt.date_of_birth as patient_date_of_birth,
        pt.address as patient_address,
        pt.status as patient_status,
        pt.created_at as patient_created_at,
        pt.updated_at as patient_updated_at,
        c.motif as consultation_motif,
        c.diagnostic as consultation_diagnostic,
        prt.name as template_name
      FROM prescriptions p
      LEFT JOIN patients pt ON p.patient_id = pt.id
      LEFT JOIN consultations c ON p.consultation_id = c.id
      LEFT JOIN prescription_templates prt ON p.template_id = prt.id
      WHERE 1=1
    `;
    
    const params: any[] = [];

    if (filters?.search) {
      query += ` AND (pt.first_name LIKE ? OR pt.last_name LIKE ? OR p.notes LIKE ? OR p.medications LIKE ?)`;
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (filters?.patient_id) {
      query += ` AND p.patient_id = ?`;
      params.push(filters.patient_id);
    }

    if (filters?.date_from) {
      query += ` AND p.date >= ?`;
      params.push(filters.date_from);
    }

    if (filters?.date_to) {
      query += ` AND p.date <= ?`;
      params.push(filters.date_to);
    }

    query += ` ORDER BY p.date DESC, p.created_at DESC`;

    if (filters?.limit) {
      query += ` LIMIT ?`;
      params.push(filters.limit);
      
      if (filters?.offset) {
        query += ` OFFSET ?`;
        params.push(filters.offset);
      }
    }

    const results = db.prepare(query).all(...params) as any[];
    
    return results.map(row => ({
      id: row.id,
      patient_id: row.patient_id,
      consultation_id: row.consultation_id,
      template_id: row.template_id,
      medications: JSON.parse(row.medications) as Medication[],
      date: row.date,
      created_at: row.created_at,
      updated_at: row.updated_at,
      patient: row.patient_first_name ? {
        id: row.patient_id,
        first_name: row.patient_first_name,
        last_name: row.patient_last_name,
        phone: row.patient_phone,
        email: row.patient_email,
        date_of_birth: row.patient_date_of_birth,
        address: row.patient_address,
        status: row.patient_status,
        created_at: row.patient_created_at,
        updated_at: row.patient_updated_at
      } : undefined,
      consultation: row.consultation_id ? {
        id: row.consultation_id,
        patient_id: row.patient_id,
        appointment_id: null,
        date: row.date,
        time: '00:00',
        motif: row.consultation_motif,
        diagnostic: row.consultation_diagnostic,
        traitement: null,
        status: 'completed',
        price: 0,
        notes: null,
        created_at: row.created_at,
        updated_at: row.updated_at
      } : undefined,
      template: row.template_id ? {
        id: row.template_id,
        name: row.template_name,
        description: null,
        medications: [],
        created_at: row.created_at,
        updated_at: row.updated_at
      } : undefined
    }));
  }

  /**
   * Compte le nombre total d'ordonnances correspondant aux filtres (hors pagination)
   */
  public getPrescriptionsCount(filters?: PrescriptionSearchFilters): number {
    const db = this.dbService.getDatabase();

    let query = `
      SELECT COUNT(*) as count
      FROM prescriptions p
      LEFT JOIN patients pt ON p.patient_id = pt.id
      LEFT JOIN consultations c ON p.consultation_id = c.id
      LEFT JOIN prescription_templates prt ON p.template_id = prt.id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (filters?.search) {
      query += ` AND (pt.first_name LIKE ? OR pt.last_name LIKE ? OR p.notes LIKE ? OR p.medications LIKE ?)`;
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (filters?.patient_id) {
      query += ` AND p.patient_id = ?`;
      params.push(filters.patient_id);
    }

    if (filters?.date_from) {
      query += ` AND p.date >= ?`;
      params.push(filters.date_from);
    }

    if (filters?.date_to) {
      query += ` AND p.date <= ?`;
      params.push(filters.date_to);
    }

    const result = db.prepare(query).get(...params) as { count: number };
    return result.count;
  }

  /**
   * Récupère une ordonnance par son ID
   */
  public getPrescriptionById(id: number): Prescription | null {
    const db = this.dbService.getDatabase();
    
    const result = db.prepare(`
      SELECT 
        p.*,
        pt.first_name as patient_first_name,
        pt.last_name as patient_last_name,
        pt.phone as patient_phone,
        pt.email as patient_email,
        pt.date_of_birth as patient_date_of_birth,
        pt.address as patient_address,
        c.motif as consultation_motif,
        c.diagnostic as consultation_diagnostic,
        c.traitement as consultation_traitement,
        prt.name as template_name,
        prt.description as template_description
      FROM prescriptions p
      LEFT JOIN patients pt ON p.patient_id = pt.id
      LEFT JOIN consultations c ON p.consultation_id = c.id
      LEFT JOIN prescription_templates prt ON p.template_id = prt.id
      WHERE p.id = ?
    `).get(id) as any;
    
    if (!result) {
      return null;
    }

    return {
      id: result.id,
      patient_id: result.patient_id,
      consultation_id: result.consultation_id,
      template_id: result.template_id,
      medications: JSON.parse(result.medications) as Medication[],
      date: result.date,
      created_at: result.created_at,
      updated_at: result.updated_at,
      patient: result.patient_first_name ? {
        id: result.patient_id,
        first_name: result.patient_first_name,
        last_name: result.patient_last_name,
        phone: result.patient_phone,
        email: result.patient_email,
        date_of_birth: result.patient_date_of_birth,
        address: result.patient_address,
        status: result.patient_status,
        created_at: result.patient_created_at,
        updated_at: result.patient_updated_at
      } : undefined,
      consultation: result.consultation_id ? {
        id: result.consultation_id,
        patient_id: result.patient_id,
        appointment_id: null,
        date: result.date,
        time: '00:00',
        motif: result.consultation_motif,
        diagnostic: result.consultation_diagnostic,
        traitement: result.consultation_traitement,
        status: 'completed',
        price: 0,
        notes: null,
        created_at: result.created_at,
        updated_at: result.updated_at
      } : undefined,
      template: result.template_id ? {
        id: result.template_id,
        name: result.template_name,
        description: result.template_description,
        medications: [],
        created_at: result.created_at,
        updated_at: result.updated_at
      } : undefined
    };
  }

  /**
   * Récupère toutes les ordonnances d'un patient
   */
  public getPrescriptionsByPatientId(patientId: number): Prescription[] {
    return this.getAllPrescriptions({ patient_id: patientId });
  }

  /**
   * Crée une nouvelle ordonnance
   */
  public createPrescription(prescriptionData: CreatePrescriptionRequest): Prescription {
    const db = this.dbService.getDatabase();

    // Validation des données
    if (!prescriptionData.patient_id) {
      throw new Error('L\'ID du patient est obligatoire');
    }

    if (!prescriptionData.medications || prescriptionData.medications.length === 0) {
      throw new Error('Au moins un médicament est requis');
    }

    if (!prescriptionData.date) {
      throw new Error('La date de l\'ordonnance est obligatoire');
    }

    // Validation des médicaments - seul le nom est obligatoire
    for (const medication of prescriptionData.medications) {
      if (!medication.name?.trim()) {
        throw new Error('Le nom du médicament est obligatoire');
      }
    }

    // Vérifier que le patient existe
    const patientExists = db.prepare('SELECT id FROM patients WHERE id = ?').get(prescriptionData.patient_id);
    if (!patientExists) {
      throw new Error('Patient introuvable');
    }

    // Vérifier que la consultation existe (si spécifiée)
    if (prescriptionData.consultation_id) {
      const consultationExists = db.prepare('SELECT id FROM consultations WHERE id = ?').get(prescriptionData.consultation_id);
      if (!consultationExists) {
        throw new Error('Consultation introuvable');
      }
    }

    // Vérifier que le modèle existe (si spécifié)
    if (prescriptionData.template_id) {
      const templateExists = db.prepare('SELECT id FROM prescription_templates WHERE id = ?').get(prescriptionData.template_id);
      if (!templateExists) {
        throw new Error('Modèle d\'ordonnance introuvable');
      }
    }

    const stmt = db.prepare(`
      INSERT INTO prescriptions (patient_id, consultation_id, template_id, medications, date)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      prescriptionData.patient_id,
      prescriptionData.consultation_id || null,
      prescriptionData.template_id || null,
      JSON.stringify(prescriptionData.medications),
      prescriptionData.date
    );

    // Récupérer l'ordonnance créée
    const createdPrescription = this.getPrescriptionById(result.lastInsertRowid as number);
    if (!createdPrescription) {
      throw new Error('Erreur lors de la création de l\'ordonnance');
    }

    return createdPrescription;
  }

  /**
   * Met à jour une ordonnance
   */
  public updatePrescription(id: number, prescriptionData: UpdatePrescriptionRequest): Prescription {
    const db = this.dbService.getDatabase();

    // Vérifier que l'ordonnance existe
    const existingPrescription = this.getPrescriptionById(id);
    if (!existingPrescription) {
      throw new Error(`Ordonnance avec l'ID ${id} introuvable`);
    }

    // Construire la requête de mise à jour dynamiquement
    const updates: string[] = [];
    const values: any[] = [];

    if (prescriptionData.patient_id !== undefined) {
      // Vérifier que le patient existe
      const patientExists = db.prepare('SELECT id FROM patients WHERE id = ?').get(prescriptionData.patient_id);
      if (!patientExists) {
        throw new Error('Patient introuvable');
      }
      
      updates.push('patient_id = ?');
      values.push(prescriptionData.patient_id);
    }

    if (prescriptionData.consultation_id !== undefined) {
      if (prescriptionData.consultation_id) {
        // Vérifier que la consultation existe
        const consultationExists = db.prepare('SELECT id FROM consultations WHERE id = ?').get(prescriptionData.consultation_id);
        if (!consultationExists) {
          throw new Error('Consultation introuvable');
        }
      }
      
      updates.push('consultation_id = ?');
      values.push(prescriptionData.consultation_id || null);
    }

    if (prescriptionData.template_id !== undefined) {
      if (prescriptionData.template_id) {
        // Vérifier que le modèle existe
        const templateExists = db.prepare('SELECT id FROM prescription_templates WHERE id = ?').get(prescriptionData.template_id);
        if (!templateExists) {
          throw new Error('Modèle d\'ordonnance introuvable');
        }
      }
      
      updates.push('template_id = ?');
      values.push(prescriptionData.template_id || null);
    }

    if (prescriptionData.medications !== undefined) {
      if (prescriptionData.medications.length === 0) {
        throw new Error('Au moins un médicament est requis');
      }

      // Validation des médicaments - seul le nom est obligatoire
      for (const medication of prescriptionData.medications) {
        if (!medication.name?.trim()) {
          throw new Error('Le nom du médicament est obligatoire');
        }
      }

      updates.push('medications = ?');
      values.push(JSON.stringify(prescriptionData.medications));
    }

    if (prescriptionData.date !== undefined) {
      if (!prescriptionData.date) {
        throw new Error('La date de l\'ordonnance est obligatoire');
      }
      
      updates.push('date = ?');
      values.push(prescriptionData.date);
    }


    if (updates.length === 0) {
      return existingPrescription; // Aucune modification
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const stmt = db.prepare(`
      UPDATE prescriptions 
      SET ${updates.join(', ')} 
      WHERE id = ?
    `);

    const result = stmt.run(...values);

    if (result.changes === 0) {
      throw new Error(`Impossible de mettre à jour l'ordonnance avec l'ID ${id}`);
    }

    // Récupérer l'ordonnance mise à jour
    const updatedPrescription = this.getPrescriptionById(id);
    if (!updatedPrescription) {
      throw new Error('Erreur lors de la mise à jour de l\'ordonnance');
    }

    return updatedPrescription;
  }

  /**
   * Supprime une ordonnance
   */
  public deletePrescription(id: number): void {
    const db = this.dbService.getDatabase();

    // Vérifier que l'ordonnance existe
    const existingPrescription = this.getPrescriptionById(id);
    if (!existingPrescription) {
      throw new Error(`Ordonnance avec l'ID ${id} introuvable`);
    }

    const stmt = db.prepare('DELETE FROM prescriptions WHERE id = ?');
    const result = stmt.run(id);

    if (result.changes === 0) {
      throw new Error(`Impossible de supprimer l'ordonnance avec l'ID ${id}`);
    }
  }

  /**
   * Obtient les statistiques des ordonnances
   */
  public getPrescriptionStats(): { total: number; thisMonth: number; mostPrescribedMedications: { name: string; count: number }[] } {
    const db = this.dbService.getDatabase();
    
    const totalCount = db.prepare('SELECT COUNT(*) as count FROM prescriptions').get() as { count: number };
    
    const thisMonthCount = db.prepare(`
      SELECT COUNT(*) as count FROM prescriptions 
      WHERE date >= date('now', 'start of month')
    `).get() as { count: number };

    // Obtenir les médicaments les plus prescrits (analyse du JSON)
    const allPrescriptions = db.prepare('SELECT medications FROM prescriptions').all() as { medications: string }[];
    
    const medicationCounts: { [key: string]: number } = {};
    
    allPrescriptions.forEach(prescription => {
      try {
        const medications = JSON.parse(prescription.medications) as Medication[];
        medications.forEach(medication => {
          const name = medication.name.trim().toUpperCase();
          medicationCounts[name] = (medicationCounts[name] || 0) + 1;
        });
      } catch (error) {
        // Ignorer les erreurs de parsing JSON
      }
    });

    const mostPrescribedMedications = Object.entries(medicationCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      total: totalCount.count,
      thisMonth: thisMonthCount.count,
      mostPrescribedMedications
    };
  }
}
