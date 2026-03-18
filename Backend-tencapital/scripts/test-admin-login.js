#!/usr/bin/env node

const axios = require('axios');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';
const ADMIN_CREDENTIALS = {
  email: 'admin@investormatch.com',
  password: 'Admin123!@#'
};

// Test admin login
const testAdminLogin = async () => {
  try {
    console.log('🧪 Testing admin login...');
    console.log('🌐 API Base URL:', API_BASE_URL);
    console.log('📧 Email:', ADMIN_CREDENTIALS.email);
    
    // Test login
    const loginResponse = await axios.post(`${API_BASE_URL}/api/users/login`, {
      email: ADMIN_CREDENTIALS.email,
      password: ADMIN_CREDENTIALS.password
    });

    if (loginResponse.data.success) {
      console.log('✅ Admin login successful');
      console.log('👤 User:', loginResponse.data.user);
      console.log('🔑 Token received:', !!loginResponse.data.token);
      
      const token = loginResponse.data.token;
      const userId = loginResponse.data.user._id;
      
      // Test admin endpoints
      await testAdminEndpoints(token, userId);
      
      return {
        success: true,
        token: token,
        userId: userId,
        user: loginResponse.data.user
      };
    } else {
      console.log('❌ Admin login failed');
      return { success: false };
    }
  } catch (error) {
    if (error.response) {
      console.error('❌ API Error:', error.response.data);
    } else {
      console.error('❌ Error:', error.message);
    }
    return { success: false, error: error.message };
  }
};

// Test admin endpoints
const testAdminEndpoints = async (token, userId) => {
  try {
    console.log('\n🔍 Testing admin endpoints...');
    
    // Test 1: Get all users (admin only)
    console.log('📋 Testing: Get all users...');
    const usersResponse = await axios.get(`${API_BASE_URL}/api/users`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (usersResponse.data.success) {
      console.log('✅ Get all users: SUCCESS');
      console.log('   - Total users:', usersResponse.data.users?.length || 0);
    } else {
      console.log('❌ Get all users: FAILED');
    }
    
    // Test 2: Get user profile
    console.log('👤 Testing: Get user profile...');
    const profileResponse = await axios.get(`${API_BASE_URL}/api/users/profile/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (profileResponse.data.success) {
      console.log('✅ Get user profile: SUCCESS');
      console.log('   - Role:', profileResponse.data.user?.role);
      console.log('   - Active:', profileResponse.data.user?.isActive);
    } else {
      console.log('❌ Get user profile: FAILED');
    }
    
    // Test 3: Get all user data
    console.log('📊 Testing: Get all user data...');
    const allDataResponse = await axios.get(`${API_BASE_URL}/api/users/${userId}/all-data`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (allDataResponse.data.success) {
      console.log('✅ Get all user data: SUCCESS');
      console.log('   - Has investors:', !!allDataResponse.data.userData?.investors);
      console.log('   - Has saved filters:', !!allDataResponse.data.userData?.savedFilters);
    } else {
      console.log('❌ Get all user data: FAILED');
    }
    
    // Test 4: Test investor creation (admin can create investors)
    console.log('💼 Testing: Create investor...');
    const investorData = {
      investorType: 'Test Investor',
      sector: 'Technology',
      organizationPersonName: 'Test Organization',
      firstName: 'Test',
      lastName: 'Admin',
      email: 'test@admin.com',
      location: 'Test City',
      userId: userId
    };
    
    const investorResponse = await axios.post(`${API_BASE_URL}/api/investors`, investorData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (investorResponse.data.success) {
      console.log('✅ Create investor: SUCCESS');
      console.log('   - Investor ID:', investorResponse.data.investorId);
    } else {
      console.log('❌ Create investor: FAILED');
    }
    
  } catch (error) {
    console.error('❌ Error testing admin endpoints:', error.message);
  }
};

// Test password change
const testPasswordChange = async (token, userId) => {
  try {
    console.log('\n🔐 Testing: Password change...');
    
    const newPassword = 'NewAdminPassword123!@#';
    
    const changePasswordResponse = await axios.put(`${API_BASE_URL}/api/users/${userId}/change-password`, {
      currentPassword: ADMIN_CREDENTIALS.password,
      newPassword: newPassword,
      confirmPassword: newPassword
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (changePasswordResponse.data.success) {
      console.log('✅ Password change: SUCCESS');
      console.log('⚠️  Password has been changed to:', newPassword);
      console.log('⚠️  Update ADMIN_CREDENTIALS.password if needed');
    } else {
      console.log('❌ Password change: FAILED');
    }
  } catch (error) {
    console.error('❌ Error testing password change:', error.message);
  }
};

// Main function
const main = async () => {
  try {
    console.log('🚀 Starting admin login test...');
    
    const result = await testAdminLogin();
    
    if (result.success) {
      console.log('\n✅ Admin login test completed successfully!');
      console.log('🎉 Admin account is working correctly');
      
      // Uncomment the line below to test password change
      // await testPasswordChange(result.token, result.userId);
      
    } else {
      console.log('\n❌ Admin login test failed');
      console.log('💡 Make sure the admin account was created successfully');
      console.log('💡 Run: npm run setup-admin');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
};

// Run the script
if (require.main === module) {
  main();
}

module.exports = { testAdminLogin, ADMIN_CREDENTIALS };
