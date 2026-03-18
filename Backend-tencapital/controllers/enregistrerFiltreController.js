const EnregistrerFiltre = require('../models/EnregistrerFiltre');

class EnregistrerFiltreController {
  // Get all enregistrer filtres
  static async getAllEnregistrerFiltres(req, res) {
    try {
      const { 
        includeInactive = false, 
        search = '', 
        userId = null,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        page = 1,
        limit = 10
      } = req.query;

      console.log('🔍 [DEBUG] Get all enregistrer filtres:', {
        includeInactive,
        search,
        userId,
        sortBy,
        sortOrder,
        page,
        limit
      });

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const limitNum = parseInt(limit);

      const options = {
        includeInactive: includeInactive === 'true',
        search,
        userId,
        sortBy,
        sortOrder,
        skip,
        limit: limitNum
      };

      const enregistrerFiltres = await EnregistrerFiltre.findAll(options);

      const totalCount = await EnregistrerFiltre.countDocuments({
        isActive: includeInactive === 'true' ? {} : true,
        ...(userId && { userId }),
        ...(search && {
          $or: [
            { title: { $regex: search, $options: 'i' } },
            { industries: { $regex: search, $options: 'i' } },
            { locations: { $regex: search, $options: 'i' } },
            { investorTypes: { $regex: search, $options: 'i' } },
            { revenueCriteria: { $regex: search, $options: 'i' } },
            { investmentStages: { $regex: search, $options: 'i' } },
            { sectors: { $regex: search, $options: 'i' } }
          ]
        })
      });

      const totalPages = Math.ceil(totalCount / limitNum);

      res.json({
        success: true,
        count: enregistrerFiltres.length,
        totalCount,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1,
          limit: limitNum
        },
        enregistrerFiltres
      });
    } catch (error) {
      console.error('❌ [DEBUG] Get all enregistrer filtres error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Get single enregistrer filtre by ID
  static async getEnregistrerFiltreById(req, res) {
    try {
      const { id } = req.params;

      console.log('🔍 [DEBUG] Get enregistrer filtre by ID:', { id });

      const enregistrerFiltre = await EnregistrerFiltre.findById(id);
      if (!enregistrerFiltre) {
        return res.status(404).json({
          success: false,
          message: 'EnregistrerFiltre not found'
        });
      }

      res.json({
        success: true,
        enregistrerFiltre
      });
    } catch (error) {
      console.error('❌ [DEBUG] Get enregistrer filtre by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Search enregistrer filtres
  static async searchEnregistrerFiltres(req, res) {
    try {
      const { search = '' } = req.query;
      const { userId } = req.params;

      if (!search || search.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Search term must be at least 2 characters long'
        });
      }

      console.log('🔍 [DEBUG] Search enregistrer filtres:', { search, userId });

      const enregistrerFiltres = await EnregistrerFiltre.search(search, userId);

      res.json({
        success: true,
        searchTerm: search,
        userId: userId || 'all',
        count: enregistrerFiltres.length,
        enregistrerFiltres
      });
    } catch (error) {
      console.error('❌ [DEBUG] Search enregistrer filtres error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Get enregistrer filtres by user ID
  static async getEnregistrerFiltresByUser(req, res) {
    try {
      const { userId } = req.params;
      const { 
        includeInactive = false, 
        search = '', 
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      console.log('🔍 [DEBUG] Get enregistrer filtres by user:', {
        userId,
        includeInactive,
        search,
        sortBy,
        sortOrder
      });

      const options = {
        includeInactive: includeInactive === 'true',
        search,
        userId,
        sortBy,
        sortOrder
      };

      const enregistrerFiltres = await EnregistrerFiltre.findAll(options);

      res.json({
        success: true,
        userId,
        count: enregistrerFiltres.length,
        enregistrerFiltres
      });
    } catch (error) {
      console.error('❌ [DEBUG] Get enregistrer filtres by user error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Get statistics
  static async getEnregistrerFiltreStats(req, res) {
    try {
      const { userId } = req.query;

      console.log('📊 [DEBUG] Get enregistrer filtre statistics:', { userId });

      const stats = await EnregistrerFiltre.getStats(userId);

      res.json({
        success: true,
        statistics: stats
      });
    } catch (error) {
      console.error('❌ [DEBUG] Get enregistrer filtre stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Create new enregistrer filtre
  static async createEnregistrerFiltre(req, res) {
    try {
      const { 
        title, 
        industries, 
        locations, 
        investorTypes, 
        revenueCriteria, 
        investmentStages, 
        sectors,
        userId 
      } = req.body;

      console.log('➕ [DEBUG] Create enregistrer filtre:', {
        title,
        hasIndustries: !!industries,
        hasLocations: !!locations,
        hasInvestorTypes: !!investorTypes,
        hasRevenueCriteria: !!revenueCriteria,
        hasInvestmentStages: !!investmentStages,
        hasSectors: !!sectors,
        userId
      });

      // Le titre est maintenant optionnel, on utilise une valeur par défaut si non fourni
      const finalTitle = title || 'Filtre sans nom';

      // Utiliser l'utilisateur authentifié ou le userId fourni
      let validUserId = req.user ? req.user.id : userId;
      
      // Si aucun userId n'est fourni et pas d'utilisateur authentifié, utiliser null
      if (!validUserId) {
        validUserId = null;
      } else if (typeof validUserId === 'string' && validUserId.length !== 24) {
        // Si ce n'est pas un ObjectId valide, créer un ObjectId temporaire
        const mongoose = require('mongoose');
        validUserId = new mongoose.Types.ObjectId();
        console.log('⚠️ UserId non-ObjectId détecté, utilisation d\'un ObjectId temporaire:', validUserId);
      }

      const enregistrerFiltreData = {
        title: finalTitle,
        industries: industries || '',
        locations: locations || '',
        investorTypes: investorTypes || '',
        revenueCriteria: revenueCriteria || '',
        investmentStages: investmentStages || '',
        sectors: sectors || '',
        userId: validUserId
      };

      const enregistrerFiltre = await EnregistrerFiltre.createEnregistrerFiltre(enregistrerFiltreData);

      res.status(201).json({
        success: true,
        message: 'EnregistrerFiltre created successfully',
        enregistrerFiltre
      });
    } catch (error) {
      console.error('❌ [DEBUG] Create enregistrer filtre error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Update enregistrer filtre
  static async updateEnregistrerFiltre(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      console.log('✏️ [DEBUG] Update enregistrer filtre:', { id, updateData });

      const enregistrerFiltre = await EnregistrerFiltre.findById(id);
      if (!enregistrerFiltre) {
        return res.status(404).json({
          success: false,
          message: 'EnregistrerFiltre not found'
        });
      }

      await enregistrerFiltre.updateEnregistrerFiltre(updateData);

      res.json({
        success: true,
        message: 'EnregistrerFiltre updated successfully',
        enregistrerFiltre
      });
    } catch (error) {
      console.error('❌ [DEBUG] Update enregistrer filtre error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Toggle active status
  static async toggleActive(req, res) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      console.log('🔄 [DEBUG] Toggle active:', { id, isActive });

      const enregistrerFiltre = await EnregistrerFiltre.findById(id);
      if (!enregistrerFiltre) {
        return res.status(404).json({
          success: false,
          message: 'EnregistrerFiltre not found'
        });
      }

      if (isActive) {
        await enregistrerFiltre.activate();
      } else {
        await enregistrerFiltre.deactivate();
      }

      res.json({
        success: true,
        message: `EnregistrerFiltre ${isActive ? 'activated' : 'deactivated'} successfully`,
        enregistrerFiltre
      });
    } catch (error) {
      console.error('❌ [DEBUG] Toggle active error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Delete enregistrer filtre
  static async deleteEnregistrerFiltre(req, res) {
    try {
      const { id } = req.params;

      console.log('🗑️ [DEBUG] Delete enregistrer filtre:', { id });

      const enregistrerFiltre = await EnregistrerFiltre.findById(id);
      if (!enregistrerFiltre) {
        return res.status(404).json({
          success: false,
          message: 'EnregistrerFiltre not found'
        });
      }

      await enregistrerFiltre.deleteEnregistrerFiltre();

      res.json({
        success: true,
        message: 'EnregistrerFiltre deleted successfully'
      });
    } catch (error) {
      console.error('❌ [DEBUG] Delete enregistrer filtre error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Bulk operations
  static async bulkUpdate(req, res) {
    try {
      const { enregistrerFiltres, operation } = req.body;

      console.log('📦 [DEBUG] Bulk update:', { operation, count: enregistrerFiltres.length });

      if (!enregistrerFiltres || !Array.isArray(enregistrerFiltres)) {
        return res.status(400).json({
          success: false,
          message: 'EnregistrerFiltres array is required'
        });
      }

      let result;
      switch (operation) {
        case 'activate':
          result = await EnregistrerFiltre.updateMany(
            { _id: { $in: enregistrerFiltres } },
            { isActive: true }
          );
          break;
        case 'deactivate':
          result = await EnregistrerFiltre.updateMany(
            { _id: { $in: enregistrerFiltres } },
            { isActive: false }
          );
          break;
        case 'delete':
          result = await EnregistrerFiltre.updateMany(
            { _id: { $in: enregistrerFiltres } },
            { isActive: false }
          );
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid operation'
          });
      }

      res.json({
        success: true,
        message: `Bulk ${operation} completed successfully`,
        modifiedCount: result.modifiedCount
      });
    } catch (error) {
      console.error('❌ [DEBUG] Bulk update error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
}

module.exports = EnregistrerFiltreController;
