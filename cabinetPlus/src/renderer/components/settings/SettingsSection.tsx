import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Settings, User, Clock, DollarSign, Database, Receipt, Shield, Save, Info, Instagram, Phone, ExternalLink, Globe, Award, Wifi } from "lucide-react";
import { DatabaseSection } from "./DatabaseSection";
import { ExpensesSection } from "./ExpensesSection";
import { SecuritySection } from "./SecuritySection";
import { LogoUpload } from "./LogoUpload";
import { SpecialtySelect } from "./SpecialtySelect";
import { NetworkSettingsSection } from "./NetworkSettingsSection";
import { useSettings } from "@/hooks/useSettings";
import { useToast } from "@/hooks/use-toast";
import { ActivationBadge } from "@/components/ActivationBadge";
import { useActivation } from "@/hooks/useActivation";
import { useAuth } from "@/hooks/useAuth";

interface SettingsSectionProps {
  onBack: () => void;
}

export const SettingsSection = ({ onBack }: SettingsSectionProps) => {
  const [activeTab, setActiveTab] = useState("profile");
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const { toast } = useToast();
  const { user } = useAuth();
  const {
    settings,
    isLoading,
    error,
    getSetting,
    updateSetting
  } = useSettings();

  const { licenseInfo } = useActivation();

  // Vérifier si le logiciel est activé (pas en période d'essai)
  const isActivated = licenseInfo?.status === 'active' && licenseInfo?.isActivated;

  const getValue = (key: string, defaultValue: string = ''): string => {
    if (formData[key] !== undefined) {
      return formData[key];
    }
    const dbValue = getSetting(key, '');
    if (dbValue) return dbValue;

    if (key === 'doctor_first_name' && user?.first_name) return user.first_name;
    if (key === 'doctor_last_name' && user?.last_name) return user.last_name;
    if (key === 'doctor_email' && user?.email) return user.email;
    return defaultValue;
  };

  const handleChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const isDirty = Object.keys(formData).some(key => formData[key] !== getSetting(key, ''));

  const handleSaveAll = async () => {
    if (!isDirty) return;
    setIsSaving(true);
    try {
      const changedEntries = Object.entries(formData).filter(([key, val]) => val !== getSetting(key, ''));
      for (const [key, val] of changedEntries) {
        await updateSetting(key, val);
      }
      setFormData({});
      toast({
        title: "Paramètres enregistrés",
        description: "Toutes vos modifications ont été enregistrées avec succès.",
      });
    } catch (err) {
      console.error('Erreur lors de la sauvegarde des paramètres:', err);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer les modifications",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border px-8 flex items-center" style={{ height: '64px' }}>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onBack}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Paramètres</h2>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isDirty && (
              <span className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800 font-medium animate-pulse">
                Modifications non enregistrées
              </span>
            )}
            <Button
              onClick={handleSaveAll}
              disabled={!isDirty || isSaving}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? "Enregistrement..." : "Enregistrer"}
            </Button>
            <ActivationBadge />
          </div>
        </div>
      </header>

      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Profil
            </TabsTrigger>
            <TabsTrigger value="schedule" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Horaires
            </TabsTrigger>
            <TabsTrigger value="consultation" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Consultations
            </TabsTrigger>
            <TabsTrigger value="expenses" className="flex items-center gap-2">
              <Receipt className="w-4 h-4" />
              Frais
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Sécurité
            </TabsTrigger>
            <TabsTrigger
              value="database"
              className="flex items-center gap-2"
              disabled={!isActivated}
            >
              <Database className="w-4 h-4" />
              Base de Données
            </TabsTrigger>
            <TabsTrigger value="network" className="flex items-center gap-2">
              <Wifi className="w-4 h-4" />
              Réseau
            </TabsTrigger>
            <TabsTrigger value="about" className="flex items-center gap-2">
              <Info className="w-4 h-4" />
              À propos
            </TabsTrigger>
          </TabsList>

          {/* Onglet Profil */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informations du Médecin
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Prénom</label>
                    <input
                      className="w-full p-2 border rounded-md"
                      value={getValue('doctor_first_name', '')}
                      onChange={(e) => handleChange('doctor_first_name', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nom</label>
                    <input
                      className="w-full p-2 border rounded-md"
                      value={getValue('doctor_last_name', '')}
                      onChange={(e) => handleChange('doctor_last_name', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">N° d'Agrément / N° d'Ordre des Médecins</label>
                    <input
                      className="w-full p-2 border rounded-md font-mono"
                      placeholder="Ex: N° Agrément 16/4852"
                      value={getValue('doctor_agrement_number', '')}
                      onChange={(e) => handleChange('doctor_agrement_number', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <input
                    className="w-full p-2 border rounded-md"
                    type="email"
                    value={getValue('doctor_email', '')}
                    onChange={(e) => handleChange('doctor_email', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nom du Cabinet</label>
                    <input
                      className="w-full p-2 border rounded-md"
                      value={getValue('cabinet_name', 'Cabinet Médical')}
                      onChange={(e) => handleChange('cabinet_name', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Téléphone du Cabinet</label>
                    <input
                      className="w-full p-2 border rounded-md"
                      value={getValue('cabinet_phone', '01 23 45 67 89')}
                      onChange={(e) => handleChange('cabinet_phone', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Adresse du Cabinet</label>
                  <textarea
                    className="w-full p-2 border rounded-md"
                    rows={3}
                    value={getValue('cabinet_address', '123 Rue de la Santé, 75014 Paris')}
                    onChange={(e) => handleChange('cabinet_address', e.target.value)}
                  />
                </div>

                <div className="flex justify-end pt-4 border-t border-border">
                  <Button
                    type="button"
                    onClick={handleSaveAll}
                    disabled={!isDirty || isSaving}
                    className="gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? "Enregistrement..." : "Enregistrer les modifications"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Section Logo du Cabinet */}
            <LogoUpload />
          </TabsContent>

          {/* Onglet Horaires */}
          <TabsContent value="schedule">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Horaires de Travail
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Jours de travail */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Jours de travail</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                    {[
                      { key: 'work_days_monday', label: 'Lundi', short: 'Lun' },
                      { key: 'work_days_tuesday', label: 'Mardi', short: 'Mar' },
                      { key: 'work_days_wednesday', label: 'Mercredi', short: 'Mer' },
                      { key: 'work_days_thursday', label: 'Jeudi', short: 'Jeu' },
                      { key: 'work_days_friday', label: 'Vendredi', short: 'Ven' },
                      { key: 'work_days_saturday', label: 'Samedi', short: 'Sam' },
                      { key: 'work_days_sunday', label: 'Dimanche', short: 'Dim' }
                    ].map((day) => (
                      <div key={day.key} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={day.key}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          checked={getValue(day.key, 'false') === 'true'}
                          onChange={(e) => handleChange(day.key, e.target.checked ? 'true' : 'false')}
                        />
                        <label htmlFor={day.key} className="text-sm font-medium cursor-pointer">
                          <span className="hidden sm:inline">{day.label}</span>
                          <span className="sm:hidden">{day.short}</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Horaires de travail */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Horaires de travail</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm text-gray-600">Heure de début</label>
                      <input
                        type="time"
                        className="w-full p-2 border rounded-md"
                        value={getValue('work_start_time', '08:00')}
                        onChange={(e) => handleChange('work_start_time', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-gray-600">Heure de fin</label>
                      <input
                        type="time"
                        className="w-full p-2 border rounded-md"
                        value={getValue('work_end_time', '18:00')}
                        onChange={(e) => handleChange('work_end_time', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Pause déjeuner */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Pause déjeuner</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm text-gray-600">Début pause déjeuner</label>
                      <input
                        type="time"
                        className="w-full p-2 border rounded-md"
                        value={getValue('lunch_start_time', '12:00')}
                        onChange={(e) => handleChange('lunch_start_time', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-gray-600">Fin pause déjeuner</label>
                      <input
                        type="time"
                        className="w-full p-2 border rounded-md"
                        value={getValue('lunch_end_time', '14:00')}
                        onChange={(e) => handleChange('lunch_end_time', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-border">
                  <Button
                    type="button"
                    onClick={handleSaveAll}
                    disabled={!isDirty || isSaving}
                    className="gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? "Enregistrement..." : "Enregistrer les modifications"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Consultations */}
          <TabsContent value="consultation">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Paramètres des Consultations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Durée par défaut (minutes)</label>
                    <input
                      type="number"
                      className="w-full p-2 border rounded-md"
                      value={getValue('default_consultation_duration', '30')}
                      onChange={(e) => handleChange('default_consultation_duration', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Prix par défaut (DZD)</label>
                    <input
                      type="number"
                      className="w-full p-2 border rounded-md"
                      value={getValue('default_consultation_price', '8000')}
                      onChange={(e) => handleChange('default_consultation_price', e.target.value)}
                      placeholder="8000"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-border">
                  <Button
                    type="button"
                    onClick={handleSaveAll}
                    disabled={!isDirty || isSaving}
                    className="gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? "Enregistrement..." : "Enregistrer les modifications"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Frais */}
          <TabsContent value="expenses">
            <ExpensesSection />
          </TabsContent>

          {/* Onglet Sécurité */}
          <TabsContent value="security">
            <SecuritySection />
          </TabsContent>

          {/* Onglet Base de Données */}
          <TabsContent value="database">
            <DatabaseSection />
          </TabsContent>

          {/* Onglet À propos (Informations Mugitech & Logiciel) */}
          <TabsContent value="about">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
                  <Info className="w-5 h-5 text-primary" />
                  À propos de MugiDoc & Mugitech
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 p-6 bg-gradient-to-r from-primary/10 via-primary/5 to-card border border-primary/20 rounded-xl">
                  <img
                    src="./mugitechlogo.png"
                    alt="Mugitech Logo"
                    className="w-20 h-20 object-contain shrink-0 rounded-lg p-2 bg-card border border-border shadow-sm"
                  />
                  <div className="space-y-2 text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                      <h3 className="text-xl font-extrabold text-foreground">MugiDoc Desktop</h3>
                      <span className="px-2.5 py-0.5 text-xs font-bold font-mono bg-primary text-primary-foreground rounded-full">v1.0.0</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Logiciel complet de gestion médicale & dossier patient informatisé développé sur-mesure pour les cabinets médicaux.
                    </p>
                    <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-muted-foreground pt-1">
                      <Award className="w-4 h-4 text-amber-500" />
                      <span>Édition Professionnelle • Licence Officielle</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border border-border rounded-lg bg-card space-y-3">
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                      <Instagram className="w-4 h-4 text-primary" />
                      Réseaux & Actualités
                    </h4>
                    <p className="text-xs text-muted-foreground">Suivez les mises à jour et nouveautés sur Instagram :</p>
                    <a
                      href="https://www.instagram.com/mugi.techdz/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                    >
                      @mugi.techdz <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="p-4 border border-border rounded-lg bg-card space-y-3">
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                      <Phone className="w-4 h-4 text-emerald-600" />
                      Support Technique & Assistance WhatsApp
                    </h4>
                    <p className="text-xs text-muted-foreground">Contacter l'équipe pour assistance ou personnalisation :</p>
                    <a
                      href="https://wa.me/213561570963"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:underline"
                    >
                      +213 561 570 963 <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                <div className="p-4 bg-muted/40 border border-border rounded-lg text-xs text-muted-foreground text-center">
                  © 2026 Mugitech. Tous droits réservés. Développé avec soin pour les professionnels de santé.
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Réseau */}
          <TabsContent value="network">
            <NetworkSettingsSection />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
