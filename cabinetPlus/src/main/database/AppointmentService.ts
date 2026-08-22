import { DatabaseService } from './DatabaseService';
import { Appointment, CreateAppointmentRequest, UpdateAppointmentRequest, AppointmentSearchFilters } from '../../shared/types';

export class AppointmentService {
  private dbService: DatabaseService;

  constructor(dbService: DatabaseService) {
    this.dbService = dbService;
  }

  /**
   * Récupère tous les rendez-vous avec filtres optionnels
   */
  public getAllAppointments(filters?: AppointmentSearchFilters): Appointment[] {
    const db = this.dbService.getDatabase();
    let query = `
      SELECT 
        a.*,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        p.phone as patient_phone,
        p.email as patient_email,
        p.date_of_birth as patient_date_of_birth,
        p.address as patient_address,
        p.status as patient_status,
        p.created_at as patient_created_at,
        p.updated_at as patient_updated_at
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.id
    `;
    const params: any[] = [];
    const conditions: string[] = [];

    // Appliquer les filtres
    if (filters?.search) {
      conditions.push('(p.first_name LIKE ? OR p.last_name LIKE ? OR a.type LIKE ? OR a.notes LIKE ?)');
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (filters?.patient_id) {
      conditions.push('a.patient_id = ?');
      params.push(filters.patient_id);
    }

    if (filters?.date) {
      conditions.push('date(a.date) = date(?)');
      params.push(filters.date);
    }

    if (filters?.date_from && filters?.date_to) {
      conditions.push('a.date BETWEEN ? AND ?');
      params.push(filters.date_from, filters.date_to);
    } else if (filters?.date_from) {
      conditions.push('a.date >= ?');
      params.push(filters.date_from);
    } else if (filters?.date_to) {
      conditions.push('a.date <= ?');
      params.push(filters.date_to);
    }

    if (filters?.status && filters.status !== 'all') {
      conditions.push('a.status = ?');
      params.push(filters.status);
    }

    if (filters?.type) {
      conditions.push('a.type = ?');
      params.push(filters.type);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY a.date, a.time';

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
      date: row.date,
      time: row.time,
      duration: row.duration,
      type: row.type,
      status: row.status,
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
      } : undefined
    }));
  }

  /**
   * Compte le nombre total de rendez-vous correspondant aux filtres (hors pagination)
   */
  public getAppointmentsCount(filters?: AppointmentSearchFilters): number {
    const db = this.dbService.getDatabase();
    let query = `
      SELECT COUNT(*) as count
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.id
    `;
    const params: any[] = [];
    const conditions: string[] = [];

    if (filters?.search) {
      conditions.push('(p.first_name LIKE ? OR p.last_name LIKE ? OR a.type LIKE ? OR a.notes LIKE ?)');
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (filters?.patient_id) {
      conditions.push('a.patient_id = ?');
      params.push(filters.patient_id);
    }

    if (filters?.date) {
      conditions.push('date(a.date) = date(?)');
      params.push(filters.date);
    }

    if (filters?.date_from && filters?.date_to) {
      conditions.push('a.date BETWEEN ? AND ?');
      params.push(filters.date_from, filters.date_to);
    } else if (filters?.date_from) {
      conditions.push('a.date >= ?');
      params.push(filters.date_from);
    } else if (filters?.date_to) {
      conditions.push('a.date <= ?');
      params.push(filters.date_to);
    }

    if (filters?.status && filters.status !== 'all') {
      conditions.push('a.status = ?');
      params.push(filters.status);
    }

    if (filters?.type) {
      conditions.push('a.type = ?');
      params.push(filters.type);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    const result = db.prepare(query).get(...params) as { count: number };
    return result.count;
  }

  /**
   * Récupère un rendez-vous par son ID
   */
  public getAppointmentById(id: number): Appointment | null {
    const db = this.dbService.getDatabase();
    const query = `
      SELECT 
        a.*,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        p.phone as patient_phone,
        p.email as patient_email,
        p.date_of_birth as patient_date_of_birth,
        p.address as patient_address,
        p.status as patient_status,
        p.created_at as patient_created_at,
        p.updated_at as patient_updated_at
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.id
      WHERE a.id = ?
    `;
    
    const result = db.prepare(query).get(id) as any;
    
    if (!result) return null;

    return {
      id: result.id,
      patient_id: result.patient_id,
      date: result.date,
      time: result.time,
      duration: result.duration,
      type: result.type,
      status: result.status,
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
      } : undefined
    };
  }

  /**
   * Crée un nouveau rendez-vous
   */
  public createAppointment(appointmentData: CreateAppointmentRequest): Appointment {
    const db = this.dbService.getDatabase();
    
    // Validation des données requises
    if (!appointmentData.patient_id || !appointmentData.date || !appointmentData.time || !appointmentData.type) {
      throw new Error('Les champs patient, date, heure et type sont obligatoires');
    }

    // Vérifier que le patient existe
    const patientExists = db.prepare('SELECT id FROM patients WHERE id = ?').get(appointmentData.patient_id);
    if (!patientExists) {
      throw new Error(`Patient avec l'ID ${appointmentData.patient_id} introuvable`);
    }

    // Validation de la date et de l'heure
    if (!this.isValidDate(appointmentData.date)) {
      throw new Error('Format de date invalide (YYYY-MM-DD attendu)');
    }

    if (!this.isValidTime(appointmentData.time)) {
      throw new Error('Format d\'heure invalide (HH:MM attendu)');
    }

    // Vérifier les conflits de créneaux
    if (this.hasTimeConflict(appointmentData.date, appointmentData.time, appointmentData.duration || 30)) {
      throw new Error('Ce créneau horaire est déjà occupé');
    }

    const stmt = db.prepare(`
      INSERT INTO appointments (patient_id, date, time, duration, type, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      appointmentData.patient_id,
      appointmentData.date,
      appointmentData.time,
      appointmentData.duration || 30,
      appointmentData.type.trim(),
      appointmentData.status || 'en_attente',
      appointmentData.notes?.trim() || null
    );

    // Récupérer le rendez-vous créé
    const createdAppointment = this.getAppointmentById(result.lastInsertRowid as number);
    if (!createdAppointment) {
      throw new Error('Erreur lors de la création du rendez-vous');
    }

    return createdAppointment;
  }

  /**
   * Met à jour un rendez-vous existant
   */
  public updateAppointment(id: number, appointmentData: UpdateAppointmentRequest): Appointment {
    const db = this.dbService.getDatabase();
    
    // Vérifier que le rendez-vous existe
    const existingAppointment = this.getAppointmentById(id);
    if (!existingAppointment) {
      throw new Error(`Rendez-vous avec l'ID ${id} introuvable`);
    }

    // Validation des données si fournies
    if (appointmentData.patient_id) {
      const patientExists = db.prepare('SELECT id FROM patients WHERE id = ?').get(appointmentData.patient_id);
      if (!patientExists) {
        throw new Error(`Patient avec l'ID ${appointmentData.patient_id} introuvable`);
      }
    }

    if (appointmentData.date && !this.isValidDate(appointmentData.date)) {
      throw new Error('Format de date invalide (YYYY-MM-DD attendu)');
    }

    if (appointmentData.time && !this.isValidTime(appointmentData.time)) {
      throw new Error('Format d\'heure invalide (HH:MM attendu)');
    }

    // Vérifier les conflits de créneaux si date/heure changent
    if (appointmentData.date || appointmentData.time || appointmentData.duration) {
      const newDate = appointmentData.date || existingAppointment.date;
      const newTime = appointmentData.time || existingAppointment.time;
      const newDuration = appointmentData.duration || existingAppointment.duration;
      
      if (this.hasTimeConflict(newDate, newTime, newDuration, id)) {
        throw new Error('Ce créneau horaire est déjà occupé');
      }
    }

    // Construire la requête de mise à jour dynamiquement
    const updateFields: string[] = [];
    const params: any[] = [];

    if (appointmentData.patient_id !== undefined) {
      updateFields.push('patient_id = ?');
      params.push(appointmentData.patient_id);
    }
    if (appointmentData.date !== undefined) {
      updateFields.push('date = ?');
      params.push(appointmentData.date);
    }
    if (appointmentData.time !== undefined) {
      updateFields.push('time = ?');
      params.push(appointmentData.time);
    }
    if (appointmentData.duration !== undefined) {
      updateFields.push('duration = ?');
      params.push(appointmentData.duration);
    }
    if (appointmentData.type !== undefined) {
      updateFields.push('type = ?');
      params.push(appointmentData.type.trim());
    }
    if (appointmentData.status !== undefined) {
      updateFields.push('status = ?');
      params.push(appointmentData.status);
    }
    if (appointmentData.notes !== undefined) {
      updateFields.push('notes = ?');
      params.push(appointmentData.notes?.trim() || null);
    }

    if (updateFields.length === 0) {
      throw new Error('Aucune donnée à mettre à jour');
    }

    // Ajouter la mise à jour du timestamp
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const query = `UPDATE appointments SET ${updateFields.join(', ')} WHERE id = ?`;
    const stmt = db.prepare(query);
    const result = stmt.run(...params);

    if (result.changes === 0) {
      throw new Error(`Impossible de mettre à jour le rendez-vous avec l'ID ${id}`);
    }

    // Récupérer le rendez-vous mis à jour
    const updatedAppointment = this.getAppointmentById(id);
    if (!updatedAppointment) {
      throw new Error('Erreur lors de la récupération du rendez-vous mis à jour');
    }

    return updatedAppointment;
  }

  /**
   * Supprime un rendez-vous
   */
  public deleteAppointment(id: number): void {
    const db = this.dbService.getDatabase();
    
    // Vérifier que le rendez-vous existe
    const existingAppointment = this.getAppointmentById(id);
    if (!existingAppointment) {
      throw new Error(`Rendez-vous avec l'ID ${id} introuvable`);
    }

    // Vérifier s'il y a une consultation liée
    const consultationExists = db.prepare('SELECT id FROM consultations WHERE appointment_id = ?').get(id);
    if (consultationExists) {
      throw new Error('Impossible de supprimer un rendez-vous ayant une consultation associée');
    }

    const stmt = db.prepare('DELETE FROM appointments WHERE id = ?');
    const result = stmt.run(id);

    if (result.changes === 0) {
      throw new Error(`Impossible de supprimer le rendez-vous avec l'ID ${id}`);
    }
  }

  /**
   * Récupère les rendez-vous d'un patient
   */
  public getAppointmentsByPatient(patientId: number): Appointment[] {
    return this.getAllAppointments({ patient_id: patientId });
  }

  /**
   * Récupère les rendez-vous d'une date donnée
   */
  public getAppointmentsByDate(date: string): Appointment[] {
    return this.getAllAppointments({ date });
  }

  /**
   * Récupère les statistiques des rendez-vous
   */
  public getAppointmentStats(): { total: number; confirmed: number; pending: number; cancelled: number; completed: number } {
    const db = this.dbService.getDatabase();
    
    const total = db.prepare('SELECT COUNT(*) as count FROM appointments').get() as { count: number };
    const confirmed = db.prepare('SELECT COUNT(*) as count FROM appointments WHERE status = ?').get('confirmé') as { count: number };
    const pending = db.prepare('SELECT COUNT(*) as count FROM appointments WHERE status = ?').get('en_attente') as { count: number };
    const cancelled = db.prepare('SELECT COUNT(*) as count FROM appointments WHERE status = ?').get('annulé') as { count: number };
    const completed = db.prepare('SELECT COUNT(*) as count FROM appointments WHERE status = ?').get('terminé') as { count: number };

    return {
      total: total.count,
      confirmed: confirmed.count,
      pending: pending.count,
      cancelled: cancelled.count,
      completed: completed.count
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

  /**
   * Vérifie s'il y a un conflit de créneaux horaires
   */
  private hasTimeConflict(date: string, time: string, duration: number, excludeId?: number): boolean {
    const db = this.dbService.getDatabase();
    
    // Calculer l'heure de fin du nouveau rendez-vous
    const [hours, minutes] = time.split(':').map(Number);
    const startTime = hours * 60 + minutes; // en minutes depuis minuit
    const endTime = startTime + duration;

    let query = `
      SELECT id, time, duration 
      FROM appointments 
      WHERE date = ? AND status != 'annulé'
    `;
    const params = [date];

    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId.toString());
    }

    const existingAppointments = db.prepare(query).all(...params) as any[];

    for (const appointment of existingAppointments) {
      const [existingHours, existingMinutes] = appointment.time.split(':').map(Number);
      const existingStartTime = existingHours * 60 + existingMinutes;
      const existingEndTime = existingStartTime + appointment.duration;

      // Vérifier le chevauchement
      if (startTime < existingEndTime && endTime > existingStartTime) {
        return true;
      }
    }

    return false;
  }
}
