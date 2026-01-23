# 🍾 MyDepot Backend - API de Gestion de Dépôt de Boisson

API complète développée avec **NestJS**, **PostgreSQL**, et **Prisma** pour la gestion d'un dépôt de boisson.

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
Email: admin@mydepot.com
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
npm run build                  # Compiler le projet
npm run start:prod             # Lancer en production
npm run prisma:generate        # Générer le client Prisma
npm run prisma:migrate         # Exécuter les migrations
npm run prisma:seed            # Insérer les données de test
npm run prisma:studio          # Ouvrir Prisma Studio
npm run test                   # Exécuter les tests
npm run lint                   # Linter le code
```

## 📄 Licence

MIT

---

**Développé avec ❤️ par MyDepot Team**
