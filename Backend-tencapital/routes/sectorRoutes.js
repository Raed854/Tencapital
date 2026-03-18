const express = require('express');
const router = express.Router();
const Sector = require('../models/Sector');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticateToken, authorize } = require('../middleware/auth');
const { referenceDataCache, invalidateReferenceCache } = require('../middleware/cache');

// Get all (PUBLIC - no auth required) sectors
router.get('/', referenceDataCache, asyncHandler(async (req, res) => {
  try {
    const { search = '', includeInactive = false } = req.query;
    
    let sectors;
    if (search) {
      sectors = await Sector.search(search);
    } else if (includeInactive === 'true') {
      sectors = await Sector.findAllWithInactive();
    } else {
      sectors = await Sector.findAll();
    }

    res.json({
      success: true,
      count: sectors.length,
      sectors
    });
  } catch (error) {
    console.error('Get sectors error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}));

// Get by ID (PUBLIC - no auth required)
router.get('/:id', referenceDataCache, asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const sector = await Sector.findById(id);
    
    if (!sector) {
      return res.status(404).json({
        success: false,
        message: 'Sector not found'
      });
    }

    res.json({
      success: true,
      sector
    });
  } catch (error) {
    console.error('Get sector error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}));

// Create new sector
router.post('/', authenticateToken, authorize('admin'), invalidateReferenceCache, asyncHandler(async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Name is required'
      });
    }

    const sector = await Sector.createSector({ name, description });
    
    res.status(201).json({
      success: true,
      message: 'Sector created successfully',
      sector
    });
  } catch (error) {
    console.error('Create sector error:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Sector with this name already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}));

// Update sector
router.put('/:id', authenticateToken, authorize('admin'), invalidateReferenceCache, asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const sector = await Sector.findById(id);
    if (!sector) {
      return res.status(404).json({
        success: false,
        message: 'Sector not found'
      });
    }

    await sector.updateSector(updateData);
    
    res.json({
      success: true,
      message: 'Sector updated successfully',
      sector
    });
  } catch (error) {
    console.error('Update sector error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}));

// Delete sector
router.delete('/:id', authenticateToken, authorize('admin'), invalidateReferenceCache, asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID parameter
    if (!id || id === 'undefined' || id === 'null') {
      return res.status(400).json({
        success: false,
        message: 'Valid ID is required'
      });
    }

    // Validate ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format'
      });
    }
    
    const sector = await Sector.findById(id);
    if (!sector) {
      return res.status(404).json({
        success: false,
        message: 'Sector not found'
      });
    }

    await sector.deleteSector();
    
    res.json({
      success: true,
      message: 'Sector deleted successfully'
    });
  } catch (error) {
    console.error('Delete sector error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}));

module.exports = router;