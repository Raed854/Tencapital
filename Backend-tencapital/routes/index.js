const express = require('express');
const router = express.Router();

// Import route modules
const userRoutes = require('./userRoutes');
const investorRoutes = require('./investorRoutes');
const excelRoutes = require('./excelRoutes');

// Import reference routes
const locationRoutes = require('./locationRoutes');
const investorTypeRoutes = require('./investorTypeRoutes');
const sectorRoutes = require('./sectorRoutes');
const industryRoutes = require('./industryRoutes');
const investmentStageRoutes = require('./investmentStageRoutes');
const revenueCriteriaRoutes = require('./revenueCriteriaRoutes');

// Import enregistrer filtre routes
const enregistrerFiltreRoutes = require('./enregistrerFiltreRoutes');

// Import chart routes
const chartRoutes = require('./chartRoutes');

// Import admin routes
const adminRoutes = require('./adminRoutes');

// Import cache routes
const cacheRoutes = require('./cacheRoutes');


// Health check endpoint
router.get('/', (req, res) => {
  res.json({ 
    message: 'InvestorMatch API is running!',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// API routes
router.use('/api/users', userRoutes);
router.use('/api/investors', investorRoutes);
router.use('/api/excel', excelRoutes);

// Reference data routes
router.use('/api/locations', locationRoutes);
router.use('/api/investor-types', investorTypeRoutes);
router.use('/api/sectors', sectorRoutes);
router.use('/api/industries', industryRoutes);
router.use('/api/investment-stages', investmentStageRoutes);
router.use('/api/revenue-criteria', revenueCriteriaRoutes);

// Enregistrer filtre routes
router.use('/api/enregistrer-filtres', enregistrerFiltreRoutes);

// Chart routes
router.use('/api/charts', chartRoutes);

// Admin routes
router.use('/api/admin', adminRoutes);

// Cache management routes
router.use('/api/cache', cacheRoutes);


// API documentation endpoint
router.get('/api', (req, res) => {
  res.json({
    message: 'InvestorMatch API Documentation',
    version: '1.0.0',
    endpoints: {
      users: {
        'POST /api/users/register': 'Register a new user',
        'POST /api/users/check-email': 'Check if email exists',
        'POST /api/users/login': 'User login',
        'POST /api/users/forgot-password/verify-email': 'Step 1: Verify email and get security question',
        'POST /api/users/forgot-password/verify-answer': 'Step 2: Verify security answer',
        'POST /api/users/forgot-password/reset': 'Step 3: Reset password',
        'POST /api/users/forgot-password/reset-password': 'Step 3: Reset password (alternative endpoint)',
        'GET /api/users/profile/:userId': 'Get user profile',
        'GET /api/users/public/:userId': 'Get user by ID (public - no authentication required)',
        'PUT /api/users/public/:userId': 'Update user (public - no authentication required)',
        'PUT /api/users/public/profile/:userId': 'Update user profile (public - no authentication required)',
        'PUT /api/users/public/:userId/update-password-security': 'Update password and security (public - no authentication required)',
        'PUT /api/users/public/:userId/update-security-question': 'Update security question (public - no authentication required)',
        'PUT /api/users/public/:userId/change-password': 'Change password (public - no authentication required)',
        'GET /api/users/:userId/all-data': 'Get all user data for modification (comprehensive)',
        'PUT /api/users/profile/:userId': 'Update user profile',
        'PUT /api/users/:userId/update-password-security': 'Update password and security question',
        'PUT /api/users/:userId/update-security-question': 'Update security question only',
        'PUT /api/users/:userId/status': 'Update user status (activate/deactivate)',
        'DELETE /api/users/account/:userId': 'Delete user account'
      },
      investors: {
        'POST /api/investors': 'Create new investor',
        'GET /api/investors': 'Get all investors',
        'GET /api/investors/stats/total': 'Get total statistics (total investors, approved investors, locations covered)',
        'GET /api/investors/search': 'Search investors with filters',
        'GET /api/investors/filter/saved/:filterId': 'Filter investors using saved filter (public)',
        'GET /api/investors/filter/saved/:filterId/user/:userId': 'Filter investors using saved filter with user access control',
        'GET /api/investors/saved-filters/:userId': 'Get saved filters for a user',
        'GET /api/investors/:investorId': 'Get investor by ID',
        'GET /api/investors/user/:userId': 'Get investors by user ID',
        'PUT /api/investors/:investorId': 'Update investor',
        'DELETE /api/investors/:investorId': 'Delete investor'
      },
      excel: {
        'POST /api/excel/upload': 'Upload and process Excel file',
        'POST /api/excel/preview': 'Preview Excel file data',
        'POST /api/excel/validate': 'Validate Excel data',
        'POST /api/excel/map': 'Map Excel data with AI',
        'GET /api/excel/mapping-info': 'Get mapping information',
        'GET /api/excel/user/:userId': 'Get user Excel data',
        'PUT /api/excel/mark-processed': 'Mark data as processed'
      },
      reference: {
        locations: {
          'POST /api/locations': 'Create new location',
          'GET /api/locations': 'Get all locations',
          'GET /api/locations/search': 'Search locations',
          'GET /api/locations/:id': 'Get location by ID',
          'PUT /api/locations/:id': 'Update location',
          'DELETE /api/locations/:id': 'Delete location'
        },
        investorTypes: {
          'POST /api/investor-types': 'Create new investor type',
          'GET /api/investor-types': 'Get all investor types',
          'GET /api/investor-types/search': 'Search investor types',
          'GET /api/investor-types/:id': 'Get investor type by ID',
          'PUT /api/investor-types/:id': 'Update investor type',
          'DELETE /api/investor-types/:id': 'Delete investor type'
        },
        sectors: {
          'POST /api/sectors': 'Create new sector',
          'GET /api/sectors': 'Get all sectors',
          'GET /api/sectors/search': 'Search sectors',
          'GET /api/sectors/:id': 'Get sector by ID',
          'PUT /api/sectors/:id': 'Update sector',
          'DELETE /api/sectors/:id': 'Delete sector'
        },
        industries: {
          'POST /api/industries': 'Create new industry',
          'GET /api/industries': 'Get all industries',
          'GET /api/industries/search': 'Search industries',
          'GET /api/industries/:id': 'Get industry by ID',
          'PUT /api/industries/:id': 'Update industry',
          'DELETE /api/industries/:id': 'Delete industry'
        },
        investmentStages: {
          'POST /api/investment-stages': 'Create new investment stage',
          'GET /api/investment-stages': 'Get all investment stages',
          'GET /api/investment-stages/search': 'Search investment stages',
          'GET /api/investment-stages/:id': 'Get investment stage by ID',
          'PUT /api/investment-stages/:id': 'Update investment stage',
          'DELETE /api/investment-stages/:id': 'Delete investment stage'
        },
        revenueCriteria: {
          'POST /api/revenue-criteria': 'Create new revenue criteria',
          'GET /api/revenue-criteria': 'Get all revenue criteria',
          'GET /api/revenue-criteria/search': 'Search revenue criteria',
          'GET /api/revenue-criteria/:id': 'Get revenue criteria by ID',
          'PUT /api/revenue-criteria/:id': 'Update revenue criteria',
          'DELETE /api/revenue-criteria/:id': 'Delete revenue criteria'
        }
      },
      enregistrerFiltres: {
        'GET /api/enregistrer-filtres/': 'Get all enregistrer filtres',
        'GET /api/enregistrer-filtres/stats': 'Get enregistrer filtre statistics',
        'GET /api/enregistrer-filtres/search': 'Search enregistrer filtres',
        'GET /api/enregistrer-filtres/user/:userId': 'Get enregistrer filtres by user',
        'GET /api/enregistrer-filtres/:id': 'Get enregistrer filtre by ID',
        'POST /api/enregistrer-filtres/': 'Create new enregistrer filtre',
        'POST /api/enregistrer-filtres/bulk': 'Bulk operations on enregistrer filtres',
        'PUT /api/enregistrer-filtres/:id': 'Update enregistrer filtre',
        'PUT /api/enregistrer-filtres/:id/active': 'Toggle active status',
        'DELETE /api/enregistrer-filtres/:id': 'Delete enregistrer filtre'
      },
      charts: {
        'GET /api/charts/sectors': 'Get chart data for sectors',
        'GET /api/charts/locations': 'Get chart data for locations',
        'GET /api/charts/industries': 'Get chart data for industries',
        'GET /api/charts/revenue-criteria': 'Get chart data for revenue criteria',
        'GET /api/charts/all': 'Get comprehensive chart data for all reference tables',
        'GET /api/charts/top': 'Get top N items for each reference table',
        'GET /api/charts/filtered': 'Get chart data with custom filters'
      },
      admin: {
        'POST /api/admin/create-admin': 'Create a new admin user (public - for initial setup)',
        'POST /api/admin/create-user-with-role': 'Create user with specific role (public - for initial setup)',
        'GET /api/admin/admin-users': 'Get all admin users (admin only)',
        'PUT /api/admin/promote-to-admin/:userId': 'Promote existing user to admin (admin only)',
        'PUT /api/admin/demote-to-user/:userId': 'Demote admin to regular user (admin only)',
        'GET /api/admin/statistics': 'Get admin statistics (admin only)'
      },
      cache: {
        'GET /api/cache/stats': 'Get cache statistics (admin only)',
        'GET /api/cache/keys': 'Get all cache keys with pagination (admin only)',
        'GET /api/cache/inspect/:key': 'Inspect specific cache key (admin only)',
        'GET /api/cache/health': 'Check cache system health (admin only)',
        'DELETE /api/cache/clear': 'Clear cache (optionally by pattern) (admin only)',
        'DELETE /api/cache/invalidate/:pattern': 'Invalidate cache by pattern (admin only)',
        'POST /api/cache/warmup': 'Preload cache with frequently used data (admin only)'
      }
    }
  });
});

module.exports = router;
