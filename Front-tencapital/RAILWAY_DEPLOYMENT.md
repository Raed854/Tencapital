# Railway Deployment Configuration Guide

## Environment Variables to Set in Railway

Pour que le déploiement fonctionne correctement sur Railway, vous devez configurer ces variables d'environnement dans Railway Dashboard:

### Variables Requises

```bash
# API Configuration
REACT_APP_API_URL=https://ton-frontend.up.railway.app/api

# Build Arguments (optionnels, ont des valeurs par défaut)
REACT_APP_API_TIMEOUT=10000
REACT_APP_ENABLE_DEBUG=false
NODE_ENV=production
```

## Comment Configurer sur Railway

1. **Via Railway Dashboard:**
   - Allez sur votre projet Railway
   - Cliquez sur votre service
   - Allez dans l'onglet "Variables"
   - Ajoutez les variables ci-dessus
   - Cliquez sur "Deploy" pour redéployer

2. **Via Railway CLI:**
   ```bash
   railway variables set REACT_APP_API_URL=https://ton-frontend.up.railway.app/api
   railway variables set REACT_APP_API_TIMEOUT=10000
   railway variables set REACT_APP_ENABLE_DEBUG=false
   railway variables set NODE_ENV=production
   ```

## Configuration Automatique (Fallback)

Si `REACT_APP_API_URL` n'est pas défini, l'application utilisera automatiquement:
- En production: `${window.location.origin}/api` (URL dynamique basée sur le domaine)
- En développement: `http://localhost:5000`

## Vérification du Déploiement

Après le déploiement, vérifiez:

1. **Health Check:**
   ```
   https://ton-frontend.up.railway.app/health
   ```
   Devrait retourner: `healthy`

2. **Console Browser:**
   - Ouvrez la console développeur (F12)
   - Vérifiez qu'il n'y a pas d'erreurs
   - En mode debug, vous verrez les logs d'API

3. **Build Logs:**
   - Vérifiez les logs Railway pour confirmer que les variables sont bien définies
   - Recherchez: "REACT_APP_API_URL is set to..."

## Troubleshooting

### Problème: "Cannot read property of undefined"
**Solution:** Vérifiez que `REACT_APP_API_URL` est bien défini dans Railway

### Problème: "API calls failing"
**Solution:** 
1. Vérifiez que l'URL de l'API est correcte
2. Assurez-vous que le backend est déployé et accessible
3. Vérifiez les CORS sur le backend

### Problème: "Build fails"
**Solution:**
1. Vérifiez les logs de build Railway
2. Assurez-vous que toutes les dépendances sont dans `package.json`
3. Vérifiez que le Dockerfile est correct

## Commandes Utiles

```bash
# Voir les logs en temps réel
railway logs

# Redéployer
railway up

# Lister les variables
railway variables

# Voir le statut
railway status
```

## Notes Importantes

⚠️ **Les variables d'environnement doivent être configurées AVANT le build**
- Railway passe les variables au moment du build Docker
- Si vous changez une variable, vous devez redéployer

✅ **Après chaque modification:**
1. Commit et push vos changements
2. Configurez/vérifiez les variables Railway
3. Railway redéploiera automatiquement (ou faites `railway up`)

## Structure des URLs

```
Frontend URL: https://ton-frontend.up.railway.app
API URL:      https://ton-frontend.up.railway.app/api
Health:       https://ton-frontend.up.railway.app/health
```

Si votre backend est sur un autre domaine:
```bash
REACT_APP_API_URL=https://votre-backend.up.railway.app/api
```
