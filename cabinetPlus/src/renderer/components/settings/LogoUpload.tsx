import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useElectron } from '@/hooks/useElectron';
import { CabinetLogo, LogoUploadRequest } from '../../../shared/types';

interface LogoUploadProps {
  onLogoUploaded?: (logo: CabinetLogo) => void;
}

export const LogoUpload: React.FC<LogoUploadProps> = ({ onLogoUploaded }) => {
  const [currentLogo, setCurrentLogo] = useState<CabinetLogo | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { isElectron } = useElectron();

  // Charger le logo existant au montage du composant
  React.useEffect(() => {
    loadCurrentLogo();
  }, [isElectron]);

  const loadCurrentLogo = async () => {
    if (!isElectron) return;

    try {
      const logo = await window.electronAPI.settings.getLogo();
      if (logo) {
        setCurrentLogo(logo);
        // Créer une URL de prévisualisation à partir du fichier local
        setLogoPreview(`file://${logo.path}`);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du logo:', error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un fichier image valide",
        variant: "destructive",
      });
      return;
    }

    // Vérifier la taille du fichier (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Erreur",
        description: "Le fichier est trop volumineux. Taille maximale : 5MB",
        variant: "destructive",
      });
      return;
    }

    // Lire le fichier et l'uploader
    const reader = new FileReader();
    reader.onload = async (e) => {
      const result = e.target?.result as string;
      if (result) {
        await uploadLogo(file.name, result, file.type);
      }
    };
    reader.readAsDataURL(file);
  };

  const uploadLogo = async (filename: string, dataUrl: string, mimeType: string) => {
    if (!isElectron) return;

    setIsUploading(true);
    try {
      const logoData: LogoUploadRequest = {
        filename,
        data: dataUrl,
        mimeType
      };

      const uploadedLogo = await window.electronAPI.settings.uploadLogo(logoData);
      setCurrentLogo(uploadedLogo);
      setLogoPreview(dataUrl);
      
      toast({
        title: "Succès",
        description: "Logo du cabinet uploadé avec succès",
      });

      onLogoUploaded?.(uploadedLogo);
    } catch (error) {
      console.error('Erreur lors de l\'upload du logo:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'uploader le logo",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteLogo = async () => {
    if (!isElectron || !currentLogo) return;

    try {
      await window.electronAPI.settings.deleteLogo();
      setCurrentLogo(null);
      setLogoPreview(null);
      
      toast({
        title: "Succès",
        description: "Logo supprimé avec succès",
      });
    } catch (error) {
      console.error('Erreur lors de la suppression du logo:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le logo",
        variant: "destructive",
      });
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Logo du Cabinet
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Zone d'upload */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
          {logoPreview ? (
            <div className="space-y-4">
              <div className="relative inline-block">
                <img
                  src={logoPreview}
                  alt="Logo du cabinet"
                  className="max-w-full max-h-48 object-contain rounded-lg shadow-md"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 h-8 w-8 rounded-full p-0"
                  onClick={handleDeleteLogo}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {currentLogo && (
                <div className="text-sm text-gray-600 space-y-1">
                  
                  <p><strong>Taille:</strong> {formatFileSize(currentLogo.size)}</p>
                  
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
              <div>
                <p className="text-lg font-medium text-gray-900">Aucun logo uploadé</p>
                <p className="text-sm text-gray-500">
                  Cliquez pour sélectionner un fichier image
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Boutons d'action */}
        <div className="flex gap-2 justify-center">
          <Button
            onClick={triggerFileInput}
            disabled={isUploading}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            {currentLogo ? 'Remplacer le logo' : 'Uploader un logo'}
          </Button>
        </div>

        {/* Input file caché */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Informations sur les formats acceptés */}
        <div className="text-xs text-gray-500 text-center space-y-1">
          <p>Formats acceptés: PNG, JPG, JPEG, GIF, WebP</p>
          <p>Taille maximale: 5MB</p>
        </div>
      </CardContent>
    </Card>
  );
};
