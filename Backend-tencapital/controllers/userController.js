const User = require('../models/User');
const { generateToken, generateRefreshToken } = require('../middleware/auth');
const jwt = require('jsonwebtoken');

class UserController {
  // Register a new user
  static async register(req, res) {
    try {
      const { email, firstName, lastName, password, securityQuestion, securityAnswer } = req.body;

      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'User with this email already exists'
        });
      }

      // Create new user
      const user = await User.createUser({
        email,
        firstName,
        lastName,
        password,
        securityQuestion,
        securityAnswer
      });

      res.status(201).json({
        success: true,
        message: 'User account created successfully',
        userId: user._id
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Check if email exists
  static async checkEmail(req, res) {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required'
        });
      }

      const exists = await User.emailExists(email);
      
      res.json({
        success: true,
        exists: exists
      });
    } catch (error) {
      console.error('Check email error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get all users
  static async getAllUsers(req, res) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        search = '', 
        isActive = null,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const limitNum = parseInt(limit);

      // Build filter object
      const filter = {};
      
      if (search) {
        filter.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      if (isActive !== null) {
        filter.isActive = isActive === 'true';
      }

      // Build sort object
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Get users with pagination
      const users = await User.find(filter)
        .select('-passwordHash -securityAnswer')
        .sort(sort)
        .skip(skip)
        .limit(limitNum);

      // Get total count for pagination
      const totalUsers = await User.countDocuments(filter);
      const totalPages = Math.ceil(totalUsers / limitNum);

      res.json({
        success: true,
        users: users,
        pagination: {
          currentPage: parseInt(page),
          totalPages: totalPages,
          totalUsers: totalUsers,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1,
          limit: limitNum
        }
      });
    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get user by ID (simple version)
  static async getUserById(req, res) {
    try {
      const { userId } = req.params;

      console.log('🔍 [DEBUG] Get user by ID request:', { userId });

      // Validate MongoDB ObjectId format
      if (!userId || !/^[0-9a-fA-F]{24}$/.test(userId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID format',
          error: 'User ID must be a valid MongoDB ObjectId'
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          error: 'No user exists with the provided ID'
        });
      }

      res.json({
        success: true,
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          securityQuestion: user.securityQuestion,
          passwordHash: user.passwordHash,
          securityAnswer: user.securityAnswer,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      });
    } catch (error) {
      console.error('❌ [DEBUG] Get user by ID error:', error);
      
      if (error.name === 'CastError') {
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID format',
          error: 'User ID must be a valid MongoDB ObjectId'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Get user profile (detailed version)
  static async getProfile(req, res) {
    try {
      const { userId } = req.params;
      
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          securityQuestion: user.securityQuestion,
          passwordHash: user.passwordHash,
          securityAnswer: user.securityAnswer,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }



  // Activate/Deactivate user
  static async updateUserStatus(req, res) {
    try {
      const { userId } = req.params;
      const { isActive } = req.body;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      await user.setActiveStatus(isActive);
      
      res.json({
        success: true,
        message: `User ${isActive ? 'activated' : 'deactivated'} successfully`
      });
    } catch (error) {
      console.error('Update user status error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Update user profile
  static async updateProfile(req, res) {
    try {
      const { userId } = req.params;
      const updateData = req.body;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Update user fields
      const allowedFields = ['firstName', 'lastName', 'email', 'securityQuestion'];
      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          user[field] = updateData[field];
        }
      }

      // Handle password update
      if (updateData.password) {
        user.passwordHash = updateData.password; // Will be hashed by pre-save middleware
      }

      // Handle security answer update
      if (updateData.securityAnswer) {
        user.securityAnswer = updateData.securityAnswer; // Will be hashed by pre-save middleware
      }

      await user.save();
      
      res.json({
        success: true,
        message: 'Profile updated successfully',
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          securityQuestion: user.securityQuestion,
          passwordHash: user.passwordHash,
          securityAnswer: user.securityAnswer,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Update all user data
  static async updateUser(req, res) {
    try {
      const { userId } = req.params;
      const updateData = req.body;

      console.log('🔄 [DEBUG] Update user request:', {
        userId,
        updateData: Object.keys(updateData)
      });

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check if email is being updated and if it already exists
      if (updateData.email && updateData.email !== user.email) {
        const existingUser = await User.findByEmail(updateData.email);
        if (existingUser && existingUser._id.toString() !== userId) {
          return res.status(409).json({
            success: false,
            message: 'Email already exists'
          });
        }
      }

      // Update all allowed fields
      const allowedFields = [
        'firstName', 
        'lastName', 
        'email', 
        'securityQuestion',
        'isActive',
        'role'
      ];

      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          user[field] = updateData[field];
        }
      }

      // Handle password update
      if (updateData.password) {
        user.passwordHash = updateData.password; // Will be hashed by pre-save middleware
      }

      // Handle security answer update
      if (updateData.securityAnswer) {
        user.securityAnswer = updateData.securityAnswer; // Will be hashed by pre-save middleware
      }

      // Validate role if provided
      if (updateData.role) {
        const validRoles = ['user', 'admin', 'moderator'];
        const normalizedRole = updateData.role.toString().trim().toLowerCase();
        if (!validRoles.includes(normalizedRole)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid role. Must be one of: user, admin, moderator',
            received: updateData.role,
            validOptions: validRoles
          });
        }
        user.role = normalizedRole;
      }

      await user.save();
      
      console.log('✅ [DEBUG] User updated successfully');

      res.json({
        success: true,
        message: 'User updated successfully',
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          securityQuestion: user.securityQuestion,
          passwordHash: user.passwordHash,
          securityAnswer: user.securityAnswer,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      });
    } catch (error) {
      console.error('❌ [DEBUG] Update user error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Update user role
  static async updateUserRole(req, res) {
    try {
      const { userId } = req.params;
      const { role } = req.body;

      console.log('🔄 [DEBUG] Update user role request:', {
        userId,
        role,
        roleType: typeof role,
        bodyKeys: Object.keys(req.body)
      });

      // Check if role is provided
      if (!role) {
        return res.status(400).json({
          success: false,
          message: 'Role is required'
        });
      }

      // Normalize role (trim whitespace and convert to lowercase)
      const normalizedRole = role.toString().trim().toLowerCase();

      // Validate role
      const validRoles = ['user', 'admin', 'moderator'];
      if (!validRoles.includes(normalizedRole)) {
        console.log('❌ [DEBUG] Invalid role provided:', {
          originalRole: role,
          normalizedRole: normalizedRole,
          validRoles: validRoles
        });
        return res.status(400).json({
          success: false,
          message: 'Invalid role. Must be one of: user, admin, moderator',
          received: role,
          validOptions: validRoles
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        console.log('❌ [DEBUG] User not found with ID:', userId);
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      console.log('✅ [DEBUG] User found, updating role from', user.role, 'to', normalizedRole);

      try {
        await user.updateRole(normalizedRole);
        console.log('✅ [DEBUG] Role updated successfully');
      } catch (updateError) {
        console.error('❌ [DEBUG] Error updating role:', updateError);
        throw updateError;
      }
      
      res.json({
        success: true,
        message: `User role updated to ${normalizedRole} successfully`,
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          securityQuestion: user.securityQuestion,
          passwordHash: user.passwordHash,
          securityAnswer: user.securityAnswer,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      });
    } catch (error) {
      console.error('❌ [DEBUG] Update user role error:', error);
      console.error('❌ [DEBUG] Error message:', error.message);
      console.error('❌ [DEBUG] Error stack:', error.stack);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Delete user account
  static async deleteAccount(req, res) {
    try {
      const { userId } = req.params;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      await user.deleteOne();
      
      res.json({
        success: true,
        message: 'Account deleted successfully'
      });
    } catch (error) {
      console.error('Delete account error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Login user
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      const isValidPassword = await user.verifyPassword(password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Generate JWT tokens
      const token = generateToken(user._id);
      const refreshToken = generateRefreshToken(user._id);

      res.json({
        success: true,
        message: 'Login successful',
        user: user.toJSON(),
        token,
        refreshToken
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Refresh JWT token
  static async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          message: 'Refresh token required'
        });
      }

      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
      
      if (decoded.type !== 'refresh') {
        return res.status(401).json({
          success: false,
          message: 'Invalid refresh token'
        });
      }

      // Get user
      const user = await User.findById(decoded.userId);
      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'User not found or inactive'
        });
      }

      // Generate new tokens
      const newToken = generateToken(user._id);
      const newRefreshToken = generateRefreshToken(user._id);

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        token: newToken,
        refreshToken: newRefreshToken
      });
    } catch (error) {
      console.error('Refresh token error:', error);
      res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }
  }

  // Step 1: Verify email and get security question
  static async verifyEmail(req, res) {
    try {
      const { email } = req.body;

      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        message: 'Email verified successfully',
        securityQuestion: user.securityQuestion
      });
    } catch (error) {
      console.error('Email verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Step 2: Verify security answer
  static async verifySecurityAnswer(req, res) {
    try {
      const { email, securityAnswer } = req.body;

      const { valid, user } = await User.verifySecurityAnswer(email, securityAnswer);
      
      if (!valid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid security answer'
        });
      }

      res.json({
        success: true,
        message: 'Security answer verified successfully',
        canResetPassword: true
      });
    } catch (error) {
      console.error('Security answer verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Step 3: Reset password
  static async resetPassword(req, res) {
    try {
      console.log('🔄 [DEBUG] Reset password request received:', {
        body: req.body,
        hasEmail: !!req.body.email,
        hasNewPassword: !!req.body.newPassword,
        hasConfirmPassword: !!req.body.confirmPassword,
        hasSecurityAnswer: !!req.body.securityAnswer
      });

      const { email, newPassword, confirmPassword, securityAnswer } = req.body;

      // Validate passwords match
      if (newPassword !== confirmPassword) {
        console.log('❌ [DEBUG] Passwords do not match:', { newPassword, confirmPassword });
        return res.status(400).json({
          success: false,
          message: 'Passwords do not match'
        });
      }

      console.log('✅ [DEBUG] Passwords match, proceeding with reset');
      
      // Reset password
      await User.resetPassword(email, newPassword, securityAnswer);

      console.log('✅ [DEBUG] Password reset successful');
      res.json({
        success: true,
        message: 'Password reset successfully'
      });
    } catch (error) {
      console.error('❌ [DEBUG] Reset password error:', error);
      
      if (error.message === 'Invalid security answer') {
        return res.status(400).json({
          success: false,
          message: 'Invalid security answer'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Change password (for logged-in users)
  static async changePassword(req, res) {
    try {
      const { userId } = req.params;
      const { currentPassword, newPassword, confirmPassword } = req.body;

      console.log('🔄 [DEBUG] Change password request:', {
        userId,
        hasCurrentPassword: !!currentPassword,
        hasNewPassword: !!newPassword,
        hasConfirmPassword: !!confirmPassword
      });

      // Validate passwords match
      if (newPassword !== confirmPassword) {
        return res.status(400).json({
          success: false,
          message: 'New passwords do not match'
        });
      }

      // Find user
      const user = await User.findById(userId);
      if (!user) {
        console.log('❌ [DEBUG] User not found with ID:', userId);
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Verify current password
      const isValidCurrentPassword = await user.verifyPassword(currentPassword);
      if (!isValidCurrentPassword) {
        console.log('❌ [DEBUG] Invalid current password');
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Update password
      user.passwordHash = newPassword; // Will be hashed by pre-save middleware
      await user.save();

      console.log('✅ [DEBUG] Password changed successfully');

      res.json({
        success: true,
        message: 'Password changed successfully',
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          securityQuestion: user.securityQuestion,
          passwordHash: user.passwordHash,
          securityAnswer: user.securityAnswer,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      });
    } catch (error) {
      console.error('❌ [DEBUG] Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Logout user (invalidate token)
  static async logout(req, res) {
    try {
      const { userId } = req.params;

      console.log('🚪 [DEBUG] Logout request:', { userId });

      // Find user
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // In a real application, you might want to:
      // 1. Add the token to a blacklist
      // 2. Store logout timestamp in user record
      // 3. Invalidate refresh tokens
      
      // For now, we'll just return a success message
      // The client should remove the token from storage
      console.log('✅ [DEBUG] User logged out successfully:', userId);

      res.json({
        success: true,
        message: 'Logout successful',
        logoutTime: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ [DEBUG] Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Get all user data for modification (comprehensive)
  static async getAllUserData(req, res) {
    try {
      const { userId } = req.params;

      console.log('📊 [DEBUG] Get all user data request:', { userId });

      // Find user
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Import related models
      const Investor = require('../models/Investor');
      const EnregistrerFiltre = require('../models/EnregistrerFiltre');
      const ExcelMapping = require('../models/ExcelMapping');

      // Get user's investors
      const investors = await Investor.find({ userId: userId })
        .sort({ createdAt: -1 })
        .limit(50); // Limit to last 50 investors

      // Get user's saved filters
      const savedFilters = await EnregistrerFiltre.find({ userId: userId })
        .sort({ createdAt: -1 })
        .limit(20); // Limit to last 20 filters

      // Get user's Excel mappings
      const excelMappings = await ExcelMapping.find({ userId: userId })
        .sort({ createdAt: -1 })
        .limit(10); // Limit to last 10 mappings

      // Get statistics
      const totalInvestors = await Investor.countDocuments({ userId: userId });
      const totalFilters = await EnregistrerFiltre.countDocuments({ userId: userId });
      const totalMappings = await ExcelMapping.countDocuments({ userId: userId });

      // Get recent activity (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentInvestors = await Investor.countDocuments({
        userId: userId,
        createdAt: { $gte: thirtyDaysAgo }
      });

      const recentFilters = await EnregistrerFiltre.countDocuments({
        userId: userId,
        createdAt: { $gte: thirtyDaysAgo }
      });

      console.log('✅ [DEBUG] All user data retrieved:', {
        userId,
        totalInvestors,
        totalFilters,
        totalMappings,
        recentInvestors,
        recentFilters
      });

      res.json({
        success: true,
        userData: {
          // Basic user information
          user: {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
            securityQuestion: user.securityQuestion,
            passwordHash: user.passwordHash,
            securityAnswer: user.securityAnswer,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
          },
          // Related data
          investors: {
            data: investors,
            total: totalInvestors,
            recent: recentInvestors
          },
          savedFilters: {
            data: savedFilters,
            total: totalFilters,
            recent: recentFilters
          },
          excelMappings: {
            data: excelMappings,
            total: totalMappings
          },
          // Statistics
          statistics: {
            totalInvestors,
            totalFilters,
            totalMappings,
            recentActivity: {
              investors: recentInvestors,
              filters: recentFilters
            },
            accountAge: Math.floor((new Date() - user.createdAt) / (1000 * 60 * 60 * 24)) // days
          }
        }
      });
    } catch (error) {
      console.error('❌ [DEBUG] Get all user data error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Update user password and security question
  static async updatePasswordAndSecurity(req, res) {
    try {
      const { userId } = req.params;
      const { 
        currentPassword, 
        newPassword, 
        confirmPassword, 
        newSecurityQuestion, 
        newSecurityAnswer 
      } = req.body;

      console.log('🔐 [DEBUG] Update password and security request:', {
        userId,
        hasCurrentPassword: !!currentPassword,
        hasNewPassword: !!newPassword,
        hasNewSecurityQuestion: !!newSecurityQuestion,
        hasNewSecurityAnswer: !!newSecurityAnswer
      });

      // Validate required fields
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is required'
        });
      }

      if (!newPassword) {
        return res.status(400).json({
          success: false,
          message: 'New password is required'
        });
      }

      if (!confirmPassword) {
        return res.status(400).json({
          success: false,
          message: 'Password confirmation is required'
        });
      }

      // Validate passwords match
      if (newPassword !== confirmPassword) {
        return res.status(400).json({
          success: false,
          message: 'New passwords do not match'
        });
      }

      // Validate password strength
      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long'
        });
      }

      // Find user
      const user = await User.findById(userId);
      if (!user) {
        console.log('❌ [DEBUG] User not found with ID:', userId);
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Verify current password
      const isValidCurrentPassword = await user.verifyPassword(currentPassword);
      if (!isValidCurrentPassword) {
        console.log('❌ [DEBUG] Invalid current password');
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Update password
      user.passwordHash = newPassword; // Will be hashed by pre-save middleware

      // Update security question and answer if provided
      if (newSecurityQuestion) {
        user.securityQuestion = newSecurityQuestion;
      }

      if (newSecurityAnswer) {
        user.securityAnswer = newSecurityAnswer; // Will be hashed by pre-save middleware
      }

      // Validate security question and answer are both provided if one is provided
      if ((newSecurityQuestion && !newSecurityAnswer) || (!newSecurityQuestion && newSecurityAnswer)) {
        return res.status(400).json({
          success: false,
          message: 'Both security question and answer must be provided together'
        });
      }

      await user.save();

      console.log('✅ [DEBUG] Password and security updated successfully');

      res.json({
        success: true,
        message: 'Password and security information updated successfully',
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          securityQuestion: user.securityQuestion,
          passwordHash: user.passwordHash,
          securityAnswer: user.securityAnswer,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        },
        updatedFields: {
          password: true,
          securityQuestion: !!newSecurityQuestion,
          securityAnswer: !!newSecurityAnswer
        }
      });
    } catch (error) {
      console.error('❌ [DEBUG] Update password and security error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Update only security question and answer
  static async updateSecurityQuestion(req, res) {
    try {
      const { userId } = req.params;
      const { currentPassword, newSecurityQuestion, newSecurityAnswer } = req.body;

      console.log('🔐 [DEBUG] Update security question request:', {
        userId,
        hasCurrentPassword: !!currentPassword,
        hasNewSecurityQuestion: !!newSecurityQuestion,
        hasNewSecurityAnswer: !!newSecurityAnswer
      });

      // Validate required fields
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is required for security verification'
        });
      }

      if (!newSecurityQuestion) {
        return res.status(400).json({
          success: false,
          message: 'New security question is required'
        });
      }

      if (!newSecurityAnswer) {
        return res.status(400).json({
          success: false,
          message: 'New security answer is required'
        });
      }

      // Find user
      const user = await User.findById(userId);
      if (!user) {
        console.log('❌ [DEBUG] User not found with ID:', userId);
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Verify current password
      const isValidCurrentPassword = await user.verifyPassword(currentPassword);
      if (!isValidCurrentPassword) {
        console.log('❌ [DEBUG] Invalid current password');
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Update security question and answer
      user.securityQuestion = newSecurityQuestion;
      user.securityAnswer = newSecurityAnswer; // Will be hashed by pre-save middleware

      await user.save();

      console.log('✅ [DEBUG] Security question updated successfully');

      res.json({
        success: true,
        message: 'Security question and answer updated successfully',
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          securityQuestion: user.securityQuestion,
          passwordHash: user.passwordHash,
          securityAnswer: user.securityAnswer,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      });
    } catch (error) {
      console.error('❌ [DEBUG] Update security question error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
}

module.exports = UserController;
