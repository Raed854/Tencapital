/**
 * Cache Management Routes for InvestorMatch Backend
 * Provides admin endpoints for cache monitoring and management
 */

const express = require('express');
const router = express.Router();
const { authenticateToken, authorize } = require('../middleware/auth');
const { cacheStatsMiddleware, clearCacheMiddleware } = require('../middleware/cache');
const { cache } = require('../utils/cache');

// Middleware d'authentification pour toutes les routes de cache
router.use(authenticateToken);
router.use(authorize('admin'));

/**
 * @route GET /api/cache/stats
 * @desc Obtenir les statistiques du cache
 * @access Admin only
 */
router.get('/stats', cacheStatsMiddleware);

/**
 * @route DELETE /api/cache/clear
 * @desc Vider le cache (optionnel: pattern spécifique)
 * @access Admin only
 * @query {string} pattern - Pattern pour vider seulement certaines clés
 */
router.delete('/clear', clearCacheMiddleware);

/**
 * @route GET /api/cache/keys
 * @desc Obtenir toutes les clés du cache
 * @access Admin only
 */
router.get('/keys', (req, res) => {
  try {
    const keys = cache.keys();
    const { limit = 50, offset = 0 } = req.query;
    
    const paginatedKeys = keys.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
    
    res.json({
      success: true,
      keys: paginatedKeys,
      pagination: {
        total: keys.length,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < keys.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des clés du cache',
      error: error.message
    });
  }
});

/**
 * @route GET /api/cache/inspect/:key
 * @desc Inspecter une clé spécifique du cache
 * @access Admin only
 */
router.get('/inspect/:key', (req, res) => {
  try {
    const { key } = req.params;
    const inspection = cache.inspect(key);
    
    if (!inspection) {
      return res.status(404).json({
        success: false,
        message: 'Clé non trouvée dans le cache'
      });
    }
    
    res.json({
      success: true,
      inspection,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'inspection de la clé',
      error: error.message
    });
  }
});

/**
 * @route DELETE /api/cache/invalidate/:pattern
 * @desc Invalider le cache pour un pattern spécifique
 * @access Admin only
 */
router.delete('/invalidate/:pattern', (req, res) => {
  try {
    const { pattern } = req.params;
    
    cache.deletePattern(pattern);
    
    res.json({
      success: true,
      message: `Cache invalidé pour le pattern: ${pattern}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'invalidation du cache',
      error: error.message
    });
  }
});

/**
 * @route POST /api/cache/warmup
 * @desc Précharger le cache avec les données fréquemment utilisées
 * @access Admin only
 */
router.post('/warmup', async (req, res) => {
  try {
    console.log('🔥 Démarrage du préchargement du cache...');
    
    // Importer les contrôleurs nécessaires
    const InvestorController = require('../controllers/investorController');
    const ChartController = require('../controllers/chartController');
    
    const warmupResults = {
      success: [],
      errors: []
    };
    
    // Précharger les données de référence
    try {
      // Simuler des requêtes pour précharger le cache
      const mockReq = { query: {} };
      const mockRes = {
        json: (data) => {
          warmupResults.success.push('Filter options');
        },
        status: () => ({ json: () => {} })
      };
      
      await InvestorController.getFilterOptions(mockReq, mockRes);
    } catch (error) {
      warmupResults.errors.push(`Filter options: ${error.message}`);
    }
    
    // Précharger les statistiques
    try {
      const mockReq = {};
      const mockRes = {
        json: (data) => {
          warmupResults.success.push('Total stats');
        },
        status: () => ({ json: () => {} })
      };
      
      await InvestorController.getTotalStats(mockReq, mockRes);
    } catch (error) {
      warmupResults.errors.push(`Total stats: ${error.message}`);
    }
    
    // Précharger les données de graphiques
    try {
      const mockReq = {};
      const mockRes = {
        json: (data) => {
          warmupResults.success.push('Sector chart');
        },
        status: () => ({ json: () => {} })
      };
      
      await ChartController.getSectorChartData(mockReq, mockRes);
    } catch (error) {
      warmupResults.errors.push(`Sector chart: ${error.message}`);
    }
    
    console.log('✅ Préchargement du cache terminé');
    
    res.json({
      success: true,
      message: 'Préchargement du cache terminé',
      results: warmupResults,
      cacheStats: cache.getStats(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Erreur lors du préchargement du cache:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du préchargement du cache',
      error: error.message
    });
  }
});

/**
 * @route GET /api/cache/health
 * @desc Vérifier la santé du système de cache
 * @access Admin only
 */
router.get('/health', (req, res) => {
  try {
    const stats = cache.getStats();
    const memoryUsage = cache.getMemoryUsage();
    
    // Vérifier si le cache fonctionne correctement
    const isHealthy = stats.currentSize >= 0 && 
                     parseFloat(stats.hitRate) >= 0 && 
                     parseFloat(stats.hitRate) <= 100;
    
    res.json({
      success: true,
      health: {
        status: isHealthy ? 'healthy' : 'unhealthy',
        cacheSize: stats.currentSize,
        hitRate: stats.hitRate,
        memoryUsage,
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification de la santé du cache',
      error: error.message,
      health: {
        status: 'unhealthy',
        timestamp: new Date().toISOString()
      }
    });
  }
});

module.exports = router;
