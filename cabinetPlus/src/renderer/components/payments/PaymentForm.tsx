import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ArrowLeft, Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { PatientCombobox } from "../ui/patient-combobox";
import { Payment, Patient } from "../../../shared/types";
import { formatAmount } from "./paymentHelpers";

interface PaymentFormData {
  date: Date;
  amount: string;
  method: "cash" | "card" | "";
  status: "pending" | "completed" | "debt";
  /**
   * Montant DÉJÀ RÉGLÉ par le patient sur ce paiement (saisie utilisateur).
   * Volontairement distinct de `Payment.debt_amount`, qui porte le sens
   * inverse (reste à payer) : les deux valeurs portaient auparavant le même
   * nom, source de confusion sur la colonne comptable.
   */
  paid_amount: string;
  notes: string;
}

interface PaymentFormProps {
  formData: PaymentFormData;
  setFormData: (data: PaymentFormData) => void;
  patients: Patient[];
  selectedPatient: Patient | null;
  onPatientSelect: (patient: Patient | null) => void;
  loadPatients: () => void;
  editingPayment: Payment | null;
  isLoading: boolean;
  onSubmit: () => void;
  onCancel: () => void;
}

export const PaymentForm = ({
  formData,
  setFormData,
  patients,
  selectedPatient,
  onPatientSelect,
  loadPatients,
  editingPayment,
  isLoading,
  onSubmit,
  onCancel,
}: PaymentFormProps) => {
  const totalAmount = parseFloat(formData.amount || '0');
  const paidAmount = parseFloat(formData.paid_amount || '0');
  const paidExceedsTotal = formData.status === 'debt' && paidAmount > totalAmount;
  const remainingAmount = Math.max(totalAmount - paidAmount, 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border px-8 flex items-center" style={{ height: '64px' }}>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon-sm" onClick={onCancel}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                {editingPayment ? 'Modifier le Paiement' : 'Nouveau Paiement'}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {editingPayment
                  ? 'Modifiez les informations du paiement'
                  : 'Enregistrez un nouveau paiement clinique'
                }
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6 max-w-2xl mx-auto">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Informations du Paiement</CardTitle>
            <CardDescription>
              Saisissez les détails du paiement
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Sélection du patient */}
            <div className="space-y-2">
              <Label>Patient *</Label>
              <PatientCombobox
                patients={patients}
                selectedPatient={selectedPatient}
                onPatientSelect={onPatientSelect}
                placeholder="Sélectionner un patient..."
                onOpen={loadPatients}
                emptyMessage="Aucun patient trouvé."
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal border-border"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.date ? format(formData.date, "PPP", { locale: fr }) : "Sélectionner une date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.date}
                      onSelect={(date) => date && setFormData({ ...formData, date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Montant (DZD) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="border-border"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Méthode de paiement *</Label>
                <Select value={formData.method} onValueChange={(method: "cash" | "card") => setFormData({ ...formData, method })}>
                  <SelectTrigger className="border-border">
                    <SelectValue placeholder="Sélectionner une méthode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Espèces</SelectItem>
                    <SelectItem value="card">Carte bancaire</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Statut</Label>
                <Select value={formData.status} onValueChange={(status: "pending" | "completed" | "debt") => setFormData({ ...formData, status })}>
                  <SelectTrigger className="border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="completed">Payé</SelectItem>
                    <SelectItem value="debt">Dette (Virement)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Acompte - affiché seulement si statut = debt */}
            {formData.status === 'debt' && (
              <div className="space-y-2">
                <Label>Montant déjà réglé (DZD)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max={formData.amount}
                  placeholder="0.00"
                  value={formData.paid_amount}
                  onChange={(e) => setFormData({ ...formData, paid_amount: e.target.value })}
                  className="border-border"
                  aria-invalid={paidExceedsTotal}
                />
                <p className={`text-xs ${paidExceedsTotal ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {paidExceedsTotal
                    ? `Le montant réglé ne peut pas dépasser le total (${formatAmount(totalAmount)}).`
                    : `Somme déjà encaissée. Reste à payer = ${formatAmount(remainingAmount)}`}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Notes additionnelles..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="border-border"
              />
            </div>

            <div className="flex space-x-3">
              <Button
                onClick={onSubmit}
                className="flex-1 bg-primary hover:bg-primary-hover"
                disabled={isLoading || !formData.amount || !formData.method || paidExceedsTotal}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {editingPayment ? 'Modification...' : 'Création...'}
                  </>
                ) : (
                  <>
                    {editingPayment ? 'Modifier' : 'Créer'}
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={onCancel}
                className="border-border"
                disabled={isLoading}
              >
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
