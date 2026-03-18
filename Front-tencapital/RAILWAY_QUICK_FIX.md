# 🚂 Guide Rapide - Déploiement Railway

## ⚡ Solution Rapide au Problème Actuel

Le problème est que les variables d'environnement ne sont pas configurées sur Railway.

### 🔧 Solution Immédiate (2 minutes)

1. **Aller sur Railway Dashboard**
   - Ouvrir: https://railway.app
   - Sélectionner votre projet: `Front-tencapital`

2. **Configurer les Variables**
   - Cliquer sur votre service frontend
   - Onglet "Variables"
   - Ajouter ces variables:

   ```
   REACT_APP_API_URL
   https://backend-tencapital-production.up.railway.app
   
   NODE_ENV
   production
   
   REACT_APP_API_TIMEOUT
   10000
   ```

3. **Redéployer**
   - Railway redéploiera automatiquement
   - Ou cliquez sur "Deploy" → "Redeploy"

---

## 📋 Variables Railway à Configurer

### Obligatoire (sans ça, l'app ne fonctionne pas):
```bash
REACT_APP_API_URL=https://backend-tencapital-production.up.railway.app
```

### Recommandé:
```bash
NODE_ENV=production
REACT_APP_API_TIMEOUT=10000
REACT_APP_ENABLE_DEBUG=false
```

---

## 🔍 Vérifier que ça Fonctionne

Après redéploiement (environ 2-3 minutes):

1. **Health Check**
   ```bash
   curl https://ton-frontend.up.railway.app/health
   # Devrait retourner: "healthy"
   ```

2. **Ouvrir l'Application**
   ```
   https://ton-frontend.up.railway.app
   ```

3. **Vérifier la Console (F12)**
   - Pas d'erreurs "undefined"
   - Les API calls fonctionnent

---

## 🎯 Fichiers Modifiés (Déjà Fait)

Ces fichiers ont été mis à jour pour fonctionner avec `.env`:

✅ `src/config/apiConfig.js` - Configuration centralisée
✅ `Dockerfile` - Supporte les variables d'environnement
✅ `.env.production` - Valeurs par défaut
✅ Tous les composants (11 fichiers) - Importent API_CONFIG

---

## 🚀 Commandes Utiles

```bash
# Voir les logs Railway
railway logs

# Vérifier la configuration locale
node check-config.js

# Build local (pour tester)
npm run build

# Redéployer manuellement
railway up
```

---

## ❓ Problèmes Courants

### "Cannot read properties of undefined"
→ Variables pas configurées sur Railway
→ Solution: Configurer REACT_APP_API_URL

### "Build fails"
→ Vérifier les logs Railway
→ Solution: Voir RAILWAY_TROUBLESHOOTING.md

### "API calls fail"
→ Backend pas accessible
→ Solution: Vérifier l'URL du backend

---

## 📞 Aide

Documentation complète:
- `RAILWAY_DEPLOYMENT.md` - Configuration détaillée
- `RAILWAY_TROUBLESHOOTING.md` - Résolution de problèmes
- `ENV_CONFIG_README.md` - Guide des variables d'environnement

---

## ✅ Checklist Finale

Avant de dire que c'est réglé:

- [ ] Variables configurées sur Railway
- [ ] Déploiement réussi (voir logs)
- [ ] Health check fonctionne
- [ ] Application s'ouvre sans erreur
- [ ] Login fonctionne
- [ ] API calls fonctionnent

---

## 🎉 C'est Tout!

Si vous avez configuré `REACT_APP_API_URL` sur Railway, le problème est résolu!

Railway redéploiera automatiquement avec la bonne configuration.
