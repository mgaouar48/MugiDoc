import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Package, Plus, Search, Filter, AlertTriangle, Edit, Trash2, CheckCircle2, MinusCircle, PlusCircle, Boxes } from "lucide-react";
import { useInventory, InventoryItem } from "@/hooks/useInventory";

interface InventorySectionProps {
  onBack: () => void;
}

export const InventorySection = ({ onBack }: InventorySectionProps) => {
  const { items, isLoading, lowStockCount, createItem, updateItem, deleteItem, updateQuantity } = useInventory();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    category: "Consommable",
    quantity: "10",
    min_threshold: "5",
    unit: "boîte",
    unit_price: "0",
    supplier: "",
    notes: ""
  });

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({
      name: "",
      category: "Consommable",
      quantity: "10",
      min_threshold: "5",
      unit: "boîte",
      unit_price: "0",
      supplier: "",
      notes: ""
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      quantity: item.quantity.toString(),
      min_threshold: item.min_threshold.toString(),
      unit: item.unit,
      unit_price: item.unit_price.toString(),
      supplier: item.supplier || "",
      notes: item.notes || ""
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) return;

    const data = {
      name: formData.name.trim(),
      category: formData.category,
      quantity: parseInt(formData.quantity) || 0,
      min_threshold: parseInt(formData.min_threshold) || 5,
      unit: formData.unit,
      unit_price: parseFloat(formData.unit_price) || 0,
      supplier: formData.supplier.trim() || undefined,
      notes: formData.notes.trim() || undefined
    };

    if (editingItem) {
      await updateItem(editingItem.id, data);
    } else {
      await createItem(data);
    }
    setIsDialogOpen(false);
  };

  const filteredItems = items.filter(item => {
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.supplier && item.supplier.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const categories = Array.from(new Set(items.map(i => i.category)));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-8 flex items-center justify-between" style={{ height: "64px" }}>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon-sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Gestion du Stock & Consommables</h2>
            <p className="text-xs text-muted-foreground">Suivi du petit matériel médical et alertes de réapprovisionnement</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {lowStockCount > 0 && (
            <div className="bg-red-500/10 border border-red-300 text-red-700 dark:text-red-300 text-xs px-3 py-1.5 rounded-full font-medium flex items-center gap-1.5 animate-pulse">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span>{lowStockCount} article(s) en seuil critique</span>
            </div>
          )}

          <Button onClick={handleOpenCreate} className="gap-2">
            <Plus className="w-4 h-4" />
            Nouveau Produit
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        {/* Top Summary stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Card className="shadow-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 bg-primary/10 text-primary rounded-xl">
                <Boxes className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Produits</p>
                <p className="text-2xl font-bold text-foreground mt-0.5">{items.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">En Stock Suffisant</p>
                <p className="text-2xl font-bold text-foreground mt-0.5">{items.length - lowStockCount}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 bg-red-500/10 text-red-600 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Seuil Critique (Réappro.)</p>
                <p className="text-2xl font-bold text-red-600 mt-0.5">{lowStockCount}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Table Card */}
        <Card className="shadow-card">
          <CardHeader className="pb-3 border-b">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Rechercher un produit ou fournisseur..."
                  className="pl-9 h-9 text-xs"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="h-9 text-xs w-48">
                    <SelectValue placeholder="Toutes les catégories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les catégories</SelectItem>
                    <SelectItem value="Consommable">Consommable</SelectItem>
                    <SelectItem value="Injections & Seringues">Injections & Seringues</SelectItem>
                    <SelectItem value="Pansements & Sutures">Pansements & Sutures</SelectItem>
                    <SelectItem value="Produits Désinfectants">Produits Désinfectants</SelectItem>
                    <SelectItem value="Matériel d'examen">Matériel d'examen</SelectItem>
                    <SelectItem value="Autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0 overflow-x-auto">
            {isLoading ? (
              <p className="text-xs text-center py-12 text-muted-foreground">Chargement du stock...</p>
            ) : filteredItems.length > 0 ? (
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 text-muted-foreground font-semibold border-b">
                  <tr>
                    <th className="py-3 px-6">Produit / Article</th>
                    <th className="py-3 px-6">Catégorie</th>
                    <th className="py-3 px-6 text-center">Niveau de Stock</th>
                    <th className="py-3 px-6 text-center">Seuil Min.</th>
                    <th className="py-3 px-6">Prix Unitaire (DZD)</th>
                    <th className="py-3 px-6">Fournisseur</th>
                    <th className="py-3 px-6 text-right">Actions Rapides</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredItems.map(item => {
                    const isLow = item.quantity <= item.min_threshold;
                    return (
                      <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                        <td className="py-3.5 px-6 font-bold text-foreground">
                          {item.name}
                          {item.notes && <p className="text-[11px] font-normal text-muted-foreground mt-0.5">{item.notes}</p>}
                        </td>
                        <td className="py-3.5 px-6">
                          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded font-medium">
                            {item.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-6 text-center">
                          <div className="inline-flex items-center gap-2">
                            <span className={`text-sm font-bold px-2.5 py-0.5 rounded-full ${
                              isLow ? 'bg-red-500/10 text-red-600 border border-red-200' : 'bg-emerald-500/10 text-emerald-700'
                            }`}>
                              {item.quantity} {item.unit}
                            </span>
                            {isLow && <AlertTriangle className="w-4 h-4 text-red-500 animate-bounce" title="Seuil critique atteint !" />}
                          </div>
                        </td>
                        <td className="py-3.5 px-6 text-center font-mono text-muted-foreground">
                          {item.min_threshold} {item.unit}
                        </td>
                        <td className="py-3.5 px-6 font-mono text-foreground">
                          {item.unit_price ? `${item.unit_price} DA` : '–'}
                        </td>
                        <td className="py-3.5 px-6 text-muted-foreground">
                          {item.supplier || '–'}
                        </td>
                        <td className="py-3.5 px-6 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              onClick={() => updateQuantity(item.id, -1)}
                              title="Diminuer la quantité (-1)"
                            >
                              <MinusCircle className="w-4 h-4 text-amber-600" />
                            </Button>
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              onClick={() => updateQuantity(item.id, 1)}
                              title="Augmenter la quantité (+1)"
                            >
                              <PlusCircle className="w-4 h-4 text-emerald-600" />
                            </Button>
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              onClick={() => handleOpenEdit(item)}
                              title="Modifier"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() => {
                                if (confirm(`Supprimer l'article "${item.name}" ?`)) {
                                  deleteItem(item.id);
                                }
                              }}
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12 space-y-3">
                <Package className="w-10 h-10 mx-auto text-muted-foreground/40" />
                <p className="text-xs text-muted-foreground">Aucun produit ou consommable trouvé dans le stock.</p>
                <Button onClick={handleOpenCreate} size="sm">
                  <Plus className="w-4 h-4 mr-1.5" /> Ajouter un produit
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog Create/Edit Item */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <Package className="w-5 h-5 text-primary" />
              {editingItem ? "Modifier le produit" : "Ajouter un produit au stock"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="space-y-1">
              <Label className="font-semibold">Nom de l'article / produit *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Compresses Stériles 10x10"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="font-semibold">Catégorie</Label>
                <Select value={formData.category} onValueChange={(val) => setFormData({ ...formData, category: val })}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Consommable">Consommable</SelectItem>
                    <SelectItem value="Injections & Seringues">Injections & Seringues</SelectItem>
                    <SelectItem value="Pansements & Sutures">Pansements & Sutures</SelectItem>
                    <SelectItem value="Produits Désinfectants">Produits Désinfectants</SelectItem>
                    <SelectItem value="Matériel d'examen">Matériel d'examen</SelectItem>
                    <SelectItem value="Autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="font-semibold">Unité de mesure</Label>
                <Input
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="boîte, flacon, unité, paquet..."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="font-semibold">Quantité en stock</Label>
                <Input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <Label className="font-semibold">Seuil d'alerte critique (Min.)</Label>
                <Input
                  type="number"
                  value={formData.min_threshold}
                  onChange={(e) => setFormData({ ...formData, min_threshold: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="font-semibold">Prix Unitaire (DZD)</Label>
                <Input
                  type="number"
                  value={formData.unit_price}
                  onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                  placeholder="0"
                />
              </div>

              <div className="space-y-1">
                <Label className="font-semibold">Fournisseur (Optionnel)</Label>
                <Input
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  placeholder="Pharmacie centrale, grossiste..."
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="font-semibold">Notes / Informations complémentaires</Label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Remplacements, emballage..."
              />
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSubmit}>
              {editingItem ? "Enregistrer" : "Créer le produit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
