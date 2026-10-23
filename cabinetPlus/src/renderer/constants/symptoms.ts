export interface SymptomOption {
  label: string;
  category: string;
}

/**
 * Symptômes courants proposés dans l'anamnèse (puces + recherche) —
 * cf. PLAN_CONSULTATION.md L6.3. Liste fixe, non extensible depuis l'app
 * (contrairement aux motifs de consultation) : le vocabulaire des symptômes
 * est trop vaste pour qu'un catalogue qui grossit à chaque saisie reste
 * utilisable. La saisie libre du champ « Symptômes » couvre tout ce qui n'y
 * figure pas.
 */
export const COMMON_SYMPTOMS: SymptomOption[] = [
  { label: 'Fièvre', category: 'Général' },
  { label: 'Frissons', category: 'Général' },
  { label: 'Fatigue', category: 'Général' },
  { label: 'Perte d\'appétit', category: 'Général' },
  { label: 'Amaigrissement', category: 'Général' },
  { label: 'Sueurs nocturnes', category: 'Général' },

  { label: 'Toux sèche', category: 'ORL / Respiratoire' },
  { label: 'Toux grasse', category: 'ORL / Respiratoire' },
  { label: 'Mal de gorge', category: 'ORL / Respiratoire' },
  { label: 'Essoufflement', category: 'ORL / Respiratoire' },
  { label: 'Écoulement nasal', category: 'ORL / Respiratoire' },
  { label: 'Congestion nasale', category: 'ORL / Respiratoire' },

  { label: 'Nausées', category: 'Digestif' },
  { label: 'Vomissements', category: 'Digestif' },
  { label: 'Diarrhée', category: 'Digestif' },
  { label: 'Constipation', category: 'Digestif' },
  { label: 'Douleur abdominale', category: 'Digestif' },
  { label: 'Ballonnements', category: 'Digestif' },

  { label: 'Douleur thoracique', category: 'Cardio-vasculaire' },
  { label: 'Palpitations', category: 'Cardio-vasculaire' },
  { label: 'Œdèmes', category: 'Cardio-vasculaire' },

  { label: 'Céphalées', category: 'Neurologique' },
  { label: 'Vertiges', category: 'Neurologique' },
  { label: 'Troubles du sommeil', category: 'Neurologique' },

  { label: 'Douleur articulaire', category: 'Ostéo-articulaire' },
  { label: 'Douleur musculaire', category: 'Ostéo-articulaire' },
  { label: 'Raideur matinale', category: 'Ostéo-articulaire' },

  { label: 'Éruption cutanée', category: 'Dermatologique' },
  { label: 'Démangeaisons', category: 'Dermatologique' },

  { label: 'Brûlures mictionnelles', category: 'Génito-urinaire' },
];
