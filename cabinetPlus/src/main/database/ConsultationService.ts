import { DatabaseService } from './DatabaseService';
import { PaymentService } from './PaymentService';
import { SettingsService } from './SettingsService';
import { Consultation, CreateConsultationRequest, UpdateConsultationRequest, ConsultationSearchFilters } from '../../shared/types';

export class ConsultationService {
  private dbService: DatabaseService;
  private paymentService: PaymentService;
  private settingsService: SettingsService;

  constructor(dbService: DatabaseService) {
    this.dbService = dbService;
    this.paymentService = new PaymentService(dbService);
    this.settingsService = new SettingsService(dbService);
  }

  /**
   * Récupère toutes les consultations avec filtres optionnels
   */
  public getAllConsultations(filters?: ConsultationSearchFilters): Consultation[] {
    const db = this.dbService.getDatabase();
    let query = `
      SELECT 
        c.*,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        p.phone as patient_phone,
        p.email as patient_email,
        p.date_of_birth as patient_date_of_birth,
        p.address as patient_address,
        p.status as patient_status,
        p.created_at as patient_created_at,
        p.updated_at as patient_updated_at,
        a.patient_id as appointment_patient_id,
        a.date as appointment_date,
        a.time as appointment_time,
        a.type as appointment_type,
        a.duration as appointment_duration,
        a.status as appointment_status,
        a.notes as appointment_notes,
        a.created_at as appointment_created_at,
        a.updated_at as appointment_updated_at
      FROM consultations c
      LEFT JOIN patients p ON c.patient_id = p.id
      LEFT JOIN appointments a ON c.appointment_id = a.id
    `;
    const params: any[] = [];
    const conditions: string[] = [];

    // Appliquer les filtres
    if (filters?.search) {
      conditions.push('(p.first_name LIKE ? OR p.last_name LIKE ? OR c.motif LIKE ? OR c.diagnostic LIKE ? OR c.traitement LIKE ?)');
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (filters?.patient_id) {
      conditions.push('c.patient_id = ?');
      params.push(filters.patient_id);
    }

    if (filters?.appointment_id) {
      conditions.push('c.appointment_id = ?');
      params.push(filters.appointment_id);
    }

    if (filters?.date) {
      conditions.push('c.date = ?');
      params.push(filters.date);
    }

    if (filters?.date_from && filters?.date_to) {
      conditions.push('c.date BETWEEN ? AND ?');
      params.push(filters.date_from, filters.date_to);
    } else if (filters?.date_from) {
      conditions.push('c.date >= ?');
      params.push(filters.date_from);
    } else if (filters?.date_to) {
      conditions.push('c.date <= ?');
      params.push(filters.date_to);
    }

    if (filters?.status && filters.status !== 'all') {
      conditions.push('c.status = ?');
      params.push(filters.status);
    }

    // Commenté temporairement - le champ is_paid n'existe pas dans le schéma actuel
    // if (filters?.is_paid !== undefined) {
    //   conditions.push('c.is_paid = ?');
    //   params.push(filters.is_paid ? 1 : 0);
    // }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY c.date DESC, c.time DESC';

    // Appliquer la pagination
    if (filters?.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
      
      if (filters?.offset) {
        query += ' OFFSET ?';
        params.push(filters.offset);
      }
    }

    const results = db.prepare(query).all(...params) as any[];
    
    return results.map(row => ({
      id: row.id,
      patient_id: row.patient_id,
      appointment_id: row.appointment_id,
      date: row.date,
      time: row.time,
      motif: row.motif,
      diagnostic: row.diagnostic,
      traitement: row.traitement,
      status: row.status,
      price: row.price,
      notes: row.notes,
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
      appointment: row.appointment_id ? {
        id: row.appointment_id,
        patient_id: row.appointment_patient_id,
        date: row.appointment_date,
        time: row.appointment_time,
        duration: row.appointment_duration,
        type: row.appointment_type,
        status: row.appointment_status,
        notes: row.appointment_notes,
        created_at: row.appointment_created_at,
        updated_at: row.appointment_updated_at
      } : undefined
    }));
  }

  /**
   * Compte le nombre total de consultations correspondant aux filtres (hors pagination)
   */
  public getConsultationsCount(filters?: ConsultationSearchFilters): number {
    const db = this.dbService.getDatabase();
    let query = `
      SELECT COUNT(*) as count
      FROM consultations c
      LEFT JOIN patients p ON c.patient_id = p.id
      LEFT JOIN appointments a ON c.appointment_id = a.id
    `;
    const params: any[] = [];
    const conditions: string[] = [];

    if (filters?.search) {
      conditions.push('(p.first_name LIKE ? OR p.last_name LIKE ? OR c.motif LIKE ? OR c.diagnostic LIKE ? OR c.traitement LIKE ?)');
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (filters?.patient_id) {
      conditions.push('c.patient_id = ?');
      params.push(filters.patient_id);
    }

    if (filters?.appointment_id) {
      conditions.push('c.appointment_id = ?');
      params.push(filters.appointment_id);
    }

    if (filters?.date) {
      conditions.push('c.date = ?');
      params.push(filters.date);
    }

    if (filters?.date_from && filters?.date_to) {
      conditions.push('c.date BETWEEN ? AND ?');
      params.push(filters.date_from, filters.date_to);
    } else if (filters?.date_from) {
      conditions.push('c.date >= ?');
      params.push(filters.date_from);
    } else if (filters?.date_to) {
      conditions.push('c.date <= ?');
      params.push(filters.date_to);
    }

    if (filters?.status && filters.status !== 'all') {
      conditions.push('c.status = ?');
      params.push(filters.status);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    const result = db.prepare(query).get(...params) as { count: number };
    return result.count;
  }

  /**
   * Récupère une consultation par son ID
   */
  public getConsultationById(id: number): Consultation | null {
    const db = this.dbService.getDatabase();
    const query = `
      SELECT 
        c.*,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        p.phone as patient_phone,
        p.email as patient_email,
        p.date_of_birth as patient_date_of_birth,
        p.address as patient_address,
        p.status as patient_status,
        p.created_at as patient_created_at,
        p.updated_at as patient_updated_at,
        a.patient_id as appointment_patient_id,
        a.date as appointment_date,
        a.time as appointment_time,
        a.type as appointment_type,
        a.duration as appointment_duration,
        a.status as appointment_status,
        a.notes as appointment_notes,
        a.created_at as appointment_created_at,
        a.updated_at as appointment_updated_at
      FROM consultations c
      LEFT JOIN patients p ON c.patient_id = p.id
      LEFT JOIN appointments a ON c.appointment_id = a.id
      WHERE c.id = ?
    `;
    
    const result = db.prepare(query).get(id) as any;
    
    if (!result) return null;

    return {
      id: result.id,
      patient_id: result.patient_id,
      appointment_id: result.appointment_id,
      date: result.date,
      time: result.time,
      motif: result.motif,
      diagnostic: result.diagnostic,
      traitement: result.traitement,
      status: result.status,
      price: result.price,
      notes: result.notes,
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
      appointment: result.appointment_id ? {
        id: result.appointment_id,
        patient_id: result.appointment_patient_id,
        date: result.appointment_date,
        time: result.appointment_time,
        duration: result.appointment_duration,
        type: result.appointment_type,
        status: result.appointment_status,
        notes: result.appointment_notes,
        created_at: result.appointment_created_at,
        updated_at: result.appointment_updated_at
      } : undefined
    };
  }

  /**
   * Crée une nouvelle consultation
   */
  public createConsultation(consultationData: CreateConsultationRequest): Consultation {
    const db = this.dbService.getDatabase();
    
    // Validation des données requises
    if (!consultationData.patient_id || !consultationData.date || !consultationData.time) {
      throw new Error('Les champs patient, date et heure sont obligatoires');
    }

    // Vérifier que le patient existe
    const patientExists = db.prepare('SELECT id FROM patients WHERE id = ?').get(consultationData.patient_id);
    if (!patientExists) {
      throw new Error(`Patient avec l'ID ${consultationData.patient_id} introuvable`);
    }

    // Vérifier que le rendez-vous existe si fourni
    if (consultationData.appointment_id) {
      const appointmentExists = db.prepare('SELECT id FROM appointments WHERE id = ?').get(consultationData.appointment_id);
      if (!appointmentExists) {
        throw new Error(`Rendez-vous avec l'ID ${consultationData.appointment_id} introuvable`);
      }
    }

    // Validation de la date et de l'heure
    if (!this.isValidDate(consultationData.date)) {
      throw new Error('Format de date invalide (YYYY-MM-DD attendu)');
    }

    if (!this.isValidTime(consultationData.time)) {
      throw new Error('Format d\'heure invalide (HH:MM attendu)');
    }

    // Validation du prix
    if (consultationData.price !== undefined && consultationData.price < 0) {
      throw new Error('Le prix ne peut pas être négatif');
    }

    const stmt = db.prepare(`
      INSERT INTO consultations (patient_id, appointment_id, date, time, motif, diagnostic, traitement, status, price, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      consultationData.patient_id,
      consultationData.appointment_id || null,
      consultationData.date,
      consultationData.time,
      (consultationData.motif || '').trim(),
      consultationData.diagnostic?.trim() || null,
      consultationData.traitement?.trim() || null,
      consultationData.status || 'scheduled',
      consultationData.price || 0,
      consultationData.notes?.trim() || null
    );

    // Récupérer la consultation créée
    const createdConsultation = this.getConsultationById(result.lastInsertRowid as number);
    if (!createdConsultation) {
      throw new Error('Erreur lors de la création de la consultation');
    }

    if (createdConsultation.status === 'completed') {
      this.cascadeConsultationCompletion(createdConsultation.patient_id, createdConsultation.date);
    }

    // Créer automatiquement un paiement en attente
    try {
      const defaultPrice = this.settingsService.getSetting('default_consultation_price');
      const consultationPrice = consultationData.price || (defaultPrice ? parseFloat(defaultPrice.value) : 8000);

      if (consultationPrice > 0) {
        this.paymentService.createPayment({
          patient_id: consultationData.patient_id,
          amount: consultationPrice,
          method: 'cash', // Méthode par défaut
          status: 'pending',
          date: consultationData.date,
          debt_amount: 0,
          notes: `Paiement pour consultation du ${consultationData.date}${consultationData.motif ? ' - ' + consultationData.motif : ''}`
        });
      }
    } catch (error) {
      console.warn('Erreur lors de la création du paiement automatique:', error);
      // Ne pas faire échouer la création de la consultation si le paiement échoue
    }

    return createdConsultation;
  }

  /**
   * Met à jour une consultation existante
   */
  public updateConsultation(id: number, consultationData: UpdateConsultationRequest): Consultation {
    const db = this.dbService.getDatabase();
    
    // Vérifier que la consultation existe
    const existingConsultation = this.getConsultationById(id);
    if (!existingConsultation) {
      throw new Error(`Consultation avec l'ID ${id} introuvable`);
    }

    // Validation des données si fournies
    if (consultationData.patient_id) {
      const patientExists = db.prepare('SELECT id FROM patients WHERE id = ?').get(consultationData.patient_id);
      if (!patientExists) {
        throw new Error(`Patient avec l'ID ${consultationData.patient_id} introuvable`);
      }
    }

    if (consultationData.appointment_id) {
      const appointmentExists = db.prepare('SELECT id FROM appointments WHERE id = ?').get(consultationData.appointment_id);
      if (!appointmentExists) {
        throw new Error(`Rendez-vous avec l'ID ${consultationData.appointment_id} introuvable`);
      }
    }

    if (consultationData.date && !this.isValidDate(consultationData.date)) {
      throw new Error('Format de date invalide (YYYY-MM-DD attendu)');
    }

    if (consultationData.time && !this.isValidTime(consultationData.time)) {
      throw new Error('Format d\'heure invalide (HH:MM attendu)');
    }

    if (consultationData.price !== undefined && consultationData.price < 0) {
      throw new Error('Le prix ne peut pas être négatif');
    }

    // Construire la requête de mise à jour dynamiquement
    const updateFields: string[] = [];
    const params: any[] = [];

    if (consultationData.patient_id !== undefined) {
      updateFields.push('patient_id = ?');
      params.push(consultationData.patient_id);
    }
    if (consultationData.appointment_id !== undefined) {
      updateFields.push('appointment_id = ?');
      params.push(consultationData.appointment_id);
    }
    if (consultationData.date !== undefined) {
      updateFields.push('date = ?');
      params.push(consultationData.date);
    }
    if (consultationData.time !== undefined) {
      updateFields.push('time = ?');
      params.push(consultationData.time);
    }
    if (consultationData.motif !== undefined) {
      updateFields.push('motif = ?');
      params.push(consultationData.motif.trim());
    }
    if (consultationData.diagnostic !== undefined) {
      updateFields.push('diagnostic = ?');
      params.push(consultationData.diagnostic?.trim() || null);
    }
    if (consultationData.traitement !== undefined) {
      updateFields.push('traitement = ?');
      params.push(consultationData.traitement?.trim() || null);
    }
    if (consultationData.status !== undefined) {
      updateFields.push('status = ?');
      params.push(consultationData.status);
    }
    if (consultationData.price !== undefined) {
      updateFields.push('price = ?');
      params.push(consultationData.price);
    }
    // Commenté temporairement - le champ is_paid n'existe pas dans le schéma actuel
    // if (consultationData.is_paid !== undefined) {
    //   updateFields.push('is_paid = ?');
    //   params.push(consultationData.is_paid ? 1 : 0);
    // }
    if (consultationData.notes !== undefined) {
      updateFields.push('notes = ?');
      params.push(consultationData.notes?.trim() || null);
    }

    if (updateFields.length === 0) {
      throw new Error('Aucune donnée à mettre à jour');
    }

    // Ajouter la mise à jour du timestamp
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const query = `UPDATE consultations SET ${updateFields.join(', ')} WHERE id = ?`;
    const stmt = db.prepare(query);
    const result = stmt.run(...params);

    if (result.changes === 0) {
      throw new Error(`Impossible de mettre à jour la consultation avec l'ID ${id}`);
    }

    // Récupérer la consultation mise à jour
    const updatedConsultation = this.getConsultationById(id);
    if (!updatedConsultation) {
      throw new Error('Erreur lors de la récupération de la consultation mise à jour');
    }

    if (updatedConsultation.status === 'completed') {
      this.cascadeConsultationCompletion(updatedConsultation.patient_id, updatedConsultation.date);
    }

    return updatedConsultation;
  }

  /**
   * Répercute la clôture d'une consultation : le patient n'est plus à attendre
   * en salle d'attente, et son rendez-vous du jour passe à "terminé".
   */
  private cascadeConsultationCompletion(patientId: number, date: string): void {
    const db = this.dbService.getDatabase();
    const nowIso = new Date().toISOString();

    db.prepare(`
      UPDATE waiting_room
      SET status = 'termine', updated_at = ?
      WHERE patient_id = ?
        AND status IN ('en_attente', 'en_consultation')
        AND date(arrival_time) = date('now', 'localtime')
    `).run(nowIso, patientId);

    db.prepare(`
      UPDATE appointments
      SET status = 'terminé', updated_at = CURRENT_TIMESTAMP
      WHERE patient_id = ?
        AND date = ?
        AND status IN ('confirmé', 'en_attente')
    `).run(patientId, date);
  }

  /**
   * Supprime une consultation
   */
  public deleteConsultation(id: number): void {
    const db = this.dbService.getDatabase();

    // Vérifier que la consultation existe
    const existingConsultation = this.getConsultationById(id);
    if (!existingConsultation) {
      throw new Error(`Consultation avec l'ID ${id} introuvable`);
    }

    const stmt = db.prepare('DELETE FROM consultations WHERE id = ?');
    const result = stmt.run(id);

    if (result.changes === 0) {
      throw new Error(`Impossible de supprimer la consultation avec l'ID ${id}`);
    }
  }

  /**
   * Récupère les consultations d'un patient
   */
  public getConsultationsByPatient(patientId: number): Consultation[] {
    return this.getAllConsultations({ patient_id: patientId });
  }

  /**
   * Récupère les consultations d'un rendez-vous
   */
  public getConsultationsByAppointment(appointmentId: number): Consultation[] {
    return this.getAllConsultations({ appointment_id: appointmentId });
  }

  /**
   * Récupère les statistiques des consultations
   */
  public getConsultationStats(): {
    total: number;
    completed: number;
    inProgress: number;
    scheduled: number;
  } {
    const db = this.dbService.getDatabase();

    const total = db.prepare('SELECT COUNT(*) as count FROM consultations').get() as { count: number };
    const completed = db.prepare('SELECT COUNT(*) as count FROM consultations WHERE status = ?').get('completed') as { count: number };
    const inProgress = db.prepare('SELECT COUNT(*) as count FROM consultations WHERE status = ?').get('in-progress') as { count: number };
    const scheduled = db.prepare('SELECT COUNT(*) as count FROM consultations WHERE status = ?').get('scheduled') as { count: number };

    return {
      total: total.count,
      completed: completed.count,
      inProgress: inProgress.count,
      scheduled: scheduled.count
    };
  }

  /**
   * Valide un format de date (YYYY-MM-DD)
   */
  private isValidDate(dateString: string): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) {
      return false;
    }

    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime()) && date.toISOString().slice(0, 10) === dateString;
  }

  /**
   * Valide un format d'heure (HH:MM)
   */
  private isValidTime(timeString: string): boolean {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(timeString);
  }
}
