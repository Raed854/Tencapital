const mongoose = require('mongoose');

const revenueCriteriaSchema = new mongoose.Schema({
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
revenueCriteriaSchema.index({ isActive: 1 });

// Static methods
revenueCriteriaSchema.statics.createRevenueCriteria = async function(revenueCriteriaData) {
  const revenueCriteria = new this(revenueCriteriaData);
  return await revenueCriteria.save();
};

revenueCriteriaSchema.statics.findAll = async function() {
  return await this.find({ isActive: true }).sort({ name: 1 });
};

revenueCriteriaSchema.statics.findAllWithInactive = async function() {
  return await this.find().sort({ name: 1 });
};

revenueCriteriaSchema.statics.search = async function(searchTerm) {
  return await this.find({
    $or: [
      { name: { $regex: searchTerm, $options: 'i' } },
      { description: { $regex: searchTerm, $options: 'i' } }
    ],
    isActive: true
  }).sort({ name: 1 });
};

// Instance methods
revenueCriteriaSchema.methods.updateRevenueCriteria = async function(updateData) {
  const allowedFields = ['name', 'description', 'isActive'];
  
  for (const [key, value] of Object.entries(updateData)) {
    if (allowedFields.includes(key) && value !== undefined) {
      this[key] = value;
    }
  }
  
  return await this.save();
};

revenueCriteriaSchema.methods.deleteRevenueCriteria = async function() {
  this.isActive = false;
  return await this.save();
};

const RevenueCriteria = mongoose.model('RevenueCriteria', revenueCriteriaSchema);

module.exports = RevenueCriteria;
