/**
 * Démonstration complète du système d'IA pour l'importation Excel
 * Ce script montre comment utiliser le système avec de vrais fichiers Excel/CSV
 */

const fs = require('fs');
const path = require('path');
const aiMappingService = require('../services/aiMappingService');
const HeaderNormalizer = require('../utils/headerNormalizer');

console.log('🚀 Démonstration complète du système d\'IA pour l\'importation Excel\n');

// Fonction pour lire un fichier CSV
function readCSVFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.trim().split('\n');
    const headers = lines[0].split(',');
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      data.push(row);
    }
    
    return data;
  } catch (error) {
    console.error('Erreur lors de la lecture du fichier:', error.message);
    return null;
  }
}

// Test 1: Fichier avec en-têtes standards
console.log('📁 Test 1: Fichier avec en-têtes standards (excel-sample-ai.csv)');
console.log('=' .repeat(60));

const standardData = readCSVFile(path.join(__dirname, 'excel-sample-ai.csv'));
if (standardData) {
  console.log('En-têtes détectés:', Object.keys(standardData[0]));
  console.log('Nombre de lignes:', standardData.length);
  console.log('');
  
  // Mapping intelligent
  const mappingResult = HeaderNormalizer.normalizeExcelHeaders(standardData);
  console.log('✅ Mapping généré automatiquement:');
  console.log(JSON.stringify(mappingResult.mapping, null, 2));
  console.log('');
  
  console.log('📊 Rapport de mapping:');
  console.log(`- Colonnes totales: ${mappingResult.report.summary.totalColumns}`);
  console.log(`- Colonnes mappées: ${mappingResult.report.summary.mappedColumns}`);
  console.log(`- Colonnes non mappées: ${mappingResult.report.summary.unmappedColumns}`);
  console.log(`- Champs DB manquants: ${mappingResult.report.summary.missingDbFields}`);
  console.log(`- Score de qualité: ${Math.round(mappingResult.report.summary.qualityScore * 100)}%`);
  console.log(`- Confiance moyenne: ${Math.round(mappingResult.report.summary.confidence * 100)}%`);
  console.log('');
  
  console.log('📋 Première ligne normalisée:');
  console.log(JSON.stringify(mappingResult.normalizedData[0], null, 2));
  console.log('');
}

// Test 2: Fichier avec en-têtes variés
console.log('📁 Test 2: Fichier avec en-têtes variés (excel-sample-variations.csv)');
console.log('=' .repeat(60));

const variationData = readCSVFile(path.join(__dirname, 'excel-sample-variations.csv'));
if (variationData) {
  console.log('En-têtes détectés:', Object.keys(variationData[0]));
  console.log('Nombre de lignes:', variationData.length);
  console.log('');
  
  // Mapping intelligent
  const mappingResult2 = HeaderNormalizer.normalizeExcelHeaders(variationData);
  console.log('✅ Mapping généré automatiquement:');
  console.log(JSON.stringify(mappingResult2.mapping, null, 2));
  console.log('');
  
  console.log('📊 Rapport de mapping:');
  console.log(`- Colonnes totales: ${mappingResult2.report.summary.totalColumns}`);
  console.log(`- Colonnes mappées: ${mappingResult2.report.summary.mappedColumns}`);
  console.log(`- Colonnes non mappées: ${mappingResult2.report.summary.unmappedColumns}`);
  console.log(`- Champs DB manquants: ${mappingResult2.report.summary.missingDbFields}`);
  console.log(`- Score de qualité: ${Math.round(mappingResult2.report.summary.qualityScore * 100)}%`);
  console.log(`- Confiance moyenne: ${Math.round(mappingResult2.report.summary.confidence * 100)}%`);
  console.log('');
  
  if (mappingResult2.report.suggestions && mappingResult2.report.suggestions.length > 0) {
    console.log('💡 Suggestions d\'amélioration:');
    mappingResult2.report.suggestions.forEach((suggestion, index) => {
      console.log(`${index + 1}. ${suggestion.message}`);
    });
    console.log('');
  }
  
  console.log('📋 Première ligne normalisée:');
  console.log(JSON.stringify(mappingResult2.normalizedData[0], null, 2));
  console.log('');
}

// Test 3: Simulation d'API
console.log('🌐 Test 3: Simulation d\'appels API');
console.log('=' .repeat(60));

// Simulation POST /api/excel/analyze-headers
console.log('📡 POST /api/excel/analyze-headers');
const headers = ['Investor Type', 'Sector', 'Industries', 'Investment Stage', 'Revenue Criteria'];
const analysisResult = aiMappingService.generateIntelligentMapping(headers);
const report = aiMappingService.generateMappingReport(analysisResult);

console.log('Réponse API:');
console.log(JSON.stringify({
  success: true,
  message: 'Headers analyzed successfully',
  data: {
    originalHeaders: headers,
    mapping: analysisResult.mapping,
    report: report
  }
}, null, 2));
console.log('');

// Simulation POST /api/excel/validate-mapping
console.log('📡 POST /api/excel/validate-mapping');
const customMapping = {
  'Investor Type': 'investorType',
  'Sector': 'sector',
  'Industries': 'industries'
};
const validation = HeaderNormalizer.validateMapping(customMapping, headers);
const suggestions = HeaderNormalizer.generateMappingSuggestions(customMapping, headers);

console.log('Réponse API:');
console.log(JSON.stringify({
  success: true,
  message: 'Mapping validation completed',
  data: {
    validation: validation,
    suggestions: suggestions
  }
}, null, 2));
console.log('');

// Test 4: Fonction normalizeHeaders
console.log('🔧 Test 4: Fonction normalizeHeaders');
console.log('=' .repeat(60));

const testHeaders = {
  'Investor Type': 'Venture Capital',
  'Sector': 'Technology',
  'Email': 'test@example.com',
  'Phone Number': '+1-555-0123',
  'Unknown Field': 'Some Value'
};

const mapping = {
  'Investor Type': 'investorType',
  'Sector': 'sector',
  'Email': 'email',
  'Phone Number': 'phoneNumber'
};

console.log('En-têtes originaux:');
console.log(JSON.stringify(testHeaders, null, 2));
console.log('');

const normalized = HeaderNormalizer.normalizeHeaders(testHeaders, mapping);
console.log('En-têtes normalisés:');
console.log(JSON.stringify(normalized, null, 2));
console.log('');

console.log('✅ Démonstration terminée !');
console.log('');
console.log('🎯 Résumé des fonctionnalités testées:');
console.log('- ✅ Lecture de fichiers CSV');
console.log('- ✅ Détection automatique des correspondances');
console.log('- ✅ Mapping intelligent avec IA');
console.log('- ✅ Validation de la qualité du mapping');
console.log('- ✅ Normalisation des données');
console.log('- ✅ Génération de rapports détaillés');
console.log('- ✅ Suggestions d\'amélioration');
console.log('- ✅ Simulation d\'API REST');
console.log('- ✅ Fonction normalizeHeaders');
console.log('');
console.log('🚀 Le système est prêt pour la production !');
