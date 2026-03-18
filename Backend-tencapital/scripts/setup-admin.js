#!/usr/bin/env node

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import User model
const User = require('../models/User');

// Admin account configuration
const ADMIN_CONFIG = {
  email: 'admin@investormatch.com',
  firstName: 'Admin',
  lastName: 'System',
  password: 'Admin123!@#',
  securityQuestion: 'What is the name of your first pet?',
  securityAnswer: 'admin',
  role: 'admin',
  isActive: true
};

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/investormatch';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB:', mongoUri);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Create or update admin user
const setupAdminUser = async () => {
  try {
    console.log('🔄 Setting up admin user...');
    
    // Check if admin already exists
    const existingAdmin = await User.findByEmail(ADMIN_CONFIG.email);
    
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists with email:', ADMIN_CONFIG.email);
      
      // Update existing admin to ensure it has admin role and is active
      existingAdmin.role = 'admin';
      existingAdmin.isActive = true;
      existingAdmin.firstName = ADMIN_CONFIG.firstName;
      existingAdmin.lastName = ADMIN_CONFIG.lastName;
      existingAdmin.securityQuestion = ADMIN_CONFIG.securityQuestion;
      
      // Update password if needed
      if (ADMIN_CONFIG.password) {
        existingAdmin.passwordHash = ADMIN_CONFIG.password; // Will be hashed by pre-save middleware
      }
      
      // Update security answer if needed
      if (ADMIN_CONFIG.securityAnswer) {
        existingAdmin.securityAnswer = ADMIN_CONFIG.securityAnswer; // Will be hashed by pre-save middleware
      }
      
      await existingAdmin.save();
      console.log('✅ Updated existing user to admin role');
      
      return existingAdmin;
    }

    // Create new admin user
    console.log('🆕 Creating new admin user...');
    const adminUser = new User({
      email: ADMIN_CONFIG.email,
      firstName: ADMIN_CONFIG.firstName,
      lastName: ADMIN_CONFIG.lastName,
      passwordHash: ADMIN_CONFIG.password, // Will be hashed by pre-save middleware
      securityQuestion: ADMIN_CONFIG.securityQuestion,
      securityAnswer: ADMIN_CONFIG.securityAnswer, // Will be hashed by pre-save middleware
      role: ADMIN_CONFIG.role,
      isActive: ADMIN_CONFIG.isActive
    });

    await adminUser.save();
    console.log('✅ New admin user created successfully');
    
    return adminUser;
  } catch (error) {
    console.error('❌ Error setting up admin user:', error);
    throw error;
  }
};

// Display admin credentials
const displayAdminCredentials = (adminUser) => {
  console.log('\n🎉 ADMIN ACCOUNT SETUP COMPLETED!');
  console.log('=====================================');
  console.log('📧 Email:', adminUser.email);
  console.log('🔑 Password:', ADMIN_CONFIG.password);
  console.log('❓ Security Question:', adminUser.securityQuestion);
  console.log('💬 Security Answer:', ADMIN_CONFIG.securityAnswer);
  console.log('👤 Role:', adminUser.role);
  console.log('✅ Status:', adminUser.isActive ? 'Active' : 'Inactive');
  console.log('🆔 User ID:', adminUser._id);
  console.log('📅 Created:', adminUser.createdAt);
  console.log('🔄 Updated:', adminUser.updatedAt);
  console.log('=====================================');
  console.log('⚠️  IMPORTANT: Please change the password after first login!');
  console.log('⚠️  IMPORTANT: Keep these credentials secure!');
  console.log('=====================================\n');
};

// Verify admin user
const verifyAdminUser = async (adminUser) => {
  try {
    console.log('🧪 Verifying admin user...');
    
    // Test password verification
    const isPasswordValid = await adminUser.verifyPassword(ADMIN_CONFIG.password);
    console.log('🔐 Password verification:', isPasswordValid ? '✅ Valid' : '❌ Invalid');
    
    // Test security answer verification
    const isSecurityAnswerValid = await adminUser.verifySecurityAnswer(ADMIN_CONFIG.securityAnswer);
    console.log('🔒 Security answer verification:', isSecurityAnswerValid ? '✅ Valid' : '❌ Invalid');
    
    // Check role
    console.log('👤 Role:', adminUser.role === 'admin' ? '✅ Admin' : '❌ Not Admin');
    
    // Check status
    console.log('✅ Status:', adminUser.isActive ? '✅ Active' : '❌ Inactive');
    
    return isPasswordValid && isSecurityAnswerValid && adminUser.role === 'admin' && adminUser.isActive;
  } catch (error) {
    console.error('❌ Error verifying admin user:', error);
    return false;
  }
};

// Main function
const main = async () => {
  try {
    console.log('🚀 Starting admin account setup...');
    console.log('📊 Configuration:');
    console.log('   - Email:', ADMIN_CONFIG.email);
    console.log('   - Role:', ADMIN_CONFIG.role);
    console.log('   - Active:', ADMIN_CONFIG.isActive);
    
    // Connect to database
    await connectDB();
    
    // Setup admin user
    const adminUser = await setupAdminUser();
    
    // Verify admin user
    const isVerified = await verifyAdminUser(adminUser);
    
    if (isVerified) {
      console.log('✅ Admin user verification successful');
      
      // Display credentials
      displayAdminCredentials(adminUser);
      
      console.log('🎉 Admin account setup completed successfully!');
    } else {
      console.log('❌ Admin user verification failed');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Failed to setup admin account:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the script
if (require.main === module) {
  main();
}

module.exports = { setupAdminUser, ADMIN_CONFIG };
