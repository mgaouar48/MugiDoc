import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Shield, User, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface SecuritySectionProps {
  onBack?: () => void;
}

export const SecuritySection = ({ onBack }: SecuritySectionProps) => {
  const { user, updateUser, changePassword, changeCredentials, isLoading, getCurrentUser } = useAuth();
  const { toast } = useToast();

  // États pour le formulaire unifié
  const [formData, setFormData] = useState({
    username: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Charger l'utilisateur au montage du composant
  useEffect(() => {
    const loadUser = async () => {
      if (!user) {
        await getCurrentUser();
      }
    };
    loadUser();
  }, [user, getCurrentUser]);

  // Mettre à jour le formulaire quand l'utilisateur est chargé
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        username: user.username
      }));
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Erreur",
        description: "Utilisateur non connecté",
        variant: "destructive",
      });
      return;
    }

    if (!formData.username) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir un nom d'utilisateur",
        variant: "destructive",
      });
      return;
    }

    // Vérifier si on veut changer le mot de passe
    const isChangingPassword = formData.currentPassword || formData.newPassword || formData.confirmPassword;

    if (isChangingPassword) {
      if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
        toast({
          title: "Erreur",
          description: "Pour changer le mot de passe, veuillez remplir tous les champs de mot de passe",
          variant: "destructive",
        });
        return;
      }

      if (formData.newPassword !== formData.confirmPassword) {
        toast({
          title: "Erreur",
          description: "Les nouveaux mots de passe ne correspondent pas",
          variant: "destructive",
        });
        return;
      }

      if (formData.newPassword.length < 8) {
        toast({
          title: "Erreur",
          description: "Le mot de passe doit contenir au moins 8 caractères",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      // Vérifier s'il y a des changements à effectuer
      const hasUsernameChange = formData.username !== user.username;

      if (hasUsernameChange || isChangingPassword) {
        // Utiliser changeCredentials pour changer nom d'utilisateur et/ou mot de passe
        if (!formData.currentPassword) {
          toast({
            title: "Erreur",
            description: "Veuillez saisir votre mot de passe actuel pour confirmer les modifications",
            variant: "destructive",
          });
          return;
        }

        await changeCredentials({
          currentPassword: formData.currentPassword,
          newUsername: hasUsernameChange ? formData.username : undefined,
          newPassword: isChangingPassword ? formData.newPassword : undefined
        });

        toast({
          title: "Modifications enregistrées",
          description: "Vos identifiants ont été mis à jour avec succès",
        });
      } else {
        toast({
          title: "Aucune modification",
          description: "Aucun changement détecté",
        });
      }

      // Réinitialiser les champs de mot de passe
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de mettre à jour les informations",
        variant: "destructive",
      });
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      {onBack && (
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={onBack}
              className="border-border hover:bg-muted"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-semibold text-foreground">Sécurité et Authentification</h1>
            </div>
          </div>
        </header>
      )}

      <div className="p-6">
        {/* Formulaire unifié */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Modifier les informations de connexion
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!user ? (
              <div className="text-center py-4">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-muted-foreground">Chargement...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Nom d'utilisateur */}
                <div className="space-y-2">
                  <Label htmlFor="username">Nom d'utilisateur</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="Nom d'utilisateur"
                    required
                  />
                </div>

                {/* Séparateur */}
                <div className="border-t border-border pt-4">
                  <h3 className="text-sm font-medium text-foreground mb-4">
                    Changer le mot de passe (optionnel)
                  </h3>
                </div>
                {/* Mot de passe actuel */}
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Mot de passe actuel *</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showPasswords.current ? "text" : "password"}
                      value={formData.currentPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      placeholder="Saisissez votre mot de passe actuel"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => togglePasswordVisibility('current')}
                    >
                      {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Requis pour confirmer toute modification des identifiants
                  </p>
                </div>

                {/* Nouveaux mots de passe */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showPasswords.new ? "text" : "password"}
                        value={formData.newPassword}
                        onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                        placeholder="Nouveau mot de passe"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => togglePasswordVisibility('new')}
                      >
                        {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showPasswords.confirm ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        placeholder="Confirmer le mot de passe"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => togglePasswordVisibility('confirm')}
                      >
                        {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Conseils */}
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium">Conseils :</p>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>Laissez les champs de mot de passe vides si vous ne voulez pas le changer</li>
                        <li>Mot de passe : au moins 8 caractères</li>
                        <li>Mélange de lettres, chiffres et symboles</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Bouton de soumission */}
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? "Enregistrement..." : "Enregistrer les modifications"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>


      </div>
    </div>
  );
};
