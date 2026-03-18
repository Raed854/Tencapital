const mongoose = require('mongoose');

const industrySchema = new mongoose.Schema({
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
industrySchema.index({ isActive: 1 });

// Static methods
industrySchema.statics.createIndustry = async function(industryData) {
  const industry = new this(industryData);
  return await industry.save();
};

industrySchema.statics.findAll = async function() {
  return await this.find({ isActive: true }).sort({ name: 1 });
};

industrySchema.statics.findAllWithInactive = async function() {
  return await this.find().sort({ name: 1 });
};

industrySchema.statics.search = async function(searchTerm) {
  return await this.find({
    $or: [
      { name: { $regex: searchTerm, $options: 'i' } },
      { description: { $regex: searchTerm, $options: 'i' } }
    ],
    isActive: true
  }).sort({ name: 1 });
};

// Instance methods
industrySchema.methods.updateIndustry = async function(updateData) {
  const allowedFields = ['name', 'description', 'isActive'];
  
  for (const [key, value] of Object.entries(updateData)) {
    if (allowedFields.includes(key) && value !== undefined) {
      this[key] = value;
    }
  }
  
  return await this.save();
};

industrySchema.methods.deleteIndustry = async function() {
  this.isActive = false;
  return await this.save();
};

const Industry = mongoose.model('Industry', industrySchema);

module.exports = Industry;
