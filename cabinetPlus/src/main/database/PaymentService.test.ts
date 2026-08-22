import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseService } from './DatabaseService';
import { PaymentService } from './PaymentService';

describe('PaymentService', () => {
  let dbService: DatabaseService;
  let paymentService: PaymentService;
  let patientId: number;
  let consultationId: number;

  beforeEach(() => {
    dbService = new DatabaseService(':memory:');
    dbService.initialize();
    paymentService = new PaymentService(dbService);

    const db = dbService.getDatabase();
    patientId = db.prepare(`
      INSERT INTO patients (first_name, last_name, date_of_birth)
      VALUES ('Jean', 'Dupont', '1980-01-01')
    `).run().lastInsertRowid as number;

    consultationId = db.prepare(`
      INSERT INTO consultations (patient_id, date, time, motif)
      VALUES (?, '2026-01-01', '10:00', 'Contrôle')
    `).run(patientId).lastInsertRowid as number;
  });

  afterEach(() => {
    dbService.close();
  });

  it('creates a payment with a consultation_id and persists it (regression for the missing-column bug)', () => {
    const payment = paymentService.createPayment({
      patient_id: patientId,
      consultation_id: consultationId,
      amount: 2000,
      method: 'cash',
      status: 'completed',
      date: '2026-01-01',
    });

    expect(payment.consultation_id).toBe(consultationId);

    const reloaded = paymentService.getPaymentById(payment.id);
    expect(reloaded?.consultation_id).toBe(consultationId);
  });

  it('creates a payment without a consultation_id (still optional)', () => {
    const payment = paymentService.createPayment({
      patient_id: patientId,
      amount: 1500,
      method: 'card',
      date: '2026-01-01',
    });

    expect(payment.consultation_id == null).toBe(true);
  });

  it('rejects a non-positive amount', () => {
    expect(() => paymentService.createPayment({
      patient_id: patientId,
      amount: 0,
      method: 'cash',
      date: '2026-01-01',
    })).toThrow();
  });

  it('rejects an invalid date format', () => {
    expect(() => paymentService.createPayment({
      patient_id: patientId,
      amount: 1000,
      method: 'cash',
      date: '01/01/2026',
    })).toThrow();
  });

  it('rejects a payment for a non-existent patient', () => {
    expect(() => paymentService.createPayment({
      patient_id: 999999,
      amount: 1000,
      method: 'cash',
      date: '2026-01-01',
    })).toThrow();
  });

  it('updatePayment only changes the provided fields, including consultation_id', () => {
    const payment = paymentService.createPayment({
      patient_id: patientId,
      amount: 1000,
      method: 'cash',
      date: '2026-01-01',
      notes: 'Note initiale',
    });

    const updated = paymentService.updatePayment(payment.id, { consultation_id: consultationId });

    expect(updated.consultation_id).toBe(consultationId);
    expect(updated.amount).toBe(1000);
    expect(updated.notes).toBe('Note initiale');
  });

  it('persists a debt payment with the given debt_amount', () => {
    const payment = paymentService.createPayment({
      patient_id: patientId,
      amount: 3000,
      method: 'cash',
      status: 'debt',
      debt_amount: 1000,
      date: '2026-01-01',
    });

    expect(payment.status).toBe('debt');
    expect(payment.debt_amount).toBe(1000);
  });
});
