import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Key, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { useActivation } from "@/hooks/useActivation";
import { useToast } from "@/hooks/use-toast";

interface ActivationBadgeProps {
  showActivationButton?: boolean;
}

export const ActivationBadge = ({ showActivationButton = true }: ActivationBadgeProps) => {
  const [activationKey, setActivationKey] = useState("");
  const [trialDaysRemaining, setTrialDaysRemaining] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const {
    isValid,
    licenseInfo,
    message,
    isLoading,
    error,
    activateWithKey,
    getTrialDaysRemaining,
    refreshLicenseStatus,
    clearError
  } = useActivation();

  const { toast } = useToast();

  useEffect(() => {
    const updateTrialDays = async () => {
      const days = await getTrialDaysRemaining();
      setTrialDaysRemaining(days);
    };
    
    updateTrialDays();
    
    // Mettre à jour toutes les heures
    const interval = setInterval(updateTrialDays, 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [getTrialDaysRemaining]);

  const handleActivation = async () => {
    if (!activationKey.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir une clé d'activation",
        variant: "destructive",
      });
      return;
    }

    try {
      clearError();
      const response = await activateWithKey(activationKey);
      
      if (response.success) {
        toast({
          title: "Activation réussie",
          description: response.message,
        });
        setIsDialogOpen(false);
        setActivationKey("");
        await refreshLicenseStatus();
      } else {
        toast({
          title: "Erreur d'activation",
          description: response.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'activation",
        variant: "destructive",
      });
    }
  };

  const formatActivationKey = (value: string) => {
    const cleaned = value.replace(/[^A-Z0-9]/g, '').toUpperCase();
    const formatted = cleaned.replace(/(.{4})/g, '$1-').replace(/-$/, '');
    return formatted;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatActivationKey(e.target.value);
    setActivationKey(formatted);
    clearError();
  };

  const getBadgeContent = () => {
    if (!licenseInfo) {
      return {
        icon: <AlertTriangle className="w-3 h-3" />,
        text: "Inconnu",
        variant: "secondary" as const
      };
    }

    switch (licenseInfo.status) {
      case 'active':
        return {
          icon: <CheckCircle className="w-3 h-3" />,
          text: "Actif",
          variant: "default" as const
        };
      case 'trial':
        return {
          icon: <Clock className="w-3 h-3" />,
          text: `${trialDaysRemaining}j`,
          variant: trialDaysRemaining <= 7 ? "destructive" as const : "secondary" as const
        };
      case 'expired':
        return {
          icon: <AlertTriangle className="w-3 h-3" />,
          text: "Expiré",
          variant: "destructive" as const
        };
      default:
        return {
          icon: <AlertTriangle className="w-3 h-3" />,
          text: "Inconnu",
          variant: "secondary" as const
        };
    }
  };

  const badgeContent = getBadgeContent();

  return (
    <div className="flex items-center gap-2">
      <Badge variant={badgeContent.variant} className="flex items-center gap-1">
        {badgeContent.icon}
        {badgeContent.text}
      </Badge>

      {showActivationButton && (!licenseInfo?.isActivated || !isValid) && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Key className="w-3 h-3 mr-1" />
              Activer
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Activation de MediMemo Cabinet</DialogTitle>
              <DialogDescription>
                Entrez votre clé d'activation pour débloquer toutes les fonctionnalités.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="activation-key">Clé d'activation</Label>
                <Input
                  id="activation-key"
                  placeholder="Saisissez votre clé d'activation"
                  value={activationKey}
                  onChange={handleInputChange}
                  className="font-mono"
                  maxLength={19}
                />
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleActivation}
                  disabled={isLoading || !activationKey.trim()}
                >
                  {isLoading ? "Activation..." : "Activer"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
