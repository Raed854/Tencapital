const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  securityQuestion: {
    type: String,
    required: true,
    trim: true
  },
  securityAnswer: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  }
}, {
  timestamps: true
});

// Additional indexes for better performance
userSchema.index({ isActive: 1 });
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('passwordHash')) return next();
  
  try {
    const saltRounds = 12;
    this.passwordHash = await bcrypt.hash(this.passwordHash, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

// Hash security answer before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('securityAnswer')) return next();
  
  try {
    const saltRounds = 12;
    this.securityAnswer = await bcrypt.hash(this.securityAnswer.toLowerCase(), saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance methods
userSchema.methods.verifyPassword = async function(password) {
  return await bcrypt.compare(password, this.passwordHash);
};

userSchema.methods.verifySecurityAnswer = async function(answer) {
  return await bcrypt.compare(answer.toLowerCase(), this.securityAnswer);
};

userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.passwordHash;
  delete userObject.securityAnswer;
  return userObject;
};

// Static methods
userSchema.statics.createUser = async function(userData) {
  const { email, firstName, lastName, password, securityQuestion, securityAnswer } = userData;
  
  const user = new this({
    email,
    firstName,
    lastName,
    passwordHash: password, // Will be hashed by pre-save middleware
    securityQuestion,
    securityAnswer: securityAnswer // Will be hashed by pre-save middleware
  });
  
  return await user.save();
};

// Static methods
userSchema.statics.findByEmail = async function(email) {
  return await this.findOne({ email });
};

userSchema.statics.emailExists = async function(email) {
  const user = await this.findOne({ email });
  return !!user;
};

userSchema.statics.verifySecurityAnswer = async function(email, securityAnswer) {
  const user = await this.findByEmail(email);
  if (!user) {
    return { valid: false, user: null };
  }

  const isValidAnswer = await user.verifySecurityAnswer(securityAnswer);
  return { valid: isValidAnswer, user: user };
};

userSchema.statics.resetPassword = async function(email, newPassword, securityAnswer) {
  const { valid, user } = await this.verifySecurityAnswer(email, securityAnswer);
  
  if (!valid) {
    throw new Error('Invalid security answer');
  }

  user.passwordHash = newPassword; // Will be hashed by pre-save middleware
  await user.save();
  return true;
};

// Instance methods
userSchema.methods.setActiveStatus = async function(isActive) {
  this.isActive = isActive;
  return await this.save();
};

userSchema.methods.updateRole = async function(role) {
  this.role = role;
  return await this.save();
};

userSchema.methods.getInvestors = async function() {
  const Investor = require('./Investor');
  return await Investor.find({ userId: this._id });
};

const User = mongoose.model('User', userSchema);

module.exports = User;
