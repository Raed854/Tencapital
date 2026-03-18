const axios = require('axios');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';
const ADMIN_CONFIG = {
  email: 'admin@investormatch.com',
  firstName: 'Admin',
  lastName: 'System',
  password: 'Admin123!@#',
  confirmPassword: 'Admin123!@#',
  securityQuestion: 'What is the name of your first pet?',
  securityAnswer: 'admin'
};

// Create admin user via API
const createAdminUser = async () => {
  try {
    console.log('🔄 Creating admin user via API...');
    
    // Step 1: Register the admin user
    const registerResponse = await axios.post(`${API_BASE_URL}/api/users/register`, {
      email: ADMIN_CONFIG.email,
      firstName: ADMIN_CONFIG.firstName,
      lastName: ADMIN_CONFIG.lastName,
      password: ADMIN_CONFIG.password,
      confirmPassword: ADMIN_CONFIG.confirmPassword,
      securityQuestion: ADMIN_CONFIG.securityQuestion,
      securityAnswer: ADMIN_CONFIG.securityAnswer
    });

    if (registerResponse.data.success) {
      console.log('✅ Admin user registered successfully');
      const userId = registerResponse.data.userId;
      
      // Step 2: Login to get token
      const loginResponse = await axios.post(`${API_BASE_URL}/api/users/login`, {
        email: ADMIN_CONFIG.email,
        password: ADMIN_CONFIG.password
      });

      if (loginResponse.data.success) {
        const token = loginResponse.data.token;
        console.log('✅ Admin user logged in successfully');
        
        // Step 3: Update user role to admin
        const updateResponse = await axios.put(`${API_BASE_URL}/api/users/${userId}`, {
          role: 'admin',
          isActive: true
        }, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (updateResponse.data.success) {
          console.log('✅ Admin role assigned successfully');
          
          // Display credentials
          displayAdminCredentials(userId);
          
          return {
            success: true,
            userId: userId,
            token: token
          };
        } else {
          throw new Error('Failed to assign admin role');
        }
      } else {
        throw new Error('Failed to login admin user');
      }
    } else {
      throw new Error('Failed to register admin user');
    }
  } catch (error) {
    if (error.response) {
      console.error('❌ API Error:', error.response.data);
      if (error.response.status === 409) {
        console.log('⚠️  Admin user already exists. Attempting to update role...');
        return await updateExistingUser();
      }
    } else {
      console.error('❌ Error:', error.message);
    }
    throw error;
  }
};

// Update existing user to admin
const updateExistingUser = async () => {
  try {
    console.log('🔄 Attempting to update existing user to admin...');
    
    // Step 1: Login with existing credentials
    const loginResponse = await axios.post(`${API_BASE_URL}/api/users/login`, {
      email: ADMIN_CONFIG.email,
      password: ADMIN_CONFIG.password
    });

    if (loginResponse.data.success) {
      const token = loginResponse.data.token;
      const userId = loginResponse.data.user._id;
      
      console.log('✅ Existing user logged in successfully');
      
      // Step 2: Update user role to admin
      const updateResponse = await axios.put(`${API_BASE_URL}/api/users/${userId}`, {
        role: 'admin',
        isActive: true
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (updateResponse.data.success) {
        console.log('✅ Existing user updated to admin role');
        displayAdminCredentials(userId);
        
        return {
          success: true,
          userId: userId,
          token: token
        };
      } else {
        throw new Error('Failed to update existing user to admin role');
      }
    } else {
      throw new Error('Failed to login with existing credentials');
    }
  } catch (error) {
    console.error('❌ Error updating existing user:', error.message);
    throw error;
  }
};

// Display admin credentials
const displayAdminCredentials = (userId) => {
  console.log('\n🎉 ADMIN ACCOUNT SETUP COMPLETED!');
  console.log('=====================================');
  console.log('📧 Email:', ADMIN_CONFIG.email);
  console.log('🔑 Password:', ADMIN_CONFIG.password);
  console.log('❓ Security Question:', ADMIN_CONFIG.securityQuestion);
  console.log('💬 Security Answer:', ADMIN_CONFIG.securityAnswer);
  console.log('👤 Role: admin');
  console.log('✅ Status: Active');
  console.log('🆔 User ID:', userId);
  console.log('🌐 API Base URL:', API_BASE_URL);
  console.log('=====================================');
  console.log('⚠️  IMPORTANT: Please change the password after first login!');
  console.log('⚠️  IMPORTANT: Keep these credentials secure!');
  console.log('=====================================\n');
};

// Test admin access
const testAdminAccess = async (token) => {
  try {
    console.log('🧪 Testing admin access...');
    
    // Test getting all users (admin only endpoint)
    const usersResponse = await axios.get(`${API_BASE_URL}/api/users`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (usersResponse.data.success) {
      console.log('✅ Admin access confirmed - can access admin endpoints');
      return true;
    } else {
      console.log('❌ Admin access failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Admin access test failed:', error.message);
    return false;
  }
};

// Main function
const main = async () => {
  try {
    console.log('🚀 Starting admin account creation via API...');
    console.log('🌐 API Base URL:', API_BASE_URL);
    
    const result = await createAdminUser();
    
    if (result.success) {
      console.log('✅ Admin account created/updated successfully!');
      
      // Test admin access
      await testAdminAccess(result.token);
      
      console.log('🎉 Admin setup completed successfully!');
    } else {
      console.log('❌ Failed to create admin account');
    }
    
  } catch (error) {
    console.error('❌ Failed to create admin account:', error.message);
    process.exit(1);
  }
};

// Run the script
if (require.main === module) {
  main();
}

module.exports = { createAdminUser, updateExistingUser, ADMIN_CONFIG };
