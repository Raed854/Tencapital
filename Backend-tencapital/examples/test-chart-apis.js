/**
 * 🧪 Test des APIs de Graphiques
 * 
 * Ce fichier teste toutes les APIs de graphiques créées
 * pour s'assurer qu'elles fonctionnent correctement.
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000/api/charts';

// Fonction utilitaire pour tester une API
async function testAPI(endpoint, description, params = {}) {
  console.log(`\n🔍 Test: ${description}`);
  console.log(`📍 Endpoint: ${endpoint}`);
  console.log('='.repeat(50));
  
  try {
    const response = await axios.get(`${BASE_URL}${endpoint}`, { params });
    
    if (response.data.success) {
      console.log('✅ Status: SUCCESS');
      console.log(`📊 Données reçues: ${JSON.stringify(response.data).length} caractères`);
      
      // Afficher les statistiques
      if (response.data.chartData) {
        console.log(`📈 Titre: ${response.data.chartData.title}`);
        console.log(`📊 Total: ${response.data.chartData.totalInvestors} investisseurs`);
        console.log(`📋 Éléments: ${response.data.chartData.data.length}`);
      }
      
      if (response.data.chartsData) {
        console.log(`📊 Total: ${response.data.chartsData.totalInvestors} investisseurs`);
        Object.keys(response.data.chartsData).forEach(key => {
          if (key !== 'totalInvestors' && response.data.chartsData[key].data) {
            console.log(`📈 ${key}: ${response.data.chartsData[key].data.length} éléments`);
          }
        });
      }
      
      return true;
    } else {
      console.log('❌ Status: FAILED');
      console.log(`💥 Erreur: ${response.data.message}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Status: ERROR');
    console.log(`💥 Erreur: ${error.message}`);
    
    if (error.response) {
      console.log(`📊 Status Code: ${error.response.status}`);
      console.log(`📋 Response: ${JSON.stringify(error.response.data)}`);
    }
    
    return false;
  }
}

// Tests des APIs de graphiques
async function runChartAPITests() {
  console.log('🚀 Démarrage des tests des APIs de Graphiques');
  console.log('='.repeat(60));
  
  const results = [];
  
  // Test 1: API Secteurs
  results.push(await testAPI('/sectors', 'Graphiques par Secteurs'));
  
  // Test 2: API Localisations
  results.push(await testAPI('/locations', 'Graphiques par Localisations'));
  
  // Test 3: API Industries
  results.push(await testAPI('/industries', 'Graphiques par Industries'));
  
  // Test 4: API Critères de Revenus
  results.push(await testAPI('/revenue-criteria', 'Graphiques par Critères de Revenus'));
  
  // Test 5: API Tous les Graphiques
  results.push(await testAPI('/all', 'Tous les Graphiques'));
  
  // Test 6: API Top N Éléments
  results.push(await testAPI('/top', 'Top N Éléments', { limit: 5 }));
  
  // Test 7: API Graphiques Filtrés (sans filtres)
  results.push(await testAPI('/filtered', 'Graphiques Filtrés (sans filtres)'));
  
  // Test 8: API Graphiques Filtrés (avec filtres)
  results.push(await testAPI('/filtered', 'Graphiques Filtrés (avec filtres)', {
    searchTerm: 'Technology',
    investorType: 'Venture Capital'
  }));
  
  // Résumé des tests
  console.log('\n📊 Résumé des Tests');
  console.log('='.repeat(30));
  
  const successCount = results.filter(r => r === true).length;
  const totalCount = results.length;
  const successRate = ((successCount / totalCount) * 100).toFixed(1);
  
  console.log(`✅ Tests réussis: ${successCount}/${totalCount}`);
  console.log(`📈 Taux de réussite: ${successRate}%`);
  
  if (successRate === '100.0') {
    console.log('🎉 Tous les tests sont passés avec succès !');
    console.log('🚀 Les APIs de graphiques sont 100% fonctionnelles !');
  } else {
    console.log('⚠️ Certains tests ont échoué. Vérifiez les erreurs ci-dessus.');
  }
  
  return { successCount, totalCount, successRate };
}

// Test de performance
async function testPerformance() {
  console.log('\n⚡ Test de Performance');
  console.log('='.repeat(30));
  
  const endpoints = [
    '/sectors',
    '/locations', 
    '/industries',
    '/revenue-criteria',
    '/all',
    '/top?limit=10'
  ];
  
  const results = [];
  
  for (const endpoint of endpoints) {
    const startTime = Date.now();
    
    try {
      await axios.get(`${BASE_URL}${endpoint}`);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      results.push({ endpoint, duration, success: true });
      console.log(`✅ ${endpoint}: ${duration}ms`);
    } catch (error) {
      results.push({ endpoint, duration: 0, success: false });
      console.log(`❌ ${endpoint}: ERROR`);
    }
  }
  
  const avgDuration = results
    .filter(r => r.success)
    .reduce((sum, r) => sum + r.duration, 0) / results.filter(r => r.success).length;
  
  console.log(`📊 Durée moyenne: ${avgDuration.toFixed(2)}ms`);
  
  return results;
}

// Test de validation des données
async function testDataValidation() {
  console.log('\n🔍 Test de Validation des Données');
  console.log('='.repeat(40));
  
  try {
    const response = await axios.get(`${BASE_URL}/all`);
    const data = response.data.chartsData;
    
    // Vérifier la structure des données
    const requiredFields = ['totalInvestors', 'sectors', 'locations', 'industries', 'revenueCriteria'];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length === 0) {
      console.log('✅ Structure des données: VALIDE');
    } else {
      console.log('❌ Champs manquants:', missingFields);
    }
    
    // Vérifier les types de données
    if (typeof data.totalInvestors === 'number') {
      console.log('✅ Type totalInvestors: VALIDE');
    } else {
      console.log('❌ Type totalInvestors: INVALIDE');
    }
    
    // Vérifier les données de chaque catégorie
    Object.keys(data).forEach(key => {
      if (key !== 'totalInvestors' && data[key].data) {
        const items = data[key].data;
        if (Array.isArray(items)) {
          console.log(`✅ ${key}: ${items.length} éléments (Array)`);
        } else {
          console.log(`❌ ${key}: Type invalide`);
        }
      }
    });
    
    return true;
  } catch (error) {
    console.log('❌ Erreur de validation:', error.message);
    return false;
  }
}

// Fonction principale
async function runAllTests() {
  console.log('🧪 Tests Complets des APIs de Graphiques');
  console.log('='.repeat(50));
  
  try {
    // Tests fonctionnels
    const functionalResults = await runChartAPITests();
    
    // Tests de performance
    const performanceResults = await testPerformance();
    
    // Tests de validation
    const validationResults = await testDataValidation();
    
    // Résumé final
    console.log('\n🏆 Résumé Final');
    console.log('='.repeat(20));
    console.log(`📊 Tests fonctionnels: ${functionalResults.successRate}%`);
    console.log(`⚡ Tests de performance: ${performanceResults.filter(r => r.success).length}/${performanceResults.length}`);
    console.log(`🔍 Tests de validation: ${validationResults ? 'PASSED' : 'FAILED'}`);
    
    if (functionalResults.successRate === '100.0' && validationResults) {
      console.log('\n🎉 Tous les tests sont passés !');
      console.log('🚀 Les APIs de graphiques sont prêtes pour la production !');
    } else {
      console.log('\n⚠️ Certains tests ont échoué. Vérifiez les erreurs.');
    }
    
  } catch (error) {
    console.error('\n💥 Erreur lors des tests:', error.message);
  }
}

// Exécuter les tests si le fichier est appelé directement
if (require.main === module) {
  runAllTests();
}

module.exports = {
  runChartAPITests,
  testPerformance,
  testDataValidation,
  runAllTests
};
