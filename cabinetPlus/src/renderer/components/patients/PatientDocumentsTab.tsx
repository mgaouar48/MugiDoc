import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, Image as ImageIcon, Trash2, ExternalLink, Filter, Search, File, HardDrive } from "lucide-react";
import { usePatientDocuments } from "@/hooks/usePatientDocuments";
import { PatientDocument } from "@/shared/types";

interface PatientDocumentsTabProps {
  patientId: number;
}

export const PatientDocumentsTab = ({ patientId }: PatientDocumentsTabProps) => {
  const { documents, isLoading, selectAndUpload, deleteDocument, openDocument } = usePatientDocuments(patientId);
  const [selectedCategory, setSelectedCategory] = useState<string>("Radiologie & IRM");
  const [notes, setNotes] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const handleUpload = async () => {
    await selectAndUpload(selectedCategory, notes);
    setNotes("");
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (fileType: string) => {
    const imgTypes = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
    if (imgTypes.includes(fileType.toLowerCase())) {
      return <ImageIcon className="w-5 h-5 text-blue-500 shrink-0" />;
    }
    if (fileType.toLowerCase() === 'pdf') {
      return <FileText className="w-5 h-5 text-red-500 shrink-0" />;
    }
    return <File className="w-5 h-5 text-indigo-500 shrink-0" />;
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesCategory = filterCategory === "all" || doc.category === filterCategory;
    const matchesSearch = doc.original_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.notes && doc.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <Card className="shadow-card">
      <CardContent className="p-6 space-y-6">
        {/* Banner Upload Zone */}
        <div className="bg-muted/40 p-4 rounded-xl border border-border space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-primary" />
                Ajouter une pièce jointe / imagerie (EDFA)
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Rattachez des radiographies, scannages, bilans sanguins PDF ou images au dossier médical du patient.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-medium">Catégorie</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Radiologie & IRM">Radiologie & IRM</SelectItem>
                  <SelectItem value="Analyses & Biologie">Analyses & Biologie</SelectItem>
                  <SelectItem value="Comptes Rendus">Comptes Rendus</SelectItem>
                  <SelectItem value="Ordonnance externe">Ordonnance externe</SelectItem>
                  <SelectItem value="Autre">Autre document</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1 sm:col-span-2">
              <Label className="text-xs font-medium">Note / Description optionnelle</Label>
              <div className="flex gap-2">
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Échographie abdominale du 12/05/2026..."
                  className="h-9 text-xs"
                />
                <Button onClick={handleUpload} size="sm" className="h-9 gap-1.5 shrink-0">
                  <Upload className="w-4 h-4" />
                  Parcourir & Ajouter
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher un document..."
              className="pl-8 h-8 text-xs"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="h-8 text-xs w-48">
                <SelectValue placeholder="Toutes les catégories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                <SelectItem value="Radiologie & IRM">Radiologie & IRM</SelectItem>
                <SelectItem value="Analyses & Biologie">Analyses & Biologie</SelectItem>
                <SelectItem value="Comptes Rendus">Comptes Rendus</SelectItem>
                <SelectItem value="Ordonnance externe">Ordonnance externe</SelectItem>
                <SelectItem value="Autre">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* List of Documents */}
        {isLoading ? (
          <p className="text-xs text-center py-8 text-muted-foreground">Chargement des documents...</p>
        ) : filteredDocs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredDocs.map((doc: PatientDocument) => (
              <div
                key={doc.id}
                className="p-3.5 border border-border rounded-xl bg-card hover:bg-muted/30 transition-all flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-muted border border-border/50 shrink-0">
                    {getFileIcon(doc.file_type)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate" title={doc.original_name}>
                      {doc.original_name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                      <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium text-[11px]">
                        {doc.category}
                      </span>
                      <span>•</span>
                      <span>{formatFileSize(doc.file_size)}</span>
                      <span>•</span>
                      <span>{new Date(doc.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                    {doc.notes && (
                      <p className="text-[11px] text-muted-foreground/80 mt-1 italic truncate">
                        {doc.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => openDocument(doc.id)}
                    title="Ouvrir le fichier"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-primary" />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      if (confirm(`Supprimer le document "${doc.original_name}" ?`)) {
                        deleteDocument(doc.id);
                      }
                    }}
                    title="Supprimer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 space-y-2">
            <File className="w-8 h-8 mx-auto text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground">Aucun document joint pour ce patient.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
