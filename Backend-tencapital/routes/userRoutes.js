const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const { 
  validateUserRegistration, 
  validateEmail, 
  validateUserUpdate,
  validateLogin,
  validateVerifyEmail,
  validateVerifySecurityAnswer,
  validateResetPassword,
  validateUpdateUserStatus,
  validateChangePassword
} = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticateToken, authorize } = require('../middleware/auth');

// User registration
router.post('/register', validateUserRegistration, asyncHandler(UserController.register));

// Check if email exists
router.post('/check-email', validateEmail, asyncHandler(UserController.checkEmail));

// User login
router.post('/login', validateLogin, asyncHandler(UserController.login));

// Refresh JWT token
router.post('/refresh-token', asyncHandler(UserController.refreshToken));

// Forgot password - Step by step flow
// Step 1: Verify email and get security question
router.post('/forgot-password/verify-email', validateVerifyEmail, asyncHandler(UserController.verifyEmail));

// Step 2: Verify security answer
router.post('/forgot-password/verify-answer', validateVerifySecurityAnswer, asyncHandler(UserController.verifySecurityAnswer));

// Step 3: Reset password
router.post('/forgot-password/reset', validateResetPassword, asyncHandler(UserController.resetPassword));

// Alternative endpoint for frontend compatibility
router.post('/forgot-password/reset-password', validateResetPassword, asyncHandler(UserController.resetPassword));

// Get all users (ADMIN ONLY)
router.get('/', authenticateToken, authorize('admin'), asyncHandler(UserController.getAllUsers));

// Get user by ID (AUTHENTICATED USERS)
router.get('/:userId', authenticateToken, asyncHandler(UserController.getUserById));

// Get user by ID (PUBLIC - for testing and development)
router.get('/public/:userId', asyncHandler(UserController.getUserById));

// Update user (PUBLIC - for testing and development)
router.put('/public/:userId', asyncHandler(UserController.updateUser));

// Update user profile (PUBLIC - for testing and development)
router.put('/public/profile/:userId', asyncHandler(UserController.updateProfile));

// Update password and security (PUBLIC - for testing and development)
router.put('/public/:userId/update-password-security', asyncHandler(UserController.updatePasswordAndSecurity));

// Update security question (PUBLIC - for testing and development)
router.put('/public/:userId/update-security-question', asyncHandler(UserController.updateSecurityQuestion));

// Change password (PUBLIC - for testing and development)
router.put('/public/:userId/change-password', asyncHandler(UserController.changePassword));

// Get user profile (AUTHENTICATED USERS)
router.get('/profile/:userId', authenticateToken, asyncHandler(UserController.getProfile));

// Get all user data for modification (AUTHENTICATED USERS)
router.get('/:userId/all-data', authenticateToken, asyncHandler(UserController.getAllUserData));

// Update user profile (AUTHENTICATED USERS)
router.put('/profile/:userId', authenticateToken, validateUserUpdate, asyncHandler(UserController.updateProfile));

// Update all user data (AUTHENTICATED USERS)
router.put('/:userId', authenticateToken, validateUserUpdate, asyncHandler(UserController.updateUser));

// Update user status (ADMIN ONLY)
router.put('/:userId/status', authenticateToken, authorize('admin'), validateUpdateUserStatus, asyncHandler(UserController.updateUserStatus));

// Update user role (ADMIN ONLY)
router.put('/:userId/role', authenticateToken, authorize('admin'), asyncHandler(UserController.updateUserRole));

// Change password (AUTHENTICATED USERS)
router.put('/:userId/change-password', authenticateToken, validateChangePassword, asyncHandler(UserController.changePassword));

// Update password and security question (AUTHENTICATED USERS)
router.put('/:userId/update-password-security', authenticateToken, asyncHandler(UserController.updatePasswordAndSecurity));

// Update security question only (AUTHENTICATED USERS)
router.put('/:userId/update-security-question', authenticateToken, asyncHandler(UserController.updateSecurityQuestion));

// Logout user (AUTHENTICATED USERS)
router.post('/logout/:userId', authenticateToken, asyncHandler(UserController.logout));

// Delete user account (AUTHENTICATED USERS)
router.delete('/account/:userId', authenticateToken, asyncHandler(UserController.deleteAccount));

module.exports = router;
