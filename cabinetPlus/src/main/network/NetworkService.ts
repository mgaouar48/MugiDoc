import express from 'express';
import cors from 'cors';
import * as os from 'os';
import { PatientService } from '../database/PatientService';
import { AppointmentService } from '../database/AppointmentService';
import { ConsultationService } from '../database/ConsultationService';
import { SettingsService } from '../database/SettingsService';
import { AuthService } from '../database/AuthService';
import { PrescriptionService } from '../database/PrescriptionService';
import { PaymentService } from '../database/PaymentService';
import { WaitingRoomService } from '../database/WaitingRoomService';

const NETWORK_PORT = 3737;

export class NetworkService {
  private app: express.Application;
  private server: any = null;
  private isRunning = false;

  constructor(
    private patientService: PatientService,
    private appointmentService: AppointmentService,
    private consultationService: ConsultationService,
    private settingsService: SettingsService,
    private authService: AuthService,
    private prescriptionService: PrescriptionService,
    private paymentService: PaymentService,
    private waitingRoomService: WaitingRoomService
  ) {
    this.app = express();
    this.app.use(cors());
    this.app.use(express.json());
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    // Authentification basique par token unique à l'installation
    this.app.use((req, res, next) => {
      const token = req.headers['x-mugidoc-token'];
      if (token !== this.settingsService.getOrCreateNetworkToken()) {
        return res.status(401).json({ error: 'Non autorisé' });
      }
      next();
    });
  }

  private setupRoutes(): void {
    const router = express.Router();

    // ─── Santé ───────────────────────────────────────────────
    router.get('/health', (req, res) => {
      res.json({ status: 'ok', version: '1.0.0', service: 'MugiDoc Server' });
    });

    // ─── Patients ────────────────────────────────────────────
    router.get('/patients', (req, res) => {
      try {
        const patients = this.patientService.getAllPatients();
        res.json(patients);
      } catch (e: any) {
        res.status(500).json({ error: e.message });
      }
    });

    router.get('/patients/:id', (req, res) => {
      try {
        const patient = this.patientService.getPatientById(parseInt(req.params.id));
        if (!patient) return res.status(404).json({ error: 'Patient non trouvé' });
        res.json(patient);
      } catch (e: any) {
        res.status(500).json({ error: e.message });
      }
    });

    router.post('/patients', (req, res) => {
      try {
        const patient = this.patientService.createPatient(req.body);
        res.status(201).json(patient);
      } catch (e: any) {
        res.status(500).json({ error: e.message });
      }
    });

    router.put('/patients/:id', (req, res) => {
      try {
        const patient = this.patientService.updatePatient(parseInt(req.params.id), req.body);
        res.json(patient);
      } catch (e: any) {
        res.status(500).json({ error: e.message });
      }
    });

    router.delete('/patients/:id', (req, res) => {
      try {
        this.patientService.deletePatient(parseInt(req.params.id));
        res.json({ success: true });
      } catch (e: any) {
        res.status(500).json({ error: e.message });
      }
    });

    // ─── Rendez-vous ─────────────────────────────────────────
    router.get('/appointments', (req, res) => {
      try {
        const appointments = this.appointmentService.getAllAppointments();
        res.json(appointments);
      } catch (e: any) {
        res.status(500).json({ error: e.message });
      }
    });

    router.post('/appointments', (req, res) => {
      try {
        const apt = this.appointmentService.createAppointment(req.body);
        res.status(201).json(apt);
      } catch (e: any) {
        res.status(500).json({ error: e.message });
      }
    });

    router.put('/appointments/:id', (req, res) => {
      try {
        const apt = this.appointmentService.updateAppointment(parseInt(req.params.id), req.body);
        res.json(apt);
      } catch (e: any) {
        res.status(500).json({ error: e.message });
      }
    });

    router.delete('/appointments/:id', (req, res) => {
      try {
        this.appointmentService.deleteAppointment(parseInt(req.params.id));
        res.json({ success: true });
      } catch (e: any) {
        res.status(500).json({ error: e.message });
      }
    });

    // ─── Consultations ───────────────────────────────────────
    router.get('/consultations', (req, res) => {
      try {
        const consultations = this.consultationService.getAllConsultations();
        res.json(consultations);
      } catch (e: any) {
        res.status(500).json({ error: e.message });
      }
    });

    router.get('/consultations/patient/:patientId', (req, res) => {
      try {
        const cons = this.consultationService.getConsultationsByPatient(parseInt(req.params.patientId));
        res.json(cons);
      } catch (e: any) {
        res.status(500).json({ error: e.message });
      }
    });

    router.post('/consultations', (req, res) => {
      try {
        const con = this.consultationService.createConsultation(req.body);
        res.status(201).json(con);
      } catch (e: any) {
        res.status(500).json({ error: e.message });
      }
    });

    router.put('/consultations/:id', (req, res) => {
      try {
        const con = this.consultationService.updateConsultation(parseInt(req.params.id), req.body);
        res.json(con);
      } catch (e: any) {
        res.status(500).json({ error: e.message });
      }
    });

    // ─── Ordonnances ─────────────────────────────────────────
    router.get('/prescriptions', (req, res) => {
      try {
        const prescriptions = this.prescriptionService.getAllPrescriptions();
        res.json(prescriptions);
      } catch (e: any) {
        res.status(500).json({ error: e.message });
      }
    });

    router.get('/prescriptions/patient/:patientId', (req, res) => {
      try {
        const prescriptions = this.prescriptionService.getPrescriptionsByPatient(parseInt(req.params.patientId));
        res.json(prescriptions);
      } catch (e: any) {
        res.status(500).json({ error: e.message });
      }
    });

    // ─── Paiements ───────────────────────────────────────────
    router.get('/payments', (req, res) => {
      try {
        const payments = this.paymentService.getAllPayments();
        res.json(payments);
      } catch (e: any) {
        res.status(500).json({ error: e.message });
      }
    });

    router.post('/payments', (req, res) => {
      try {
        const payment = this.paymentService.createPayment(req.body);
        res.status(201).json(payment);
      } catch (e: any) {
        res.status(500).json({ error: e.message });
      }
    });

    // ─── Paramètres ──────────────────────────────────────────
    router.get('/settings', (req, res) => {
      try {
        const settings = this.settingsService.getAllSettings();
        res.json(settings);
      } catch (e: any) {
        res.status(500).json({ error: e.message });
      }
    });

    router.get('/settings/:key', (req, res) => {
      try {
        const value = this.settingsService.getSetting(req.params.key);
        res.json({ key: req.params.key, value });
      } catch (e: any) {
        res.status(500).json({ error: e.message });
      }
    });

    // ─── Salle d'attente ─────────────────────────────────────
    router.get('/waiting-room', (req, res) => {
      try {
        const queue = this.waitingRoomService.getTodayQueue();
        res.json(queue);
      } catch (e: any) {
        res.status(500).json({ error: e.message });
      }
    });

    router.post('/waiting-room', (req, res) => {
      try {
        const entry = this.waitingRoomService.addToQueue(req.body);
        res.status(201).json(entry);
      } catch (e: any) {
        res.status(500).json({ error: e.message });
      }
    });

    router.put('/waiting-room/:id/status', (req, res) => {
      try {
        const entry = this.waitingRoomService.updateStatus(parseInt(req.params.id), req.body.status);
        res.json(entry);
      } catch (e: any) {
        res.status(500).json({ error: e.message });
      }
    });

    router.put('/waiting-room/:id', (req, res) => {
      try {
        const entry = this.waitingRoomService.updateEntry(parseInt(req.params.id), req.body);
        res.json(entry);
      } catch (e: any) {
        res.status(500).json({ error: e.message });
      }
    });

    router.delete('/waiting-room/:id', (req, res) => {
      try {
        this.waitingRoomService.removeFromQueue(parseInt(req.params.id));
        res.json({ success: true });
      } catch (e: any) {
        res.status(500).json({ error: e.message });
      }
    });

    this.app.use('/api', router);
  }

  getLocalIP(): string {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      const ifaces = interfaces[name];
      if (!ifaces) continue;
      for (const iface of ifaces) {
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
    return '127.0.0.1';
  }

  start(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (this.isRunning) {
        resolve(this.getLocalIP());
        return;
      }
      this.server = this.app.listen(NETWORK_PORT, '0.0.0.0', () => {
        this.isRunning = true;
        const ip = this.getLocalIP();
        console.log(`✅ Serveur réseau MugiDoc démarré sur http://${ip}:${NETWORK_PORT}`);
        resolve(ip);
      });
      this.server.on('error', (err: any) => {
        reject(err);
      });
    });
  }

  stop(): void {
    if (this.server && this.isRunning) {
      this.server.close();
      this.isRunning = false;
      console.log('🛑 Serveur réseau MugiDoc arrêté');
    }
  }

  isServerRunning(): boolean {
    return this.isRunning;
  }

  getPort(): number {
    return NETWORK_PORT;
  }

  getToken(): string {
    return this.settingsService.getOrCreateNetworkToken();
  }
}
