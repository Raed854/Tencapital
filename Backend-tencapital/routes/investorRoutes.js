const express = require('express');
const router = express.Router();
const InvestorController = require('../controllers/investorController');
const { 
  validateCreateInvestor,
  validateUpdateInvestor
} = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { 
  investorListCache, 
  investorSearchCache, 
  statisticsCache,
  filterCache,
  invalidateInvestorCache 
} = require('../middleware/cache');

// Create new investor (REQUIRES AUTHENTICATION)
router.post('/', authenticateToken, validateCreateInvestor, invalidateInvestorCache, asyncHandler(InvestorController.createInvestor));

// Get all investors (PUBLIC - no auth required)
router.get('/', optionalAuth, investorListCache, asyncHandler(InvestorController.getAllInvestors));

// Search investors (PUBLIC - no auth required)
router.get('/search', optionalAuth, investorSearchCache, asyncHandler(InvestorController.searchInvestors));

// Get filter options for dropdowns (PUBLIC - no auth required)
router.get('/filters/options', filterCache, asyncHandler(InvestorController.getFilterOptions));

// Get total statistics (PUBLIC - no auth required)
router.get('/stats/total', statisticsCache, asyncHandler(InvestorController.getTotalStats));

// Get dashboard statistics (REQUIRES AUTHENTICATION)
router.get('/dashboard/stats', authenticateToken, asyncHandler(InvestorController.getDashboardStats));

// Advanced search with multiple filters (PUBLIC - no auth required)
router.get('/search/advanced', optionalAuth, investorSearchCache, asyncHandler(InvestorController.advancedSearch));

// Advanced filter API for investors (PUBLIC - no auth required)
router.get('/filter/advanced', optionalAuth, investorSearchCache, asyncHandler(InvestorController.advancedFilterInvestors));

// Unified filter API based on reference table data (PUBLIC - no auth required)
router.get('/filter/unified', optionalAuth, investorSearchCache, asyncHandler(InvestorController.unifiedFilterInvestors));

// Dynamic filter API for investors (PUBLIC - no auth required)
router.get('/filter', optionalAuth, investorSearchCache, asyncHandler(InvestorController.filterInvestors));

// Filter investors using saved filter criteria (PUBLIC - no auth required)
router.get('/filter/saved/:filterId', optionalAuth, asyncHandler(InvestorController.filterInvestorsBySavedFilter));

// Filter investors using saved filter with user access control (REQUIRES AUTHENTICATION)
router.get('/filter/saved/:filterId/user/:userId', authenticateToken, asyncHandler(InvestorController.filterInvestorsBySavedFilter));

// Get saved filters for a user (REQUIRES AUTHENTICATION)
router.get('/saved-filters/:userId', authenticateToken, asyncHandler(InvestorController.getSavedFilters));

// Get saved filters for a user (PUBLIC - for testing)
router.get('/public/saved-filters/:userId', asyncHandler(InvestorController.getSavedFilters));

// Get investor by ID (PUBLIC - no auth required)
router.get('/:investorId', optionalAuth, asyncHandler(InvestorController.getInvestorById));

// Get investors by user ID (PUBLIC - no auth required)
router.get('/user/:userId', optionalAuth, asyncHandler(InvestorController.getInvestorsByUserId));

// Update investor (REQUIRES AUTHENTICATION)
router.put('/:investorId', authenticateToken, validateUpdateInvestor, invalidateInvestorCache, asyncHandler(InvestorController.updateInvestor));

// Update investor status (REQUIRES AUTHENTICATION)
router.patch('/:investorId/status', authenticateToken, invalidateInvestorCache, asyncHandler(InvestorController.updateInvestorStatus));

// Create or update note for an investor (REQUIRES AUTHENTICATION)
router.put('/:investorId/note', authenticateToken, invalidateInvestorCache, asyncHandler(InvestorController.createOrUpdateNote));

// Delete investor (REQUIRES AUTHENTICATION)
router.delete('/:investorId', authenticateToken, invalidateInvestorCache, asyncHandler(InvestorController.deleteInvestor));

module.exports = router;
