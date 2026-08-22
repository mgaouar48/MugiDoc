import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Volume2, VolumeX, Maximize2, Minimize2, Bell, Clock, Users, UserCheck } from 'lucide-react';
import { WaitingRoomEntry } from '@/shared/types';
import { useSettings } from '@/hooks/useSettings';
import { playCallChime } from '@/utils/audioChime';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface WaitingRoomDisplayModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  queue: WaitingRoomEntry[];
}

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

export const WaitingRoomDisplayModal = ({
  open,
  onOpenChange,
  queue
}: WaitingRoomDisplayModalProps) => {
  const { getSetting } = useSettings();
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<string>(format(new Date(), 'HH:mm:ss'));
  const containerRef = useRef<HTMLDivElement | null>(null);

  const cabinetName = getSetting('cabinet_name', 'Cabinet Médical');
  const doctorName = getSetting('doctor_name', 'Dr. [Nom du Médecin]');
  const doctorSpeciality = getSetting('doctor_speciality', 'Médecine Générale');

  const currentInConsultation = queue.find(q => q.status === 'en_consultation');
  const activeWaitingList = queue.filter(q => q.status === 'en_attente');

  const currentCalledNumber = currentInConsultation 
    ? (currentInConsultation.ticket_number ?? 1)
    : null;

  const currentPatientName = currentInConsultation?.patient 
    ? `${currentInConsultation.patient.last_name} ${currentInConsultation.patient.first_name}`
    : 'En attente du prochain appel...';

  const lastCalledRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open) return;
    if (currentCalledNumber !== null && currentCalledNumber !== lastCalledRef.current) {
      if (soundEnabled && lastCalledRef.current !== null) {
        playCallChime();
      }
      lastCalledRef.current = currentCalledNumber;
    }
  }, [currentCalledNumber, open, soundEnabled]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(format(new Date(), 'HH:mm:ss'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => console.error(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(err => console.error(err));
      setIsFullscreen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[98vw] w-[98vw] h-[95vh] max-h-[95vh] p-0 rounded-2xl overflow-hidden bg-background text-foreground border-border shadow-2xl">
        <DialogTitle className="sr-only">Affichage TV Salle d'attente</DialogTitle>
        <div ref={containerRef} className="flex flex-col h-full bg-background text-foreground relative select-none">
          
          {/* En-tête épuré identique au logiciel */}
          <header className="px-6 py-4 bg-card border-b border-border flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-3.5">
              <div>
                <h1 className="text-lg font-bold text-foreground uppercase tracking-tight leading-none">{cabinetName}</h1>
                <p className="text-xs text-muted-foreground mt-0.5 font-medium">{doctorName} · <span className="text-muted-foreground/80">{doctorSpeciality}</span></p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <span className="text-2xl font-mono font-bold text-foreground tracking-wider block leading-none">{currentTime}</span>
                <span className="text-[11px] text-muted-foreground capitalize mt-0.5 block">{format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => {
                    playCallChime();
                    setSoundEnabled(!soundEnabled);
                  }}
                  className="h-8 w-8 rounded-md text-foreground"
                  title={soundEnabled ? "Son activé (Tester Carillon)" : "Son désactivé"}
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4 text-primary" /> : <VolumeX className="w-4 h-4 text-muted-foreground" />}
                </Button>

                <Button
                  size="icon"
                  variant="outline"
                  onClick={toggleFullscreen}
                  className="h-8 w-8 rounded-md text-foreground"
                  title="Plein Écran"
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </header>

          {/* Corps principal épuré et sobre */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 overflow-hidden">
            
            {/* Carte principale : Patient en consultation / Numéro appelé */}
            <div className="lg:col-span-8 bg-card border border-border rounded-xl p-8 flex flex-col justify-between shadow-2xs">
              
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                  <Bell className="w-4 h-4 text-primary" />
                  Patient en Consultation
                </span>
                <span className="text-xs text-muted-foreground font-medium">Cabinet N° 1</span>
              </div>
              
              <div className="my-auto text-center space-y-5 py-8">
                <span className="text-sm font-semibold text-muted-foreground uppercase tracking-widest block">Numéro Appelé</span>
                
                <div className="inline-block bg-muted/40 px-12 py-8 rounded-3xl border-2 border-primary/40 shadow-2xs">
                  <span className="text-8xl md:text-9xl font-black font-mono text-primary tracking-wider">
                    {currentCalledNumber !== null ? `N° ${String(currentCalledNumber).padStart(2, '0')}` : '--'}
                  </span>
                </div>

                <p className="text-lg md:text-xl font-bold text-foreground flex items-center justify-center gap-2 pt-2">
                  <UserCheck className="w-5 h-5 text-primary" />
                  <span>
                    {currentCalledNumber !== null 
                      ? "Veuillez vous présenter en salle de consultation" 
                      : "En attente du prochain appel..."}
                  </span>
                </p>
              </div>

              <div className="pt-3 border-t border-border text-muted-foreground text-xs flex justify-between">
                <span>{cabinetName} · {doctorName}</span>
                <span>Merci pour votre patience</span>
              </div>
            </div>

            <div className="lg:col-span-4 bg-card border border-border rounded-xl p-5 flex flex-col space-y-4 shadow-2xs">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  File d'Attente
                </h3>
                <span className="text-xs text-muted-foreground font-mono font-semibold">
                  {activeWaitingList.length} patient(s)
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {activeWaitingList.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground text-xs font-medium">
                    Aucun patient en attente
                  </div>
                ) : (
                  activeWaitingList.map((item, idx) => {
                    const queueNum = item.ticket_number || (idx + 1);
                    return (
                      <div
                        key={item.id}
                        className={`p-3 rounded-lg border flex items-center justify-between transition-colors ${
                          idx === 0 
                            ? 'bg-primary/5 border-primary/30 text-foreground font-semibold' 
                            : 'bg-muted/30 border-border text-foreground'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded bg-muted font-mono font-bold text-primary text-xs flex items-center justify-center border border-border">
                            {String(queueNum).padStart(2, '0')}
                          </span>
                          <div>
                            <p className="font-bold text-xs text-foreground">
                              Ticket N° {String(queueNum).padStart(2, '0')}
                            </p>
                            {item.arrival_time && (
                              <p className="text-[11px] text-muted-foreground">
                                Arrivée : {item.arrival_time ? format(parseSafeDate(item.arrival_time), 'HH:mm') : ''}
                              </p>
                            )}
                          </div>
                        </div>

                        {idx === 0 && (
                          <span className="text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded font-semibold">
                            Suivant
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>

          <footer className="bg-card border-t border-border px-6 py-2 text-xs text-muted-foreground flex items-center justify-between">
            <span>Information : Veuillez garder vos téléphones en mode silencieux.</span>
            <span className="text-muted-foreground/70 text-[11px]">{cabinetName} · {doctorName}</span>
          </footer>

        </div>
      </DialogContent>
    </Dialog>
  );
};
