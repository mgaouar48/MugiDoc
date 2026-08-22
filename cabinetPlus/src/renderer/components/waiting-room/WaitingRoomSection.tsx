import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, UserPlus, Trash2, ArrowRight, Ticket, Printer, Tv, Volume2, Banknote } from 'lucide-react';
import { useWaitingRoom } from '@/hooks/useWaitingRoom';
import { usePatients } from '@/hooks/usePatients';
import { useAppointments } from '@/hooks/useAppointments';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Patient, WaitingRoomEntry } from '@/shared/types';
import { ThermalTicketPassModal } from './ThermalTicketPassModal';

interface WaitingRoomSectionProps {
  onStartConsultation?: (patient: Patient) => void;
  onOpenPayment?: (patient: Patient) => void;
}

export const WaitingRoomSection = ({ onStartConsultation, onOpenPayment }: WaitingRoomSectionProps) => {
  const { queue, isLoading, addToQueue, updateStatus, removeFromQueue } = useWaitingRoom();
  const { patients, createPatient, refreshPatients } = usePatients();
  const { appointments, loadAppointments } = useAppointments();
  const { toast } = useToast();

  const todayStr = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);

  // Charger les rendez-vous du jour
  useEffect(() => {
    loadAppointments({ date: todayStr });
  }, [loadAppointments, todayStr]);

  // Modal State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [ticketPassModalOpen, setTicketPassModalOpen] = useState(false);
  const [selectedTicketEntry, setSelectedTicketEntry] = useState<WaitingRoomEntry | null>(null);
  const [modalTab, setModalTab] = useState<'rdv' | 'search' | 'new_patient'>('rdv');
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [priority, setPriority] = useState<number>(2); // 1: Urgence, 2: Normal
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Nouveau Patient Express
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newGender, setNewGender] = useState<'M' | 'F'>('M');
  const [newDob, setNewDob] = useState('');
  const [newPhone, setNewPhone] = useState('');

  // Listes filtrées
  const activeQueue = useMemo(() => queue.filter(q => q.status === 'en_attente' || q.status === 'en_consultation'), [queue]);
  const pastQueue = useMemo(() => queue.filter(q => q.status === 'termine' || q.status === 'absent'), [queue]);

  // IDs des patients et RDV ACTUELLEMENT actifs en salle d'attente
  const activeQueuePatientIds = useMemo(() => new Set(activeQueue.map(q => q.patient_id)), [activeQueue]);
  const activeQueueAppointmentIds = useMemo(() => new Set(activeQueue.filter(q => q.appointment_id).map(q => q.appointment_id)), [activeQueue]);

  // RDV du jour pas encore en salle d'attente
  const todayAppointmentsPending = useMemo(() => {
    return appointments.filter(apt => {
      const aptDate = (apt.date || '').slice(0, 10);
      const isToday = aptDate === todayStr;
      const isNotCancelled = apt.status !== 'annulé' && apt.status !== 'terminé';
      const isAlreadyIn = activeQueueAppointmentIds.has(apt.id) || activeQueuePatientIds.has(apt.patient_id);
      return isToday && isNotCancelled && !isAlreadyIn;
    });
  }, [appointments, todayStr, activeQueuePatientIds, activeQueueAppointmentIds]);

  const currentlyInConsultation = useMemo(() => queue.find(q => q.status === 'en_consultation'), [queue]);
  const nextInLine = useMemo(() => queue.find(q => q.status === 'en_attente'), [queue]);

  // Helper pour parser de façon sûre les dates SQLite (UTC vs Local)
  const parseSafeDate = (dateStr?: string): Date => {
    if (!dateStr) return new Date();
    if (dateStr.endsWith('Z') || dateStr.includes('+') || (dateStr.includes('-') && dateStr.length > 19)) {
      return new Date(dateStr);
    }
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(dateStr)) {
      return new Date(dateStr.replace(' ', 'T') + 'Z');
    }
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  // Temps d'attente moyen (en minutes)
  const averageWaitMinutes = useMemo(() => {
    if (queue.length === 0) return 0;
    let totalMins = 0;
    let count = 0;
    queue.forEach(entry => {
      const created = parseSafeDate(entry.arrival_time).getTime();
      const updated = parseSafeDate(entry.updated_at || entry.arrival_time).getTime();
      const diff = Math.max(0, Math.floor((updated - created) / 60000));
      totalMins += diff;
      count++;
    });
    return count > 0 ? Math.round(totalMins / count) : 0;
  }, [queue]);

  // Filtrage des patients pour la recherche générale
  const filteredPatientsForAdd = useMemo(() => {
    if (!patientSearchTerm) return patients.slice(0, 10);
    const term = patientSearchTerm.toLowerCase();
    return patients.filter(p => 
      `${p.first_name} ${p.last_name}`.toLowerCase().includes(term) ||
      (p.phone && p.phone.includes(term))
    ).slice(0, 10);
  }, [patients, patientSearchTerm]);

  const handleAddPatientToQueue = async (patientId: number, appointmentId?: number, customNotes?: string, customPriority?: number) => {
    setIsSubmitting(true);
    try {
      await addToQueue({
        patient_id: patientId,
        appointment_id: appointmentId,
        priority: customPriority || priority,
        notes: customNotes || notes.trim() || undefined
      });
      toast({ title: 'Patient inscrit', description: 'Le patient a été ajouté à la salle d\'attente.' });
      setAddModalOpen(false);
      setSelectedPatientId(null);
      setPatientSearchTerm('');
      setNotes('');
      setPriority(2);
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateNewPatientAndAddToQueue = async () => {
    if (!newLastName.trim() || !newFirstName.trim()) {
      toast({ title: 'Champs manquants', description: 'Le nom et le prénom sont obligatoires', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      const created = await createPatient({
        first_name: newFirstName.trim(),
        last_name: newLastName.trim(),
        gender: newGender,
        date_of_birth: newDob || format(new Date(), 'yyyy-MM-dd'),
        phone: newPhone.trim() || undefined
      });

      await refreshPatients();

      await addToQueue({
        patient_id: created.id,
        priority,
        notes: notes.trim() || undefined
      });

      toast({ 
        title: 'Patient créé et inscrit', 
        description: `Le dossier de ${created.first_name} ${created.last_name} a été créé.` 
      });

      setAddModalOpen(false);
      setNewFirstName('');
      setNewLastName('');
      setNewDob('');
      setNewPhone('');
      setNotes('');
      setPriority(2);
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCallNext = async () => {
    if (!nextInLine) {
      toast({ title: 'Salle vide', description: 'Aucun patient en attente.' });
      return;
    }
    try {
      if ((window as any).electronAPI?.waitingRoom?.callNextPatient) {
        await (window as any).electronAPI.waitingRoom.callNextPatient();
      } else {
        await updateStatus(nextInLine.id, 'en_consultation');
      }
      const ticketNum = nextInLine.ticket_number || 1;
      toast({ 
        title: '📢 Patient appelé en salle d\'attente !', 
        description: `Ticket N° ${String(ticketNum).padStart(2, '0')} appelé sur l'écran TV.` 
      });
      // Ne PAS rediriger vers la consultation : la secrétaire reste sur la salle d'attente
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    }
  };

  const handleCallPatient = async (entry: WaitingRoomEntry) => {
    try {
      await updateStatus(entry.id, 'en_consultation');
      const ticketNum = entry.ticket_number || 1;
      toast({ 
        title: '📢 Patient appelé !', 
        description: `Ticket N° ${String(ticketNum).padStart(2, '0')} appelé sur l'écran TV.` 
      });
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    }
  };

  const handleUpdateStatus = async (id: number, status: 'en_attente' | 'en_consultation' | 'termine' | 'absent') => {
    try {
      await updateStatus(id, status);
      toast({ title: 'Statut mis à jour' });
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    }
  };

  const handleRemove = async (id: number) => {
    try {
      await removeFromQueue(id);
      toast({ title: 'Patient retiré de la file' });
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    }
  };

  const formatWaitTime = (arrivalTime: string) => {
    const arrDate = parseSafeDate(arrivalTime);
    const diffMins = Math.max(0, Math.floor((new Date().getTime() - arrDate.getTime()) / 60000));
    if (diffMins < 60) return `${diffMins} min`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}min`;
  };

  return (
    <div className="p-6 space-y-6 h-full flex flex-col bg-background overflow-y-auto font-sans">
      
      {/* ── En-tête Épuré (Léger Arrondi) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-5 rounded-lg border border-border">
        <div>
          <h2 className="text-xl font-bold text-foreground tracking-tight">
            Salle d'Attente
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            File d'attente du cabinet · {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {nextInLine && (
            <Button
              onClick={handleCallNext}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium h-9 px-4 text-xs rounded-md"
            >
              Appeler Suivant ({nextInLine.patient?.last_name})
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if ((window as any).electronAPI?.waitingRoom?.openDisplayWindow) {
                (window as any).electronAPI.waitingRoom.openDisplayWindow();
              } else {
                window.open('#/display', '_blank', 'width=1280,height=720');
              }
            }}
            className="border-primary/40 text-primary hover:bg-primary/5 font-semibold h-9 px-3.5 text-xs gap-1.5 rounded-md"
            title="Ouvrir l'affichage TV Salle d'Attente dans une fenêtre distincte"
          >
            <Tv className="w-4 h-4 text-primary shrink-0" />
            <span>🖥️ Fenêtre TV Salle d'Attente</span>
          </Button>

          <Button 
            onClick={() => setAddModalOpen(true)} 
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium h-9 px-4 text-xs gap-1.5 rounded-md"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Inscrire un Patient
          </Button>
        </div>
      </div>

      {/* ── Métriques Métier Sobres (Léger Arrondi) ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">En Attente</span>
          <span className="text-2xl font-bold text-foreground mt-1 block">
            {activeQueue.filter(q => q.status === 'en_attente').length}
          </span>
          <span className="text-[11px] text-muted-foreground">Patients au cabinet</span>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">En Consultation</span>
          <span className="text-2xl font-bold text-primary mt-1 block">
            {currentlyInConsultation ? '1' : '0'}
          </span>
          <span className="text-[11px] text-muted-foreground truncate block">
            {currentlyInConsultation ? `${currentlyInConsultation.patient?.first_name} ${currentlyInConsultation.patient?.last_name}` : 'Aucun patient'}
          </span>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">RDV du Jour Attendus</span>
          <span className="text-2xl font-bold text-foreground mt-1 block">
            {todayAppointmentsPending.length}
          </span>
          <span className="text-[11px] text-muted-foreground">Non encore arrivés</span>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Attente Moyenne</span>
          <span className="text-2xl font-bold text-foreground mt-1 block">{averageWaitMinutes} min</span>
          <span className="text-[11px] text-muted-foreground">Par consultation</span>
        </div>
      </div>

      {/* ── Disposition Principale (65% File Active / 35% RDV du jour & Historique) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        
        {/* ── COLONNE GAUCHE (File d'Attente Active - Léger Arrondi) ── */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          <Card className="border border-border flex-1 flex flex-col shadow-none rounded-lg overflow-hidden">
            <CardHeader className="py-3 px-5 border-b border-border bg-card flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold text-foreground">
                  Patients en Salle d'Attente ({activeQueue.length})
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Ordre de passage actualisé en temps réel
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="p-12 text-center text-muted-foreground text-xs">Chargement...</div>
              ) : activeQueue.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">
                  <p className="text-sm font-medium text-foreground">La salle d'attente est vide</p>
                  <p className="text-xs mt-1 text-muted-foreground">
                    Inscrivez un patient via le bouton "Inscrire un Patient" ou depuis la liste des rendez-vous.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {activeQueue.map((entry, index) => {
                    const isConsulting = entry.status === 'en_consultation';
                    return (
                      <div 
                        key={entry.id} 
                        className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                          isConsulting ? 'bg-primary/5 border-l-4 border-l-primary' : 'hover:bg-muted/30'
                        }`}
                      >
                        <div className="flex items-start gap-3.5 min-w-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 font-mono ${
                            isConsulting ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                          }`}>
                            {String(entry.ticket_number || (index + 1)).padStart(2, '0')}
                          </div>

                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-foreground text-sm">
                                {entry.patient?.last_name} {entry.patient?.first_name}
                              </span>
                              <span className="text-[11px] font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                Ticket N° {String(entry.ticket_number || (index + 1)).padStart(2, '0')}
                              </span>
                              {entry.priority === 1 && (
                                <Badge variant="destructive" className="text-[11px] px-1.5 py-0 font-medium rounded-sm">
                                  Urgence
                                </Badge>
                              )}
                              {isConsulting && (
                                <Badge className="bg-primary text-primary-foreground text-[11px] px-1.5 py-0 rounded-sm">
                                  En Consultation
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                              <span>Arrivé à {format(parseSafeDate(entry.arrival_time), 'HH:mm')}</span>
                              <span>·</span>
                              <span>Attente: {formatWaitTime(entry.arrival_time)}</span>
                              {entry.patient?.phone && (
                                <>
                                  <span>·</span>
                                  <span>{entry.patient.phone}</span>
                                </>
                              )}
                            </div>

                            {entry.notes && (
                              <p className="text-xs text-muted-foreground bg-muted/50 px-2.5 py-1 rounded border border-border/40 mt-1 inline-block">
                                {entry.notes}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Actions Rapides Secrétaire / Médecin */}
                        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center flex-wrap justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCallPatient(entry)}
                            className="text-xs h-8 gap-1 border-primary/40 text-primary hover:bg-primary/10 rounded-md font-semibold"
                            title="Appeler ce patient sur l'écran TV"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>Appeler</span>
                          </Button>

                          {onOpenPayment && entry.patient && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-8 gap-1 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 rounded-md font-bold"
                              onClick={() => onOpenPayment(entry.patient)}
                              title="Encaisser le paiement de ce patient"
                            >
                              <Banknote className="w-3.5 h-3.5" />
                              <span>Encaisser</span>
                            </Button>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedTicketEntry(entry);
                              setTicketPassModalOpen(true);
                            }}
                            className="text-xs h-8 gap-1 border-border text-foreground hover:bg-muted rounded-md"
                            title="Imprimer Ticket de Passage (80mm)"
                          >
                            <Ticket className="w-3.5 h-3.5 text-primary" />
                            <span>Ticket</span>
                          </Button>

                          {onStartConsultation && entry.patient && (
                            <Button
                              size="sm"
                              variant={isConsulting ? "default" : "outline"}
                              className={isConsulting ? "bg-primary text-primary-foreground text-xs h-8 rounded-md" : "text-xs h-8 border-primary/30 text-primary hover:bg-primary/10 rounded-md"}
                              onClick={() => {
                                handleUpdateStatus(entry.id, 'en_consultation');
                                onStartConsultation(entry.patient);
                              }}
                              title="Ouvrir le dossier médical en consultation"
                            >
                              Consultation
                            </Button>
                          )}

                          <Select 
                            value={entry.status} 
                            onValueChange={(val: any) => handleUpdateStatus(entry.id, val)}
                          >
                            <SelectTrigger className="w-[120px] h-8 text-xs font-normal rounded-md">
                              <SelectValue placeholder="Statut..." />
                            </SelectTrigger>
                            <SelectContent className="rounded-md">
                              <SelectItem value="en_attente">En attente</SelectItem>
                              <SelectItem value="en_consultation">En consultation</SelectItem>
                              <SelectItem value="termine">Terminé</SelectItem>
                              <SelectItem value="absent">Absent</SelectItem>
                            </SelectContent>
                          </Select>

                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleRemove(entry.id)}
                            className="text-muted-foreground hover:text-destructive h-8 w-8 rounded-md"
                            title="Retirer de la file"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── COLONNE DROITE (RDV du jour & Historique - Léger Arrondi) ── */}
        <div className="lg:col-span-4 space-y-4 flex flex-col">
          
          {/* Bloc RDV Prévus Aujourd'hui */}
          <Card className="border border-border shadow-none rounded-lg overflow-hidden">
            <CardHeader className="py-3 px-4 border-b border-border bg-card">
              <CardTitle className="text-xs font-semibold text-foreground uppercase tracking-wider">
                RDV du Jour Non Inscrits ({todayAppointmentsPending.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 max-h-[280px] overflow-y-auto divide-y divide-border">
              {todayAppointmentsPending.length === 0 ? (
                <div className="p-5 text-center text-xs text-muted-foreground">
                  Aucun autre rendez-vous prévu.
                </div>
              ) : (
                todayAppointmentsPending.map(apt => (
                  <div key={apt.id} className="p-3 flex items-center justify-between hover:bg-muted/30 transition-colors">
                    <div className="min-w-0">
                      <p className="font-semibold text-xs text-foreground truncate">
                        {apt.patient ? `${apt.patient.last_name} ${apt.patient.first_name}` : `Patient #${apt.patient_id}`}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        RDV {apt.time} · {apt.type}
                      </p>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7 px-2.5 text-primary border-primary/30 hover:bg-primary/10 shrink-0 rounded-md"
                      onClick={() => handleAddPatientToQueue(apt.patient_id, apt.id, `RDV ${apt.time}`)}
                    >
                      Arrivé
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Bloc Historique des Visites */}
          <Card className="border border-border shadow-none flex-1 rounded-lg overflow-hidden">
            <CardHeader className="py-3 px-4 border-b border-border bg-card">
              <CardTitle className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Historique du Jour ({pastQueue.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 max-h-[220px] overflow-y-auto divide-y divide-border">
              {pastQueue.length === 0 ? (
                <div className="p-5 text-center text-xs text-muted-foreground">
                  Aucune visite terminée.
                </div>
              ) : (
                pastQueue.map(entry => (
                  <div key={entry.id} className="p-3 flex items-center justify-between hover:bg-muted/20">
                    <div className="min-w-0">
                      <p className="font-medium text-xs truncate">
                        {entry.patient?.last_name} {entry.patient?.first_name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Arrivé à {format(parseSafeDate(entry.arrival_time), 'HH:mm')}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant={entry.status === 'termine' ? 'secondary' : 'outline'} className="text-[11px] rounded-sm">
                        {entry.status === 'termine' ? 'Terminé' : 'Absent'}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleUpdateStatus(entry.id, 'en_attente')}
                        title="Ré-inscrire"
                        className="rounded-md"
                      >
                        <ArrowRight className="w-3 h-3 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

      </div>

      {/* ── MODAL PROPRE ET ÉPURÉ D'INSCRIPTION (Léger Arrondi) ── */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="max-w-2xl sm:max-w-3xl rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              Inscription en Salle d'Attente
            </DialogTitle>
            <DialogDescription className="text-xs">
              Sélectionnez un patient avec RDV, un patient existant, ou créez une nouvelle fiche patient express.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={modalTab} onValueChange={(v: any) => setModalTab(v)} className="w-full mt-2">
            <TabsList className="grid grid-cols-3 w-full h-10 rounded-lg">
              <TabsTrigger value="rdv" className="text-xs rounded-md">
                RDV du Jour ({todayAppointmentsPending.length})
              </TabsTrigger>
              <TabsTrigger value="search" className="text-xs rounded-md">
                Patient Existant
              </TabsTrigger>
              <TabsTrigger value="new_patient" className="text-xs rounded-md">
                Nouveau Patient Express
              </TabsTrigger>
            </TabsList>

            {/* Onglet 1: RDV du jour */}
            <TabsContent value="rdv" className="space-y-3 pt-3">
              <div className="max-h-64 overflow-y-auto border border-border rounded-lg divide-y divide-border">
                {todayAppointmentsPending.length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted-foreground">
                    Tous les rendez-vous du jour sont déjà inscrits en salle d'attente.
                  </div>
                ) : (
                  todayAppointmentsPending.map(apt => (
                    <div key={apt.id} className="p-3 flex items-center justify-between hover:bg-muted/30">
                      <div>
                        <p className="font-semibold text-xs text-foreground">
                          {apt.patient ? `${apt.patient.last_name} ${apt.patient.first_name}` : `Patient #${apt.patient_id}`}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          RDV à {apt.time} · {apt.type} {apt.patient?.phone ? `· ${apt.patient.phone}` : ''}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs h-8 px-3 rounded-md"
                        onClick={() => handleAddPatientToQueue(apt.patient_id, apt.id, `RDV ${apt.time}`)}
                      >
                        Marquer Arrivé
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Onglet 2: Recherche générale */}
            <TabsContent value="search" className="space-y-4 pt-3">
              <div className="space-y-2">
                <Label className="text-xs font-medium">Rechercher un Patient *</Label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Recherche par nom, prénom ou téléphone..."
                    value={patientSearchTerm}
                    onChange={(e) => setPatientSearchTerm(e.target.value)}
                    className="pl-9 h-9 text-xs rounded-md"
                  />
                </div>
                
                <div className="max-h-44 overflow-y-auto border border-border rounded-lg divide-y divide-border mt-1">
                  {filteredPatientsForAdd.length === 0 ? (
                    <div className="p-3 text-xs text-muted-foreground text-center">Aucun patient trouvé.</div>
                  ) : (
                    filteredPatientsForAdd.map(p => (
                      <div
                        key={p.id}
                        onClick={() => setSelectedPatientId(p.id)}
                        className={`p-2.5 text-xs flex items-center justify-between cursor-pointer transition-colors ${
                          selectedPatientId === p.id ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-muted/50'
                        }`}
                      >
                        <div>
                          <span>{p.first_name} {p.last_name}</span>
                          {p.phone && <span className="text-muted-foreground ml-2 font-mono">({p.phone})</span>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Priorité</Label>
                  <Select value={priority.toString()} onValueChange={(v) => setPriority(parseInt(v))}>
                    <SelectTrigger className="h-8 text-xs rounded-md">
                      <SelectValue placeholder="Priorité..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-md">
                      <SelectItem value="2">Normale</SelectItem>
                      <SelectItem value="1">Urgence Médicale</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium">Notes / Motif</Label>
                  <Input
                    placeholder="Ex: Consultation générale..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="h-8 text-xs rounded-md"
                  />
                </div>
              </div>

              <Button 
                onClick={() => selectedPatientId && handleAddPatientToQueue(selectedPatientId)} 
                disabled={isSubmitting || !selectedPatientId}
                className="w-full h-9 text-xs font-medium bg-primary text-primary-foreground rounded-md"
              >
                {isSubmitting ? 'Inscription...' : 'Valider l\'inscription'}
              </Button>
            </TabsContent>

            {/* Onglet 3: Nouveau Patient Express */}
            <TabsContent value="new_patient" className="space-y-4 pt-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Nom de famille *</Label>
                  <Input
                    placeholder="Ex: Benali"
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                    className="h-8 text-xs rounded-md"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium">Prénom *</Label>
                  <Input
                    placeholder="Ex: Karim"
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                    className="h-8 text-xs rounded-md"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium">Genre *</Label>
                  <Select value={newGender} onValueChange={(v: any) => setNewGender(v)}>
                    <SelectTrigger className="h-8 text-xs rounded-md">
                      <SelectValue placeholder="Genre..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-md">
                      <SelectItem value="M">Masculin (M.)</SelectItem>
                      <SelectItem value="F">Féminin (Mme)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium">Date de Naissance</Label>
                  <Input
                    type="date"
                    value={newDob}
                    onChange={(e) => setNewDob(e.target.value)}
                    className="h-8 text-xs rounded-md"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs font-medium">Téléphone</Label>
                  <Input
                    placeholder="Ex: 0550 00 00 00"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="h-8 text-xs rounded-md"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border">
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Priorité</Label>
                  <Select value={priority.toString()} onValueChange={(v) => setPriority(parseInt(v))}>
                    <SelectTrigger className="h-8 text-xs rounded-md">
                      <SelectValue placeholder="Priorité..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-md">
                      <SelectItem value="2">Normale</SelectItem>
                      <SelectItem value="1">Urgence Médicale</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium">Motif / Notes</Label>
                  <Input
                    placeholder="Ex: Nouvelle consultation..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="h-8 text-xs rounded-md"
                  />
                </div>
              </div>

              <Button
                onClick={handleCreateNewPatientAndAddToQueue}
                disabled={isSubmitting || !newLastName.trim() || !newFirstName.trim()}
                className="w-full h-9 text-xs font-medium bg-primary text-primary-foreground rounded-md"
              >
                {isSubmitting ? 'Création...' : 'Créer le Patient & Inscrire en Salle d\'Attente'}
              </Button>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-2">
            <Button variant="outline" size="sm" onClick={() => setAddModalOpen(false)} className="rounded-md">Annuler</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Impression Ticket de Passage 80mm */}
      <ThermalTicketPassModal
        open={ticketPassModalOpen}
        onOpenChange={setTicketPassModalOpen}
        entry={selectedTicketEntry}
        queueNumber={selectedTicketEntry ? activeQueue.findIndex(q => q.id === selectedTicketEntry.id) + 1 : 1}
        patientsAhead={selectedTicketEntry ? Math.max(0, activeQueue.findIndex(q => q.id === selectedTicketEntry.id)) : 0}
      />
    </div>
  );
};
