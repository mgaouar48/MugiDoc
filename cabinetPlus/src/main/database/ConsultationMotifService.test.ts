import { describe, it, expect } from 'vitest';
import { DatabaseService } from './DatabaseService';
import { ConsultationMotifService } from './ConsultationMotifService';

describe('ConsultationMotifService', () => {
  it('seeds recurring general-practice motifs on a fresh database', () => {
    const dbService = new DatabaseService(':memory:');
    dbService.initialize();
    const service = new ConsultationMotifService(dbService);

    const motifs = service.getAll();
    expect(motifs.length).toBeGreaterThan(20);
    expect(motifs.every(m => !m.is_custom)).toBe(true);
    expect(motifs.some(m => m.label === 'Fièvre')).toBe(true);
  });

  it('does not re-seed (and does not duplicate) once motifs already exist', () => {
    const dbService = new DatabaseService(':memory:');
    dbService.initialize();

    const first = new ConsultationMotifService(dbService);
    const firstCount = first.getAll().length;

    const second = new ConsultationMotifService(dbService);
    expect(second.getAll().length).toBe(firstCount);
  });

  it('create() saves a free-text motif as a custom recurring one', () => {
    const dbService = new DatabaseService(':memory:');
    dbService.initialize();
    const service = new ConsultationMotifService(dbService);

    const created = service.create('Suivi post-partum', 'Suivi / Administratif');
    expect(created.is_custom).toBe(true);
    expect(created.usage_count).toBe(0);

    const all = service.getAll();
    expect(all.some(m => m.label === 'Suivi post-partum')).toBe(true);
  });

  it('create() is idempotent for an already-known label, including a seeded one', () => {
    const dbService = new DatabaseService(':memory:');
    dbService.initialize();
    const service = new ConsultationMotifService(dbService);

    const before = service.getAll().length;
    const again = service.create('Fièvre');
    expect(again.is_custom).toBe(false); // reste le motif semé d'origine, pas un doublon
    expect(service.getAll().length).toBe(before);
  });

  it('incrementUsage() raises a motif to the top of getAll()', () => {
    const dbService = new DatabaseService(':memory:');
    dbService.initialize();
    const service = new ConsultationMotifService(dbService);

    const target = service.getAll().find(m => m.label === 'Otalgie (douleur d\'oreille)')!;
    service.incrementUsage(target.id!);
    service.incrementUsage(target.id!);
    service.incrementUsage(target.id!);

    const top = service.getAll()[0];
    expect(top.label).toBe('Otalgie (douleur d\'oreille)');
    expect(top.usage_count).toBe(3);
  });

  it('rejects an empty label', () => {
    const dbService = new DatabaseService(':memory:');
    dbService.initialize();
    const service = new ConsultationMotifService(dbService);

    expect(() => service.create('   ')).toThrow();
  });
});
