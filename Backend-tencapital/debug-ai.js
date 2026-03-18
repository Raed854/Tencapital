// Debug simple du service AI
const aiMappingService = require('./services/aiMappingService');

async function debugAIMapping() {
  try {
    console.log('🔍 Testing aiMappingService...');
    
    const headers = ["Investor Type", "Sector Focus", "Industries", "Investment Stage"];
    
    console.log('Input headers:', headers);
    
    const result = await aiMappingService.generateIntelligentMapping(headers);
    
    console.log('AI Mapping result:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('❌ Error testing AI mapping:', error);
  }
}

debugAIMapping();