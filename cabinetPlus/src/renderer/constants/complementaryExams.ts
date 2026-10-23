import { ExamRequestEntry } from "../../shared/types";

export interface ExamCategoryDef {
  value: ExamRequestEntry['category'];
  label: string;
  /** Examens fréquents proposés en raccourci pour cette catégorie — cf. PLAN_CONSULTATION.md L10.2. */
  frequentExams: string[];
}

/**
 * Catégories d'examens complémentaires + examens fréquents par catégorie —
 * cf. PLAN_CONSULTATION.md L10.2. Les 6 premières sont demandées
 * explicitement par todo_consultation ; « Autre » couvre le reste en texte
 * libre, sans raccourci (aucune liste de référence n'aurait de sens ici).
 */
export const EXAM_CATEGORIES: ExamCategoryDef[] = [
  {
    value: 'biologie',
    label: 'Analyses biologiques',
    frequentExams: [
      'NFS', 'CRP', 'Glycémie à jeun', 'Ionogramme sanguin',
      'Bilan rénal (urée, créatinine)', 'Bilan hépatique', 'Bilan lipidique',
      'TSH', 'ECBU', 'CRP + NFS',
    ],
  },
  {
    value: 'imagerie',
    label: 'Imagerie (radiographie)',
    frequentExams: [
      'Radio thorax', 'Radio du rachis lombaire', 'Radio du genou',
      'Radio de la main', 'Radio du bassin',
    ],
  },
  {
    value: 'ecg',
    label: 'ECG',
    frequentExams: ['ECG de repos', "ECG d'effort"],
  },
  {
    value: 'echographie',
    label: 'Échographie',
    frequentExams: [
      'Échographie abdominale', 'Échographie pelvienne',
      'Échographie thyroïdienne', 'Échographie cardiaque (ETT)',
    ],
  },
  {
    value: 'scanner',
    label: 'Scanner (TDM)',
    frequentExams: [
      'Scanner thoracique', 'Scanner abdomino-pelvien', 'Scanner cérébral',
    ],
  },
  {
    value: 'irm',
    label: 'IRM',
    frequentExams: ['IRM cérébrale', 'IRM du rachis lombaire', 'IRM du genou'],
  },
  {
    value: 'autre',
    label: 'Autre',
    frequentExams: [],
  },
];

export const getExamCategoryLabel = (category: ExamRequestEntry['category']): string =>
  EXAM_CATEGORIES.find(c => c.value === category)?.label || category;

export const getFrequentExams = (category: ExamRequestEntry['category']): string[] =>
  EXAM_CATEGORIES.find(c => c.value === category)?.frequentExams || [];
