const mongoose = require('mongoose');

const sectorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better performance
sectorSchema.index({ isActive: 1 });

// Static methods
sectorSchema.statics.createSector = async function(sectorData) {
  const sector = new this(sectorData);
  return await sector.save();
};

sectorSchema.statics.findAll = async function() {
  return await this.find({ isActive: true }).sort({ name: 1 });
};

sectorSchema.statics.findAllWithInactive = async function() {
  return await this.find().sort({ name: 1 });
};

sectorSchema.statics.search = async function(searchTerm) {
  return await this.find({
    $or: [
      { name: { $regex: searchTerm, $options: 'i' } },
      { description: { $regex: searchTerm, $options: 'i' } }
    ],
    isActive: true
  }).sort({ name: 1 });
};

// Instance methods
sectorSchema.methods.updateSector = async function(updateData) {
  const allowedFields = ['name', 'description', 'isActive'];
  
  for (const [key, value] of Object.entries(updateData)) {
    if (allowedFields.includes(key) && value !== undefined) {
      this[key] = value;
    }
  }
  
  return await this.save();
};

sectorSchema.methods.deleteSector = async function() {
  this.isActive = false;
  return await this.save();
};

const Sector = mongoose.model('Sector', sectorSchema);

module.exports = Sector;
