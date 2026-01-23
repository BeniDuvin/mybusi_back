# 🚀 Guide de Démarrage Rapide - MyDepot Backend

## 📋 Commandes à exécuter dans l'ordre

### 1️⃣ Installation des dépendances

**IMPORTANT**: Si vous avez des problèmes avec PowerShell, ouvrez PowerShell en tant qu'administrateur et exécutez :
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Ensuite, installez les dépendances :
```bash
npm install
```

---

### 2️⃣ Configuration de l'environnement

1. Créez un fichier `.env` à la racine du projet
2. Copiez le contenu de `env.example` dans `.env`
3. Modifiez les valeurs selon votre configuration :

```env
DATABASE_URL="postgresql://username:password@localhost:5432/mydepot?schema=public"
JWT_SECRET=changez-ceci-en-production-avec-une-clé-secrète-longue-et-aléatoire
JWT_EXPIRATION=7d
PORT=3000
NODE_ENV=development
```

**Note**: Les autres variables (Google OAuth, Twilio, SMTP) sont optionnelles pour démarrer.

---

### 3️⃣ Configuration de PostgreSQL

1. Assurez-vous que PostgreSQL est installé et démarré
2. Créez la base de données :

```sql
CREATE DATABASE mydepot;
```

Ou via psql :
```bash
psql -U postgres
CREATE DATABASE mydepot;
\q
```

---

### 4️⃣ Initialisation de Prisma

```bash
# Générer le client Prisma
npm run prisma:generate

# Créer les tables dans la base de données
npm run prisma:migrate

# Insérer les données de test
npm run prisma:seed
```

---

### 5️⃣ Démarrage de l'application

**Mode développement (recommandé) :**
```bash
npm run start:dev
```

**Mode production :**
```bash
npm run build
npm run start:prod
```

---

## 🌐 URLs importantes

Une fois l'application démarrée :

- **API Base URL** : `http://localhost:3000/api/v1`
- **Documentation Swagger** : `http://localhost:3000/api/docs`
- **Health Check** : `http://localhost:3000/health`

---

## 🔐 Compte de test

Après avoir exécuté les seeds, utilisez ce compte pour vous connecter :

```json
{
  "email": "admin@mydepot.com",
  "password": "admin123"
}
```

**Endpoint de connexion** : `POST http://localhost:3000/api/v1/auth/login`

---

## 📊 Prisma Studio (Optionnel)

Pour visualiser et gérer vos données via une interface graphique :

```bash
npm run prisma:studio
```

Accessible sur : `http://localhost:5555`

---

## 🛠️ Scripts utiles

```bash
# Développement
npm run start:dev              # Démarrer en mode watch (auto-reload)

# Production
npm run build                  # Compiler le projet
npm run start:prod             # Démarrer en mode production

# Prisma
npm run prisma:generate        # Générer le client Prisma
npm run prisma:migrate         # Créer/Appliquer les migrations
npm run prisma:seed            # Insérer les données de test
npm run prisma:studio          # Ouvrir l'interface Prisma Studio

# Tests
npm run test                   # Exécuter les tests
npm run test:watch             # Tests en mode watch
npm run test:cov               # Couverture de tests

# Qualité du code
npm run lint                   # Linter le code
npm run format                 # Formater le code
```

---

## ✅ Vérification de l'installation

Pour vérifier que tout fonctionne :

1. **Test du health check :**
```bash
curl http://localhost:3000/health
```

2. **Test de connexion :**
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@mydepot.com","password":"admin123"}'
```

3. **Accéder à Swagger :**
Ouvrez `http://localhost:3000/api/docs` dans votre navigateur

---

## 📦 Données de test créées par le seed

Le script de seed crée :

- ✅ 1 utilisateur admin (admin@mydepot.com / admin123)
- ✅ 2 dépôts (Dépôt Central, Dépôt Yopougon)
- ✅ 4 catégories (Boissons gazeuses, Bières, Eaux, Jus)
- ✅ 3 marques (Coca-Cola, SOLIBRA, Awabio)
- ✅ 4 produits avec stock initial de 100 unités
- ✅ 1 fournisseur
- ✅ 1 client

---

## 🔄 Réinitialiser la base de données

Si vous voulez repartir de zéro :

```bash
# Supprimer toutes les données
npx prisma migrate reset

# Recréer les tables et insérer les seeds
npm run prisma:migrate
npm run prisma:seed
```

---

## 🐛 Résolution des problèmes courants

### Problème : "Cannot find module '@prisma/client'"
**Solution :**
```bash
npm run prisma:generate
```

### Problème : "Port 3000 already in use"
**Solution :** Changez le port dans `.env` :
```env
PORT=3001
```

### Problème : "Database connection error"
**Solution :** Vérifiez que :
1. PostgreSQL est démarré
2. La base de données existe
3. Les identifiants dans `DATABASE_URL` sont corrects

### Problème : Erreur de politique d'exécution PowerShell
**Solution :** Ouvrez PowerShell en administrateur :
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## 📚 Documentation complète

- **README.md** : Documentation générale du projet
- **API_ENDPOINTS.md** : Liste complète de tous les endpoints avec exemples
- **Swagger** : Documentation interactive à `http://localhost:3000/api/docs`

---

## 🎯 Prochaines étapes

1. ✅ Configurez les variables d'environnement optionnelles (Google OAuth, Twilio, etc.)
2. ✅ Testez les endpoints via Swagger
3. ✅ Créez vos propres dépôts, produits, et ventes
4. ✅ Explorez Prisma Studio pour voir les données
5. ✅ Commencez à développer votre frontend

---

## 💡 Conseils

- Utilisez **Postman** ou **Insomnia** pour tester les API
- Consultez **Swagger** pour voir tous les endpoints disponibles
- Utilisez **Prisma Studio** pour visualiser vos données
- Les logs de l'application s'affichent dans la console

---

## 📞 Support

Pour toute question, consultez la documentation ou les fichiers du projet.

**Bon développement ! 🚀**
