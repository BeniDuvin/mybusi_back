# ⚡ Commandes Rapides - MyDepot Backend

## 🚀 Installation Complète (Copier-Coller)

### 1. Installer les dépendances
```bash
npm install
```

### 2. Configurer l'environnement
```bash
cp env.example .env
```
**Puis modifiez `.env` avec vos paramètres PostgreSQL**

### 3. Initialiser Prisma
```bash
npm run prisma:generate && npm run prisma:migrate && npm run prisma:seed
```

### 4. Lancer l'application
```bash
npm run start:dev
```

---

## 🔄 Commandes Quotidiennes

### Développement
```bash
npm run start:dev
```

### Voir la base de données
```bash
npm run prisma:studio
```

### Réinitialiser la DB
```bash
npx prisma migrate reset
```

---

## 🧪 Test des Endpoints

### 1. Health Check
```bash
curl http://localhost:3000/health
```

### 2. Login Admin
```bash
curl -X POST http://localhost:3000/api/v1/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@mydepot.com\",\"password\":\"admin123\"}"
```

### 3. Obtenir les dépôts (avec token)
```bash
curl -X GET http://localhost:3000/api/v1/depots -H "Authorization: Bearer VOTRE_TOKEN"
```

---

## 📚 URLs Importantes

- **API** : http://localhost:3000/api/v1
- **Swagger** : http://localhost:3000/api/docs
- **Prisma Studio** : http://localhost:5555

---

## 🔑 Compte de Test

```
Email: admin@mydepot.com
Password: admin123
```

---

## ⚠️ Problème PowerShell ?

Ouvrir PowerShell en Administrateur et exécuter :
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## 📦 Commandes Prisma Utiles

```bash
# Générer le client
npm run prisma:generate

# Créer une migration
npm run prisma:migrate

# Réinitialiser la DB
npx prisma migrate reset

# Insérer les données de test
npm run prisma:seed

# Ouvrir Prisma Studio
npm run prisma:studio

# Créer une migration nommée
npx prisma migrate dev --name nom_migration
```

---

## 🛠️ Scripts Package.json

```bash
npm run start:dev              # Mode développement avec watch
npm run start:prod             # Mode production
npm run build                  # Compiler le projet
npm run lint                   # Linter le code
npm run format                 # Formatter le code
npm run test                   # Exécuter les tests
npm run prisma:generate        # Générer le client Prisma
npm run prisma:migrate         # Exécuter les migrations
npm run prisma:seed            # Insérer les données de test
npm run prisma:studio          # Ouvrir Prisma Studio
```

---

## 🔧 Commandes Git (Optionnel)

### Initialiser le dépôt
```bash
git init
git add .
git commit -m "Initial commit - MyDepot Backend"
```

### Ajouter un remote
```bash
git remote add origin <url-de-votre-repo>
git push -u origin main
```

---

## 📄 Documentation

| Fichier | Description |
|---------|-------------|
| `README.md` | Documentation générale |
| `API_ENDPOINTS.md` | **Liste complète des endpoints** |
| `GETTING_STARTED.md` | Guide de démarrage |
| `ARCHITECTURE.md` | Architecture du projet |
| `DEPENDENCIES.md` | Liste des dépendances |
| `SUMMARY.md` | Récapitulatif complet |
| `QUICK_COMMANDS.md` | Ce fichier |

---

## ✅ Checklist Rapide

- [ ] `npm install`
- [ ] Créer `.env`
- [ ] Créer la DB PostgreSQL
- [ ] `npm run prisma:generate`
- [ ] `npm run prisma:migrate`
- [ ] `npm run prisma:seed`
- [ ] `npm run start:dev`
- [ ] Tester Swagger : http://localhost:3000/api/docs
- [ ] Lire `API_ENDPOINTS.md`

---

**Tout est prêt ! 🎉**
