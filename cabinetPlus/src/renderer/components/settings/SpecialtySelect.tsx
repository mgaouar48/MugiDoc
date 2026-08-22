import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { MEDICAL_SPECIALTIES, MedicalSpecialty } from '../../../shared/types';

interface SpecialtySelectProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const SpecialtySelect: React.FC<SpecialtySelectProps> = ({
  value,
  onChange,
  className
}) => {
  const [isCustom, setIsCustom] = useState(() => {
    // Vérifier si la valeur actuelle est dans les spécialités prédéfinies
    return value && !MEDICAL_SPECIALTIES.includes(value as MedicalSpecialty);
  });
  const [customValue, setCustomValue] = useState(() => {
    // Si la valeur n'est pas prédéfinie, c'est une valeur personnalisée
    return (value && !MEDICAL_SPECIALTIES.includes(value as MedicalSpecialty)) ? value : '';
  });

  const handleSelectChange = (selectedValue: string) => {
    if (selectedValue === 'Autre') {
      setIsCustom(true);
      // Si on passe en mode personnalisé, garder la valeur personnalisée existante
      const newValue = customValue || value || '';
      setCustomValue(newValue);
      onChange(newValue);
    } else {
      setIsCustom(false);
      setCustomValue('');
      onChange(selectedValue);
    }
  };

  const handleCustomChange = (customText: string) => {
    setCustomValue(customText);
    onChange(customText);
  };

  // Effet pour synchroniser l'état quand la valeur change de l'extérieur
  React.useEffect(() => {
    const isValueCustom = value && !MEDICAL_SPECIALTIES.includes(value as MedicalSpecialty);
    setIsCustom(isValueCustom);
    if (isValueCustom) {
      setCustomValue(value);
    }
  }, [value]);

  // Déterminer la valeur à afficher dans le select
  const selectValue = isCustom ? 'Autre' : (MEDICAL_SPECIALTIES.includes(value as MedicalSpecialty) ? value : 'Autre');

  return (
    <div className={`space-y-2 ${className || ''}`}>
      <Select value={selectValue} onValueChange={handleSelectChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Sélectionnez une spécialité" />
        </SelectTrigger>
        <SelectContent>
          {MEDICAL_SPECIALTIES.map((specialty) => (
            <SelectItem key={specialty} value={specialty}>
              {specialty}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {isCustom && (
        <Input
          placeholder="Spécifiez votre spécialité"
          value={customValue}
          onChange={(e) => handleCustomChange(e.target.value)}
          className="w-full"
        />
      )}
    </div>
  );
};
