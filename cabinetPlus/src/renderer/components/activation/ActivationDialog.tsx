import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Key, Loader2 } from 'lucide-react';
import { useActivation } from '@/hooks/useActivation';
import { useToast } from '@/hooks/use-toast';

interface ActivationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onActivationSuccess?: () => void;
}

export const ActivationDialog: React.FC<ActivationDialogProps> = ({
  open,
  onOpenChange,
  onActivationSuccess
}) => {
  const [activationKey, setActivationKey] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  
  const { activateWithKey, error, clearError } = useActivation();
  const { toast } = useToast();

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
      setIsActivating(true);
      const response = await activateWithKey(activationKey);
      
      if (response.success) {
        toast({
          title: "Activation réussie",
          description: response.message,
        });
        setActivationKey('');
        onOpenChange(false);
        onActivationSuccess?.();
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
    } finally {
      setIsActivating(false);
    }
  };

  const handleClose = () => {
    setActivationKey('');
    clearError();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Activation de MediMemo Cabinet
          </DialogTitle>
          <DialogDescription>
            Entrez votre clé d'activation pour débloquer toutes les fonctionnalités de l'application.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="activation-key">Clé d'activation</Label>
            <Input
              id="activation-key"
              placeholder="XXXX-XXXX-XXXX-XXXX"
              value={activationKey}
              onChange={handleInputChange}
              className="font-mono text-center"
              maxLength={19}
              disabled={isActivating}
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
          
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isActivating}
            >
              Annuler
            </Button>
            <Button
              onClick={handleActivation}
              disabled={isActivating || !activationKey.trim()}
            >
              {isActivating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Activation...
                </>
              ) : (
                <>
                  <Key className="w-4 h-4 mr-2" />
                  Activer
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
