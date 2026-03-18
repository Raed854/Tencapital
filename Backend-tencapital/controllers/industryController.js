const Industry = require('../models/Industry');
const ReferenceController = require('./referenceController');

class IndustryController extends ReferenceController {
  constructor() {
    super(Industry, 'Industry');
  }
}

module.exports = new IndustryController();
