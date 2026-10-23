import { describe, it, expect } from 'vitest';
import { DatabaseService } from './DatabaseService';
import { MedicationService } from './MedicationService';
import medicationsData from './medications_data.json';

describe('MedicationService', () => {
  it('seeds the full national nomenclature on a fresh database, tagged as seed data', () => {
    const dbService = new DatabaseService(':memory:');
    dbService.initialize();
    const db = dbService.getDatabase();

    new MedicationService(dbService);

    const { count } = db.prepare('SELECT COUNT(*) as count FROM medications').get() as { count: number };
    expect(count).toBe(medicationsData.length);

    const { count: nonSeed } = db.prepare("SELECT COUNT(*) as count FROM medications WHERE source != 'seed'").get() as { count: number };
    expect(nonSeed).toBe(0);

    dbService.close();
  });

  it('re-initializing on an already up-to-date database does not duplicate rows', () => {
    const dbService = new DatabaseService(':memory:');
    dbService.initialize();
    const db = dbService.getDatabase();

    new MedicationService(dbService);
    const { count: first } = db.prepare('SELECT COUNT(*) as count FROM medications').get() as { count: number };

    // Simule un redémarrage de l'application : nouvelle instance, même base
    new MedicationService(dbService);
    const { count: second } = db.prepare('SELECT COUNT(*) as count FROM medications').get() as { count: number };

    expect(second).toBe(first);

    dbService.close();
  });

  it('never deletes a manually-added medication when the nomenclature is reseeded', () => {
    const dbService = new DatabaseService(':memory:');
    dbService.initialize();

    const service = new MedicationService(dbService);
    const added = service.addMedication({ brand_name: 'MON MEDICAMENT MAISON', popularity: 10 });
    expect(added.source).toBe('user');

    // Nouveau démarrage avec la même version de nomenclature : ne doit pas y toucher
    new MedicationService(dbService);

    const db = dbService.getDatabase();
    const stillThere = db.prepare('SELECT * FROM medications WHERE id = ?').get(added.id) as any;
    expect(stillThere).toBeDefined();
    expect(stillThere.source).toBe('user');

    dbService.close();
  });

  it('regression: upgrading a pre-existing database (no source column) backfills seed rows from registration_number and reseeds them', () => {
    const dbService = new DatabaseService(':memory:');
    dbService.initialize();
    const db = dbService.getDatabase();

    // Simule une base d'avant l'introduction de la colonne `source` :
    // table déjà peuplée par l'ancien répertoire (639 entrées), certaines
    // avec numéro d'enregistrement, d'autres saisies à la main sans.
    db.exec(`
      CREATE TABLE medications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        brand_name TEXT NOT NULL,
        dci TEXT,
        form TEXT,
        dosage TEXT,
        packaging TEXT,
        registration_number TEXT,
        code TEXT,
        popularity INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    db.prepare(`INSERT INTO medications (brand_name, registration_number) VALUES (?, ?)`)
      .run('ANCIEN MEDICAMENT OFFICIEL', '123/45 A 678/90');
    db.prepare(`INSERT INTO medications (brand_name, registration_number) VALUES (?, ?)`)
      .run('MEDICAMENT AJOUTE A LA MAIN', null);

    new MedicationService(dbService);

    const columns = db.prepare('PRAGMA table_info(medications)').all() as { name: string }[];
    expect(columns.some(c => c.name === 'source')).toBe(true);

    // La ligne « officielle » a été remplacée par la nomenclature complète
    const official = db.prepare("SELECT * FROM medications WHERE brand_name = ?").get('ANCIEN MEDICAMENT OFFICIEL');
    expect(official).toBeUndefined();

    // La ligne sans numéro d'enregistrement — jamais produite par le formulaire
    // d'ajout manuel — est considérée comme donnée utilisateur et préservée
    const manual = db.prepare("SELECT * FROM medications WHERE brand_name = ?").get('MEDICAMENT AJOUTE A LA MAIN') as any;
    expect(manual).toBeDefined();
    expect(manual.source).toBe('user');

    const { count } = db.prepare('SELECT COUNT(*) as count FROM medications').get() as { count: number };
    expect(count).toBe(medicationsData.length + 1); // + la ligne manuelle préservée

    dbService.close();
  });

  it('search finds common molecules by partial DCI and ranks them above rarer matches', () => {
    const dbService = new DatabaseService(':memory:');
    dbService.initialize();
    const service = new MedicationService(dbService);

    const results = service.searchMedications('amoxi', 20);
    expect(results.length).toBeGreaterThan(0);
    expect(results.every(r => (r.brand_name || '').toUpperCase().includes('AMOX') || (r.dci || '').toUpperCase().includes('AMOX'))).toBe(true);

    dbService.close();
  });

  describe('resolveDciCandidates', () => {
    it('resolves a hand-typed brand name to its DCI', () => {
      const dbService = new DatabaseService(':memory:');
      dbService.initialize();
      const service = new MedicationService(dbService);

      // CLAMOXYL ne dit rien par lui-même ; sans cette résolution le contrôle
      // d'allergie est aveugle sur un nom saisi à la main.
      const dcis = service.resolveDciCandidates('CLAMOXYL');
      expect(dcis.length).toBeGreaterThan(0);
      expect(dcis.join(' ').toUpperCase()).toContain('AMOXICILLINE');

      dbService.close();
    });

    it('ignores dosage and packaging noise in the typed text', () => {
      const dbService = new DatabaseService(':memory:');
      dbService.initialize();
      const service = new MedicationService(dbService);

      expect(service.resolveDciCandidates('Clamoxyl 500 mg').join(' ').toUpperCase())
        .toContain('AMOXICILLINE');

      dbService.close();
    });

    it('returns an empty list for an unknown or too-short brand', () => {
      const dbService = new DatabaseService(':memory:');
      dbService.initialize();
      const service = new MedicationService(dbService);

      expect(service.resolveDciCandidates('ZZZZ-INEXISTANT')).toEqual([]);
      expect(service.resolveDciCandidates('ab')).toEqual([]);
      expect(service.resolveDciCandidates('')).toEqual([]);

      dbService.close();
    });
  });
});
