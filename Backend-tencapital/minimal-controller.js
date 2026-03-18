const aiMappingService = require('../services/aiMappingService');

class ExcelController {
  // Test minimal
  static async mapExcelData(req, res) {
    try {
      res.json({
        success: true,
        message: 'Test minimal fonctionne!',
        data: req.body
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = ExcelController;