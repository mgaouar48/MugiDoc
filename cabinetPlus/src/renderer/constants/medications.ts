export interface StandardMedication {
  name: string;
  dosage: string;
  instructions: string;
  duration: string;
  category?: string;
}

export const COMMON_MEDICATIONS: StandardMedication[] = [
  // Antalgiques & Anti-inflammatoires
  { name: "Paracétamol (Doliprane / Efferalgan)", dosage: "1g", instructions: "1 comprimé 3 fois par jour au besoin", duration: "5 jours", category: "Antalgique" },
  { name: "Paracétamol (Doliprane)", dosage: "500mg", instructions: "1 comprimé 3 fois par jour", duration: "5 jours", category: "Antalgique" },
  { name: "Ibuprofène (Advil / Antadys)", dosage: "400mg", instructions: "1 comprimé 3 fois par jour au milieu des repas", duration: "5 jours", category: "Anti-inflammatoire" },
  { name: "Ketoprofène (Bi-Profenid)", dosage: "150mg", instructions: "1 comprimé par jour au repas du soir", duration: "5 jours", category: "Anti-inflammatoire" },
  { name: "Diclofenac (Voltarène)", dosage: "50mg", instructions: "1 comprimé 2 à 3 fois par jour", duration: "5 jours", category: "Anti-inflammatoire" },
  { name: "Spasfon (Phloroglucinol)", dosage: "80mg", instructions: "2 comprimés en cas de douleur (max 6/jour)", duration: "5 jours", category: "Antispasmodique" },

  // Antibiotiques
  { name: "Amoxicilline (Clamoxyl)", dosage: "1g", instructions: "1 comprimé matin et soir", duration: "7 jours", category: "Antibiotique" },
  { name: "Amoxicilline + Acide Clavulanique (Augmentin)", dosage: "1g/125mg", instructions: "1 sachet matin et soir au milieu du repas", duration: "7 jours", category: "Antibiotique" },
  { name: "Azithromycine (Zithromax)", dosage: "250mg", instructions: "2 comprimés le 1er jour, puis 1 comprimé/jour pendant 4 jours", duration: "5 jours", category: "Antibiotique" },
  { name: "Cefixime (Oroken)", dosage: "200mg", instructions: "1 comprimé matin et soir", duration: "5 jours", category: "Antibiotique" },
  { name: "Ciprofloxacine (Ciprolon)", dosage: "500mg", instructions: "1 comprimé matin et soir", duration: "7 jours", category: "Antibiotique" },
  { name: "Metronidazole (Flagyl)", dosage: "500mg", instructions: "1 comprimé 3 fois par jour aux repas", duration: "7 jours", category: "Antibiotique" },

  // Gastro-entérologie
  { name: "Oméprazole (Mopen)", dosage: "20mg", instructions: "1 gélule le matin à jeun", duration: "14 jours", category: "Gastrologie" },
  { name: "Pantoprazole (Inipomp)", dosage: "40mg", instructions: "1 comprimé le matin avant le petit-déjeuner", duration: "28 jours", category: "Gastrologie" },
  { name: "Gaviscon", dosage: "Sachet", instructions: "1 sachet après les 3 principaux repas et au coucher", duration: "7 jours", category: "Gastrologie" },
  { name: "Smecta (Diosmectite)", dosage: "Sachet", instructions: "1 sachet 3 fois par jour après dilution dans de l'eau", duration: "3 jours", category: "Gastrologie" },
  { name: "Domperidone (Motilium)", dosage: "10mg", instructions: "1 comprimé 15 min avant les repas", duration: "5 jours", category: "Gastrologie" },

  // Cardio-vasculaire & Diabète
  { name: "Amlodipine (Amlor)", dosage: "5mg", instructions: "1 comprimé le matin", duration: "30 jours", category: "Cardiologie" },
  { name: "Perindopril (Coveram / Coversyl)", dosage: "5mg", instructions: "1 comprimé le matin", duration: "30 jours", category: "Cardiologie" },
  { name: "Bisoprolol (Cardensiel)", dosage: "5mg", instructions: "1 comprimé le matin", duration: "30 jours", category: "Cardiologie" },
  { name: "Atorvastatine (Tahor)", dosage: "20mg", instructions: "1 comprimé le soir", duration: "30 jours", category: "Cardiologie" },
  { name: "Kardegic (Acide Acétylsalicylique)", dosage: "75mg", instructions: "1 sachet par jour au cours d'un repas", duration: "30 jours", category: "Cardiologie" },
  { name: "Metformine (Glucophage)", dosage: "850mg", instructions: "1 comprimé 2 à 3 fois par jour pendant les repas", duration: "30 jours", category: "Diabétologie" },

  // Voies respiratoires & ORL
  { name: "Prednisolone (Solupred)", dosage: "20mg", instructions: "1 à 2 comprimés le matin pendant le petit-déjeuner", duration: "5 jours", category: "Corticoïde" },
  { name: "Salbutamol (Ventoline)", dosage: "100µg", instructions: "1 à 2 inhalations en cas de crise d'asthme", duration: "Au besoin", category: "Pneumologie" },
  { name: "Cetirizine (Zyrtec)", dosage: "10mg", instructions: "1 comprimé le soir au coucher", duration: "10 jours", category: "Antihistaminique" },
  { name: "Loratadine (Clarityne)", dosage: "10mg", instructions: "1 comprimé par jour le matin", duration: "10 jours", category: "Antihistaminique" },
  { name: "Maxilase (Alpha-amylase)", dosage: "Sirop / Cpr", instructions: "1 cuillère à soupe ou 1 cpr 3 fois par jour", duration: "5 jours", category: "ORL" },
  { name: "Physiomer / Stérimar", dosage: "Spray nasal", instructions: "2 pulvérisations dans chaque narine 3 fois par jour", duration: "7 jours", category: "ORL" },
];
