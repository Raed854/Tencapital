const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');
const { 
  validateAdminUserCreation, 
  validateUserWithRoleCreation 
} = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticateToken, authorize } = require('../middleware/auth');

// Create a new admin user (PUBLIC - for initial setup)
router.post('/create-admin', validateAdminUserCreation, asyncHandler(AdminController.createAdminUser));

// Create user with specific role (PUBLIC - for initial setup)
router.post('/create-user-with-role', validateUserWithRoleCreation, asyncHandler(AdminController.createUserWithRole));

// Get all admin users (ADMIN ONLY)
router.get('/admin-users', authenticateToken, authorize('admin'), asyncHandler(AdminController.getAllAdminUsers));

// Promote existing user to admin (ADMIN ONLY)
router.put('/promote-to-admin/:userId', authenticateToken, authorize('admin'), asyncHandler(AdminController.promoteUserToAdmin));

// Demote admin to regular user (ADMIN ONLY)
router.put('/demote-to-user/:userId', authenticateToken, authorize('admin'), asyncHandler(AdminController.demoteAdminToUser));

// Get admin statistics (ADMIN ONLY)
router.get('/statistics', authenticateToken, authorize('admin'), asyncHandler(AdminController.getAdminStatistics));

module.exports = router;
