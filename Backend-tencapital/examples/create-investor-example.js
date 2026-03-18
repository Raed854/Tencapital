// Exemple d'utilisation de l'API pour créer un nouvel investisseur

const axios = require('axios');

// Configuration de l'API
const API_BASE_URL = 'http://localhost:3000/api';
const AUTH_TOKEN = 'your-jwt-token-here'; // Remplacez par votre token d'authentification

// Données de l'investisseur à créer
const investorData = {
  investorType: "Venture Capital",
  sector: "Technology",
  industries: "Software, AI, Fintech",
  investmentStage: "Series A, Series B",
  revenueCriteria: "1M-10M",
  organizationPersonName: "TechVentures Capital",
  firstName: "John",
  lastName: "Smith",
  email: "john.smith@techventures.com",
  description: "Leading venture capital firm focused on early-stage technology companies",
  organizationPersonNameFirstNameLastName: "TechVentures Capital - John Smith",
  location: "San Francisco, CA",
  phoneNumber: "+1-555-0123",
  website: "https://techventures.com",
  linkedin: "https://linkedin.com/company/techventures"
};

// Fonction pour créer un investisseur
async function createInvestor() {
  try {
    console.log('🚀 Création d\'un nouvel investisseur...');
    console.log('📋 Données:', JSON.stringify(investorData, null, 2));
    
    const response = await axios.post(`${API_BASE_URL}/investors/`, investorData, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Succès!');
    console.log('📊 Réponse:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'investisseur:');
    
    if (error.response) {
      console.error('📊 Statut:', error.response.status);
      console.error('📋 Données d\'erreur:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('🔧 Erreur technique:', error.message);
    }
    
    throw error;
  }
}

// Fonction pour tester l'API sans authentification (pour les tests)
async function createInvestorWithoutAuth() {
  try {
    console.log('🚀 Test de création d\'investisseur sans authentification...');
    
    const response = await axios.post(`${API_BASE_URL}/investors/`, investorData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Succès!');
    console.log('📊 Réponse:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('❌ Erreur attendue (authentification requise):');
    console.error('📊 Statut:', error.response?.status);
    console.error('📋 Message:', error.response?.data?.message);
    
    return null;
  }
}

// Exécution des exemples
async function runExamples() {
  console.log('='.repeat(60));
  console.log('EXEMPLES D\'UTILISATION DE L\'API INVESTOR');
  console.log('='.repeat(60));
  
  // Test 1: Création avec authentification
  console.log('\n1. Test avec authentification:');
  await createInvestor();
  
  console.log('\n' + '-'.repeat(40));
  
  // Test 2: Test sans authentification (doit échouer)
  console.log('\n2. Test sans authentification (doit échouer):');
  await createInvestorWithoutAuth();
  
  console.log('\n' + '='.repeat(60));
  console.log('FIN DES EXEMPLES');
  console.log('='.repeat(60));
}

// Exécuter les exemples si ce fichier est appelé directement
if (require.main === module) {
  runExamples().catch(console.error);
}

module.exports = {
  createInvestor,
  createInvestorWithoutAuth,
  investorData
};
