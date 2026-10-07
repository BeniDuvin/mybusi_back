# MyBusi Backend — API de gestion commerciale multi-boutiques

API de MyBusi développée avec **NestJS**, **PostgreSQL** et **Prisma** pour la gestion commerciale de boutiques.

## MyBusi — authentification, boutiques et abonnements

`Depot` est conservé comme nom de modèle pour préserver les données et API existantes; il représente désormais une boutique. Les routes sont accessibles avec les préfixes `/api/v1/stores` (nouveau) et `/api/v1/depots` (compatibilité).

- Un compte créé par email reçoit un OTP de vérification via SMTP; l'API ne délivre la session qu'après validation.
- Les routes email `POST /api/v1/auth/email/verify`, `/email/resend`, `/password/forgot` et `/password/reset` utilisent des OTP hachés, expirant après dix minutes avec cinq tentatives maximum.
- La première boutique créée par un utilisateur lui attribue le rôle `ADMINISTRATEUR` et ouvre une période d'essai de trois mois.
- Les routes de produits, stocks, ventes, achats, clients, fournisseurs et finances vérifient l'appartenance à la boutique et appliquent son statut d'abonnement aux écritures.
- `GET /api/v1/stores/:id/members` et `GET /api/v1/stores/:id/subscription` exposent les membres et le statut de l'abonnement aux membres autorisés.
- Les paiements SaaS sont historisés. L'intégration K-Pay attend sa documentation officielle; aucun endpoint de paiement n'est simulé.

Créer `.env` à partir de `.env.example`, configurer un SMTP fonctionnel, puis appliquer la migration avec `npm run prisma:deploy`. La migration conserve les données; les boutiques historiques reçoivent 90 jours d'accès `LEGACY` et leur membre le plus ancien devient propriétaire. Les clients et fournisseurs existants sont rattachés à la boutique de leur première vente/commande lorsqu'elle existe.

Les contrats d'API existants restent disponibles dans Swagger à `/api/docs`. Les clients doivent fournir `depotId` pour les listes et créations associées à une boutique.

## 📋 Table des matières

- [Fonctionnalités](#-fonctionnalités)
- [Technologies utilisées](#-technologies-utilisées)
- [Prérequis](#-prérequis)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Démarrage](#-démarrage)
- [Documentation API](#-documentation-api)
- [Structure du projet](#-structure-du-projet)
- [Scripts disponibles](#-scripts-disponibles)

## ✨ Fonctionnalités

### 🔐 Authentification & Autorisation
- ✅ Authentification par email/mot de passe
- ✅ Authentification par téléphone avec OTP
- ✅ Google OAuth
- ✅ JWT tokens (access & refresh)
- ✅ Gestion des rôles (Admin, Gérant, Caissier, Client)
- ✅ Guards et decorators pour la sécurité

### 🏢 Gestion des dépôts
- ✅ CRUD complet des dépôts
- ✅ Affectation des utilisateurs aux dépôts

### 📦 Gestion des produits
- ✅ CRUD produits, catégories, marques
- ✅ Gestion du stock par dépôt
- ✅ Entrée/sortie/ajustement de stock
- ✅ Alertes de stock faible
- ✅ Historique des mouvements de stock

### 💰 Gestion des ventes
- ✅ Création de ventes avec lignes de vente
- ✅ Gestion des paiements (Cash, Mobile Money, Virement, Crédit)
- ✅ Support Mobile Money (Orange, MTN, Moov, Wave)
- ✅ Historique des ventes
- ✅ Rapports de ventes

### 👥 Gestion des clients
- ✅ CRUD clients
- ✅ Historique des commandes
- ✅ Statistiques par client
- ✅ Gestion des créances

### 🏭 Gestion des fournisseurs & Achats
- ✅ CRUD fournisseurs
- ✅ Création de commandes d'achat
- ✅ Paiements fournisseurs
- ✅ Gestion des dettes
- ✅ Réception de stock automatique

### 💼 Finance & Comptabilité
- ✅ Tableau de bord financier
- ✅ Rapports de trésorerie
- ✅ Gestion des dépenses
- ✅ Paiement des salaires
- ✅ Statistiques en temps réel

### 🧾 Génération de documents
- ✅ Factures PDF format A4
- ✅ Factures thermiques 58mm
- ✅ Factures thermiques 80mm

### 📝 Audit & Logs
- ✅ Journal d'activités complet
- ✅ Traçabilité de toutes les actions
- ✅ Filtres avancés

## 🛠 Technologies utilisées

- **NestJS** - Framework Node.js progressif
- **PostgreSQL** - Base de données relationnelle
- **Prisma** - ORM moderne pour Node.js
- **TypeScript** - Typage statique
- **Passport** - Authentification
- **JWT** - Tokens sécurisés
- **Swagger** - Documentation API
- **PDFKit** - Génération de PDF
- **Bcrypt** - Hachage de mots de passe
- **Class Validator** - Validation des DTOs

## 📦 Prérequis

- Node.js >= 18.x
- npm ou yarn
- PostgreSQL >= 14.x

## 🚀 Installation

```bash
npm install
```

## ⚙️ Configuration

1. Copiez le fichier d'exemple :
```bash
cp env.example .env
```

2. Configurez vos variables d'environnement dans `.env`

## 🎯 Démarrage

### 1. Générer le client Prisma
```bash
npm run prisma:generate
```

### 2. Exécuter les migrations
```bash
npm run prisma:migrate
```

### 3. Insérer les données de test
```bash
npm run prisma:seed
```

### 4. Lancer l'application

**Mode développement :**
```bash
npm run start:dev
```

L'API sera accessible sur :
- API : `http://localhost:3000/api/v1`
- Documentation Swagger : `http://localhost:3000/api/docs`

## 📚 Documentation API

### Swagger UI
Documentation interactive : `http://localhost:3000/api/docs`

### Documentation des endpoints
Consultez [API_ENDPOINTS.md](./API_ENDPOINTS.md) pour la liste complète.

### Compte de test
```
Email: admin@mybusi.app
Password: admin123
Role: ADMIN
```

## 📁 Structure du projet

```
src/
├── auth/          # Authentification
├── depot/         # Dépôts
├── product/       # Produits/Catégories/Marques
├── stock/         # Gestion de stock
├── sale/          # Ventes et paiements
├── client/        # Clients
├── purchase/      # Achats et fournisseurs
├── finance/       # Finance et rapports
├── log/           # Logs et audit
├── invoice/       # Génération de factures
└── prisma/        # Module Prisma
```

## 🔧 Scripts disponibles

```bash
npm run start:dev              # Lancer en mode watch
npm run build                  # Compiler + Prisma generate
npm run start:prod             # Migrations + lancer en production
npm run prisma:generate        # Générer le client Prisma
npm run prisma:migrate         # Exécuter les migrations (dev)
npm run prisma:deploy          # Appliquer les migrations (prod)
npm run prisma:seed            # Insérer les données de test
npm run prisma:studio          # Ouvrir Prisma Studio
npm run test                   # Exécuter les tests
npm run lint                   # Linter le code
```

## 🚀 Déploiement (Railway, Render, etc.)

### Variables d'environnement requises

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | URL PostgreSQL (fournie par Railway/Render) |
| `JWT_SECRET` | Secret pour signer les JWT |
| `PORT` | Port du serveur (fourni par la plateforme) |
| `CORS_ORIGIN` | (Optionnel) URLs autorisées séparées par des virgules, ex: `https://app.mybusi.app` |

### Commandes de déploiement

1. **Build** : `npm run build` (génère Prisma + compile NestJS)
2. **Start** : `npm run start:prod` (applique les migrations puis démarre l'API)

> `start:prod` exécute automatiquement `prisma migrate deploy` avant de lancer le serveur pour synchroniser la BD avec le schéma.

## 📄 Licence

MIT

---

**Développé avec ❤️ par BENSOFTCG**
