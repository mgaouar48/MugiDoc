import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseService } from './DatabaseService';
import { PatientService } from './PatientService';

describe('PatientService', () => {
  let dbService: DatabaseService;
  let patientService: PatientService;

  beforeEach(() => {
    dbService = new DatabaseService(':memory:');
    dbService.initialize();
    patientService = new PatientService(dbService);
  });

  afterEach(() => {
    dbService.close();
  });

  it('persists blood_group and chronic_diseases on creation', () => {
    const created = patientService.createPatient({
      first_name: 'Jean',
      last_name: 'Dupont',
      date_of_birth: '1980-01-01',
      blood_group: 'O-',
      chronic_diseases: 'Diabète type 2, HTA',
    });

    expect(created.blood_group).toBe('O-');
    expect(created.chronic_diseases).toBe('Diabète type 2, HTA');

    const reloaded = patientService.getPatientById(created.id);
    expect(reloaded?.blood_group).toBe('O-');
    expect(reloaded?.chronic_diseases).toBe('Diabète type 2, HTA');
  });

  it('creates a patient without blood_group or chronic_diseases (both optional)', () => {
    const created = patientService.createPatient({
      first_name: 'Jean',
      last_name: 'Dupont',
      date_of_birth: '1980-01-01',
    });

    expect(created.blood_group).toBeFalsy();
    expect(created.chronic_diseases).toBeFalsy();
  });

  it('updates blood_group and chronic_diseases independently of other fields', () => {
    const created = patientService.createPatient({
      first_name: 'Jean',
      last_name: 'Dupont',
      date_of_birth: '1980-01-01',
    });

    const updated = patientService.updatePatient(created.id, {
      blood_group: 'AB+',
      chronic_diseases: 'Asthme',
    });

    expect(updated.blood_group).toBe('AB+');
    expect(updated.chronic_diseases).toBe('Asthme');
    expect(updated.first_name).toBe('Jean'); // reste inchangé

    const changedAgain = patientService.updatePatient(created.id, { blood_group: 'B+' });
    expect(changedAgain.blood_group).toBe('B+');
    expect(changedAgain.chronic_diseases).toBe('Asthme'); // non affecté par la mise à jour partielle
  });
});
