/**
 * Test du système d'IA pour le mapping automatique des colonnes Excel
 * Ce fichier démontre l'utilisation du système d'IA
 */

const aiMappingService = require('../services/aiMappingService');
const HeaderNormalizer = require('../utils/headerNormalizer');

// Exemple d'en-têtes Excel avec des variations
const excelHeaders = [
  'Investor Type',
  'Sector', 
  'Industries',
  'Investment Stage',
  'Revenue Criteria',
  'Organization/Person Name',
  'First Name',
  'Last Name',
  'Email',
  'Description',
  'Organization/Person NameFirst NameLast Name',
  'Location',
  'Phone Number',
  'Website',
  'LinkedIn'
];

// Exemple d'en-têtes avec des variations plus complexes
const complexHeaders = [
  'Type of Investor',
  'Business Sector',
  'Industry Focus',
  'Funding Stage',
  'Revenue Requirements',
  'Company Name',
  'Contact First Name',
  'Contact Last Name',
  'Email Address',
  'Notes',
  'Full Company Name',
  'City',
  'Contact Phone',
  'Company Website',
  'LinkedIn Profile'
];

// Exemple de données Excel simulées
const sampleExcelData = [
  {
    'Investor Type': 'Venture Capital',
    'Sector': 'Technology',
    'Industries': 'Software, AI',
    'Investment Stage': 'Series A',
    'Revenue Criteria': '> $1M',
    'Organization/Person Name': 'Tech Ventures Inc.',
    'First Name': 'John',
    'Last Name': 'Doe',
    'Email': 'john@techventures.com',
    'Description': 'Leading VC firm',
    'Organization/Person NameFirst NameLast Name': 'Tech Ventures Inc. John Doe',
    'Location': 'San Francisco',
    'Phone Number': '+1-555-0123',
    'Website': 'https://techventures.com',
    'LinkedIn': 'https://linkedin.com/company/techventures'
  },
  {
    'Investor Type': 'Angel Investor',
    'Sector': 'Healthcare',
    'Industries': 'MedTech, Biotech',
    'Investment Stage': 'Seed',
    'Revenue Criteria': '> $500K',
    'Organization/Person Name': 'Health Angels',
    'First Name': 'Jane',
    'Last Name': 'Smith',
    'Email': 'jane@healthangels.com',
    'Description': 'Healthcare focused angel',
    'Organization/Person NameFirst NameLast Name': 'Health Angels Jane Smith',
    'Location': 'Boston',
    'Phone Number': '+1-555-0456',
    'Website': 'https://healthangels.com',
    'LinkedIn': 'https://linkedin.com/in/janesmith'
  }
];

console.log('🧠 Test du système d\'IA pour le mapping automatique des colonnes Excel\n');

// Test 1: Mapping simple
console.log('📋 Test 1: Mapping avec en-têtes standards');
console.log('En-têtes Excel:', excelHeaders);
console.log('');

const mappingResult1 = aiMappingService.generateIntelligentMapping(excelHeaders);
console.log('Mapping généré:', mappingResult1.mapping);
console.log('Rapport:', mappingResult1.report);
console.log('');

// Test 2: Mapping complexe
console.log('📋 Test 2: Mapping avec en-têtes complexes');
console.log('En-têtes Excel:', complexHeaders);
console.log('');

const mappingResult2 = aiMappingService.generateIntelligentMapping(complexHeaders);
console.log('Mapping généré:', mappingResult2.mapping);
console.log('Rapport:', mappingResult2.report);
console.log('');

// Test 3: Normalisation complète
console.log('📋 Test 3: Normalisation complète des données');
console.log('Données Excel originales:', sampleExcelData[0]);
console.log('');

const normalizedResult = HeaderNormalizer.normalizeExcelHeaders(sampleExcelData);
console.log('Données normalisées:', normalizedResult.normalizedData[0]);
console.log('Mapping utilisé:', normalizedResult.mapping);
console.log('Rapport de mapping:', normalizedResult.report);
console.log('');

// Test 4: Validation de mapping
console.log('📋 Test 4: Validation de mapping personnalisé');
const customMapping = {
  'Investor Type': 'investorType',
  'Sector': 'sector',
  'Industries': 'industries',
  'Investment Stage': 'investmentStage',
  'Revenue Criteria': 'revenueCriteria',
  'Organization/Person Name': 'organizationPersonName',
  'First Name': 'firstName',
  'Last Name': 'lastName',
  'Email': 'email',
  'Description': 'description',
  'Organization/Person NameFirst NameLast Name': 'organizationPersonNameFirstNameLastName',
  'Location': 'location',
  'Phone Number': 'phoneNumber',
  'Website': 'website',
  'LinkedIn': 'linkedin'
};

const validation = HeaderNormalizer.validateMapping(customMapping, excelHeaders);
console.log('Validation du mapping:', validation);
console.log('');

// Test 5: Suggestions d'amélioration
console.log('📋 Test 5: Suggestions d\'amélioration');
const suggestions = HeaderNormalizer.generateMappingSuggestions(customMapping, excelHeaders);
console.log('Suggestions:', suggestions);
console.log('');

// Test 6: Fonction normalizeHeaders
console.log('📋 Test 6: Fonction normalizeHeaders');
const testHeaders = {
  'Investor Type': 'Venture Capital',
  'Sector': 'Technology',
  'Email': 'test@example.com',
  'Phone Number': '+1-555-0123'
};

const normalizedHeaders = HeaderNormalizer.normalizeHeaders(testHeaders, customMapping);
console.log('En-têtes originaux:', testHeaders);
console.log('En-têtes normalisés:', normalizedHeaders);
console.log('');

console.log('✅ Tous les tests sont terminés !');
console.log('');
console.log('🎯 Fonctionnalités du système d\'IA:');
console.log('- Détection automatique des correspondances de colonnes');
console.log('- Mapping intelligent avec algorithmes de similarité');
console.log('- Validation de la qualité du mapping');
console.log('- Suggestions d\'amélioration');
console.log('- Normalisation automatique des données');
console.log('- Rapports détaillés de mapping');
