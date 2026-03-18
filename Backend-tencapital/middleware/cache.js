/**
 * Cache Middleware for InvestorMatch Backend
 * Provides automatic caching for API routes with configurable TTL
 */

const { cache, CACHE_TTL, CacheKeys } = require('../utils/cache');

/**
 * Middleware de cache générique pour les routes GET
 * @param {object} options - Options de configuration du cache
 * @param {string} options.key - Clé de cache personnalisée
 * @param {number} options.ttl - Durée de vie en millisecondes
 * @param {function} options.keyGenerator - Fonction pour générer la clé dynamiquement
 * @param {boolean} options.skipCache - Fonction pour déterminer si le cache doit être ignoré
 * @returns {function} - Middleware Express
 */
const cacheMiddleware = (options = {}) => {
  const {
    key,
    ttl = CACHE_TTL.STATISTICS,
    keyGenerator,
    skipCache = () => false
  } = options;

  return (req, res, next) => {
    // Ignorer le cache si spécifié
    if (skipCache(req)) {
      return next();
    }

    // Générer la clé de cache
    let cacheKey;
    if (keyGenerator) {
      cacheKey = keyGenerator(req);
    } else if (key) {
      cacheKey = key;
    } else {
      // Clé par défaut basée sur la route et les paramètres
      const routeKey = `${req.method}:${req.originalUrl}`;
      const queryString = Object.keys(req.query).length > 0 
        ? `:${JSON.stringify(req.query)}` 
        : '';
      cacheKey = `route:${routeKey}${queryString}`;
    }

    // Vérifier le cache
    try {
      const cachedData = cache.get(cacheKey);
      if (cachedData) {
        const env = process.env.NODE_ENV || 'development';
        if (env !== 'production') {
          console.log(`🚀 Cache HIT pour route: ${req.originalUrl}`);
        }
        return res.json({
          ...cachedData,
          _cached: true,
          _cacheKey: cacheKey,
          _timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      // En cas d'erreur de cache, continuer sans cache
      console.error('❌ Cache middleware error:', error.message);
    }

    // Intercepter la réponse pour la mettre en cache
    const originalJson = res.json;
    res.json = function(data) {
      // Ne pas mettre en cache les erreurs
      if (res.statusCode >= 400) {
        return originalJson.call(this, data);
      }

      // Mettre en cache la réponse
      try {
        cache.set(cacheKey, data, ttl);
        const env = process.env.NODE_ENV || 'development';
        if (env !== 'production') {
          console.log(`💾 Cache SET pour route: ${req.originalUrl} (TTL: ${ttl}ms)`);
        }
      } catch (error) {
        // En cas d'erreur de cache, continuer sans mettre en cache
        console.error('❌ Cache SET error:', error.message);
      }

      // Ajouter des métadonnées de cache
      const responseData = {
        ...data,
        _cached: false,
        _cacheKey: cacheKey,
        _timestamp: new Date().toISOString()
      };

      return originalJson.call(this, responseData);
    };

    next();
  };
};

/**
 * Middleware de cache spécialisé pour les données de référence
 */
const referenceDataCache = cacheMiddleware({
  ttl: CACHE_TTL.REFERENCE_DATA,
  keyGenerator: (req) => {
    const resource = req.params.resource || req.route.path.split('/').pop();
    return CacheKeys[resource] ? CacheKeys[resource]() : `ref:${resource}`;
  }
});

/**
 * Middleware de cache pour les statistiques
 */
const statisticsCache = cacheMiddleware({
  ttl: CACHE_TTL.STATISTICS,
  keyGenerator: (req) => {
    const endpoint = req.route.path.split('/').pop();
    return `stats:${endpoint}`;
  }
});

/**
 * Middleware de cache pour les données de graphiques
 */
const chartDataCache = cacheMiddleware({
  ttl: CACHE_TTL.CHART_DATA,
  keyGenerator: (req) => {
    const chartType = req.params.chartType || req.query.type || 'all';
    const limit = req.query.limit || 'default';
    return `chart:${chartType}:${limit}`;
  }
});

/**
 * Middleware de cache pour les recherches d'investisseurs
 */
const investorSearchCache = cacheMiddleware({
  ttl: CACHE_TTL.SEARCH_RESULTS,
  keyGenerator: (req) => {
    const searchParams = {
      ...req.query,
      ...req.params
    };
    return CacheKeys.investorSearch(searchParams);
  },
  skipCache: (req) => {
    // Ne pas mettre en cache si c'est une recherche en temps réel
    return req.query.realtime === 'true' || req.query.nocache === 'true';
  }
});

/**
 * Middleware de cache pour les listes d'investisseurs
 */
const investorListCache = cacheMiddleware({
  ttl: CACHE_TTL.INVESTOR_LIST,
  keyGenerator: (req) => {
    const withUsers = req.query.withUsers || 'false';
    return CacheKeys.allInvestors(withUsers);
  }
});

/**
 * Middleware de cache pour les filtres
 */
const filterCache = cacheMiddleware({
  ttl: CACHE_TTL.FILTER_OPTIONS,
  keyGenerator: (req) => CacheKeys.filterOptions()
});

/**
 * Middleware de cache pour les données utilisateur
 */
const userDataCache = cacheMiddleware({
  ttl: CACHE_TTL.USER_DATA,
  keyGenerator: (req) => {
    const userId = req.params.userId || req.user?.id;
    const dataType = req.route.path.split('/').pop();
    return `user:${dataType}:${userId}`;
  }
});

/**
 * Middleware pour invalider le cache après modification
 */
const invalidateCache = (patterns = []) => {
  return (req, res, next) => {
    // Intercepter la réponse pour invalider le cache après succès
    const originalJson = res.json;
    res.json = function(data) {
      // Invalider le cache seulement si la requête a réussi
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          patterns.forEach(pattern => {
            cache.deletePattern(pattern);
          });
          const env = process.env.NODE_ENV || 'development';
          if (env !== 'production') {
            console.log(`🗑️ Cache invalidé pour patterns: ${patterns.join(', ')}`);
          }
        } catch (error) {
          console.error('❌ Cache invalidation error:', error.message);
        }
      }
      return originalJson.call(this, data);
    };
    next();
  };
};

/**
 * Middleware pour invalider le cache des investisseurs
 */
const invalidateInvestorCache = invalidateCache([
  'investors:',
  'stats:',
  'chart:',
  'filter:',
  'search:'
]);

/**
 * Middleware pour invalider le cache des données de référence
 */
const invalidateReferenceCache = invalidateCache([
  'ref:',
  'stats:filterOptions',
  'chart:'
]);

/**
 * Middleware pour invalider le cache utilisateur
 */
const invalidateUserCache = invalidateCache([
  'user:',
  'investors:'
]);

/**
 * Middleware pour obtenir les statistiques du cache (admin seulement)
 */
const cacheStatsMiddleware = (req, res, next) => {
  try {
    const stats = cache.getStats();
    res.json({
      success: true,
      cacheStats: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques du cache',
      error: error.message
    });
  }
};

/**
 * Middleware pour vider le cache (admin seulement)
 */
const clearCacheMiddleware = (req, res, next) => {
  try {
    const { pattern } = req.query;
    
    if (pattern) {
      cache.deletePattern(pattern);
      res.json({
        success: true,
        message: `Cache vidé pour le pattern: ${pattern}`,
        timestamp: new Date().toISOString()
      });
    } else {
      cache.clear();
      res.json({
        success: true,
        message: 'Cache complètement vidé',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors du vidage du cache',
      error: error.message
    });
  }
};

module.exports = {
  cacheMiddleware,
  referenceDataCache,
  statisticsCache,
  chartDataCache,
  investorSearchCache,
  investorListCache,
  filterCache,
  userDataCache,
  invalidateCache,
  invalidateInvestorCache,
  invalidateReferenceCache,
  invalidateUserCache,
  cacheStatsMiddleware,
  clearCacheMiddleware
};
