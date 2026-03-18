const mongoose = require('mongoose');

const investorSchema = new mongoose.Schema({
  investorType: {
    type: String,
    trim: true
  },
  sector: {
    type: String,
    trim: true
  },
  industries: {
    type: String,
    trim: true
  },
  investmentStage: {
    type: String,
    trim: true
  },
  revenueCriteria: {
    type: String,
    trim: true
  },
  organizationPersonName: {
    type: String,
    trim: true
  },
  firstName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  description: {
    type: String
  },
  organizationPersonNameFirstNameLastName: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  phoneNumber: {
    type: String,
    trim: true
  },
  website: {
    type: String,
    trim: true
  },
  linkedin: {
    type: String,
    trim: true
  },
  status: {
    type: Number,
    default: 0
  },
  note: {
    type: String,
    trim: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  }
}, {
  timestamps: true
});

// Index for better performance
investorSchema.index({ userId: 1 });
investorSchema.index({ investorType: 1 });
investorSchema.index({ sector: 1 });
investorSchema.index({ email: 1 });

// Static methods
investorSchema.statics.createInvestor = async function(investorData) {
  const investor = new this(investorData);
  return await investor.save();
};

investorSchema.statics.findByUserId = async function(userId) {
  return await this.find({ userId }).sort({ createdAt: -1 });
};

investorSchema.statics.findAll = async function() {
  return await this.find().sort({ createdAt: -1 });
};

investorSchema.statics.findAllWithUsers = async function() {
  return await this.find()
    .populate('userId', 'firstName lastName email')
    .sort({ createdAt: -1 });
};

investorSchema.statics.search = async function(searchCriteria) {
  const {
    investorType,
    sector,
    industries,
    investmentStage,
    location,
    limit = 50,
    offset = 0
  } = searchCriteria;

  const filter = {};

  if (investorType) {
    filter.investorType = { $regex: investorType, $options: 'i' };
  }

  if (sector) {
    filter.sector = { $regex: sector, $options: 'i' };
  }

  if (industries) {
    filter.industries = { $regex: industries, $options: 'i' };
  }

  if (investmentStage) {
    filter.investmentStage = { $regex: investmentStage, $options: 'i' };
  }

  if (location) {
    filter.location = { $regex: location, $options: 'i' };
  }

  return await this.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(offset);
};

// Instance methods
investorSchema.methods.updateInvestor = async function(updateData) {
  const allowedFields = [
    'investorType', 'sector', 'industries', 'investmentStage', 'revenueCriteria',
    'organizationPersonName', 'firstName', 'lastName', 'email', 'description',
    'organizationPersonNameFirstNameLastName', 'location', 'phoneNumber',
    'website', 'linkedin', 'status', 'note'
  ];

  for (const [key, value] of Object.entries(updateData)) {
    if (allowedFields.includes(key) && value !== undefined) {
      this[key] = value;
    }
  }

  return await this.save();
};

investorSchema.methods.deleteInvestor = async function() {
  return await this.deleteOne();
};

const Investor = mongoose.model('Investor', investorSchema);

module.exports = Investor;
