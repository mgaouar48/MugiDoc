import { DatabaseService } from './DatabaseService';
import { Patient, CreatePatientRequest, UpdatePatientRequest, PatientSearchFilters } from '../../shared/types';

export class PatientService {
  private dbService: DatabaseService;

  constructor(dbService: DatabaseService) {
    this.dbService = dbService;
  }

  /**
   * Récupère tous les patients avec filtres optionnels
   */
  public getAllPatients(filters?: PatientSearchFilters): Patient[] {
    const db = this.dbService.getDatabase();
    let query = 'SELECT * FROM patients';
    const params: any[] = [];
    const conditions: string[] = [];

    // Appliquer les filtres
    if (filters?.search) {
      conditions.push('(first_name LIKE ? OR last_name LIKE ? OR phone LIKE ? OR email LIKE ?)');
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (filters?.status && filters.status !== 'all') {
      conditions.push('status = ?');
      params.push(filters.status);
    }

    if (filters?.gender && filters.gender !== 'all') {
      conditions.push('gender = ?');
      params.push(filters.gender);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY last_name, first_name';

    // Appliquer la pagination
    if (filters?.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
      
      if (filters?.offset) {
        query += ' OFFSET ?';
        params.push(filters.offset);
      }
    }

    return db.prepare(query).all(...params) as Patient[];
  }

  /**
   * Compte le nombre total de patients correspondant aux filtres (hors pagination),
   * pour calculer le nombre de pages côté renderer
   */
  public getPatientsCount(filters?: PatientSearchFilters): number {
    const db = this.dbService.getDatabase();
    let query = 'SELECT COUNT(*) as count FROM patients';
    const params: any[] = [];
    const conditions: string[] = [];

    if (filters?.search) {
      conditions.push('(first_name LIKE ? OR last_name LIKE ? OR phone LIKE ? OR email LIKE ?)');
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (filters?.status && filters.status !== 'all') {
      conditions.push('status = ?');
      params.push(filters.status);
    }

    if (filters?.gender && filters.gender !== 'all') {
      conditions.push('gender = ?');
      params.push(filters.gender);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    const result = db.prepare(query).get(...params) as { count: number };
    return result.count;
  }

  /**
   * Récupère un patient par son ID
   */
  public getPatientById(id: number): Patient | null {
    const db = this.dbService.getDatabase();
    return db.prepare('SELECT * FROM patients WHERE id = ?').get(id) as Patient | null;
  }

  /**
   * Crée un nouveau patient
   */
  public createPatient(patientData: CreatePatientRequest): Patient {
    const db = this.dbService.getDatabase();
    
    // Validation des données requises
    if (!patientData.first_name || !patientData.last_name || !patientData.date_of_birth) {
      throw new Error('Les champs prénom, nom et date de naissance sont obligatoires');
    }

    // Validation de l'email si fourni
    if (patientData.email && !this.isValidEmail(patientData.email)) {
      throw new Error('Format d\'email invalide');
    }

    // Validation de la date de naissance
    if (!this.isValidDate(patientData.date_of_birth)) {
      throw new Error('Format de date de naissance invalide');
    }

    // Validation des nouveaux champs optionnels
    if (patientData.weight !== undefined && (patientData.weight < 0 || patientData.weight > 1000)) {
      throw new Error('Le poids doit être entre 0 et 1000 kg');
    }

    if (patientData.height !== undefined && (patientData.height < 0 || patientData.height > 300)) {
      throw new Error('La taille doit être entre 0 et 300 cm');
    }

    // Vérification des doublons
    this.checkForDuplicatePatient(patientData.first_name, patientData.last_name, patientData.date_of_birth, patientData.phone);

    const stmt = db.prepare(`
      INSERT INTO patients (first_name, last_name, gender, date_of_birth, phone, email, address, weight, height, diseases, medical_history, allergies, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      patientData.first_name.trim(),
      patientData.last_name.trim(),
      patientData.gender || 'M',
      patientData.date_of_birth,
      patientData.phone?.trim() || null,
      patientData.email?.trim() || null,
      patientData.address?.trim() || null,
      patientData.weight || null,
      patientData.height || null,
      patientData.diseases?.trim() || null,
      patientData.medical_history?.trim() || null,
      patientData.allergies?.trim() || null,
      patientData.status || 'actif'
    );

    // Récupérer le patient créé
    const createdPatient = this.getPatientById(result.lastInsertRowid as number);
    if (!createdPatient) {
      throw new Error('Erreur lors de la création du patient');
    }

    return createdPatient;
  }

  /**
   * Met à jour un patient existant
   */
  public updatePatient(id: number, patientData: UpdatePatientRequest): Patient {
    const db = this.dbService.getDatabase();
    
    // Vérifier que le patient existe
    const existingPatient = this.getPatientById(id);
    if (!existingPatient) {
      throw new Error(`Patient avec l'ID ${id} introuvable`);
    }

    // Validation de l'email si fourni
    if (patientData.email && !this.isValidEmail(patientData.email)) {
      throw new Error('Format d\'email invalide');
    }

    // Validation de la date de naissance si fournie
    if (patientData.date_of_birth && !this.isValidDate(patientData.date_of_birth)) {
      throw new Error('Format de date de naissance invalide');
    }

    // Construire la requête de mise à jour dynamiquement
    const updateFields: string[] = [];
    const params: any[] = [];

    if (patientData.first_name !== undefined) {
      updateFields.push('first_name = ?');
      params.push(patientData.first_name.trim());
    }
    if (patientData.last_name !== undefined) {
      updateFields.push('last_name = ?');
      params.push(patientData.last_name.trim());
    }
    if (patientData.gender !== undefined) {
      updateFields.push('gender = ?');
      params.push(patientData.gender);
    }
    if (patientData.date_of_birth !== undefined) {
      updateFields.push('date_of_birth = ?');
      params.push(patientData.date_of_birth);
    }
    if (patientData.phone !== undefined) {
      updateFields.push('phone = ?');
      params.push(patientData.phone?.trim() || null);
    }
    if (patientData.email !== undefined) {
      updateFields.push('email = ?');
      params.push(patientData.email?.trim() || null);
    }
    if (patientData.address !== undefined) {
      updateFields.push('address = ?');
      params.push(patientData.address?.trim() || null);
    }
    if (patientData.status !== undefined) {
      updateFields.push('status = ?');
      params.push(patientData.status);
    }
    if (patientData.weight !== undefined) {
      if (patientData.weight < 0 || patientData.weight > 1000) {
        throw new Error('Le poids doit être entre 0 et 1000 kg');
      }
      updateFields.push('weight = ?');
      params.push(patientData.weight);
    }
    if (patientData.height !== undefined) {
      if (patientData.height < 0 || patientData.height > 300) {
        throw new Error('La taille doit être entre 0 et 300 cm');
      }
      updateFields.push('height = ?');
      params.push(patientData.height);
    }
    if (patientData.diseases !== undefined) {
      updateFields.push('diseases = ?');
      params.push(patientData.diseases?.trim() || null);
    }
    if (patientData.medical_history !== undefined) {
      updateFields.push('medical_history = ?');
      params.push(patientData.medical_history?.trim() || null);
    }
    if (patientData.allergies !== undefined) {
      updateFields.push('allergies = ?');
      params.push(patientData.allergies?.trim() || null);
    }

    if (updateFields.length === 0) {
      throw new Error('Aucune donnée à mettre à jour');
    }

    // Ajouter la mise à jour du timestamp
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const query = `UPDATE patients SET ${updateFields.join(', ')} WHERE id = ?`;
    const stmt = db.prepare(query);
    const result = stmt.run(...params);

    if (result.changes === 0) {
      throw new Error(`Impossible de mettre à jour le patient avec l'ID ${id}`);
    }

    // Récupérer le patient mis à jour
    const updatedPatient = this.getPatientById(id);
    if (!updatedPatient) {
      throw new Error('Erreur lors de la récupération du patient mis à jour');
    }

    return updatedPatient;
  }

  /**
   * Supprime un patient et transfère ses paiements vers un patient anonyme
   */
  public deletePatient(id: number, transferPayments: boolean = true): void {
    const db = this.dbService.getDatabase();
    
    // Vérifier que le patient existe
    const existingPatient = this.getPatientById(id);
    if (!existingPatient) {
      throw new Error(`Patient avec l'ID ${id} introuvable`);
    }

    // Vérifier s'il y a des consultations liées
    const consultationCount = db.prepare('SELECT COUNT(*) as count FROM consultations WHERE patient_id = ?').get(id) as { count: number };
    if (consultationCount.count > 0) {
      throw new Error('Impossible de supprimer un patient ayant des consultations.');
    }

    // Vérifier s'il y a des rendez-vous futurs
    const appointmentCount = db.prepare('SELECT COUNT(*) as count FROM appointments WHERE patient_id = ? AND date >= date(\'now\')').get(id) as { count: number };
    if (appointmentCount.count > 0) {
      throw new Error('Impossible de supprimer un patient ayant des rendez-vous futurs. Annulez-les d\'abord.');
    }

    // Si transferPayments est true, transférer les paiements vers patient anonyme (NULL)
    if (transferPayments) {
      const updatePaymentsStmt = db.prepare('UPDATE payments SET patient_id = NULL, notes = COALESCE(notes, \'\') || \' [Patient supprimé: ' + existingPatient.first_name + ' ' + existingPatient.last_name + ']\' WHERE patient_id = ?');
      updatePaymentsStmt.run(id);
    }

    const stmt = db.prepare('DELETE FROM patients WHERE id = ?');
    const result = stmt.run(id);

    if (result.changes === 0) {
      throw new Error(`Impossible de supprimer le patient avec l'ID ${id}`);
    }
  }

  /**
   * Recherche des patients par terme de recherche
   */
  public searchPatients(query: string): Patient[] {
    return this.getAllPatients({ search: query });
  }

  /**
   * Récupère les statistiques des patients
   */
  public getPatientStats(filters?: { date_from?: string; date_to?: string }): { total: number } {
    const db = this.dbService.getDatabase();

    let query = 'SELECT COUNT(*) as count FROM patients';
    const params: any[] = [];
    const conditions: string[] = [];

    // Appliquer les filtres de date si fournis
    if (filters?.date_from) {
      conditions.push('DATE(created_at) >= ?');
      params.push(filters.date_from);
    }

    if (filters?.date_to) {
      conditions.push('DATE(created_at) <= ?');
      params.push(filters.date_to);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    const total = db.prepare(query).get(...params) as { count: number };

    return {
      total: total.count
    };
  }

  /**
   * Valide un format d'email
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
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
   * Vérifie s'il existe déjà un patient avec les mêmes informations
   */
  private checkForDuplicatePatient(firstName: string, lastName: string, dateOfBirth: string, phone?: string): void {
    const db = this.dbService.getDatabase();
    
    // Vérifier par nom, prénom et date de naissance
    let query = 'SELECT COUNT(*) as count FROM patients WHERE first_name = ? AND last_name = ? AND date_of_birth = ?';
    let params: any[] = [firstName.trim(), lastName.trim(), dateOfBirth];
    
    // Si un téléphone est fourni, l'inclure dans la vérification
    if (phone && phone.trim()) {
      query += ' AND phone = ?';
      params.push(phone.trim());
    }
    
    const result = db.prepare(query).get(...params) as { count: number };
    
    if (result.count > 0) {
      if (phone && phone.trim()) {
        throw new Error(`Un patient avec le même nom, prénom, date de naissance et numéro de téléphone existe déjà.`);
      } else {
        throw new Error(`Un patient avec le même nom, prénom et date de naissance existe déjà.`);
      }
    }
  }


}
