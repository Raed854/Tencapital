const mongoose = require('mongoose');

const investorTypeSchema = new mongoose.Schema({
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
investorTypeSchema.index({ isActive: 1 });

// Static methods
investorTypeSchema.statics.createInvestorType = async function(investorTypeData) {
  const investorType = new this(investorTypeData);
  return await investorType.save();
};

investorTypeSchema.statics.findAll = async function() {
  return await this.find({ isActive: true }).sort({ name: 1 });
};

investorTypeSchema.statics.findAllWithInactive = async function() {
  return await this.find().sort({ name: 1 });
};

investorTypeSchema.statics.search = async function(searchTerm) {
  return await this.find({
    $or: [
      { name: { $regex: searchTerm, $options: 'i' } },
      { description: { $regex: searchTerm, $options: 'i' } }
    ],
    isActive: true
  }).sort({ name: 1 });
};

// Instance methods
investorTypeSchema.methods.updateInvestorType = async function(updateData) {
  const allowedFields = ['name', 'description', 'isActive'];
  
  for (const [key, value] of Object.entries(updateData)) {
    if (allowedFields.includes(key) && value !== undefined) {
      this[key] = value;
    }
  }
  
  return await this.save();
};

investorTypeSchema.methods.deleteInvestorType = async function() {
  this.isActive = false;
  return await this.save();
};

const InvestorType = mongoose.model('InvestorType', investorTypeSchema);

module.exports = InvestorType;
