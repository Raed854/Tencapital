/**
 * 📊 Test des APIs de Graphiques
 * 
 * Ce fichier démontre l'utilisation des APIs de graphiques
 * pour générer des données de visualisation basées sur les
 * 4 tables de référence (Sector, Location, Industry, RevenueCriteria).
 */

const axios = require('axios');

// Configuration de base
const BASE_URL = 'http://localhost:3000/api/charts';

// Fonction utilitaire pour faire des requêtes
async function makeRequest(endpoint, params = {}) {
  try {
    const url = `${BASE_URL}${endpoint}`;
    const response = await axios.get(url, { params });
    return response.data;
  } catch (error) {
    console.error(`❌ Erreur pour ${endpoint}:`, error.message);
    return null;
  }
}

// Test 1: Graphiques par secteurs
async function testSectorCharts() {
  console.log('\n🔹 Test 1: Graphiques par Secteurs');
  console.log('=====================================');
  
  const data = await makeRequest('/sectors');
  if (data && data.success) {
    console.log(`✅ Titre: ${data.chartData.title}`);
    console.log(`📊 Total investisseurs: ${data.chartData.totalInvestors}`);
    console.log(`📈 Nombre de secteurs: ${data.chartData.data.length}`);
    
    // Afficher les top 3 secteurs
    const topSectors = data.chartData.data.slice(0, 3);
    console.log('\n🏆 Top 3 secteurs:');
    topSectors.forEach((sector, index) => {
      console.log(`   ${index + 1}. ${sector.name}: ${sector.count} (${sector.percentage}%)`);
    });
  }
}

// Test 2: Graphiques par localisations
async function testLocationCharts() {
  console.log('\n🔹 Test 2: Graphiques par Localisations');
  console.log('========================================');
  
  const data = await makeRequest('/locations');
  if (data && data.success) {
    console.log(`✅ Titre: ${data.chartData.title}`);
    console.log(`📊 Total investisseurs: ${data.chartData.totalInvestors}`);
    console.log(`📈 Nombre de localisations: ${data.chartData.data.length}`);
    
    // Afficher les top 3 localisations
    const topLocations = data.chartData.data.slice(0, 3);
    console.log('\n🏆 Top 3 localisations:');
    topLocations.forEach((location, index) => {
      console.log(`   ${index + 1}. ${location.name}: ${location.count} (${location.percentage}%)`);
    });
  }
}

// Test 3: Graphiques par industries
async function testIndustryCharts() {
  console.log('\n🔹 Test 3: Graphiques par Industries');
  console.log('====================================');
  
  const data = await makeRequest('/industries');
  if (data && data.success) {
    console.log(`✅ Titre: ${data.chartData.title}`);
    console.log(`📊 Total investisseurs: ${data.chartData.totalInvestors}`);
    console.log(`📈 Nombre d'industries: ${data.chartData.data.length}`);
    
    // Afficher les top 3 industries
    const topIndustries = data.chartData.data.slice(0, 3);
    console.log('\n🏆 Top 3 industries:');
    topIndustries.forEach((industry, index) => {
      console.log(`   ${index + 1}. ${industry.name}: ${industry.count} (${industry.percentage}%)`);
    });
  }
}

// Test 4: Graphiques par critères de revenus
async function testRevenueCriteriaCharts() {
  console.log('\n🔹 Test 4: Graphiques par Critères de Revenus');
  console.log('=============================================');
  
  const data = await makeRequest('/revenue-criteria');
  if (data && data.success) {
    console.log(`✅ Titre: ${data.chartData.title}`);
    console.log(`📊 Total investisseurs: ${data.chartData.totalInvestors}`);
    console.log(`📈 Nombre de critères: ${data.chartData.data.length}`);
    
    // Afficher les top 3 critères
    const topCriteria = data.chartData.data.slice(0, 3);
    console.log('\n🏆 Top 3 critères de revenus:');
    topCriteria.forEach((criteria, index) => {
      console.log(`   ${index + 1}. ${criteria.name}: ${criteria.count} (${criteria.percentage}%)`);
    });
  }
}

// Test 5: Tous les graphiques
async function testAllCharts() {
  console.log('\n🔹 Test 5: Tous les Graphiques');
  console.log('==============================');
  
  const data = await makeRequest('/all');
  if (data && data.success) {
    console.log(`✅ Total investisseurs: ${data.chartsData.totalInvestors}`);
    
    // Afficher les statistiques pour chaque catégorie
    Object.keys(data.chartsData).forEach(key => {
      if (key !== 'totalInvestors' && data.chartsData[key].data) {
        const category = data.chartsData[key];
        console.log(`📊 ${category.title}: ${category.data.length} éléments`);
      }
    });
  }
}

// Test 6: Top N éléments
async function testTopItems() {
  console.log('\n🔹 Test 6: Top N Éléments');
  console.log('=========================');
  
  const data = await makeRequest('/top', { limit: 5 });
  if (data && data.success) {
    console.log(`✅ Total investisseurs: ${data.chartsData.totalInvestors}`);
    
    // Afficher les top 5 pour chaque catégorie
    Object.keys(data.chartsData).forEach(key => {
      if (key !== 'totalInvestors' && data.chartsData[key].data) {
        const category = data.chartsData[key];
        console.log(`\n🏆 ${category.title}:`);
        category.data.slice(0, 3).forEach((item, index) => {
          console.log(`   ${index + 1}. ${item.name}: ${item.count} (${item.percentage}%)`);
        });
      }
    });
  }
}

// Test 7: Graphiques filtrés
async function testFilteredCharts() {
  console.log('\n🔹 Test 7: Graphiques Filtrés');
  console.log('=============================');
  
  // Test avec un filtre de recherche textuelle
  const data = await makeRequest('/filtered', { 
    searchTerm: 'Technology',
    investorType: 'Venture Capital'
  });
  
  if (data && data.success) {
    console.log(`✅ Total investisseurs filtrés: ${data.chartsData.totalInvestors}`);
    console.log(`🔍 Filtres appliqués:`);
    console.log(`   - Terme de recherche: ${data.chartsData.appliedFilters.searchTerm}`);
    console.log(`   - Type d'investisseur: ${data.chartsData.appliedFilters.investorType}`);
    
    // Afficher les résultats filtrés
    Object.keys(data.chartsData).forEach(key => {
      if (key !== 'totalInvestors' && key !== 'appliedFilters' && data.chartsData[key].data) {
        const category = data.chartsData[key];
        console.log(`📊 ${category.title}: ${category.data.length} éléments`);
      }
    });
  }
}

// Fonction principale pour exécuter tous les tests
async function runAllTests() {
  console.log('🚀 Démarrage des tests des APIs de Graphiques');
  console.log('============================================');
  
  try {
    await testSectorCharts();
    await testLocationCharts();
    await testIndustryCharts();
    await testRevenueCriteriaCharts();
    await testAllCharts();
    await testTopItems();
    await testFilteredCharts();
    
    console.log('\n✅ Tous les tests terminés avec succès !');
    console.log('🎉 Les APIs de graphiques sont fonctionnelles !');
    
  } catch (error) {
    console.error('\n❌ Erreur lors des tests:', error.message);
  }
}

// Exécuter les tests si le fichier est appelé directement
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testSectorCharts,
  testLocationCharts,
  testIndustryCharts,
  testRevenueCriteriaCharts,
  testAllCharts,
  testTopItems,
  testFilteredCharts,
  runAllTests
};
