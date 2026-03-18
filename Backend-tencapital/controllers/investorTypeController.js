const InvestorType = require('../models/InvestorType');
const ReferenceController = require('./referenceController');

class InvestorTypeController extends ReferenceController {
  constructor() {
    super(InvestorType, 'Investor Type');
  }
}

module.exports = new InvestorTypeController();
