# Système de Cache en Mémoire - InvestorMatch Backend

## 🚀 Vue d'ensemble

Le système de cache en mémoire d'InvestorMatch améliore significativement les performances de l'API en stockant temporairement les données fréquemment utilisées dans la RAM. Ce système réduit la charge sur la base de données MongoDB et accélère les réponses API.

## 📊 Fonctionnalités

### ✅ Cache automatique
- **Données de référence** : Secteurs, industries, localisations (TTL: 10 min)
- **Statistiques** : Métriques et compteurs (TTL: 5 min)
- **Graphiques** : Données de visualisation (TTL: 5 min)
- **Recherches** : Résultats de filtres (TTL: 3 min)
- **Listes d'investisseurs** : Données utilisateur (TTL: 2 min)

### 🔧 Gestion intelligente
- **Expiration automatique** : Nettoyage des données expirées
- **Invalidation sélective** : Suppression par pattern
- **Statistiques détaillées** : Monitoring des performances
- **Préchargement** : Chargement anticipé des données

## 🛠️ Configuration

### TTL par défaut (Time To Live)
```javascript
const CACHE_TTL = {
  REFERENCE_DATA: 600000,    // 10 minutes
  STATISTICS: 300000,        // 5 minutes
  FILTER_OPTIONS: 600000,    // 10 minutes
  CHART_DATA: 300000,        // 5 minutes
  SEARCH_RESULTS: 180000,    // 3 minutes
  USER_DATA: 600000,         // 10 minutes
  INVESTOR_LIST: 120000,     // 2 minutes
  DASHBOARD_STATS: 300000    // 5 minutes
};
```

### Clés de cache
```javascript
const CacheKeys = {
  sectors: () => 'ref:sectors',
  totalStats: () => 'stats:total',
  sectorChart: () => 'chart:sector',
  investorSearch: (params) => `search:investors:${JSON.stringify(params)}`,
  // ... autres clés
};
```

## 📡 API Endpoints (Admin uniquement)

### Statistiques du cache
```bash
GET /api/cache/stats
Authorization: Bearer <admin_token>
```

**Réponse :**
```json
{
  "success": true,
  "cacheStats": {
    "hits": 150,
    "misses": 25,
    "sets": 30,
    "deletes": 5,
    "expires": 10,
    "hitRate": "85.71%",
    "currentSize": 15,
    "memoryUsage": {
      "rss": "45 MB",
      "heapTotal": "20 MB",
      "heapUsed": "15 MB"
    }
  }
}
```

### Santé du système
```bash
GET /api/cache/health
Authorization: Bearer <admin_token>
```

### Gestion des clés
```bash
# Lister les clés
GET /api/cache/keys?limit=50&offset=0

# Inspecter une clé
GET /api/cache/inspect/:key
```

### Invalidation
```bash
# Vider tout le cache
DELETE /api/cache/clear

# Invalider par pattern
DELETE /api/cache/invalidate/stats:
DELETE /api/cache/invalidate/chart:
```

### Préchargement
```bash
POST /api/cache/warmup
Authorization: Bearer <admin_token>
```

## 🔧 Scripts NPM

### Test du cache
```bash
npm run test-cache
```

### Statistiques rapides
```bash
npm run cache-stats
```

### Vider le cache
```bash
npm run cache-clear
```

### Préchargement
```bash
npm run cache-warmup
```

## 📈 Utilisation dans les contrôleurs

### Exemple basique
```javascript
const { cache, CACHE_TTL, CacheKeys } = require('../utils/cache');

static async getData(req, res) {
  const cacheKey = CacheKeys.myData();
  
  // Vérifier le cache
  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    return res.json({ data: cachedData, _cached: true });
  }
  
  // Récupérer depuis la DB
  const data = await Model.find();
  
  // Mettre en cache
  cache.set(cacheKey, data, CACHE_TTL.MY_DATA);
  
  res.json({ data, _cached: false });
}
```

### Invalidation après modification
```javascript
static async createData(req, res) {
  const data = await Model.create(req.body);
  
  // Invalider le cache
  cache.deletePattern('myData:');
  cache.deletePattern('stats:');
  
  res.json({ success: true, data });
}
```

## 🎯 Middleware de cache

### Cache automatique pour les routes
```javascript
const { cacheMiddleware } = require('../middleware/cache');

// Cache générique
router.get('/data', cacheMiddleware({
  ttl: 300000,
  keyGenerator: (req) => `data:${req.query.type}`
}), controller.getData);

// Cache spécialisé
router.get('/stats', statisticsCache, controller.getStats);
router.get('/charts', chartDataCache, controller.getCharts);
```

### Invalidation automatique
```javascript
const { invalidateInvestorCache } = require('../middleware/cache');

router.post('/investors', invalidateInvestorCache, controller.createInvestor);
```

## 📊 Monitoring et performances

### Métriques importantes
- **Hit Rate** : Pourcentage de requêtes servies depuis le cache
- **Memory Usage** : Utilisation mémoire du cache
- **Response Time** : Temps de réponse avec/sans cache

### Exemple de résultats
```
🚀 Amélioration des performances: 85.2%
🚀 Vitesse moyenne avec cache: 12ms
🐌 Vitesse sans cache: 180ms
```

## 🔍 Debugging

### Logs de cache
```bash
✅ Cache HIT: getAllInvestors
🔄 Cache MISS: getTotalStats - récupération depuis la DB
💾 Cache SET: stats:total (TTL: 300000ms)
🗑️ Cache invalidé après création d'investisseur
```

### Inspection des clés
```javascript
const inspection = cache.inspect('stats:total');
console.log(inspection);
// {
//   key: 'stats:total',
//   hasValue: true,
//   timestamp: 1640995200000,
//   expiresAt: 1640995500000,
//   ttl: 300000,
//   age: 120000,
//   timeToExpire: 180000,
//   isExpired: false,
//   valueType: 'object',
//   valueSize: 2048
// }
```

## ⚠️ Considérations importantes

### Limitations
- **Volatilité** : Les données sont perdues au redémarrage
- **Mémoire** : Consommation RAM selon la taille des données
- **Scalabilité** : Chaque instance a son propre cache

### Bonnes pratiques
- **TTL appropriés** : Équilibrer fraîcheur et performance
- **Invalidation** : Invalider après modifications
- **Monitoring** : Surveiller l'utilisation mémoire
- **Tests** : Tester les performances régulièrement

## 🚀 Déploiement

### Variables d'environnement
```bash
# Optionnel : Configurer le TTL par défaut
CACHE_DEFAULT_TTL=300000

# Optionnel : Activer les logs détaillés
CACHE_DEBUG=true
```

### Docker
Le cache fonctionne automatiquement dans les conteneurs Docker. Aucune configuration supplémentaire n'est requise.

## 📚 Ressources

- [Documentation API complète](./docs/api-documentation.md)
- [Guide de performance](./docs/performance-guide.md)
- [Scripts de test](./test-cache.js)

---

**Note** : Ce système de cache est optimisé pour InvestorMatch et peut être adapté selon les besoins spécifiques de votre application.
