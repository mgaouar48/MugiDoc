const Database = require('./node_modules/better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPaths = [
  path.join(process.env.APPDATA, 'MugiDoc', 'database', 'cabinetplus.db'),
  path.join(process.env.APPDATA, 'CabinetPlus', 'database', 'cabinetplus.db'),
  path.join(process.env.APPDATA, 'mugidoc-desktop', 'database', 'cabinetplus.db')
];

const today = new Date().toISOString().split('T')[0];

const demoPatients = [
  { first_name: 'Mohamed', last_name: 'Gaouar', gender: 'M', dob: '1985-04-12', phone: '05 58 47 76 37', city: 'Alger', disease: 'Hypertension' },
  { first_name: 'Meriem', last_name: 'Kacemi', gender: 'F', dob: '2015-08-20', phone: '07 35 65 52 74', city: 'Oran', disease: 'Asthme' },
  { first_name: 'Karim', last_name: 'Benali', gender: 'M', dob: '1978-11-15', phone: '06 61 23 45 67', city: 'Blida', disease: 'Diabète Type 2' },
  { first_name: 'Sarah', last_name: 'Amrani', gender: 'F', dob: '1992-02-03', phone: '07 66 41 57 83', city: 'Alger', disease: 'Consultation Générale' },
  { first_name: 'Yacine', last_name: 'Brahimi', gender: 'M', dob: '1988-06-25', phone: '05 50 12 34 56', city: 'Boumerdès', disease: 'Allergie Pénicilline' },
  { first_name: 'Amel', last_name: 'Cherif', gender: 'F', dob: '1995-09-10', phone: '07 92 76 67 78', city: 'Blida', disease: 'Migraine chronique' },
  { first_name: 'Nabil', last_name: 'Ferhat', gender: 'M', dob: '1982-12-01', phone: '05 40 98 76 54', city: 'Tipaza', disease: 'Lumbago' },
  { first_name: 'Amina', last_name: 'Taleb', gender: 'F', dob: '1990-03-18', phone: '07 66 89 30 21', city: 'Alger', disease: 'Anémie' },
  { first_name: 'Oussama', last_name: 'Saidi', gender: 'M', dob: '2001-07-14', phone: '05 38 16 74 83', city: 'Alger', disease: 'Suivi post-opératoire' },
  { first_name: 'Chahinez', last_name: 'Belkacem', gender: 'F', dob: '1986-10-30', phone: '07 71 22 33 44', city: 'Tizi Ouzou', disease: 'Gastrite' },
  { first_name: 'Riad', last_name: 'Mahrez', gender: 'M', dob: '1991-02-21', phone: '06 99 88 77 66', city: 'Alger', disease: 'Entorse cheville' },
  { first_name: 'Sonia', last_name: 'Bouzid', gender: 'F', dob: '1994-05-05', phone: '07 55 44 33 22', city: 'Oran', disease: 'Bronchite' }
];

const todayAppointments = [
  { time: '08:30', duration: 30, type: 'Consultation Générale', status: 'terminé', notes: 'Fièvre et céphalées depuis 2 jours' },
  { time: '09:00', duration: 30, type: 'Contrôle tension', status: 'terminé', notes: 'Suivi de traitement anti-hypertenseur' },
  { time: '09:30', duration: 30, type: 'Pédiatrie', status: 'terminé', notes: 'Contrôle annuel de croissance' },
  { time: '10:00', duration: 30, type: 'Urgence', status: 'en_attente', notes: 'Douleurs lombaires aiguës' },
  { time: '10:30', duration: 30, type: 'Consultation Générale', status: 'en_attente', notes: 'Toux sèche persistante' },
  { time: '11:00', duration: 30, type: 'Renouvellement ordonnance', status: 'en_attente', notes: 'Bilan sanguin et traitement antidiabétique' },
  { time: '11:30', duration: 30, type: 'Suivi médical', status: 'en_attente', notes: 'Contrôle de l asthme après crise' },
  { time: '14:00', duration: 30, type: 'Consultation Générale', status: 'en_attente', notes: 'Douleurs estomac post-prandiales' },
  { time: '14:30', duration: 30, type: 'Bilan complet', status: 'en_attente', notes: 'Visite médicale de routine' },
  { time: '15:00', duration: 30, type: 'Certificat médical', status: 'en_attente', notes: 'Certificat d aptitude au sport' },
  { time: '15:30', duration: 30, type: 'Urgence', status: 'en_attente', notes: 'Traumatisme cheville lors de footing' },
  { time: '16:00', duration: 30, type: 'Consultation Générale', status: 'en_attente', notes: 'Syndrome grippal et fatigue' }
];

for (const dbPath of dbPaths) {
  if (!fs.existsSync(dbPath)) continue;
  console.log(`Populating DB at ${dbPath}...`);
  try {
    const db = new Database(dbPath);

    // 1. Inserer patients si inexistants
    const insertPatientStmt = db.prepare(`
      INSERT INTO patients (first_name, last_name, gender, date_of_birth, phone, address, diseases, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'actif')
    `);

    const patientIds = [];
    for (const p of demoPatients) {
      let existing = db.prepare('SELECT id FROM patients WHERE first_name = ? AND last_name = ?').get(p.first_name, p.last_name);
      if (!existing) {
        const res = insertPatientStmt.run(p.first_name, p.last_name, p.gender, p.dob, p.phone, p.city, p.disease);
        patientIds.push(res.lastInsertRowid);
      } else {
        patientIds.push(existing.id);
      }
    }

    // 2. Nettoyer et remplir les RDV d'aujourd'hui
    db.prepare('DELETE FROM appointments WHERE date = ?').run(today);
    const insertApptStmt = db.prepare(`
      INSERT INTO appointments (patient_id, date, time, duration, type, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    todayAppointments.forEach((apt, i) => {
      const pid = patientIds[i % patientIds.length];
      insertApptStmt.run(pid, today, apt.time, apt.duration, apt.type, apt.status, apt.notes);
    });

    // 3. Remplir la salle d'attente (waiting_room) si elle existe
    const tableInfo = db.prepare("PRAGMA table_info(waiting_room)").all();
    if (tableInfo && tableInfo.length > 0) {
      db.prepare("DELETE FROM waiting_room WHERE date(created_at) = date('now') OR status = 'en_attente'").run();
      const insertWaitStmt = db.prepare(`
        INSERT INTO waiting_room (patient_id, ticket_number, arrival_time, status, notes)
        VALUES (?, ?, ?, 'en_attente', ?)
      `);

      // Ajouter 8 patients en attente
      for (let k = 3; k < 11; k++) {
        const pid = patientIds[k % patientIds.length];
        const ticketNum = `A-${100 + k}`;
        const arrivalTime = `${String(8 + Math.floor(k/2)).padStart(2, '0')}:${(k%2)*30 === 0 ? '15' : '45'}`;
        try {
          insertWaitStmt.run(pid, ticketNum, arrivalTime, demoPatients[k % demoPatients.length].disease || 'Consultation');
        } catch (e) {
          // ignore duplicate ticket if any
        }
      }
    }

    db.close();
    console.log(`✅ Successfully seeded database at ${dbPath}`);
  } catch (err) {
    console.error(`Error seeding ${dbPath}:`, err);
  }
}

process.exit(0);
