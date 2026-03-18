/**
 * Debug script pour identifier l'erreur dans l'import Excel
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Test des imports
console.log('🔍 Test des imports...');

try {
  const ExcelMapping = require('./models/ExcelMapping');
  console.log('✅ ExcelMapping importé');
} catch (e) {
  console.log('❌ ExcelMapping erreur:', e.message);
}

try {
  const HeaderNormalizer = require('./utils/headerNormalizer');
  console.log('✅ HeaderNormalizer importé');
} catch (e) {
  console.log('❌ HeaderNormalizer erreur:', e.message);
}

try {
  const aiMappingService = require('./services/aiMappingService');
  console.log('✅ aiMappingService importé');
} catch (e) {
  console.log('❌ aiMappingService erreur:', e.message);
}

try {
  const ExcelController = require('./controllers/excelController');
  console.log('✅ ExcelController importé');
} catch (e) {
  console.log('❌ ExcelController erreur:', e.message);
}

// Test de la méthode uploadExcel
console.log('\n🔍 Test de la méthode uploadExcel...');

try {
  const ExcelController = require('./controllers/excelController');
  
  // Simuler une requête
  const mockReq = {
    file: {
      path: './test-file.xlsx',
      filename: 'test-file.xlsx',
      originalname: 'test.xlsx',
      size: 1024
    },
    body: {
      userId: 'test-user-123'
    }
  };
  
  const mockRes = {
    status: (code) => ({
      json: (data) => {
        console.log('📤 Réponse simulée:', { status: code, data });
      }
    }),
    json: (data) => {
      console.log('📤 Réponse JSON:', data);
    }
  };
  
  console.log('🚀 Appel de uploadExcel...');
  ExcelController.uploadExcel(mockReq, mockRes);
  
} catch (e) {
  console.log('❌ Erreur dans uploadExcel:', e.message);
  console.log('Stack trace:', e.stack);
}
