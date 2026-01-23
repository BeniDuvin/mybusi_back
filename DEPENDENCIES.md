# 📦 Installation des Dépendances - MyDepot Backend

## ⚠️ Note Importante

Si vous rencontrez une erreur de politique d'exécution PowerShell sous Windows, exécutez ceci en tant qu'administrateur :

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## 🚀 Installation Complète

Pour installer toutes les dépendances en une seule commande :

```bash
npm install
```

---

## 📋 Liste des Dépendances

Si vous voulez installer manuellement ou comprendre chaque package :

### 🎯 Dépendances Principales

```bash
npm install @nestjs/common@^11.0.1 @nestjs/core@^11.0.1 @nestjs/platform-express@^11.0.1
npm install @nestjs/config@^3.1.1
npm install @nestjs/jwt@^10.2.0 @nestjs/passport@^10.0.3
npm install @nestjs/swagger@^7.1.17
npm install @prisma/client@^5.8.1
npm install passport@^0.7.0 passport-jwt@^4.0.1 passport-google-oauth20@^2.0.0
npm install bcrypt@^5.1.1
npm install class-validator@^0.14.0 class-transformer@^0.5.1
npm install pdfkit@^0.14.0
npm install exceljs@^4.4.0
npm install twilio@^4.20.0
npm install nodemailer@^6.9.8
npm install reflect-metadata@^0.2.2
npm install rxjs@^7.8.1
```

### 🛠️ Dépendances de Développement

```bash
npm install --save-dev @nestjs/cli@^11.0.0
npm install --save-dev @nestjs/schematics@^11.0.0
npm install --save-dev @nestjs/testing@^11.0.1
npm install --save-dev @types/express@^5.0.0
npm install --save-dev @types/jest@^30.0.0
npm install --save-dev @types/node@^22.10.7
npm install --save-dev @types/supertest@^6.0.2
npm install --save-dev @types/passport-jwt@^4.0.0
npm install --save-dev @types/passport-google-oauth20@^2.0.14
npm install --save-dev @types/bcrypt@^5.0.2
npm install --save-dev @types/pdfkit@^0.13.4
npm install --save-dev @types/nodemailer@^6.4.14
npm install --save-dev prisma@^5.8.1
npm install --save-dev eslint@^9.18.0
npm install --save-dev eslint-config-prettier@^10.0.1
npm install --save-dev eslint-plugin-prettier@^5.2.2
npm install --save-dev prettier@^3.4.2
npm install --save-dev typescript@^5.7.3
npm install --save-dev typescript-eslint@^8.20.0
npm install --save-dev ts-jest@^29.2.5
npm install --save-dev ts-loader@^9.5.2
npm install --save-dev ts-node@^10.9.2
npm install --save-dev jest@^30.0.0
npm install --save-dev supertest@^7.0.0
```

---

## 📚 Description des Packages Principaux

### Framework & Core
- **@nestjs/common** - Décorateurs et utilitaires NestJS
- **@nestjs/core** - Noyau du framework NestJS
- **@nestjs/platform-express** - Adaptateur Express pour NestJS
- **@nestjs/config** - Gestion de la configuration et variables d'environnement

### Authentification & Sécurité
- **@nestjs/jwt** - Gestion des tokens JWT
- **@nestjs/passport** - Intégration Passport.js
- **passport** - Middleware d'authentification
- **passport-jwt** - Stratégie JWT pour Passport
- **passport-google-oauth20** - Stratégie Google OAuth 2.0
- **bcrypt** - Hachage sécurisé des mots de passe

### Base de Données
- **@prisma/client** - Client Prisma ORM
- **prisma** (dev) - CLI et outils Prisma

### Validation
- **class-validator** - Validation déclarative des classes
- **class-transformer** - Transformation d'objets

### Documentation
- **@nestjs/swagger** - Génération de documentation OpenAPI/Swagger

### Génération de Documents
- **pdfkit** - Génération de fichiers PDF
- **exceljs** - Génération de fichiers Excel

### Notifications & Communication
- **twilio** - Envoi de SMS (OTP)
- **nodemailer** - Envoi d'emails

### Utilitaires
- **reflect-metadata** - Métadonnées pour décorateurs TypeScript
- **rxjs** - Programmation réactive

### TypeScript & Compilation
- **typescript** - Compilateur TypeScript
- **typescript-eslint** - Linter ESLint pour TypeScript
- **ts-node** - Exécution directe de TypeScript
- **ts-loader** - Loader TypeScript pour Webpack
- **ts-jest** - Support TypeScript pour Jest

### Tests
- **jest** - Framework de tests
- **@nestjs/testing** - Utilitaires de tests NestJS
- **supertest** - Tests HTTP
- **@types/jest** - Typages TypeScript pour Jest
- **@types/supertest** - Typages TypeScript pour Supertest

### Qualité du Code
- **eslint** - Linter JavaScript/TypeScript
- **prettier** - Formateur de code
- **eslint-config-prettier** - Configuration ESLint compatible Prettier
- **eslint-plugin-prettier** - Plugin Prettier pour ESLint

---

## ✅ Vérification de l'Installation

Pour vérifier que toutes les dépendances sont installées :

```bash
npm list
```

Pour vérifier les versions :

```bash
npm list --depth=0
```

---

## 🔄 Mise à Jour des Dépendances

Pour mettre à jour toutes les dépendances :

```bash
npm update
```

Pour vérifier les packages obsolètes :

```bash
npm outdated
```

---

## 🗑️ Nettoyage

Si vous rencontrez des problèmes, essayez de nettoyer et réinstaller :

```bash
# Supprimer node_modules et package-lock.json
rm -rf node_modules package-lock.json

# Réinstaller
npm install
```

Sous Windows PowerShell :

```powershell
Remove-Item -Recurse -Force node_modules, package-lock.json
npm install
```

---

## 📊 Taille Approximative

- **node_modules** : ~400-500 MB
- **Temps d'installation** : 2-5 minutes (selon la connexion)

---

## 🔗 Liens Utiles

- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Passport.js Documentation](http://www.passportjs.org/)
- [Jest Documentation](https://jestjs.io/)
- [TypeScript Documentation](https://www.typescriptlang.org/)

---

**Toutes les dépendances sont listées dans `package.json` 📦**
