const express = require('express');
const router = express.Router();
const RevenueCriteria = require('../models/RevenueCriteria');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticateToken, authorize } = require('../middleware/auth');
const { referenceDataCache, invalidateReferenceCache } = require('../middleware/cache');

// Get all (PUBLIC - no auth required) revenue criteria
router.get('/', referenceDataCache, asyncHandler(async (req, res) => {
  try {
    const { search = '', includeInactive = false } = req.query;
    
    let revenueCriteria;
    if (search) {
      revenueCriteria = await RevenueCriteria.search(search);
    } else if (includeInactive === 'true') {
      revenueCriteria = await RevenueCriteria.findAllWithInactive();
    } else {
      revenueCriteria = await RevenueCriteria.findAll();
    }

    res.json({
      success: true,
      count: revenueCriteria.length,
      revenueCriteria
    });
  } catch (error) {
    console.error('Get revenue criteria error:', error);
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
    const revenueCriteria = await RevenueCriteria.findById(id);
    
    if (!revenueCriteria) {
      return res.status(404).json({
        success: false,
        message: 'Revenue criteria not found'
      });
    }

    res.json({
      success: true,
      revenueCriteria
    });
  } catch (error) {
    console.error('Get revenue criteria error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}));

// Create new revenue criteria
router.post('/', authenticateToken, authorize('admin'), invalidateReferenceCache, asyncHandler(async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Name is required'
      });
    }

    const revenueCriteria = await RevenueCriteria.createRevenueCriteria({ name, description });
    
    res.status(201).json({
      success: true,
      message: 'Revenue criteria created successfully',
      revenueCriteria
    });
  } catch (error) {
    console.error('Create revenue criteria error:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Revenue criteria with this name already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}));

// Update revenue criteria
router.put('/:id', authenticateToken, authorize('admin'), invalidateReferenceCache, asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const revenueCriteria = await RevenueCriteria.findById(id);
    if (!revenueCriteria) {
      return res.status(404).json({
        success: false,
        message: 'Revenue criteria not found'
      });
    }

    await revenueCriteria.updateRevenueCriteria(updateData);
    
    res.json({
      success: true,
      message: 'Revenue criteria updated successfully',
      revenueCriteria
    });
  } catch (error) {
    console.error('Update revenue criteria error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}));

// Delete revenue criteria
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
    
    const revenueCriteria = await RevenueCriteria.findById(id);
    if (!revenueCriteria) {
      return res.status(404).json({
        success: false,
        message: 'Revenue criteria not found'
      });
    }

    await revenueCriteria.deleteRevenueCriteria();
    
    res.json({
      success: true,
      message: 'Revenue criteria deleted successfully'
    });
  } catch (error) {
    console.error('Delete revenue criteria error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}));

module.exports = router;