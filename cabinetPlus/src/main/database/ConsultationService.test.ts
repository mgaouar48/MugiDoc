import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseService } from './DatabaseService';
import { ConsultationService } from './ConsultationService';

describe('ConsultationService', () => {
  let dbService: DatabaseService;
  let consultationService: ConsultationService;
  let patientId: number;

  beforeEach(() => {
    dbService = new DatabaseService(':memory:');
    dbService.initialize();
    consultationService = new ConsultationService(dbService);

    const db = dbService.getDatabase();
    patientId = db.prepare(`
      INSERT INTO patients (first_name, last_name, date_of_birth)
      VALUES ('Jean', 'Dupont', '1980-01-01')
    `).run().lastInsertRowid as number;
  });

  afterEach(() => {
    dbService.close();
  });

  it('round-trips the structured clinical blocks through create and getById', () => {
    const created = consultationService.createConsultation({
      patient_id: patientId,
      date: '2026-08-26',
      time: '10:00',
      motif: 'Fièvre + toux',
      vitals: { temperature: 38.2, blood_pressure_systolic: 120, blood_pressure_diastolic: 80 },
      anamnese: { onset_date: '2026-08-24', symptoms: 'Toux sèche, fièvre' },
      treatment_lines: [
        { medication: 'Amoxicilline', dosage: '1g', posology: '1 comprimé', frequency: '3 fois/jour', duration: '7 jours' },
      ],
      diagnostics: { primary: { label: 'Bronchite aiguë', icd10_code: 'J20.9' }, secondary: [] },
    });

    const reloaded = consultationService.getConsultationById(created.id);
    expect(reloaded?.vitals?.temperature).toBe(38.2);
    expect(reloaded?.anamnese?.symptoms).toBe('Toux sèche, fièvre');
    expect(reloaded?.treatment_lines?.[0].medication).toBe('Amoxicilline');
    expect(reloaded?.diagnostics?.primary?.label).toBe('Bronchite aiguë');
  });

  it('recomposes the legacy diagnostic and traitement fields from the structured blocks', () => {
    const created = consultationService.createConsultation({
      patient_id: patientId,
      date: '2026-08-26',
      time: '10:00',
      motif: 'Fièvre + toux',
      diagnostics: { primary: { label: 'Bronchite aiguë', icd10_code: 'J20.9' }, secondary: [{ label: 'Rhinite' }] },
      treatment_lines: [
        { medication: 'Amoxicilline', dosage: '1g', posology: '1 comprimé', frequency: '3 fois/jour', duration: '7 jours' },
      ],
    });

    expect(created.diagnostic).toBe('Bronchite aiguë (J20.9) ; Rhinite');
    expect(created.traitement).toBe('Amoxicilline 1g — 1 comprimé — 3 fois/jour — 7 jours');

    // La liste et la recherche (ConsultationList, StatisticsSection...) ne lisent
    // que ces deux colonnes : elles doivent rester à jour sans ressaisie.
    const [listed] = consultationService.getAllConsultations({ patient_id: patientId });
    expect(listed.diagnostic).toBe(created.diagnostic);
  });

  it('still accepts the flat legacy diagnostic/traitement fields when no structured block is given', () => {
    const created = consultationService.createConsultation({
      patient_id: patientId,
      date: '2026-08-26',
      time: '10:00',
      motif: 'Contrôle',
      diagnostic: 'RAS',
      traitement: 'Aucun',
    });

    expect(created.diagnostic).toBe('RAS');
    expect(created.traitement).toBe('Aucun');
  });

  it('sets completed_at automatically when the status transitions to completed, and clears it on reopening', () => {
    const created = consultationService.createConsultation({
      patient_id: patientId,
      date: '2026-08-26',
      time: '10:00',
      motif: 'Contrôle',
      status: 'scheduled',
    });
    expect(created.completed_at).toBeUndefined();

    const completed = consultationService.updateConsultation(created.id, { status: 'completed' });
    expect(completed.completed_at).toBeTruthy();

    // Un second enregistrement en "completed" ne doit pas décaler l'horodatage d'origine
    const completedAgain = consultationService.updateConsultation(created.id, { notes: 'note additionnelle' } as any);
    expect(completedAgain.completed_at).toBe(completed.completed_at);

    const reopened = consultationService.updateConsultation(created.id, { status: 'scheduled' });
    expect(reopened.completed_at).toBeUndefined();
  });

  it('tolerates corrupted JSON in a clinical column instead of failing to load the consultation', () => {
    const created = consultationService.createConsultation({
      patient_id: patientId,
      date: '2026-08-26',
      time: '10:00',
      motif: 'Contrôle',
    });

    const db = dbService.getDatabase();
    db.prepare('UPDATE consultations SET vitals = ? WHERE id = ?').run('{not valid json', created.id);

    const reloaded = consultationService.getConsultationById(created.id);
    expect(reloaded).not.toBeNull();
    expect(reloaded?.vitals).toBeUndefined();
    expect(reloaded?.motif).toBe('Contrôle');
  });

  it('regression (L17.4): a consultation row predating the structured-blocks migration remains readable and editable', () => {
    // Simule une ligne réellement créée avant L8/L9 : uniquement les colonnes
    // héritées `diagnostic`/`traitement` en texte libre, aucune des colonnes
    // JSON structurées renseignée (elles existent dans le schéma — migration
    // déjà passée — mais restent NULL sur cette ligne précise, comme pour
    // toute consultation antérieure jamais réenregistrée depuis).
    const db = dbService.getDatabase();
    const legacyId = db.prepare(`
      INSERT INTO consultations (patient_id, date, time, motif, diagnostic, traitement, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(patientId, '2020-01-15', '09:00', 'Contrôle', 'RAS', 'Paracétamol 1g x3/j', 'completed').lastInsertRowid as number;

    const legacy = consultationService.getConsultationById(legacyId);
    expect(legacy).not.toBeNull();
    expect(legacy?.diagnostic).toBe('RAS');
    expect(legacy?.traitement).toBe('Paracétamol 1g x3/j');
    expect(legacy?.vitals).toBeUndefined();
    expect(legacy?.diagnostics).toBeUndefined();
    expect(legacy?.treatment_lines).toBeUndefined();

    // Toujours listable, pas seulement accessible par id
    const [listed] = consultationService.getAllConsultations({ patient_id: patientId });
    expect(listed.diagnostic).toBe('RAS');

    // Toujours éditable : ajouter un bloc structuré recompose le champ hérité
    // sans que l'ancienneté de la ligne ne fasse échouer la mise à jour.
    const updated = consultationService.updateConsultation(legacyId, {
      diagnostics: { primary: { label: 'Rhinopharyngite' }, secondary: [] },
    });
    expect(updated.diagnostic).toBe('Rhinopharyngite');
    expect(updated.diagnostics?.primary?.label).toBe('Rhinopharyngite');
    // Le traitement hérité, non touché par cette mise à jour, doit survivre.
    expect(updated.traitement).toBe('Paracétamol 1g x3/j');
  });

  it('persists the next appointment reference fields', () => {
    const created = consultationService.createConsultation({
      patient_id: patientId,
      date: '2026-08-26',
      time: '10:00',
      motif: 'Contrôle',
      next_appointment_date: '2026-09-02',
      next_appointment_time: '10:30',
    });

    const reloaded = consultationService.getConsultationById(created.id);
    expect(reloaded?.next_appointment_date).toBe('2026-09-02');
    expect(reloaded?.next_appointment_time).toBe('10:30');
  });

  describe('CHIFA/CNAS', () => {
    it('round-trips the CHIFA fields through create and getById', () => {
      const created = consultationService.createConsultation({
        patient_id: patientId,
        date: '2026-08-26',
        time: '10:00',
        motif: 'Consultation générale',
        care_mode: 'chifa',
        chifa_organisme: 'CNAS',
        chifa_tarif_conventionnel: 300,
        chifa_part_patient: 50,
        chifa_part_assurance: 250,
        chifa_notes: 'Dossier complet',
      });

      const reloaded = consultationService.getConsultationById(created.id);
      expect(reloaded?.care_mode).toBe('chifa');
      expect(reloaded?.chifa_organisme).toBe('CNAS');
      expect(reloaded?.chifa_tarif_conventionnel).toBe(300);
      expect(reloaded?.chifa_part_patient).toBe(50);
      expect(reloaded?.chifa_part_assurance).toBe(250);
      expect(reloaded?.chifa_notes).toBe('Dossier complet');
      // Statut par défaut dès qu'une consultation CHIFA est créée sans statut
      // explicite — jamais laissé vide (jamais présenté comme "connu de la CNAS").
      expect(reloaded?.chifa_statut).toBe('a_traiter');
    });

    it('defaults care_mode to private when not specified', () => {
      const created = consultationService.createConsultation({
        patient_id: patientId,
        date: '2026-08-26',
        time: '10:00',
        motif: 'Contrôle',
      });

      const reloaded = consultationService.getConsultationById(created.id);
      expect(reloaded?.care_mode).toBe('private');
      expect(reloaded?.chifa_statut).toBeUndefined();
    });

    it('reads a row created without the CHIFA columns explicitly set without throwing', () => {
      // Simule une ligne dont l'insertion n'a jamais renseigné les colonnes
      // CHIFA (comportement d'avant cette fonctionnalité) — la lecture doit
      // rester sûre et retomber sur les valeurs par défaut de la colonne.
      const db = dbService.getDatabase();
      const legacyId = db.prepare(`
        INSERT INTO consultations (patient_id, date, time, motif, status)
        VALUES (?, '2026-08-20', '09:00', 'Ancienne consultation', 'scheduled')
      `).run(patientId).lastInsertRowid as number;

      const reloaded = consultationService.getConsultationById(legacyId);
      expect(reloaded).not.toBeNull();
      expect(reloaded?.care_mode).toBe('private');
      expect(reloaded?.chifa_organisme).toBeUndefined();
      expect(reloaded?.chifa_tarif_conventionnel).toBeUndefined();
    });

    it('agrees between getAllConsultations and getConsultationsCount for the same CHIFA filter', () => {
      consultationService.createConsultation({
        patient_id: patientId, date: '2026-08-26', time: '10:00', motif: 'A', care_mode: 'chifa',
      });
      consultationService.createConsultation({
        patient_id: patientId, date: '2026-08-27', time: '10:00', motif: 'B', care_mode: 'chifa',
      });
      consultationService.createConsultation({
        patient_id: patientId, date: '2026-08-28', time: '10:00', motif: 'C', care_mode: 'private',
      });

      const list = consultationService.getAllConsultations({ care_mode: 'chifa' });
      const count = consultationService.getConsultationsCount({ care_mode: 'chifa' });
      expect(list.length).toBe(2);
      expect(count).toBe(2);

      const transmisList = consultationService.getAllConsultations({ care_mode: 'chifa', chifa_statut: 'transmis' });
      const transmisCount = consultationService.getConsultationsCount({ care_mode: 'chifa', chifa_statut: 'transmis' });
      expect(transmisList.length).toBe(0);
      expect(transmisCount).toBe(0);
    });

    it('updates only chifa_statut without touching other fields', () => {
      const created = consultationService.createConsultation({
        patient_id: patientId, date: '2026-08-26', time: '10:00', motif: 'Suivi',
        care_mode: 'chifa', chifa_tarif_conventionnel: 300,
      });

      const updated = consultationService.updateConsultation(created.id, { chifa_statut: 'transmis' });
      expect(updated.chifa_statut).toBe('transmis');
      expect(updated.motif).toBe('Suivi');
      expect(updated.chifa_tarif_conventionnel).toBe(300);
    });

    it('creates no automatic payment for a CHIFA consultation with no patient share', () => {
      const created = consultationService.createConsultation({
        patient_id: patientId, date: '2026-08-26', time: '10:00', motif: 'CHIFA sans part patient',
        care_mode: 'chifa', chifa_part_patient: 0,
      });

      const db = dbService.getDatabase();
      const payments = db.prepare('SELECT * FROM payments WHERE consultation_id = ?').all(created.id);
      expect(payments.length).toBe(0);
    });

    it('creates an automatic payment for the CHIFA patient share only, not the private default price', () => {
      const created = consultationService.createConsultation({
        patient_id: patientId, date: '2026-08-26', time: '10:00', motif: 'CHIFA avec part patient',
        care_mode: 'chifa', chifa_tarif_conventionnel: 300, chifa_part_patient: 50,
      });

      const db = dbService.getDatabase();
      const payments = db.prepare('SELECT * FROM payments WHERE consultation_id = ?').all(created.id) as { amount: number }[];
      expect(payments.length).toBe(1);
      expect(payments[0].amount).toBe(50);
    });
  });
});
