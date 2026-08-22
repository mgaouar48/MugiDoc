import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Printer, Save, FileText, Eye, Edit3, RotateCcw, Clock, ShieldCheck, UserCheck, CalendarCheck, FileCheck, CheckCircle2 } from "lucide-react";
import { Patient } from "../../../shared/types";
import { useSettings } from "../../hooks/useSettings";
import { useCabinetLogo } from "../../hooks/useCabinetLogo";
import { useToast } from "../../hooks/use-toast";
import { PatientCombobox } from "../ui/patient-combobox";
import { usePatients } from "../../hooks/usePatients";
import { useAuth } from "../../hooks/useAuth";

export interface SavedCertificate {
  id: string;
  date: string;
  patientId?: number;
  patientName: string;
  patientCivility: string;
  patientGender?: string;
  typeKey: string;
  typeTitle: string;
  content: string;
  startDate?: string;
  restDays?: string;
  createdAt: string;
}

interface MedicalCertificateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: Patient | null;
  consultationId?: number | null;
  initialCertType?: string;
  onSuccess?: () => void;
}

export const getCertTitle = (typeKey: string) => {
  switch (typeKey) {
    case "general": return "Certificat Médical de Repos";
    case "aptitude": return "Certificat d'Aptitude Physique";
    case "reprise": return "Certificat de Reprise";
    case "presence": return "Certificat de Présence";
    case "non_contre_indication": return "Certificat de Non-Contre-Indication";
    case "custom": return "Certificat Personnalisé";
    default: return "Certificat Médical";
  }
};

export const MedicalCertificateDialog = ({
  open,
  onOpenChange,
  patient: initialPatient,
  consultationId,
  initialCertType = "general",
  onSuccess
}: MedicalCertificateDialogProps) => {
  const { patients, loadPatients } = usePatients();
  const { user } = useAuth();
  const [patient, setPatient] = useState<Patient | null>(initialPatient);

  useEffect(() => {
    if (open) {
      loadPatients();
      setIsPreview(false);
      if (initialCertType) {
        setCertType(initialCertType);
      }
      if (!initialPatient) {
        setPatient(null);
      }
    }
  }, [open, loadPatients, initialPatient, initialCertType]);

  useEffect(() => {
    if (initialPatient) setPatient(initialPatient);
  }, [initialPatient]);

  const [certType, setCertType] = useState<string>(initialCertType || "general");

  useEffect(() => {
    if (initialCertType) {
      setCertType(initialCertType);
    }
  }, [initialCertType, open]);

  const [certDate, setCertDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [restDays, setRestDays] = useState<string>("3");
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState<string>("09:00");
  const [endTime, setEndTime] = useState<string>("10:00");
  const [sportName, setSportName] = useState<string>("");
  const [certContent, setCertContent] = useState<string>("");
  const [isPreview, setIsPreview] = useState<boolean>(false);
  const [paperFormat, setPaperFormat] = useState<'A4' | 'A5'>('A4');

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
  const cabinetPhone = getSetting("cabinet_phone", "");

  const civility = patient ? (patient.gender === 'F' ? 'Mme' : 'M.') : 'M. / Mme';
  const patientFullName = patient ? `${patient.first_name} ${patient.last_name}` : '[Nom du Patient]';

  const calculateEndDate = () => {
    const days = parseInt(restDays || "1", 10);
    const start = new Date(startDate);
    if (isNaN(start.getTime())) return new Date().toLocaleDateString("fr-FR");
    start.setDate(start.getDate() + (days > 0 ? days - 1 : 0));
    return start.toLocaleDateString("fr-FR");
  };

  const generateDefaultText = () => {
    const startFormatted = new Date(startDate).toLocaleDateString("fr-FR");
    const endFormatted = calculateEndDate();
    const activityStr = sportName ? `à la pratique du ${sportName}` : "à la pratique d'une activité physique et sportive";

    switch (certType) {
      case "general":
        return `Je soussigné(e), ${doctorName}, certifie avoir examiné ce jour ${civility} ${patientFullName} et constaté un état de santé nécessitant un repos médical et un arrêt de travail de ${restDays} jour(s), du ${startFormatted} au ${endFormatted} inclus, sauf complications.`;
      case "aptitude":
        return `Je soussigné(e), ${doctorName}, certifie avoir examiné ce jour ${civility} ${patientFullName} et n'avoir constaté à ce jour aucune contre-indication clinique décelable ${activityStr}.`;
      case "reprise":
        return `Je soussigné(e), ${doctorName}, certifie que l'état de santé de ${civility} ${patientFullName} lui permet la reprise de ses activités habituelles (professionnelles / scolaires) à compter du ${startFormatted}.`;
      case "presence":
        return `Je soussigné(e), ${doctorName}, certifie que ${civility} ${patientFullName} a été présent(e) à mon cabinet ce jour de ${startTime} à ${endTime} pour y recevoir des soins et une consultation médicale.`;
      case "non_contre_indication":
        return `Je soussigné(e), ${doctorName}, certifie avoir examiné ${civility} ${patientFullName} et atteste de l'absence de contre-indication médicale apparente à la pratique sportive.`;
      default:
        return `Je soussigné(e), ${doctorName}, certifie que ${civility} ${patientFullName} présente un état de santé nécessitant la délivrance de la présente attestation médicale.`;
    }
  };

  useEffect(() => {
    setCertContent(generateDefaultText());
  }, [certType, patient, doctorName, certDate, restDays, startDate, startTime, endTime, sportName]);

  const handleResetText = () => {
    setCertContent(generateDefaultText());
    toast({
      title: "Texte réinitialisé",
      description: "Le texte officiel par défaut a été réappliqué.",
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSave = () => {
    if (!patient) {
      toast({ title: "Patient requis", description: "Veuillez sélectionner un patient.", variant: "destructive" });
      return;
    }

    const savedCert: SavedCertificate = {
      id: "cert_" + Date.now(),
      date: certDate,
      patientId: patient.id,
      patientName: `${patient.first_name} ${patient.last_name}`,
      patientCivility: civility,
      patientGender: patient.gender,
      typeKey: certType,
      typeTitle: getCertTitle(certType),
      content: certContent,
      startDate: startDate,
      restDays: restDays,
      createdAt: new Date().toISOString()
    };

    try {
      const existing = JSON.parse(localStorage.getItem("mugidoc_certificates_history") || "[]");
      existing.unshift(savedCert);
      localStorage.setItem("mugidoc_certificates_history", JSON.stringify(existing));
    } catch (e) {
      console.error(e);
    }

    toast({
      title: "Certificat enregistré",
      description: `Le certificat médical pour ${civility} ${patientFullName} a été enregistré dans l'historique avec succès.`,
    });
    if (onSuccess) onSuccess();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[96vw] w-[96vw] xl:max-w-[1400px] h-[94vh] max-h-[94vh] flex flex-col overflow-hidden p-6 bg-card border-border shadow-xl">
        <DialogHeader className="border-b border-border pb-4 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                  {getCertTitle(certType)}
                </DialogTitle>
                <p className="text-xs text-muted-foreground">Rédaction et personnalisation du document officiel</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center bg-muted p-1 rounded-lg border border-border">
                <Button
                  type="button"
                  variant={!isPreview ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setIsPreview(false)}
                  className="h-7 text-xs gap-1 px-3"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Formulaire
                </Button>
                <Button
                  type="button"
                  variant={isPreview ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setIsPreview(true)}
                  className="h-7 text-xs gap-1 px-3"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Aperçu d'Impression
                </Button>
              </div>

              {isPreview && (
                <div className="flex items-center bg-muted p-1 rounded-lg border border-border">
                  <Button
                    type="button"
                    variant={paperFormat === 'A4' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setPaperFormat('A4')}
                    className="h-7 text-xs font-semibold px-2.5"
                  >
                    A4
                  </Button>
                  <Button
                    type="button"
                    variant={paperFormat === 'A5' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setPaperFormat('A5')}
                    className="h-7 text-xs font-semibold px-2.5"
                  >
                    A5
                  </Button>
                </div>
              )}
            </div>
          </div>
        </DialogHeader>

        {!isPreview ? (
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] gap-6 py-4 items-stretch flex-1 min-h-0 overflow-y-auto">

            {/* --- Colonne gauche : paramètres --- */}
            <div className="space-y-4">

              {/* Sélection ou rappel du patient */}
              {!initialPatient ? (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Patient *</Label>
                  <PatientCombobox
                    patients={patients}
                    selectedPatient={patient}
                    onPatientSelect={(p) => setPatient(p)}
                    onOpen={loadPatients}
                    placeholder="Rechercher par nom, prénom ou téléphone..."
                    emptyMessage="Aucun patient trouvé."
                  />
                </div>
              ) : (
                <div className="bg-primary/5 px-3 py-2.5 rounded-lg border border-primary/20 flex items-center gap-3">
                  <div className="w-8 h-8 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                    {patient?.first_name?.[0]}{patient?.last_name?.[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm text-foreground truncate">
                      <span className="text-primary mr-1">{civility}</span>
                      {patientFullName}
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {patient?.date_of_birth
                        ? `Né(e) le ${new Date(patient.date_of_birth).toLocaleDateString('fr-FR')}`
                        : 'Date de naissance inconnue'}
                      {patient?.phone ? ` · ${patient.phone}` : ''}
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-background text-[11px] font-medium shrink-0">
                    {patient?.gender === 'F' ? 'Femme' : 'Homme'}
                  </Badge>
                </div>
              )}

              {/* Type et date de délivrance */}
              <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_140px] gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Type de certificat *</Label>
                  <Select value={certType} onValueChange={setCertType}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Choisir le type de certificat" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">Repos médical / arrêt de travail</SelectItem>
                      <SelectItem value="aptitude">Aptitude physique / sport</SelectItem>
                      <SelectItem value="reprise">Reprise (travail / école)</SelectItem>
                      <SelectItem value="presence">Présence au cabinet</SelectItem>
                      <SelectItem value="non_contre_indication">Non-contre-indication</SelectItem>
                      <SelectItem value="custom">Certificat libre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="certDate" className="text-xs font-semibold">Délivré le *</Label>
                  <Input
                    id="certDate"
                    type="date"
                    value={certDate}
                    onChange={(e) => setCertDate(e.target.value)}
                    className="bg-background"
                  />
                </div>
              </div>

              {/* Paramètres du repos / de la reprise */}
              {(certType === "general" || certType === "reprise") && (
                <div className="p-3.5 bg-muted/40 border border-border rounded-xl space-y-3">
                  <Label className="text-[11px] font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    {certType === "general" ? "Durée du repos" : "Date de reprise"}
                  </Label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="startDate" className="text-xs font-medium">
                        {certType === "general" ? "Date de début" : "À compter du"}
                      </Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="bg-background text-xs"
                      />
                    </div>

                    {certType === "general" && (
                      <div className="space-y-1">
                        <Label htmlFor="restDays" className="text-xs font-medium">Nombre de jours</Label>
                        <Input
                          id="restDays"
                          type="number"
                          min="1"
                          max="365"
                          value={restDays}
                          onChange={(e) => setRestDays(e.target.value)}
                          className="bg-background text-xs font-bold"
                        />
                      </div>
                    )}
                  </div>

                  {certType === "general" && (
                    <div className="text-xs text-foreground bg-background p-2.5 rounded-lg border border-border flex items-start gap-2">
                      <CalendarCheck className="w-4 h-4 shrink-0 text-primary mt-px" />
                      <span>
                        Arrêt du <strong>{new Date(startDate).toLocaleDateString("fr-FR")}</strong> au <strong>{calculateEndDate()}</strong> inclus.
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Horaires de présence */}
              {certType === "presence" && (
                <div className="p-3.5 bg-muted/40 border border-border rounded-xl space-y-3">
                  <Label className="text-[11px] font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    Horaires de présence
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="startTime" className="text-xs font-medium">Arrivée *</Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="bg-background text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="endTime" className="text-xs font-medium">Départ *</Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="bg-background text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Discipline concernée */}
              {(certType === "aptitude" || certType === "non_contre_indication") && (
                <div className="p-3.5 bg-muted/40 border border-border rounded-xl space-y-2">
                  <Label htmlFor="sportName" className="text-[11px] font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-muted-foreground" />
                    Discipline concernée (optionnel)
                  </Label>
                  <Input
                    id="sportName"
                    placeholder="Ex : football, natation, athlétisme..."
                    value={sportName}
                    onChange={(e) => setSportName(e.target.value)}
                    className="bg-background text-xs"
                  />
                </div>
              )}
            </div>

            {/* --- Colonne droite : rédaction --- */}
            <div className="flex flex-col gap-2 lg:h-full">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="certContent" className="text-xs font-semibold">
                  Texte du certificat
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleResetText}
                  className="h-6 text-[11px] gap-1 text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="w-3 h-3" />
                  Réinitialiser
                </Button>
              </div>

              <Textarea
                id="certContent"
                value={certContent}
                onChange={(e) => setCertContent(e.target.value)}
                className="font-sans text-base leading-relaxed bg-background flex-1 min-h-[380px] resize-none"
                placeholder="Rédigez le texte du certificat..."
              />

              <div className="flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <FileCheck className="w-3.5 h-3.5 shrink-0" />
                  Texte modifiable librement avant impression.
                </span>
                <span className="tabular-nums shrink-0">{certContent.length} car.</span>
              </div>
            </div>
          </div>
        ) : (
          /* Canvas de Papier d'Imprimé Officiel */
          <div className="bg-slate-200/70 dark:bg-slate-900/80 p-4 sm:p-6 rounded-xl overflow-auto flex justify-center border border-border shadow-inner my-2 flex-1 min-h-0">
            <div className={`printable-document ${paperFormat === 'A5' ? 'format-a5 max-w-[148mm] min-h-[210mm] p-6' : 'max-w-[210mm] min-h-[297mm] p-10'} w-full bg-white text-gray-900 shadow-2xl rounded-sm border border-gray-300 flex flex-col justify-between font-sans transition-all duration-200`}>
              <div>
                {/* En-tête Officiel */}
                <div className="flex justify-between items-start border-b-2 border-blue-900/40 pb-4 mb-6">
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold uppercase tracking-wide text-blue-950">{doctorName}</h2>
                    <p className="text-sm font-semibold text-gray-700">{doctorSpeciality}</p>
                    {getSetting("doctor_agrement_number") && (
                      <p className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-0.5 rounded inline-block">
                        N° Agrément / Ordre : {getSetting("doctor_agrement_number")}
                      </p>
                    )}
                  </div>

                  {hasLogo && logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="h-16 object-contain" />
                  ) : (
                    <div className="text-center px-4 py-2 border-2 border-blue-900/30 rounded-lg bg-blue-50/40">
                      <span className="text-xs font-bold text-blue-900 block uppercase">Cabinet Médical</span>
                      <span className="text-[11px] text-gray-600 font-medium">{cabinetName}</span>
                    </div>
                  )}

                  <div className="text-right space-y-1 text-xs text-gray-700">
                    <p className="font-bold text-sm text-gray-900">{cabinetName}</p>
                    {cabinetAddress && <p>{cabinetAddress}</p>}
                    {cabinetPhone && <p>Tél : {cabinetPhone}</p>}
                  </div>
                </div>

                {/* Titre du document */}
                <div className="text-center my-8">
                  <h1 className="text-2xl font-extrabold uppercase tracking-widest text-blue-950 border-b-2 border-blue-900 inline-block px-6 pb-1">
                    {getCertTitle(certType)}
                  </h1>
                </div>

                {/* Date & Lieu */}
                <div className="flex justify-end text-xs font-medium text-gray-600 mb-6">
                  <span>Fait à {cabinetAddress ? cabinetAddress.split(',')[0] : 'Cabinet'}, le <strong>{new Date(certDate).toLocaleDateString("fr-FR")}</strong></span>
                </div>

                {/* Corps du texte du certificat */}
                <div className="bg-slate-50/60 border border-slate-200 rounded-xl p-8 text-base leading-relaxed text-justify whitespace-pre-line font-serif text-gray-900 shadow-2xs">
                  {certContent}
                </div>
              </div>

              {/* Signature & Pied de page */}
              <div className="pt-6 border-t border-gray-300 mt-10">
                <div className="flex justify-between items-end text-xs">
                  <div className="text-[11px] text-gray-400 italic max-w-xs">
                    Certificat délivré en mains propres à l'intéressé(e) pour servir et valoir ce que de droit.
                  </div>

                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 w-60 text-center bg-gray-50/30">
                    <p className="font-bold text-gray-900 uppercase text-[11px]">Signature et Cachet du Médecin</p>
                    <div className="h-16 flex items-center justify-center text-gray-300 italic text-[11px]">
                      [Emplacement Cachet Officiel]
                    </div>
                    <p className="font-bold text-blue-950 text-xs">{doctorName}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/*
          Le bascule Formulaire / Aperçu vit déjà dans l'en-tête : le pied de
          page ne porte plus que les actions terminales, l'espace gauche
          servant à l'état du document.
        */}
        <DialogFooter className="flex items-center justify-between sm:justify-between pt-4 border-t border-border gap-3 shrink-0">
          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 min-w-0">
            {patient ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                <span className="truncate">
                  {getCertTitle(certType)} — {civility} {patientFullName}
                </span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                <span>Sélectionnez un patient pour enregistrer le certificat.</span>
              </>
            )}
          </p>

          <div className="flex gap-2 shrink-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsPreview(!isPreview)}
              className="text-xs gap-1.5"
            >
              {isPreview ? <Edit3 className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {isPreview ? "Modifier" : "Aperçu"}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handlePrint}
              className="gap-1.5 text-xs"
            >
              <Printer className="w-4 h-4" />
              Imprimer / PDF
            </Button>

            <Button
              type="button"
              onClick={handleSave}
              disabled={!patient}
              className="gap-1.5 text-xs font-semibold"
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

