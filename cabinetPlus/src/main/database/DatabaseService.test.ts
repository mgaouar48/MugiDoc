import { describe, it, expect } from 'vitest';
import { DatabaseService } from './DatabaseService';

describe('DatabaseService', () => {
  it('initializes a fresh in-memory database without throwing', () => {
    const dbService = new DatabaseService(':memory:');
    expect(() => dbService.initialize()).not.toThrow();
    dbService.close();
  });

  it('creates all expected indexes on a fresh database', () => {
    const dbService = new DatabaseService(':memory:');
    dbService.initialize();
    const db = dbService.getDatabase();

    const indexes = db.prepare("SELECT name FROM sqlite_master WHERE type='index'").all() as { name: string }[];
    const indexNames = indexes.map(i => i.name);

    const expectedIndexes = [
      'idx_patients_status',
      'idx_appointments_patient_id',
      'idx_appointments_date',
      'idx_appointments_status',
      'idx_appointments_type',
      'idx_consultations_patient_id',
      'idx_consultations_appointment_id',
      'idx_consultations_date',
      'idx_consultations_status',
      'idx_payments_patient_id',
      'idx_payments_date',
      'idx_payments_consultation_id',
      'idx_prescriptions_patient_id',
      'idx_prescriptions_date',
      'idx_patient_documents_patient_id',
    ];

    for (const name of expectedIndexes) {
      expect(indexNames).toContain(name);
    }

    dbService.close();
  });

  it('records migrations idempotently — re-initializing does not duplicate or throw', () => {
    const dbService = new DatabaseService(':memory:');
    dbService.initialize();
    const db = dbService.getDatabase();

    const migrationsBefore = db.prepare('SELECT name FROM migrations').all() as { name: string }[];
    expect(migrationsBefore.length).toBeGreaterThan(0);

    // Re-running the migration logic directly should be a no-op, not a duplicate insert or crash
    expect(() => (dbService as any).runMigrations()).not.toThrow();

    const migrationsAfter = db.prepare('SELECT name FROM migrations').all() as { name: string }[];
    expect(migrationsAfter.length).toBe(migrationsBefore.length);

    dbService.close();
  });

  it('regression: adds consultation_id to an existing payments table and createIndexes succeeds afterward', () => {
    const dbService = new DatabaseService(':memory:');
    dbService.initialize();
    const db = dbService.getDatabase();

    // Simuler une base "ancienne" : retirer la colonne comme si elle n'avait jamais existé
    db.exec('DROP INDEX IF EXISTS idx_payments_consultation_id');
    db.exec('ALTER TABLE payments DROP COLUMN consultation_id');

    const columnsBefore = db.prepare('PRAGMA table_info(payments)').all() as { name: string }[];
    expect(columnsBefore.some(c => c.name === 'consultation_id')).toBe(false);

    // Reproduit le scénario de régression : la migration doit ajouter la colonne,
    // et la (re)création des index ne doit plus jamais planter derrière
    expect(() => (dbService as any).addConsultationIdToPayments()).not.toThrow();
    expect(() => (dbService as any).createIndexes()).not.toThrow();

    const columnsAfter = db.prepare('PRAGMA table_info(payments)').all() as { name: string }[];
    expect(columnsAfter.some(c => c.name === 'consultation_id')).toBe(true);

    dbService.close();
  });
});
