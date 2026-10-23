import { ConsultationDiagnostics, ConsultationDiagnosisEntry, TreatmentLine } from "../../shared/types";
import { formatTreatmentLine } from "./treatment";

const formatDiagnosisEntry = (entry: ConsultationDiagnosisEntry): string =>
  entry.icd10_code ? `${entry.label} (${entry.icd10_code})` : entry.label;

/**
 * Recompose le texte "diagnostic" pour un aperçu local (avant enregistrement),
 * avec exactement le même format que `ConsultationService.composeDiagnosticText`
 * côté serveur — pour que l'aperçu d'impression d'une consultation en cours de
 * saisie (`ConsultationPrintPreviewDialog`) reflète le bloc structuré plutôt
 * qu'un champ texte hérité qui n'est plus jamais rempli depuis L8.
 */
export const composeDiagnosticPreview = (diagnostics?: ConsultationDiagnostics): string => {
  if (!diagnostics?.primary?.label) return '';
  const parts = [formatDiagnosisEntry(diagnostics.primary)];
  for (const secondary of diagnostics.secondary || []) {
    if (secondary.label) parts.push(formatDiagnosisEntry(secondary));
  }
  return parts.join(' ; ');
};

/**
 * Recompose le texte "traitement" pour un aperçu local, même format que
 * `ConsultationService.composeTraitementText` côté serveur — même raison que
 * ci-dessus, appliquée au champ hérité `traitement` (plus jamais rempli
 * depuis L9).
 */
export const composeTraitementPreview = (lines?: TreatmentLine[]): string => {
  if (!lines || lines.length === 0) return '';
  return lines.map(formatTreatmentLine).filter(Boolean).join('\n');
};
