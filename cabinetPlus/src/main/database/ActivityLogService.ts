import { DatabaseService } from './DatabaseService';
import { ActivityLog, ActivityLogSearchFilters } from '../../shared/types';

export class ActivityLogService {
  private dbService: DatabaseService;

  constructor(dbService: DatabaseService) {
    this.dbService = dbService;
  }

  /**
   * Enregistre une activité dans le journal
   */
  public logActivity(userId: number | null, action: string, resource: string, details?: string): void {
    try {
      const db = this.dbService.getDatabase();
      const stmt = db.prepare(`
        INSERT INTO activity_logs (user_id, action, resource, details)
        VALUES (?, ?, ?, ?)
      `);
      stmt.run(userId, action, resource, details || null);
    } catch (error) {
      console.error('❌ Erreur lors de l\'enregistrement du log d\'activité:', error);
    }
  }

  /**
   * Récupère le journal d'activité avec filtres
   */
  public getAllLogs(filters?: ActivityLogSearchFilters): ActivityLog[] {
    const db = this.dbService.getDatabase();
    const conditions: string[] = [];
    const values: any[] = [];

    if (filters?.user_id) {
      conditions.push('al.user_id = ?');
      values.push(filters.user_id);
    }

    if (filters?.resource) {
      conditions.push('al.resource = ?');
      values.push(filters.resource);
    }

    if (filters?.action) {
      conditions.push('al.action LIKE ?');
      values.push(`%${filters.action}%`);
    }

    if (filters?.date_from) {
      conditions.push('al.created_at >= ?');
      values.push(filters.date_from);
    }

    if (filters?.date_to) {
      conditions.push('al.created_at <= ?');
      values.push(filters.date_to + ' 23:59:59');
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = filters?.limit || 100;
    const offset = filters?.offset || 0;

    const query = `
      SELECT 
        al.id,
        al.user_id,
        al.action,
        al.resource,
        al.details,
        al.created_at,
        u.username,
        (u.first_name || ' ' || u.last_name) as user_name,
        u.role as user_role
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT ? OFFSET ?
    `;

    values.push(limit, offset);
    return db.prepare(query).all(...values) as ActivityLog[];
  }
}
