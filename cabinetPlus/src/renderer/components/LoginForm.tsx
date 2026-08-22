import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Stethoscope, AlertCircle, Shield, UserCheck, Lock, Instagram, Phone } from "lucide-react";
import { useAuth, User } from "../hooks/useAuth";
import { ActivationBadge } from "@/components/ActivationBadge";
import { UserRole } from "../../shared/types";

interface LoginFormProps {
  onLogin: (user: User) => void;
}

export const LoginForm = ({ onLogin }: LoginFormProps) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('doctor');
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin");
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const { login, isLoading, error, clearError } = useAuth();

  // Charger la liste des utilisateurs pour faciliter la sélection de compte
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        if (window.electronAPI && window.electronAPI.auth && window.electronAPI.auth.getAllUsers) {
          const users = await window.electronAPI.auth.getAllUsers();
          setAvailableUsers(users);
        }
      } catch (err) {
        console.error('Erreur lors du chargement des utilisateurs:', err);
      }
    };

    fetchUsers();
  }, []);

  // Quand le rôle sélectionné change, pré-remplir avec un utilisateur correspondant
  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    clearError();

    const usersOfRole = availableUsers.filter(u => (u.role === role || (role === 'doctor' && u.role === ('admin' as any))) && u.is_active);
    if (usersOfRole.length > 0) {
      setUsername(usersOfRole[0].username);
      if (usersOfRole[0].username === 'admin') {
        setPassword('admin');
      } else {
        setPassword('');
      }
    } else {
      setUsername('');
      setPassword('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    try {
      clearError();
      const user = await login({ username, password });
      if (user) {
        onLogin(user);
      }
    } catch (err) {
      console.error('Erreur de connexion:', err);
    }
  };

  const usersForRole = availableUsers.filter(u => (u.role === selectedRole || (selectedRole === 'doctor' && u.role === ('admin' as any))) && u.is_active);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8 relative">

      <div className="w-full max-w-md">
        {/* Card principale */}
        <div className="bg-card shadow-soft p-8 space-y-6">

          {/* En-tête avec Grand Logo Officiel MugiDoc HD */}
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center py-2">
              <img
                src="./mugidoc-logo-hd.png"
                alt="MUGiDOC Logo"
                className="h-16 w-auto object-contain"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Sélectionnez votre type de compte pour accéder au cabinet
            </p>
          </div>

          {/* Sélecteur de rôle */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-center">
              Type de compte
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleRoleSelect('doctor')}
                className={`p-3.5 rounded-xl text-center flex flex-col items-center gap-1.5 transition-all duration-150 border ${
                  selectedRole === 'doctor'
                    ? 'border-primary bg-primary/10 text-primary font-semibold ring-2 ring-primary/20'
                    : 'border-border bg-card hover:bg-muted text-muted-foreground'
                }`}
              >
                <Stethoscope className={`w-5 h-5 ${selectedRole === 'doctor' ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="text-xs font-semibold">Médecin</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleSelect('secretary')}
                className={`p-3.5 rounded-xl text-center flex flex-col items-center gap-1.5 transition-all duration-150 border ${
                  selectedRole === 'secretary'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold ring-2 ring-emerald-500/20'
                    : 'border-border bg-card hover:bg-muted text-muted-foreground'
                }`}
              >
                <UserCheck className={`w-5 h-5 ${selectedRole === 'secretary' ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                <span className="text-xs font-semibold">Secrétaire</span>
              </button>
            </div>
          </div>

          {/* Comptes disponibles pour le rôle */}
          {usersForRole.length > 1 && (
            <div className="space-y-1.5 bg-muted/40 p-3 rounded-md border border-border">
              <Label className="text-xs text-muted-foreground">Comptes enregistrés :</Label>
              <div className="flex flex-wrap gap-2">
                {usersForRole.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      setUsername(u.username);
                      if (u.username === 'admin') setPassword('admin');
                      else setPassword('');
                    }}
                    className={`px-3 py-1 rounded-md text-xs border transition-all duration-150 ${
                      username === u.username
                        ? 'bg-primary text-primary-foreground border-primary font-semibold'
                        : 'bg-card text-foreground border-border hover:bg-muted'
                    }`}
                  >
                    @{u.username}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Alerte aucun compte */}
          {usersForRole.length === 0 && selectedRole !== 'admin' && (
            <div className="bg-warning/8 border border-warning/20 text-foreground p-3 rounded-md text-xs space-y-1">
              <p className="font-semibold flex items-center gap-1.5 text-warning">
                <AlertCircle className="w-4 h-4" />
                Aucun compte {selectedRole === 'doctor' ? 'Médecin' : 'Secrétaire'} enregistré
              </p>
              <p className="text-muted-foreground">
                Connectez-vous d'abord en <strong>Compte Admin</strong> (admin / admin) pour créer des utilisateurs.
              </p>
            </div>
          )}

          {/* Erreur */}
          {error && (
            <div className="bg-destructive/8 border border-destructive/20 rounded-md p-3">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            </div>
          )}

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-sm font-medium text-foreground">
                Nom d'utilisateur
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Ex: admin, dr.dupont…"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-foreground">
                Mot de passe
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Votre mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-lg rounded-md"
              disabled={isLoading || !username}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Connexion...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Se connecter
                </>
              )}
            </Button>
          </form>

          {/* Badge activation */}
          <div className="pt-4 border-t border-border">
            <div className="flex justify-center">
              <ActivationBadge />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};