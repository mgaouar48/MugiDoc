import { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, Receipt, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Payment, Patient } from '../../../shared/types';
import { useSettings } from '@/hooks/useSettings';

interface ThermalReceiptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment?: Payment | null;
  patient?: Patient | null;
  actName?: string;
  amount?: number;
  /**
   * Montant réellement encaissé lors de CETTE opération. Sur la clôture d'une
   * dette, le ticket doit porter ce montant et non le total de la
   * consultation, déjà réglé en partie lors d'un passage précédent.
   */
  paidNow?: number;
  /** Somme réglée avant cette opération, affichée en rappel. */
  previouslyPaid?: number;
}

export const ThermalReceiptModal = ({
  open,
  onOpenChange,
  payment,
  patient,
  actName = 'Consultation Médicale',
  amount = 2000,
  paidNow,
  previouslyPaid
}: ThermalReceiptModalProps) => {
  const printRef = useRef<HTMLDivElement | null>(null);
  const { getSetting } = useSettings();

  const cabinetName = getSetting('cabinet_name', 'Cabinet Médical');
  const doctorName = getSetting('doctor_name', 'Dr. [Nom du Médecin]');
  const doctorSpeciality = getSetting('doctor_speciality', 'Médecine Générale');
  const cabinetPhone = getSetting('cabinet_phone', '');
  const cabinetAddress = getSetting('cabinet_address', '');

  // Total de l'acte, reste dû, et part encaissée sur ce ticket.
  const invoiceTotal = payment ? payment.amount : amount;
  const remainingDue = payment?.debt_amount ?? 0;
  // Sans `paidNow` (réimpression depuis la liste), on retombe sur la part
  // réglée globalement : total - reste dû.
  const collected = paidNow ?? Math.max(0, invoiceTotal - remainingDue);
  const priorPaid = previouslyPaid ?? Math.max(0, invoiceTotal - remainingDue - collected);
  const isPartOfInvoice = collected !== invoiceTotal;

  const paymentDate = payment?.date ? payment.date : format(new Date(), 'yyyy-MM-dd HH:mm');
  // `Payment` porte `method`, pas `payment_method` : la carte s'imprimait
  // systématiquement en « Espèces ».
  const paymentMethod = payment?.method === 'card' ? 'Carte / Chèque' : 'Espèces';
  const receiptNo = payment?.id ? `REC-${String(payment.id).padStart(6, '0')}` : `REC-${Date.now().toString().slice(-6)}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-5 rounded-xl">
        <DialogHeader className="border-b border-border pb-2">
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <Receipt className="w-4 h-4 text-primary" />
            Impression Ticket Thermique (80mm)
          </DialogTitle>
        </DialogHeader>

        {/* zone d'impression du ticket 80mm */}
        <div className="flex justify-center bg-slate-100 dark:bg-slate-900 p-4 rounded-lg">
          <div 
            ref={printRef}
            className="w-[80mm] min-h-[100mm] bg-white text-black p-4 shadow-md font-mono text-xs space-y-3 leading-tight select-text border border-slate-200 print:w-full print:shadow-none print:border-none print:p-0 print:m-0"
            style={{ fontFamily: "'Courier New', Courier, monospace" }}
          >
            {/* CSS d'impression 80mm spécifique */}
            <style>{`
              @media print {
                body * {
                  visibility: hidden;
                }
                #thermal-receipt-content, #thermal-receipt-content * {
                  visibility: visible;
                }
                #thermal-receipt-content {
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

            <div id="thermal-receipt-content" className="space-y-3">
              {/* En-tête du Ticket */}
              <div className="text-center space-y-1 pb-2 border-b border-dashed border-slate-400">
                <div className="flex items-center justify-center mb-1">
                  <img src="./icon.png" alt="MugiDoc" className="h-10 w-auto object-contain" />
                </div>
                <p className="font-extrabold text-sm uppercase tracking-wider">{cabinetName}</p>
                <p className="font-bold text-xs">{doctorName}</p>
                <p className="text-[11px]">{doctorSpeciality}</p>
                {cabinetAddress && <p className="text-[11px]">{cabinetAddress}</p>}
                {cabinetPhone && <p className="text-[11px]">Tél: {cabinetPhone}</p>}
              </div>

              {/* Info Reçu */}
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Ticket N°:</span>
                  <span className="font-bold">{receiptNo}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span>{paymentDate}</span>
                </div>
                {patient && (
                  <div className="flex justify-between font-bold pt-1 border-t border-dotted border-slate-300">
                    <span>Patient:</span>
                    <span>{patient.last_name} {patient.first_name}</span>
                  </div>
                )}
              </div>

              {/* Détails du Paiement */}
              <div className="py-2 border-y border-dashed border-slate-400 space-y-1">
                <div className="flex justify-between font-bold border-b border-slate-200 pb-1">
                  <span>Désignation</span>
                  <span>Montant</span>
                </div>
                <div className="flex justify-between text-[11px] pt-1">
                  <span className="truncate max-w-[140px]">{actName}</span>
                  <span>{collected.toLocaleString()} DA</span>
                </div>
              </div>

              {/* Total & Règlement */}
              <div className="space-y-1 text-right pt-1">
                {/*
                  Le montant mis en avant est celui réellement encaissé sur ce
                  ticket. Le total de la facture n'apparaît qu'en rappel quand
                  l'opération n'en règle qu'une partie (acompte ou solde de dette).
                */}
                {isPartOfInvoice && (
                  <div className="flex justify-between text-[11px] text-slate-600">
                    <span>Total consultation:</span>
                    <span>{invoiceTotal.toLocaleString()} DA</span>
                  </div>
                )}

                {priorPaid > 0 && (
                  <div className="flex justify-between text-[11px] text-slate-600">
                    <span>Déjà réglé:</span>
                    <span>{priorPaid.toLocaleString()} DA</span>
                  </div>
                )}

                <div className="flex justify-between text-sm font-extrabold border-b-2 border-black pb-1">
                  <span>{remainingDue > 0 ? 'VERSÉ CE JOUR:' : 'TOTAL PAYÉ:'}</span>
                  <span>{collected.toLocaleString()} DA</span>
                </div>

                {remainingDue > 0 ? (
                  <div className="flex justify-between text-xs font-extrabold text-red-600 pt-1">
                    <span>Reste dû:</span>
                    <span>{remainingDue.toLocaleString()} DA</span>
                  </div>
                ) : isPartOfInvoice ? (
                  <div className="flex justify-between text-[11px] font-bold text-emerald-800 pt-1">
                    <span>Dette soldée</span>
                    <span>0 DA</span>
                  </div>
                ) : null}

                <div className="flex justify-between text-[11px] text-slate-600 pt-1">
                  <span>Mode de règlement:</span>
                  <span className="font-bold text-black uppercase">{paymentMethod}</span>
                </div>
              </div>

              {/* Pied de ticket */}
              <div className="text-center pt-3 border-t border-dashed border-slate-400 space-y-1 text-[11px]">
                <p className="font-bold">Prompt Rétablissement !</p>
                <p className="text-[11px] text-slate-500">MugiDoc · Logiciel de Gestion Médicale</p>
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
            Imprimer Ticket (80mm)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
