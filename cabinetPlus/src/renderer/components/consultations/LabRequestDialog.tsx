import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { FlaskConical, Printer } from "lucide-react";
import { Patient } from "../../../shared/types";
import { BlankBilanPreview } from "../prescriptions/BlankBilanPreview";

interface LabRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: Patient | null;
  consultationId?: number | null;
}

export const LabRequestDialog = ({
  open,
  onOpenChange,
  patient,
}: LabRequestDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-5 pb-3 border-b border-border print:hidden">
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <FlaskConical className="w-5 h-5 text-teal-600" />
            Demande de Bilan Vierge
            {patient && (
              <span className="text-muted-foreground font-normal text-sm ml-1">
                — {patient.first_name} {patient.last_name}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="px-2 py-2">
          <BlankBilanPreview
            onBack={() => onOpenChange(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
