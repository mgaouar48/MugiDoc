import { DatabaseService } from './DatabaseService';
import { Payment, CreatePaymentRequest, UpdatePaymentRequest, PaymentSearchFilters } from '../../shared/types';

export class PaymentService {
  private dbService: DatabaseService;

  constructor(dbService: DatabaseService) {
    this.dbService = dbService;
  }

  /**
   * Récupère tous les paiements avec filtres optionnels
   */
  public getAllPayments(filters?: PaymentSearchFilters): Payment[] {
    const db = this.dbService.getDatabase();
    let query = `
      SELECT
        pay.*,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        p.phone as patient_phone,
        p.email as patient_email
      FROM payments pay
      LEFT JOIN patients p ON pay.patient_id = p.id
    `;
    const params: any[] = [];
    const conditions: string[] = [];

    // Appliquer les filtres
    if (filters?.search) {
      conditions.push('(p.first_name LIKE ? OR p.last_name LIKE ? OR pay.notes LIKE ?)');
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (filters?.patient_id) {
      conditions.push('pay.patient_id = ?');
      params.push(filters.patient_id);
    }

    if (filters?.consultation_id) {
      conditions.push('pay.consultation_id = ?');
      params.push(filters.consultation_id);
    }

    if (filters?.date) {
      conditions.push('pay.date = ?');
      params.push(filters.date);
    }

    if (filters?.date_from && filters?.date_to) {
      conditions.push('pay.date BETWEEN ? AND ?');
      params.push(filters.date_from, filters.date_to);
    } else if (filters?.date_from) {
      conditions.push('pay.date >= ?');
      params.push(filters.date_from);
    } else if (filters?.date_to) {
      conditions.push('pay.date <= ?');
      params.push(filters.date_to);
    }

    if (filters?.method && filters.method !== 'all') {
      conditions.push('pay.method = ?');
      params.push(filters.method);
    }

    if (filters?.status && filters.status !== 'all') {
      conditions.push('pay.status = ?');
      params.push(filters.status);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY pay.date DESC, pay.created_at DESC';

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
      consultation_id: row.consultation_id,
      amount: row.amount,
      method: row.method,
      status: row.status,
      date: row.date,
      debt_amount: row.debt_amount || 0,
      notes: row.notes,
      created_at: row.created_at,
      updated_at: row.updated_at,
      patient: row.patient_first_name ? {
        id: row.patient_id,
        first_name: row.patient_first_name,
        last_name: row.patient_last_name,
        date_of_birth: '1900-01-01', // Valeur par défaut
        phone: row.patient_phone,
        email: row.patient_email,
        address: undefined,
        status: 'actif' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } : undefined
    }));
  }

  /**
   * Compte le nombre total de paiements correspondant aux filtres (hors pagination)
   */
  public getPaymentsCount(filters?: PaymentSearchFilters): number {
    const db = this.dbService.getDatabase();
    let query = `
      SELECT COUNT(*) as count
      FROM payments pay
      LEFT JOIN patients p ON pay.patient_id = p.id
    `;
    const params: any[] = [];
    const conditions: string[] = [];

    if (filters?.search) {
      conditions.push('(p.first_name LIKE ? OR p.last_name LIKE ? OR pay.notes LIKE ?)');
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (filters?.patient_id) {
      conditions.push('pay.patient_id = ?');
      params.push(filters.patient_id);
    }

    if (filters?.consultation_id) {
      conditions.push('pay.consultation_id = ?');
      params.push(filters.consultation_id);
    }

    if (filters?.date) {
      conditions.push('pay.date = ?');
      params.push(filters.date);
    }

    if (filters?.date_from && filters?.date_to) {
      conditions.push('pay.date BETWEEN ? AND ?');
      params.push(filters.date_from, filters.date_to);
    } else if (filters?.date_from) {
      conditions.push('pay.date >= ?');
      params.push(filters.date_from);
    } else if (filters?.date_to) {
      conditions.push('pay.date <= ?');
      params.push(filters.date_to);
    }

    if (filters?.method && filters.method !== 'all') {
      conditions.push('pay.method = ?');
      params.push(filters.method);
    }

    if (filters?.status && filters.status !== 'all') {
      conditions.push('pay.status = ?');
      params.push(filters.status);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    const result = db.prepare(query).get(...params) as { count: number };
    return result.count;
  }

  /**
   * Récupère un paiement par son ID
   */
  public getPaymentById(id: number): Payment | null {
    const db = this.dbService.getDatabase();
    const query = `
      SELECT
        pay.*,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        p.phone as patient_phone,
        p.email as patient_email
      FROM payments pay
      LEFT JOIN patients p ON pay.patient_id = p.id
      WHERE pay.id = ?
    `;
    
    const result = db.prepare(query).get(id) as any;
    
    if (!result) return null;

    return {
      id: result.id,
      patient_id: result.patient_id,
      consultation_id: result.consultation_id,
      amount: result.amount,
      method: result.method,
      status: result.status,
      date: result.date,
      debt_amount: result.debt_amount || 0,
      notes: result.notes,
      created_at: result.created_at,
      updated_at: result.updated_at,
      patient: result.patient_first_name ? {
        id: result.patient_id,
        first_name: result.patient_first_name,
        last_name: result.patient_last_name,
        date_of_birth: '1900-01-01', // Valeur par défaut
        phone: result.patient_phone,
        email: result.patient_email,
        address: undefined,
        status: 'actif' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } : undefined
    };
  }

  /**
   * Crée un nouveau paiement
   */
  public createPayment(paymentData: CreatePaymentRequest): Payment {
    const db = this.dbService.getDatabase();
    
    // Validation des données requises
    if (paymentData.patient_id === undefined || !paymentData.amount || !paymentData.method || !paymentData.date) {
      throw new Error('Les champs montant, méthode et date sont obligatoires');
    }

    // Vérifier que le patient existe (si spécifié)
    if (paymentData.patient_id !== null) {
      const patientExists = db.prepare('SELECT id FROM patients WHERE id = ?').get(paymentData.patient_id);
      if (!patientExists) {
        throw new Error(`Patient avec l'ID ${paymentData.patient_id} introuvable`);
      }
    }



    // Validation du montant
    if (paymentData.amount <= 0) {
      throw new Error('Le montant doit être positif');
    }

    // Validation de la date
    if (!this.isValidDate(paymentData.date)) {
      throw new Error('Format de date invalide (YYYY-MM-DD attendu)');
    }

    // Calculer automatiquement la dette
    let debtAmount = 0;
    if (paymentData.status === 'debt' && paymentData.debt_amount) {
      debtAmount = paymentData.debt_amount;
    }

    const stmt = db.prepare(`
      INSERT INTO payments (patient_id, consultation_id, amount, method, status, date, debt_amount, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      paymentData.patient_id,
      paymentData.consultation_id ?? null,
      paymentData.amount,
      paymentData.method,
      paymentData.status || 'pending',
      paymentData.date,
      debtAmount,
      paymentData.notes?.trim() || null
    );



    // Récupérer le paiement créé
    const createdPayment = this.getPaymentById(result.lastInsertRowid as number);
    if (!createdPayment) {
      throw new Error('Erreur lors de la création du paiement');
    }

    return createdPayment;
  }

  /**
   * Met à jour un paiement existant
   */
  public updatePayment(id: number, paymentData: UpdatePaymentRequest): Payment {
    const db = this.dbService.getDatabase();
    
    // Vérifier que le paiement existe
    const existingPayment = this.getPaymentById(id);
    if (!existingPayment) {
      throw new Error(`Paiement avec l'ID ${id} introuvable`);
    }

    // Validation des données si fournies
    if (paymentData.patient_id !== undefined && paymentData.patient_id !== null) {
      const patientExists = db.prepare('SELECT id FROM patients WHERE id = ?').get(paymentData.patient_id);
      if (!patientExists) {
        throw new Error(`Patient avec l'ID ${paymentData.patient_id} introuvable`);
      }
    }



    if (paymentData.amount !== undefined && paymentData.amount <= 0) {
      throw new Error('Le montant doit être positif');
    }

    if (paymentData.date && !this.isValidDate(paymentData.date)) {
      throw new Error('Format de date invalide (YYYY-MM-DD attendu)');
    }

    // Construire la requête de mise à jour dynamiquement
    const updateFields: string[] = [];
    const params: any[] = [];

    if (paymentData.patient_id !== undefined) {
      updateFields.push('patient_id = ?');
      params.push(paymentData.patient_id);
    }

    if (paymentData.consultation_id !== undefined) {
      updateFields.push('consultation_id = ?');
      params.push(paymentData.consultation_id);
    }

    if (paymentData.amount !== undefined) {
      updateFields.push('amount = ?');
      params.push(paymentData.amount);
    }
    if (paymentData.method !== undefined) {
      updateFields.push('method = ?');
      params.push(paymentData.method);
    }
    if (paymentData.status !== undefined) {
      updateFields.push('status = ?');
      params.push(paymentData.status);
    }
    if (paymentData.date !== undefined) {
      updateFields.push('date = ?');
      params.push(paymentData.date);
    }
    if (paymentData.debt_amount !== undefined) {
      updateFields.push('debt_amount = ?');
      params.push(paymentData.debt_amount);
    }
    if (paymentData.notes !== undefined) {
      updateFields.push('notes = ?');
      params.push(paymentData.notes?.trim() || null);
    }

    if (updateFields.length === 0) {
      throw new Error('Aucune donnée à mettre à jour');
    }

    // Ajouter la mise à jour du timestamp
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const query = `UPDATE payments SET ${updateFields.join(', ')} WHERE id = ?`;
    const stmt = db.prepare(query);
    const result = stmt.run(...params);

    if (result.changes === 0) {
      throw new Error(`Impossible de mettre à jour le paiement avec l'ID ${id}`);
    }



    // Récupérer le paiement mis à jour
    const updatedPayment = this.getPaymentById(id);
    if (!updatedPayment) {
      throw new Error('Erreur lors de la récupération du paiement mis à jour');
    }

    return updatedPayment;
  }

  /**
   * Supprime un paiement
   */
  public deletePayment(id: number): void {
    const db = this.dbService.getDatabase();
    
    // Vérifier que le paiement existe
    const existingPayment = this.getPaymentById(id);
    if (!existingPayment) {
      throw new Error(`Paiement avec l'ID ${id} introuvable`);
    }



    const stmt = db.prepare('DELETE FROM payments WHERE id = ?');
    const result = stmt.run(id);

    if (result.changes === 0) {
      throw new Error(`Impossible de supprimer le paiement avec l'ID ${id}`);
    }
  }

  /**
   * Récupère les paiements d'un patient
   */
  public getPaymentsByPatient(patientId: number): Payment[] {
    return this.getAllPayments({ patient_id: patientId });
  }



  /**
   * Récupère les statistiques des paiements
   */
  public getPaymentStats(): {
    total: number;
    pending: number;
    completed: number;
    debt: number;
    totalAmount: number;
    pendingAmount: number;
    debtAmount: number;
  } {
    const db = this.dbService.getDatabase();

    const total = db.prepare('SELECT COUNT(*) as count FROM payments').get() as { count: number };
    const pending = db.prepare('SELECT COUNT(*) as count FROM payments WHERE status = ?').get('pending') as { count: number };
    const completed = db.prepare('SELECT COUNT(*) as count FROM payments WHERE status = ?').get('completed') as { count: number };
    const debt = db.prepare('SELECT COUNT(*) as count FROM payments WHERE status = ?').get('debt') as { count: number };

    // Revenus = paiements complétés + montants virés (amount - debt_amount pour les dettes)
    const completedAmount = db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = ?').get('completed') as { total: number };
    const transferredAmount = db.prepare('SELECT COALESCE(SUM(amount - debt_amount), 0) as total FROM payments WHERE status = ?').get('debt') as { total: number };
    const totalAmount = completedAmount.total + transferredAmount.total;

    const pendingAmount = db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = ?').get('pending') as { total: number };
    // Impayés = montant restant après virement (debt_amount pour les dettes)
    const debtAmount = db.prepare('SELECT COALESCE(SUM(debt_amount), 0) as total FROM payments WHERE status = ?').get('debt') as { total: number };

    return {
      total: total.count,
      pending: pending.count,
      completed: completed.count,
      debt: debt.count,
      totalAmount: totalAmount,
      pendingAmount: pendingAmount.total,
      debtAmount: debtAmount.total
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
}
