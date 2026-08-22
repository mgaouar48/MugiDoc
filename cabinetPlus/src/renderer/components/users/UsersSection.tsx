import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { User, UserRole } from '../../../shared/types';
import { UserDialog } from './UserDialog';
import {
  Users,
  UserPlus,
  ArrowLeft,
  Shield,
  Stethoscope,
  UserCheck,
  UserX,
  Key,
  Trash2,
  Edit,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface UsersSectionProps {
  onBack: () => void;
}

export const UsersSection: React.FC<UsersSectionProps> = ({ onBack }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [resetPassUser, setResetPassUser] = useState<User | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      if (window.electronAPI && window.electronAPI.auth) {
        const data = await window.electronAPI.auth.getAllUsers();
        setUsers(data);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateOrUpdateUser = async (userData: any) => {
    if (editingUser) {
      await window.electronAPI.auth.updateUser(editingUser.id, userData);
    } else {
      await window.electronAPI.auth.createUser(userData);
    }
    await loadUsers();
  };

  const handleToggleActive = async (user: User) => {
    try {
      await window.electronAPI.auth.toggleUserActive(user.id);
      await loadUsers();
    } catch (err: any) {
      alert(err.message || 'Erreur lors du changement de statut');
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur "${user.username}" ?`)) {
      return;
    }
    try {
      await window.electronAPI.auth.deleteUser(user.id);
      await loadUsers();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la suppression');
    }
  };

  const handleResetPassword = async () => {
    if (!resetPassUser || !newPasswordInput.trim()) return;
    try {
      await window.electronAPI.auth.resetPassword(resetPassUser.id, newPasswordInput.trim());
      alert(`Mot de passe réinitialisé pour ${resetPassUser.username}`);
      setResetPassUser(null);
      setNewPasswordInput('');
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la réinitialisation');
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
      case 'doctor':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary">
            <Stethoscope className="w-3 h-3" /> Médecin (Admin)
          </span>
        );
      case 'secretary':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            <UserCheck className="w-3 h-3" /> Secrétaire
          </span>
        );
    }
  };


  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-8 flex items-center" style={{ height: '64px' }}>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon-sm" onClick={onBack}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Gestion des Utilisateurs & Permissions</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Gérer les comptes utilisateurs et définir leurs rôles d'accès (RBAC)
              </p>
            </div>
          </div>

          <Button
            onClick={() => {
              setEditingUser(null);
              setIsDialogOpen(true);
            }}
          >
            <UserPlus className="w-4 h-4" />
            Nouvel Utilisateur
          </Button>
        </div>
      </header>

      <div className="p-8 space-y-6">
        {error && (
          <div className="bg-destructive/8 border border-destructive/20 text-destructive p-4 rounded-lg text-xs">
            {error}
          </div>
        )}

        {/* Grid of Users */}
        <Card className="shadow-card">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-foreground text-lg font-semibold">
              <Users className="w-5 h-5 text-primary" />
              Liste des Comptes ({users.length})
            </CardTitle>
            <CardDescription className="text-xs">
              Administrateurs, Médecins et Secrétaires enregistrés dans le système
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="py-12 text-center text-muted-foreground text-sm">Chargement des utilisateurs...</div>
            ) : users.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-sm">Aucun utilisateur trouvé</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-foreground">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                      <th className="px-6 py-3">Utilisateur</th>
                      <th className="px-6 py-3">Nom complet</th>
                      <th className="px-6 py-3">Rôle</th>
                      <th className="px-6 py-3">Spécialité / Contact</th>
                      <th className="px-6 py-3">Statut</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-muted/40 transition-colors">
                        <td className="px-6 py-3.5 font-semibold text-foreground font-mono">
                          @{user.username}
                        </td>
                        <td className="px-6 py-3.5 font-medium">
                          {user.first_name} {user.last_name}
                        </td>
                        <td className="px-6 py-3.5">
                          {getRoleBadge(user.role)}
                        </td>
                        <td className="px-6 py-3.5 text-muted-foreground">
                          {user.role === 'doctor' && user.speciality ? (
                            <span>{user.speciality}</span>
                          ) : (
                            <span>{user.email || user.phone || '—'}</span>
                          )}
                        </td>
                        <td className="px-6 py-3.5">
                          {user.is_active ? (
                            <span className="inline-flex items-center gap-1 text-xs text-success font-medium">
                              <CheckCircle className="w-3.5 h-3.5" /> Actif
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-destructive font-medium">
                              <XCircle className="w-3.5 h-3.5" /> Inactif
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3.5 text-right space-x-1">
                          {/* Edit */}
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => {
                              setEditingUser(user);
                              setIsDialogOpen(true);
                            }}
                            title="Modifier"
                            className="text-primary hover:bg-primary/10"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>

                          {/* Reset password */}
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => {
                              setResetPassUser(user);
                              setNewPasswordInput('');
                            }}
                            title="Réinitialiser le mot de passe"
                            className="text-warning hover:bg-warning/10"
                          >
                            <Key className="w-4 h-4" />
                          </Button>

                          {/* Toggle Active */}
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleToggleActive(user)}
                            title={user.is_active ? 'Désactiver le compte' : 'Activer le compte'}
                            className="text-muted-foreground hover:bg-muted"
                          >
                            {user.is_active ? (
                              <UserX className="w-4 h-4" />
                            ) : (
                              <UserCheck className="w-4 h-4" />
                            )}
                          </Button>

                          {/* Delete */}
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleDeleteUser(user)}
                            title="Supprimer"
                            className="text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* User Edit / Create Modal */}
      <UserDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSave={handleCreateOrUpdateUser}
        userToEdit={editingUser}
      />

      {/* Modal Réinitialisation Mot de passe */}
      {resetPassUser && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-card shadow-modal max-w-md w-full rounded-xl p-6 space-y-4 border border-border">
            <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Key className="w-5 h-5 text-warning" />
              Réinitialiser le mot de passe pour {resetPassUser.username}
            </h3>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nouveau mot de passe</label>
              <input
                type="password"
                value={newPasswordInput}
                onChange={(e) => setNewPasswordInput(e.target.value)}
                placeholder="Entrez le nouveau mot de passe"
                className="w-full h-11 px-3 border border-border rounded-md bg-muted text-foreground text-sm font-sans focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setResetPassUser(null)}>
                Annuler
              </Button>
              <Button onClick={handleResetPassword} className="bg-warning hover:bg-warning/90 text-warning-foreground font-semibold">
                Valider la réinitialisation
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
