const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import User model
const User = require('./models/User');

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
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/investormatch', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Create admin user
const createAdminUser = async () => {
  try {
    console.log('🔄 Creating admin user...');
    
    // Check if admin already exists
    const existingAdmin = await User.findByEmail(ADMIN_CONFIG.email);
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists with email:', ADMIN_CONFIG.email);
      
      // Update existing admin to ensure it has admin role
      if (existingAdmin.role !== 'admin') {
        existingAdmin.role = 'admin';
        existingAdmin.isActive = true;
        await existingAdmin.save();
        console.log('✅ Updated existing user to admin role');
      } else {
        console.log('✅ Admin user already exists with correct role');
      }
      
      return existingAdmin;
    }

    // Create new admin user
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
    console.log('✅ Admin user created successfully');
    
    return adminUser;
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  }
};

// Display admin credentials
const displayAdminCredentials = (adminUser) => {
  console.log('\n🎉 ADMIN ACCOUNT CREATED SUCCESSFULLY!');
  console.log('=====================================');
  console.log('📧 Email:', adminUser.email);
  console.log('🔑 Password:', ADMIN_CONFIG.password);
  console.log('❓ Security Question:', adminUser.securityQuestion);
  console.log('💬 Security Answer:', ADMIN_CONFIG.securityAnswer);
  console.log('👤 Role:', adminUser.role);
  console.log('✅ Status:', adminUser.isActive ? 'Active' : 'Inactive');
  console.log('🆔 User ID:', adminUser._id);
  console.log('=====================================');
  console.log('⚠️  IMPORTANT: Please change the password after first login!');
  console.log('⚠️  IMPORTANT: Keep these credentials secure!');
  console.log('=====================================\n');
};

// Main function
const main = async () => {
  try {
    console.log('🚀 Starting admin account creation...');
    
    // Connect to database
    await connectDB();
    
    // Create admin user
    const adminUser = await createAdminUser();
    
    // Display credentials
    displayAdminCredentials(adminUser);
    
    console.log('✅ Admin account setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Failed to create admin account:', error);
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

module.exports = { createAdminUser, ADMIN_CONFIG };
