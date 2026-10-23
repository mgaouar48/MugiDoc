import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Save, Info } from "lucide-react";

interface ChifaSettingsSectionProps {
  getValue: (key: string, defaultValue?: string) => string;
  handleChange: (key: string, value: string) => void;
  isDirty: boolean;
  isSaving: boolean;
  handleSaveAll: () => void;
}

/**
 * Réglages du suivi CHIFA/CNAS — module optionnel, purement administratif.
 * `chifa_enabled` pilote à lui seul toute visibilité CHIFA ailleurs dans
 * l'application (consultations, facturation, historique, filtres, tableau
 * de bord, statistiques) : cf. `getSetting('chifa_enabled')` dans ces écrans.
 */
export const ChifaSettingsSection = ({ getValue, handleChange, isDirty, isSaving, handleSaveAll }: ChifaSettingsSectionProps) => {
  const enabled = getValue('chifa_enabled', 'false') === 'true';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          CHIFA / CNAS
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-start justify-between gap-4 p-4 rounded-lg border border-border bg-muted/30">
          <div className="space-y-1">
            <Label className="text-sm font-medium">Utiliser la prise en charge CHIFA / CNAS</Label>
            <p className="text-xs text-muted-foreground max-w-md">
              Active le suivi des consultations prises en charge par CHIFA/CNAS dans MugiDoc.
              La procédure CHIFA elle-même reste entièrement effectuée dans le logiciel CHIFA
              officiel — MugiDoc n'échange aucune donnée avec CHIFA ou la CNAS.
            </p>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={(checked) => handleChange('chifa_enabled', checked ? 'true' : 'false')}
          />
        </div>

        {enabled && (
          <>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Organisme de prise en charge</Label>
              <div className="flex items-center gap-2 p-3 rounded-md border border-border">
                <input type="checkbox" checked disabled className="h-4 w-4" />
                <span className="text-sm">CNAS</span>
              </div>
              <p className="text-xs text-muted-foreground">
                D'autres organismes (CASNOS…) pourront être ajoutés ultérieurement.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tarif conventionnel par défaut (DA)</label>
                <input
                  type="number"
                  min="0"
                  className="w-full p-2 border rounded-md"
                  value={getValue('chifa_tarif_conventionnel', '')}
                  onChange={(e) => handleChange('chifa_tarif_conventionnel', e.target.value)}
                  placeholder="ex : 300"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Part patient par défaut (DA)</label>
                <input
                  type="number"
                  min="0"
                  className="w-full p-2 border rounded-md"
                  value={getValue('chifa_part_patient_default', '')}
                  onChange={(e) => handleChange('chifa_part_patient_default', e.target.value)}
                  placeholder="ex : 0"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              Ces montants ne font que préremplir une nouvelle consultation CHIFA — le médecin
              peut toujours les corriger au cas par cas ; une consultation déjà enregistrée garde
              le montant utilisé au moment de sa création.
            </p>
          </>
        )}

        <div className="flex justify-end pt-4 border-t border-border">
          <Button type="button" onClick={handleSaveAll} disabled={!isDirty || isSaving} className="gap-2">
            <Save className="w-4 h-4" />
            {isSaving ? "Enregistrement..." : "Enregistrer les modifications"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
