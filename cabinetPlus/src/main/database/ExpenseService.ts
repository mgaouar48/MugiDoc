import { DatabaseService } from './DatabaseService';
import { Expense, CreateExpenseRequest, UpdateExpenseRequest, ExpenseSearchFilters } from '../../shared/types';

export class ExpenseService {
  private dbService: DatabaseService;

  constructor(dbService: DatabaseService) {
    this.dbService = dbService;
  }

  /**
   * Récupère tous les frais avec filtres optionnels
   */
  public getAllExpenses(filters?: ExpenseSearchFilters): Expense[] {
    const db = this.dbService.getDatabase();
    let query = 'SELECT * FROM expenses';
    const params: any[] = [];
    const conditions: string[] = [];

    // Appliquer les filtres
    if (filters?.search) {
      conditions.push('description LIKE ?');
      params.push(`%${filters.search}%`);
    }

    if (filters?.date_from) {
      conditions.push('date >= ?');
      params.push(filters.date_from);
    }

    if (filters?.date_to) {
      conditions.push('date <= ?');
      params.push(filters.date_to);
    }

    // Ajouter les conditions WHERE
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    // Tri par date décroissante
    query += ' ORDER BY date DESC, created_at DESC';

    // Limite et offset
    if (filters?.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
      
      if (filters?.offset) {
        query += ' OFFSET ?';
        params.push(filters.offset);
      }
    }

    return db.prepare(query).all(...params) as Expense[];
  }

  /**
   * Récupère un frais par son ID
   */
  public getExpenseById(id: number): Expense | null {
    const db = this.dbService.getDatabase();
    return db.prepare('SELECT * FROM expenses WHERE id = ?').get(id) as Expense | null;
  }

  /**
   * Crée un nouveau frais
   */
  public createExpense(expenseData: CreateExpenseRequest): Expense {
    const db = this.dbService.getDatabase();
    
    // Validation des données requises
    if (!expenseData.amount || !expenseData.description) {
      throw new Error('Le montant et la description sont obligatoires');
    }

    // Validation du montant
    if (expenseData.amount <= 0) {
      throw new Error('Le montant doit être positif');
    }

    // Validation de la description
    if (expenseData.description.trim().length === 0) {
      throw new Error('La description ne peut pas être vide');
    }

    // Date par défaut = aujourd'hui
    const date = expenseData.date || new Date().toISOString().split('T')[0];

    // Validation de la date
    if (!this.isValidDate(date)) {
      throw new Error('Format de date invalide (YYYY-MM-DD attendu)');
    }

    const stmt = db.prepare(`
      INSERT INTO expenses (amount, description, date)
      VALUES (?, ?, ?)
    `);

    const result = stmt.run(
      expenseData.amount,
      expenseData.description.trim(),
      date
    );

    // Récupérer le frais créé
    return this.getExpenseById(result.lastInsertRowid as number)!;
  }

  /**
   * Met à jour un frais existant
   */
  public updateExpense(id: number, expenseData: UpdateExpenseRequest): Expense {
    const db = this.dbService.getDatabase();
    
    // Vérifier que le frais existe
    const existingExpense = this.getExpenseById(id);
    if (!existingExpense) {
      throw new Error(`Frais avec l'ID ${id} introuvable`);
    }

    // Validation des données si fournies
    if (expenseData.amount !== undefined && expenseData.amount <= 0) {
      throw new Error('Le montant doit être positif');
    }

    if (expenseData.description !== undefined && expenseData.description.trim().length === 0) {
      throw new Error('La description ne peut pas être vide');
    }

    if (expenseData.date && !this.isValidDate(expenseData.date)) {
      throw new Error('Format de date invalide (YYYY-MM-DD attendu)');
    }

    // Construire la requête de mise à jour dynamiquement
    const updates: string[] = [];
    const params: any[] = [];

    if (expenseData.amount !== undefined) {
      updates.push('amount = ?');
      params.push(expenseData.amount);
    }

    if (expenseData.description !== undefined) {
      updates.push('description = ?');
      params.push(expenseData.description.trim());
    }

    if (expenseData.date !== undefined) {
      updates.push('date = ?');
      params.push(expenseData.date);
    }

    if (updates.length === 0) {
      throw new Error('Aucune donnée à mettre à jour');
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const stmt = db.prepare(`
      UPDATE expenses 
      SET ${updates.join(', ')}
      WHERE id = ?
    `);

    const result = stmt.run(...params);

    if (result.changes === 0) {
      throw new Error(`Impossible de mettre à jour le frais avec l'ID ${id}`);
    }

    // Récupérer le frais mis à jour
    return this.getExpenseById(id)!;
  }

  /**
   * Supprime un frais
   */
  public deleteExpense(id: number): void {
    const db = this.dbService.getDatabase();
    
    // Vérifier que le frais existe
    const existingExpense = this.getExpenseById(id);
    if (!existingExpense) {
      throw new Error(`Frais avec l'ID ${id} introuvable`);
    }

    const stmt = db.prepare('DELETE FROM expenses WHERE id = ?');
    const result = stmt.run(id);

    if (result.changes === 0) {
      throw new Error(`Impossible de supprimer le frais avec l'ID ${id}`);
    }
  }

  /**
   * Récupère les statistiques des frais avec filtres optionnels
   */
  public getExpenseStats(filters?: ExpenseSearchFilters): { total: number; totalAmount: number } {
    const db = this.dbService.getDatabase();

    let query = `
      SELECT
        COUNT(*) as total,
        COALESCE(SUM(amount), 0) as totalAmount
      FROM expenses
    `;

    const params: any[] = [];
    const conditions: string[] = [];

    // Appliquer les mêmes filtres que getAllExpenses
    if (filters?.search) {
      conditions.push('description LIKE ?');
      params.push(`%${filters.search}%`);
    }

    if (filters?.date_from) {
      conditions.push('date >= ?');
      params.push(filters.date_from);
    }

    if (filters?.date_to) {
      conditions.push('date <= ?');
      params.push(filters.date_to);
    }

    // Ajouter les conditions WHERE
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    const stats = db.prepare(query).get(...params) as { total: number; totalAmount: number };

    return stats;
  }

  /**
   * Valide le format d'une date
   */
  private isValidDate(dateString: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) {
      return false;
    }
    
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }
}
