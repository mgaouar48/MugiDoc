import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useExpenses } from "@/hooks/useExpenses";
import { CreateExpenseRequest, UpdateExpenseRequest, Expense } from "../../../shared/types";
import {
  Receipt,
  Plus,
  Edit,
  Trash2,
  Loader2,
  DollarSign,
  Calendar,
  FileText,
  Save,
  X
} from "lucide-react";

export const ExpensesSection = () => {
  const { toast } = useToast();
  const {
    expenses,
    isLoading,
    error,
    loadExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
    getExpenseStats
  } = useExpenses();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [stats, setStats] = useState<{ total: number; totalAmount: number } | null>(null);
  const [formData, setFormData] = useState<CreateExpenseRequest>({
    amount: 0,
    description: "",
    date: new Date().toISOString().split('T')[0]
  });

  // Charger les statistiques
  const loadStats = async () => {
    const statsData = await getExpenseStats();
    setStats(statsData);
  };

  useEffect(() => {
    loadStats();
  }, [expenses]);

  // Gérer la soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.description.trim()) {
      toast({
        title: "Erreur",
        description: "Le montant et la description sont obligatoires",
        variant: "destructive",
      });
      return;
    }

    if (formData.amount <= 0) {
      toast({
        title: "Erreur",
        description: "Le montant doit être positif",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingExpense) {
        // Modification
        await updateExpense(editingExpense.id, formData as UpdateExpenseRequest);
        toast({
          title: "Frais modifié",
          description: "Le frais a été modifié avec succès",
        });
      } else {
        // Création
        await createExpense(formData);
        toast({
          title: "Frais créé",
          description: "Le frais a été créé avec succès",
        });
      }

      // Réinitialiser le formulaire
      setFormData({
        amount: 0,
        description: "",
        date: new Date().toISOString().split('T')[0]
      });
      setShowAddForm(false);
      setEditingExpense(null);
    } catch (error) {
      // L'erreur est déjà gérée dans le hook
    }
  };

  // Gérer l'édition
  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      amount: expense.amount,
      description: expense.description,
      date: expense.date
    });
    setShowAddForm(true);
  };

  // Gérer la suppression
  const handleDelete = async (expense: Expense) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ce frais : "${expense.description}" ?`)) {
      return;
    }

    try {
      await deleteExpense(expense.id);
      toast({
        title: "Frais supprimé",
        description: "Le frais a été supprimé avec succès",
      });
    } catch (error) {
      // L'erreur est déjà gérée dans le hook
    }
  };

  // Annuler l'édition/ajout
  const handleCancel = () => {
    setFormData({
      amount: 0,
      description: "",
      date: new Date().toISOString().split('T')[0]
    });
    setShowAddForm(false);
    setEditingExpense(null);
  };

  // Formater le montant en DZD
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Formater la date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <p className="text-red-600">Erreur : {error}</p>
          <Button onClick={() => loadExpenses()} className="mt-4">
            Réessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Gestion des Frais du Cabinet
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {stats?.total || 0}
              </div>
              <div className="text-sm text-muted-foreground">Total des frais</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {stats ? formatAmount(stats.totalAmount) : formatAmount(0)}
              </div>
              <div className="text-sm text-muted-foreground">Montant total</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {stats && stats.total > 0 ? formatAmount(stats.totalAmount / stats.total) : formatAmount(0)}
              </div>
              <div className="text-sm text-muted-foreground">Montant moyen</div>
            </div>
          </div>

          <Button 
            onClick={() => setShowAddForm(true)} 
            className="w-full md:w-auto"
            disabled={isLoading}
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un frais
          </Button>
        </CardContent>
      </Card>

      {/* Formulaire d'ajout/modification */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {editingExpense ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              {editingExpense ? 'Modifier le frais' : 'Ajouter un frais'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Montant (DZD) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.amount || ''}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description du frais..."
                  rows={3}
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {editingExpense ? 'Modification...' : 'Création...'}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {editingExpense ? 'Modifier' : 'Créer'}
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  <X className="w-4 h-4 mr-2" />
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Liste des frais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Liste des Frais
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && expenses.length === 0 ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p>Chargement des frais...</p>
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Receipt className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucun frais enregistré</p>
              <p className="text-sm">Cliquez sur "Ajouter un frais" pour commencer</p>
            </div>
          ) : (
            <div className="space-y-4">
              {expenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {formatDate(expense.date)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-red-600" />
                        <span className="font-semibold text-red-600">
                          {formatAmount(expense.amount)}
                        </span>
                      </div>
                    </div>
                    <p className="font-medium mt-1">{expense.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(expense)}
                      disabled={isLoading}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(expense)}
                      disabled={isLoading}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
