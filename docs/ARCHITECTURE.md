# 🏗️ Architecture du Projet MyDepot Backend

## 📊 Vue d'ensemble

Ce backend suit une architecture modulaire basée sur NestJS avec :
- **12 modules fonctionnels** indépendants
- **15+ entités Prisma** avec relations
- **100+ endpoints REST** documentés
- **Authentification multi-méthodes** (Email, Phone OTP, Google OAuth)
- **Système de rôles** (ADMIN, GERANT, CAISSIER, CLIENT)

---

## 🗂️ Structure des modules

### 1. 🔐 Module Auth (`src/auth/`)
**Responsabilité** : Authentification et autorisation

**Composants** :
- `auth.service.ts` : Logique d'authentification
- `auth.controller.ts` : Endpoints auth
- `strategies/jwt.strategy.ts` : Stratégie JWT
- `strategies/google.strategy.ts` : Stratégie Google OAuth
- `guards/roles.guard.ts` : Guard de vérification des rôles
- `decorators/get-user.decorator.ts` : Decorator pour récupérer l'utilisateur
- `decorators/roles.decorator.ts` : Decorator pour définir les rôles requis
- `services/otp.service.ts` : Gestion des codes OTP

**Endpoints** :
- `POST /auth/register` - Inscription
- `POST /auth/login` - Connexion
- `POST /auth/otp/send` - Envoyer OTP
- `POST /auth/otp/verify` - Vérifier OTP
- `GET /auth/google` - OAuth Google
- `POST /auth/refresh` - Rafraîchir le token
- `POST /auth/logout` - Déconnexion
- `GET /auth/me` - Profil utilisateur

---

### 2. 🏢 Module Depot (`src/depot/`)
**Responsabilité** : Gestion des dépôts et affectation des utilisateurs

**Composants** :
- `depot.service.ts` : Logique CRUD dépôts
- `depot.controller.ts` : Endpoints dépôts

**Endpoints** :
- `POST /depots` - Créer un dépôt
- `GET /depots` - Liste des dépôts (pagination)
- `GET /depots/:id` - Détails d'un dépôt
- `PATCH /depots/:id` - Modifier un dépôt
- `DELETE /depots/:id` - Supprimer un dépôt
- `POST /depots/assign-user` - Affecter un utilisateur
- `DELETE /depots/:depotId/users/:userId` - Retirer un utilisateur

**Rôles requis** : ADMIN, GERANT

---

### 3. 📦 Module Product (`src/product/`)
**Responsabilité** : Gestion des produits, catégories et marques

**Composants** :
- `product.service.ts` : Logique CRUD produits
- `product.controller.ts` : Endpoints produits
- `category.service.ts` : Logique CRUD catégories
- `category.controller.ts` : Endpoints catégories
- `brand.service.ts` : Logique CRUD marques
- `brand.controller.ts` : Endpoints marques

**Endpoints produits** :
- `POST /products` - Créer un produit
- `GET /products` - Liste avec filtres
- `GET /products/low-stock` - Produits en stock faible
- `GET /products/:id` - Détails
- `PATCH /products/:id` - Modifier
- `DELETE /products/:id` - Supprimer

**Endpoints catégories** :
- `POST /categories` - Créer
- `GET /categories` - Liste
- `PATCH /categories/:id` - Modifier
- `DELETE /categories/:id` - Supprimer

**Endpoints marques** :
- `POST /brands` - Créer
- `GET /brands` - Liste
- `PATCH /brands/:id` - Modifier
- `DELETE /brands/:id` - Supprimer

---

### 4. 📊 Module Stock (`src/stock/`)
**Responsabilité** : Gestion des stocks et mouvements

**Composants** :
- `stock.service.ts` : Gestion des stocks
- `stock.controller.ts` : Endpoints stock

**Endpoints** :
- `GET /stock/:productId/:depotId` - Stock d'un produit
- `GET /stock/depot/:depotId` - Tous les stocks d'un dépôt
- `POST /stock/add` - Ajouter du stock
- `POST /stock/remove` - Retirer du stock
- `POST /stock/adjust` - Ajuster le stock
- `GET /stock/movements/:stockId` - Historique des mouvements
- `GET /stock/alerts/low-stock` - Alertes stock faible

**Automatisations** :
- Mise à jour automatique lors des ventes
- Mise à jour automatique lors des achats
- Historique des mouvements

---

### 5. 💰 Module Sale (`src/sale/`)
**Responsabilité** : Gestion des ventes et paiements

**Composants** :
- `sale.service.ts` : Logique des ventes
- `sale.controller.ts` : Endpoints ventes
- `payment.service.ts` : Logique des paiements
- `payment.controller.ts` : Endpoints paiements

**Endpoints ventes** :
- `POST /sales` - Créer une vente
- `GET /sales` - Liste avec filtres
- `GET /sales/report` - Rapport des ventes
- `GET /sales/:id` - Détails
- `PATCH /sales/:id` - Modifier
- `POST /sales/:id/cancel` - Annuler

**Endpoints paiements** :
- `POST /payments` - Créer un paiement
- `GET /payments` - Liste avec filtres
- `GET /payments/:id` - Détails
- `POST /payments/:id/verify` - Vérifier Mobile Money

**Fonctionnalités** :
- Déduction automatique du stock
- Support Multi-paiements
- Mobile Money (Orange, MTN, Moov, Wave)
- Gestion des créances

---

### 6. 👥 Module Client (`src/client/`)
**Responsabilité** : Gestion des clients

**Composants** :
- `client.service.ts` : Logique CRUD clients
- `client.controller.ts` : Endpoints clients

**Endpoints** :
- `POST /clients` - Créer un client
- `GET /clients` - Liste avec recherche
- `GET /clients/:id` - Détails
- `GET /clients/:id/stats` - Statistiques
- `PATCH /clients/:id` - Modifier
- `DELETE /clients/:id` - Supprimer

---

### 7. 🏭 Module Purchase (`src/purchase/`)
**Responsabilité** : Gestion des achats et fournisseurs

**Composants** :
- `purchase.service.ts` : Logique des achats
- `purchase.controller.ts` : Endpoints achats
- `supplier.service.ts` : Logique CRUD fournisseurs
- `supplier.controller.ts` : Endpoints fournisseurs

**Endpoints achats** :
- `POST /purchases` - Créer un achat
- `GET /purchases` - Liste avec filtres
- `GET /purchases/:id` - Détails
- `PATCH /purchases/:id` - Modifier
- `POST /purchases/:id/pay` - Payer un achat

**Endpoints fournisseurs** :
- `POST /suppliers` - Créer
- `GET /suppliers` - Liste
- `GET /suppliers/:id` - Détails avec historique
- `PATCH /suppliers/:id` - Modifier
- `DELETE /suppliers/:id` - Supprimer

**Automatisations** :
- Ajout automatique au stock
- Mise à jour des dettes fournisseurs

---

### 8. 💼 Module Finance (`src/finance/`)
**Responsabilité** : Rapports financiers, dépenses et salaires

**Composants** :
- `finance.service.ts` : Rapports financiers
- `finance.controller.ts` : Endpoints finance
- `expense.service.ts` : Gestion des dépenses
- `expense.controller.ts` : Endpoints dépenses
- `salary.service.ts` : Gestion des salaires
- `salary.controller.ts` : Endpoints salaires

**Endpoints finance** :
- `GET /finance/summary` - Résumé financier
- `GET /finance/cashflow` - Rapport de trésorerie
- `GET /finance/dashboard` - Statistiques dashboard

**Endpoints dépenses** :
- `POST /expenses` - Créer une dépense
- `GET /expenses` - Liste avec filtres
- `PATCH /expenses/:id` - Modifier
- `DELETE /expenses/:id` - Supprimer

**Endpoints salaires** :
- `POST /salaries` - Payer un salaire
- `GET /salaries` - Liste
- `PATCH /salaries/:id` - Modifier
- `DELETE /salaries/:id` - Supprimer

---

### 9. 📝 Module Log (`src/log/`)
**Responsabilité** : Audit et journalisation des actions

**Composants** :
- `log.service.ts` : Enregistrement des logs
- `log.controller.ts` : Endpoints logs

**Endpoints** :
- `GET /logs` - Liste des logs avec filtres

**Informations enregistrées** :
- Utilisateur
- Dépôt
- Action effectuée
- Entité concernée
- Détails de l'action
- Date et heure
- IP et User Agent

---

### 10. 🧾 Module Invoice (`src/invoice/`)
**Responsabilité** : Génération de factures PDF

**Composants** :
- `invoice.service.ts` : Logique de génération
- `invoice.controller.ts` : Endpoints factures
- `pdf.service.ts` : Service de génération PDF

**Endpoints** :
- `GET /invoices/generate/:saleId?format=A4` - Générer facture
- `GET /invoices/:invoiceNumber` - Télécharger facture

**Formats supportés** :
- A4 (210x297mm)
- Thermique 58mm
- Thermique 80mm

---

### 11. 🗄️ Module Prisma (`src/prisma/`)
**Responsabilité** : Connexion à la base de données

**Composants** :
- `prisma.service.ts` : Service Prisma global
- `prisma.module.ts` : Module global

**Fonctionnalités** :
- Connexion à PostgreSQL
- Déconnexion automatique
- Transactions
- Relations complexes

---

## 🗃️ Modèle de données (Prisma Schema)

### Entités principales

1. **User** - Utilisateurs du système
2. **Depot** - Dépôts/magasins
3. **UserDepot** - Relation utilisateurs-dépôts
4. **Category** - Catégories de produits
5. **Brand** - Marques
6. **Product** - Produits
7. **Stock** - Stocks par produit/dépôt
8. **StockMovement** - Mouvements de stock
9. **Client** - Clients
10. **Sale** - Ventes
11. **SaleLine** - Lignes de vente
12. **Payment** - Paiements
13. **Supplier** - Fournisseurs
14. **Purchase** - Achats
15. **PurchaseLine** - Lignes d'achat
16. **Expense** - Dépenses
17. **SalaryPayment** - Paiements de salaires
18. **FinancialTransaction** - Transactions financières
19. **Log** - Logs d'activités
20. **Invoice** - Factures générées

### Enums

- **Role** : ADMIN, GERANT, CAISSIER, CLIENT
- **PaymentMethod** : CASH, MOBILE_MONEY, BANK_TRANSFER, CREDIT
- **PaymentStatus** : PENDING, COMPLETED, FAILED, CANCELLED
- **TransactionType** : INCOME, EXPENSE
- **StockMovementType** : IN, OUT, ADJUSTMENT
- **MobileMoneyProvider** : ORANGE_MONEY, MTN_MONEY, MOOV_MONEY, WAVE

---

## 🔒 Système de sécurité

### Guards

1. **AuthGuard('jwt')** - Vérifie le token JWT
2. **RolesGuard** - Vérifie les rôles requis

### Decorators

1. **@Roles(...roles)** - Définit les rôles autorisés
2. **@GetUser()** - Récupère l'utilisateur connecté
3. **@ApiBearerAuth()** - Documentation Swagger

### Hiérarchie des rôles

```
ADMIN > GERANT > CAISSIER > CLIENT
```

**Permissions par rôle** :
- **ADMIN** : Tous les accès + gestion utilisateurs
- **GERANT** : Gestion dépôt, ventes, achats, stocks, rapports
- **CAISSIER** : Ventes, paiements, consultation stocks
- **CLIENT** : Consultation de ses propres commandes

---

## 🔄 Flux de données

### Flux d'une vente

```
1. POST /sales (Créer vente)
   ↓
2. Vérification stock disponible
   ↓
3. Création de la vente et lignes
   ↓
4. Déduction automatique du stock
   ↓
5. Enregistrement mouvement de stock
   ↓
6. POST /payments (Paiement optionnel)
   ↓
7. Mise à jour du statut de paiement
   ↓
8. GET /invoices/generate/:saleId (Facture)
```

### Flux d'un achat

```
1. POST /purchases (Créer achat)
   ↓
2. Création de l'achat et lignes
   ↓
3. Ajout automatique au stock
   ↓
4. Enregistrement mouvement de stock
   ↓
5. Mise à jour de la dette fournisseur
   ↓
6. POST /purchases/:id/pay (Paiement)
   ↓
7. Réduction de la dette
```

---

## 📚 Documentation

1. **README.md** - Documentation générale
2. **API_ENDPOINTS.md** - Liste complète des endpoints
3. **GETTING_STARTED.md** - Guide de démarrage rapide
4. **ARCHITECTURE.md** - Ce fichier
5. **Swagger UI** - Documentation interactive (`/api/docs`)

---

## 🧪 Tests

Structure des tests (à implémenter) :
```
test/
├── unit/          # Tests unitaires
├── integration/   # Tests d'intégration
└── e2e/           # Tests end-to-end
```

---

## 🚀 Déploiement

### Prérequis production

1. Node.js >= 18
2. PostgreSQL >= 14
3. Variables d'environnement configurées
4. Reverse proxy (Nginx recommandé)
5. SSL/TLS (Let's Encrypt)

### Build de production

```bash
npm run build
npm run start:prod
```

---

**Architecture conçue pour être scalable, maintenable et sécurisée 🏗️**
