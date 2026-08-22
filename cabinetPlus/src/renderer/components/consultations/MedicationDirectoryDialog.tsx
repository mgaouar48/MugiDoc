import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent } from "../ui/card";
import { Search, Plus, Pill, Sparkles, Check, Database, FileText } from "lucide-react";
import { useToast } from "../../hooks/use-toast";

interface MedicationDirectoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectMedication?: (med: any) => void;
}

export const MedicationDirectoryDialog = ({
  open,
  onOpenChange,
  onSelectMedication
}: MedicationDirectoryDialogProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [medications, setMedications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const { toast } = useToast();

  const [newMed, setNewMed] = useState({
    brand_name: "",
    dci: "",
    form: "COMPRIME",
    dosage: "",
    packaging: ""
  });

  const loadMedications = async (query = "") => {
    setIsLoading(true);
    try {
      if ((window as any).electronAPI?.medications) {
        const results = await (window as any).electronAPI.medications.search(query, 100);
        setMedications(results || []);
      }
    } catch (err) {
      console.error("Erreur recherche dictionnaire médicaments:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      setIsAddOpen(false);
      loadMedications(searchTerm);
    }
  }, [open, searchTerm]);

  const handleAddMedication = async () => {
    if (!newMed.brand_name.trim()) {
      toast({ title: "Champ obligatoire", description: "Veuillez saisir au moins le nom du médicament.", variant: "destructive" });
      return;
    }

    try {
      if ((window as any).electronAPI?.medications) {
        const created = await (window as any).electronAPI.medications.add({
          brand_name: newMed.brand_name.trim().toUpperCase(),
          dci: newMed.dci.trim().toUpperCase() || undefined,
          form: newMed.form.trim().toUpperCase() || undefined,
          dosage: newMed.dosage.trim().toUpperCase() || undefined,
          packaging: newMed.packaging.trim() || undefined,
          popularity: 500
        });

        toast({
          title: "Médicament ajouté",
          description: `${created.brand_name} a été enregistré dans le registre des médicaments.`,
        });

        setNewMed({ brand_name: "", dci: "", form: "COMPRIME", dosage: "", packaging: "" });
        setIsAddOpen(false);
        loadMedications(searchTerm);
      }
    } catch (err) {
      toast({ title: "Erreur", description: "Impossible d'ajouter le médicament.", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!val) setIsAddOpen(false);
      onOpenChange(val);
    }}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-6">
        <DialogHeader className="pb-3 border-b">
          <div className="flex items-center justify-between gap-4">
            <div>
              <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
                <Pill className="w-5 h-5 text-primary" />
                Registre & Dictionnaire des Médicaments
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Nomenclature 2025/2026 • {medications.length} résultat(s) disponible(s)
              </p>
            </div>

            <Button
              size="sm"
              variant={isAddOpen ? "secondary" : "default"}
              onClick={() => setIsAddOpen(!isAddOpen)}
              className="gap-1.5 text-xs font-semibold"
            >
              {isAddOpen ? "Fermer le formulaire" : "+ Ajouter un Médicament"}
            </Button>
          </div>
        </DialogHeader>

        {/* Section d'ajout d'un nouveau médicament */}
        {isAddOpen && (
          <div className="p-4 bg-card border border-border rounded-xl space-y-3 my-2 shadow-2xs">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                Nouveau médicament à inscrire au registre
              </h4>
              <Button size="xs" variant="ghost" onClick={() => setIsAddOpen(false)} className="text-xs">
                Annuler
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              <div className="space-y-1">
                <Label className="font-medium">Nom Commercial *</Label>
                <Input
                  value={newMed.brand_name}
                  onChange={(e) => setNewMed({ ...newMed, brand_name: e.target.value })}
                  placeholder="Ex: DOLIPRANE 1000mg"
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="font-medium">DCI (Principe actif)</Label>
                <Input
                  value={newMed.dci}
                  onChange={(e) => setNewMed({ ...newMed, dci: e.target.value })}
                  placeholder="Ex: PARACETAMOL"
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="font-medium">Dosage</Label>
                <Input
                  value={newMed.dosage}
                  onChange={(e) => setNewMed({ ...newMed, dosage: e.target.value })}
                  placeholder="Ex: 1000MG, 500MG/5ML"
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="font-medium">Forme Galénique</Label>
                <Input
                  value={newMed.form}
                  onChange={(e) => setNewMed({ ...newMed, form: e.target.value })}
                  placeholder="COMPRIME, SIROP, GELULE..."
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="font-medium">Conditionnement</Label>
                <Input
                  value={newMed.packaging}
                  onChange={(e) => setNewMed({ ...newMed, packaging: e.target.value })}
                  placeholder="Ex: B/16, B/1 FLACON"
                  className="h-8 text-xs"
                />
              </div>

              <div className="flex items-end">
                <Button onClick={handleAddMedication} size="sm" className="w-full h-8 text-xs font-semibold">
                  Enregistrer dans le Registre
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Barre de recherche */}
        <div className="relative my-2">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher un médicament par nom commercial (Augmentin, Doliprane...) ou DCI (Paracétamol, Amoxicilline)..."
            className="pl-9 h-10 text-xs"
          />
        </div>

        {/* Liste des résultats */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[300px]">
          {isLoading ? (
            <p className="text-xs text-center py-12 text-muted-foreground">Chargement des médicaments...</p>
          ) : medications.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {medications.map((med: any) => (
                <div
                  key={med.id}
                  className="p-3 border border-border rounded-lg bg-card hover:bg-muted/40 transition-all flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="p-1.5 rounded bg-primary/10 text-primary shrink-0 mt-0.5">
                      <Pill className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <h4 className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                        {med.brand_name}
                      </h4>
                      {med.dci && (
                        <p className="text-[11px] text-muted-foreground truncate font-medium">
                          DCI: {med.dci}
                        </p>
                      )}
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/80 flex-wrap">
                        {med.form && <span className="bg-muted px-1.5 py-0.5 rounded font-mono">{med.form}</span>}
                        {med.packaging && <span>{med.packaging}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {med.dosage && (
                      <span className="text-[11px] font-mono font-bold bg-primary/10 text-primary px-2 py-0.5 rounded border border-primary/20">
                        {med.dosage}
                      </span>
                    )}
                    {onSelectMedication && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="text-xs h-7 px-2.5 font-medium"
                        onClick={() => {
                          onSelectMedication(med);
                          onOpenChange(false);
                        }}
                      >
                        Sélectionner
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 space-y-3">
              <Pill className="w-8 h-8 mx-auto text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground">Aucun médicament trouvé pour "{searchTerm}".</p>
              <Button size="sm" variant="outline" onClick={() => setIsAddOpen(true)} className="text-xs">
                + Ajouter "{searchTerm}" au dictionnaire
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
