import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, Coffee, Settings } from "lucide-react";
import { useWorkingHours } from "../../hooks/useWorkingHours";

interface WorkingHoursInfoProps {
  onSettingsClick?: () => void;
}

export const WorkingHoursInfo: React.FC<WorkingHoursInfoProps> = ({ onSettingsClick }) => {
  const { workingHours, isLoading, getWorkingDaysText } = useWorkingHours();

  if (isLoading) {
    return (
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!workingHours) {
    return (
      <Card className="border-border border-orange-200 bg-orange-50">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 text-orange-700">
            <Settings className="w-4 h-4" />
            <span className="text-sm">Paramètres de travail non configurés</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-foreground flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span>Paramètres de Travail</span>
          </CardTitle>
          {onSettingsClick && (
            <button
              onClick={onSettingsClick}
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="Modifier les paramètres"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {/* Horaires de travail */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Horaires:</span>
          <Badge variant="outline" className="text-xs">
            {workingHours.start} - {workingHours.end}
          </Badge>
        </div>

        {/* Pause déjeuner */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground flex items-center space-x-1">
            <Coffee className="w-3 h-3" />
            <span>Pause:</span>
          </span>
          <Badge variant="outline" className="text-xs">
            {workingHours.lunchStart} - {workingHours.lunchEnd}
          </Badge>
        </div>

        {/* Durée consultation */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Consultation:</span>
          <Badge variant="outline" className="text-xs">
            {workingHours.consultationDuration} min
          </Badge>
        </div>

        {/* Jours de travail */}
        <div className="space-y-2">
          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span>Jours ouvrables:</span>
          </div>
          <div className="text-xs">
            <Badge variant="secondary" className="text-xs">
              {getWorkingDaysText()}
            </Badge>
          </div>
        </div>

        {/* Créneaux par jour */}
        <div className="pt-2 border-t border-border">
          <div className="text-xs text-muted-foreground">
            Créneaux disponibles par jour: {Math.floor((
              (new Date(`2000-01-01T${workingHours.end}:00`).getTime() - 
               new Date(`2000-01-01T${workingHours.start}:00`).getTime()) -
              (new Date(`2000-01-01T${workingHours.lunchEnd}:00`).getTime() - 
               new Date(`2000-01-01T${workingHours.lunchStart}:00`).getTime())
            ) / (workingHours.consultationDuration * 60000))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
