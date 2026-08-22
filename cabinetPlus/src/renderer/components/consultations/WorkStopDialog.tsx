import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Printer, Save, Stethoscope } from "lucide-react";
import { Patient } from "../../../shared/types";
import { useSettings } from "../../hooks/useSettings";
import { useCabinetLogo } from "../../hooks/useCabinetLogo";
import { useToast } from "../../hooks/use-toast";

import { useAuth } from "../../hooks/useAuth";
import { usePatients } from "../../hooks/usePatients";

interface WorkStopDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: Patient | null;
  consultationId?: number | null;
}

export const WorkStopDialog = ({
  open,
  onOpenChange,
  patient,
  consultationId
}: WorkStopDialogProps) => {
  const { loadPatients } = usePatients();
  const { user } = useAuth();

  useEffect(() => {
    if (open) {
      loadPatients();
      setIsPreview(false);
    }
  }, [open, loadPatients]);
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [daysCount, setDaysCount] = useState<string>("3");
  const [textContent, setTextContent] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isPreview, setIsPreview] = useState<boolean>(false);

  const { settings, getSetting, loadSettings } = useSettings();
  const { logoUrl, hasLogo } = useCabinetLogo();
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const doctorName = user && (user.first_name || user.last_name)
    ? `Dr. ${user.first_name || ''} ${user.last_name || ''}`.trim()
    : (getSetting("doctor_first_name") && getSetting("doctor_last_name")
        ? `Dr. ${getSetting("doctor_first_name")} ${getSetting("doctor_last_name")}`
        : getSetting("doctor_name", "Dr. [Nom du Médecin]"));
  const doctorSpeciality = user?.speciality || getSetting("doctor_speciality", "Médecine Générale");
  const cabinetName = getSetting("cabinet_name", "Cabinet Médical");
  const cabinetAddress = getSetting("cabinet_address", "");

  const civility = patient ? (patient.gender === 'F' ? 'Mme' : 'M.') : 'M. / Mme';
  const patientFullName = patient ? `${patient.first_name} ${patient.last_name}` : '[Nom du Patient]';

  // Calculer et initialiser le texte dynamique de l'arrêt de travail
  useEffect(() => {
    const startFormatted = new Date(startDate).toLocaleDateString("fr-FR");
    const days = parseInt(daysCount || "1", 10);
    const end = new Date(startDate);
    if (!isNaN(end.getTime())) {
      end.setDate(end.getDate() + (days > 0 ? days - 1 : 0));
    }
    const endFormatted = !isNaN(end.getTime()) ? end.toLocaleDateString("fr-FR") : startFormatted;

    const defaultText = `Je soussigné(e), ${doctorName}, certifie avoir examiné ce jour ${civility} ${patientFullName} et constaté un état de santé nécessitant un arrêt de travail d'une durée de ${daysCount} jour(s), du ${startFormatted} au ${endFormatted} inclus.`;
    setTextContent(defaultText);
  }, [startDate, daysCount, patient, doctorName, civility]);

  const handlePrint = () => {
    window.print();
  };

  const handleSave = () => {
    toast({
      title: "Arrêt de travail enregistré",
      description: `L'arrêt de travail de ${daysCount} jour(s) pour ${civility} ${patientFullName} a été enregistré avec succès.`,
    });
    onOpenChange(false);
  };

  const [paperFormat, setPaperFormat] = useState<'A4' | 'A5'>('A4');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Stethoscope className="w-5 h-5 text-red-600" />
              Certificat d'Arrêt de Travail
            </DialogTitle>
            {isPreview && (
              <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
                <Button
                  type="button"
                  variant={paperFormat === 'A4' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setPaperFormat('A4')}
                  className="h-7 text-xs font-semibold px-2.5"
                >
                  Format A4
                </Button>
                <Button
                  type="button"
                  variant={paperFormat === 'A5' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setPaperFormat('A5')}
                  className="h-7 text-xs font-semibold px-2.5"
                >
                  Format A5
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>

        {!isPreview ? (
          <div className="space-y-4 py-2">
            <div className="bg-muted/40 p-3 rounded-lg border border-border flex items-center justify-between text-sm">
              <div>
                <span className="text-muted-foreground">Patient : </span>
                <span className="font-bold text-foreground">
                  <span className="text-primary mr-1">{civility}</span>
                  {patientFullName}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Date de début d'arrêt</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="daysCount">Durée d'arrêt (en jours)</Label>
                <Input
                  id="daysCount"
                  type="number"
                  min="1"
                  max="365"
                  value={daysCount}
                  onChange={(e) => setDaysCount(e.target.value)}
                />
              </div>
            </div>

            {/* Zone de texte 100% personnalisable */}
            <div className="space-y-2">
              <Label htmlFor="textContent" className="font-semibold text-foreground flex items-center justify-between">
                <span>Texte du Certificat d'Arrêt (entièrement modifiable)</span>
                <span className="text-xs text-muted-foreground font-normal">Vous pouvez écrire ou modifier librement le texte</span>
              </Label>
              <Textarea
                id="textContent"
                rows={5}
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                className="font-sans text-sm leading-relaxed"
                placeholder="Texte de l'arrêt..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Remarques ou Prescriptions particulières (Optionnel)</Label>
              <Textarea
                id="notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Raison ou observations cliniques..."
              />
            </div>
          </div>
        ) : (
          <div className="bg-slate-200/70 dark:bg-slate-900/80 p-4 sm:p-6 rounded-xl overflow-x-auto flex justify-center border border-border shadow-inner">
            <div className={`printable-document ${paperFormat === 'A5' ? 'format-a5 max-w-[148mm] min-h-[210mm] p-6' : 'max-w-[210mm] min-h-[297mm] p-10'} w-full bg-white text-gray-900 shadow-2xl rounded-sm border border-gray-300 flex flex-col justify-between font-sans transition-all duration-200`}>
              <div className="flex justify-between items-start border-b pb-4">
                <div>
                  <h2 className="text-lg font-bold uppercase">{doctorName}</h2>
                  <p className="text-sm text-gray-600">{doctorSpeciality}</p>
                  <p className="text-xs text-gray-500">{cabinetName} - {cabinetAddress}</p>
                </div>
                {hasLogo && logoUrl && (
                  <img src={logoUrl} alt="Logo Cabinet" className="w-16 h-16 object-contain" />
                )}
              </div>

              <div className="text-center my-4">
                <h1 className="text-2xl font-bold uppercase tracking-wider text-gray-900 border-b-2 border-gray-900 inline-block pb-1">
                  CERTIFICAT D'ARRET DE TRAVAIL
                </h1>
              </div>

              <div className="text-base leading-relaxed py-4 whitespace-pre-line font-serif text-justify">
                {textContent}
                {notes && (
                  <div className="mt-4 pt-2 text-sm text-gray-700 italic border-l-2 border-gray-300 pl-3">
                    Remarques: {notes}
                  </div>
                )}
              </div>

              <div className="pt-10 text-right">
                <p className="text-sm font-semibold">Signature & Cachet du Médecin</p>
                <div className="h-16"></div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex items-center justify-between sm:justify-between pt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsPreview(!isPreview)}
          >
            {isPreview ? "Éditer le texte" : "👁️ Aperçu d'impression"}
          </Button>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrint}
              className="gap-1.5"
            >
              <Printer className="w-4 h-4" />
              Imprimer / PDF
            </Button>

            <Button
              type="button"
              onClick={handleSave}
              className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5"
            >
              <Save className="w-4 h-4" />
              Enregistrer
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
