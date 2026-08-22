# CabinetPlus - Système de Gestion de Cabinet Médical

## 📋 Description

**CabinetPlus** est une application desktop moderne et complète développée avec Electron, conçue pour aider les médecins à gérer efficacement leur cabinet médical. Cette solution offre une interface intuitive et sécurisée pour la gestion des patients, des rendez-vous, des consultations, des paiements et des ordonnances.

L'application utilise une base de données SQLite locale pour garantir la confidentialité des données médicales et fonctionne entièrement hors ligne.

## ✨ Fonctionnalités Principales

### 🔐 Authentification Sécurisée
- Interface de connexion personnalisée avec logo CabinetPlus
- Système d'authentification local sécurisé
- Compte administrateur par défaut (admin/admin)
- Possibilité de modifier les identifiants de connexion

### 👥 Gestion des Patients
- **Création de dossiers patients** : Informations complètes (nom, prénom, âge, téléphone, email, adresse)
- **Recherche avancée** : Filtrage par nom, téléphone ou email
- **Historique médical** : Notes médicales et informations importantes
- **Interface intuitive** : Cartes visuelles avec informations essentielles
- **Modification et suppression** : Gestion complète des dossiers

### 📅 Planning & Rendez-vous
- **Vue multiple** : Liste détaillée et vue calendrier
- **Planification flexible** : Créneaux horaires de 8h à 18h
- **Types de consultation** : Consultation générale, cardiologie, dermatologie, pédiatrie, urgence, suivi, vaccination
- **Gestion des statuts** : Confirmé, en attente, annulé, terminé
- **Notifications visuelles** : Badges colorés selon le statut
- **Statistiques quotidiennes** : Aperçu des rendez-vous du jour

### 🩺 Consultations Médicales
- **Dossier de consultation complet** : Motif, diagnostic, traitement
- **Suivi des consultations** : Historique détaillé par patient
- **Gestion des prix** : Tarification flexible par consultation
- **Statuts de consultation** : Programmée, en cours, terminée
- **Notes médicales** : Espace pour observations détaillées

### 💰 Gestion Financière
- **Suivi des paiements** : Statuts (en attente, terminé, échoué, remboursé)
- **Méthodes de paiement** : Espèces, carte, chèque, virement
- **Paiements anonymes** : Support des patients sans dossier
- **Gestion des frais** : Suivi des dépenses du cabinet
- **Historique financier** : Transactions complètes avec filtrage

### 📊 Statistiques & Rapports
- **Tableaux de bord interactifs** : Graphiques en temps réel
- **Analyses financières** :
  - Revenus par période
  - Évolution des paiements
  - Répartition par méthode de paiement
  - Suivi des frais et dépenses
- **Statistiques patients** : Nombre total, nouveaux patients
- **Indicateurs de performance** : Consultations, rendez-vous

### ⚙️ Paramètres & Configuration
- **Informations du cabinet** : Nom, adresse, téléphone, email
- **Profil médecin** : Nom, spécialité, numéro de licence
- **Sauvegarde et restauration** : Backup automatique et manuel
- **Gestion des utilisateurs** : Modification des identifiants
- **Période d'essai** : 15 jours d'utilisation gratuite

## 🛠️ Technologies Utilisées

### Application Desktop
- **Electron** - Framework pour applications desktop multiplateformes
- **Node.js** - Environnement d'exécution JavaScript
- **TypeScript** - Typage statique pour plus de robustesse

### Base de Données
- **SQLite** - Base de données locale légère et performante
- **better-sqlite3** - Driver SQLite synchrone pour Node.js
- **Chiffrement AES** - Sécurisation des données sensibles

### Frontend (Renderer Process)
- **React 18** - Framework JavaScript moderne
- **Vite** - Build tool ultra-rapide
- **Tailwind CSS** - Framework CSS utilitaire
- **shadcn/ui** - Composants UI modernes et accessibles

### Bibliothèques Principales
- **React Hook Form** - Gestion des formulaires
- **date-fns** - Manipulation des dates
- **Lucide React** - Icônes modernes
- **Radix UI** - Composants primitifs accessibles
- **Supabase** - Services d'activation et validation

### Sécurité
- **bcrypt** - Hachage des mots de passe
- **crypto-js** - Chiffrement des données
- **Validation des licences** - Système d'activation intégré



## 🖥️ Interface Desktop

### Fenêtre Principale
- **Interface native** : Expérience desktop complète
- **Taille optimisée** : 1400x900 pixels (redimensionnable)
- **Icône personnalisée** : Logo CabinetPlus dans la barre des tâches
- **Menu masqué** : Interface épurée en mode production

### Navigation
- **Sidebar moderne** : Accès rapide à tous les modules
- **Tableau de bord** : Vue d'ensemble avec statistiques
- **Actions rapides** : Boutons pour créer patients, RDV, consultations
- **Thème sombre/clair** : Interface adaptative

## 🔧 Architecture Electron

```
src/
├── main/                    # Main Process (Backend)
│   ├── database/           # Services de base de données
│   │   ├── DatabaseService.ts     # Service principal SQLite
│   │   ├── PatientService.ts      # Gestion des patients
│   │   ├── AppointmentService.ts  # Gestion des RDV
│   │   ├── ConsultationService.ts # Gestion des consultations
│   │   ├── PaymentService.ts      # Gestion des paiements
│   │   ├── ExpenseService.ts      # Gestion des frais
│   │   ├── AuthService.ts         # Authentification
│   │   ├── ActivationService.ts   # Système d'activation
│   │   └── SettingsService.ts     # Paramètres et backup
│   └── main.ts             # Point d'entrée principal
├── preload/                # Preload Script
│   └── preload.ts         # Bridge IPC sécurisé
├── renderer/               # Renderer Process (Frontend)
│   ├── components/        # Composants React
│   ├── contexts/          # Contextes React
│   ├── hooks/             # Hooks personnalisés
│   └── assets/            # Ressources statiques
└── shared/                 # Types partagés
    └── types.ts           # Définitions TypeScript
```

## 🎯 Modules Détaillés

### Module Patients
- Création et modification de dossiers
- Recherche et filtrage avancés
- Historique médical complet
- Interface de gestion intuitive

### Module Rendez-vous
- Planification avec vue calendrier
- Gestion des créneaux horaires
- Types de consultation multiples
- Suivi des statuts en temps réel

### Module Consultations
- Saisie de diagnostics et traitements
- Historique des consultations
- Gestion des tarifs
- Notes médicales détaillées

### Module Paiements
- Suivi des paiements par patient ou anonymes
- Méthodes multiples (espèces, carte, chèque, virement)
- Gestion des statuts (en attente, terminé, échoué, remboursé)
- Historique financier complet avec filtres

### Module Frais
- Enregistrement des dépenses du cabinet
- Catégorisation des frais
- Suivi budgétaire
- Rapports de dépenses

### Module Statistiques
- Tableaux de bord en temps réel
- Analyses financières (revenus, dépenses)
- Statistiques patients et consultations
- Indicateurs de performance du cabinet

### Module Ordonnances
- Création d'ordonnances personnalisées
- Modèles d'ordonnances réutilisables
- Historique des prescriptions par patient
- Gestion des médicaments et posologies

## 🔒 Sécurité et Confidentialité

- **Données locales** : Toutes les données restent sur votre ordinateur
- **Base SQLite chiffrée** : Protection des informations sensibles
- **Authentification locale** : Pas de connexion internet requise
- **Backup sécurisé** : Sauvegardes chiffrées des données
- **Respect RGPD** : Contrôle total sur vos données médicales
- **Période d'essai** : 15 jours d'utilisation gratuite

## 💾 Installation et Utilisation

### Prérequis
- Windows 10/11, macOS 10.15+, ou Linux
- 4 Go de RAM minimum
- 500 Mo d'espace disque

### Installation
1. Téléchargez le fichier d'installation pour votre OS
2. Exécutez l'installateur
3. Lancez CabinetPlus
4. Connectez-vous avec admin/admin
5. Modifiez vos identifiants dans les paramètres

### Première utilisation
- **Compte par défaut** : admin/admin
- **Période d'essai** : 15 jours gratuits
- **Configuration** : Renseignez les informations de votre cabinet
- **Backup** : Configurez les sauvegardes automatiques



## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 📞 Support

Pour toute question ou support technique, n'hésitez pas à ouvrir une issue sur le repository.

---

**CabinetPlus** - Simplifiez la gestion de votre cabinet médical avec une solution moderne et intuitive.
