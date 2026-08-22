import { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, Ticket, Check } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { WaitingRoomEntry } from '@/shared/types';
import { useSettings } from '@/hooks/useSettings';

interface ThermalTicketPassModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry?: WaitingRoomEntry | null;
  queueNumber?: number;
  patientsAhead?: number;
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

export const ThermalTicketPassModal = ({
  open,
  onOpenChange,
  entry,
  queueNumber = 1,
  patientsAhead = 0
}: ThermalTicketPassModalProps) => {
  const printRef = useRef<HTMLDivElement | null>(null);
  const { getSetting } = useSettings();

  const cabinetName = getSetting('cabinet_name', 'Cabinet Médical');
  const doctorName = getSetting('doctor_name', 'Dr. [Nom du Médecin]');
  const doctorSpeciality = getSetting('doctor_speciality', 'Médecine Générale');

  const patientName = entry?.patient 
    ? `${entry.patient.last_name} ${entry.patient.first_name}` 
    : 'Patient';
  const arrivalTime = entry?.arrival_time 
    ? format(parseSafeDate(entry.arrival_time), 'HH:mm') 
    : format(new Date(), 'HH:mm');

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-5 rounded-xl">
        <DialogHeader className="border-b border-border pb-2">
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <Ticket className="w-4 h-4 text-primary" />
            Impression Ticket de Passage (80mm)
          </DialogTitle>
        </DialogHeader>

        {/* Zone d'impression du ticket de passage 80mm */}
        <div className="flex justify-center bg-slate-100 dark:bg-slate-900 p-4 rounded-lg">
          <div 
            ref={printRef}
            className="w-[80mm] min-h-[90mm] bg-white text-black p-4 shadow-md font-mono text-xs space-y-3 leading-tight select-text border border-slate-200 print:w-full print:shadow-none print:border-none print:p-0 print:m-0"
            style={{ fontFamily: "'Courier New', Courier, monospace" }}
          >
            {/* CSS d'impression 80mm spécifique */}
            <style>{`
              @media print {
                body * {
                  visibility: hidden;
                }
                #thermal-pass-content, #thermal-pass-content * {
                  visibility: visible;
                }
                #thermal-pass-content {
                  position: absolute;
                  left: 0;
                  top: 0;
                  width: 80mm !important;
                  padding: 2mm !important;
                }
                @page {
                  size: 80mm auto;
                  margin: 0mm;
                }
              }
            `}</style>

            <div id="thermal-pass-content" className="space-y-3 text-center">
              {/* En-tête du Cabinet */}
              <div className="space-y-1 pb-2 border-b border-dashed border-slate-400">
                <p className="font-extrabold text-xs uppercase tracking-wider">{cabinetName}</p>
                <p className="font-bold text-[11px]">{doctorName}</p>
                <p className="text-[11px] text-slate-600">{doctorSpeciality}</p>
              </div>

              {/* Titre Ticket de Passage */}
              <div className="py-1">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-700">TICKET DE PASSAGE</p>
                <p className="text-[11px] text-slate-500">{format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}</p>
              </div>

              {/* Numéro de Passage GÉANT */}
              <div className="py-3 bg-slate-100 border-2 border-black rounded-lg">
                <span className="text-[11px] uppercase font-bold text-slate-600 block">VOTRE NUMÉRO DE PASSAGE</span>
                <span className="text-4xl font-extrabold text-black tracking-wider block mt-1">
                  N° {String(queueNumber).padStart(2, '0')}
                </span>
              </div>

              {/* Détails du Patient et Attente */}
              <div className="space-y-1 text-left text-[11px] pt-1">
                <div className="flex justify-between">
                  <span>Patient:</span>
                  <span className="font-bold truncate max-w-[130px]">{patientName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Heure d'arrivée:</span>
                  <span className="font-bold">{arrivalTime}</span>
                </div>
                <div className="flex justify-between">
                  <span>Patients devant vous:</span>
                  <span className="font-bold">{patientsAhead}</span>
                </div>
              </div>

              {/* Pied de Ticket */}
              <div className="pt-3 border-t border-dashed border-slate-400 space-y-0.5 text-[11px] text-slate-600">
                <p className="font-bold text-black">Veuillez patienter en salle d'attente</p>
                <p>Merci pour votre patience</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t border-border pt-3 flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="rounded-md">
            Annuler
          </Button>
          <Button size="sm" onClick={handlePrint} className="bg-primary text-primary-foreground text-xs gap-1.5 rounded-md">
            <Printer className="w-3.5 h-3.5" />
            Imprimer Ticket de Passage (80mm)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
