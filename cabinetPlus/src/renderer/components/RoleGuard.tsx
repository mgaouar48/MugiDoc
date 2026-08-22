import React from 'react';
import { UserRole } from '../../shared/types';
import { ShieldAlert } from 'lucide-react';
import { Button } from './ui/button';

interface RoleGuardProps {
  userRole?: UserRole;
  allowedRoles: UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onBack?: () => void;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  userRole,
  allowedRoles,
  children,
  fallback,
  onBack
}) => {
  const isAllowed = userRole ? allowedRoles.includes(userRole) : true;

  if (isAllowed) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="p-8 flex flex-col items-center justify-center min-h-[400px] bg-card rounded-lg border border-border text-center space-y-4">
      <div className="p-4 bg-destructive/10 rounded-full text-destructive">
        <ShieldAlert className="w-12 h-12" />
      </div>
      <h2 className="text-xl font-bold text-foreground">Accès Refusé</h2>
      <p className="text-muted-foreground max-w-md">
        Vous n'avez pas les permissions nécessaires pour accéder à cette fonctionnalité. Ce module est réservé aux rôles : {allowedRoles.map(r => r === 'doctor' ? 'Médecin' : 'Secrétaire').join(', ')}.
      </p>
      {onBack && (
        <Button variant="outline" onClick={onBack}>
          Retour au tableau de bord
        </Button>
      )}
    </div>
  );
};
