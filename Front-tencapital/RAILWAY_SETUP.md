# 🚂 Railway - Configuration Rapide

```
╔════════════════════════════════════════════════════════════════╗
║                  PROBLÈME APRÈS MIGRATION .env                  ║
║                                                                 ║
║  ❌ Application ne démarre pas sur Railway                      ║
║  ❌ Erreur: "Cannot read properties of undefined"              ║
║  ❌ Cause: REACT_APP_API_URL pas défini sur Railway            ║
╚════════════════════════════════════════════════════════════════╝
```

## ⚡ SOLUTION RAPIDE (2 minutes)

### 📍 Étape 1: Railway Dashboard

```
1. Ouvrir: https://railway.app
2. Projet: Front-tencapital
3. Service: frontend
4. Onglet: Variables
5. Ajouter:

   ┌─────────────────────────────────────────────────────────┐
   │ Variable Name:  REACT_APP_API_URL                       │
   │ Variable Value: https://backend-tencapital-production...│
   └─────────────────────────────────────────────────────────┘

6. Cliquer: Add → Deploy
```

### 📍 Étape 2: Push le Code

```bash
git add .
git commit -m "fix: railway env configuration"
git push origin master
```

### 📍 Étape 3: Vérifier (après 2-3 min)

```bash
✅ Health: https://ton-frontend.up.railway.app/health
✅ App:    https://ton-frontend.up.railway.app
```

---

## 📊 État Actuel

```
✅ Code Configuration
├── ✅ apiConfig.js          (export corrigé)
├── ✅ Dockerfile            (ARG/ENV configurés)
├── ✅ .env.production       (valeurs par défaut)
├── ✅ 11 composants         (import API_CONFIG)
└── ✅ Build scripts         (prêts)

⚠️  Railway Configuration (À FAIRE)
└── ❌ REACT_APP_API_URL     (manquant sur Railway)
```

---

## 🎯 Variables Railway

### OBLIGATOIRE (sans ça, ça ne marche pas):
```
REACT_APP_API_URL
https://backend-tencapital-production.up.railway.app
```

### RECOMMANDÉ:
```
NODE_ENV                production
REACT_APP_API_TIMEOUT   10000
REACT_APP_ENABLE_DEBUG  false
```

---

## 🔍 Vérification

```bash
# 1. Vérifier config locale
node check-config.js

# 2. Voir logs Railway
railway logs

# 3. Test health
curl https://ton-frontend.up.railway.app/health
```

---

## 📚 Documentation

```
├── FIX_RAILWAY_DEPLOYMENT.md      ← Solution complète
├── RAILWAY_QUICK_FIX.md           ← Guide rapide
├── RAILWAY_DEPLOYMENT.md          ← Configuration détaillée
├── RAILWAY_TROUBLESHOOTING.md     ← Dépannage
└── ENV_CONFIG_README.md           ← Guide .env
```

---

## ✅ Checklist

```
□ Variables configurées sur Railway
□ Code poussé (git push)
□ Déploiement réussi
□ Health check OK
□ Application accessible
□ API calls fonctionnent
```

---

## 🎉 Après Configuration

```
╔════════════════════════════════════════════════════════════════╗
║                    ✅ TOUT FONCTIONNE                          ║
║                                                                 ║
║  ✅ Build réussit                                              ║
║  ✅ Application démarre                                        ║
║  ✅ API calls fonctionnent                                     ║
║  ✅ Pas de valeurs hardcodées                                  ║
║  ✅ Configuration via .env                                     ║
╚════════════════════════════════════════════════════════════════╝
```

---

**💡 Astuce:** Après avoir configuré `REACT_APP_API_URL` sur Railway, 
le problème sera automatiquement résolu au prochain déploiement!

---

**📖 Besoin d'aide?** → Voir `FIX_RAILWAY_DEPLOYMENT.md`
