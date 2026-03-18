const RevenueCriteria = require('../models/RevenueCriteria');
const ReferenceController = require('./referenceController');

class RevenueCriteriaController extends ReferenceController {
  constructor() {
    super(RevenueCriteria, 'Revenue Criteria');
  }
}

module.exports = new RevenueCriteriaController();
