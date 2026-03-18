#!/usr/bin/env node

const mongoose = require('mongoose');
require('dotenv').config();

// Import User model
const User = require('../models/User');

// Admin account configuration
const ADMIN_EMAIL = 'admin@investormatch.com';

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

// Remove admin user
const removeAdminUser = async () => {
  try {
    console.log('🔄 Removing admin user...');
    
    // Find admin user
    const adminUser = await User.findByEmail(ADMIN_EMAIL);
    
    if (!adminUser) {
      console.log('⚠️  Admin user not found with email:', ADMIN_EMAIL);
      return false;
    }
    
    console.log('👤 Found admin user:', {
      id: adminUser._id,
      email: adminUser.email,
      firstName: adminUser.firstName,
      lastName: adminUser.lastName,
      role: adminUser.role,
      isActive: adminUser.isActive,
      createdAt: adminUser.createdAt
    });
    
    // Delete admin user
    await adminUser.deleteOne();
    console.log('✅ Admin user deleted successfully');
    
    return true;
  } catch (error) {
    console.error('❌ Error removing admin user:', error);
    throw error;
  }
};

// List all admin users
const listAdminUsers = async () => {
  try {
    console.log('📋 Listing all admin users...');
    
    const adminUsers = await User.find({ role: 'admin' });
    
    if (adminUsers.length === 0) {
      console.log('⚠️  No admin users found');
      return [];
    }
    
    console.log(`✅ Found ${adminUsers.length} admin user(s):`);
    adminUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (${user.firstName} ${user.lastName}) - ${user.isActive ? 'Active' : 'Inactive'}`);
    });
    
    return adminUsers;
  } catch (error) {
    console.error('❌ Error listing admin users:', error);
    throw error;
  }
};

// Main function
const main = async () => {
  try {
    console.log('🚀 Starting admin user removal...');
    
    // Connect to database
    await connectDB();
    
    // List current admin users
    await listAdminUsers();
    
    // Remove admin user
    const removed = await removeAdminUser();
    
    if (removed) {
      console.log('✅ Admin user removed successfully');
      
      // List remaining admin users
      console.log('\n📋 Remaining admin users:');
      await listAdminUsers();
      
    } else {
      console.log('⚠️  No admin user was removed');
    }
    
    console.log('🎉 Admin user removal completed!');
    
  } catch (error) {
    console.error('❌ Failed to remove admin user:', error);
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

module.exports = { removeAdminUser, listAdminUsers };
