import { DatabaseService } from './DatabaseService';

export interface InventoryItem {
  id: number;
  name: string;
  category: string;
  quantity: number;
  min_threshold: number;
  unit: string;
  unit_price: number;
  supplier?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateInventoryItemRequest {
  name: string;
  category?: string;
  quantity: number;
  min_threshold?: number;
  unit?: string;
  unit_price?: number;
  supplier?: string;
  notes?: string;
}

export class InventoryService {
  private dbService: DatabaseService;

  constructor(dbService: DatabaseService) {
    this.dbService = dbService;
  }

  public getAllItems(): InventoryItem[] {
    const db = this.dbService.getDatabase();
    return db.prepare('SELECT * FROM inventory_items ORDER BY category, name').all() as InventoryItem[];
  }

  public getItemById(id: number): InventoryItem | null {
    const db = this.dbService.getDatabase();
    return (db.prepare('SELECT * FROM inventory_items WHERE id = ?').get(id) as InventoryItem) || null;
  }

  public createItem(data: CreateInventoryItemRequest): InventoryItem {
    const db = this.dbService.getDatabase();
    const result = db.prepare(`
      INSERT INTO inventory_items (name, category, quantity, min_threshold, unit, unit_price, supplier, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.name.trim(),
      data.category || 'Consommable',
      data.quantity || 0,
      data.min_threshold ?? 5,
      data.unit || 'unité',
      data.unit_price || 0,
      data.supplier?.trim() || null,
      data.notes?.trim() || null
    );
    return this.getItemById(result.lastInsertRowid as number)!;
  }

  public updateItem(id: number, data: Partial<CreateInventoryItemRequest>): InventoryItem {
    const db = this.dbService.getDatabase();
    const existing = this.getItemById(id);
    if (!existing) throw new Error(`Article d'inventaire #${id} introuvable`);

    const fields: string[] = [];
    const params: any[] = [];

    if (data.name !== undefined) { fields.push('name = ?'); params.push(data.name.trim()); }
    if (data.category !== undefined) { fields.push('category = ?'); params.push(data.category); }
    if (data.quantity !== undefined) { fields.push('quantity = ?'); params.push(data.quantity); }
    if (data.min_threshold !== undefined) { fields.push('min_threshold = ?'); params.push(data.min_threshold); }
    if (data.unit !== undefined) { fields.push('unit = ?'); params.push(data.unit); }
    if (data.unit_price !== undefined) { fields.push('unit_price = ?'); params.push(data.unit_price); }
    if (data.supplier !== undefined) { fields.push('supplier = ?'); params.push(data.supplier?.trim() || null); }
    if (data.notes !== undefined) { fields.push('notes = ?'); params.push(data.notes?.trim() || null); }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    db.prepare(`UPDATE inventory_items SET ${fields.join(', ')} WHERE id = ?`).run(...params);
    return this.getItemById(id)!;
  }

  public deleteItem(id: number): boolean {
    const db = this.dbService.getDatabase();
    db.prepare('DELETE FROM inventory_items WHERE id = ?').run(id);
    return true;
  }

  public updateQuantity(id: number, delta: number): InventoryItem {
    const existing = this.getItemById(id);
    if (!existing) throw new Error(`Article #${id} introuvable`);
    const newQty = Math.max(0, existing.quantity + delta);
    return this.updateItem(id, { quantity: newQty });
  }
}
