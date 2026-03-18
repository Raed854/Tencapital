const User = require('../models/User');
const { generateToken, generateRefreshToken } = require('../middleware/auth');

class AdminController {
  // Create a new admin user
  static async createAdminUser(req, res) {
    try {
      const { 
        email, 
        firstName, 
        lastName, 
        password, 
        securityQuestion, 
        securityAnswer 
      } = req.body;

      console.log('🔄 [DEBUG] Create admin user request:', {
        email,
        firstName,
        lastName,
        hasPassword: !!password,
        hasSecurityQuestion: !!securityQuestion,
        hasSecurityAnswer: !!securityAnswer
      });

      // Validate required fields
      if (!email || !firstName || !lastName || !password || !securityQuestion || !securityAnswer) {
        return res.status(400).json({
          success: false,
          message: 'All fields are required: email, firstName, lastName, password, securityQuestion, securityAnswer'
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format'
        });
      }

      // Validate password strength
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long'
        });
      }

      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'User with this email already exists'
        });
      }

      // Create new admin user
      const adminUser = new User({
        email: email.toLowerCase().trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        passwordHash: password, // Will be hashed by pre-save middleware
        securityQuestion: securityQuestion.trim(),
        securityAnswer: securityAnswer, // Will be hashed by pre-save middleware
        role: 'admin',
        isActive: true
      });

      await adminUser.save();

      console.log('✅ [DEBUG] Admin user created successfully:', {
        userId: adminUser._id,
        email: adminUser.email,
        role: adminUser.role
      });

      // Generate JWT tokens for immediate login
      const token = generateToken(adminUser._id);
      const refreshToken = generateRefreshToken(adminUser._id);

      res.status(201).json({
        success: true,
        message: 'Admin user created successfully',
        user: {
          _id: adminUser._id,
          firstName: adminUser.firstName,
          lastName: adminUser.lastName,
          email: adminUser.email,
          role: adminUser.role,
          isActive: adminUser.isActive,
          securityQuestion: adminUser.securityQuestion,
          createdAt: adminUser.createdAt,
          updatedAt: adminUser.updatedAt
        },
        token,
        refreshToken
      });
    } catch (error) {
      console.error('❌ [DEBUG] Create admin user error:', error);
      
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: 'User with this email already exists'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Create admin user with custom role
  static async createUserWithRole(req, res) {
    try {
      const { 
        email, 
        firstName, 
        lastName, 
        password, 
        securityQuestion, 
        securityAnswer,
        role = 'admin',
        isActive = true
      } = req.body;

      console.log('🔄 [DEBUG] Create user with role request:', {
        email,
        firstName,
        lastName,
        role,
        isActive,
        hasPassword: !!password,
        hasSecurityQuestion: !!securityQuestion,
        hasSecurityAnswer: !!securityAnswer
      });

      // Validate required fields
      if (!email || !firstName || !lastName || !password || !securityQuestion || !securityAnswer) {
        return res.status(400).json({
          success: false,
          message: 'All fields are required: email, firstName, lastName, password, securityQuestion, securityAnswer'
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format'
        });
      }

      // Validate password strength
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long'
        });
      }

      // Validate role
      const validRoles = ['user', 'admin', 'moderator'];
      const normalizedRole = role.toString().trim().toLowerCase();
      if (!validRoles.includes(normalizedRole)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role. Must be one of: user, admin, moderator',
          received: role,
          validOptions: validRoles
        });
      }

      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'User with this email already exists'
        });
      }

      // Create new user with specified role
      const newUser = new User({
        email: email.toLowerCase().trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        passwordHash: password, // Will be hashed by pre-save middleware
        securityQuestion: securityQuestion.trim(),
        securityAnswer: securityAnswer, // Will be hashed by pre-save middleware
        role: normalizedRole,
        isActive: isActive
      });

      await newUser.save();

      console.log('✅ [DEBUG] User created successfully:', {
        userId: newUser._id,
        email: newUser.email,
        role: newUser.role
      });

      // Generate JWT tokens for immediate login
      const token = generateToken(newUser._id);
      const refreshToken = generateRefreshToken(newUser._id);

      res.status(201).json({
        success: true,
        message: `User with role '${normalizedRole}' created successfully`,
        user: {
          _id: newUser._id,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          email: newUser.email,
          role: newUser.role,
          isActive: newUser.isActive,
          securityQuestion: newUser.securityQuestion,
          createdAt: newUser.createdAt,
          updatedAt: newUser.updatedAt
        },
        token,
        refreshToken
      });
    } catch (error) {
      console.error('❌ [DEBUG] Create user with role error:', error);
      
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: 'User with this email already exists'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Get all admin users
  static async getAllAdminUsers(req, res) {
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

      // Build filter object for admin users only
      const filter = { role: 'admin' };
      
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

      // Get admin users with pagination
      const adminUsers = await User.find(filter)
        .select('-passwordHash -securityAnswer')
        .sort(sort)
        .skip(skip)
        .limit(limitNum);

      // Get total count for pagination
      const totalAdminUsers = await User.countDocuments(filter);
      const totalPages = Math.ceil(totalAdminUsers / limitNum);

      res.json({
        success: true,
        adminUsers: adminUsers,
        pagination: {
          currentPage: parseInt(page),
          totalPages: totalPages,
          totalAdminUsers: totalAdminUsers,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1,
          limit: limitNum
        }
      });
    } catch (error) {
      console.error('Get all admin users error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Promote existing user to admin
  static async promoteUserToAdmin(req, res) {
    try {
      const { userId } = req.params;

      console.log('🔄 [DEBUG] Promote user to admin request:', { userId });

      // Validate MongoDB ObjectId format
      if (!userId || !/^[0-9a-fA-F]{24}$/.test(userId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID format'
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check if user is already admin
      if (user.role === 'admin') {
        return res.status(400).json({
          success: false,
          message: 'User is already an admin'
        });
      }

      // Update user role to admin
      user.role = 'admin';
      user.isActive = true;
      await user.save();

      console.log('✅ [DEBUG] User promoted to admin successfully:', {
        userId: user._id,
        email: user.email,
        role: user.role
      });

      res.json({
        success: true,
        message: 'User promoted to admin successfully',
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          securityQuestion: user.securityQuestion,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      });
    } catch (error) {
      console.error('❌ [DEBUG] Promote user to admin error:', error);
      
      if (error.name === 'CastError') {
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID format'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Demote admin user to regular user
  static async demoteAdminToUser(req, res) {
    try {
      const { userId } = req.params;

      console.log('🔄 [DEBUG] Demote admin to user request:', { userId });

      // Validate MongoDB ObjectId format
      if (!userId || !/^[0-9a-fA-F]{24}$/.test(userId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID format'
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check if user is admin
      if (user.role !== 'admin') {
        return res.status(400).json({
          success: false,
          message: 'User is not an admin'
        });
      }

      // Update user role to user
      user.role = 'user';
      await user.save();

      console.log('✅ [DEBUG] Admin demoted to user successfully:', {
        userId: user._id,
        email: user.email,
        role: user.role
      });

      res.json({
        success: true,
        message: 'Admin demoted to user successfully',
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          securityQuestion: user.securityQuestion,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      });
    } catch (error) {
      console.error('❌ [DEBUG] Demote admin to user error:', error);
      
      if (error.name === 'CastError') {
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID format'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Get admin statistics
  static async getAdminStatistics(req, res) {
    try {
      console.log('📊 [DEBUG] Get admin statistics request');

      // Get total counts
      const totalUsers = await User.countDocuments();
      const totalAdminUsers = await User.countDocuments({ role: 'admin' });
      const totalModeratorUsers = await User.countDocuments({ role: 'moderator' });
      const totalRegularUsers = await User.countDocuments({ role: 'user' });
      const activeUsers = await User.countDocuments({ isActive: true });
      const inactiveUsers = await User.countDocuments({ isActive: false });

      // Get recent admin users (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentAdminUsers = await User.countDocuments({
        role: 'admin',
        createdAt: { $gte: thirtyDaysAgo }
      });

      const recentUsers = await User.countDocuments({
        createdAt: { $gte: thirtyDaysAgo }
      });

      // Get admin users by creation date (last 12 months)
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

      const adminUsersByMonth = await User.aggregate([
        {
          $match: {
            role: 'admin',
            createdAt: { $gte: twelveMonthsAgo }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1 }
        }
      ]);

      console.log('✅ [DEBUG] Admin statistics retrieved:', {
        totalUsers,
        totalAdminUsers,
        totalModeratorUsers,
        totalRegularUsers,
        activeUsers,
        inactiveUsers,
        recentAdminUsers,
        recentUsers
      });

      res.json({
        success: true,
        statistics: {
          totalUsers,
          totalAdminUsers,
          totalModeratorUsers,
          totalRegularUsers,
          activeUsers,
          inactiveUsers,
          recentActivity: {
            adminUsers: recentAdminUsers,
            allUsers: recentUsers
          },
          adminUsersByMonth: adminUsersByMonth.map(item => ({
            year: item._id.year,
            month: item._id.month,
            count: item.count
          }))
        }
      });
    } catch (error) {
      console.error('❌ [DEBUG] Get admin statistics error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
}

module.exports = AdminController;
