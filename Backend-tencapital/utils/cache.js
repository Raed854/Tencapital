/**
 * In-Memory Cache System for InvestorMatch Backend
 * Provides fast data access with automatic expiration and cleanup
 */

class InMemoryCache {
  constructor(defaultTTL = 300000) { // 5 minutes par défaut
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      expires: 0,
      errors: 0
    };
    this.enabled = true;
    this.maxSize = 10000; // Limite de taille pour éviter les fuites mémoire
    
    // Nettoyage automatique toutes les 2 minutes
    this.cleanupInterval = setInterval(() => {
      try {
        this.cleanup();
      } catch (error) {
        console.error('❌ Cache cleanup error:', error.message);
        this.stats.errors++;
      }
    }, 120000);
    
    // Nettoyer l'intervalle à l'arrêt du processus
    process.on('SIGTERM', () => this.destroy());
    process.on('SIGINT', () => this.destroy());
    
    const env = process.env.NODE_ENV || 'development';
    if (env !== 'production') {
      console.log('🚀 Cache système initialisé avec TTL par défaut:', defaultTTL + 'ms');
    }
  }

  /**
   * Stocker une valeur dans le cache
   * @param {string} key - Clé unique
   * @param {any} value - Valeur à stocker
   * @param {number} ttl - Durée de vie en millisecondes (optionnel)
   */
  set(key, value, ttl = this.defaultTTL) {
    if (!this.enabled) return;
    
    try {
      // Vérifier la taille du cache
      if (this.cache.size >= this.maxSize) {
        // Supprimer les 10% les plus anciennes entrées
        const entriesToDelete = Math.floor(this.maxSize * 0.1);
        const sortedEntries = Array.from(this.cache.entries())
          .sort((a, b) => a[1].timestamp - b[1].timestamp)
          .slice(0, entriesToDelete);
        
        sortedEntries.forEach(([k]) => this.cache.delete(k));
      }
      
      const now = Date.now();
      const expiresAt = now + ttl;
      
      this.cache.set(key, {
        value,
        timestamp: now,
        expiresAt,
        ttl
      });
      
      this.stats.sets++;
      
      const env = process.env.NODE_ENV || 'development';
      if (env !== 'production') {
        console.log(`💾 Cache SET: ${key} (TTL: ${ttl}ms)`);
      }
    } catch (error) {
      console.error('❌ Cache SET error:', error.message);
      this.stats.errors++;
    }
  }

  /**
   * Récupérer une valeur du cache
   * @param {string} key - Clé à récupérer
   * @returns {any|null} - Valeur ou null si expirée/inexistante
   */
  get(key) {
    if (!this.enabled) return null;
    
    try {
      const item = this.cache.get(key);
      
      if (!item) {
        this.stats.misses++;
        return null;
      }

      // Vérifier l'expiration
      if (Date.now() > item.expiresAt) {
        this.cache.delete(key);
        this.stats.expires++;
        this.stats.misses++;
        const env = process.env.NODE_ENV || 'development';
        if (env !== 'production') {
          console.log(`⏰ Cache EXPIRED: ${key}`);
        }
        return null;
      }

      this.stats.hits++;
      const env = process.env.NODE_ENV || 'development';
      if (env !== 'production') {
        console.log(`✅ Cache HIT: ${key}`);
      }
      return item.value;
    } catch (error) {
      console.error('❌ Cache GET error:', error.message);
      this.stats.errors++;
      this.stats.misses++;
      return null;
    }
  }

  /**
   * Vérifier si une clé existe et n'est pas expirée
   * @param {string} key - Clé à vérifier
   * @returns {boolean}
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * Supprimer une clé du cache
   * @param {string} key - Clé à supprimer
   * @returns {boolean} - True si la clé existait
   */
  delete(key) {
    const existed = this.cache.delete(key);
    if (existed) {
      this.stats.deletes++;
      console.log(`🗑️ Cache DELETE: ${key}`);
    }
    return existed;
  }

  /**
   * Supprimer toutes les clés correspondant à un pattern
   * @param {string} pattern - Pattern à utiliser (utilise includes)
   */
  deletePattern(pattern) {
    if (!this.enabled) return;
    
    try {
      let deletedCount = 0;
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
          deletedCount++;
        }
      }
      this.stats.deletes += deletedCount;
      const env = process.env.NODE_ENV || 'development';
      if (env !== 'production') {
        console.log(`🗑️ Cache DELETE PATTERN: ${pattern} (${deletedCount} clés supprimées)`);
      }
    } catch (error) {
      console.error('❌ Cache DELETE PATTERN error:', error.message);
      this.stats.errors++;
    }
  }

  /**
   * Vider complètement le cache
   */
  clear() {
    const size = this.cache.size;
    this.cache.clear();
    this.stats.deletes += size;
    console.log(`🧹 Cache CLEARED: ${size} clés supprimées`);
  }

  /**
   * Obtenir la taille actuelle du cache
   * @returns {number}
   */
  size() {
    return this.cache.size;
  }

  /**
   * Obtenir les statistiques du cache
   * @returns {object}
   */
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0 
      ? ((this.stats.hits / (this.stats.hits + this.stats.misses)) * 100).toFixed(2)
      : 0;

    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      currentSize: this.cache.size,
      maxSize: this.maxSize,
      enabled: this.enabled,
      memoryUsage: this.getMemoryUsage()
    };
  }
  
  /**
   * Activer/désactiver le cache
   * @param {boolean} enabled - État du cache
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    console.log(`🔄 Cache ${enabled ? 'activé' : 'désactivé'}`);
  }

  /**
   * Obtenir une estimation de l'utilisation mémoire
   * @returns {string}
   */
  getMemoryUsage() {
    const used = process.memoryUsage();
    return {
      rss: `${Math.round(used.rss / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)} MB`,
      external: `${Math.round(used.external / 1024 / 1024)} MB`
    };
  }

  /**
   * Nettoyer les entrées expirées
   */
  cleanup() {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
        cleanedCount++;
        this.stats.expires++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`🧹 Cache CLEANUP: ${cleanedCount} entrées expirées supprimées`);
    }
  }

  /**
   * Obtenir toutes les clés du cache
   * @returns {Array<string>}
   */
  keys() {
    return Array.from(this.cache.keys());
  }

  /**
   * Obtenir des informations détaillées sur une clé
   * @param {string} key - Clé à inspecter
   * @returns {object|null}
   */
  inspect(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    const now = Date.now();
    return {
      key,
      hasValue: true,
      timestamp: item.timestamp,
      expiresAt: item.expiresAt,
      ttl: item.ttl,
      age: now - item.timestamp,
      timeToExpire: item.expiresAt - now,
      isExpired: now > item.expiresAt,
      valueType: typeof item.value,
      valueSize: JSON.stringify(item.value).length
    };
  }

  /**
   * Détruire le cache et nettoyer les intervalles
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
    console.log('💥 Cache système détruit');
  }
}

// Instance singleton du cache
const cache = new InMemoryCache();

// Configuration des TTL par type de données
const CACHE_TTL = {
  REFERENCE_DATA: 600000,    // 10 minutes - données de référence (secteurs, industries, etc.)
  STATISTICS: 300000,        // 5 minutes - statistiques et métriques
  FILTER_OPTIONS: 600000,    // 10 minutes - options de filtres
  CHART_DATA: 300000,        // 5 minutes - données de graphiques
  SEARCH_RESULTS: 180000,    // 3 minutes - résultats de recherche
  USER_DATA: 600000,         // 10 minutes - données utilisateur
  INVESTOR_LIST: 120000,     // 2 minutes - listes d'investisseurs
  DASHBOARD_STATS: 300000    // 5 minutes - statistiques dashboard
};

// Fonctions utilitaires pour les clés de cache
const CacheKeys = {
  // Données de référence
  sectors: () => 'ref:sectors',
  locations: () => 'ref:locations',
  industries: () => 'ref:industries',
  revenueCriteria: () => 'ref:revenueCriteria',
  investmentStages: () => 'ref:investmentStages',
  investorTypes: () => 'ref:investorTypes',

  // Statistiques
  totalStats: () => 'stats:total',
  dashboardStats: () => 'stats:dashboard',
  filterOptions: () => 'stats:filterOptions',

  // Données de graphiques
  sectorChart: () => 'chart:sector',
  locationChart: () => 'chart:location',
  industryChart: () => 'chart:industry',
  revenueChart: () => 'chart:revenue',
  allCharts: () => 'chart:all',
  topItems: (limit) => `chart:top:${limit}`,

  // Recherches et filtres
  investorSearch: (params) => `search:investors:${JSON.stringify(params)}`,
  investorFilter: (params) => `filter:investors:${JSON.stringify(params)}`,
  savedFilter: (filterId) => `filter:saved:${filterId}`,

  // Données utilisateur
  userProfile: (userId) => `user:profile:${userId}`,
  userInvestors: (userId) => `user:investors:${userId}`,

  // Listes d'investisseurs
  allInvestors: (withUsers) => `investors:all:${withUsers}`,
  investorById: (investorId) => `investor:${investorId}`
};

module.exports = {
  cache,
  CACHE_TTL,
  CacheKeys
};
