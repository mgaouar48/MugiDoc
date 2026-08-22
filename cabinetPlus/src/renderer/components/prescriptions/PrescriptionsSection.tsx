import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Input } from "../ui/input";
import {
  ArrowLeft,
  Plus,
  Search,
  FileText,
  Calendar,
  User,
  Printer,
  Edit,
  Trash2,
  Eye
} from "lucide-react";
import { usePrescriptions } from "../../hooks/usePrescriptions";
import { usePrescriptionsList } from "../../hooks/usePrescriptionsList";
import { useToast } from "../../hooks/use-toast";
import { usePermissions } from "../../hooks/usePermissions";
import { usePagination } from "../../hooks/usePagination";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { PaginationControls } from "../ui/pagination-controls";
import { Prescription, PrescriptionTemplate, Patient } from "../../../shared/types";
import { PrescriptionForm } from "./PrescriptionForm";
import { PrescriptionTemplateForm } from "./PrescriptionTemplateForm";
import { PrescriptionPreview } from "./PrescriptionPreview";
import { BlankPrescriptionPreview } from "./BlankPrescriptionPreview";
import { BlankBilanPreview } from "./BlankBilanPreview";

interface PrescriptionsSectionProps {
  onBack: () => void;
  autoOpenForm?: boolean;
  preSelectedPatient?: Patient | null;
  selectedPrescriptionForEdit?: any;
  quickActionType?: string;
}

type ViewMode = 'list' | 'prescription-form' | 'template-form' | 'preview' | 'blank-preview' | 'blank-bilan-preview';

export const PrescriptionsSection = ({
  onBack,
  autoOpenForm = false,
  preSelectedPatient = null,
  selectedPrescriptionForEdit = null,
  quickActionType = null
}: PrescriptionsSectionProps) => {
  const permissions = usePermissions();
  const [activeTab, setActiveTab] = useState<'prescriptions' | 'templates'>('prescriptions');
  const [view, setView] = useState<ViewMode>(
    quickActionType === 'editPrescription' ? 'prescription-form' :
    quickActionType === 'newPrescription' ? 'prescription-form' :
    autoOpenForm ? 'prescription-form' : 'list'
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(
    selectedPrescriptionForEdit || null
  );
  const [selectedTemplate, setSelectedTemplate] = useState<PrescriptionTemplate | null>(null);

  const {
    templates,
    isLoading,
    error,
    loadTemplates,
    deletePrescription,
    deleteTemplate,
    printPrescription,
    clearError
  } = usePrescriptions();

  const {
    prescriptions,
    isLoading: isListLoading,
    error: listError,
    load: loadPrescriptionsList,
    reload: reloadPrescriptionsList,
    currentPage: prescriptionsCurrentPage,
    totalPages: prescriptionsTotalPages,
    goToPage: prescriptionsGoToPage,
    canGoNext: prescriptionsCanGoNext,
    canGoPrevious: prescriptionsCanGoPrevious,
    startIndex: prescriptionsStartIndex,
    endIndex: prescriptionsEndIndex,
    totalItems: prescriptionsTotalItems,
  } = usePrescriptionsList();

  const { toast } = useToast();

  // Charger les modèles au montage
  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  // Recharger les ordonnances depuis le serveur à chaque changement de recherche
  const debouncedPrescriptionsSearch = useDebouncedValue(searchTerm, 300);
  useEffect(() => {
    loadPrescriptionsList({ search: debouncedPrescriptionsSearch || undefined });
  }, [debouncedPrescriptionsSearch, loadPrescriptionsList]);

  // Afficher les erreurs
  useEffect(() => {
    if (error) {
      toast({
        title: "Erreur",
        description: error,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  useEffect(() => {
    if (listError) {
      toast({
        title: "Erreur",
        description: listError,
        variant: "destructive",
      });
    }
  }, [listError, toast]);

  // Filtrer les modèles (liste courte, pagination client-side conservée)
  const filteredTemplates = templates.filter(template => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      template.name.toLowerCase().includes(searchLower) ||
      template.description?.toLowerCase().includes(searchLower) ||
      template.medications.some(med =>
        med.name.toLowerCase().includes(searchLower)
      )
    );
  });

  // Pagination pour les modèles
  const templatesPagination = usePagination({
    data: filteredTemplates,
    itemsPerPage: 10
  });

  const handleDeletePrescription = async (prescription: Prescription) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer cette ordonnance ?`)) {
      return;
    }

    try {
      await deletePrescription(prescription.id);
      await reloadPrescriptionsList();
      toast({
        title: "Succès",
        description: "Ordonnance supprimée avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'ordonnance",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTemplate = async (template: PrescriptionTemplate) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le modèle "${template.name}" ?`)) {
      return;
    }

    try {
      await deleteTemplate(template.id);
      toast({
        title: "Succès",
        description: "Modèle supprimé avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le modèle",
        variant: "destructive",
      });
    }
  };

  const handlePrintPrescription = async (prescription: Prescription) => {
    try {
      await printPrescription(prescription.id);
      toast({
        title: "Succès",
        description: "Ordonnance envoyée à l'impression",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'imprimer l'ordonnance",
        variant: "destructive",
      });
    }
  };

  const handleBackToList = () => {
    setView('list');
    setSelectedPrescription(null);
    setSelectedTemplate(null);
    clearError();
  };

  // Affichage conditionnel selon la vue
  if (view === 'prescription-form') {
    return (
      <PrescriptionForm
        prescription={selectedPrescription}
        template={selectedTemplate}
        preSelectedPatient={preSelectedPatient}
        onBack={handleBackToList}
        onSave={(prescription) => {
          reloadPrescriptionsList(); // Recharger les données
          handleBackToList();
          toast({
            title: "Succès",
            description: selectedPrescription ? "Ordonnance modifiée avec succès" : "Ordonnance créée avec succès",
          });
        }}
        onPreview={(prescription) => {
          setSelectedPrescription(prescription);
          setView('preview');
        }}
      />
    );
  }

  if (view === 'template-form') {
    return (
      <PrescriptionTemplateForm
        template={selectedTemplate}
        onBack={handleBackToList}
        onSave={(template) => {
          loadTemplates(); // Recharger les données
          handleBackToList();
          toast({
            title: "Succès",
            description: selectedTemplate ? "Modèle modifié avec succès" : "Modèle créé avec succès",
          });
        }}
      />
    );
  }

  if (view === 'preview' && selectedPrescription) {
    return (
      <PrescriptionPreview
        prescription={selectedPrescription}
        onBack={handleBackToList}
        onPrint={() => {
          toast({
            title: "Impression",
            description: "Ordonnance envoyée à l'imprimante",
          });
        }}
      />
    );
  }

  if (view === 'blank-preview') {
    return (
      <BlankPrescriptionPreview
        onBack={handleBackToList}
        onPrint={() => {
          toast({
            title: "Impression",
            description: "Ordonnance vierge envoyée à l'imprimante",
          });
        }}
      />
    );
  }

  if (view === 'blank-bilan-preview') {
    return (
      <BlankBilanPreview
        onBack={handleBackToList}
        onPrint={() => {
          toast({
            title: "Impression",
            description: "Demande de bilan vierge envoyée à l'imprimante",
          });
        }}
      />
    );
  }

  // Vue principale - Liste
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour au tableau de bord
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Gestion des Ordonnances</h1>
              <p className="text-muted-foreground">
                Créer et gérer les ordonnances médicales
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Rechercher par patient, médicament ou notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Onglets */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'prescriptions' | 'templates')}>
        <div className="flex items-center justify-between mb-6">
          <TabsList>
            <TabsTrigger value="prescriptions" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Ordonnances ({prescriptionsTotalItems})
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Modèles ({templatesPagination.totalItems})
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            {activeTab === 'prescriptions' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setView('blank-preview')}
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Ordonnance vierge
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setView('blank-bilan-preview')}
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Demande de bilan vierge
                </Button>
                {permissions.canManagePrescriptions && (
                  <Button onClick={() => setView('prescription-form')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nouvelle ordonnance
                  </Button>
                )}
              </>
            )}
            {activeTab === 'templates' && permissions.canManagePrescriptions && (
              <Button onClick={() => setView('template-form')}>
                <Plus className="w-4 h-4 mr-2" />
                Nouveau modèle
              </Button>
            )}
          </div>
        </div>

        {/* Contenu des onglets */}
        <TabsContent value="prescriptions">
          {(isLoading || isListLoading) ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : prescriptionsTotalItems === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucune ordonnance trouvée</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? 'Aucune ordonnance ne correspond à votre recherche.' : 'Commencez par créer votre première ordonnance.'}
                </p>
                <Button onClick={() => setView('prescription-form')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Créer une ordonnance
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="grid gap-4">
                {prescriptions.map((prescription) => (
                <Card key={prescription.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="font-semibold">
                              {prescription.patient?.first_name} {prescription.patient?.last_name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {new Date(prescription.date).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground mb-2">
                          {prescription.medications.length} médicament(s) prescrit(s)
                        </div>
                        <div className="text-sm">
                          {prescription.medications.slice(0, 2).map((med, index) => (
                            <span key={index} className="inline-block bg-muted px-2 py-1 rounded mr-2 mb-1">
                              {med.name}
                            </span>
                          ))}
                          {prescription.medications.length > 2 && (
                            <span className="text-muted-foreground">
                              +{prescription.medications.length - 2} autre(s)
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedPrescription(prescription);
                            setView('preview');
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedPrescription(prescription);
                            setView('prescription-form');
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeletePrescription(prescription)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                ))}
              </div>

              {/* Contrôles de pagination pour les ordonnances */}
              <PaginationControls
                currentPage={prescriptionsCurrentPage}
                totalPages={prescriptionsTotalPages}
                onPageChange={prescriptionsGoToPage}
                canGoPrevious={prescriptionsCanGoPrevious}
                canGoNext={prescriptionsCanGoNext}
                startIndex={prescriptionsStartIndex}
                endIndex={prescriptionsEndIndex}
                totalItems={prescriptionsTotalItems}
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="templates">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : templatesPagination.totalItems === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucun modèle trouvé</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? 'Aucun modèle ne correspond à votre recherche.' : 'Créez des modèles pour accélérer la prescription.'}
                </p>
                <Button onClick={() => setView('template-form')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Créer un modèle
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="grid gap-4">
                {templatesPagination.paginatedData.map((template) => (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold mb-2">{template.name}</h3>
                        {template.description && (
                          <p className="text-sm text-muted-foreground mb-2">{template.description}</p>
                        )}
                        <div className="text-sm text-muted-foreground mb-2">
                          {template.medications.length} médicament(s)
                        </div>
                        <div className="text-sm">
                          {template.medications.slice(0, 3).map((med, index) => (
                            <span key={index} className="inline-block bg-muted px-2 py-1 rounded mr-2 mb-1">
                              {med.name}
                            </span>
                          ))}
                          {template.medications.length > 3 && (
                            <span className="text-muted-foreground">
                              +{template.medications.length - 3} autre(s)
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedTemplate(template);
                            setView('prescription-form');
                          }}
                        >
                          Utiliser
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedTemplate(template);
                            setView('template-form');
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteTemplate(template)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                ))}
              </div>

              {/* Contrôles de pagination pour les modèles */}
              <PaginationControls
                currentPage={templatesPagination.currentPage}
                totalPages={templatesPagination.totalPages}
                onPageChange={templatesPagination.goToPage}
                canGoPrevious={templatesPagination.canGoPrevious}
                canGoNext={templatesPagination.canGoNext}
                startIndex={templatesPagination.startIndex}
                endIndex={templatesPagination.endIndex}
                totalItems={templatesPagination.totalItems}
              />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
