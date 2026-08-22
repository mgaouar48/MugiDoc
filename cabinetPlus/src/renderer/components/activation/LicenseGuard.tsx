import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, Key } from 'lucide-react';
import { useActivation } from '@/hooks/useActivation';
import { ActivationDialog } from './ActivationDialog';

interface LicenseGuardProps {
  children: React.ReactNode;
}

export const LicenseGuard: React.FC<LicenseGuardProps> = ({ children }) => {
  const [showActivationDialog, setShowActivationDialog] = useState(false);
  const [trialDays, setTrialDays] = useState(0);
  
  const {
    isValid,
    licenseInfo,
    message,
    isLoading,
    getTrialDaysRemaining,
    refreshLicenseStatus
  } = useActivation();

  useEffect(() => {
    const updateTrialDays = async () => {
      const days = await getTrialDaysRemaining();
      setTrialDays(days);
    };
    
    updateTrialDays();
    
    // Mettre à jour les jours restants toutes les heures
    const interval = setInterval(updateTrialDays, 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [getTrialDaysRemaining]);

  const handleActivationSuccess = async () => {
    await refreshLicenseStatus();
    setShowActivationDialog(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Vérification de la licence...</p>
        </div>
      </div>
    );
  }

  if (!isValid) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-xl">Licence requise</CardTitle>
            <CardDescription>
              {message}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {licenseInfo?.status === 'expired' && !licenseInfo.isActivated && (
              <div className="rounded-lg bg-muted p-3">
                <p className="text-sm font-medium text-foreground">
                  Période d'essai expirée
                </p>
                <p className="text-xs text-destructive/80 mt-1">
                  Veuillez entrer une clé d'activation pour continuer à utiliser l'application.
                </p>
              </div>
            )}

            {licenseInfo?.status === 'expired' && licenseInfo.isActivated && (
              <div className="rounded-lg bg-muted p-3">
                <p className="text-sm font-medium text-foreground">
                  Licence expirée
                </p>
                <p className="text-xs text-destructive/80 mt-1">
                  Votre licence a expiré. Contactez votre administrateur pour renouveler.
                </p>
              </div>
            )}

            <Button 
              onClick={() => setShowActivationDialog(true)}
              className="w-full"
              size="lg"
            >
              <Key className="w-4 h-4 mr-2" />
              Entrer une clé d'activation
            </Button>

            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Contactez votre administrateur pour obtenir une clé d'activation
              </p>
            </div>
          </CardContent>
        </Card>

        <ActivationDialog
          open={showActivationDialog}
          onOpenChange={setShowActivationDialog}
          onActivationSuccess={handleActivationSuccess}
        />
      </div>
    );
  }

  return <>{children}</>;
};
