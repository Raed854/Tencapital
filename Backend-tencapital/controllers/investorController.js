const Investor = require('../models/Investor');
const EnregistrerFiltre = require('../models/EnregistrerFiltre');
const { cache, CACHE_TTL, CacheKeys } = require('../utils/cache');

class InvestorController {
  // Create a new investor
  static async createInvestor(req, res) {
    try {
      const {
        investorType,
        sector,
        industries,
        investmentStage,
        revenueCriteria,
        organizationPersonName,
        firstName,
        lastName,
        email,
        description,
        organizationPersonNameFirstNameLastName,
        location,
        phoneNumber,
        website,
        linkedin,
        note
      } = req.body;

      // Get user ID from request (assuming it's passed in the request)
      const userId = req.userId || req.body.userId;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      // Convertir userId en ObjectId si c'est une chaîne simple
      let validUserId = userId;
      if (typeof userId === 'string' && userId.length !== 24) {
        // Si ce n'est pas un ObjectId valide, créer un ObjectId temporaire
        const mongoose = require('mongoose');
        validUserId = new mongoose.Types.ObjectId();
        console.log('⚠️ UserId non-ObjectId détecté, utilisation d\'un ObjectId temporaire:', validUserId);
      }

      const investor = await Investor.createInvestor({
        investorType,
        sector,
        industries,
        investmentStage,
        revenueCriteria,
        organizationPersonName,
        firstName,
        lastName,
        email,
        description,
        organizationPersonNameFirstNameLastName,
        location,
        phoneNumber,
        website,
        linkedin,
        note,
        userId: validUserId
      });

      // Invalider le cache après création
      cache.deletePattern('investors:');
      cache.deletePattern('stats:');
      cache.deletePattern('chart:');
      cache.deletePattern('filter:');
      console.log('🗑️ Cache invalidé après création d\'investisseur');

      res.status(201).json({
        success: true,
        message: 'Investor created successfully',
        investorId: investor._id
      });
    } catch (error) {
      console.error('Create investor error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get all investors
  static async getAllInvestors(req, res) {
    try {
      const { withUsers = false } = req.query;
      
      // Générer la clé de cache
      const cacheKey = CacheKeys.allInvestors(withUsers);
      
      // Vérifier le cache d'abord
      const cachedData = cache.get(cacheKey);
      if (cachedData) {
        console.log('✅ Cache HIT: getAllInvestors');
        return res.json({
          success: true,
          investors: cachedData,
          _cached: true,
          _timestamp: new Date().toISOString()
        });
      }

      console.log('🔄 Cache MISS: getAllInvestors - récupération depuis la DB');
      
      let investors;
      if (withUsers === 'true') {
        investors = await Investor.findAllWithUsers();
      } else {
        investors = await Investor.findAll();
      }

      // Mettre en cache le résultat
      cache.set(cacheKey, investors, CACHE_TTL.INVESTOR_LIST);

      res.json({
        success: true,
        investors: investors,
        _cached: false,
        _timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Get all investors error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get investor by ID
  static async getInvestorById(req, res) {
    try {
      const { investorId } = req.params;

      // Générer la clé de cache
      const cacheKey = CacheKeys.investorById(investorId);
      
      // Vérifier le cache d'abord
      const cachedData = cache.get(cacheKey);
      if (cachedData) {
        console.log('✅ Cache HIT: getInvestorById');
        return res.json({
          success: true,
          investor: cachedData,
          _cached: true,
          _timestamp: new Date().toISOString()
        });
      }

      console.log('🔄 Cache MISS: getInvestorById - récupération depuis la DB');

      const investor = await Investor.findById(investorId);
      if (!investor) {
        return res.status(404).json({
          success: false,
          message: 'Investor not found'
        });
      }

      const investorData = investor.toJSON();
      
      // Mettre en cache le résultat
      cache.set(cacheKey, investorData, CACHE_TTL.USER_DATA);

      res.json({
        success: true,
        investor: investorData,
        _cached: false,
        _timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Get investor error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get investors by user ID
  static async getInvestorsByUserId(req, res) {
    try {
      const { userId } = req.params;

      const investors = await Investor.findByUserId(userId);

      res.json({
        success: true,
        investors: investors
      });
    } catch (error) {
      console.error('Get investors by user error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Update investor
  static async updateInvestor(req, res) {
    try {
      const { investorId } = req.params;
      const updateData = req.body;

      console.log('🔄 [DEBUG] Update investor request:', {
        investorId,
        updateData,
        bodyKeys: Object.keys(req.body)
      });

      const investor = await Investor.findById(investorId);
      if (!investor) {
        return res.status(404).json({
          success: false,
          message: 'Investor not found'
        });
      }

      await investor.updateInvestor(updateData);

      // Get updated investor data
      const updatedInvestor = await Investor.findById(investorId);

      res.json({
        success: true,
        message: 'Investor updated successfully',
        investor: {
          _id: updatedInvestor._id,
          status: updatedInvestor.status,
          statusText: updatedInvestor.status === 0 ? 'pending' : updatedInvestor.status === 1 ? 'active' : 'inactive',
          updatedAt: updatedInvestor.updatedAt
        }
      });
    } catch (error) {
      console.error('❌ [DEBUG] Update investor error:', error);
      console.error('❌ [DEBUG] Error message:', error.message);
      console.error('❌ [DEBUG] Error stack:', error.stack);
      
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Update investor status (toggle between 0 and 1)
  static async updateInvestorStatus(req, res) {
    try {
      const { investorId } = req.params;

      const investor = await Investor.findById(investorId);
      if (!investor) {
        return res.status(404).json({
          success: false,
          message: 'Investor not found'
        });
      }

      // Toggle status between 0 and 1
      const newStatus = investor.status === 0 ? 1 : 0;
      investor.status = newStatus;
      await investor.save();

      // Get status text for response
      const statusText = newStatus === 0 ? 'pending' : 'active';

      res.json({
        success: true,
        message: `Investor status toggled to ${statusText}`,
        investor: {
          _id: investor._id,
          status: newStatus,
          statusText: statusText,
          previousStatus: investor.status === 0 ? 1 : 0,
          previousStatusText: investor.status === 0 ? 'active' : 'pending',
          updatedAt: investor.updatedAt
        }
      });
    } catch (error) {
      console.error('Update investor status error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Delete investor
  static async deleteInvestor(req, res) {
    try {
      const { investorId } = req.params;

      const investor = await Investor.findById(investorId);
      if (!investor) {
        return res.status(404).json({
          success: false,
          message: 'Investor not found'
        });
      }

      await investor.deleteInvestor();

      res.json({
        success: true,
        message: 'Investor deleted successfully'
      });
    } catch (error) {
      console.error('Delete investor error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Create or update note for an investor
  static async createOrUpdateNote(req, res) {
    try {
      const { investorId } = req.params;
      const { note } = req.body;

      console.log('📝 [DEBUG] Create/Update note request:', {
        investorId,
        note: note ? note.substring(0, 50) + '...' : 'empty'
      });

      if (note === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Note is required'
        });
      }

      const investor = await Investor.findById(investorId);
      if (!investor) {
        return res.status(404).json({
          success: false,
          message: 'Investor not found'
        });
      }

      // Update the note
      investor.note = note || '';
      await investor.save();

      // Invalider le cache après mise à jour
      cache.deletePattern('investors:');
      cache.deletePattern(`investor:${investorId}:`);
      console.log('🗑️ Cache invalidé après mise à jour de la note');

      console.log('✅ [DEBUG] Note updated successfully');

      res.json({
        success: true,
        message: 'Note updated successfully',
        investor: {
          _id: investor._id,
          note: investor.note,
          updatedAt: investor.updatedAt
        }
      });
    } catch (error) {
      console.error('❌ [DEBUG] Create/Update note error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Search investors
  static async searchInvestors(req, res) {
    try {
      const {
        investorType,
        sector,
        industries,
        investmentStage,
        location,
        revenueCriteria,
        status,
        limit = 50,
        offset = 0
      } = req.query;

      const searchCriteria = {
        investorType,
        sector,
        industries,
        investmentStage,
        location,
        revenueCriteria,
        status,
        limit: parseInt(limit),
        offset: parseInt(offset)
      };

      const investors = await Investor.search(searchCriteria);

      res.json({
        success: true,
        investors: investors,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          count: investors.length
        }
      });
    } catch (error) {
      console.error('Search investors error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get filter options for dropdowns
  static async getFilterOptions(req, res) {
    try {
      console.log('🔄 [DEBUG] Getting filter options');

      // Générer la clé de cache
      const cacheKey = CacheKeys.filterOptions();
      
      // Vérifier le cache d'abord
      const cachedData = cache.get(cacheKey);
      if (cachedData) {
        console.log('✅ Cache HIT: getFilterOptions');
        return res.json({
          success: true,
          filterOptions: cachedData,
          _cached: true,
          _timestamp: new Date().toISOString()
        });
      }

      console.log('🔄 Cache MISS: getFilterOptions - récupération depuis la DB');

      // Get unique values for each filter field
      const [
        sectors,
        investorTypes,
        revenueCriteria,
        locations,
        investmentStages,
        industries
      ] = await Promise.all([
        Investor.distinct('sector', { sector: { $exists: true, $ne: null, $ne: '' } }),
        Investor.distinct('investorType', { investorType: { $exists: true, $ne: null, $ne: '' } }),
        Investor.distinct('revenueCriteria', { revenueCriteria: { $exists: true, $ne: null, $ne: '' } }),
        Investor.distinct('location', { location: { $exists: true, $ne: null, $ne: '' } }),
        Investor.distinct('investmentStage', { investmentStage: { $exists: true, $ne: null, $ne: '' } }),
        Investor.distinct('industries', { industries: { $exists: true, $ne: null, $ne: '' } })
      ]);

      // Sort arrays alphabetically
      const sortedOptions = {
        sectors: sectors.sort(),
        investorTypes: investorTypes.sort(),
        revenueCriteria: revenueCriteria.sort(),
        locations: locations.sort(),
        investmentStages: investmentStages.sort(),
        industries: industries.sort()
      };

      console.log('✅ [DEBUG] Filter options retrieved:', {
        sectorsCount: sortedOptions.sectors.length,
        investorTypesCount: sortedOptions.investorTypes.length,
        revenueCriteriaCount: sortedOptions.revenueCriteria.length,
        locationsCount: sortedOptions.locations.length,
        investmentStagesCount: sortedOptions.investmentStages.length,
        industriesCount: sortedOptions.industries.length
      });

      // Mettre en cache le résultat
      cache.set(cacheKey, sortedOptions, CACHE_TTL.FILTER_OPTIONS);

      res.json({
        success: true,
        filterOptions: sortedOptions,
        _cached: false,
        _timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ [DEBUG] Get filter options error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get total statistics (PUBLIC API)
  static async getTotalStats(req, res) {
    try {
      console.log('📊 [DEBUG] Getting total statistics');

      // Générer la clé de cache
      const cacheKey = CacheKeys.totalStats();
      
      // Vérifier le cache d'abord
      const cachedData = cache.get(cacheKey);
      if (cachedData) {
        console.log('✅ Cache HIT: getTotalStats');
        return res.json({
          success: true,
          message: 'Total statistics retrieved successfully',
          statistics: cachedData,
          _cached: true,
          _timestamp: new Date().toISOString()
        });
      }

      console.log('🔄 Cache MISS: getTotalStats - récupération depuis la DB');

      // Get total investors count
      const totalInvestors = await Investor.countDocuments();

      // Get approved investors count (status = 1)
      const approvedInvestors = await Investor.countDocuments({ status: 1 });

      // Get unique locations count
      const uniqueLocations = await Investor.distinct('location', {
        location: { $exists: true, $ne: null, $ne: '' }
      });

      // Get locations with counts
      const locationsWithCounts = await Investor.aggregate([
        { $match: { location: { $exists: true, $ne: null, $ne: '' } } },
        { $group: { _id: '$location', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 } // Top 10 locations
      ]);

      // Get status breakdown
      const statusBreakdown = await Investor.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      // Format status breakdown
      const formattedStatusBreakdown = statusBreakdown.map(item => ({
        status: item._id === 0 ? 'Pending' : item._id === 1 ? 'Active' : 'Inactive',
        count: item.count,
        percentage: totalInvestors > 0 ? ((item.count / totalInvestors) * 100).toFixed(1) : 0
      }));

      const statistics = {
        totalInvestors,
        approvedInvestors,
        pendingInvestors: totalInvestors - approvedInvestors,
        uniqueLocationsCount: uniqueLocations.length,
        topLocations: locationsWithCounts.map(item => ({
          location: item._id,
          count: item.count,
          percentage: totalInvestors > 0 ? ((item.count / totalInvestors) * 100).toFixed(1) : 0
        })),
        statusBreakdown: formattedStatusBreakdown,
        approvalRate: totalInvestors > 0 ? ((approvedInvestors / totalInvestors) * 100).toFixed(1) : 0
      };

      console.log('✅ [DEBUG] Total statistics retrieved:', {
        totalInvestors,
        approvedInvestors,
        uniqueLocationsCount: uniqueLocations.length
      });

      // Mettre en cache le résultat
      cache.set(cacheKey, statistics, CACHE_TTL.STATISTICS);

      res.json({
        success: true,
        message: 'Total statistics retrieved successfully',
        statistics,
        _cached: false,
        _timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ [DEBUG] Get total statistics error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get statistics and counts for dashboard
  static async getDashboardStats(req, res) {
    try {
      console.log('🔄 [DEBUG] Getting dashboard statistics');

      // Get counts for each category with their values
      const [
        locationStats,
        investorTypeStats,
        sectorStats,
        industriesStats,
        investmentStageStats,
        revenueCriteriaStats,
        statusStats
      ] = await Promise.all([
        // Location statistics
        Investor.aggregate([
          { $match: { location: { $exists: true, $ne: null, $ne: '' } } },
          { $group: { _id: '$location', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]),
        // Investor Type statistics
        Investor.aggregate([
          { $match: { investorType: { $exists: true, $ne: null, $ne: '' } } },
          { $group: { _id: '$investorType', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]),
        // Sector statistics
        Investor.aggregate([
          { $match: { sector: { $exists: true, $ne: null, $ne: '' } } },
          { $group: { _id: '$sector', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]),
        // Industries statistics
        Investor.aggregate([
          { $match: { industries: { $exists: true, $ne: null, $ne: '' } } },
          { $group: { _id: '$industries', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]),
        // Investment Stage statistics
        Investor.aggregate([
          { $match: { investmentStage: { $exists: true, $ne: null, $ne: '' } } },
          { $group: { _id: '$investmentStage', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]),
        // Revenue Criteria statistics
        Investor.aggregate([
          { $match: { revenueCriteria: { $exists: true, $ne: null, $ne: '' } } },
          { $group: { _id: '$revenueCriteria', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]),
        // Status statistics
        Investor.aggregate([
          { $group: { _id: '$status', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ])
      ]);

      // Get total count
      const totalInvestors = await Investor.countDocuments();

      // Format the statistics
      const statistics = {
        totalInvestors,
        locations: locationStats.map(item => ({
          name: item._id,
          count: item.count,
          percentage: ((item.count / totalInvestors) * 100).toFixed(1)
        })),
        investorTypes: investorTypeStats.map(item => ({
          name: item._id,
          count: item.count,
          percentage: ((item.count / totalInvestors) * 100).toFixed(1)
        })),
        sectors: sectorStats.map(item => ({
          name: item._id,
          count: item.count,
          percentage: ((item.count / totalInvestors) * 100).toFixed(1)
        })),
        industries: industriesStats.map(item => ({
          name: item._id,
          count: item.count,
          percentage: ((item.count / totalInvestors) * 100).toFixed(1)
        })),
        investmentStages: investmentStageStats.map(item => ({
          name: item._id,
          count: item.count,
          percentage: ((item.count / totalInvestors) * 100).toFixed(1)
        })),
        revenueCriteria: revenueCriteriaStats.map(item => ({
          name: item._id,
          count: item.count,
          percentage: ((item.count / totalInvestors) * 100).toFixed(1)
        })),
        status: statusStats.map(item => ({
          name: item._id === 0 ? 'Pending' : item._id === 1 ? 'Active' : 'Inactive',
          count: item.count,
          percentage: ((item.count / totalInvestors) * 100).toFixed(1)
        }))
      };

      console.log('✅ [DEBUG] Dashboard statistics retrieved:', {
        totalInvestors,
        locationsCount: statistics.locations.length,
        investorTypesCount: statistics.investorTypes.length,
        sectorsCount: statistics.sectors.length,
        industriesCount: statistics.industries.length,
        investmentStagesCount: statistics.investmentStages.length,
        revenueCriteriaCount: statistics.revenueCriteria.length
      });

      res.json({
        success: true,
        statistics
      });
    } catch (error) {
      console.error('❌ [DEBUG] Get dashboard stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Filter investors using saved filter criteria
  static async filterInvestorsBySavedFilter(req, res) {
    try {
      const { filterId } = req.params;
      const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      console.log('🔍 [DEBUG] Filter investors by saved filter:', {
        filterId,
        page,
        limit
      });

      // Récupérer le filtre enregistré
      const EnregistrerFiltre = require('../models/EnregistrerFiltre');
      const savedFilter = await EnregistrerFiltre.findById(filterId);

      if (!savedFilter) {
        return res.status(404).json({
          success: false,
          message: 'Filtre enregistré non trouvé'
        });
      }

      if (!savedFilter.isActive) {
        return res.status(400).json({
          success: false,
          message: 'Ce filtre est inactif'
        });
      }

      console.log('📋 [DEBUG] Saved filter criteria:', {
        title: savedFilter.title,
        industries: savedFilter.industries,
        locations: savedFilter.locations,
        investorTypes: savedFilter.investorTypes,
        revenueCriteria: savedFilter.revenueCriteria,
        investmentStages: savedFilter.investmentStages,
        sectors: savedFilter.sectors
      });

      // Construire le filtre MongoDB basé sur les critères du filtre enregistré
      const filter = {};

      // Filtrer par industries (si spécifié)
      if (savedFilter.industries && savedFilter.industries.trim()) {
        const industries = savedFilter.industries.split(',').map(i => i.trim()).filter(i => i);
        if (industries.length > 0) {
          filter.industries = { $in: industries.map(industry => new RegExp(industry, 'i')) };
        }
      }

      // Filtrer par localisations (si spécifié)
      if (savedFilter.locations && savedFilter.locations.trim()) {
        const locations = savedFilter.locations.split(',').map(l => l.trim()).filter(l => l);
        if (locations.length > 0) {
          filter.location = { $in: locations.map(location => new RegExp(location, 'i')) };
        }
      }

      // Filtrer par types d'investisseurs (si spécifié)
      if (savedFilter.investorTypes && savedFilter.investorTypes.trim()) {
        const investorTypes = savedFilter.investorTypes.split(',').map(t => t.trim()).filter(t => t);
        if (investorTypes.length > 0) {
          filter.investorType = { $in: investorTypes.map(type => new RegExp(type, 'i')) };
        }
      }

      // Filtrer par critères de revenus (si spécifié)
      if (savedFilter.revenueCriteria && savedFilter.revenueCriteria.trim()) {
        const revenueCriteria = savedFilter.revenueCriteria.split(',').map(r => r.trim()).filter(r => r);
        if (revenueCriteria.length > 0) {
          filter.revenueCriteria = { $in: revenueCriteria.map(criteria => new RegExp(criteria, 'i')) };
        }
      }

      // Filtrer par stages d'investissement (si spécifié)
      if (savedFilter.investmentStages && savedFilter.investmentStages.trim()) {
        const investmentStages = savedFilter.investmentStages.split(',').map(s => s.trim()).filter(s => s);
        if (investmentStages.length > 0) {
          filter.investmentStage = { $in: investmentStages.map(stage => new RegExp(stage, 'i')) };
        }
      }

      // Filtrer par secteurs (si spécifié)
      if (savedFilter.sectors && savedFilter.sectors.trim()) {
        const sectors = savedFilter.sectors.split(',').map(s => s.trim()).filter(s => s);
        if (sectors.length > 0) {
          filter.sector = { $in: sectors.map(sector => new RegExp(sector, 'i')) };
        }
      }

      console.log('🔍 [DEBUG] Final MongoDB filter:', filter);

      // Calculer la pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const limitNum = parseInt(limit);

      // Construire l'objet de tri
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Exécuter la recherche avec pagination
      const investors = await Investor.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limitNum);

      // Obtenir le nombre total pour la pagination
      const totalCount = await Investor.countDocuments(filter);
      const totalPages = Math.ceil(totalCount / limitNum);

      console.log('✅ [DEBUG] Filter results:', {
        found: investors.length,
        total: totalCount,
        page: parseInt(page),
        totalPages
      });

      res.json({
        success: true,
        investors: investors,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          limit: limitNum,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1,
          count: investors.length
        },
        appliedFilter: {
          filterId: savedFilter._id,
          filterTitle: savedFilter.title,
          criteria: {
            industries: savedFilter.industries || null,
            locations: savedFilter.locations || null,
            investorTypes: savedFilter.investorTypes || null,
            revenueCriteria: savedFilter.revenueCriteria || null,
            investmentStages: savedFilter.investmentStages || null,
            sectors: savedFilter.sectors || null
          }
        }
      });
    } catch (error) {
      console.error('❌ [DEBUG] Filter investors by saved filter error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Unified filter investors based on reference table data
  static async unifiedFilterInvestors(req, res) {
    try {
      const {
        // Reference table filters
        sectorIds = [],
        locationIds = [],
        industryIds = [],
        revenueCriteriaIds = [],
        
        // Additional filters
        investorType,
        investmentStage,
        status,
        searchTerm,
        
        // Pagination and sorting
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      console.log('🔍 [DEBUG] Unified filter investors with criteria:', {
        sectorIds,
        locationIds,
        industryIds,
        revenueCriteriaIds,
        investorType,
        investmentStage,
        status,
        searchTerm,
        page,
        limit
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

      console.log('📊 [DEBUG] Reference data retrieved:', {
        sectors: sectors.length,
        locations: locations.length,
        industries: industries.length,
        revenueCriteria: revenueCriteria.length
      });

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

      console.log('🔍 [DEBUG] Final filter object:', filter);

      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const limitNum = parseInt(limit);

      // Build sort object
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Execute search with pagination
      const investors = await Investor.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limitNum);

      // Get total count for pagination
      const totalCount = await Investor.countDocuments(filter);
      const totalPages = Math.ceil(totalCount / limitNum);

      console.log('✅ [DEBUG] Unified filter results:', {
        found: investors.length,
        total: totalCount,
        page: parseInt(page),
        totalPages
      });

      res.json({
        success: true,
        investors: investors,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          limit: limitNum,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1,
          count: investors.length
        },
        appliedFilters: {
          // Reference table filters
          sectorIds: sectorIds.length > 0 ? sectorIds : null,
          locationIds: locationIds.length > 0 ? locationIds : null,
          industryIds: industryIds.length > 0 ? industryIds : null,
          revenueCriteriaIds: revenueCriteriaIds.length > 0 ? revenueCriteriaIds : null,
          
          // Reference data used
          sectors: sectors.map(s => ({ _id: s._id, name: s.name })),
          locations: locations.map(l => ({ _id: l._id, name: l.name })),
          industries: industries.map(i => ({ _id: i._id, name: i.name })),
          revenueCriteria: revenueCriteria.map(rc => ({ _id: rc._id, name: rc.name })),
          
          // Additional filters
          investorType: investorType || null,
          investmentStage: investmentStage || null,
          status: status !== undefined ? parseInt(status) : null,
          searchTerm: searchTerm || null
        }
      });
    } catch (error) {
      console.error('❌ [DEBUG] Unified filter investors error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Advanced filter API for investors with multiple criteria
  static async advancedFilterInvestors(req, res) {
    try {
      const {
        // Basic filters
        investorType,
        sector,
        industries,
        investmentStage,
        revenueCriteria,
        location,
        status,
        
        // Advanced filters
        minRevenue,
        maxRevenue,
        minInvestment,
        maxInvestment,
        hasWebsite,
        hasLinkedin,
        hasEmail,
        
        // Search and pagination
        searchTerm,
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      console.log('🔍 [DEBUG] Advanced filter investors with criteria:', {
        investorType,
        sector,
        industries,
        investmentStage,
        revenueCriteria,
        location,
        status,
        minRevenue,
        maxRevenue,
        minInvestment,
        maxInvestment,
        hasWebsite,
        hasLinkedin,
        hasEmail,
        searchTerm,
        page,
        limit
      });

      // Build filter object dynamically
      const filter = {};

      // Basic filters
      if (investorType) {
        filter.investorType = { $regex: investorType, $options: 'i' };
      }

      if (sector) {
        filter.sector = { $regex: sector, $options: 'i' };
      }

      if (industries) {
        // Handle multiple industries separated by commas
        const industryList = industries.split(',').map(industry => industry.trim()).filter(industry => industry);
        if (industryList.length > 0) {
          filter.industries = { $regex: industryList.join('|'), $options: 'i' };
        }
      }

      if (investmentStage) {
        // Handle multiple investment stages separated by commas
        const stageList = investmentStage.split(',').map(stage => stage.trim()).filter(stage => stage);
        if (stageList.length > 0) {
          filter.investmentStage = { $regex: stageList.join('|'), $options: 'i' };
        }
      }

      if (revenueCriteria) {
        // Handle multiple revenue criteria separated by commas
        const revenueList = revenueCriteria.split(',').map(revenue => revenue.trim()).filter(revenue => revenue);
        if (revenueList.length > 0) {
          filter.revenueCriteria = { $regex: revenueList.join('|'), $options: 'i' };
        }
      }

      if (location) {
        filter.location = { $regex: location, $options: 'i' };
      }

      if (status !== undefined) {
        filter.status = parseInt(status);
      }

      // Advanced filters - Revenue range (using revenueCriteria field)
      if (minRevenue || maxRevenue) {
        // For revenue range, we need to handle it differently since revenueCriteria is a string field
        // We'll use a different approach for numeric ranges
        if (minRevenue && maxRevenue) {
          filter.revenueCriteria = { 
            $gte: parseInt(minRevenue), 
            $lte: parseInt(maxRevenue) 
          };
        } else if (minRevenue) {
          filter.revenueCriteria = { $gte: parseInt(minRevenue) };
        } else if (maxRevenue) {
          filter.revenueCriteria = { $lte: parseInt(maxRevenue) };
        }
      }

      // Investment range (using investmentStage field)
      if (minInvestment || maxInvestment) {
        if (minInvestment && maxInvestment) {
          filter.investmentStage = { 
            $gte: parseInt(minInvestment), 
            $lte: parseInt(maxInvestment) 
          };
        } else if (minInvestment) {
          filter.investmentStage = { $gte: parseInt(minInvestment) };
        } else if (maxInvestment) {
          filter.investmentStage = { $lte: parseInt(maxInvestment) };
        }
      }

      // Boolean filters - Handle multiple boolean conditions properly
      const booleanConditions = [];

      if (hasWebsite === 'true') {
        booleanConditions.push({ website: { $exists: true, $ne: null, $ne: '' } });
      } else if (hasWebsite === 'false') {
        booleanConditions.push({
          $or: [
            { website: { $exists: false } },
            { website: null },
            { website: '' }
          ]
        });
      }

      if (hasLinkedin === 'true') {
        booleanConditions.push({ linkedin: { $exists: true, $ne: null, $ne: '' } });
      } else if (hasLinkedin === 'false') {
        booleanConditions.push({
          $or: [
            { linkedin: { $exists: false } },
            { linkedin: null },
            { linkedin: '' }
          ]
        });
      }

      if (hasEmail === 'true') {
        booleanConditions.push({ email: { $exists: true, $ne: null, $ne: '' } });
      } else if (hasEmail === 'false') {
        booleanConditions.push({
          $or: [
            { email: { $exists: false } },
            { email: null },
            { email: '' }
          ]
        });
      }

      // Add boolean conditions to filter
      if (booleanConditions.length > 0) {
        if (filter.$and) {
          filter.$and.push(...booleanConditions);
        } else {
          filter.$and = booleanConditions;
        }
      }

      // Text search - Handle search term properly
      if (searchTerm) {
        const searchConditions = [
          { organizationPersonName: { $regex: searchTerm, $options: 'i' } },
          { firstName: { $regex: searchTerm, $options: 'i' } },
          { lastName: { $regex: searchTerm, $options: 'i' } },
          { email: { $regex: searchTerm, $options: 'i' } },
          { description: { $regex: searchTerm, $options: 'i' } }
        ];

        if (filter.$or) {
          // If there's already an $or condition, combine them
          filter.$and = filter.$and || [];
          filter.$and.push({ $or: searchConditions });
        } else {
          filter.$or = searchConditions;
        }
      }

      console.log('🔍 [DEBUG] Final filter object:', filter);

      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const limitNum = parseInt(limit);

      // Build sort object
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Execute search with pagination
      const investors = await Investor.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limitNum);

      // Get total count for pagination
      const totalCount = await Investor.countDocuments(filter);
      const totalPages = Math.ceil(totalCount / limitNum);

      console.log('✅ [DEBUG] Advanced filter results:', {
        found: investors.length,
        total: totalCount,
        page: parseInt(page),
        totalPages
      });

      res.json({
        success: true,
        investors: investors,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          limit: limitNum,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1,
          count: investors.length
        },
        appliedFilters: {
          // Basic filters
          investorType: investorType || null,
          sector: sector || null,
          industries: industries || null,
          investmentStage: investmentStage || null,
          revenueCriteria: revenueCriteria || null,
          location: location || null,
          status: status !== undefined ? parseInt(status) : null,
          
          // Advanced filters
          minRevenue: minRevenue || null,
          maxRevenue: maxRevenue || null,
          minInvestment: minInvestment || null,
          maxInvestment: maxInvestment || null,
          hasWebsite: hasWebsite || null,
          hasLinkedin: hasLinkedin || null,
          hasEmail: hasEmail || null,
          
          // Search
          searchTerm: searchTerm || null
        }
      });
    } catch (error) {
      console.error('❌ [DEBUG] Advanced filter investors error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Dynamic filter API for investors
  static async filterInvestors(req, res) {
    try {
      const {
        investorType,
        sector,
        industries,
        investmentStage,
        revenueCriteria,
        location,
        status,
        searchTerm,
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      console.log('🔍 [DEBUG] Filter investors with criteria:', {
        investorType,
        sector,
        industries,
        investmentStage,
        revenueCriteria,
        location,
        status,
        searchTerm,
        page,
        limit
      });

      // Build filter object dynamically
      const filter = {};

      // Add filters only if they are provided
      if (investorType) {
        filter.investorType = { $regex: investorType, $options: 'i' };
      }

      if (sector) {
        filter.sector = { $regex: sector, $options: 'i' };
      }

      if (industries) {
        // Handle multiple industries separated by commas
        const industryList = industries.split(',').map(industry => industry.trim()).filter(industry => industry);
        if (industryList.length > 0) {
          filter.industries = { $regex: industryList.join('|'), $options: 'i' };
        }
      }

      if (investmentStage) {
        // Handle multiple investment stages separated by commas
        const stageList = investmentStage.split(',').map(stage => stage.trim()).filter(stage => stage);
        if (stageList.length > 0) {
          filter.investmentStage = { $regex: stageList.join('|'), $options: 'i' };
        }
      }

      if (revenueCriteria) {
        // Handle multiple revenue criteria separated by commas
        const revenueList = revenueCriteria.split(',').map(revenue => revenue.trim()).filter(revenue => revenue);
        if (revenueList.length > 0) {
          filter.revenueCriteria = { $regex: revenueList.join('|'), $options: 'i' };
        }
      }

      if (location) {
        filter.location = { $regex: location, $options: 'i' };
      }

      if (status !== undefined) {
        filter.status = parseInt(status);
      }

      // Add text search if provided
      if (searchTerm) {
        filter.$or = [
          { organizationPersonName: { $regex: searchTerm, $options: 'i' } },
          { firstName: { $regex: searchTerm, $options: 'i' } },
          { lastName: { $regex: searchTerm, $options: 'i' } },
          { email: { $regex: searchTerm, $options: 'i' } },
          { description: { $regex: searchTerm, $options: 'i' } }
        ];
      }

      console.log('🔍 [DEBUG] Final filter object:', filter);

      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const limitNum = parseInt(limit);

      // Build sort object
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Execute search with pagination
      const investors = await Investor.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limitNum);

      // Get total count for pagination
      const totalCount = await Investor.countDocuments(filter);
      const totalPages = Math.ceil(totalCount / limitNum);

      console.log('✅ [DEBUG] Filter results:', {
        found: investors.length,
        total: totalCount,
        page: parseInt(page),
        totalPages
      });

      res.json({
        success: true,
        investors: investors,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          limit: limitNum,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1,
          count: investors.length
        },
        appliedFilters: {
          investorType: investorType || null,
          sector: sector || null,
          industries: industries || null,
          investmentStage: investmentStage || null,
          revenueCriteria: revenueCriteria || null,
          location: location || null,
          status: status !== undefined ? parseInt(status) : null,
          searchTerm: searchTerm || null
        }
      });
    } catch (error) {
      console.error('❌ [DEBUG] Filter investors error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Advanced search with multiple filters
  static async advancedSearch(req, res) {
    try {
      const {
        investorType,
        sector,
        industries,
        investmentStage,
        location,
        revenueCriteria,
        status,
        searchTerm,
        limit = 50,
        offset = 0
      } = req.query;

      console.log('🔄 [DEBUG] Advanced search request:', {
        investorType,
        sector,
        industries,
        investmentStage,
        location,
        revenueCriteria,
        status,
        searchTerm,
        limit,
        offset
      });

      // Build filter object
      const filter = {};

      if (investorType) {
        filter.investorType = { $regex: investorType, $options: 'i' };
      }

      if (sector) {
        filter.sector = { $regex: sector, $options: 'i' };
      }

      if (industries) {
        // Handle multiple industries separated by commas
        const industryList = industries.split(',').map(industry => industry.trim()).filter(industry => industry);
        if (industryList.length > 0) {
          filter.industries = { $regex: industryList.join('|'), $options: 'i' };
        }
      }

      if (investmentStage) {
        // Handle multiple investment stages separated by commas
        const stageList = investmentStage.split(',').map(stage => stage.trim()).filter(stage => stage);
        if (stageList.length > 0) {
          filter.investmentStage = { $regex: stageList.join('|'), $options: 'i' };
        }
      }

      if (location) {
        filter.location = { $regex: location, $options: 'i' };
      }

      if (revenueCriteria) {
        // Handle multiple revenue criteria separated by commas
        const revenueList = revenueCriteria.split(',').map(revenue => revenue.trim()).filter(revenue => revenue);
        if (revenueList.length > 0) {
          filter.revenueCriteria = { $regex: revenueList.join('|'), $options: 'i' };
        }
      }

      if (status !== undefined && status !== '') {
        filter.status = parseInt(status);
      }

      // Text search across multiple fields
      if (searchTerm) {
        filter.$or = [
          { firstName: { $regex: searchTerm, $options: 'i' } },
          { lastName: { $regex: searchTerm, $options: 'i' } },
          { email: { $regex: searchTerm, $options: 'i' } },
          { organizationPersonName: { $regex: searchTerm, $options: 'i' } },
          { description: { $regex: searchTerm, $options: 'i' } }
        ];
      }

      console.log('🔍 [DEBUG] Filter object:', filter);

      // Execute search
      const investors = await Investor.find(filter)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(offset));

      // Get total count for pagination
      const totalCount = await Investor.countDocuments(filter);

      console.log('✅ [DEBUG] Search results:', {
        found: investors.length,
        total: totalCount
      });

      res.json({
        success: true,
        investors: investors,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          count: investors.length,
          total: totalCount,
          hasMore: (parseInt(offset) + investors.length) < totalCount
        },
        filters: {
          investorType,
          sector,
          industries,
          investmentStage,
          location,
          revenueCriteria,
          status,
          searchTerm
        }
      });
    } catch (error) {
      console.error('❌ [DEBUG] Advanced search error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Filter investors using saved filters from EnregistrerFiltre
  static async filterInvestorsBySavedFilter(req, res) {
    try {
      const { filterId, userId } = req.params;
      const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

      console.log('🔍 [DEBUG] Filter investors by saved filter request:', {
        filterId,
        userId,
        page,
        limit,
        sortBy,
        sortOrder
      });

      // Find the saved filter
      const savedFilter = await EnregistrerFiltre.findById(filterId);
      if (!savedFilter) {
        return res.status(404).json({
          success: false,
          message: 'Saved filter not found'
        });
      }

      // Check if user has access to this filter (if userId is provided)
      if (userId && savedFilter.userId && savedFilter.userId.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this filter'
        });
      }

      // Build filter object from saved filter data
      const filter = {};

      // Parse and apply industries filter - skip if "All" or empty
      if (savedFilter.industries && savedFilter.industries.trim() && savedFilter.industries !== 'All') {
        const industries = savedFilter.industries.split(',').map(industry => industry.trim()).filter(industry => industry && industry !== 'All');
        if (industries.length > 0) {
          filter.industries = { $regex: industries.join('|'), $options: 'i' };
        }
      }

      // Parse and apply locations filter - skip if "All" or empty
      if (savedFilter.locations && savedFilter.locations.trim() && savedFilter.locations !== 'All') {
        const locations = savedFilter.locations.split(',').map(location => location.trim()).filter(location => location && location !== 'All');
        if (locations.length > 0) {
          filter.location = { $regex: locations.join('|'), $options: 'i' };
        }
      }

      // Parse and apply investor types filter - skip if "All" or empty
      if (savedFilter.investorTypes && savedFilter.investorTypes.trim() && savedFilter.investorTypes !== 'All') {
        const investorTypes = savedFilter.investorTypes.split(',').map(type => type.trim()).filter(type => type && type !== 'All');
        if (investorTypes.length > 0) {
          filter.investorType = { $regex: investorTypes.join('|'), $options: 'i' };
        }
      }

      // Parse and apply revenue criteria filter - skip if "All" or empty
      if (savedFilter.revenueCriteria && savedFilter.revenueCriteria.trim() && savedFilter.revenueCriteria !== 'All') {
        const revenueCriteria = savedFilter.revenueCriteria.split(',').map(criteria => criteria.trim()).filter(criteria => criteria && criteria !== 'All');
        if (revenueCriteria.length > 0) {
          filter.revenueCriteria = { $regex: revenueCriteria.join('|'), $options: 'i' };
        }
      }

      // Parse and apply investment stages filter - skip if "All" or empty
      if (savedFilter.investmentStages && savedFilter.investmentStages.trim() && savedFilter.investmentStages !== 'All') {
        const investmentStages = savedFilter.investmentStages.split(',').map(stage => stage.trim()).filter(stage => stage && stage !== 'All');
        if (investmentStages.length > 0) {
          filter.investmentStage = { $regex: investmentStages.join('|'), $options: 'i' };
        }
      }

      // Parse and apply sectors filter - skip if "All" or empty
      if (savedFilter.sectors && savedFilter.sectors.trim() && savedFilter.sectors !== 'All') {
        const sectors = savedFilter.sectors.split(',').map(sector => sector.trim()).filter(sector => sector && sector !== 'All');
        if (sectors.length > 0) {
          filter.sector = { $regex: sectors.join('|'), $options: 'i' };
        }
      }

      console.log('🔍 [DEBUG] Applied filter from saved filter:', filter);

      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const limitNum = parseInt(limit);
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Execute search with pagination
      const investors = await Investor.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limitNum);

      // Get total count for pagination
      const totalCount = await Investor.countDocuments(filter);
      const totalPages = Math.ceil(totalCount / limitNum);

      console.log('✅ [DEBUG] Filter results:', {
        found: investors.length,
        total: totalCount,
        page: parseInt(page),
        totalPages
      });

      res.json({
        success: true,
        investors: investors,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          limit: limitNum,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1,
          count: investors.length
        },
        appliedFilter: {
          filterId: savedFilter._id,
          filterTitle: savedFilter.title,
          filterData: {
            industries: savedFilter.industries,
            locations: savedFilter.locations,
            investorTypes: savedFilter.investorTypes,
            revenueCriteria: savedFilter.revenueCriteria,
            investmentStages: savedFilter.investmentStages,
            sectors: savedFilter.sectors
          }
        }
      });
    } catch (error) {
      console.error('❌ [DEBUG] Filter investors by saved filter error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Get all saved filters for a user with filtered investors
  static async getSavedFilters(req, res) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 10, search = '', sortBy = 'createdAt', sortOrder = 'desc', includeInvestors = 'true' } = req.query;

      console.log('🔍 [DEBUG] Get saved filters with investors request:', {
        userId,
        page,
        limit,
        search,
        sortBy,
        sortOrder,
        includeInvestors
      });

      // Build query
      const query = { userId: userId, isActive: true };
      
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { industries: { $regex: search, $options: 'i' } },
          { locations: { $regex: search, $options: 'i' } },
          { investorTypes: { $regex: search, $options: 'i' } },
          { revenueCriteria: { $regex: search, $options: 'i' } },
          { investmentStages: { $regex: search, $options: 'i' } },
          { sectors: { $regex: search, $options: 'i' } }
        ];
      }

      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const limitNum = parseInt(limit);
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Get saved filters
      const savedFilters = await EnregistrerFiltre.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limitNum);

      // Get total count
      const totalCount = await EnregistrerFiltre.countDocuments(query);
      const totalPages = Math.ceil(totalCount / limitNum);

      console.log('✅ [DEBUG] Saved filters retrieved:', {
        found: savedFilters.length,
        total: totalCount,
        page: parseInt(page),
        totalPages
      });

      // If includeInvestors is true, get filtered investors for each saved filter
      let savedFiltersWithInvestors = savedFilters;
      
      if (includeInvestors === 'true') {
        console.log('🔄 [DEBUG] Getting filtered investors for each saved filter');
        
        savedFiltersWithInvestors = await Promise.all(
          savedFilters.map(async (filter) => {
            try {
              // Build filter object from saved filter data
              const investorFilter = {};

              // Parse and apply industries filter - skip if "All" or empty
              if (filter.industries && filter.industries.trim() && filter.industries !== 'All') {
                const industries = filter.industries.split(',').map(industry => industry.trim()).filter(industry => industry && industry !== 'All');
                if (industries.length > 0) {
                  investorFilter.industries = { $regex: industries.join('|'), $options: 'i' };
                }
              }

              // Parse and apply locations filter - skip if "All" or empty
              if (filter.locations && filter.locations.trim() && filter.locations !== 'All') {
                const locations = filter.locations.split(',').map(location => location.trim()).filter(location => location && location !== 'All');
                if (locations.length > 0) {
                  investorFilter.location = { $regex: locations.join('|'), $options: 'i' };
                }
              }

              // Parse and apply investor types filter - skip if "All" or empty
              if (filter.investorTypes && filter.investorTypes.trim() && filter.investorTypes !== 'All') {
                const investorTypes = filter.investorTypes.split(',').map(type => type.trim()).filter(type => type && type !== 'All');
                if (investorTypes.length > 0) {
                  investorFilter.investorType = { $regex: investorTypes.join('|'), $options: 'i' };
                }
              }

              // Parse and apply revenue criteria filter - skip if "All" or empty
              if (filter.revenueCriteria && filter.revenueCriteria.trim() && filter.revenueCriteria !== 'All') {
                const revenueCriteria = filter.revenueCriteria.split(',').map(criteria => criteria.trim()).filter(criteria => criteria && criteria !== 'All');
                if (revenueCriteria.length > 0) {
                  investorFilter.revenueCriteria = { $regex: revenueCriteria.join('|'), $options: 'i' };
                }
              }

              // Parse and apply investment stages filter - skip if "All" or empty
              if (filter.investmentStages && filter.investmentStages.trim() && filter.investmentStages !== 'All') {
                const investmentStages = filter.investmentStages.split(',').map(stage => stage.trim()).filter(stage => stage && stage !== 'All');
                if (investmentStages.length > 0) {
                  investorFilter.investmentStage = { $regex: investmentStages.join('|'), $options: 'i' };
                }
              }

              // Parse and apply sectors filter - skip if "All" or empty
              if (filter.sectors && filter.sectors.trim() && filter.sectors !== 'All') {
                const sectors = filter.sectors.split(',').map(sector => sector.trim()).filter(sector => sector && sector !== 'All');
                if (sectors.length > 0) {
                  investorFilter.sector = { $regex: sectors.join('|'), $options: 'i' };
                }
              }

              console.log('🔍 [DEBUG] Filter criteria for filter', filter._id, ':', investorFilter);

              // Get filtered investors (limit to 10 for preview)
              const investors = await Investor.find(investorFilter)
                .sort({ createdAt: -1 })
                .limit(10);

              // Get total count of matching investors
              const totalInvestors = await Investor.countDocuments(investorFilter);

              console.log('✅ [DEBUG] Filter results for', filter._id, ':', {
                found: investors.length,
                total: totalInvestors
              });

              return {
                ...filter.toObject(),
                filteredInvestors: {
                  data: investors,
                  total: totalInvestors,
                  preview: investors.length,
                  hasMore: totalInvestors > 10
                }
              };
            } catch (error) {
              console.error('❌ [DEBUG] Error getting investors for filter', filter._id, ':', error);
              return {
                ...filter.toObject(),
                filteredInvestors: {
                  data: [],
                  total: 0,
                  preview: 0,
                  hasMore: false,
                  error: error.message
                }
              };
            }
          })
        );
      }

      res.json({
        success: true,
        savedFilters: savedFiltersWithInvestors,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          limit: limitNum,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1,
          count: savedFilters.length
        },
        includeInvestors: includeInvestors === 'true'
      });
    } catch (error) {
      console.error('❌ [DEBUG] Get saved filters error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
}

module.exports = InvestorController;
