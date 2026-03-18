const InvestmentStage = require('../models/InvestmentStage');
const ReferenceController = require('./referenceController');

class InvestmentStageController extends ReferenceController {
  constructor() {
    super(InvestmentStage, 'Investment Stage');
  }
}

module.exports = new InvestmentStageController();
