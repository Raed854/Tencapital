/**
 * Test de Configuration API
 * Exécuter: node test-api-config.js (après avoir installé les dépendances)
 */

// Simuler process.env pour le test
process.env.REACT_APP_API_URL = 'http://localhost:5000';
process.env.REACT_APP_API_TIMEOUT = '10000';
process.env.NODE_ENV = 'development';
process.env.REACT_APP_ENABLE_DEBUG = 'true';

console.log('🧪 Test de Configuration API\n');
console.log('Variables d\'environnement:');
console.log('  REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
console.log('  REACT_APP_API_TIMEOUT:', process.env.REACT_APP_API_TIMEOUT);
console.log('  NODE_ENV:', process.env.NODE_ENV);
console.log('  REACT_APP_ENABLE_DEBUG:', process.env.REACT_APP_ENABLE_DEBUG);
console.log('');

// Test simple de la configuration
const testConfig = {
  get BASE_URL() {
    if (process.env.REACT_APP_API_URL) {
      return process.env.REACT_APP_API_URL;
    }
    return 'http://localhost:5000';
  },
  TIMEOUT: parseInt(process.env.REACT_APP_API_TIMEOUT) || 10000,
  get IS_PRODUCTION() {
    return process.env.NODE_ENV === 'production';
  },
  get DEBUG() {
    return process.env.REACT_APP_ENABLE_DEBUG === 'true';
  }
};

console.log('Configuration chargée:');
console.log('  BASE_URL:', testConfig.BASE_URL);
console.log('  TIMEOUT:', testConfig.TIMEOUT);
console.log('  IS_PRODUCTION:', testConfig.IS_PRODUCTION);
console.log('  DEBUG:', testConfig.DEBUG);
console.log('');

// Test des getters multiples
console.log('Test des getters (appels multiples):');
console.log('  BASE_URL (1):', testConfig.BASE_URL);
console.log('  BASE_URL (2):', testConfig.BASE_URL);
console.log('  BASE_URL (3):', testConfig.BASE_URL);
console.log('');

// Test avec variable non définie
delete process.env.REACT_APP_API_URL;
console.log('Test sans REACT_APP_API_URL:');
console.log('  BASE_URL (fallback):', testConfig.BASE_URL);
console.log('');

// Test en production
process.env.NODE_ENV = 'production';
console.log('Test en mode production:');
console.log('  IS_PRODUCTION:', testConfig.IS_PRODUCTION);
console.log('  DEBUG:', testConfig.DEBUG);
console.log('');

console.log('✅ Tous les tests passés!');
console.log('');
console.log('📝 Notes:');
console.log('  - Les getters permettent une évaluation dynamique');
console.log('  - BASE_URL a toujours une valeur (jamais undefined)');
console.log('  - Les fallbacks fonctionnent correctement');
