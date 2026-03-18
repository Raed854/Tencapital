/**
 * Debug du serveur pour identifier l'erreur 500
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Import des services
console.log('🔍 Test des imports...');

try {
  const ExcelMapping = require('./models/ExcelMapping');
  console.log('✅ ExcelMapping OK');
} catch (e) {
  console.log('❌ ExcelMapping ERROR:', e.message);
}

try {
  const HeaderNormalizer = require('./utils/headerNormalizer');
  console.log('✅ HeaderNormalizer OK');
} catch (e) {
  console.log('❌ HeaderNormalizer ERROR:', e.message);
}

try {
  const aiMappingService = require('./services/aiMappingService');
  console.log('✅ aiMappingService OK');
} catch (e) {
  console.log('❌ aiMappingService ERROR:', e.message);
}

try {
  const ExcelController = require('./controllers/excelController');
  console.log('✅ ExcelController OK');
} catch (e) {
  console.log('❌ ExcelController ERROR:', e.message);
}

// Test de la méthode uploadExcel avec gestion d'erreur
console.log('\n🔍 Test de uploadExcel...');

try {
  const ExcelController = require('./controllers/excelController');
  
  // Mock request et response
  const mockReq = {
    file: {
      path: './examples/excel-sample-ai.csv',
      filename: 'test.csv',
      originalname: 'test.csv',
      size: 1024
    },
    body: {
      userId: 'test-user-123'
    }
  };
  
  const mockRes = {
    status: (code) => {
      console.log('📤 Status:', code);
      return {
        json: (data) => {
          console.log('📤 Response:', JSON.stringify(data, null, 2));
        }
      };
    },
    json: (data) => {
      console.log('📤 JSON Response:', JSON.stringify(data, null, 2));
    }
  };
  
  console.log('🚀 Appel de uploadExcel...');
  
  // Wrapper pour capturer les erreurs
  ExcelController.uploadExcel(mockReq, mockRes).catch(error => {
    console.log('❌ Erreur dans uploadExcel:', error.message);
    console.log('Stack trace:', error.stack);
  });
  
} catch (e) {
  console.log('❌ Erreur lors du test:', e.message);
  console.log('Stack trace:', e.stack);
}
