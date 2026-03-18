const Investor = require('../models/Investor');
const Sector = require('../models/Sector');
const Location = require('../models/Location');
const Industry = require('../models/Industry');
const RevenueCriteria = require('../models/RevenueCriteria');
const { cache, CACHE_TTL, CacheKeys } = require('../utils/cache');

class ChartController {
  // Get chart data for sectors
  static async getSectorChartData(req, res) {
    try {
      console.log('📊 [DEBUG] Getting sector chart data');

      // Générer la clé de cache
      const cacheKey = CacheKeys.sectorChart();
      
      // Vérifier le cache d'abord
      const cachedData = cache.get(cacheKey);
      if (cachedData) {
        console.log('✅ Cache HIT: getSectorChartData');
        return res.json({
          success: true,
          chartData: cachedData,
          _cached: true,
          _timestamp: new Date().toISOString()
        });
      }

      console.log('🔄 Cache MISS: getSectorChartData - récupération depuis la DB');

      // Get all sectors
      const sectors = await Sector.find({ isActive: true }).sort({ name: 1 });
      
      // Get investor counts for each sector
      const sectorData = await Promise.all(
        sectors.map(async (sector) => {
          const count = await Investor.countDocuments({
            sector: { $regex: sector.name, $options: 'i' }
          });
          
          return {
            _id: sector._id,
            name: sector.name,
            description: sector.description,
            count: count,
            percentage: 0 // Will be calculated after getting total
          };
        })
      );

      // Calculate total investors
      const totalInvestors = await Investor.countDocuments();
      
      // Calculate percentages
      const sectorDataWithPercentages = sectorData.map(item => ({
        ...item,
        percentage: totalInvestors > 0 ? ((item.count / totalInvestors) * 100).toFixed(2) : 0
      }));

      // Sort by count descending
      sectorDataWithPercentages.sort((a, b) => b.count - a.count);

      const chartData = {
        type: 'sector',
        title: 'Distribution des Investisseurs par Secteur',
        totalInvestors,
        data: sectorDataWithPercentages
      };

      console.log('✅ [DEBUG] Sector chart data retrieved:', {
        sectorsCount: sectorDataWithPercentages.length,
        totalInvestors
      });

      // Mettre en cache le résultat
      cache.set(cacheKey, chartData, CACHE_TTL.CHART_DATA);

      res.json({
        success: true,
        chartData,
        _cached: false,
        _timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ [DEBUG] Get sector chart data error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Get chart data for locations
  static async getLocationChartData(req, res) {
    try {
      console.log('📊 [DEBUG] Getting location chart data');

      // Get all locations
      const locations = await Location.find({ isActive: true }).sort({ name: 1 });
      
      // Get investor counts for each location
      const locationData = await Promise.all(
        locations.map(async (location) => {
          const count = await Investor.countDocuments({
            location: { $regex: location.name, $options: 'i' }
          });
          
          return {
            _id: location._id,
            name: location.name,
            description: location.description,
            count: count,
            percentage: 0 // Will be calculated after getting total
          };
        })
      );

      // Calculate total investors
      const totalInvestors = await Investor.countDocuments();
      
      // Calculate percentages
      const locationDataWithPercentages = locationData.map(item => ({
        ...item,
        percentage: totalInvestors > 0 ? ((item.count / totalInvestors) * 100).toFixed(2) : 0
      }));

      // Sort by count descending
      locationDataWithPercentages.sort((a, b) => b.count - a.count);

      console.log('✅ [DEBUG] Location chart data retrieved:', {
        locationsCount: locationDataWithPercentages.length,
        totalInvestors
      });

      res.json({
        success: true,
        chartData: {
          type: 'location',
          title: 'Distribution des Investisseurs par Localisation',
          totalInvestors,
          data: locationDataWithPercentages
        }
      });
    } catch (error) {
      console.error('❌ [DEBUG] Get location chart data error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Get chart data for industries
  static async getIndustryChartData(req, res) {
    try {
      console.log('📊 [DEBUG] Getting industry chart data');

      // Get all industries
      const industries = await Industry.find({ isActive: true }).sort({ name: 1 });
      
      // Get investor counts for each industry
      const industryData = await Promise.all(
        industries.map(async (industry) => {
          const count = await Investor.countDocuments({
            industries: { $regex: industry.name, $options: 'i' }
          });
          
          return {
            _id: industry._id,
            name: industry.name,
            description: industry.description,
            count: count,
            percentage: 0 // Will be calculated after getting total
          };
        })
      );

      // Calculate total investors
      const totalInvestors = await Investor.countDocuments();
      
      // Calculate percentages
      const industryDataWithPercentages = industryData.map(item => ({
        ...item,
        percentage: totalInvestors > 0 ? ((item.count / totalInvestors) * 100).toFixed(2) : 0
      }));

      // Sort by count descending
      industryDataWithPercentages.sort((a, b) => b.count - a.count);

      console.log('✅ [DEBUG] Industry chart data retrieved:', {
        industriesCount: industryDataWithPercentages.length,
        totalInvestors
      });

      res.json({
        success: true,
        chartData: {
          type: 'industry',
          title: 'Distribution des Investisseurs par Industrie',
          totalInvestors,
          data: industryDataWithPercentages
        }
      });
    } catch (error) {
      console.error('❌ [DEBUG] Get industry chart data error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Get chart data for revenue criteria
  static async getRevenueCriteriaChartData(req, res) {
    try {
      console.log('📊 [DEBUG] Getting revenue criteria chart data');

      // Get all revenue criteria
      const revenueCriteria = await RevenueCriteria.find({ isActive: true }).sort({ name: 1 });
      
      // Get investor counts for each revenue criteria
      const revenueData = await Promise.all(
        revenueCriteria.map(async (criteria) => {
          const count = await Investor.countDocuments({
            revenueCriteria: { $regex: criteria.name, $options: 'i' }
          });
          
          return {
            _id: criteria._id,
            name: criteria.name,
            description: criteria.description,
            count: count,
            percentage: 0 // Will be calculated after getting total
          };
        })
      );

      // Calculate total investors
      const totalInvestors = await Investor.countDocuments();
      
      // Calculate percentages
      const revenueDataWithPercentages = revenueData.map(item => ({
        ...item,
        percentage: totalInvestors > 0 ? ((item.count / totalInvestors) * 100).toFixed(2) : 0
      }));

      // Sort by count descending
      revenueDataWithPercentages.sort((a, b) => b.count - a.count);

      console.log('✅ [DEBUG] Revenue criteria chart data retrieved:', {
        revenueCriteriaCount: revenueDataWithPercentages.length,
        totalInvestors
      });

      res.json({
        success: true,
        chartData: {
          type: 'revenueCriteria',
          title: 'Distribution des Investisseurs par Critères de Revenus',
          totalInvestors,
          data: revenueDataWithPercentages
        }
      });
    } catch (error) {
      console.error('❌ [DEBUG] Get revenue criteria chart data error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Get comprehensive chart data for all reference tables
  static async getAllChartsData(req, res) {
    try {
      console.log('📊 [DEBUG] Getting all charts data');

      // Get all sectors
      const sectors = await Sector.find({ isActive: true }).sort({ name: 1 });
      
      // Get all locations
      const locations = await Location.find({ isActive: true }).sort({ name: 1 });
      
      // Get all industries
      const industries = await Industry.find({ isActive: true }).sort({ name: 1 });
      
      // Get all revenue criteria
      const revenueCriteria = await RevenueCriteria.find({ isActive: true }).sort({ name: 1 });

      // Get investor counts for each reference table in parallel
      const [sectorData, locationData, industryData, revenueData] = await Promise.all([
        // Sector data
        Promise.all(
          sectors.map(async (sector) => {
            const count = await Investor.countDocuments({
              sector: { $regex: sector.name, $options: 'i' }
            });
            return {
              _id: sector._id,
              name: sector.name,
              description: sector.description,
              count: count,
              percentage: 0 // Will be calculated after getting total
            };
          })
        ),
        // Location data
        Promise.all(
          locations.map(async (location) => {
            const count = await Investor.countDocuments({
              location: { $regex: location.name, $options: 'i' }
            });
            return {
              _id: location._id,
              name: location.name,
              description: location.description,
              count: count,
              percentage: 0 // Will be calculated after getting total
            };
          })
        ),
        // Industry data
        Promise.all(
          industries.map(async (industry) => {
            const count = await Investor.countDocuments({
              industries: { $regex: industry.name, $options: 'i' }
            });
            return {
              _id: industry._id,
              name: industry.name,
              description: industry.description,
              count: count,
              percentage: 0 // Will be calculated after getting total
            };
          })
        ),
        // Revenue criteria data
        Promise.all(
          revenueCriteria.map(async (criteria) => {
            const count = await Investor.countDocuments({
              revenueCriteria: { $regex: criteria.name, $options: 'i' }
            });
            return {
              _id: criteria._id,
              name: criteria.name,
              description: criteria.description,
              count: count,
              percentage: 0 // Will be calculated after getting total
            };
          })
        )
      ]);

      // Get total investors count
      const totalInvestors = await Investor.countDocuments();
      
      // Calculate percentages and sort data
      const sectorDataWithPercentages = sectorData.map(item => ({
        ...item,
        percentage: totalInvestors > 0 ? ((item.count / totalInvestors) * 100).toFixed(2) : 0
      })).sort((a, b) => b.count - a.count);

      const locationDataWithPercentages = locationData.map(item => ({
        ...item,
        percentage: totalInvestors > 0 ? ((item.count / totalInvestors) * 100).toFixed(2) : 0
      })).sort((a, b) => b.count - a.count);

      const industryDataWithPercentages = industryData.map(item => ({
        ...item,
        percentage: totalInvestors > 0 ? ((item.count / totalInvestors) * 100).toFixed(2) : 0
      })).sort((a, b) => b.count - a.count);

      const revenueDataWithPercentages = revenueData.map(item => ({
        ...item,
        percentage: totalInvestors > 0 ? ((item.count / totalInvestors) * 100).toFixed(2) : 0
      })).sort((a, b) => b.count - a.count);

      console.log('✅ [DEBUG] All charts data retrieved:', {
        totalInvestors,
        sectorsCount: sectorDataWithPercentages.length,
        locationsCount: locationDataWithPercentages.length,
        industriesCount: industryDataWithPercentages.length,
        revenueCriteriaCount: revenueDataWithPercentages.length
      });

      res.json({
        success: true,
        chartsData: {
          totalInvestors,
          sectors: {
            type: 'sector',
            title: 'Distribution des Investisseurs par Secteur',
            data: sectorDataWithPercentages
          },
          locations: {
            type: 'location',
            title: 'Distribution des Investisseurs par Localisation',
            data: locationDataWithPercentages
          },
          industries: {
            type: 'industry',
            title: 'Distribution des Investisseurs par Industrie',
            data: industryDataWithPercentages
          },
          revenueCriteria: {
            type: 'revenueCriteria',
            title: 'Distribution des Investisseurs par Critères de Revenus',
            data: revenueDataWithPercentages
          }
        }
      });
    } catch (error) {
      console.error('❌ [DEBUG] Get all charts data error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Get top N items for each reference table
  static async getTopItemsChartData(req, res) {
    try {
      const { limit = 10 } = req.query;
      const limitNum = parseInt(limit);

      console.log('📊 [DEBUG] Getting top items chart data:', { limit: limitNum });

      // Get top sectors
      const topSectors = await Investor.aggregate([
        { $match: { sector: { $exists: true, $ne: null, $ne: '' } } },
        { $group: { _id: '$sector', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: limitNum }
      ]);

      // Get top locations
      const topLocations = await Investor.aggregate([
        { $match: { location: { $exists: true, $ne: null, $ne: '' } } },
        { $group: { _id: '$location', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: limitNum }
      ]);

      // Get top industries
      const topIndustries = await Investor.aggregate([
        { $match: { industries: { $exists: true, $ne: null, $ne: '' } } },
        { $group: { _id: '$industries', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: limitNum }
      ]);

      // Get top revenue criteria
      const topRevenueCriteria = await Investor.aggregate([
        { $match: { revenueCriteria: { $exists: true, $ne: null, $ne: '' } } },
        { $group: { _id: '$revenueCriteria', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: limitNum }
      ]);

      const totalInvestors = await Investor.countDocuments();

      console.log('✅ [DEBUG] Top items chart data retrieved:', {
        totalInvestors,
        topSectorsCount: topSectors.length,
        topLocationsCount: topLocations.length,
        topIndustriesCount: topIndustries.length,
        topRevenueCriteriaCount: topRevenueCriteria.length
      });

      res.json({
        success: true,
        chartsData: {
          totalInvestors,
          topSectors: {
            type: 'sector',
            title: `Top ${limitNum} Secteurs`,
            data: topSectors.map(item => ({
              name: item._id,
              count: item.count,
              percentage: totalInvestors > 0 ? ((item.count / totalInvestors) * 100).toFixed(2) : 0
            }))
          },
          topLocations: {
            type: 'location',
            title: `Top ${limitNum} Localisations`,
            data: topLocations.map(item => ({
              name: item._id,
              count: item.count,
              percentage: totalInvestors > 0 ? ((item.count / totalInvestors) * 100).toFixed(2) : 0
            }))
          },
          topIndustries: {
            type: 'industry',
            title: `Top ${limitNum} Industries`,
            data: topIndustries.map(item => ({
              name: item._id,
              count: item.count,
              percentage: totalInvestors > 0 ? ((item.count / totalInvestors) * 100).toFixed(2) : 0
            }))
          },
          topRevenueCriteria: {
            type: 'revenueCriteria',
            title: `Top ${limitNum} Critères de Revenus`,
            data: topRevenueCriteria.map(item => ({
              name: item._id,
              count: item.count,
              percentage: totalInvestors > 0 ? ((item.count / totalInvestors) * 100).toFixed(2) : 0
            }))
          }
        }
      });
    } catch (error) {
      console.error('❌ [DEBUG] Get top items chart data error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Get chart data with custom filters
  static async getFilteredChartData(req, res) {
    try {
      const {
        sectorIds = [],
        locationIds = [],
        industryIds = [],
        revenueCriteriaIds = [],
        investorType,
        investmentStage,
        status,
        searchTerm
      } = req.query;

      console.log('📊 [DEBUG] Getting filtered chart data:', {
        sectorIds,
        locationIds,
        industryIds,
        revenueCriteriaIds,
        investorType,
        investmentStage,
        status,
        searchTerm
      });

      // Import reference models
      const Sector = require('../models/Sector');
      const Location = require('../models/Location');
      const Industry = require('../models/Industry');
      const RevenueCriteria = require('../models/RevenueCriteria');

      // Get reference data
      const [sectors, locations, industries, revenueCriteria] = await Promise.all([
        sectorIds.length > 0 ? Sector.find({ _id: { $in: sectorIds } }) : [],
        locationIds.length > 0 ? Location.find({ _id: { $in: locationIds } }) : [],
        industryIds.length > 0 ? Industry.find({ _id: { $in: industryIds } }) : [],
        revenueCriteriaIds.length > 0 ? RevenueCriteria.find({ _id: { $in: revenueCriteriaIds } }) : []
      ]);

      // Build filter object
      const filter = {};

      // Filter by sector names (from reference table)
      if (sectors.length > 0) {
        const sectorNames = sectors.map(sector => sector.name);
        filter.sector = { $in: sectorNames.map(name => new RegExp(name, 'i')) };
      }

      // Filter by location names (from reference table)
      if (locations.length > 0) {
        const locationNames = locations.map(location => location.name);
        filter.location = { $in: locationNames.map(name => new RegExp(name, 'i')) };
      }

      // Filter by industry names (from reference table)
      if (industries.length > 0) {
        const industryNames = industries.map(industry => industry.name);
        filter.industries = { $in: industryNames.map(name => new RegExp(name, 'i')) };
      }

      // Filter by revenue criteria names (from reference table)
      if (revenueCriteria.length > 0) {
        const revenueNames = revenueCriteria.map(rc => rc.name);
        filter.revenueCriteria = { $in: revenueNames.map(name => new RegExp(name, 'i')) };
      }

      // Additional filters
      if (investorType) {
        filter.investorType = { $regex: investorType, $options: 'i' };
      }

      if (investmentStage) {
        filter.investmentStage = { $regex: investmentStage, $options: 'i' };
      }

      if (status !== undefined) {
        filter.status = parseInt(status);
      }

      // Text search
      if (searchTerm) {
        filter.$or = [
          { organizationPersonName: { $regex: searchTerm, $options: 'i' } },
          { firstName: { $regex: searchTerm, $options: 'i' } },
          { lastName: { $regex: searchTerm, $options: 'i' } },
          { email: { $regex: searchTerm, $options: 'i' } },
          { description: { $regex: searchTerm, $options: 'i' } }
        ];
      }

      console.log('🔍 [DEBUG] Filter for chart data:', filter);

      // Get filtered investor counts for each reference table
      const [filteredSectors, filteredLocations, filteredIndustries, filteredRevenueCriteria] = await Promise.all([
        // Filtered sectors
        Investor.aggregate([
          { $match: filter },
          { $match: { sector: { $exists: true, $ne: null, $ne: '' } } },
          { $group: { _id: '$sector', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]),
        // Filtered locations
        Investor.aggregate([
          { $match: filter },
          { $match: { location: { $exists: true, $ne: null, $ne: '' } } },
          { $group: { _id: '$location', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]),
        // Filtered industries
        Investor.aggregate([
          { $match: filter },
          { $match: { industries: { $exists: true, $ne: null, $ne: '' } } },
          { $group: { _id: '$industries', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]),
        // Filtered revenue criteria
        Investor.aggregate([
          { $match: filter },
          { $match: { revenueCriteria: { $exists: true, $ne: null, $ne: '' } } },
          { $group: { _id: '$revenueCriteria', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ])
      ]);

      const totalFilteredInvestors = await Investor.countDocuments(filter);

      console.log('✅ [DEBUG] Filtered chart data retrieved:', {
        totalFilteredInvestors,
        filteredSectorsCount: filteredSectors.length,
        filteredLocationsCount: filteredLocations.length,
        filteredIndustriesCount: filteredIndustries.length,
        filteredRevenueCriteriaCount: filteredRevenueCriteria.length
      });

      res.json({
        success: true,
        chartsData: {
          totalInvestors: totalFilteredInvestors,
          appliedFilters: {
            sectorIds: sectorIds.length > 0 ? sectorIds : null,
            locationIds: locationIds.length > 0 ? locationIds : null,
            industryIds: industryIds.length > 0 ? industryIds : null,
            revenueCriteriaIds: revenueCriteriaIds.length > 0 ? revenueCriteriaIds : null,
            investorType: investorType || null,
            investmentStage: investmentStage || null,
            status: status !== undefined ? parseInt(status) : null,
            searchTerm: searchTerm || null
          },
          sectors: {
            type: 'sector',
            title: 'Secteurs (Filtrés)',
            data: filteredSectors.map(item => ({
              name: item._id,
              count: item.count,
              percentage: totalFilteredInvestors > 0 ? ((item.count / totalFilteredInvestors) * 100).toFixed(2) : 0
            }))
          },
          locations: {
            type: 'location',
            title: 'Localisations (Filtrées)',
            data: filteredLocations.map(item => ({
              name: item._id,
              count: item.count,
              percentage: totalFilteredInvestors > 0 ? ((item.count / totalFilteredInvestors) * 100).toFixed(2) : 0
            }))
          },
          industries: {
            type: 'industry',
            title: 'Industries (Filtrées)',
            data: filteredIndustries.map(item => ({
              name: item._id,
              count: item.count,
              percentage: totalFilteredInvestors > 0 ? ((item.count / totalFilteredInvestors) * 100).toFixed(2) : 0
            }))
          },
          revenueCriteria: {
            type: 'revenueCriteria',
            title: 'Critères de Revenus (Filtrés)',
            data: filteredRevenueCriteria.map(item => ({
              name: item._id,
              count: item.count,
              percentage: totalFilteredInvestors > 0 ? ((item.count / totalFilteredInvestors) * 100).toFixed(2) : 0
            }))
          }
        }
      });
    } catch (error) {
      console.error('❌ [DEBUG] Get filtered chart data error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
}

module.exports = ChartController;
