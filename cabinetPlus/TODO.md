# MugiDoc — To-do list de corrections

> Analyse initiale du 19/08/2026. **Traitée le 22/08/2026** — tous les points
> sont faits et vérifiés dans l'application réelle (Electron piloté via CDP).

---

## 🔴 1. KPI du tableau de bord vides ✅

- [x] Diagnostic : ce n'était **pas** `better-sqlite3` (il était bien compilé
      pour Electron, ABI 136). La couche IPC renvoyait des données correctes.
- [x] Cause réelle : `loading` restait bloqué à `true` dans
      `useDashboardStats`, et l'objet `user` recréé à chaque récupération du
      profil relançait l'effet en boucle (d'où le clignotement).
- [x] `try/finally` : la sortie de l'état « chargement » est désormais garantie.
- [x] Dépendance sur `user?.id` au lieu de l'objet `user`.
- [x] Une fois les données obtenues, elles ne sont plus jamais effacées
      (`hasLoadedOnce`).
- [x] Chargement par bloc (`settle`) : un service en échec ne remet plus tout à zéro.
- [x] `main.ts` : dialogue d'erreur explicite si le démarrage est dégradé.

**Vérifié en réel :** 9 RDV · 1 en salle · 0 consultation · 16 patients ·
20 000 DA — stable sur 13 mesures consécutives, aucun clignotement.

---

## 🟠 2. Clôture de consultation non répercutée ✅

- [x] Nouveau hook `useConsultationClosure` : entrée salle d'attente → `termine`
- [x] Rendez-vous correspondant → `terminé` (avec repli sur le RDV du jour,
      le parcours salle d'attente ne transmettant pas d'identifiant)
- [x] `triggerDashboardUpdate` réparé — il passait par un `require()`
      inopérant dans le bundle ESM et n'était donc **jamais** appelé.
      Remplacé par `useDataUpdateOptional()`.
- [x] Deux références mortes corrigées au passage (`getPatientById`,
      `getAppointmentsByPatient` n'étaient pas importées).

---

## 🟠 3. Limite de 6 médicaments ✅

- [x] Constante partagée `MAX_MEDICATIONS = 6` (`src/renderer/constants/prescriptions.ts`)
- [x] Appliquée dans les 4 fichiers (6 / 8 / 8 / aucune → 6 partout)
- [x] Limite ajoutée à l'ordonnance rapide (bouton désactivé + mention « Max 6 »)

---

## 🟠 4. Logique de dette ✅

### 4a. Sémantique de `debt_amount`

- [x] Sens canonique fixé et documenté dans `shared/types.ts` : **reste à payer**
- [x] Audit de la base : **aucune donnée faussée** (1 dette, cohérente).
      `PaymentsSection` convertissait déjà correctement — le défaut réel était
      l'ambiguïté de nommage, pas les données.
- [x] Champ du formulaire renommé `paid_amount` (montant déjà réglé), distinct
      au niveau du type de `Payment.debt_amount`
- [x] Conversion bornée via `remainingDebt()` : plus de dette négative possible
- [x] **Vrai bug comptable trouvé dans `QuickPaymentModal`** : il stockait
      `amount = part encaissée` au lieu du total, rendant `amount - debt_amount`
      négatif et faussant les revenus du mois. Corrigé.

### 4b. Rappel de dette

- [x] `PatientDebtAlert` sur la fiche patient (`PatientDetail.tsx`)
- [x] Même rappel à la sélection du patient en consultation (`ConsultationForm.tsx`)

---

## 🟡 5. Ordonnances prédéfinies retirées ✅

- [x] `prescriptionPresets.ts` supprimé (309 lignes)
- [x] `PrescriptionModelSelectDialog` : un seul onglet, modèles du médecin
- [x] `PrescriptionQuickModal` nettoyé — charge désormais vos modèles enregistrés
- [x] `PrescriptionForm` nettoyé

---

## 🟡 6. Salle d'attente : logo + pied de page ✅

- [x] Logo retiré : `WaitingRoomDisplayPage.tsx`
- [x] Logo retiré : `WaitingRoomDisplayModal.tsx`
- [x] « Cabinet Médical MugiDoc » → nom du cabinet + nom du médecin (4 emplacements)
- [x] Décision : pied de page du Dashboard **laissé tel quel** (écran du
      praticien, `cabinetInfo.name` prime déjà quand il est renseigné)

---

## 🟢 7. Interface Certificat ✅

- [x] Fenêtre agrandie : **96 % × 94 %** de l'écran (contre ~50 % avant)
- [x] Formulaire en deux colonnes (paramètres / rédaction), zone de texte 380 px
- [x] En-tête et pied fixes, contenu central défilant
- [x] Cards des modèles refaites en vrais `<button>` accessibles, avec
      sous-titre, icône en pastille et état de survol
- [x] Zone vide sous la grille remplacée par un panneau « Derniers délivrés »
- [x] Bug corrigé : `patient.birth_date` → `date_of_birth` (date de naissance
      affichait « N/A »)

---

## 🟢 8. Fenêtre d'encaissement ✅

- [x] Factorisation : `PaymentCollectForm` partagé — 782 → 625 lignes
- [x] Actions regroupées : option d'impression rattachée au bloc d'actions,
      une seule action principale portant le montant

---

## 🔧 Corrections complémentaires du 22/08/2026

### Recherche patients incomplète ✅
`PatientCombobox` empilait deux filtres (le sien + celui de cmdk), aucun ne
gérant les accents, et ne cherchait que sur prénom **ou** nom séparément.
- [x] `shouldFilter={false}` sur `<Command>` — un seul filtre
- [x] Recherche insensible aux accents (`\p{Diacritic}`) et par mots

**Vérifié en réel :** `benali`, `Bénali`, `ryad benali`, `benali ryad`,
`BENBEKHTI`, `gaouar mohamed` → tous trouvent la bonne fiche.

### Sauvegarde d'une ordonnance comme modèle ✅
`window.prompt()` n'est pas implémenté dans Electron : il renvoyait toujours
`null`, la sauvegarde était abandonnée sans le moindre message.
- [x] Remplacé par `SaveTemplateDialog` (nom + description + récapitulatif)
- [x] Suggestion de posologie vérifiée intacte avant et après

### Encaissement d'une dette partielle ✅
La fenêtre ignorait les versements antérieurs et réclamait la facture entière.
- [x] Modèle à trois quantités : total / déjà réglé / versé aujourd'hui
- [x] Calcul extrait en fonction pure `computeCollection()` — **17 tests**

**Vérifié en réel** sur la dette existante (2 500 DA, 1 000 déjà réglés) :
« Déjà réglé 1 000 DA · Reste dû 1 500 DA » et le bouton propose
**Encaisser 1 500 DA**. Versement partiel de 500 → reste 1 000, statut
« Dette (partiel) ». Saisie supérieure au reste dû → refusée.

---

## État de la vérification

| Contrôle | Résultat |
|---|---|
| `npm run build` | ✅ renderer + main + preload |
| `npm test` | ✅ 35 tests (18 existants + 17 nouveaux) |
| `tsc --noEmit` | 49 erreurs, **toutes préexistantes** (alias `@/shared/types`) |
| Application réelle | ✅ pilotée via CDP, aucune donnée de production modifiée |

> ⚠️ Rappel : `npm test` recompile `better-sqlite3` pour Node. Relancez
> `npm run electron:rebuild` (ou `npx electron-rebuild -f -w better-sqlite3`)
> avant de redémarrer l'application.
