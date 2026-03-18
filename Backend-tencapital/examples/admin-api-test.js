const axios = require('axios');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';

// Test data for creating admin user
const ADMIN_TEST_DATA = {
  email: 'test-admin@investormatch.com',
  firstName: 'Test',
  lastName: 'Admin',
  password: 'TestAdmin123!',
  securityQuestion: 'What is the name of your first pet?',
  securityAnswer: 'testpet'
};

// Test data for creating user with role
const USER_WITH_ROLE_TEST_DATA = {
  email: 'test-moderator@investormatch.com',
  firstName: 'Test',
  lastName: 'Moderator',
  password: 'TestMod123!',
  securityQuestion: 'What is your favorite color?',
  securityAnswer: 'blue',
  role: 'moderator',
  isActive: true
};

// Test creating admin user
const testCreateAdminUser = async () => {
  try {
    console.log('🔄 Testing create admin user...');
    
    const response = await axios.post(`${API_BASE_URL}/api/admin/create-admin`, ADMIN_TEST_DATA);
    
    if (response.data.success) {
      console.log('✅ Admin user created successfully');
      console.log('📧 Email:', response.data.user.email);
      console.log('👤 Role:', response.data.user.role);
      console.log('🆔 User ID:', response.data.user._id);
      console.log('🔑 Token:', response.data.token ? 'Generated' : 'Not generated');
      return response.data;
    } else {
      console.log('❌ Failed to create admin user');
      return null;
    }
  } catch (error) {
    if (error.response) {
      console.error('❌ API Error:', error.response.data);
      if (error.response.status === 409) {
        console.log('⚠️  Admin user already exists');
      }
    } else {
      console.error('❌ Error:', error.message);
    }
    return null;
  }
};

// Test creating user with role
const testCreateUserWithRole = async () => {
  try {
    console.log('🔄 Testing create user with role...');
    
    const response = await axios.post(`${API_BASE_URL}/api/admin/create-user-with-role`, USER_WITH_ROLE_TEST_DATA);
    
    if (response.data.success) {
      console.log('✅ User with role created successfully');
      console.log('📧 Email:', response.data.user.email);
      console.log('👤 Role:', response.data.user.role);
      console.log('🆔 User ID:', response.data.user._id);
      console.log('🔑 Token:', response.data.token ? 'Generated' : 'Not generated');
      return response.data;
    } else {
      console.log('❌ Failed to create user with role');
      return null;
    }
  } catch (error) {
    if (error.response) {
      console.error('❌ API Error:', error.response.data);
      if (error.response.status === 409) {
        console.log('⚠️  User already exists');
      }
    } else {
      console.error('❌ Error:', error.message);
    }
    return null;
  }
};

// Test validation errors
const testValidationErrors = async () => {
  try {
    console.log('🔄 Testing validation errors...');
    
    // Test with missing required fields
    const invalidData = {
      email: 'invalid-email',
      firstName: 'A', // Too short
      lastName: 'B', // Too short
      password: '123', // Too short
      securityQuestion: 'Q', // Too short
      securityAnswer: 'A' // Too short
    };
    
    const response = await axios.post(`${API_BASE_URL}/api/admin/create-admin`, invalidData);
    console.log('❌ Validation should have failed but didn\'t');
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log('✅ Validation errors caught correctly');
      console.log('📝 Validation details:', error.response.data.details);
    } else {
      console.error('❌ Unexpected error:', error.message);
    }
  }
};

// Test getting admin users (requires authentication)
const testGetAdminUsers = async (token) => {
  try {
    console.log('🔄 Testing get admin users...');
    
    const response = await axios.get(`${API_BASE_URL}/api/admin/admin-users`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.data.success) {
      console.log('✅ Admin users retrieved successfully');
      console.log('👥 Total admin users:', response.data.pagination.totalAdminUsers);
      console.log('📄 Current page:', response.data.pagination.currentPage);
      return response.data;
    } else {
      console.log('❌ Failed to get admin users');
      return null;
    }
  } catch (error) {
    if (error.response) {
      console.error('❌ API Error:', error.response.data);
      if (error.response.status === 401) {
        console.log('⚠️  Authentication required');
      }
    } else {
      console.error('❌ Error:', error.message);
    }
    return null;
  }
};

// Test admin statistics (requires authentication)
const testGetAdminStatistics = async (token) => {
  try {
    console.log('🔄 Testing get admin statistics...');
    
    const response = await axios.get(`${API_BASE_URL}/api/admin/statistics`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.data.success) {
      console.log('✅ Admin statistics retrieved successfully');
      console.log('📊 Total users:', response.data.statistics.totalUsers);
      console.log('👑 Total admin users:', response.data.statistics.totalAdminUsers);
      console.log('🛡️ Total moderator users:', response.data.statistics.totalModeratorUsers);
      console.log('👤 Total regular users:', response.data.statistics.totalRegularUsers);
      return response.data;
    } else {
      console.log('❌ Failed to get admin statistics');
      return null;
    }
  } catch (error) {
    if (error.response) {
      console.error('❌ API Error:', error.response.data);
      if (error.response.status === 401) {
        console.log('⚠️  Authentication required');
      }
    } else {
      console.error('❌ Error:', error.message);
    }
    return null;
  }
};

// Test promote user to admin (requires authentication)
const testPromoteUserToAdmin = async (userId, token) => {
  try {
    console.log('🔄 Testing promote user to admin...');
    
    const response = await axios.put(`${API_BASE_URL}/api/admin/promote-to-admin/${userId}`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.data.success) {
      console.log('✅ User promoted to admin successfully');
      console.log('👤 User role:', response.data.user.role);
      return response.data;
    } else {
      console.log('❌ Failed to promote user to admin');
      return null;
    }
  } catch (error) {
    if (error.response) {
      console.error('❌ API Error:', error.response.data);
      if (error.response.status === 401) {
        console.log('⚠️  Authentication required');
      }
    } else {
      console.error('❌ Error:', error.message);
    }
    return null;
  }
};

// Test demote admin to user (requires authentication)
const testDemoteAdminToUser = async (userId, token) => {
  try {
    console.log('🔄 Testing demote admin to user...');
    
    const response = await axios.put(`${API_BASE_URL}/api/admin/demote-to-user/${userId}`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.data.success) {
      console.log('✅ Admin demoted to user successfully');
      console.log('👤 User role:', response.data.user.role);
      return response.data;
    } else {
      console.log('❌ Failed to demote admin to user');
      return null;
    }
  } catch (error) {
    if (error.response) {
      console.error('❌ API Error:', error.response.data);
      if (error.response.status === 401) {
        console.log('⚠️  Authentication required');
      }
    } else {
      console.error('❌ Error:', error.message);
    }
    return null;
  }
};

// Main test function
const runTests = async () => {
  try {
    console.log('🚀 Starting Admin API Tests...');
    console.log('🌐 API Base URL:', API_BASE_URL);
    console.log('=====================================');
    
    // Test 1: Create admin user
    console.log('\n📝 Test 1: Create Admin User');
    const adminResult = await testCreateAdminUser();
    
    // Test 2: Create user with role
    console.log('\n📝 Test 2: Create User with Role');
    const userWithRoleResult = await testCreateUserWithRole();
    
    // Test 3: Validation errors
    console.log('\n📝 Test 3: Validation Errors');
    await testValidationErrors();
    
    // Test 4: Get admin users (if we have a token)
    if (adminResult && adminResult.token) {
      console.log('\n📝 Test 4: Get Admin Users');
      await testGetAdminUsers(adminResult.token);
      
      // Test 5: Get admin statistics
      console.log('\n📝 Test 5: Get Admin Statistics');
      await testGetAdminStatistics(adminResult.token);
      
      // Test 6: Promote user to admin (if we have a user with role)
      if (userWithRoleResult && userWithRoleResult.user._id) {
        console.log('\n📝 Test 6: Promote User to Admin');
        await testPromoteUserToAdmin(userWithRoleResult.user._id, adminResult.token);
        
        // Test 7: Demote admin to user
        console.log('\n📝 Test 7: Demote Admin to User');
        await testDemoteAdminToUser(userWithRoleResult.user._id, adminResult.token);
      }
    }
    
    console.log('\n=====================================');
    console.log('✅ Admin API Tests Completed!');
    console.log('=====================================');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    process.exit(1);
  }
};

// Run the tests
if (require.main === module) {
  runTests();
}

module.exports = {
  testCreateAdminUser,
  testCreateUserWithRole,
  testValidationErrors,
  testGetAdminUsers,
  testGetAdminStatistics,
  testPromoteUserToAdmin,
  testDemoteAdminToUser,
  ADMIN_TEST_DATA,
  USER_WITH_ROLE_TEST_DATA
};
