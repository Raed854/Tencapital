# 🚨 Résolution des Problèmes de Déploiement Railway

## Problèmes Courants Après la Migration vers .env

### ❌ Problème 1: "Cannot read properties of undefined"

**Symptôme:** L'application ne démarre pas, erreur dans la console

**Cause:** `API_CONFIG.BASE_URL` est `undefined` car `REACT_APP_API_URL` n'est pas défini

**Solution:**

1. **Sur Railway Dashboard:**
   ```
   Settings → Variables → Add Variable
   
   Name:  REACT_APP_API_URL
   Value: https://backend-tencapital-production.up.railway.app
   ```

2. **Ou modifier `.env.production`** dans le code:
   ```bash
   REACT_APP_API_URL=https://backend-tencapital-production.up.railway.app
   ```

3. **Redéployer:**
   - Railway redéploiera automatiquement après un push
   - Ou cliquez sur "Deploy" dans Railway Dashboard

---

### ❌ Problème 2: Build échoue sur Railway

**Symptôme:** Build fail avec erreur "Module not found"

**Cause:** Import de `API_CONFIG` incorrect

**Solution:**

Vérifier que tous les imports sont corrects:
```javascript
// ✅ Correct
import { API_CONFIG } from '../../config/apiConfig';

// ❌ Incorrect
import API_CONFIG from '../../config/apiConfig';
```

---

### ❌ Problème 3: API calls ne fonctionnent pas

**Symptôme:** Erreurs 404 ou CORS

**Causes possibles:**

1. **URL incorrecte:**
   ```bash
   # Vérifier dans Railway Variables
   REACT_APP_API_URL=https://VOTRE-BACKEND.up.railway.app/api
   ```

2. **Backend pas déployé:**
   - Vérifier que le backend est bien déployé et accessible
   - Tester: `curl https://VOTRE-BACKEND.up.railway.app/health`

3. **Problème CORS:**
   - Le backend doit autoriser l'origin du frontend
   - Exemple dans le backend Express:
   ```javascript
   app.use(cors({
     origin: 'https://ton-frontend.up.railway.app',
     credentials: true
   }));
   ```

---

### ❌ Problème 4: Variables d'environnement non prises en compte

**Symptôme:** Les variables ne changent rien

**Cause:** React nécessite un rebuild pour les variables `REACT_APP_*`

**Solution:**

1. **Sur Railway:** Les variables sont appliquées au BUILD-TIME
   - Après avoir changé une variable, Railway doit rebuilder
   - Faites "Redeploy" dans Railway Dashboard

2. **En local:** Redémarrer le serveur
   ```bash
   # Arrêter (Ctrl+C)
   npm start  # Redémarrer
   ```

---

### ❌ Problème 5: "window is not defined" lors du build

**Symptôme:** Erreur pendant `npm run build`

**Cause:** Utilisation de `window` dans le code qui s'exécute côté serveur

**Solution:** Déjà corrigé dans `apiConfig.js`:
```javascript
BASE_URL: process.env.REACT_APP_API_URL || 
          (typeof window !== 'undefined' && process.env.NODE_ENV === 'production' 
            ? `${window.location.origin}/api` 
            : 'http://localhost:5000'),
```

---

## 🔍 Comment Diagnostiquer

### 1. Vérifier les logs Railway

```bash
# Dans le terminal Railway
railway logs

# Ou via Dashboard
Deployments → [Dernier déploiement] → View Logs
```

**À chercher:**
- ✅ "Build completed successfully"
- ✅ "REACT_APP_API_URL is set to..."
- ❌ Erreurs de compilation
- ❌ "Module not found"

### 2. Vérifier les variables dans Railway

```bash
# Via CLI
railway variables

# Via Dashboard
Service → Variables → Voir toutes les variables
```

**Variables requises:**
- `REACT_APP_API_URL` ← CRITIQUE
- `NODE_ENV=production`

### 3. Tester l'application

```bash
# Health check
curl https://ton-frontend.up.railway.app/health

# Devrait retourner: "healthy"
```

### 4. Console Browser (F12)

Ouvrir l'application dans le navigateur et vérifier:
- ❌ Erreurs JavaScript
- ❌ Erreurs de réseau (onglet Network)
- ✅ API calls réussies

---

## ✅ Checklist de Déploiement

Avant de déployer, vérifier:

- [ ] `.env.production` existe et contient `REACT_APP_API_URL`
- [ ] Variables définies dans Railway Dashboard
- [ ] Tous les imports de `API_CONFIG` sont corrects
- [ ] `Dockerfile` a les ARG et ENV corrects
- [ ] Backend est déployé et accessible
- [ ] CORS configuré sur le backend
- [ ] Build local réussit: `npm run build`

---

## 🚀 Commandes de Dépannage

```bash
# 1. Vérifier le build local
npm run build

# 2. Tester le build local avec serve
npx serve -s build -l 3000

# 3. Vérifier les variables Railway
railway variables

# 4. Voir les logs en temps réel
railway logs --follow

# 5. Forcer un redéploiement
railway up --detach

# 6. Vérifier le statut
railway status
```

---

## 📞 Besoin d'Aide?

Si le problème persiste:

1. **Vérifier les logs Railway** - souvent la réponse est là
2. **Tester en local** - `npm start` doit fonctionner
3. **Vérifier les variables** - Railway Dashboard → Variables
4. **Comparer avec `.env.production`** - les valeurs doivent correspondre

---

## 🔄 Solution Rapide (Reset)

Si rien ne fonctionne:

```bash
# 1. Supprimer node_modules et build
rm -rf node_modules build

# 2. Réinstaller
npm install

# 3. Build local
npm run build

# 4. Si ça marche en local, push vers Railway
git add .
git commit -m "fix: railway deployment configuration"
git push

# 5. Railway redeploiera automatiquement
```

---

## 📝 Variables Railway à Configurer

```bash
# OBLIGATOIRE
REACT_APP_API_URL=https://backend-tencapital-production.up.railway.app

# RECOMMANDÉ
NODE_ENV=production
REACT_APP_API_TIMEOUT=10000
REACT_APP_ENABLE_DEBUG=false

# OPTIONNEL
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_FALLBACK_URLS=
```

---

## ✨ Après Résolution

Une fois que tout fonctionne:

1. ✅ Tester toutes les fonctionnalités
2. ✅ Vérifier les API calls
3. ✅ Tester le login/logout
4. ✅ Vérifier le health check
5. ✅ Documenter la configuration finale

