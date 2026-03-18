const mongoose = require('mongoose');

const investmentStageSchema = new mongoose.Schema({
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
investmentStageSchema.index({ isActive: 1 });

// Static methods
investmentStageSchema.statics.createInvestmentStage = async function(investmentStageData) {
  const investmentStage = new this(investmentStageData);
  return await investmentStage.save();
};

investmentStageSchema.statics.findAll = async function() {
  return await this.find({ isActive: true }).sort({ name: 1 });
};

investmentStageSchema.statics.findAllWithInactive = async function() {
  return await this.find().sort({ name: 1 });
};

investmentStageSchema.statics.search = async function(searchTerm) {
  return await this.find({
    $or: [
      { name: { $regex: searchTerm, $options: 'i' } },
      { description: { $regex: searchTerm, $options: 'i' } }
    ],
    isActive: true
  }).sort({ name: 1 });
};

// Instance methods
investmentStageSchema.methods.updateInvestmentStage = async function(updateData) {
  const allowedFields = ['name', 'description', 'isActive'];
  
  for (const [key, value] of Object.entries(updateData)) {
    if (allowedFields.includes(key) && value !== undefined) {
      this[key] = value;
    }
  }
  
  return await this.save();
};

investmentStageSchema.methods.deleteInvestmentStage = async function() {
  this.isActive = false;
  return await this.save();
};

const InvestmentStage = mongoose.model('InvestmentStage', investmentStageSchema);

module.exports = InvestmentStage;
