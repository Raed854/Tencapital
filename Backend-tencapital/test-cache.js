/**
 * Cache System Test Script for InvestorMatch Backend
 * Tests the in-memory cache functionality
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5000';
const TEST_ADMIN_CREDENTIALS = {
  email: 'admin@investormatch.com',
  password: 'admin123'
};

let authToken = '';

// Fonction pour obtenir le token d'authentification
async function getAuthToken() {
  try {
    console.log('🔐 Authentification en cours...');
    const response = await axios.post(`${BASE_URL}/api/users/login`, TEST_ADMIN_CREDENTIALS);
    
    if (response.data.success && response.data.token) {
      authToken = response.data.token;
      console.log('✅ Authentification réussie');
      return true;
    } else {
      console.log('❌ Échec de l\'authentification');
      return false;
    }
  } catch (error) {
    console.log('❌ Erreur d\'authentification:', error.message);
    return false;
  }
}

// Fonction pour tester les statistiques du cache
async function testCacheStats() {
  try {
    console.log('\n📊 Test des statistiques du cache...');
    const response = await axios.get(`${BASE_URL}/api/cache/stats`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Statistiques du cache:', response.data.cacheStats);
    return response.data.cacheStats;
  } catch (error) {
    console.log('❌ Erreur lors de la récupération des statistiques:', error.message);
    return null;
  }
}

// Fonction pour tester la santé du cache
async function testCacheHealth() {
  try {
    console.log('\n🏥 Test de la santé du cache...');
    const response = await axios.get(`${BASE_URL}/api/cache/health`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Santé du cache:', response.data.health);
    return response.data.health;
  } catch (error) {
    console.log('❌ Erreur lors du test de santé:', error.message);
    return null;
  }
}

// Fonction pour tester les clés du cache
async function testCacheKeys() {
  try {
    console.log('\n🔑 Test des clés du cache...');
    const response = await axios.get(`${BASE_URL}/api/cache/keys`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Clés du cache:', response.data.keys);
    console.log('📄 Pagination:', response.data.pagination);
    return response.data.keys;
  } catch (error) {
    console.log('❌ Erreur lors de la récupération des clés:', error.message);
    return null;
  }
}

// Fonction pour tester le préchargement du cache
async function testCacheWarmup() {
  try {
    console.log('\n🔥 Test du préchargement du cache...');
    const response = await axios.post(`${BASE_URL}/api/cache/warmup`, {}, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Préchargement terminé:', response.data.results);
    return response.data.results;
  } catch (error) {
    console.log('❌ Erreur lors du préchargement:', error.message);
    return null;
  }
}

// Fonction pour tester les performances du cache
async function testCachePerformance() {
  try {
    console.log('\n⚡ Test des performances du cache...');
    
    // Test 1: Première requête (cache miss)
    console.log('🔄 Première requête (cache miss)...');
    const start1 = Date.now();
    const response1 = await axios.get(`${BASE_URL}/api/investors/stats/total`);
    const time1 = Date.now() - start1;
    console.log(`⏱️ Temps: ${time1}ms, Cached: ${response1.data._cached}`);
    
    // Test 2: Deuxième requête (cache hit)
    console.log('🔄 Deuxième requête (cache hit)...');
    const start2 = Date.now();
    const response2 = await axios.get(`${BASE_URL}/api/investors/stats/total`);
    const time2 = Date.now() - start2;
    console.log(`⏱️ Temps: ${time2}ms, Cached: ${response2.data._cached}`);
    
    // Test 3: Troisième requête (cache hit)
    console.log('🔄 Troisième requête (cache hit)...');
    const start3 = Date.now();
    const response3 = await axios.get(`${BASE_URL}/api/investors/stats/total`);
    const time3 = Date.now() - start3;
    console.log(`⏱️ Temps: ${time3}ms, Cached: ${response3.data._cached}`);
    
    const avgCacheTime = (time2 + time3) / 2;
    const improvement = ((time1 - avgCacheTime) / time1 * 100).toFixed(2);
    
    console.log(`\n📈 Amélioration des performances: ${improvement}%`);
    console.log(`🚀 Vitesse moyenne avec cache: ${avgCacheTime}ms`);
    console.log(`🐌 Vitesse sans cache: ${time1}ms`);
    
    return {
      withoutCache: time1,
      withCache: avgCacheTime,
      improvement: parseFloat(improvement)
    };
  } catch (error) {
    console.log('❌ Erreur lors du test de performance:', error.message);
    return null;
  }
}

// Fonction pour tester l'invalidation du cache
async function testCacheInvalidation() {
  try {
    console.log('\n🗑️ Test de l\'invalidation du cache...');
    
    // Vérifier les clés avant invalidation
    const keysBefore = await testCacheKeys();
    
    // Invalider le cache des statistiques
    console.log('🔄 Invalidation du cache des statistiques...');
    await axios.delete(`${BASE_URL}/api/cache/invalidate/stats:`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    // Vérifier les clés après invalidation
    const keysAfter = await testCacheKeys();
    
    console.log(`📊 Clés avant: ${keysBefore?.length || 0}`);
    console.log(`📊 Clés après: ${keysAfter?.length || 0}`);
    
    return {
      before: keysBefore?.length || 0,
      after: keysAfter?.length || 0
    };
  } catch (error) {
    console.log('❌ Erreur lors du test d\'invalidation:', error.message);
    return null;
  }
}

// Fonction principale de test
async function runCacheTests() {
  console.log('🚀 Démarrage des tests du système de cache...\n');
  
  // Authentification
  const authSuccess = await getAuthToken();
  if (!authSuccess) {
    console.log('❌ Impossible de continuer sans authentification');
    return;
  }
  
  // Tests
  const results = {
    stats: await testCacheStats(),
    health: await testCacheHealth(),
    keys: await testCacheKeys(),
    warmup: await testCacheWarmup(),
    performance: await testCachePerformance(),
    invalidation: await testCacheInvalidation()
  };
  
  // Résumé des tests
  console.log('\n📋 Résumé des tests:');
  console.log('==================');
  console.log(`✅ Statistiques: ${results.stats ? 'OK' : 'ÉCHEC'}`);
  console.log(`✅ Santé: ${results.health ? 'OK' : 'ÉCHEC'}`);
  console.log(`✅ Clés: ${results.keys ? 'OK' : 'ÉCHEC'}`);
  console.log(`✅ Préchargement: ${results.warmup ? 'OK' : 'ÉCHEC'}`);
  console.log(`✅ Performance: ${results.performance ? 'OK' : 'ÉCHEC'}`);
  console.log(`✅ Invalidation: ${results.invalidation ? 'OK' : 'ÉCHEC'}`);
  
  if (results.performance) {
    console.log(`\n🚀 Amélioration des performances: ${results.performance.improvement}%`);
  }
  
  console.log('\n✅ Tests terminés!');
}

// Exécuter les tests si le script est appelé directement
if (require.main === module) {
  runCacheTests().catch(console.error);
}

module.exports = {
  runCacheTests,
  testCacheStats,
  testCacheHealth,
  testCacheKeys,
  testCacheWarmup,
  testCachePerformance,
  testCacheInvalidation
};
