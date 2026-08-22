import { useState, useEffect, useMemo } from "react";
import { useElectron } from "../hooks/useElectron";
import { useDashboardStats } from "../hooks/useDashboardStats";
import { useCabinetLogo } from "../hooks/useCabinetLogo";
import { useScrollToTop } from "../hooks/useScrollToTop";
import { usePermissions } from "../hooks/usePermissions";
import { useWaitingRoom } from "../hooks/useWaitingRoom";
import { useToast } from "../hooks/use-toast";
import { User } from "../../shared/types";
import { DataUpdateProvider } from "../contexts/DataUpdateContext";
import { RoleGuard } from "./RoleGuard";
import { Button } from "./ui/button";
import {
  Users,
  Calendar,
  Banknote,
  UserPlus,
  CalendarPlus,
  AlertCircle,
  Stethoscope,
  LogOut,
  Settings,
  BarChart3,
  FileText,
  Shield,
  Clock,
  FileCheck,
  LayoutDashboard,
  Activity,
} from "lucide-react";
import { MedicalCertificateDialog } from "./consultations/MedicalCertificateDialog";
import { CertificatesSection } from "./consultations/CertificatesSection";
import { PatientsSection } from "./patients/PatientsSection";
import { AppointmentsSection } from "./appointments/AppointmentsSection";
import { ConsultationsSection } from "./consultations/ConsultationsSection";
import { PaymentsSection } from "./payments/PaymentsSection";
import { QuickPaymentModal } from "./payments/QuickPaymentModal";
import { SettingsSection } from "./settings/SettingsSection";
import { StatisticsSection } from "./statistics/StatisticsSection";
import { PrescriptionsSection } from "./prescriptions/PrescriptionsSection";
import { UsersSection } from "./users/UsersSection";
import { LogsSection } from "./logs/LogsSection";
import { WaitingRoomSection } from "./waiting-room/WaitingRoomSection";
import { SectionErrorBoundary } from "./dashboard/SectionErrorBoundary";
import { DashboardKpiCards } from "./dashboard/DashboardKpiCards";
import { QuickActionsCard } from "./dashboard/QuickActionsCard";
import { AgendaPanel } from "./dashboard/AgendaPanel";

interface DashboardProps {
  onLogout: () => void;
  doctorName: string;
  user?: User | null;
}

export const Dashboard = ({ onLogout, doctorName, user }: DashboardProps) => {
  const [currentSection, setCurrentSection] = useState<string | null>(null);
  const [quickActionType, setQuickActionType] = useState<string | null>(null);
  const [selectedPatientForAction, setSelectedPatientForAction] = useState<any>(null);
  const [selectedPrescriptionForEdit, setSelectedPrescriptionForEdit] = useState<any>(null);
  const [homeCertModalOpen, setHomeCertModalOpen] = useState<boolean>(false);
  const [homeCertType, setHomeCertType] = useState<string>("general");
  const [quickPaymentModalOpen, setQuickPaymentModalOpen] = useState<boolean>(false);
  const [quickPaymentPatient, setQuickPaymentPatient] = useState<any>(null);
  const [dashboardTab, setDashboardTab] = useState<'agenda' | 'waiting'>('agenda');

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem("mugidoc_sidebar_collapsed") === "true";
  });
  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem("mugidoc_sidebar_collapsed", String(next));
      return next;
    });
  };

  const { isElectron, onMenuAction, removeAllListeners } = useElectron();
  const { stats, cabinetInfo, loading, error, refresh } = useDashboardStats();
  const { logoUrl, hasLogo } = useCabinetLogo();
  const permissions = usePermissions(user || null);
  const { addToQueue, queue: waitingQueue } = useWaitingRoom();
  const { toast } = useToast();

  // Déterminer les patients/rendez-vous déjà en salle d'attente
  const waitingPatientIds = useMemo(() => {
    return new Set(
      waitingQueue
        .filter(e => e.status === 'en_attente' || e.status === 'en_consultation')
        .map(e => e.patient_id)
    );
  }, [waitingQueue]);

  const waitingAppointmentIds = useMemo(() => {
    return new Set(
      waitingQueue
        .filter(e => (e.status === 'en_attente' || e.status === 'en_consultation') && e.appointment_id)
        .map(e => e.appointment_id)
    );
  }, [waitingQueue]);

  const isAlreadyInWaitingRoom = (apt: any) => {
    if (!apt) return false;
    if (apt.id && waitingAppointmentIds.has(apt.id)) return true;
    if (apt.patient_id && waitingPatientIds.has(apt.patient_id)) return true;
    if (apt.patient?.id && waitingPatientIds.has(Number(apt.patient.id))) return true;
    return false;
  };

  const handleSendToWaitingRoom = async (apt: any) => {
    if (!apt.patient_id) {
      toast({ title: 'Erreur', description: 'Patient introuvable', variant: 'destructive' });
      return;
    }
    try {
      await addToQueue({
        patient_id: apt.patient_id,
        appointment_id: apt.id,
        priority: 2,
        notes: `RDV ${apt.time} - ${apt.type}`
      });
      toast({
        title: 'Patient inscrit en salle d\'attente',
        description: `${apt.patient ? apt.patient.first_name + ' ' + apt.patient.last_name : 'Patient'} a été ajouté à la file d'attente.`
      });
      refresh();
    } catch (err: any) {
      toast({
        title: 'Information',
        description: err.message || 'Impossible d\'ajouter le patient en salle d\'attente',
        variant: err.message?.includes('déjà') ? 'default' : 'destructive'
      });
    }
  };

  const handleUpdateAppointmentStatus = async (id: number, status: 'confirmé' | 'annulé' | 'terminé') => {
    // Retrait / mise à jour instantané optimiste dans la liste du tableau de bord
    if (stats.todayAppointmentsList) {
      if (status === 'annulé') {
        stats.todayAppointmentsList = stats.todayAppointmentsList.filter(apt => apt.id !== id);
      } else {
        stats.todayAppointmentsList = stats.todayAppointmentsList.map(apt =>
          apt.id === id ? { ...apt, status } : apt
        );
      }
    }
    try {
      await window.electronAPI.appointments.update(id, { status });
      refresh();
      toast({
        title: status === 'annulé' ? 'Rendez-vous annulé' : 'Statut mis à jour',
        description: status === 'annulé' ? 'Le rendez-vous a été retiré du programme du jour.' : undefined
      });
    } catch (err) {
      console.error("Erreur lors de la mise à jour du statut:", err);
      refresh();
    }
  };

  useScrollToTop(currentSection);

  useEffect(() => {
    if (isElectron) {
      const handleMenuAction = (action: string) => {
        switch (action) {
          case 'new-patient':
            if (permissions.canCreatePatient) {
              setQuickActionType("newPatient");
              setCurrentSection("patients");
            }
            break;
          case 'new-appointment':
            if (permissions.canManageAppointments) {
              setQuickActionType("newAppointment");
              setCurrentSection("appointments");
            }
            break;
          default:
            break;
        }
      };
      onMenuAction(handleMenuAction);
      return () => { removeAllListeners('menu-action'); };
    }
  }, [isElectron, onMenuAction, removeAllListeners, permissions]);

  useEffect(() => {
    if (isElectron) refresh();
  }, [isElectron, refresh]);

  const formatAmount = (amount: number): string =>
    new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount);

  const handleBackToDashboard = () => {
    setCurrentSection(null);
    setQuickActionType(null);
    setSelectedPatientForAction(null);
    setSelectedPrescriptionForEdit(null);
    if (isElectron) refresh();
  };

  const handleNavigate = (section: string | null) => {
    setCurrentSection(section);
    setQuickActionType(null);
    setSelectedPatientForAction(null);
  };

  // Navigation avec action rapide (ex: ouvrir directement le formulaire de création)
  const navigateWithAction = (section: string, quickActionType?: string) => {
    if (quickActionType) setQuickActionType(quickActionType);
    setCurrentSection(section);
  };

  const handleStartConsultationFromAgenda = (patient: any) => {
    setSelectedPatientForAction(patient);
    setCurrentSection("consultations");
    setQuickActionType("newConsultation");
  };

  const handleOpenQuickPayment = (patient: any) => {
    setQuickPaymentPatient(patient);
    setQuickPaymentModalOpen(true);
  };

  const getRoleLabel = () => {
    switch (permissions.role) {
      case 'doctor': return 'Médecin';
      case 'secretary': return 'Secrétaire';
    }
  };

  const getRoleBadgeColor = () => {
    switch (permissions.role) {
      case 'doctor': return 'bg-primary/10 text-primary';
      case 'secretary': return 'bg-emerald-500/10 text-emerald-600';
    }
  };

  const navItems = [
    { id: null, label: 'Tableau de bord', icon: LayoutDashboard, always: true },
    { id: 'waiting-room', label: 'Salle d\'Attente', icon: Activity, always: true },
    { id: 'patients', label: 'Patients', icon: Users, always: true },
    { id: 'appointments', label: 'Rendez-vous', icon: Calendar, always: true },
    { id: 'consultations', label: 'Consultations', icon: Stethoscope, cond: permissions.canViewConsultations },
    { id: 'prescriptions', label: 'Ordonnances', icon: FileText, cond: permissions.canViewPrescriptions },
    { id: 'certificates', label: 'Certificats', icon: FileCheck, cond: permissions.canCreateConsultation },
    { id: 'payments', label: 'Facturation', icon: Banknote, always: true },
    { id: 'statistics', label: 'Rapports', icon: BarChart3, cond: permissions.canViewGlobalStats },
  ];

  const adminItems = [
    { id: 'settings', label: 'Paramètres', icon: Settings, cond: permissions.canAccessSettings },
    { id: 'users', label: 'Utilisateurs', icon: Shield, cond: permissions.canManageUsers },
    { id: 'logs', label: 'Journal', icon: Clock, cond: permissions.canViewActivityLogs },
  ];

  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const todayCapitalized = today.charAt(0).toUpperCase() + today.slice(1);

  const renderMainContent = () => {
    if (currentSection === "patients") {
      return (
        <RoleGuard userRole={permissions.role} allowedRoles={['doctor', 'secretary']} onBack={handleBackToDashboard}>
          <PatientsSection
            onBack={handleBackToDashboard}
            autoOpenForm={quickActionType === "newPatient"}
            onOpenConsultation={(patient) => {
              if (permissions.canCreateConsultation) {
                setSelectedPatientForAction(patient);
                setCurrentSection("consultations");
                setQuickActionType("newConsultation");
              }
            }}
            onOpenAppointment={(patient) => {
              setSelectedPatientForAction(patient);
              setCurrentSection("appointments");
              setQuickActionType("newAppointment");
            }}
            onOpenPayment={(patient) => {
              const convertedPatient = {
                id: patient.id.toString(),
                first_name: patient.firstName,
                last_name: patient.lastName,
                phone: patient.phone,
                address: patient.address,
                date_of_birth: patient.dateOfBirth,
                gender: patient.gender,
                age: patient.age
              };
              setQuickPaymentPatient(convertedPatient);
              setQuickPaymentModalOpen(true);
            }}
            onOpenPrescription={(patient, prescription) => {
              const convertedPatient = {
                id: parseInt(patient.id) || 0,
                first_name: patient.firstName,
                last_name: patient.lastName,
                date_of_birth: new Date(new Date().getFullYear() - patient.age, 0, 1).toISOString().split('T')[0],
                phone: patient.phone || undefined,
                address: patient.address || undefined,
                weight: patient.weight,
                height: patient.height,
                diseases: patient.diseases,
                medical_history: patient.medical_history,
                status: 'actif' as const,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };
              setSelectedPatientForAction(convertedPatient);
              setSelectedPrescriptionForEdit(prescription);
              setCurrentSection("prescriptions");
              setQuickActionType(prescription ? "editPrescription" : "newPrescription");
            }}
          />
        </RoleGuard>
      );
    }

    if (currentSection === "appointments") {
      return (
        <RoleGuard userRole={permissions.role} allowedRoles={['doctor', 'secretary']} onBack={handleBackToDashboard}>
          <AppointmentsSection onBack={handleBackToDashboard} autoOpenForm={quickActionType === "newAppointment"} preSelectedPatient={selectedPatientForAction} />
        </RoleGuard>
      );
    }

    if (currentSection === "waiting-room") {
      return (
        <RoleGuard userRole={permissions.role} allowedRoles={['doctor', 'secretary']} onBack={handleBackToDashboard}>
          <WaitingRoomSection
            onStartConsultation={permissions.canCreateConsultation ? (patient) => {
              const convertedPatient = {
                id: patient.id.toString(),
                firstName: patient.first_name,
                lastName: patient.last_name,
                phone: patient.phone,
                address: patient.address,
                age: patient.date_of_birth ? new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear() : 0,
                gender: patient.gender
              };
              setSelectedPatientForAction(convertedPatient);
              setCurrentSection("consultations");
              setQuickActionType("newConsultation");
            } : undefined}
            onOpenPayment={(patient) => {
              setQuickPaymentPatient(patient);
              setQuickPaymentModalOpen(true);
            }}
          />
        </RoleGuard>
      );
    }

    if (currentSection === "consultations") {
      return (
        <RoleGuard userRole={permissions.role} allowedRoles={['doctor']} onBack={handleBackToDashboard}>
          <ConsultationsSection
            onBack={handleBackToDashboard}
            autoOpenForm={quickActionType === "newConsultation"}
            preSelectedPatient={selectedPatientForAction}
            onOpenPrescription={(patient, prescription) => {
              setSelectedPatientForAction(patient);
              setSelectedPrescriptionForEdit(prescription);
              setCurrentSection("prescriptions");
              setQuickActionType("editPrescription");
            }}
          />
        </RoleGuard>
      );
    }

    if (currentSection === "payments") {
      return (
        <RoleGuard userRole={permissions.role} allowedRoles={['doctor', 'secretary']} onBack={handleBackToDashboard}>
          <PaymentsSection onBack={handleBackToDashboard} />
        </RoleGuard>
      );
    }

    if (currentSection === "certificates") {
      return (
        <RoleGuard userRole={permissions.role} allowedRoles={['doctor']} onBack={handleBackToDashboard}>
          <CertificatesSection onBack={handleBackToDashboard} />
        </RoleGuard>
      );
    }

    if (currentSection === "settings") {
      return (
        <RoleGuard userRole={permissions.role} allowedRoles={['doctor']} onBack={handleBackToDashboard}>
          <SettingsSection onBack={handleBackToDashboard} />
        </RoleGuard>
      );
    }

    if (currentSection === "statistics") {
      return (
        <RoleGuard userRole={permissions.role} allowedRoles={['doctor']} onBack={handleBackToDashboard}>
          <StatisticsSection onBack={handleBackToDashboard} />
        </RoleGuard>
      );
    }

    if (currentSection === "prescriptions") {
      return (
        <RoleGuard userRole={permissions.role} allowedRoles={['doctor']} onBack={handleBackToDashboard}>
          <PrescriptionsSection
            onBack={handleBackToDashboard}
            autoOpenForm={quickActionType === "newPrescription"}
            preSelectedPatient={selectedPatientForAction}
            selectedPrescriptionForEdit={selectedPrescriptionForEdit}
            quickActionType={quickActionType}
          />
        </RoleGuard>
      );
    }

    if (currentSection === "users") {
      return (
        <RoleGuard userRole={permissions.role} allowedRoles={['doctor']} onBack={handleBackToDashboard}>
          <UsersSection onBack={handleBackToDashboard} />
        </RoleGuard>
      );
    }

    if (currentSection === "logs") {
      return (
        <RoleGuard userRole={permissions.role} allowedRoles={['doctor']} onBack={handleBackToDashboard}>
          <LogsSection onBack={handleBackToDashboard} />
        </RoleGuard>
      );
    }

    // ── Dashboard Overview ──
    const todayApts = (stats.todayAppointmentsList || []).filter(apt => apt.status !== 'annulé');
    const activeWaitingQueue = waitingQueue.filter(e => e.status === 'en_attente' || e.status === 'en_consultation');
    const waitingCount = activeWaitingQueue.length;

    return (
      <div className="h-full flex flex-col p-6 lg:p-8 space-y-6 bg-background overflow-y-auto">
        {error && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm bg-destructive/5 border border-destructive/20 text-destructive shrink-0">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* ── En-tête ── */}
        <div className="flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Vue d'ensemble</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{todayCapitalized}</p>
          </div>
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              className="border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 h-9 text-xs font-semibold"
              onClick={() => setCurrentSection("waiting-room")}
            >
              <Users className="w-3.5 h-3.5" />
              Salle d'Attente ({waitingCount})
            </Button>
            {permissions.canCreatePatient && (
              <Button
                className="h-9 text-xs font-semibold"
                onClick={() => { setQuickActionType("newPatient"); setCurrentSection("patients"); }}
              >
                <UserPlus className="w-3.5 h-3.5" />
                Nouveau Patient
              </Button>
            )}
            {permissions.canManageAppointments && (
              <Button
                variant="outline"
                className="h-9 text-xs font-semibold"
                onClick={() => { setQuickActionType("newAppointment"); setCurrentSection("appointments"); }}
              >
                <CalendarPlus className="w-3.5 h-3.5" />
                Prendre RDV
              </Button>
            )}
          </div>
        </div>

        {/* ── Ruban de métriques KPI ── */}
        <DashboardKpiCards
          loading={loading}
          appointmentsToday={stats.appointmentsToday}
          waitingCount={waitingCount}
          consultationsToday={stats.consultationsToday}
          totalPatients={stats.totalPatients}
          monthlyRevenue={stats.monthlyRevenue}
          canViewTotalFinancialStats={permissions.canViewTotalFinancialStats}
          formatAmount={formatAmount}
        />

        {/* ── Espace de Travail Principal (Grille Réactive Pleine Hauteur) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-[480px]">

          {/* Colonne Gauche (4 colonnes) : Actions Rapides & Infos Cabinet */}
          <div className="lg:col-span-4 flex flex-col space-y-4 h-full">
            <QuickActionsCard
              isSecretary={permissions.isSecretary}
              canCreateConsultation={permissions.canCreateConsultation}
              canViewPrescriptions={permissions.canViewPrescriptions}
              cabinetName={cabinetInfo.name}
              doctorSpeciality={cabinetInfo.doctorSpeciality}
              cabinetPhone={cabinetInfo.phone}
              doctorName={doctorName}
              onNavigate={navigateWithAction}
            />
          </div>

          {/* Colonne Droite (8 colonnes) : Programme du jour (Pleine Hauteur) */}
          <AgendaPanel
            dashboardTab={dashboardTab}
            setDashboardTab={setDashboardTab}
            todayApts={todayApts}
            activeWaitingQueue={activeWaitingQueue}
            waitingCount={waitingCount}
            isSecretary={permissions.isSecretary}
            canCreateConsultation={permissions.canCreateConsultation}
            isAlreadyInWaitingRoom={isAlreadyInWaitingRoom}
            onSendToWaitingRoom={handleSendToWaitingRoom}
            onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
            onStartConsultation={handleStartConsultationFromAgenda}
            onOpenPayment={handleOpenQuickPayment}
            onNavigate={(section) => setCurrentSection(section)}
            canViewTotalFinancialStats={permissions.canViewTotalFinancialStats}
            unpaidAmount={stats.unpaidAmount ?? 0}
            formatAmount={formatAmount}
          />

        </div>
      </div>
    );
  };

  // Navigation globale unifiée
  const allNavItems = [
    ...navItems.filter(item => item.always || item.cond),
    ...adminItems.filter(item => item.cond)
  ];

  // ─── App Shell (Top Nav & Bottom Info Bar) ───
  return (
    <DataUpdateProvider onDashboardUpdate={refresh}>
      <div className="h-screen flex flex-col bg-background font-sans overflow-hidden">

        {/* ═══ 1. BARRE DE NAVIGATION SUPÉRIEURE (TOUT EN HAUT - PLEINE LARGEUR) ═══ */}
        <header className="shrink-0 bg-card border-b border-border px-3 py-1.5 flex items-center shadow-2xs select-none">
          {/* Tous les boutons affichés sans défilement */}
          <nav className="flex items-center gap-1 flex-1 justify-between min-w-0 py-0.5">
            {allNavItems.map((item) => {
              const isActive = currentSection === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentSection(item.id)}
                  className={`flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-semibold rounded-md transition-all duration-150 flex-1 min-w-0 ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-2xs'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
                  }`}
                  title={item.label}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </header>

        {/* ═══ 2. ESPACE DE TRAVAIL PRINCIPAL PLEIN ÉCRAN ═══ */}
        <main className="flex-1 overflow-y-auto">
          <SectionErrorBoundary key={currentSection || 'home'} onReset={handleBackToDashboard}>
            {renderMainContent()}
          </SectionErrorBoundary>
        </main>

        {/* ═══ 3. BARRE INFÉRIEURE : INFO CABINET ET UTILISATEUR (TOUT EN BAS) ═══ */}
        <footer className="shrink-0 bg-card border-t border-border px-6 py-1.5 flex items-center justify-between gap-4 select-none">
          {/* Logo & Cabinet */}
          <div className="flex items-center gap-3">
            {hasLogo && logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-8 w-auto max-w-[120px] object-contain border border-border" />
            ) : (
              <img src="./icon.png" alt="MugiDoc" className="h-8 w-auto max-w-[120px] object-contain" />
            )}
            <div>
              <p className="text-[11px] font-bold text-foreground leading-none">{cabinetInfo.name || 'MugiDoc'}</p>
              <p className="text-[9.5px] text-muted-foreground mt-0.5">{doctorName} · {cabinetInfo.doctorSpeciality || 'Médecin'}</p>
            </div>
          </div>

          {/* User Profile & Logout */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 px-2 py-0.5 rounded-md bg-muted/40 border border-border/40 text-xs">
              <div className="w-4.5 h-4.5 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-[8.5px]">
                {user ? `${user.first_name[0]}${user.last_name[0]}` : 'Dr'}
              </div>
              <span className="font-medium text-foreground text-[11px]">{user ? `${user.first_name} ${user.last_name}` : doctorName}</span>
              <span className="text-[9.5px] text-muted-foreground">({getRoleLabel()})</span>
            </div>

            <button
              onClick={onLogout}
              className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors text-xs flex items-center gap-1 px-2 py-0.5"
              title="Déconnexion"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="text-[11px] font-medium hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </footer>

        <MedicalCertificateDialog
          open={homeCertModalOpen}
          onOpenChange={setHomeCertModalOpen}
          patient={null}
          initialCertType={homeCertType}
        />

        <QuickPaymentModal
          open={quickPaymentModalOpen}
          onOpenChange={setQuickPaymentModalOpen}
          patient={quickPaymentPatient}
          onSuccess={refresh}
        />
      </div>
    </DataUpdateProvider>
  );
};
