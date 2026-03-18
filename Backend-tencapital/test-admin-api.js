#!/usr/bin/env node

/**
 * Script de test rapide pour l'API de création d'utilisateurs admin
 * Usage: node test-admin-api.js
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';

// Données de test pour créer un utilisateur admin
const adminData = {
  email: 'admin-test@example.com',
  firstName: 'Admin',
  lastName: 'Test',
  password: 'Admin123!',
  securityQuestion: 'What is the name of your first pet?',
  securityAnswer: 'testpet'
};

async function testCreateAdmin() {
  try {
    console.log('🚀 Test de création d\'utilisateur admin...');
    console.log('🌐 URL API:', `${API_BASE_URL}/api/admin/create-admin`);
    
    const response = await axios.post(`${API_BASE_URL}/api/admin/create-admin`, adminData);
    
    if (response.data.success) {
      console.log('✅ Utilisateur admin créé avec succès !');
      console.log('📧 Email:', response.data.user.email);
      console.log('👤 Rôle:', response.data.user.role);
      console.log('🆔 ID:', response.data.user._id);
      console.log('🔑 Token généré:', response.data.token ? 'Oui' : 'Non');
      
      // Afficher les informations de connexion
      console.log('\n📋 Informations de connexion:');
      console.log('Email:', adminData.email);
      console.log('Mot de passe:', adminData.password);
      console.log('Question de sécurité:', adminData.securityQuestion);
      console.log('Réponse:', adminData.securityAnswer);
      
      return response.data;
    } else {
      console.log('❌ Échec de la création de l\'utilisateur admin');
      return null;
    }
  } catch (error) {
    if (error.response) {
      console.error('❌ Erreur API:', error.response.data);
      if (error.response.status === 409) {
        console.log('⚠️  L\'utilisateur admin existe déjà');
      }
    } else {
      console.error('❌ Erreur:', error.message);
    }
    return null;
  }
}

async function testCreateUserWithRole() {
  try {
    console.log('\n🚀 Test de création d\'utilisateur avec rôle...');
    
    const userData = {
      email: 'moderator-test@example.com',
      firstName: 'Moderator',
      lastName: 'Test',
      password: 'Moderator123!',
      securityQuestion: 'What is your favorite color?',
      securityAnswer: 'blue',
      role: 'moderator',
      isActive: true
    };
    
    const response = await axios.post(`${API_BASE_URL}/api/admin/create-user-with-role`, userData);
    
    if (response.data.success) {
      console.log('✅ Utilisateur avec rôle créé avec succès !');
      console.log('📧 Email:', response.data.user.email);
      console.log('👤 Rôle:', response.data.user.role);
      console.log('🆔 ID:', response.data.user._id);
      
      return response.data;
    } else {
      console.log('❌ Échec de la création de l\'utilisateur avec rôle');
      return null;
    }
  } catch (error) {
    if (error.response) {
      console.error('❌ Erreur API:', error.response.data);
      if (error.response.status === 409) {
        console.log('⚠️  L\'utilisateur existe déjà');
      }
    } else {
      console.error('❌ Erreur:', error.message);
    }
    return null;
  }
}

async function testValidation() {
  try {
    console.log('\n🚀 Test de validation...');
    
    // Données invalides pour tester la validation
    const invalidData = {
      email: 'email-invalide',
      firstName: 'A', // Trop court
      lastName: 'B', // Trop court
      password: '123', // Trop court
      securityQuestion: 'Q', // Trop court
      securityAnswer: 'A' // Trop court
    };
    
    await axios.post(`${API_BASE_URL}/api/admin/create-admin`, invalidData);
    console.log('❌ La validation aurait dû échouer mais n\'a pas échoué');
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log('✅ Erreurs de validation détectées correctement');
      console.log('📝 Détails de validation:', error.response.data.details);
    } else {
      console.error('❌ Erreur inattendue:', error.message);
    }
  }
}

async function main() {
  try {
    console.log('🎯 Test de l\'API de création d\'utilisateurs admin');
    console.log('================================================');
    
    // Test 1: Créer un utilisateur admin
    const adminResult = await testCreateAdmin();
    
    // Test 2: Créer un utilisateur avec rôle
    const userResult = await testCreateUserWithRole();
    
    // Test 3: Tester la validation
    await testValidation();
    
    console.log('\n================================================');
    console.log('✅ Tests terminés !');
    
    if (adminResult) {
      console.log('\n📋 Résumé:');
      console.log('- Utilisateur admin créé:', adminResult.user.email);
      console.log('- Token généré:', adminResult.token ? 'Oui' : 'Non');
    }
    
    if (userResult) {
      console.log('- Utilisateur avec rôle créé:', userResult.user.email);
    }
    
  } catch (error) {
    console.error('❌ Échec des tests:', error.message);
    process.exit(1);
  }
}

// Exécuter les tests
if (require.main === module) {
  main();
}

module.exports = { testCreateAdmin, testCreateUserWithRole, testValidation };
