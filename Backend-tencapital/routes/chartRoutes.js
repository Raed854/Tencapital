const express = require('express');
const router = express.Router();
const ChartController = require('../controllers/chartController');
const { asyncHandler } = require('../middleware/errorHandler');
const { optionalAuth } = require('../middleware/auth');
const { chartDataCache } = require('../middleware/cache');

// Get chart data for sectors
router.get('/sectors', optionalAuth, chartDataCache, asyncHandler(ChartController.getSectorChartData));

// Get chart data for locations
router.get('/locations', optionalAuth, chartDataCache, asyncHandler(ChartController.getLocationChartData));

// Get chart data for industries
router.get('/industries', optionalAuth, chartDataCache, asyncHandler(ChartController.getIndustryChartData));

// Get chart data for revenue criteria
router.get('/revenue-criteria', optionalAuth, chartDataCache, asyncHandler(ChartController.getRevenueCriteriaChartData));

// Get comprehensive chart data for all reference tables
router.get('/all', optionalAuth, chartDataCache, asyncHandler(ChartController.getAllChartsData));

// Get top N items for each reference table
router.get('/top', optionalAuth, chartDataCache, asyncHandler(ChartController.getTopItemsChartData));

// Get chart data with custom filters
router.get('/filtered', optionalAuth, chartDataCache, asyncHandler(ChartController.getFilteredChartData));

module.exports = router;
