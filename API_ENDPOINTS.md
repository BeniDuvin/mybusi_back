# MyDepot API - Documentation des Endpoints pour le Frontend

**Base URL:** `http://localhost:3000/api/v1`  
**Documentation Swagger:** `http://localhost:3000/api/docs`

---

## 📌 Authentification

Tous les endpoints (sauf ceux d'authentification) nécessitent un token JWT dans le header :
```
Authorization: Bearer <votre_token>
```

### 1. Authentication Endpoints

#### POST `/auth/register`
Inscription d'un nouvel utilisateur
```json
{
  "email": "user@example.com",
  "phone": "+22505000000",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "CLIENT"
}
```

#### POST `/auth/login`
Connexion avec email/phone et mot de passe
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### POST `/auth/otp/send`
Envoyer un code OTP au numéro de téléphone
```json
{
  "phone": "+22505000000"
}
```

#### POST `/auth/otp/verify`
Vérifier le code OTP et se connecter
```json
{
  "phone": "+22505000000",
  "otpCode": "123456"
}
```

#### GET `/auth/google`
Initier l'authentification Google OAuth

#### GET `/auth/google/callback`
Callback Google OAuth

#### POST `/auth/refresh`
Rafraîchir le token d'accès
```json
{
  "userId": "user-id",
  "refreshToken": "refresh-token"
}
```

#### POST `/auth/logout`
Déconnexion (nécessite authentification)

#### GET `/auth/me`
Obtenir le profil de l'utilisateur connecté

---

## 👤 Utilisateurs (Admin)

#### GET `/users?page=1&limit=10&search=&role=&isActive=`
Obtenir la liste des utilisateurs (Admin uniquement)

#### GET `/users/:id`
Obtenir un utilisateur par ID (Admin uniquement)

#### PATCH `/users/:id`
Mettre à jour un utilisateur (role, isActive, profil)
```json
{
  "email": "user@example.com",
  "phone": "+22505000000",
  "firstName": "John",
  "lastName": "Doe",
  "role": "GERANT",
  "isActive": true
}
```

---

## 🏢 Dépôts

#### POST `/depots`
Créer un nouveau dépôt (Admin uniquement)
```json
{
  "name": "Dépôt Central",
  "address": "Abidjan, Cocody",
  "phone": "+22501020304",
  "email": "central@depot.com"
}
```

#### GET `/depots?page=1&limit=10&search=central`
Obtenir tous les dépôts avec pagination

#### GET `/depots/:id`
Obtenir un dépôt par ID

#### PATCH `/depots/:id`
Mettre à jour un dépôt (Admin uniquement)

#### DELETE `/depots/:id`
Supprimer un dépôt (Admin uniquement)

#### POST `/depots/assign-user`
Affecter un utilisateur à un dépôt
```json
{
  "userId": "user-id",
  "depotId": "depot-id"
}
```

#### DELETE `/depots/:depotId/users/:userId`
Retirer un utilisateur d'un dépôt

---

## 📦 Produits

#### POST `/products`
Créer un nouveau produit
```json
{
  "name": "Coca-Cola 33cl",
  "barcode": "CC33001",
  "sku": "COCA-33",
  "categoryId": "category-id",
  "brandId": "brand-id",
  "depotId": "depot-id",
  "purchasePrice": 200,
  "sellingPrice": 300,
  "minStock": 50
}
```

#### GET `/products?page=1&limit=10&search=coca&categoryId=&brandId=&depotId=&isActive=true`
Obtenir tous les produits avec filtres

#### GET `/products/low-stock?depotId=depot-id`
Obtenir les produits avec stock faible

#### GET `/products/:id`
Obtenir un produit par ID

#### PATCH `/products/:id`
Mettre à jour un produit

#### DELETE `/products/:id`
Supprimer un produit (Admin uniquement)

---

## 📂 Catégories

#### POST `/categories`
Créer une nouvelle catégorie
```json
{
  "name": "Boissons gazeuses",
  "description": "Sodas et boissons gazeuses"
}
```

#### GET `/categories`
Obtenir toutes les catégories

#### GET `/categories/:id`
Obtenir une catégorie par ID

#### PATCH `/categories/:id`
Mettre à jour une catégorie

#### DELETE `/categories/:id`
Supprimer une catégorie

---

## 🏷️ Marques

#### POST `/brands`
Créer une nouvelle marque
```json
{
  "name": "Coca-Cola",
  "description": "The Coca-Cola Company"
}
```

#### GET `/brands`
Obtenir toutes les marques

#### GET `/brands/:id`
Obtenir une marque par ID

#### PATCH `/brands/:id`
Mettre à jour une marque

#### DELETE `/brands/:id`
Supprimer une marque

---

## 📊 Stock

#### GET `/stock/:productId/:depotId`
Obtenir le stock d'un produit dans un dépôt

#### GET `/stock/depot/:depotId?page=1&limit=10`
Obtenir tous les stocks d'un dépôt

#### POST `/stock/add`
Ajouter du stock
```json
{
  "productId": "product-id",
  "depotId": "depot-id",
  "quantity": 50,
  "reason": "Réapprovisionnement",
  "reference": "REF-001"
}
```

#### POST `/stock/remove`
Retirer du stock
```json
{
  "productId": "product-id",
  "depotId": "depot-id",
  "quantity": 10,
  "reason": "Produit endommagé"
}
```

#### POST `/stock/adjust`
Ajuster le stock
```json
{
  "productId": "product-id",
  "depotId": "depot-id",
  "newQuantity": 100,
  "reason": "Inventaire physique"
}
```

#### GET `/stock/movements/:stockId?page=1&limit=10`
Obtenir l'historique des mouvements de stock

#### GET `/stock/alerts/low-stock?depotId=depot-id`
Obtenir les alertes de stock faible

---

## 💰 Ventes

#### POST `/sales`
Créer une nouvelle vente
```json
{
  "depotId": "depot-id",
  "clientId": "client-id",
  "lines": [
    {
      "productId": "product-id",
      "quantity": 5,
      "unitPrice": 300,
      "discount": 0
    }
  ],
  "discount": 0,
  "tax": 0,
  "notes": "Vente au comptant"
}
```

#### GET `/sales?page=1&limit=10&depotId=&clientId=&status=&startDate=&endDate=`
Obtenir toutes les ventes avec filtres

#### GET `/sales/report?depotId=&startDate=&endDate=`
Obtenir le rapport des ventes

#### GET `/sales/:id`
Obtenir une vente par ID

#### PATCH `/sales/:id`
Mettre à jour une vente

#### POST `/sales/:id/cancel`
Annuler une vente

---

## 💳 Paiements

#### POST `/payments`
Créer un nouveau paiement
```json
{
  "saleId": "sale-id",
  "amount": 1500,
  "method": "MOBILE_MONEY",
  "mobileMoneyProvider": "ORANGE_MONEY",
  "mobileMoneyNumber": "+22505000000",
  "reference": "REF-PAY-001"
}
```

#### GET `/payments?page=1&limit=10&saleId=&clientId=&method=&status=&startDate=&endDate=`
Obtenir tous les paiements avec filtres

#### GET `/payments/:id`
Obtenir un paiement par ID

#### POST `/payments/:id/verify`
Vérifier le statut d'un paiement Mobile Money

---

## 👥 Clients

#### POST `/clients`
Créer un nouveau client
```json
{
  "firstName": "Jean",
  "lastName": "Kouassi",
  "phone": "+22505555555",
  "email": "jean.kouassi@example.com",
  "address": "Abidjan, Marcory"
}
```

#### GET `/clients?page=1&limit=10&search=jean`
Obtenir tous les clients

#### GET `/clients/:id`
Obtenir un client par ID

#### GET `/clients/:id/stats`
Obtenir les statistiques d'un client

#### PATCH `/clients/:id`
Mettre à jour un client

#### DELETE `/clients/:id`
Supprimer un client

---

## 🏭 Fournisseurs

#### POST `/suppliers`
Créer un nouveau fournisseur
```json
{
  "name": "Société de Distribution SARL",
  "phone": "+22501111111",
  "email": "contact@distribution.ci",
  "address": "Abidjan, Zone Industrielle"
}
```

#### GET `/suppliers?page=1&limit=10&search=`
Obtenir tous les fournisseurs

#### GET `/suppliers/:id`
Obtenir un fournisseur par ID

#### PATCH `/suppliers/:id`
Mettre à jour un fournisseur

#### DELETE `/suppliers/:id`
Supprimer un fournisseur

---

## 🛒 Achats

#### POST `/purchases`
Créer un nouvel achat
```json
{
  "depotId": "depot-id",
  "supplierId": "supplier-id",
  "lines": [
    {
      "productId": "product-id",
      "quantity": 100,
      "unitPrice": 200
    }
  ],
  "notes": "Commande du mois",
  "deliveryDate": "2024-01-20"
}
```

#### GET `/purchases?page=1&limit=10&depotId=&supplierId=&status=`
Obtenir tous les achats

#### GET `/purchases/:id`
Obtenir un achat par ID

#### PATCH `/purchases/:id`
Mettre à jour un achat

#### POST `/purchases/:id/pay`
Payer un achat
```json
{
  "amount": 5000
}
```

---

## 💼 Finance

#### GET `/finance/summary?depotId=&startDate=&endDate=`
Obtenir le résumé financier

#### GET `/finance/cashflow?depotId=&startDate=&endDate=`
Obtenir le rapport de trésorerie

#### GET `/finance/dashboard?depotId=`
Obtenir les statistiques du tableau de bord

---

## 💸 Dépenses

#### POST `/expenses`
Créer une nouvelle dépense
```json
{
  "depotId": "depot-id",
  "category": "Électricité",
  "amount": 50000,
  "description": "Facture électricité du mois",
  "reference": "FACT-ELEC-001"
}
```

#### GET `/expenses?page=1&limit=10&depotId=&category=&startDate=&endDate=`
Obtenir toutes les dépenses

#### GET `/expenses/:id`
Obtenir une dépense par ID

#### PATCH `/expenses/:id`
Mettre à jour une dépense

#### DELETE `/expenses/:id`
Supprimer une dépense

---

## 💰 Salaires

#### POST `/salaries`
Créer un paiement de salaire
```json
{
  "userId": "user-id",
  "amount": 150000,
  "period": "Janvier 2024",
  "paymentDate": "2024-01-31",
  "notes": "Salaire du mois"
}
```

#### GET `/salaries?page=1&limit=10&userId=&period=&startDate=&endDate=`
Obtenir tous les paiements de salaire

#### GET `/salaries/:id`
Obtenir un paiement de salaire par ID

#### PATCH `/salaries/:id`
Mettre à jour un paiement de salaire

#### DELETE `/salaries/:id`
Supprimer un paiement de salaire

---

## 📝 Logs

#### GET `/logs?page=1&limit=10&userId=&depotId=&action=&entity=&startDate=&endDate=`
Obtenir tous les logs d'activité

---

## 🧾 Factures

#### GET `/invoices/generate/:saleId?format=A4`
Générer une facture pour une vente (formats: A4, 58mm, 80mm)

#### GET `/invoices/:invoiceNumber`
Télécharger une facture existante

---

## 🔐 Rôles et Permissions

- **ADMIN**: Accès complet à toutes les fonctionnalités
- **GERANT**: Gestion du dépôt, ventes, achats, stocks, rapports
- **CAISSIER**: Création de ventes, gestion des paiements, consultation des stocks
- **CLIENT**: Consultation de ses propres commandes et paiements

---

## 📊 Codes de statut

- `200`: Succès
- `201`: Créé avec succès
- `400`: Requête invalide
- `401`: Non autorisé (token manquant ou invalide)
- `403`: Interdit (permissions insuffisantes)
- `404`: Ressource non trouvée
- `409`: Conflit (email/téléphone déjà existant)
- `500`: Erreur serveur

---

## 🔄 Format de réponse paginée

```json
{
  "data": [...],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

---

## 📌 Méthodes de paiement

- `CASH`: Espèces
- `MOBILE_MONEY`: Mobile Money (Orange Money, MTN Money, Moov Money, Wave)
- `BANK_TRANSFER`: Virement bancaire
- `CREDIT`: Crédit

---

## 📌 Providers Mobile Money

- `ORANGE_MONEY`
- `MTN_MONEY`
- `MOOV_MONEY`
- `WAVE`

---

## 🚀 Pour démarrer

1. Installer les dépendances:
```bash
npm install
```

2. Configurer les variables d'environnement dans `.env`

3. Initialiser la base de données:
```bash
npx prisma migrate dev
npx prisma db seed
```

4. Lancer le serveur:
```bash
npm run start:dev
```

5. Accéder à la documentation Swagger:
```
http://localhost:3000/api/docs
```

---

**Compte admin par défaut:**
- Email: `admin@mydepot.com`
- Password: `admin123`
