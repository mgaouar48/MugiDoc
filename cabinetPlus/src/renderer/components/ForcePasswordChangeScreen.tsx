import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, ShieldAlert, Lock } from "lucide-react";
import { useAuth, User } from "../hooks/useAuth";

interface ForcePasswordChangeScreenProps {
  user: User;
  onChanged: (user: User) => void;
}

export const ForcePasswordChangeScreen = ({ user, onChanged }: ForcePasswordChangeScreenProps) => {
  const { changePassword, isLoading, error, clearError } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    clearError();

    if (newPassword.length < 8) {
      setFormError("Le nouveau mot de passe doit contenir au moins 8 caractères");
      return;
    }
    if (newPassword !== confirmPassword) {
      setFormError("Les mots de passe ne correspondent pas");
      return;
    }

    try {
      await changePassword({ currentPassword, newPassword });
      onChanged({ ...user, must_change_password: false });
    } catch (err) {
      // L'erreur est déjà exposée via `error`
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-card shadow-soft p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center">
              <ShieldAlert className="w-10 h-10 text-warning" />
            </div>
            <h1 className="text-lg font-semibold text-foreground">Changement de mot de passe requis</h1>
            <p className="text-xs text-muted-foreground">
              Pour la sécurité du cabinet, remplacez le mot de passe par défaut avant de continuer.
            </p>
          </div>

          {(formError || error) && (
            <div className="bg-destructive/8 border border-destructive/20 rounded-md p-3">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-medium">{formError || error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="currentPassword" className="text-sm font-medium text-foreground">
                Mot de passe actuel
              </Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="newPassword" className="text-sm font-medium text-foreground">
                Nouveau mot de passe
              </Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Au moins 8 caractères"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                Confirmer le mot de passe
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full h-12 text-lg rounded-md" disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Valider le nouveau mot de passe
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
