import { describe, it, expect } from 'vitest';
import { DatabaseService } from './DatabaseService';
import { Icd10Service } from './Icd10Service';
import icd10Data from './icd10_data.json';

describe('Icd10Service', () => {
  it('seeds the curated ICD-10 subset on a fresh database', () => {
    const dbService = new DatabaseService(':memory:');
    dbService.initialize();
    const db = dbService.getDatabase();

    new Icd10Service(dbService);

    const { count } = db.prepare('SELECT COUNT(*) as count FROM icd10_codes').get() as { count: number };
    expect(count).toBe(icd10Data.length);
  });

  it('finds a well-known code by its label, in French, ignoring case', () => {
    const dbService = new DatabaseService(':memory:');
    dbService.initialize();
    const service = new Icd10Service(dbService);

    const results = service.searchCodes('bronchite', 10);
    expect(results.some(r => r.code === 'J20.9')).toBe(true);
  });

  it('finds a code by typing the code itself', () => {
    const dbService = new DatabaseService(':memory:');
    dbService.initialize();
    const service = new Icd10Service(dbService);

    const results = service.searchCodes('J20', 10);
    expect(results.some(r => r.code === 'J20.9')).toBe(true);
  });

  it('finds an accented label when the query is typed without accents', () => {
    const dbService = new DatabaseService(':memory:');
    dbService.initialize();
    const service = new Icd10Service(dbService);

    const accented = service.searchCodes('céphalée', 20);
    const unaccented = service.searchCodes('cephalee', 20);

    expect(accented.length).toBeGreaterThan(0);
    expect(unaccented.map(r => r.code)).toEqual(accented.map(r => r.code));
  });

  it('matches a code regardless of the case it is typed in', () => {
    const dbService = new DatabaseService(':memory:');
    dbService.initialize();
    const service = new Icd10Service(dbService);

    expect(service.searchCodes('j20', 10).some(r => r.code === 'J20.9')).toBe(true);
  });

  it('re-seeding (simulating an app restart) does not duplicate rows and stays idempotent', () => {
    const dbService = new DatabaseService(':memory:');
    dbService.initialize();
    const db = dbService.getDatabase();

    new Icd10Service(dbService);
    new Icd10Service(dbService);

    const { count } = db.prepare('SELECT COUNT(*) as count FROM icd10_codes').get() as { count: number };
    expect(count).toBe(icd10Data.length);
  });
});
