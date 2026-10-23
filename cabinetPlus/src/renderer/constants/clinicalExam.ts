export interface ClinicalExamItem {
  label: string;
  /** Coché automatiquement par le raccourci « Examen normal » (L7.5). */
  normal?: boolean;
}

export interface ClinicalExamCatalogEntry {
  key: string;
  label: string;
  items: ClinicalExamItem[];
}

/**
 * Catalogue des sous-sections d'examen clinique proposées via
 * « + Ajouter un examen » — cf. PLAN_CONSULTATION.md L7.3. Les 7 premières
 * sont demandées explicitement par todo_consultation ; les suivantes sont
 * des ajouts pertinents pour une médecine générale courante.
 *
 * Chaque item `normal: true` est coché par le raccourci « Examen normal » de
 * sa sous-section — les items non marqués sont des constatations anormales,
 * jamais pré-cochées.
 */
export const CLINICAL_EXAM_CATALOG: ClinicalExamCatalogEntry[] = [
  {
    key: 'general',
    label: 'Général',
    items: [
      { label: 'État général conservé', normal: true },
      { label: 'Pas de signe de détresse', normal: true },
      { label: 'Coloration cutanéo-muqueuse normale', normal: true },
      { label: 'Pâleur' },
      { label: 'Ictère' },
      { label: 'Cyanose' },
      { label: 'Déshydratation' },
    ],
  },
  {
    key: 'cardiovascular',
    label: 'Cardiovasculaire',
    items: [
      { label: 'Bruits du cœur réguliers', normal: true },
      { label: 'Pas de souffle audible', normal: true },
      { label: 'Pouls périphériques perçus', normal: true },
      { label: 'Souffle cardiaque' },
      { label: 'Œdèmes des membres inférieurs' },
      { label: 'Tachycardie' },
      { label: 'Bradycardie' },
    ],
  },
  {
    key: 'respiratory',
    label: 'Respiratoire',
    items: [
      { label: 'Murmure vésiculaire normal', normal: true },
      { label: 'Auscultation symétrique', normal: true },
      { label: 'Pas de bruit surajouté', normal: true },
      { label: 'Râles crépitants' },
      { label: 'Râles sibilants' },
      { label: 'Tirage / signes de lutte' },
      { label: 'Matité à la percussion' },
    ],
  },
  {
    key: 'abdominal',
    label: 'Abdominal',
    items: [
      { label: 'Souple, indolore', normal: true },
      { label: 'Pas de défense', normal: true },
      { label: 'Bruits hydro-aériques présents', normal: true },
      { label: 'Défense abdominale' },
      { label: 'Douleur à la palpation' },
      { label: 'Masse palpable' },
      { label: 'Hépatomégalie' },
      { label: 'Splénomégalie' },
    ],
  },
  {
    key: 'neurological',
    label: 'Neurologique',
    items: [
      { label: 'Conscient, orienté', normal: true },
      { label: 'Pas de déficit moteur', normal: true },
      { label: 'Réflexes ostéotendineux normaux', normal: true },
      { label: 'Déficit sensitif' },
      { label: 'Déficit moteur' },
      { label: 'Signes méningés' },
      { label: 'Trouble de l\'équilibre' },
    ],
  },
  {
    key: 'ent',
    label: 'ORL',
    items: [
      { label: 'Tympans normaux', normal: true },
      { label: 'Gorge normale', normal: true },
      { label: 'Pas d\'adénopathie cervicale', normal: true },
      { label: 'Tympan inflammatoire' },
      { label: 'Amygdales hypertrophiées / inflammatoires' },
      { label: 'Adénopathie cervicale' },
    ],
  },
  {
    key: 'dermatological',
    label: 'Dermatologique',
    items: [
      { label: 'Peau saine', normal: true },
      { label: 'Pas de lésion suspecte', normal: true },
      { label: 'Éruption cutanée' },
      { label: 'Lésion suspecte' },
      { label: 'Plaie / lésion traumatique' },
    ],
  },
  {
    key: 'ophthalmological',
    label: 'Ophtalmologique',
    items: [
      { label: 'Pupilles symétriques et réactives', normal: true },
      { label: 'Conjonctives normales', normal: true },
      { label: 'Conjonctivite' },
      { label: 'Rougeur oculaire' },
      { label: 'Trouble de la vision rapporté' },
    ],
  },
  {
    key: 'musculoskeletal',
    label: 'Ostéo-articulaire',
    items: [
      { label: 'Mobilité articulaire normale', normal: true },
      { label: 'Pas de déformation', normal: true },
      { label: 'Douleur articulaire' },
      { label: 'Limitation de mobilité' },
      { label: 'Déformation' },
      { label: 'Épanchement articulaire' },
    ],
  },
  {
    key: 'urogenital',
    label: 'Uro-génital',
    items: [
      { label: 'Pas de douleur lombaire', normal: true },
      { label: 'Loges rénales indolores', normal: true },
      { label: 'Douleur lombaire' },
      { label: 'Sensibilité à la palpation des loges rénales' },
    ],
  },
  {
    key: 'gynecological',
    label: 'Gynécologique',
    items: [
      { label: 'Examen sans particularité', normal: true },
      { label: 'Douleur pelvienne' },
      { label: 'Saignement anormal' },
      { label: 'Masse palpable' },
    ],
  },
  {
    key: 'endocrine',
    label: 'Endocrinien / Thyroïdien',
    items: [
      { label: 'Thyroïde non palpable, pas de goitre', normal: true },
      { label: 'Pas de signe de dysthyroïdie', normal: true },
      { label: 'Goitre' },
      { label: 'Nodule thyroïdien palpable' },
      { label: 'Exophtalmie' },
    ],
  },
  {
    key: 'lymph_nodes',
    label: 'Aires ganglionnaires',
    items: [
      { label: 'Pas d\'adénopathie palpable', normal: true },
      { label: 'Adénopathie cervicale' },
      { label: 'Adénopathie axillaire' },
      { label: 'Adénopathie inguinale' },
    ],
  },
  {
    key: 'psychiatric',
    label: 'Psychiatrique / Thymique',
    items: [
      { label: 'Contact normal, thymie stable', normal: true },
      { label: 'Pas d\'idée suicidaire exprimée', normal: true },
      { label: 'Anxiété marquée' },
      { label: 'Tristesse de l\'humeur' },
      { label: 'Idées suicidaires exprimées' },
      { label: 'Troubles du comportement' },
    ],
  },
  {
    key: 'pediatric_development',
    label: 'Pédiatrique (développement)',
    items: [
      { label: 'Développement psychomoteur conforme à l\'âge', normal: true },
      { label: 'Croissance staturo-pondérale normale', normal: true },
      { label: 'Retard de développement suspecté' },
      { label: 'Cassure de la courbe de croissance' },
    ],
  },
];
