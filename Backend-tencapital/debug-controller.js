// Test debug du contrôleur mapExcelData
const aiMappingService = require('./services/aiMappingService');

// Simuler les données de test
const testData = {
  data: [
    ["Name", "Type"],
    ["John", "Angel"]
  ]
};

async function debugController() {
  try {
    console.log('🔍 Testing controller logic...');
    
    const { data } = testData;
    const headers = data[0];
    const rows = data.slice(1);
    
    console.log('Headers:', headers);
    console.log('Rows:', rows);
    
    // Test du service AI
    const mappingResult = await aiMappingService.generateIntelligentMapping(headers);
    console.log('Mapping result:', JSON.stringify(mappingResult, null, 2));
    
    let mappedHeaders = {};
    if (mappingResult && mappingResult.mapping) {
      mappedHeaders = mappingResult.mapping;
    }
    
    console.log('Mapped headers:', mappedHeaders);
    
    // Test du mapping des données
    const mappedData = rows.map((row, index) => {
      const mappedRow = {};
      
      headers.forEach((header, colIndex) => {
        const mappedField = mappedHeaders[header];
        const value = row[colIndex];
        
        if (mappedField && value !== undefined && value !== null && value !== '') {
          const cleanValue = String(value).trim();
          if (cleanValue) {
            mappedRow[mappedField] = cleanValue;
          }
        }
      });
      
      return mappedRow;
    });
    
    console.log('✅ Mapped data:', JSON.stringify(mappedData, null, 2));
    
  } catch (error) {
    console.error('❌ Controller debug error:', error);
    console.error('❌ Stack:', error.stack);
  }
}

debugController();