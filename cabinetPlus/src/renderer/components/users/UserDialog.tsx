import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { User, UserRole, CreateUserRequest, MEDICAL_SPECIALTIES } from '../../../shared/types';
import { Shield, UserPlus, Key } from 'lucide-react';

interface UserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (userData: any) => Promise<void>;
  userToEdit?: User | null;
}

export const UserDialog: React.FC<UserDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  userToEdit
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [speciality, setSpeciality] = useState('Médecine générale');
  const [role, setRole] = useState<UserRole>('doctor');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userToEdit) {
      setUsername(userToEdit.username || '');
      setPassword(''); // Laisser vide si inchangé
      setFirstName(userToEdit.first_name || '');
      setLastName(userToEdit.last_name || '');
      setEmail(userToEdit.email || '');
      setPhone(userToEdit.phone || '');
      setSpeciality(userToEdit.speciality || 'Médecine générale');
      setRole(userToEdit.role || 'doctor');
    } else {
      setUsername('');
      setPassword('');
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setSpeciality('Médecine générale');
      setRole('doctor');
    }
    setError(null);
  }, [userToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !firstName.trim() || !lastName.trim()) {
      setError('Le nom d\'utilisateur, prénom et nom sont obligatoires.');
      return;
    }

    if (!userToEdit && !password.trim()) {
      setError('Le mot de passe est obligatoire pour la création d\'un compte.');
      return;
    }

    setLoading(true);

    try {
      const payload: any = {
        username: username.trim(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        speciality: role === 'doctor' ? speciality : undefined,
        role,
      };

      if (password.trim()) {
        payload.password = password.trim();
      }

      await onSave(payload);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'enregistrement de l\'utilisateur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <UserPlus className="w-5 h-5 text-primary" />
            {userToEdit ? `Modifier l'utilisateur : ${userToEdit.username}` : 'Créer un utilisateur'}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Rôle */}
          <div className="space-y-2">
            <Label htmlFor="role">Rôle de l'utilisateur *</Label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full h-10 px-3 border border-border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary font-medium"
            >
              <option value="doctor">Médecin (Administrateur du cabinet)</option>
              <option value="secretary">Secrétaire (Accès administratif & caisse)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Prénom *</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Prénom"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Nom *</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Nom"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Nom d'utilisateur (Login) *</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ex: dr.dupont"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                Mot de passe {userToEdit ? '(laisser vide si inchangé)' : '*'}
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required={!userToEdit}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@cabinet.fr"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="06 12 34 56 78"
              />
            </div>
          </div>

          {role === 'doctor' && (
            <div className="space-y-2">
              <Label htmlFor="speciality">Spécialité médicale</Label>
              <select
                id="speciality"
                value={speciality}
                onChange={(e) => setSpeciality(e.target.value)}
                className="w-full h-10 px-3 border border-border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {MEDICAL_SPECIALTIES.map((spec) => (
                  <option key={spec} value={spec}>
                    {spec}
                  </option>
                ))}
              </select>
            </div>
          )}

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90">
              {loading ? 'Enregistrement...' : userToEdit ? 'Mettre à jour' : 'Créer l\'utilisateur'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
