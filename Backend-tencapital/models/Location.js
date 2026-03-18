const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
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
locationSchema.index({ isActive: 1 });

// Static methods
locationSchema.statics.createLocation = async function(locationData) {
  const location = new this(locationData);
  return await location.save();
};

locationSchema.statics.findAll = async function() {
  return await this.find({ isActive: true }).sort({ name: 1 });
};

locationSchema.statics.findAllWithInactive = async function() {
  return await this.find().sort({ name: 1 });
};

locationSchema.statics.search = async function(searchTerm) {
  return await this.find({
    $or: [
      { name: { $regex: searchTerm, $options: 'i' } },
      { description: { $regex: searchTerm, $options: 'i' } }
    ],
    isActive: true
  }).sort({ name: 1 });
};

// Instance methods
locationSchema.methods.updateLocation = async function(updateData) {
  const allowedFields = ['name', 'description', 'isActive'];
  
  for (const [key, value] of Object.entries(updateData)) {
    if (allowedFields.includes(key) && value !== undefined) {
      this[key] = value;
    }
  }
  
  return await this.save();
};

locationSchema.methods.deleteLocation = async function() {
  this.isActive = false;
  return await this.save();
};

const Location = mongoose.model('Location', locationSchema);

module.exports = Location;
