# MugiDoc — Refonte de la page Consultation

> Plan d'implémentation issu de `todo_consultation`.
> Créé le **26/08/2026**. Ce fichier est la source de vérité de l'avancement :
> chaque case est cochée **uniquement** après vérification dans l'application réelle.

## Légende

| Symbole | Sens |
|---|---|
| `[ ]` | En attente |
| `[~]` | En cours |
| `[x]` | Fait et vérifié |
| 🔒 | Bloqué — décision ou donnée manquante |

## Tableau de bord de l'avancement

| Lot | Titre | Tâches | Faites | État |
|---|---|---|---|---|
| L0 | Fondations base de données | 8 | 7 | ✅ Vérifié — 59/59 tests (L0.8 différé) |
| L1 | Corrections rapides (patient anonyme, statut, heure) | 6 | 6 | ✅ Vérifié — 70/70 tests, build OK |
| L2 | Fiche patient : groupe sanguin & maladies chroniques | 5 | 5 | ✅ Vérifié — 73/73 tests, build OK |
| L3 | En-tête patient dans la consultation | 6 | 6 | ✅ Vérifié dans l'app réelle — 1 bug trouvé et corrigé |
| L4 | Motifs de consultation prédéfinis | 4 | 4 | ✅ Vérifié dans l'app réelle — 87/87 tests, build OK |
| L5 | Paramètres vitaux (constantes) | 6 | 6 | ✅ Vérifié dans l'app réelle — 105/105 tests, build OK |
| L6 | Anamnèse / interrogatoire structuré | 4 | 4 | ✅ Vérifié dans l'app réelle — 105/105 tests, build OK |
| L7 | Examen clinique modulaire | 6 | 6 | ✅ Vérifié dans l'app réelle — 117/117 tests, build OK |
| L8 | Diagnostic + CIM-10 | 6 | 6 | ✅ Vérifié dans l'app réelle — 119/119 tests, build OK |
| L9 | Traitement / prescription structurée | 8 | 8 | ✅ Vérifié dans l'app réelle — 149/149 tests, build OK |
| L10 | Examens complémentaires | 4 | 4 | ✅ Vérifié dans l'app réelle — 149/149 tests, build OK |
| L11 | Documents de consultation | 5 | 5 | ✅ Vérifié dans l'app réelle — 149/149 tests, build OK |
| L12 | Plan / conduite à tenir + prochain RDV | 5 | 5 | ✅ Vérifié dans l'app réelle — 159/159 tests, build OK |
| L13 | Panneau latéral : résumé + historique | 7 | 7 | ✅ Vérifié dans l'app réelle — 167/167 tests, build OK |
| L14 | Barre d'actions fixe | 5 | 5 | ✅ Vérifié dans l'app réelle — 167/167 tests, build OK, 1 bug corrigé en live |
| L15 | « Terminer la consultation » (orchestration) | 7 | 7 | ✅ Vérifié dans l'app réelle — 167/167 tests, build OK, 1 bug corrigé en live |
| L16 | Mise en page anti-surcharge | 5 | 5 | ✅ Vérifié dans l'app réelle — 167/167 tests, build OK |
| L17 | Tests, build et vérification réelle | 6 | 6 | ✅ Vérifié dans l'app réelle (copie de base) — 174/174 tests, build OK |
| **Total** | | **103** | **103** | **100 %** |

> ✅ **L0 à L17 : PLAN COMPLET (103/103), vérifié le 30/08/2026, y compris**
> **dans l'application réelle** (Electron piloté via Playwright — voir note
> ci-dessous). `npm test` → 174/174 tests verts (+7 en L17.1/L17.4 : deux
> tests de non-régression sur une consultation antérieure à la migration des
> blocs structurés, un côté service et un côté résolution renderer — voir
> section L17), `npm run build` réussi, `tsc --noEmit` et `eslint` sans
> nouvelle erreur.
>
> **Environnement L14** : base réelle utilisée par l'utilisateur entre les
> sessions (16 patients actifs, 108 rendez-vous, 6 consultations pré-existantes
> pour d'autres patients — non touchées). Patient de test réutilisé : « Mohamed
> Gaouar » (déjà utilisé en L13). L'application tournait déjà (lancée
> manuellement par l'utilisateur) en tout début de session ; sur sa demande,
> elle a été fermée par mes soins (processus `electron.exe` de ce projet
> identifiés et arrêtés après vérification de leur ligne de commande) pour
> libérer le module natif `better-sqlite3` avant `npm test`.
>
> **Deux bugs réels trouvés et corrigés pendant la vérification live de L14**
> (aucun des deux n'était visible à la seule lecture du code) :
> 1. Le paiement en attente auto-créé par `ConsultationService.createConsultation`
>    n'enregistrait jamais `consultation_id` (champ pourtant prévu dans
>    `CreatePaymentRequest`), rendant impossible tout lien fiable
>    paiement ↔ consultation. Corrigé (une ligne) ; nécessaire pour que
>    l'action « Facturer » retrouve le bon paiement sans risquer d'en
>    encaisser un autre par erreur. Confirmé en live : la consultation de test
>    a bien produit un paiement `consultation_id` renseigné, retrouvé et soldé
>    via « Facturer » sans doublon.
> 2. La sauvegarde automatique périodique (L14.5) ne se déclenchait **jamais** :
>    `handleSaveDraft` change d'identité à chaque frappe (il dépend de
>    `onSubmit`, recréé à chaque rendu de `ConsultationsSection` puisque
>    `formData` y vit), ce qui relançait la minuterie `setInterval` en boucle
>    avant qu'elle n'atteigne les 2 minutes. Découvert en observant qu'aucune
>    sauvegarde n'avait eu lieu après 150 s d'attente réelle. Corrigé en
>    passant par une ref (`handleSaveDraftRef`) : l'effet ne dépend plus que de
>    l'identité du patient sélectionné, jamais du contenu du formulaire.
>    Reconfirmé en live sur un second essai de 150 s (avec frappe simulée en
>    cours de route) : la sauvegarde s'est bien déclenchée sans intervention
>    manuelle.
>
> Incident de pilotage sans rapport avec le code de l'application : après le
> correctif ci-dessus, un rechargement de fenêtre suivi d'un nouvel appel de
> lancement Playwright a fait démarrer plusieurs instances Electron
> concurrentes avant que l'échec du premier lancement ne soit détecté. Toutes
> identifiées (`app-path` de ce projet) puis arrêtées ; l'intégrité de la base
> a été revérifiée ensuite (compteurs patients/paiements inchangés) — aucune
> donnée perdue ou corrompue. Cause distincte, déjà documentée en L13 : les
> DevTools Chromium auto-ouverts en développement entrent en concurrence avec
> la session CDP de Playwright. Même contournement temporaire
> (`MUGIDOC_DISABLE_DEVTOOLS`, actif seulement pendant le pilotage), `main.ts`
> restauré à l'identique et reconstruit avant la fin de la session.
>
> **Environnement L15** : suite directe de L14 dans la même session
> utilisateur (mêmes 16 patients actifs, 6 consultations pré-existantes),
> patient de test toujours « Mohamed Gaouar ».
>
> **Un bug réel trouvé et corrigé pendant la vérification live de L15** (invisible
> à la seule lecture du code, symétrique à celui de L14) : une fois une
> consultation clôturée et l'écran récapitulatif (L15.7) affiché, la
> consultation restait « ouverte » en mémoire (`stayOpen`) le temps que le
> médecin consulte le récapitulatif — mais `formData.status` local n'était
> jamais remonté à `completed` après la finalisation, et la sauvegarde
> automatique (L14.5, toujours active) ou un `Ctrl+S` fortuit pendant ce délai
> réenregistrait la consultation avec l'ancien statut `scheduled`, effaçant
> silencieusement `completed_at`. Découvert en observant qu'après un aller
> « Facturer maintenant » puis « Retour à la liste », la consultation
> réapparaissait « Programmée » au lieu de « Terminée » dans la liste — confirmé
> en base (`status` et `completed_at` bien réinitialisés). Corrigé en excluant
> `completionDialogOpen` de `canSave` : plus aucun enregistrement (brouillon
> manuel, `Ctrl+S` ou automatique) n'est possible tant que l'écran récapitulatif
> est affiché. Reconfirmé sur un nouvel essai de 150 s, écran récapitulatif
> ouvert : `status`/`completed_at` inchangés tout du long.
>
> Effet de bord découvert en marge (comportement pré-existant, pas un bug) :
> la cascade L15.4 (`useConsultationClosure`) sait retrouver, à défaut de
> rendez-vous explicitement lié, le rendez-vous du jour encore ouvert du même
> patient et le marque « terminé » — ce qui a fait basculer deux fois le
> rendez-vous réel du jour de « Mohamed Gaouar » pendant les essais successifs.
> Remis à `en_attente` après chaque test via l'API, comme tout autre effet de
> bord de données de test.
>
> **Décision L16.2** : `ConsultationSection` (accordéon partagé, déjà en place
> depuis L6) prenait déjà `defaultOpen={!isEmpty}` pour Anamnèse/Examen
> clinique/Traitement/Examens complémentaires/Plan — décision documentée dès
> L6 (« démarre repliée sauf si elle contient déjà des données, édition d'une
> consultation existante ») plutôt qu'un repli inconditionnel. Conservée telle
> quelle et étendue aux deux sections qui n'utilisaient pas encore l'accordéon
> (Constantes, Diagnostic) pour rester cohérent, au lieu de réinterpréter
> « repliées par défaut sauf Motif » comme un repli forcé même quand la
> section contient déjà des données : sur une **nouvelle** consultation (le
> cas visé par L16, « NE PAS SURCHARGER L'ÉCRAN »), tout reste replié sauf
> Motif de toute façon — la nuance ne joue qu'à l'édition d'une consultation
> déjà riche, où afficher d'emblée ce qui est rempli reste plus utile
> qu'un clic supplémentaire partout. Vérifié en live dans les deux cas de
> figure (voir section L16).
>
> Le binaire natif `better-sqlite3` est actuellement compilé pour **Electron**
> (pas Node) — l'application peut être rouverte directement, sans
> `electron:rebuild`. (Il faudra le recompiler pour Node avant le prochain
> `npm test`.) Les 4 consultations de test créées en L14-L16 (L14 : 2, L15 : 1,
> L16 : 1) ainsi que leurs paiements, la prescription et le document générés
> en L15 ont tous été supprimés via l'API de l'application elle-même — base
> revenue à 6 consultations avant le début de L17.
>
> **Environnement L17 — seul lot vérifié sur une COPIE de la base, jamais sur
> les données réelles** (L17.6 l'exige explicitement). Base réelle copiée
> (`cabinetplus.db`, ~1,58 Mo) vers un fichier temporaire de session ;
> l'application lancée avec une variable d'environnement temporaire
> (`MUGIDOC_DB_PATH_OVERRIDE`, ajoutée pour l'occasion dans `main.ts` à côté
> du garde-fou `MUGIDOC_DISABLE_DEVTOOLS` déjà utilisé depuis L13, puis
> retirée avant la fin de la session comme lui) pointant `DatabaseService`
> vers cette copie — mécanisme déjà prévu par son constructeur
> (`dbPathOverride`), simplement jamais câblé depuis `main.ts` jusqu'ici.
> Vérifié avant tout test que l'écriture allait bien vers la copie et jamais
> vers l'original : après une consultation de test, seule la copie portait des
> fichiers `-wal`/`-shm` fraîchement modifiés, `cabinetplus.db` gardait un
> horodatage identique à celui d'avant la session sur toute sa durée.
> Nettoyage final : copie et ses fichiers `-wal`/`-shm` supprimés en fin de
> session ; aucune trace laissée, aucun besoin de nettoyage applicatif
> puisque rien n'a jamais touché la base réelle.
>
> **Travail réel de L17** (L17.1/L17.2/L17.3 étaient déjà couverts par les
> tests écrits au fil des lots précédents — L0, L5, L9 — voir section L17) :
> deux nouveaux tests de non-régression (L17.4) sur une consultation
> antérieure à l'introduction des blocs structurés, plus une vérification
> live complète du parcours entier de la refonte (L17.6) — création,
> remplissage des 8 sections dans l'ordre imposé, génération de document,
> brouillon, clôture, facturation, rattachement au dossier patient — sur la
> copie, en une seule consultation de bout en bout, puis un second passage
> ciblé sur une consultation « pré-migration » simulée (lecture, édition,
> impression). `vitest.config.ts` ne reprenait pas l'alias `@` de
> `vite.config.ts` : ajouté (une ligne) pour permettre à un fichier de test de
> `.tsx` (celui de `consultationMappers.tsx`, mélange fonctions pures et
> `getStatusBadge` en JSX) de résoudre `@/lib/utils` comme le fait déjà
> l'application — aucun effet sur le comportement de l'application elle-même.
>
> Zéro nouveau bug trouvé en L17 (le reste du plan avait déjà été
> intensivement vérifié lot par lot) ; une redite du repli occasionnel déjà
> documenté en L14 sur le tout premier clic d'« Ordonnance » depuis la barre
> d'actions (le document le plus lourd des quatre, chargement de patients/
> modèles/paramètres à l'ouverture) — s'est ouvert normalement après une
> attente un peu plus longue, cohérent avec un effet de latence de rendu et
> non une régression logique (le bouton de la section elle-même, identique
> par ailleurs, s'est toujours ouvert instantanément).

---

## Décisions d'architecture (à valider avant L0)

1. **Stockage des données structurées → colonnes JSON sur `consultations`.**
   Une consultation porte désormais ~8 blocs structurés (constantes, anamnèse,
   examen clinique, diagnostics, traitement, examens, plan). Normaliser chacun
   en table demanderait 7 tables + 7 services + 7 jeux d'IPC pour des données
   qui ne sont jamais requêtées indépendamment de leur consultation.
   → Colonnes `TEXT` contenant du JSON, plus quelques colonnes de premier ordre
   pour ce qui doit rester filtrable/triable (`completed_at`,
   `next_appointment_date`).
   *Alternative écartée : tables normalisées — à reconsidérer uniquement si des
   statistiques par diagnostic CIM-10 deviennent nécessaires.*

2. **Rétro-compatibilité obligatoire.** `ConsultationList`, la recherche
   (`ConsultationService.getAllConsultations`), `ConsultationPrintPreviewDialog`
   et `StatisticsSection` lisent `motif`, `diagnostic`, `traitement`, `notes`.
   À chaque enregistrement, ces quatre champs sont **recomposés** à partir des
   blocs structurés (diagnostic principal + secondaires ; lignes de traitement
   formatées). Aucun écran existant ne casse, aucune migration destructive.

3. **Brouillon vs terminée.** `status` reste la colonne existante
   (`scheduled` | `in-progress` | `completed`). Un brouillon = `in-progress`.
   « Terminer la consultation » écrit `completed` + `completed_at` et déclenche
   la cascade (`useConsultationClosure`). Le médecin ne touche plus jamais au
   statut à la main.

4. ✅ **Répertoire national des médicaments — résolu le 26/08/2026.** Converti
   depuis `clean_NOMENCLATURE.VERSION.JUIN_.2026-.xlsx` (nomenclature officielle,
   feuille « Nomenclature Juin 2026 », 5381 présentations actives — les feuilles
   « Non Renouvelés » et « Retraits » sont exclues, ce sont des produits retirés
   du marché). **5375 entrées uniques** après dédoublonnage sur le numéro
   d'enregistrement, remplaçant les 639 entrées manuelles précédentes dans
   `medications_data.json`. La popularité (tri de recherche) est reportée
   depuis l'ancienne liste par correspondance de DCI (1872 entrées héritent
   d'un rang) pour que les molécules courantes remontent toujours en premier.
   `MedicationService.ts` distingue désormais les lignes issues du répertoire
   officiel (`source = 'seed'`) de celles ajoutées à la main par le médecin
   (`source = 'user'`) : une mise à jour future de la nomenclature remplace les
   premières sans jamais toucher aux secondes.

5. ✅ **CIM-10 — résolu le 26/08/2026 (confirmé par l'utilisateur).**
   `icd10_data.json` créé : **605 codes**, sous-ensemble curé de médecine
   générale avec libellés en français, réparti sur 19 chapitres (infectieux,
   cardio-vasculaire, respiratoire, digestif, ostéo-articulaire, symptômes
   R00-R99, facteurs Z00-Z99...). Recherche par code ou libellé via
   `Icd10Service.ts`. **Ce n'est pas un export réglementaire exhaustif** — une
   aide à la recherche pour la consultation, le diagnostic en texte libre
   restant toujours la donnée de référence (cf. L8.5 : le code ne bloque jamais
   la saisie).

---

## L0 — Fondations base de données

- [x] **L0.1** `DatabaseService.ts` — migration `addClinicalFieldsToConsultations` :
      ajouté à `consultations` les colonnes `motif_tags`, `vitals`, `anamnese`,
      `clinical_exam`, `diagnostics`, `treatment_lines`, `exam_requests`,
      `care_plan` (TEXT), `next_appointment_date` (DATE), `next_appointment_time`
      (TEXT), `next_appointment_id` (INTEGER), `completed_at` (DATETIME).
      Pattern existant : `PRAGMA table_info` + `ALTER TABLE` idempotent. Testé
      (base neuve + régression sur une base pré-migration).
- [x] **L0.2** `DatabaseService.ts` — migration `addClinicalFieldsToPatients` :
      `blood_group TEXT`, `chronic_diseases TEXT` sur `patients`. Testé.
- [x] **L0.3** `ConsultationMotifService.ts` (nouveau) — table `consultation_motifs`
      (`id`, `label`, `category`, `usage_count`, `is_custom`) + seed de 36 motifs
      récurrents de médecine générale (fièvre, toux, douleur abdominale,
      céphalées, suivi diabète, certificat médical...), classés par catégorie.
      `create()` idempotent (un motif déjà connu n'est pas dupliqué),
      `incrementUsage()` fait remonter les motifs les plus utilisés. Testé.
- [x] **L0.4** `Icd10Service.ts` (nouveau) — table `icd10_codes` (`code` PK,
      `label`, `chapter`, `chapter_label`) + seed de 605 codes depuis
      `icd10_data.json` (upsert par code, sûr à rejouer à chaque démarrage).
      Recherche par code ou libellé, résultats classés par pertinence. Testé.
- [x] **L0.5** `shared/types.ts` — types `ConsultationVitals`, `ConsultationAnamnese`,
      `ClinicalExamSection`, `ConsultationDiagnosisEntry`, `ConsultationDiagnostics`,
      `TreatmentLine`, `ExamRequestEntry`, `ConsultationCarePlan`,
      `ConsultationMotif`, `Icd10Code`, `MedicationRecord`, `BloodGroup` ;
      extension de `Consultation`, `CreateConsultationRequest`,
      `UpdateConsultationRequest`, `Patient`, `Create/UpdatePatientRequest`.
      Au passage : `medications` (déjà utilisé côté renderer via des `any`
      non typés) a désormais lui aussi un type propre sur `ElectronAPI`.
- [x] **L0.6** `ConsultationService.ts` — sérialisation/désérialisation JSON des
      nouveaux blocs (parse tolérant : une valeur illisible ne fait plus
      échouer le chargement de la consultation, testé par régression) +
      recomposition des champs hérités `diagnostic` / `traitement` (décision
      n°2), aux deux points d'écriture (création et modification). Au passage :
      les deux mappages ligne→`Consultation` dupliqués dans
      `getAllConsultations`/`getConsultationById` sont fusionnés dans
      `mapRowToConsultation()`. Testé (6 scénarios, dont un aller-retour
      complet et la tolérance au JSON corrompu).
- [x] **L0.7** `main.ts` + `preload.ts` + `shared/types.ts` (ElectronAPI) —
      canaux IPC `consultationMotifs:getAll/create/incrementUsage` et
      `icd10:search`.
- [ ] **L0.8** `NetworkService.ts` — **différé.** Le mode réseau (poste
      secondaire) n'expose déjà aujourd'hui qu'un sous-ensemble partiel de
      l'API (ni `medications`, ni `users`, ni `expenses`...) : ce n'est pas
      une régression que j'introduis, mais un manque préexistant. Signalé
      pour arbitrage plutôt que traité en silence — priorité à discuter.

**Statut : ✅ Terminé et vérifié (26/08/2026).** Base de données et couche
service prêtes. `npm test` → 59/59 tests verts, `tsc --noEmit` et `eslint`
sans nouvelle erreur. Seul L0.8 reste délibérément différé (voir ci-dessus).

---

## L1 — Corrections rapides

- [x] **L1.1** `patient-combobox.tsx` — nouvelle prop `allowAnonymous?: boolean`
      (défaut `false`) ; l'entrée « Patient anonyme » ne s'affiche dans la
      liste que si elle vaut `true`. Au passage, l'ancien déclenchement par
      texte du placeholder (`placeholder.includes("anonyme")`) était mort —
      aucun appelant ne le déclenchait jamais, l'option apparaissait donc
      **partout** (rendez-vous, ordonnance, certificat...) alors que seule
      `payments.patient_id` est nullable en base.
- [x] **L1.2** `PaymentForm.tsx` — passe `allowAnonymous` pour conserver le
      paiement anonyme (seul usage légitime, `QuickPaymentModal` ne passe pas
      par ce composant).
- [x] **L1.3** Consultation — patient **obligatoire** : déjà garanti par
      `disabled={... || !selectedPatient ...}` sur le bouton d'enregistrement
      (vérifié) ; corrigé par L1.1, l'option « Patient anonyme » n'apparaît
      plus du tout dans la consultation.
- [x] **L1.4** `Select` « Statut » retiré du formulaire de consultation (et
      son import devenu inutile). Le bouton « Clôturer la consultation »
      existant reste l'unique façon de passer en `completed` — plus de choix
      manuel entre 4 statuts dont deux (`cancelled`, `no_show`) ne
      correspondent même pas à la contrainte SQL de la table. *(La
      distinction brouillon/`in-progress` complète reste le travail de L15,
      quand la barre d'actions « Terminer la consultation » existera.)*
- [x] **L1.5** Heure : le préremplissage à l'heure courante à l'ouverture
      existait déjà (`ConsultationsSection.tsx`) ; le nouveau sélecteur (L1.6)
      ajoute un raccourci « Maintenant » toujours en tête de liste, pour la
      création **et** la modification.
- [x] **L1.6** Nouveau composant `ui/time-picker.tsx` + logique pure extraite
      dans `utils/timeSlots.ts` (testée, 11 tests) : liste déroulante par pas
      de 5 min groupée Matin / Après-midi / Soir, saisie libre toujours
      possible (`14:30` ou `1430`), valeur courante toujours présente dans la
      liste même hors pas (ex. `14:37`).

**Vérifié :** `npm test` → 70/70, `tsc --noEmit` et `eslint` sans nouvelle
erreur, `npm run build` (renderer + main + preload) réussi.

---

## L2 — Fiche patient : groupe sanguin & maladies chroniques

- [x] **L2.1** `validation.ts` — `PatientFormData` : `blood_group`,
      `chronic_diseases` + schéma zod (`BLOOD_GROUPS` : A+/A−/B+/B−/AB+/AB−/O+/O−,
      « Inconnu » = non renseigné plutôt qu'une 9ᵉ valeur d'énumération).
- [x] **L2.2** `PatientForm.tsx` — sélecteur « Groupe sanguin » ajouté à la
      grille Poids/Taille (devenue 3 colonnes) et champ « Maladies
      chroniques » à côté de « Maladies actuelles ». *(Texte libre seul —
      les puces de pathologies fréquentes n'ont pas été ajoutées, cf. note
      ci-dessous.)*
- [x] **L2.3** `patientMappers.ts` — propagation dans `PatientUI`,
      `convertUIToCreateRequest`, `convertUIToUpdateRequest`, et dans les 4
      points de `PatientsSection.tsx` qui construisent le `formData` (état
      initial, reset après envoi, édition depuis la liste, édition depuis la
      fiche détail). **Bug préexistant corrigé au passage** : `convertUIToPatient`
      ne transmettait ni `weight`, `height`, `diseases` ni `medical_history` —
      `PatientHealthAlert` sur `PatientDetail.tsx` ne s'affichait donc
      **jamais**, même pour un patient avec des antécédents renseignés. En le
      corrigeant pour brancher `chronic_diseases`, l'occasion s'imposait de
      réparer les champs déjà censés y transiter.
- [x] **L2.4** `PatientService.ts` — persistance des deux colonnes
      (create / update / select — fait en avance avec L0.2). Testé
      (`PatientService.test.ts`, 3 tests : création, absence optionnelle,
      mise à jour partielle indépendante des autres champs).
- [x] **L2.5** `PatientDetail.tsx` — badge groupe sanguin dans l'en-tête à
      côté du nom, ligne « Maladies chroniques » dans la carte Dossier
      Médical. `PatientHealthAlert.tsx` — les maladies chroniques rejoignent
      les maladies actuelles et antécédents dans la bannière d'alerte (et
      dans la détection de mots-clés critiques : allergie, grossesse...).

**Note :** L2.2 livre le champ « Maladies chroniques » en texte libre. Les
« puces de pathologies fréquentes » prévues au plan initial n'existent nulle
part ailleurs dans l'app comme référentiel réutilisable (contrairement aux
motifs de consultation, L0.3) — les ajouter aurait supposé inventer une
liste de pathologies sans validation médicale. Passer en texte libre seul
pour l'instant ; à enrichir si une liste de référence est fournie.

**Vérifié :** `npm test` → 73/73, `npm run build` réussi, `tsc --noEmit` et
`eslint` sans nouvelle erreur. Confirmé aussi dans l'application réelle
(26/08/2026) : sélecteur « Groupe sanguin » et champ « Maladies chroniques »
visibles et fonctionnels dans le formulaire patient ; badge groupe sanguin et
ligne maladies chroniques affichés dans le dossier patient.

---

## L3 — En-tête patient dans la consultation

- [x] **L3.1** Nouveau `consultations/ConsultationPatientHeader.tsx` :
      nom, prénom, sexe, âge, poids, groupe sanguin, alertes (réutilise
      `PatientHealthAlert` + `PatientDebtAlert`, jusqu'ici affichés bruts
      dans `ConsultationForm.tsx` — désormais intégrés dans l'en-tête).
- [x] **L3.2** Poids modifiable en ligne (clic → champ + boutons valider/annuler,
      raccourcis clavier Entrée/Échap, retour visuel via toast). Persisté par
      `patients.update`, propagé au patient sélectionné du formulaire parent
      via `onPatientUpdated` (réutilise directement `onPatientSelect`, déjà
      remonté jusqu'à `ConsultationsSection.tsx` — aucun nouveau prop-drilling
      nécessaire). *(L'alimentation automatique des constantes vitales, L5,
      se fera quand cette section existera.)*
- [x] **L3.3** Bloc « Dernière consultation » : date, motif, diagnostic, via
      `consultations.getByPatient`, triée par date + heure décroissantes.
- [x] **L3.4** Bouton « Dossier du patient » — **choix d'architecture révisé** :
      au lieu d'une navigation de section (`Dashboard.tsx`), ouvre
      `PatientRecordDialog.tsx` (nouveau) en fenêtre superposée. Justification :
      `Dashboard.tsx` démonte/remonte le composant de section actif à chaque
      changement (`currentSection`) — y naviguer aurait fait perdre toute la
      saisie de la consultation en cours (L3.6 aurait été impossible à
      respecter sans lever tout l'état du formulaire jusqu'au Dashboard, un
      chantier disproportionné). Une fenêtre superposée ne démonte jamais le
      formulaire en dessous — c'est aussi exactement le pattern déjà utilisé
      par les 6 autres actions de la consultation (certificat, ordonnance,
      examens...), donc cohérent avec l'existant plutôt qu'une nouvelle
      convention.
- [x] **L3.5** État vide : `PatientDetail.tsx` affichait déjà "Aucune
      consultation enregistrée" / "Aucune ordonnance enregistrée" par onglet
      (préexistant) ; ajouté un bandeau « Dossier vide » explicite et unifié
      en tête de contenu quand consultations + ordonnances + informations
      médicales sont TOUTES vides, plutôt que de laisser deviner à partir de
      plusieurs mentions « Aucun(e) » éparpillées. Cas patient introuvable
      également couvert (dossier vide dédié, pas d'écran blanc).
- [x] **L3.6** Résolu par construction (L3.4) : la fenêtre superposée ne
      démonte jamais `ConsultationForm`, donc rien à perdre — pas de mécanisme
      de restauration d'état à écrire.

**Bonus (nécessaire pour L3.4) :** `PatientDetail.tsx` accepte désormais
`readOnly` (masque Modifier/Supprimer/Consultation/RDV, incohérents imbriqués
dans un autre écran) et `emptyBanner`. `onEdit`/`onDelete` sont devenus
optionnels sans casser l'usage existant (page pleine, non impactée).

**Vérifié dans l'application réelle** (Electron piloté via Playwright,
26/08/2026) : en-tête patient (nom/sexe/âge/poids/groupe sanguin), édition du
poids en ligne (persistée, confirmée par rechargement), bloc « Dernière
consultation », ouverture/fermeture du dossier patient en fenêtre superposée
avec conservation intégrale de la saisie en cours dans le formulaire
(motif tapé, toujours présent après fermeture). `npm test` → 73/73,
`npm run build` réussi.

🐛 **Bug trouvé et corrigé pendant ce test** : les boutons ✓/✗ de l'édition du
poids n'avaient pas `type="button"` — à l'intérieur du `<form>` de la
consultation, cliquer « valider » soumettait toute la consultation (statut
« Programmée », motif/diagnostic vides). Corrigé dans
`ConsultationPatientHeader.tsx`, revérifié : la sauvegarde du poids ne
déclenche plus la soumission du formulaire.

---

## L4 — Motifs de consultation prédéfinis

- [x] **L4.1** Résolu en avance par **L0.3** : seed de 36 motifs récurrents
      (fièvre, toux, douleur abdominale, céphalées, suivi diabète, certificat
      médical...) déjà en place et exploité tel quel ici.
- [x] **L4.2** Nouveau composant `consultations/MotifPicker.tsx` : le champ
      texte libre existant est conservé tel quel (aucune régression sur la
      saisie manuelle), complété par une rangée de puces rapides (les motifs
      les plus utilisés, cf. L4.3) et un bouton « étiquette » ouvrant une
      recherche (`Command`/`Popover`, même pattern que `PatientCombobox`)
      groupée par catégorie. Plusieurs motifs se combinent dans le même champ
      via un séparateur `" + "` (ex. « Fièvre + Toux ») : logique pure extraite
      dans `renderer/utils/motifs.ts` (`parseMotifSegments`, `toggleMotifSegment`,
      `removeMotifSegment`, `matchesQuery`), testée unitairement (14 tests).
      Chaque motif combiné s'affiche aussi en puce supprimable individuellement
      au-dessus du champ.
- [x] **L4.3** Nouveau hook `useConsultationMotifs.ts` : la liste est triée par
      `usage_count` décroissant (repli alphabétique à égalité) ; sélectionner
      un motif (puce ou recherche) appelle `incrementUsage` en tâche de fond
      et met à jour le tri **localement de façon optimiste** (pas d'attente
      réseau pour que le motif remonte). La désélection (retrait d'une puce)
      n'incrémente jamais le compteur.
- [x] **L4.4** Dans la recherche, un libellé saisi qui ne correspond à aucun
      motif existant fait apparaître « Enregistrer « {texte} » comme motif
      récurrent » (groupe « Nouveau ») : appelle `consultationMotifs.create`
      (idempotent côté service), l'ajoute immédiatement au champ et confirme
      par un toast. Distinct de la saisie libre directe dans le champ
      principal, qui ne touche jamais la table des motifs — seul un ajout
      explicite via la recherche crée un motif récurrent.

**Vérifié dans l'application réelle** (Electron piloté via Playwright,
26/08/2026) : rangée de puces rapides affichée dès qu'un patient n'est même
pas encore sélectionné ; clic sur deux puces (« Allergie », « Anxiété ») →
champ combiné « Allergie + Anxiété », puces retirables individuellement
(vérifié par retrait d'« Allergie », champ redevenu « Anxiété » seul) ;
recherche « grippe » (absent du seed) → groupe « Nouveau » avec l'option
d'enregistrement, sélectionnée → toast de confirmation, champ devenu
« Anxiété + grippe », et **persistance confirmée côté base** (`consultationMotifs.getAll()`
renvoie l'entrée `{ label: "grippe", is_custom: true, usage_count: 1 }`
immédiatement après). Coche ✓ affichée dans la recherche pour les motifs déjà
sélectionnés (état synchronisé entre puces et liste). Aucune erreur console
(`pageerror`/`error`) pendant tout le scénario. `npm test` → 87/87 (dont les
14 nouveaux tests de `motifs.ts`), `npm run build` réussi, `tsc --noEmit` et
`eslint` sans nouvelle erreur sur les fichiers touchés.

---

## L5 — Paramètres vitaux (constantes)

- [x] **L5.1** Nouveau composant `consultations/VitalSignsSection.tsx` — grille
      de 10 champs tous optionnels : poids, taille, IMC (lecture seule,
      calculé), température, TA systolique/diastolique, fréquence cardiaque,
      SpO₂, fréquence respiratoire, glycémie. Sous-composant `VitalField`
      interne pour éviter la répétition (label + unité affichée en incrustation
      + signalement d'anomalie).
- [x] **L5.2** `calculateBmi()`/`interpretBmi()` dans `renderer/utils/vitals.ts` :
      IMC recalculé à chaque changement de poids/taille, classification OMS
      (Dénutrition / Corpulence normale / Surpoids / Obésité grade I-II-III)
      affichée sous la grille dès que la valeur sort de la normale. **Adulte
      uniquement (≥ 18 ans)** — l'IMC pédiatrique dépend de courbes de
      corpulence par âge/sexe non modélisées ici ; rien n'est affiché pour un
      enfant plutôt qu'une catégorie erronée.
- [x] **L5.3** `evaluateVitals()` dans `renderer/utils/vitals.ts` : seuils
      fièvre/hypothermie, brady/tachycardie, brady/tachypnée, désaturation,
      hyper/hypotension, hypo/hyperglycémie — fréquence cardiaque et
      respiratoire adaptées à l'enfant (< 12 ans) avec des bornes plus larges.
      La tension artérielle n'est **jamais évaluée chez l'enfant** (percentiles
      âge/taille/sexe non modélisés, même raisonnement que L5.2). **Testée
      unitairement** : 18 tests (`vitals.test.ts`), dont un cas croisé
      « 130 bpm est une tachycardie chez l'adulte mais normal chez un enfant
      de 6 ans ».
- [x] **L5.4** Champ en anomalie : bordure rouge + icône ⚠ + libellé sous le
      champ (« Fièvre », « Tachycardie »…), jamais bloquant — aucune validation
      n'empêche la saisie ni l'enregistrement.
- [x] **L5.5** Pré-remplissage poids/taille depuis la fiche patient à la
      sélection (une seule fois, ne réapparaît pas si le médecin efface
      volontairement la valeur ensuite). Si la valeur saisie diffère de la
      fiche patient, un lien « Mettre à jour le dossier patient (poids/taille) »
      apparaît ; il réutilise `usePatients().updatePatient` (même mécanisme que
      L3.2) et disparaît une fois la fiche synchronisée.
- [x] **L5.6** `Tab` natif entre les champs (ordre du DOM, aucun code
      nécessaire) ; unité affichée en incrustation dans chaque champ ; `onWheel`
      fait perdre le focus pour empêcher la molette de modifier accidentellement
      une valeur en faisant défiler la page.

**Vérifié dans l'application réelle** (Electron piloté via Playwright,
26/08/2026) : sélection d'un patient réel (poids 75 kg, taille 170 cm en
fiche) → pré-remplissage immédiat, IMC calculé à 26 (« Surpoids » affiché) ;
saisie température 39°C → bordure rouge + « Fièvre » ; fréquence cardiaque
130 bpm → bordure rouge + « Tachycardie » ; poids modifié à 82 kg → IMC
recalculé à 28,4 en direct, lien de synchronisation apparu, clic → persistance
confirmée côté base (`patients.getById` → poids 82) et badge de l'en-tête
patient mis à jour sans rechargement ; poids remis à 75 via l'éditeur en ligne
existant (L3.2) pour laisser la base telle que trouvée. Aucune erreur console
(`pageerror`/`error`) sur tout le scénario. `npm test` → 105/105 (dont les 18
nouveaux tests de `vitals.ts`), `npm run build` réussi, `tsc --noEmit` et
`eslint` sans nouvelle erreur sur les fichiers touchés.

---

## L6 — Anamnèse / interrogatoire

- [x] **L6.1** Nouveau composant `consultations/AnamnesisSection.tsx` : début
      des symptômes (date), évolution (texte libre + 3 puces rapides
      Amélioration/Stable/Aggravation), symptômes (`SymptomPicker`, cf. L6.3),
      facteurs aggravants/soulageants, traitement déjà pris, antécédents liés
      au problème actuel.
- [x] **L6.2** Champ « Observations / interrogatoire » (`Textarea` libre).
- [x] **L6.3** Nouveau `consultations/SymptomPicker.tsx` : même mécanique que
      `MotifPicker` (puces sélectionnées retirables + recherche groupée par
      catégorie + combinaison via « + » + saisie libre toujours possible dans
      le champ), en réutilisant directement les fonctions pures de
      `utils/motifs.ts` (`toggleMotifSegment`/`removeMotifSegment`/
      `matchesQuery` — déjà testées, aucune duplication de logique). Adossé à
      une liste **statique** `constants/symptoms.ts` (28 symptômes courants,
      8 catégories) plutôt qu'à un catalogue persistant comme les motifs : le
      vocabulaire des symptômes est trop vaste pour un catalogue qui
      grossirait à chaque saisie — pas de compteur d'usage ni de « créer
      comme récurrent » ici, volontairement.
- [x] **L6.4** Nouveau `consultations/ConsultationSection.tsx` : bloc pliable
      générique (titre + résumé quand replié + chevron), réutilisable par les
      sections suivantes (L7+) et par la mise en accordéon uniforme prévue en
      L16.2. Anamnèse démarre **repliée par défaut**, sauf si elle contient
      déjà des données (édition d'une consultation existante) ; une fois
      repliée avec du contenu, le titre affiche un résumé
      (`Anamnèse — Fièvre + Toux sèche — Aggravation`).

**Placement dans le formulaire :** inséré entre Motif et Constantes,
conforme à l'ordre cible de L16.3 (Motif → Anamnèse → Constantes → Examen →
Diagnostic → Traitement → Examens → Plan) plutôt qu'ajouté en fin de
formulaire — évite un réordonnancement à refaire en L16.

**Vérifié dans l'application réelle** (Electron piloté via Playwright,
26/08/2026) : section repliée par défaut à l'ouverture d'une nouvelle
consultation ; dépliée au clic ; puce « Aggravation » → champ Évolution
rempli ; recherche « toux sèche » (accents ignorés) → résultat unique groupé
sous « ORL / Respiratoire » ; combinaison de deux symptômes (Fièvre + Toux
sèche, un via recherche, un via clic direct) → champ et puces mis à jour ;
repli de la section → résumé « Anamnèse — Fièvre + Toux sèche — Aggravation »
affiché à côté du titre. Aucune erreur console (`pageerror`/`error`). `npm
test` → 105/105 (aucun nouveau test de logique pure nécessaire : L6.3
réutilise les fonctions déjà testées de `motifs.ts`), `npm run build` réussi,
`tsc --noEmit` et `eslint` sans nouvelle erreur sur les fichiers touchés.

---

## L7 — Examen clinique modulaire

- [x] **L7.1** Zone de texte libre « Examen clinique — notes libres... »
      toujours visible en tête du bloc `ClinicalExamBlock.tsx` (nouveau) —
      indépendante des sous-sections ajoutées, stockée comme une entrée
      spéciale (`key: 'overview'`) du tableau `clinical_exam`, jamais listée
      dans le catalogue des sous-sections ajoutables (pas de doublon avec
      « Général », qui est une sous-section à part entière, cf. L7.3).
- [x] **L7.2** Bouton « + Ajouter un examen » → `Popover`/`Command` recherchable
      (même pattern que `MotifPicker`) listant uniquement les sous-sections du
      catalogue **non encore ajoutées** ; chaque sous-section ajoutée affiche
      un bouton ✕ qui la retire du tableau.
- [x] **L7.3** Nouveau `constants/clinicalExam.ts` — **15 sous-sections** :
      les 7 demandées (Général, Cardiovasculaire, Respiratoire, Abdominal,
      Neurologique, ORL, Dermatologique) + les 8 ajouts pertinents
      (Ophtalmologique, Ostéo-articulaire, Uro-génital, Gynécologique,
      Endocrinien/Thyroïdien, Aires ganglionnaires, Psychiatrique/Thymique,
      Pédiatrique — développement), 4 à 8 items cliniquement pertinents
      chacune.
- [x] **L7.4** Nouveau `consultations/ExamSubsectionCard.tsx` : grille de cases
      à cocher par sous-section (ex. Cardiovasculaire → bruits du cœur
      réguliers, pas de souffle audible, pouls périphériques perçus, souffle
      cardiaque, œdèmes des membres inférieurs, tachycardie, bradycardie) +
      case « Autre » avec champ de précision affiché uniquement si cochée.
- [x] **L7.5** Bouton « Examen normal » par sous-section → `applyNormalExam()`
      dans `utils/clinicalExam.ts` : **remplace** les items cochés par
      exactement les items marqués `normal: true` du catalogue (non additif —
      un état cohérent, pas un empilement) ; `other_checked`/`other_text` ne
      sont jamais touchés. Un item anormal reste cochable manuellement en plus
      des items normaux (ex. « Souffle cardiaque » après « Examen normal »).
- [x] **L7.6** `summarizeExamSection()` dans `utils/clinicalExam.ts` : items
      cochés + texte « Autre » le cas échéant, joints par virgule (repli sur
      `free_text` si rien n'est coché — cas de la note générale) ; affiché en
      direct sous chaque sous-section active, prêt à être réutilisé par le
      compte rendu (L11) et le résumé latéral (L13) le moment venu. **Testée
      unitairement** (12 tests, `clinicalExam.test.ts`, dont le comportement
      « Autre » non coché ignoré et le repli sur `free_text`).

**Enveloppe :** tout le bloc est enveloppé dans `ConsultationSection` (réutilisé
tel quel depuis L6.4) — replié par défaut, résumé affiché à côté du titre une
fois replié (ex. `Examen clinique — Cardiovasculaire`), inséré entre
Constantes et Diagnostic conformément à l'ordre cible L16.3.

**Vérifié dans l'application réelle** (Electron piloté via Playwright,
26/08/2026) : ajout de la sous-section Cardiovasculaire via la recherche (15
entrées listées, groupées, filtrables) ; clic « Examen normal » → coche
exactement les 3 items normaux (Bruits du cœur réguliers, Pas de souffle
audible, Pouls périphériques perçus), les items anormaux restent décochés ;
coche manuelle de « Souffle cardiaque » (additive, non effacée par le
raccourci) ; case « Autre » cochée → champ de précision apparu, texte saisi
répercuté en direct dans le résumé synthétique ; repli du bloc → titre
« Examen clinique — Cardiovasculaire ». Aucune erreur console
(`pageerror`/`error`). `npm test` → 117/117 (dont les 12 nouveaux tests de
`clinicalExam.ts`), `npm run build` réussi, `tsc --noEmit` et `eslint` sans
nouvelle erreur sur les fichiers touchés (un avertissement `react-hooks/
exhaustive-deps` introduit puis corrigé avant la vérification finale).

---

## L8 — Diagnostic + CIM-10

- [x] **L8.1** Fait en avance par **L0.4** : `icd10_data.json`, 605 codes curés
      de médecine générale, libellés français, 19 chapitres (décision n°5,
      confirmée par l'utilisateur).
- [x] **L8.2** `Icd10Service.ts` + IPC `icd10:search` (faits en L0.4), **complétés
      ici par l'insensibilité aux accents, qui manquait réellement.** SQLite ne
      sait ni replier les accents ni normaliser l'Unicode : `label LIKE
      '%cephalee%'` ne remontait donc **jamais** « Céphalée ». Ajout d'une
      colonne `search_label` (libellé en minuscules sans accents, calculé côté
      JS avec `\p{Diacritic}` — même normalisation que `patient-combobox` et
      `motifs.ts`), migration idempotente via `PRAGMA table_info`, remplie à
      chaque seed (upsert), et recherche portée sur cette colonne. La recherche
      par code reste sur `code` (mise en majuscules). **Test de non-régression
      ajouté** : « cephalee » et « céphalée » doivent renvoyer exactement les
      mêmes codes.
- [x] **L8.3** Nouveau `consultations/DiagnosisSection.tsx` — diagnostic
      principal en texte libre + `Icd10Picker` (nouveau) : la recherche
      s'ouvre **pré-remplie avec le libellé déjà saisi**, évitant de retaper
      « bronchite » pour trouver son code. Résultats affichés `code + libellé`,
      recherche débattue (250 ms) via `useDebouncedValue`.
- [x] **L8.4** Diagnostics secondaires : bouton « + Ajouter un diagnostic »,
      liste ordonnée, chacun avec son propre code CIM-10 optionnel et son
      bouton de suppression unitaire.
- [x] **L8.5** Le code n'est **jamais** requis : le libellé seul suffit, la
      liste vide affiche explicitement « Aucun code trouvé. Le diagnostic reste
      valide sans code. », et un code rattaché se retire d'un clic sur sa
      pastille sans toucher au libellé.
- [x] **L8.6** Recomposition du champ hérité `diagnostic` : déjà en place
      depuis L0.6 (`composeDiagnosticText`), **couverte par les tests**
      (`ConsultationService.test.ts` : `Bronchite aiguë (J20.9) ; Rhinite`
      persisté puis relu à l'identique). **Piège corrigé au passage** : à la
      modification, `ConsultationsSection` renvoyait encore
      `formData.diagnostic`, figé sur la valeur chargée — effacer le diagnostic
      structuré aurait ressuscité l'ancien texte. Désormais `diagnostic: null`,
      la valeur étant recomposée côté service.

**Migration des consultations existantes :** `resolveDiagnostics()` dans
`consultationMappers` — le champ texte libre ayant disparu du formulaire,
ouvrir une ancienne consultation sans bloc structuré aurait silencieusement
effacé son diagnostic à l'enregistrement. Le texte hérité est donc repris
comme diagnostic principal à l'ouverture.

**Cible atteinte :** `Diagnostic principal : Bronchite aiguë — J20.9`.

**Vérifié dans l'application réelle** (Electron piloté via Playwright,
26/08/2026) : saisie « Bronchite aiguë » → ouverture du sélecteur CIM-10
pré-rempli → **J20.9 « Bronchite aiguë, sans précision »** proposé du premier
coup ; recherche « cephalee » **sans accents** → R51 « Céphalée » et G44.2
« Céphalée de tension » (le correctif L8.2 confirmé en conditions réelles) ;
code rattaché affiché en pastille `# G44.2` retirable ; ajout d'un diagnostic
secondaire avec son propre sélecteur et sa suppression. Aucune erreur console
(`pageerror`/`error`), aucun enregistrement parasite créé (6 consultations
avant et après). `npm test` → 119/119 (dont les 2 nouveaux tests
d'insensibilité aux accents), `npm run build` réussi, `tsc --noEmit` et
`eslint` sans nouvelle erreur sur les fichiers touchés.

---

## L9 — Traitement / prescription structurée

- [x] **L9.1** Nouveau `consultations/TreatmentSection.tsx` : une ligne par
      médicament, bouton « + Ajouter un médicament ». Enveloppé dans
      `ConsultationSection` (réutilisé tel quel depuis L6.4) — repliée par
      défaut, résumé affiché à côté du titre une fois repliée (ex.
      `Traitement — PARACETAMOL BIOCARE 500MG`).
- [x] **L9.2** Ligne de traitement structurée (`TreatmentLine`, déjà typée
      depuis L0.5) : médicament, dosage, forme, posologie, fréquence, durée,
      quantité, instructions — tous en texte libre, rien de bloquant.
- [x] **L9.3** Nouveau `consultations/MedicationPicker.tsx` : recherche
      débattue (250 ms, `useDebouncedValue`) sur `medications.search` (répertoire
      de 5375 présentations, décision n°4), même pattern Popover/Command que
      `Icd10Picker`. Chaque résultat affiche nom + dosage + DCI + forme.
- [x] **L9.4** À la sélection, la ligne est structurée automatiquement :
      dosage repris tel quel du répertoire ; forme et posologie par défaut
      (`1 comprimé`, `1 gélule`...) déduites via `suggestPosologyUnit()`
      (`utils/treatment.ts`) — **volontairement limité aux formes solides
      discrètes reconnues** (comprimé/gélule/sachet/suppositoire/ovule/capsule) :
      les formes liquides/injectables du répertoire officiel sont laissées
      vides plutôt que de deviner une unité fausse (même philosophie que
      L5.2/L5.3, jamais de fausse précision).
- [x] **L9.5** `calculateQuantity()` (`utils/treatment.ts`) : posologie ×
      fréquence × durée → quantité totale, pluralisée sur la forme (`21
      comprimés`). Se recalcule automatiquement tant que le médecin n'a pas
      modifié le champ quantité à la main (même mécanique de
      « pré-remplissage tant que non touché » que L5.5) ; `null` — champ
      laissé à la saisie manuelle — si la fréquence ou la durée n'est pas
      interprétable (ex. « Si besoin »), jamais bloquant. **Testée
      unitairement** : 19 tests (`treatment.test.ts`), dont le calcul, le
      parsing fréquence/durée/posologie et `suggestPosologyUnit()`.
- [x] **L9.6** `formatTreatmentLine()` (`utils/treatment.ts`), rendu lisible
      affiché en direct sous chaque ligne — reproduit **exactement** le même
      format que `ConsultationService.formatTreatmentLine` côté serveur
      (même ordre de champs, même séparateur ` — `), pour que l'aperçu et la
      donnée persistée ne divergent jamais. Cible atteinte : `PARACETAMOL
      BIOCARE 500MG — 1 sachet — 3 fois/jour — 7 jours`.
- [x] **L9.7** `hasAllergyConflict()` (nouveau `utils/allergies.ts`) : compare
      le nom du médicament au texte libre `patients.allergies`, insensible
      aux accents/casse (réutilise `normalize()` de `utils/motifs.ts`), dans
      les deux sens (tokens ≥ 4 caractères pour éviter les faux positifs).
      Alerte non bloquante affichée sous la ligne concernée — jamais de
      blocage de la saisie ni de l'enregistrement. **Testée unitairement**
      (6 tests, `allergies.test.ts`).
- [x] **L9.8** Le répertoire national complet est déjà importé depuis L0
      (décision n°4, 5375 présentations embarquées et versionnées via
      `MedicationService.SEED_VERSION`) : une UI d'import manuel depuis les
      paramètres n'est plus nécessaire, l'architecture retenue remplace le
      fichier source et incrémente la version plutôt que d'exposer un import
      utilisateur. `incrementPopularity` sur sélection réellement prescrite :
      câblé dans `MedicationPicker.handleSelect`.

**Migration des consultations existantes :** `resolveTreatmentLines()` dans
`consultationMappers` — même principe que `resolveDiagnostics` (L8) : une
ancienne consultation sans bloc structuré voit son texte hérité `traitement`
repris comme unique ligne (`medication: <texte>`) à l'ouverture, pour ne rien
effacer silencieusement.

🐛 **Bug préexistant trouvé et corrigé au passage (affectait déjà L8)** :
`ConsultationPrintPreviewDialog.tsx` (bouton « Imprimer » de la barre d'actions,
aperçu de la consultation **en cours de saisie**, avant tout enregistrement)
lisait directement `consultationData.diagnostic`/`.traitement` — des champs
texte devenus vides en permanence dès que les Textarea correspondants ont été
retirés du formulaire (L8 pour le diagnostic, L9 pour le traitement).
L'aperçu d'impression affichait donc silencieusement un diagnostic et un
traitement vides depuis L8, alors même que les blocs structurés contenaient
des données. Corrigé avec deux nouvelles fonctions pures dans le nouveau
`utils/consultationText.ts` (`composeDiagnosticPreview`/`composeTraitementPreview`),
qui reproduisent **exactement** le format de recomposition serveur
(`ConsultationService.formatDiagnosisEntry`/`formatTreatmentLine`) pour
l'aperçu local. Testé unitairement (5 tests) et confirmé dans l'app réelle :
l'aperçu affiche maintenant `PARACETAMOL BIOCARE 500MG — 1 sachet — 3
fois/jour — 7 jours` avant même que la consultation soit enregistrée.

**Vérifié dans l'application réelle** (Electron piloté via Playwright,
29/08/2026) : patient avec allergie connue (« paracetamol ») sélectionné →
recherche « paracetamol » dans `MedicationPicker` → résultats du répertoire
national affichés avec DCI/forme/dosage → alerte d'allergie visible **dès la
frappe**, avant toute sélection → sélection de « PARACETAMOL BIOCARE 500MG »
→ ligne structurée automatiquement (dosage `500MG`, forme `sachet`, posologie
`1 sachet`) → `incrementPopularity` confirmé côté base (popularité 1000 → 1010)
→ puces « 3 fois/jour » et « 7 jours » → quantité recalculée en direct à
« 21 sachets » → aperçu « PARACETAMOL BIOCARE 500MG — 1 sachet — 3 fois/jour
— 7 jours ». Consultation enregistrée : `traitement` (champ hérité) et
`treatment_lines` (structuré) confirmés identiques et corrects côté base.
Ré-ouverture en modification : ligne rechargée à l'identique, alerte
d'allergie réévaluée correctement. Aperçu d'impression (« Imprimer ») confirmé
affichant le traitement composé (cf. bug ci-dessus). Suppression de
l'enregistrement de test via l'application elle-même (retour à 6
consultations). Aucune erreur console (`pageerror`/`error`) sur tout le
scénario. `npm test` → 149/149 (dont les 30 nouveaux tests : 19
`treatment.test.ts`, 6 `allergies.test.ts`, 5 `consultationText.test.ts`),
`npm run build` réussi, `tsc --noEmit` et `eslint` sans nouvelle erreur sur
les fichiers touchés (3 erreurs `no-explicit-any` préexistantes, confirmées
inchangées par `git diff`).

---

## L10 — Examens complémentaires

- [x] **L10.1** Nouveau `consultations/ComplementaryExamsSection.tsx` : une
      ligne par demande, bouton « Demander un examen ». Enveloppé dans
      `ConsultationSection` (réutilisé tel quel depuis L6.4) — repliée par
      défaut, résumé affiché à côté du titre une fois repliée (ex.
      `Examens complémentaires — NFS, ECG de repos`).
- [x] **L10.2** Nouveau `constants/complementaryExams.ts` — 7 catégories
      (`biologie`, `imagerie`, `ecg`, `echographie`, `scanner`, `irm`, `autre`,
      déjà typées depuis L0.5) avec examens fréquents propres à chaque
      catégorie, affichés en puces rapides sous le sélecteur (ex. NFS, CRP,
      Glycémie à jeun, Ionogramme… pour « Analyses biologiques » ; Radio
      thorax, Radio du rachis lombaire… pour « Imagerie »). `Autre` n'a
      volontairement aucune puce (pas de liste de référence pertinente pour
      une catégorie fourre-tout). Changer la catégorie d'une ligne déjà
      remplie ne touche jamais à son libellé ni son indication — seules les
      puces proposées changent.
- [x] **L10.3** Champ « Indication » par demande, texte libre, jamais requis.
- [x] **L10.4** `ExamPrescriptionDialog` — nouvelle prop `initialExams?:
      string[]`, alimentée par `formData.exam_requests.map(e => e.label)`
      depuis `ConsultationForm.tsx`. Le pré-remplissage n'a lieu qu'à
      l'ouverture de la fenêtre (`useEffect` sur `[open]`, volontairement pas
      sur `initialExams` — cf. commentaire dans le code : `initialExams`
      change de référence à chaque rendu du formulaire parent, l'inclure dans
      les dépendances écraserait sinon les modifications en cours dans la
      fenêtre pendant qu'elle est ouverte). Repli inchangé sur la liste
      d'exemple par défaut (`FNS`, `Glycémie à jeun`) si aucun examen n'a
      encore été saisi dans la consultation.

**Aucun champ hérité à recomposer** (contrairement à L8/L9) : `exam_requests`
est une donnée entièrement nouvelle, sans équivalent texte libre préexistant
côté `ConsultationService` — donc pas de `resolveExamRequests()` nécessaire
dans `consultationMappers`.

🐛 **Bug préexistant trouvé et corrigé pendant ce test (introduit en L9)** :
`ConsultationsSection.handleNewConsultation` oubliait `treatment_lines: []`
dans sa réinitialisation du formulaire — voir encadré en tête de fichier.

**Vérifié dans l'application réelle** (Electron piloté via Playwright,
29/08/2026) : patient réel sélectionné (Anis Benali) → section dépliée →
ajout d'une demande, catégorie « Analyses biologiques » par défaut avec ses
puces → clic « NFS » → changement de catégorie vers « Imagerie » : puces
remplacées par celles de la nouvelle catégorie, libellé « NFS » et indication
saisie tous deux conservés (confirmé en lisant directement `.value` des
champs) → ajout d'une deuxième ligne, catégorie ECG, puce « ECG de repos » →
repli de la section → résumé « Examens complémentaires — NFS, ECG de repos »
→ suppression de la deuxième ligne (bouton ✕) → une seule ligne restante,
confirmée. Bouton « Examen » de la barre d'actions → `ExamPrescriptionDialog`
ouvert **pré-rempli avec « NFS »** au lieu de la liste par défaut (« Examens
Prescrits (1) • NFS ») — L10.4 confirmé — puis fermé sans perte de saisie
dans le formulaire de consultation sous-jacent (même garantie qu'en L3/L9).
Consultation enregistrée puis relue directement en base
(`electronAPI.consultations.getAll()`) :
`exam_requests: [{"category":"imagerie","label":"NFS","indication":"recherche
syndrome infectieux"}]` — persistance exacte confirmée, `traitement: null`
(aucun médicament saisi dans ce scénario, comportement attendu). Réouverture
en modification : ligne rechargée à l'identique (catégorie, libellé,
indication tous trois confirmés). Nettoyage : consultation de test supprimée
via `electronAPI.consultations.delete()` (le bouton de suppression de la
liste utilise un `confirm()` natif que le pilotage Playwright sans gestion de
dialogue rejette silencieusement par défaut — suppression faite directement
via l'API plutôt que via le clic, avec un aller-retour base confirmant le
retour à 6 consultations). Aucune erreur console (`pageerror`/`error`) sur
tout le scénario — seuls des avertissements préexistants sans rapport
(CSP en mode développement, `DialogContent` sans description).

---

## L11 — Documents de consultation

**Constat de départ.** Les 6 dialogues listés en L11.2 existaient déjà, tous
branchés dans `ConsultationForm.tsx` via une barre de boutons — mais leur
persistance était très hétérogène, jamais auditée nulle part :
`PrescriptionQuickModal` seul écrivait réellement en base (`prescriptions`,
déjà visible dans l'onglet Ordonnances du dossier patient) ;
`MedicalCertificateDialog` écrivait dans `localStorage`
(`mugidoc_certificates_history`, déjà exploité par l'écran « Certificats »
existant — non touché ici) ; `WorkStopDialog`, `ReferralLetterDialog` et
`ExamPrescriptionDialog` n'enregistraient **rien du tout**, un simple toast
« enregistré » sans aucune trace. Aucun ne permettait de répondre à L11.5
(« documents produits, état généré/imprimé, rattachés au dossier patient »).

- [x] **L11.1** Nouveau `consultations/ConsultationDocumentsSection.tsx` —
      grille de 8 boutons (les 7 documents du plan + « Bilan vierge », cf.
      note L11.2) au-dessus d'une liste des documents déjà produits pour
      cette consultation, chacun avec une pastille d'état (`Généré` gris /
      `Imprimé` vert) et un bouton de retrait individuel. Enveloppé dans
      `ConsultationSection` (réutilisé depuis L6.4) — repliée par défaut,
      résumé `« N documents générés »` une fois repliée.
- [x] **L11.2** Les 6 dialogues existants gardent chacun leur propre mécanisme
      de génération (impression, `prescriptions`, `localStorage`...) —
      seuls deux ajouts transverses et additifs : une prop `onSaved?`
      (appelée à l'enregistrement) et `onPrinted?` (appelée à l'impression),
      câblées uniquement depuis `ConsultationDocumentsSection` pour tenir la
      trace d'audit (L11.5), sans dupliquer ni modifier leur contenu. Le
      7ᵉ bouton pré-existant, `LabRequestDialog` (« Demande de Bilan
      Vierge » — formulaire pré-imprimé à cocher à la main, sans données
      patient), est conservé tel quel en 8ᵉ action bonus : il sert un usage
      réel distinct (repartir avec un formulaire papier vierge) que les 7
      documents structurés ne remplacent pas.
- [x] **L11.3** Deux pièces manquantes créées :
      - *Demande d'imagerie* — pas un nouveau composant : `ExamPrescriptionDialog`
        (déjà générique depuis L10.4) reçoit une prop `kind?: 'analyses' |
        'imagerie'` qui change son titre, l'en-tête d'impression et ses puces
        rapides (réutilise `getFrequentExams()` de L10.2 — biologie seule pour
        `'analyses'`, imagerie + échographie + scanner + IRM combinés pour
        `'imagerie'`). Deux instances du même composant dans
        `ConsultationDocumentsSection`, chacune alimentée par les
        `exam_requests` filtrés sur la catégorie correspondante.
      - *Compte rendu de consultation* — nouveau
        `consultations/ConsultationReportDialog.tsx`, seul des 8 documents à
        n'avoir aucune saisie : recompose motif → anamnèse → constantes →
        examen clinique → diagnostic → traitement → examens en lecture seule,
        en réutilisant **exactement** les fonctions déjà testées ailleurs
        (`composeDiagnosticPreview`/L9, `formatTreatmentLine`/L9,
        `summarizeExamSection`/L7) pour ne jamais diverger de ce qui est
        réellement enregistré. La conduite à tenir (CDAT) affiche « Non
        renseigné » — `care_plan` n'existe pas encore comme champ du
        formulaire, ce sera L12.
- [x] **L11.4** Pré-remplissage par document : `PrescriptionQuickModal` reçoit
      `initialMedications` (mappé depuis `treatment_lines`, L9) ;
      `WorkStopDialog` et `ReferralLetterDialog` reçoivent le diagnostic
      composé (`composeDiagnosticPreview`) pour leurs champs Remarques /
      Considérations cliniques ; les deux demandes d'examens reçoivent leurs
      `exam_requests` filtrés par catégorie (L10) ; le compte rendu est
      entièrement généré (L11.3). Même garde que L10.4 : le préremplissage ne
      se (re)fait qu'à l'ouverture du dialogue, jamais pendant qu'il reste
      ouvert.
- [x] **L11.5** Nouvelle table `consultation_documents` (id, patient_id,
      consultation_id nullable, document_type, title, status
      `generated`/`printed`, created_at) + `ConsultationDocumentService.ts`
      (`create`/`markPrinted`/`delete`/`getByConsultation`/`getByPatient`,
      même structure que `ConsultationMotifService.ts`/L0.3) + IPC +
      `useConsultationDocuments.ts`. Ne duplique le contenu d'aucun document
      existant — trace uniquement qu'un type donné a été produit, avec son
      état. Un document peut être généré **avant** l'enregistrement de la
      consultation (`consultation_id` alors `null`, même limite déjà
      acceptée pour `prescriptions.consultation_id` par le code existant).
      Rattachement au dossier patient : nouvel onglet « Documents générés »
      dans `PatientDetail.tsx` (nouveau `patients/ConsultationDocumentsTab.tsx`,
      auto-alimenté par `patientId` comme `PatientDocumentsTab` — apparaît
      donc aussi bien dans la fiche patient plein écran que dans
      `PatientRecordDialog`, L3.4, sans câblage supplémentaire), distinct de
      l'onglet « Documents & Imagerie (EDFA) » qui gère des fichiers externes
      importés, pas les documents produits par le cabinet. Chaque entrée est
      retirable (bouton ✕) — capacité minimale manquante pour corriger un
      document tracé par erreur, ajoutée par cohérence avec le reste de
      l'application (toute entité du domaine a un moyen de suppression).

**Vérifié dans l'application réelle** (Electron piloté via Playwright,
29/08/2026) : patient réel (Anis Benali) sélectionné, diagnostic
« Bronchite aigue », un médicament (Amoxicilline 500mg — 1 comprimé —
3 fois/jour — 7 jours), deux demandes d'examens (une biologie, une scanner).
Bouton Ordonnance → dialogue prérempli avec la ligne de traitement exacte →
Enregistrer → entrée « Ordonnance — Généré » apparue immédiatement dans la
liste. Demande d'analyses → titre « Demande d'Analyses Biologiques », puces
rapides toutes biologie, prérempli avec le seul examen de catégorie biologie.
Demande d'imagerie → titre « Demande d'Imagerie Médicale », puces combinant
imagerie/échographie/scanner/IRM, prérempli avec le seul examen hors
biologie — la même ligne `exam_requests` correctement répartie entre les deux
documents selon sa catégorie, jamais dupliquée ni perdue. Compte rendu →
constaté que les constantes (poids/taille) n'apparaissaient pas dans un
premier essai ; vérification directe du DOM a confirmé que `formData.vitals`
était réellement vide à cet instant (effacé par un clic parasite pendant le
pilotage automatisé, pas un bug du composant) — poids/taille resaisis,
compte rendu rouvert : bloc CONSTANTES affiché correctement
(« Poids : 78 kg — Taille : 170 cm — IMC : 27 kg/m² »), diagnostic et
traitement identiques à ceux réellement enregistrés. Arrêt de travail et
lettre d'orientation → tous deux préremplis avec « Bronchite aigue » dans
leurs champs respectifs. Certificat médical → enregistré, tracé. Bilan
vierge → seul document sans étape d'enregistrement séparée : impression
directe déclenche bien la création d'une entrée à l'état `Imprimé` (pas
`Généré` puis mis à jour) — confirmé après un aléa d'automatisation
(l'impression a ouvert une vraie boîte de dialogue native Windows qui a
bloqué le pilotage à distance ; refermée proprement via l'envoi d'Échap au
niveau du système d'exploitation, sans perte de données ni redémarrage de
l'application). Un vrai bug trouvé sur `ReferralLetterDialog` pendant ce test
(voir encadré en tête de fichier) a été corrigé, le renderer reconstruit et
rechargé, puis revérifié : la lettre d'orientation apparaît désormais bien
dans la liste. Nettoyage final : 1 ordonnance de test, 8 entrées de suivi de
documents et le poids/taille temporairement modifiés sur la fiche d'Anis
Benali ont tous été supprimés/restaurés via l'API de l'application (jamais en
base directement), confirmé par relecture (0 document de suivi, poids/taille
d'origine, 1 seule prescription antérieure restante, 6 consultations au
total — inchangé). Aucune erreur console (`pageerror`/`error`) relevée.
`npm test` → 149/149, `npm run build` réussi, `tsc --noEmit` et `eslint` sans
nouvelle erreur (mêmes erreurs `no-explicit-any` préexistantes que
`ConsultationMotifService.ts`/L0.3 sur la nouvelle table de suivi — pattern
déjà établi dans ce fichier de référence, confirmé identique).

---

## L12 — Plan / conduite à tenir + prochain rendez-vous

**Constat de départ.** Les colonnes `care_plan`, `next_appointment_date`,
`next_appointment_time` et `next_appointment_id` existaient déjà depuis L0.1
(migration) et L0.5/L0.6 (types + sérialisation JSON générique côté
`ConsultationService.ts`, y compris un round-trip déjà couvert par un test
existant) — aucun travail base de données ni service n'était nécessaire.
L12 est un lot **entièrement renderer** : un nouveau composant, son
branchement dans le formulaire (le pattern d'intégration en 3 points déjà vu
en L8/L9 : `consultationMappers.tsx` → `ConsultationsSection.tsx` →
`ConsultationForm.tsx`), et le raccordement à `appointments.create`.

- [x] **L12.1** Nouveau `consultations/CarePlanSection.tsx` : `Textarea`
      libre + 3 puces de modèles rapides (« Traitement symptomatique +
      hydratation », « Repos N jours », « Contrôle dans N jours », N repris
      des champs assistés ci-dessous ou d'une valeur par défaut sinon).
      Contrairement aux puces d'`AnamnesisSection` (qui **remplacent** le
      champ), ici chaque clic **ajoute** une ligne au texte existant
      (`appendLine`, idempotent : un clic répété sur la même puce ne duplique
      pas la ligne) — plusieurs conseils se combinent naturellement dans la
      même conduite à tenir. Enveloppé dans `ConsultationSection` (réutilisé
      depuis L6.4), repliée par défaut.
- [x] **L12.2** Deux champs numériques « Repos (jours) » / « Contrôle dans
      (jours) » (`onWheel` → perte de focus, même garde-fou que L5.6). La
      date n'est **jamais stockée**, seul le nombre de jours l'est
      (`ConsultationCarePlan.rest_days`/`control_days`) — la date affichée
      (« Jusqu'au... » / « Conseillé le... ») est recalculée à chaque rendu
      depuis la date de la consultation via `addDaysToDate()` (nouveau
      `utils/carePlan.ts`), pour rester exacte même en rouvrant une ancienne
      consultation plus tard. Testé unitairement (10 tests,
      `carePlan.test.ts` : additions simples, changement de mois, changement
      d'année, jours négatifs/non numériques → `null`, jamais de date fausse
      affichée).
- [x] **L12.3** `formatAppointmentDisplay()` (`utils/carePlan.ts`) produit
      exactement `02/09/2026 à 10:30`. Affiché à trois endroits : dans
      `CarePlanSection` lui-même, dans le compte rendu de consultation
      (`ConsultationReportDialog`, L11 — voir note ci-dessous) et dans
      l'historique (L12.5).
- [x] **L12.4** Tant qu'aucun rendez-vous n'est encore planifié, un bouton
      « Planifier un rendez-vous » ouvre un mini-formulaire inline (date
      préremplie avec la date de contrôle calculée si renseignée, sinon la
      date de la consultation ; heure via le `TimePicker` de L1.6, préremplie
      à l'heure courante). `CarePlanSection` appelle directement
      `useAppointments().createAppointment` (même pattern « appel direct
      depuis la feuille + callback de propagation vers le parent » que
      `ConsultationPatientHeader`/L3.2 et `VitalSignsSection`/L5.5) puis
      notifie `ConsultationForm` via `onAppointmentScheduled`, qui range
      `next_appointment_id/date/time` dans `formData`. Le conflit de créneau
      existant côté `AppointmentService` (`Ce créneau horaire est déjà
      occupé`) est intercepté et affiché en toast non bloquant, sans jamais
      perdre la saisie du mini-formulaire (le médecin peut juste changer
      l'heure et réessayer). Une fois planifié, le bouton est remplacé par
      l'affichage figé (L12.3) + un lien « Changer » qui redonne la main pour
      planifier un autre rendez-vous — il ne supprime jamais le rendez-vous
      déjà créé (une correction/annulation réelle reste du ressort de la
      section Rendez-vous existante), seulement le lien avec cette
      consultation.
- [x] **L12.5** `next_appointment_id`/`_date`/`_time` transitent par les 3
      points d'intégration habituels (`consultationMappers.tsx` :
      `ConsultationUI` + `convertConsultationToUI` + `convertUIToCreateRequest` ;
      `ConsultationsSection.tsx` : `formData`, les 3 points de réinitialisation,
      le chargement en modification ; `ConsultationForm.tsx` : la nouvelle
      interface locale `ConsultationFormData`). Visible dans l'historique à
      deux endroits, tous deux additifs et à coût quasi nul puisque les
      champs existent déjà sur `Consultation`/`ConsultationUI` : le détail
      déplié d'une consultation dans `ConsultationList.tsx`, et — en bonus,
      hors périmètre strict de L12.5 mais cohérent avec le bloc « Dernière
      consultation » déjà présent — une ligne « Prochain rendez-vous » dans
      `ConsultationPatientHeader.tsx` (L3.3), utile au médecin qui rouvre une
      fiche patient sans avoir besoin d'aller déplier l'historique.

**Complète la note de L11 sur `ConsultationReportDialog`.** Le compte rendu
affichait « Non renseigné » pour la conduite à tenir faute de champ
formulaire (cf. plan L11.3). `care_plan` et `consultationDate` sont
maintenant passés en props (via `ConsultationDocumentsSection`, qui les
reçoit elle-même de `ConsultationForm`) ; une fonction locale
`formatCarePlan()` recompose texte libre + lignes « Repos »/« Contrôle »
(même calcul de date que `CarePlanSection`, aucune divergence possible), et
un nouveau bloc « Prochain rendez-vous » apparaît sous la conduite à tenir
quand un rendez-vous est planifié.

**Aucun champ hérité à recomposer** (même situation qu'en L10) : `care_plan`
et `next_appointment_*` sont des données entièrement nouvelles, sans
équivalent texte libre préexistant — pas de `resolveCarePlan()` nécessaire
dans `consultationMappers.tsx`.

**Vérifié dans l'application réelle** (Electron piloté via Playwright,
29/08/2026) : patient réel (Mohamed Gaouar, 20 ans) sélectionné → section
dépliée → clic sur les 3 puces de modèles → texte composé ligne par ligne
(« Repos 3 jours / Contrôle dans 7 jours / Traitement symptomatique +
hydratation ») → champs Repos = 3 (« Jusqu'au 01/09/2026 ») et Contrôle = 7
(« Conseillé le 05/09/2026 ») — dates vérifiées correctes à la main (29/08 +
7 jours = 05/09, à cheval sur un changement de mois). Bouton « Planifier un
rendez-vous » → mini-formulaire prérempli à la date de contrôle calculée →
rendez-vous réellement créé (confirmé côté base : nouvelle ligne dans
`appointments`, `type: "Contrôle"`) → affichage figé « 05/09/2026 à 16:20 »
→ lien « Changer » vérifié (redonne bien le mini-formulaire sans supprimer le
rendez-vous déjà créé). Conflit de créneau testé involontairement en
retapant deux fois la même heure qu'un rendez-vous déjà créé pendant le test
lui-même : toast « Impossible de planifier ce rendez-vous — ... Ce créneau
horaire est déjà occupé » affiché correctement, mini-formulaire toujours
là, aucune perte de saisie — comportement conforme à L12.4. Compte rendu de
consultation (L11) rouvert : bloc CONSTANTES prérempli depuis la fiche
patient (poids/taille), bloc CONDUITE À TENIR affichant désormais le texte
complet **et** les lignes calculées, nouveau bloc PROCHAIN RENDEZ-VOUS
affichant `05/09/2026 à 16:20` — confirmation que le compte rendu ne
divergeait pas de la saisie live. Consultation enregistrée puis relue
directement en base : `care_plan` (texte + `rest_days: 3` + `control_days:
7`) et `next_appointment_id/_date/_time` tous confirmés identiques à la
saisie. Historique (`ConsultationList`, « Voir détails ») : ligne « Prochain
rendez-vous : 05/09/2026 à 16:20 » affichée correctement. Réouverture d'une
nouvelle consultation pour le même patient : `ConsultationPatientHeader`
affiche bien « Prochain rendez-vous : 05/09/2026 à 16:20 » sous « Dernière
consultation » (bonus L3.3). Nettoyage : la consultation de test et les 3
rendez-vous créés pendant la vérification (dont un via un appel direct à
l'API à des fins de diagnostic) supprimés via l'API de l'application,
confirmé par relecture (retour à 0 consultation, 12 rendez-vous — état
antérieur au test). Aucune erreur console (`pageerror`/`error`) sur tout le
scénario (17 entrées de log au total, uniquement des logs applicatifs
normaux et l'avertissement CSP habituel en mode développement). `npm test` →
159/159 (dont les 10 nouveaux tests de `carePlan.test.ts`), `npm run build`
réussi, `tsc --noEmit` et `eslint` sans nouvelle erreur sur les fichiers
touchés.

---

## L13 — Panneau latéral : résumé + historique

**Constat de départ.** Lot purement renderer : aucune nouvelle colonne ni
service — tous les champs affichés (`motif`, `vitals`, `diagnostics`,
`treatment_lines`, `care_plan`, `next_appointment_*`) existent déjà depuis
L0/L5/L8/L9/L12, et l'historique patient a déjà un hook dédié
(`usePatientConsultations`, écrit en L3 mais jamais consommé jusqu'ici).

- [x] **L13.1** Colonne droite fixe (`sticky`), masquée sous 1280 px et
      accessible en tiroir sur petit écran. `ConsultationForm.tsx` passe d'une
      colonne unique (`max-w-4xl mx-auto`) à une mise en page à deux zones :
      contenu principal (`flex-1`) + `<aside className="hidden xl:block ...
      sticky top-6">` (breakpoint `xl` = 1280 px, standard Tailwind, non
      modifié). Sous 1280 px, un bouton « Résumé » apparaît dans l'en-tête et
      ouvre le même contenu dans un tiroir latéral (`Sheet` de shadcn/ui,
      côté `right` — composant déjà présent dans `components/ui/sheet.tsx`
      mais jusqu'ici jamais utilisé nulle part dans l'app).
- [x] **L13.2** Bloc **PATIENT** : nom, âge, sexe.
- [x] **L13.3** Bloc **ALERTES** : allergies (`patient.allergies`) et maladies
      chroniques (`patient.chronic_diseases`) affichées directement (pas de
      réutilisation de `PatientHealthAlert`, qui mélange des champs
      différents et n'affiche pas les allergies — cf. note ci-dessous), plus
      `PatientDebtAlert` réutilisé tel quel (déjà conçu pour un contexte
      consultation, cf. L3.2).
- [x] **L13.4** Bloc **CONSULTATION** : motif, TA, température — dérivés
      directement des props (`formData`), donc mis à jour en direct pendant
      la saisie sans code supplémentaire (le panneau se re-rend avec le
      formulaire).
- [x] **L13.5** Bloc **SYNTHÈSE** regroupant Diagnostic / Traitement
      (`{n} médicament(s)`) / Documents / Suivi (`Contrôle : dd/MM`, recalculé
      via `addDaysToDate` de `carePlan.ts`, cf. L12.2 — jamais stocké comme
      date). Le compteur Documents appelle `useConsultationDocuments` avec
      l'id de la consultation en cours d'édition (affiche `—` tant que la
      consultation n'est pas encore enregistrée, un compte réel une fois
      qu'elle a un id).
- [x] **L13.6** Bloc **HISTORIQUE** : consultations antérieures du patient via
      `usePatientConsultations`, triées par date décroissante, limitées à 5,
      **excluant la consultation en cours d'édition** (sinon une consultation
      se listerait elle-même dans son propre historique). Format
      `date + badge de statut / motif / diagnostic` (diagnostic recomposé via
      `resolveDiagnostics`/`composeDiagnosticPreview` pour couvrir aussi bien
      les anciennes consultations en texte libre que les consultations
      structurées post-L8).
- [x] **L13.7** Clic sur une ancienne consultation → nouveau composant
      `ConsultationHistoryViewDialog.tsx`, superposé (même principe que
      `PatientRecordDialog` en L3.5) sans jamais démonter le formulaire en
      cours. Recompose les mêmes blocs que `ConsultationReportDialog` mais
      sans le papier à en-tête ni les actions imprimer/enregistrer.

**Refactor associé.** Les fonctions `formatAnamnese`/`formatVitals`/
`formatCarePlan` vivaient uniquement à l'intérieur de `ConsultationReportDialog.tsx`
(L11/L12). Avec un deuxième consommateur (`ConsultationHistoryViewDialog`),
elles ont été extraites vers `utils/consultationSummary.ts` (renommées
`formatAnamneseLines`/`formatVitalsLines`/`formatCarePlanLines`, mêmes
fonctions, 8 nouveaux tests) — `ConsultationReportDialog.tsx` importe
désormais depuis ce module au lieu de dupliquer.

**Bug corrigé en marge (hors périmètre L13 mais découvert en y travaillant).**
L'onglet « Consultations » de `PatientDetail.tsx` (utilisé sur la fiche
patient réelle *et* dans `PatientRecordDialog`, donc visible en survolant le
dossier depuis une consultation) lisait `consult.reason` et `consult.diagnosis`
— des champs qui n'ont jamais existé sur le type `Consultation` (les vrais
champs sont `motif`/`diagnostic`, et pour les consultations structurées post-L8
le diagnostic vit dans `diagnostics.primary.label`). Le motif s'affichait donc
toujours vide et le bloc diagnostic ne s'affichait jamais. Corrigé pour lire
`consult.motif` et `composeDiagnosticPreview(resolveDiagnostics(consult))` —
cohérent avec le nouveau bloc HISTORIQUE qui doit résoudre exactement de la
même façon.

**Vérifié dans l'application réelle** (Electron + Playwright, patient
« Mohamed Gaouar », allergie « Pénicilline » déjà en base) :
- Sélection du patient → panneau latéral apparaît immédiatement avec PATIENT
  (« Mohamed Gaouar, 20 ans · Masculin »), ALERTES (« Allergies : Pénicilline »,
  en rouge), CONSULTATION/SYNTHÈSE/HISTORIQUE tous à vide (`—`, `Aucun`,
  `Aucune consultation antérieure`).
- Saisie en direct : motif « Fièvre et toux », TA 130/85, température 38.5 →
  le bloc CONSULTATION se met à jour à chaque frappe, sans délai ni
  ré-ouverture de section.
- Diagnostic « Bronchite aigue » + clic sur le chip rapide « Contrôle dans 7
  jours » (29/08/2026 + 7 jours) → SYNTHÈSE affiche « Bronchite aigue » et
  « Suivi : Contrôle : 05/09 », exactement synchronisé avec l'indice
  « Conseillé le 05/09/2026 » affiché sous le champ jours. Ajout d'un
  médicament (ligne vide) → « Traitement : 1 médicament ».
- Consultation enregistrée, puis nouvelle consultation ouverte pour le même
  patient → bloc HISTORIQUE affiche désormais « 29/08/2026 [Programmée] /
  Fièvre et toux / Diagnostic : Bronchite aigue ». Clic dessus →
  `ConsultationHistoryViewDialog` s'ouvre avec Motif/Constantes (tous les
  signes vitaux saisis, correctement formatés)/Diagnostic/Conduite à tenir
  (texte libre + ligne calculée), fermeture du dialogue → le motif
  « Controle de suivi » tapé dans la consultation en cours (non enregistrée)
  était toujours présent, confirmant qu'aucune perte de saisie ne se produit.
- Édition de la consultation déjà enregistrée → SYNTHÈSE affiche
  « Documents : 0 » (compte réel, plus `—`) et surtout **HISTORIQUE affiche
  bien « Aucune consultation antérieure »** — la consultation ne se liste pas
  elle-même, confirmant l'exclusion par id.
- Redimensionnement de la fenêtre sous 1280 px de largeur effective (via
  `page.setViewportSize`, la fenêtre Electron ayant une largeur minimale de
  1200 px qui, avec le facteur d'échelle d'affichage de cette machine, reste
  au-dessus du seuil) → colonne latérale masquée, bouton « Résumé » apparaît
  dans l'en-tête ; clic dessus → tiroir `Sheet` glissant depuis la droite avec
  exactement le même contenu, formulaire visible et assombri derrière.
- Nettoyage : consultation de test supprimée via l'interface (bouton
  supprimer + confirmation), vérifié par relecture IPC directe
  (`consultations.getAll()` → `[]`), rendez-vous inchangés (12). Aucune
  erreur console/page sur l'ensemble de la session (15 entrées de log,
  0 erreur).

---

## L14 — Barre d'actions fixe

> **Constat de départ** : avant L14, la seule façon de persister une
> consultation était le bouton `Enregistrer la Consultation` en bas du
> formulaire (jamais visible sans défiler), qui sauvegardait **et** quittait
> systématiquement vers la liste — impossible de sauvegarder sans perdre sa
> place. Le bouton `Clôturer la consultation` ne faisait que positionner
> `formData.status` à `completed` en mémoire, sans rien enregistrer par
> lui-même (il fallait encore cliquer sur `Enregistrer` ensuite). Le champ
> `Joindre un fichier` de l'ancien bloc « Actions de fin de consultation »
> ne persistait strictement rien (aucun appel IPC, juste un état local suivi
> d'un toast) — retiré comme code mort plutôt que déplacé.

- [x] **L14.1** `ConsultationActionBar.tsx` (nouveau composant, cohérent avec
      le découpage en un fichier par section déjà en place) : barre
      `position: fixed; bottom: 0` sur toute la largeur, `z-40`, visible en
      permanence quel que soit le défilement du formulaire. `pb-28` ajouté au
      conteneur principal du formulaire pour qu'elle ne recouvre jamais le
      dernier champ.
- [x] **L14.2** Barre : `Enregistrer brouillon` · `Ordonnance` · `Examens`
      (menu déroulant Analyses biologiques / Imagerie médicale, ces deux
      documents ayant des dialogues distincts) · `Certificat` · `Facturer` ·
      `Terminer la consultation`. Les documents moins fréquents (compte
      rendu, arrêt de travail, lettre d'orientation, bilan vierge) restent
      dans la section « Documents de consultation » existante (L11), non
      dupliqués dans la barre. `ConsultationDocumentsSection` exposée via
      `forwardRef`/`useImperativeHandle` (`ConsultationDocumentsSectionHandle`
      : `openOrdonnance`/`openAnalyses`/`openImagerie`/`openCertificat`) pour
      que la barre ouvre les **mêmes** instances de dialogue et la **même**
      trace d'audit (`useConsultationDocuments`) que la section, sans les
      dupliquer. Vérifié en live : les 4 raccourcis ouvrent chacun le bon
      dialogue (« Demande d'Analyses Biologiques », « Demande d'Imagerie
      Médicale », « Certificat Médical de Repos », `PrescriptionQuickModal`).
      `Facturer` est une fonctionnalité réelle (pas un stub) : réutilise
      `CollectPaymentDialog` + `ThermalReceiptModal` (mêmes composants que la
      page Facturation) sur le paiement en attente auto-créé par
      `ConsultationService.createConsultation` — jamais un second paiement.
      Nécessite que la consultation ait déjà été enregistrée au moins une
      fois (brouillon ou finalisation) ; sinon message explicite invitant à
      enregistrer un brouillon d'abord. Bug corrigé en le construisant (voir
      note d'environnement ci-dessus) : `consultation_id` manquant sur le
      paiement auto-créé. Edge case vérifié en live : une fois le paiement
      soldé, un second clic sur `Facturer` affiche bien « Aucun paiement à
      encaisser » au lieu de rouvrir le dialogue sur un paiement déjà
      complété (première version bogguée : le repli sur `payments[0]`
      rouvrait n'importe quel paiement, y compris déjà soldé — repli
      supprimé).
- [x] **L14.3** `Terminer la consultation` : `variant="success"`, `size="lg"`,
      libellé en gras, ancrée à droite de la barre — seule action visuellement
      dominante. Combine en un clic ce qui demandait avant deux étapes
      (`Clôturer` puis `Enregistrer`) : force `status → 'completed'` et
      enregistre, sans passer par un état intermédiaire en mémoire.
- [x] **L14.4** `useKeyboardShortcuts` (hook déjà présent mais **jamais
      utilisé nulle part** dans le code avant ce lot — confirmé par recherche
      globale) étendu avec deux gestionnaires optionnels
      (`onSaveDraft`/`onFinalize`) et leurs raccourcis (`Ctrl+S` sans Maj,
      `Ctrl+Entrée`), instancié depuis `ConsultationForm`. Vérifiés en live
      chacun séparément : `Ctrl+S` sauvegarde sans quitter (mêmes effets que
      le clic sur `Enregistrer brouillon`, `updated_at` changé en base) ;
      `Ctrl+Entrée` finalise et revient à la liste (`status: 'completed'`,
      `completed_at` renseigné, toast « Consultation modifiée »).
- [x] **L14.5** Indicateur texte « Brouillon enregistré à HH:MM » à côté du
      bouton, mis à jour après chaque sauvegarde réussie (manuelle ou
      automatique) — pas de toast pour ne pas être bruyant sur une sauvegarde
      silencieuse périodique. Sauvegarde automatique toutes les 2 minutes
      (`AUTOSAVE_INTERVAL_MS`) tant qu'un patient est sélectionné. **Bug réel
      trouvé et corrigé en vérification live** (détaillé dans la note
      d'environnement en tête de fichier) : la première implémentation ne se
      déclenchait jamais, la fonction de sauvegarde changeant de référence à
      chaque rendu du formulaire (elle dépend de `onSubmit`, recréé à chaque
      frappe côté `ConsultationsSection`) — ce qui relançait la minuterie en
      boucle avant qu'elle n'atteigne 2 minutes. Corrigé via une ref
      (`handleSaveDraftRef`) : l'effet ne redémarre plus qu'au changement
      réel de patient (`selectedPatient?.id`), jamais au fil de la frappe.
      Reconfirmé sur un test de 150 s avec frappe simulée en cours de route :
      sauvegarde automatique déclenchée sans action manuelle.

**Refactor associé** : `handleCreateConsultation`/`handleUpdateConsultation`
(`ConsultationsSection.tsx`) acceptent désormais `{ finalize?, stayOpen? }` et
renvoient un booléen de succès. `stayOpen` fait passer d'un `createConsultation`
à un `updateConsultation` pour l'enregistrement suivant en promouvant
`editingConsultation` vers la consultation fraîchement créée, **sans**
réinitialiser le formulaire ni changer de patient sélectionné — c'est ce qui
permet à « Enregistrer brouillon » de rester sur place. `finalize` calcule le
statut effectif (`completed` ou valeur actuelle normalisée) sans dépendre du
timing de `setFormData` (asynchrone), contrairement à l'ancien bouton
`Clôturer` qui devait s'appuyer sur un état intermédiaire.

---

## L15 — « Terminer la consultation » (orchestration)

> **Constat de départ** : L15.2/L15.3/L15.4 étaient déjà correctement
> implémentés avant ce lot (enregistrement complet, `status → completed` +
> `completed_at` dans `ConsultationService`, cascade `useConsultationClosure` +
> `triggerDashboardUpdate` dans `propagateClosure` de `ConsultationsSection`,
> tous exercés par le bouton `Terminer` de L14). L15.5 était également déjà
> acquis (L9 pour `prescriptions.consultation_id`, L11 pour
> `consultation_documents.consultation_id` + l'onglet dossier patient). Le
> travail réel de L15 portait donc sur L15.1, L15.6 et L15.7 — l'orchestration
> autour de la clôture, pas la clôture elle-même — plus la vérification live
> de ce qui existait déjà.

- [x] **L15.1** Avertissement non bloquant (`AlertDialog`, primitive présente
      mais jusqu'ici jamais utilisée dans le code — même situation que `Sheet`
      en L13 et `useKeyboardShortcuts` en L14) : si ni motif ni diagnostic ne
      sont renseignés, « Consultation incomplète — (...) Voulez-vous la
      terminer quand même ? » avec `Annuler` / `Terminer quand même`. Vérifié
      en live dans les deux sens : `Annuler` ne modifie rien (0 consultation
      créée) ; `Terminer quand même` poursuit la clôture normalement.
- [x] **L15.2** / **L15.3** / **L15.4** Déjà acquis (voir constat de départ) ;
      reconfirmés en live à chaque test de ce lot : `status: "completed"` et
      `completed_at` horodaté systématiquement présents en base après
      clôture ; effet de bord de la cascade L15.4 observé concrètement (le
      rendez-vous du jour du patient de test est passé à `terminé`
      automatiquement, sans lien explicite renseigné — cf. note
      d'environnement en tête de fichier).
- [x] **L15.5** Déjà acquis (voir constat de départ) ; vérifié en live de bout
      en bout sur un cas réel : ordonnance générée pendant la consultation
      (`Amoxicilline 500mg`) → consultation clôturée → fiche patient
      « Mohamed Gaouar » consultée directement dans l'UI : l'ordonnance
      apparaît dans l'onglet « Ordonnances », sa trace dans l'onglet
      « Documents générés », et la consultation elle-même (motif + diagnostic)
      dans l'onglet « Consultations ».
- [x] **L15.6** Bouton `Facturer maintenant` sur l'écran récapitulatif (en plus
      du raccourci déjà présent dans la barre d'actions depuis L14) : réutilise
      la même fonction `handleFacturer` (donc le même `CollectPaymentDialog`/
      `ThermalReceiptModal` sur le paiement en attente déjà créé) — aucune
      duplication entre les deux points d'entrée. Vérifié en live : la boîte
      d'encaissement s'ouvre **empilée** par-dessus l'écran récapitulatif
      (celui-ci reste visible, assombri, en dessous) ; après encaissement, le
      récapitulatif est toujours là intact, un seul paiement en base
      (`status: "completed"`, pas de doublon).
- [x] **L15.7** `ConsultationCompletionDialog.tsx` (nouveau composant) :
      superposé sans navigation à la clôture (même famille de motif que
      `PatientRecordDialog` en L3 et `ConsultationHistoryViewDialog` en L13),
      tant que le médecin ne choisit pas explicitement de continuer. Contenu :
      motif/diagnostic/nombre de lignes de traitement, documents produits
      (relus via une instance dédiée de `useConsultationDocuments`, même
      pattern que `ConsultationSidebar` en L13 — jamais figés au moment de
      l'ouverture), prochain rendez-vous. Actions : `Facturer maintenant`
      (L15.6) et `Retour à la liste` (seul point qui déclenche réellement la
      sortie vers la liste). Vérifié en live avec documents et sans documents,
      avec et sans diagnostic renseigné.

**Bug réel trouvé et corrigé en vérification live** (détaillé dans la note
d'environnement en tête de fichier) : rester sur l'écran récapitulatif après
clôture laissait la sauvegarde automatique (L14.5) ou un `Ctrl+S` fortuit
réenregistrer la consultation avec l'ancien statut local `scheduled`,
effaçant silencieusement `completed_at`. Corrigé en excluant
`completionDialogOpen` de `canSave` — plus aucun enregistrement possible tant
que le récapitulatif est affiché. Reconfirmé sur un essai de 150 s, écran
ouvert : statut inchangé tout du long (contre un échec à 100 % avant le
correctif, sur un essai identique).

**Refactor associé** : `handleCreateConsultation`/`handleUpdateConsultation`
(`ConsultationsSection.tsx`) exécutent désormais `propagateClosure` et
`reloadConsultationsList` **avant** de tester `options?.stayOpen`, et non plus
seulement sur le chemin de sortie — nécessaire pour que la cascade L15.4
s'applique même quand le formulaire reste ouvert pour l'écran récapitulatif
(L15.7). `doFinalize` (`ConsultationForm.tsx`) appelle donc
`onSubmit({ finalize: true, stayOpen: true })` : la clôture est complète et
la cascade déclenchée, mais la sortie réelle vers la liste n'a lieu qu'au clic
sur `Retour à la liste`.

---

## L16 — Mise en page anti-surcharge

> *Directive : NE PAS SURCHARGER L'ÉCRAN.*

> **Constat de départ** : `ConsultationSection` (accordéon repliable avec
> résumé sur la ligne de titre) existait déjà depuis L6 et était déjà utilisé
> par Anamnèse/Examen clinique/Traitement/Examens complémentaires/Plan.
> Constantes et Diagnostic étaient les deux seules sections du parcours
> encore toujours visibles, hors accordéon. L'ordre (L16.3) était déjà
> correct. La divulgation progressive (L16.4) était déjà en place partout où
> une liste répétable existe (diagnostics secondaires, lignes de traitement,
> examens complémentaires, prise de RDV). Le travail réel de L16 portait donc
> sur : faire entrer Constantes et Diagnostic dans l'accordéon, contraindre la
> largeur de la colonne de saisie (L16.1), et découper `ConsultationForm.tsx`
> (L16.5, 545 lignes après L14/L15).

- [x] **L16.1** `<div className="flex-1 min-w-0 max-w-[820px]">` sur la
      colonne de saisie (`ConsultationForm.tsx`) ; le résumé à droite garde sa
      largeur fixe de L13 (`w-80`, 320 px). Vérifié en live : le formulaire
      n'occupe plus toute la largeur disponible sur un écran large, la colonne
      de résumé reste à sa place.
- [x] **L16.2** `VitalSignsSection` (Constantes) et `DiagnosisSection`
      (Diagnostic) enveloppées dans `ConsultationSection`, résumé calculé via
      `formatVitalsLines`/`composeDiagnosticPreview` (fonctions déjà
      existantes, réutilisées telles quelles). `defaultOpen={!isEmpty}`
      conservé, cohérent avec les 5 sections déjà en accordéon — voir
      « Décision L16.2 » dans la note d'environnement en tête de fichier.
      Vérifié en live : sur une nouvelle consultation, Constantes démarre
      repliée puis affiche son résumé (« — Poids : 70 kg, Taille : 178 cm,
      IMC : 22.1 kg/m² ») dès que le poids/la taille sont pré-remplis depuis
      la fiche patient (l'auto-remplissage a lieu après le premier rendu, donc
      trop tard pour influencer l'état initial replié/déplié — repliée quand
      même) ; à l'édition d'une consultation déjà enregistrée avec diagnostic,
      la section Diagnostic démarre en revanche dépliée, Anamnèse (vide)
      reste repliée.
- [x] **L16.3** Ordre déjà correct, reconfirmé en live après le découpage
      (`ConsultationFormFields.tsx`) : Motif → Anamnèse → Constantes → Examen
      clinique → Diagnostic → Traitement → Examens complémentaires → Plan /
      conduite à tenir.
- [x] **L16.4** Déjà satisfait pour toutes les listes répétables (diagnostics
      secondaires, lignes de traitement, examens complémentaires) ; renforcé
      structurellement par L16.2, puisque désormais Constantes et Diagnostic
      eux-mêmes ne s'affichent plus tant que leur section n'est pas dépliée.
- [x] **L16.5** `ConsultationForm.tsx` (545 lignes) éclaté en quatre fichiers,
      tous sous ~250 lignes : `ConsultationForm.tsx` (207 lignes, conteneur —
      mise en page à deux colonnes + assemblage des dialogues et de la barre
      d'actions), `ConsultationFormFields.tsx` (240 lignes, la carte de
      saisie avec les 8 sections dans l'ordre imposé), `ConsultationFormHeader.tsx`
      (55 lignes, en-tête retour/titre/Imprimer/Résumé), et un nouveau hook
      `useConsultationFormOrchestration.ts` (170 lignes, tout l'état et les
      gestionnaires de L14/L15 : brouillon, raccourcis clavier, sauvegarde
      automatique, validation avant clôture, facturation). `ConsultationFormData`
      (dupliquée jusqu'ici) déplacée dans `consultationMappers.tsx` et
      importée par les trois fichiers qui en ont besoin.

---

## L17 — Tests, build et vérification

> **Constat de départ** : ce projet a écrit les tests de chaque bloc au
> moment de son lot, pas en différé — L17.1/L17.2/L17.3 étaient donc déjà
> couverts avant même l'ouverture de ce lot. Le travail réel de L17 était le
> seul vrai trou : une non-régression explicite sur une consultation
> antérieure à la migration des blocs structurés (L17.4), puis la passe de
> vérification finale complète (L17.5/L17.6).

- [x] **L17.1** Déjà couvert par `ConsultationService.test.ts` (écrit dès L0/L8/
      L9) : round-trip JSON complet (`round-trips the structured clinical
      blocks...`), tolérance au JSON corrompu (`tolerates corrupted JSON in a
      clinical column...`), recomposition des champs hérités dans les deux
      sens (`recomposes the legacy diagnostic and traitement fields...` /
      `still accepts the flat legacy diagnostic/traitement fields...`).
- [x] **L17.2** Déjà couvert par `vitals.test.ts` (écrit en L5) : IMC
      (`calculateBmi`/`interpretBmi`, les 6 tranches OMS) et tous les seuils
      d'anormalité d'`evaluateVitals` (fièvre/hypothermie, brady/tachycardie
      avec seuils différenciés enfant/adulte, tachypnée, désaturation,
      hyper/hypotension avec exclusion pédiatrique, hypo/hyperglycémie).
- [x] **L17.3** Déjà couvert par `treatment.test.ts` (écrit en L9) :
      `calculateQuantity` (L9.5) avec ses cas limites (posologie/forme/
      fréquence absente, fréquence non interprétable → `null`).
- [x] **L17.4** Deux nouveaux tests de non-régression, un par bout de la
      chaîne : côté service, `ConsultationService.test.ts` insère une ligne
      brute ne portant que les colonnes héritées `diagnostic`/`traitement`
      (aucun bloc JSON structuré, comme une vraie consultation d'avant L8/L9
      sur une base migrée), puis vérifie qu'elle reste lisible par id et par
      liste, et modifiable (ajouter un bloc structuré recompose le champ
      hérité sans échouer). Côté renderer, nouveau fichier
      `consultationMappers.test.ts` couvrant `resolveDiagnostics`/
      `resolveTreatmentLines` — jusqu'ici jamais testées isolément bien
      qu'utilisées par le formulaire d'édition, l'aperçu d'impression et
      l'écran récapitulatif depuis L8/L9/L13/L15 : repli sur le texte hérité
      quand le bloc structuré est absent, priorité au bloc structuré quand
      les deux existent, structure vide quand ni l'un ni l'autre. Complété par
      une vérification live de bout en bout (lecture, édition, impression
      réelles) — voir la note d'environnement en tête de fichier.
- [x] **L17.5** `npm run build` (renderer + main + preload) et `npm test` verts
      — 174/174 tests, aucune nouvelle erreur `tsc --noEmit`/`eslint`.
- [x] **L17.6** Vérification complète dans l'application Electron réelle, sur
      une **copie** de la base réelle (jamais l'original — voir note
      d'environnement en tête de fichier pour le détail du mécanisme et sa
      confirmation). Parcours de bout en bout exercé sur une seule
      consultation réelle : sélection patient → remplissage des 8 sections
      dans l'ordre imposé (L16.3) → génération d'une ordonnance → brouillon
      automatique → clôture avec avertissement/validation (L15.1) → écran
      récapitulatif (L15.7) → facturation (L15.6) → retour à la liste →
      vérification du rattachement au dossier patient (consultation,
      ordonnance et document tous visibles dans les onglets correspondants).
      Puis un second passage ciblé sur une consultation « pré-migration »
      simulée via l'API (uniquement les champs hérités) : listée et lue
      correctement, diagnostic/traitement hérités recomposés dans le
      formulaire d'édition, aperçu d'impression rendu sans accroc. Zéro
      erreur console sur l'ensemble de la session.

---

## Ordre d'exécution recommandé

```
L0 ──► L1 ──► L2 ──► L3 ─────────────────────┐
                                             ├──► L13 ──► L14 ──► L15 ──► L17
L4 ─ L5 ─ L6 ─ L7 ─ L8 ─ L9 ─ L10 ─ L11 ─ L12┘
                                             (L16 appliqué au fil de l'eau)
```

L0 conditionne tout le reste. L1 à L3 sont livrables et vérifiables
indépendamment — ils donnent un résultat visible dès la première itération.
L4 à L12 sont des sections autonomes, réalisables dans n'importe quel ordre.
L13 à L15 supposent que les sections existent. L16 est appliqué au fil de l'eau
puis consolidé à la fin.

## Points à trancher

1. 🔒 Répertoire national des médicaments : fichier officiel complet à fournir
   (639 présentations aujourd'hui).
2. 🔒 CIM-10 : sous-ensemble curé de médecine générale, ou nomenclature complète ?
3. Barre d'actions : proposée en bas (L14.1) — à revoir après essai réel.
