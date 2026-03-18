const Location = require('../models/Location');
const ReferenceController = require('./referenceController');

class LocationController extends ReferenceController {
  constructor() {
    super(Location, 'Location');
  }
}

module.exports = new LocationController();
