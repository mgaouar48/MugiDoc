import { DatabaseService } from './DatabaseService';

export interface WaitingRoomEntry {
  id: number;
  patient_id: number;
  appointment_id?: number;
  ticket_number?: number;
  arrival_time: string;
  status: 'en_attente' | 'en_consultation' | 'termine' | 'absent';
  priority: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Related fields
  patient?: any;
}

export class WaitingRoomService {
  constructor(private databaseService: DatabaseService) {}

  /**
   * Récupère tous les patients dans la salle d'attente pour aujourd'hui
   */
  public getTodayQueue(): WaitingRoomEntry[] {
    const db = this.databaseService.getDatabase();
    
    // On récupère les entrées du jour avec calcul automatique du numéro de ticket séquentiel si non défini
    const query = `
      SELECT 
        w.*,
        COALESCE(w.ticket_number, (
          SELECT COUNT(*) 
          FROM waiting_room w2 
          WHERE date(w2.arrival_time) = date(w.arrival_time) 
          AND (w2.arrival_time < w.arrival_time OR (w2.arrival_time = w.arrival_time AND w2.id <= w.id))
        )) as effective_ticket_number,
        p.first_name,
        p.last_name,
        p.phone,
        p.gender,
        p.date_of_birth
      FROM waiting_room w
      JOIN patients p ON w.patient_id = p.id
      WHERE date(w.arrival_time) = date('now', 'localtime')
      ORDER BY 
        CASE w.status 
          WHEN 'en_consultation' THEN 1
          WHEN 'en_attente' THEN 2
          ELSE 3
        END,
        w.priority ASC, 
        w.arrival_time ASC
    `;
    
    const rows = db.prepare(query).all();
    
    return rows.map((row: any) => ({
      id: row.id,
      patient_id: row.patient_id,
      appointment_id: row.appointment_id,
      ticket_number: row.ticket_number || row.effective_ticket_number || 1,
      arrival_time: row.arrival_time,
      status: row.status,
      priority: row.priority,
      notes: row.notes,
      created_at: row.created_at,
      updated_at: row.updated_at,
      patient: {
        id: row.patient_id,
        first_name: row.first_name,
        last_name: row.last_name,
        phone: row.phone,
        gender: row.gender,
        date_of_birth: row.date_of_birth
      }
    }));
  }

  /**
   * Ajoute un patient à la salle d'attente
   */
  public addToQueue(data: {
    patient_id: number;
    appointment_id?: number;
    priority?: number;
    notes?: string;
  }): WaitingRoomEntry {
    const db = this.databaseService.getDatabase();
    
    // Check if the patient is already in the queue today with status 'en_attente' or 'en_consultation'
    const existing = db.prepare(`
      SELECT id FROM waiting_room 
      WHERE patient_id = ? 
      AND date(arrival_time) = date('now', 'localtime')
      AND status IN ('en_attente', 'en_consultation')
    `).get(data.patient_id);

    if (existing) {
      throw new Error("Ce patient est déjà dans la salle d'attente aujourd'hui.");
    }

    const priority = data.priority || 2; // 1 = Urgence, 2 = Normal

    // Calculer le prochain numéro de ticket du jour
    const maxTicketRow = db.prepare(`
      SELECT COALESCE(MAX(ticket_number), 0) as max_ticket 
      FROM waiting_room 
      WHERE date(arrival_time) = date('now', 'localtime')
    `).get() as { max_ticket: number } | undefined;

    const countTodayRow = db.prepare(`
      SELECT COUNT(*) as count_today 
      FROM waiting_room 
      WHERE date(arrival_time) = date('now', 'localtime')
    `).get() as { count_today: number } | undefined;

    const nowIso = new Date().toISOString();
    const nextTicketNumber = Math.max(maxTicketRow?.max_ticket || 0, countTodayRow?.count_today || 0) + 1;

    const info = db.prepare(`
      INSERT INTO waiting_room (patient_id, appointment_id, priority, notes, ticket_number, arrival_time)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      data.patient_id,
      data.appointment_id || null,
      priority,
      data.notes || null,
      nextTicketNumber,
      nowIso
    );

    return this.getEntryById(info.lastInsertRowid as number);
  }

  /**
   * Met à jour le statut d'une entrée
   */
  public updateStatus(id: number, status: 'en_attente' | 'en_consultation' | 'termine' | 'absent'): WaitingRoomEntry {
    const db = this.databaseService.getDatabase();
    const nowIso = new Date().toISOString();
    
    // Si on appelle un patient en consultation, on passe le précédent patient en consultation à "termine"
    if (status === 'en_consultation') {
      db.prepare(`
        UPDATE waiting_room
        SET status = 'termine', updated_at = ?
        WHERE id != ? 
        AND status = 'en_consultation'
        AND date(arrival_time) = date('now', 'localtime')
      `).run(nowIso, id);
    }

    db.prepare(`
      UPDATE waiting_room 
      SET status = ?, updated_at = ?
      WHERE id = ?
    `).run(status, nowIso, id);

    return this.getEntryById(id);
  }

  /**
   * Met à jour les notes ou la priorité
   */
  public updateEntry(id: number, data: { priority?: number; notes?: string }): WaitingRoomEntry {
    const db = this.databaseService.getDatabase();
    const updates: string[] = [];
    const values: any[] = [];

    if (data.priority !== undefined) {
      updates.push('priority = ?');
      values.push(data.priority);
    }
    if (data.notes !== undefined) {
      updates.push('notes = ?');
      values.push(data.notes);
    }

    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);
      
      const query = `UPDATE waiting_room SET ${updates.join(', ')} WHERE id = ?`;
      db.prepare(query).run(...values);
    }

    return this.getEntryById(id);
  }

  /**
   * Supprime une entrée de la salle d'attente
   */
  public removeFromQueue(id: number): void {
    const db = this.databaseService.getDatabase();
    db.prepare('DELETE FROM waiting_room WHERE id = ?').run(id);
  }

  /**
   * Récupère une entrée par son ID
   */
  public getEntryById(id: number): WaitingRoomEntry {
    const db = this.databaseService.getDatabase();
    const query = `
      SELECT 
        w.*,
        COALESCE(w.ticket_number, (
          SELECT COUNT(*) 
          FROM waiting_room w2 
          WHERE date(w2.arrival_time) = date(w.arrival_time) 
          AND (w2.arrival_time < w.arrival_time OR (w2.arrival_time = w.arrival_time AND w2.id <= w.id))
        )) as effective_ticket_number,
        p.first_name,
        p.last_name,
        p.phone,
        p.gender,
        p.date_of_birth
      FROM waiting_room w
      JOIN patients p ON w.patient_id = p.id
      WHERE w.id = ?
    `;

    const row = db.prepare(query).get(id) as any;

    if (!row) throw new Error(`Entrée non trouvée avec l'ID ${id}`);

    return {
      id: row.id,
      patient_id: row.patient_id,
      appointment_id: row.appointment_id,
      ticket_number: row.ticket_number || row.effective_ticket_number || 1,
      arrival_time: row.arrival_time,
      status: row.status,
      priority: row.priority,
      notes: row.notes,
      created_at: row.created_at,
      updated_at: row.updated_at,
      patient: {
        id: row.patient_id,
        first_name: row.first_name,
        last_name: row.last_name,
        phone: row.phone,
        gender: row.gender,
        date_of_birth: row.date_of_birth
      }
    };
  }
}
