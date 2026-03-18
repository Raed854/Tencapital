const Sector = require('../models/Sector');
const ReferenceController = require('./referenceController');

class SectorController extends ReferenceController {
  constructor() {
    super(Sector, 'Sector');
  }
}

module.exports = new SectorController();
