const express = require('express');
const router = express.Router();
const Industry = require('../models/Industry');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticateToken, authorize } = require('../middleware/auth');
const { referenceDataCache, invalidateReferenceCache } = require('../middleware/cache');

// Get all (PUBLIC - no auth required) industries
router.get('/', referenceDataCache, asyncHandler(async (req, res) => {
  try {
    const { search = '', includeInactive = false } = req.query;
    
    let industries;
    if (search) {
      industries = await Industry.search(search);
    } else if (includeInactive === 'true') {
      industries = await Industry.findAllWithInactive();
    } else {
      industries = await Industry.findAll();
    }

    res.json({
      success: true,
      count: industries.length,
      industries
    });
  } catch (error) {
    console.error('Get industries error:', error);
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
    const industry = await Industry.findById(id);
    
    if (!industry) {
      return res.status(404).json({
        success: false,
        message: 'Industry not found'
      });
    }

    res.json({
      success: true,
      industry
    });
  } catch (error) {
    console.error('Get industry error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}));

// Create new industry
router.post('/', authenticateToken, authorize('admin'), invalidateReferenceCache, asyncHandler(async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Name is required'
      });
    }

    const industry = await Industry.createIndustry({ name, description });
    
    res.status(201).json({
      success: true,
      message: 'Industry created successfully',
      industry
    });
  } catch (error) {
    console.error('Create industry error:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Industry with this name already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}));

// Update industry
router.put('/:id', authenticateToken, authorize('admin'), invalidateReferenceCache, asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const industry = await Industry.findById(id);
    if (!industry) {
      return res.status(404).json({
        success: false,
        message: 'Industry not found'
      });
    }

    await industry.updateIndustry(updateData);
    
    res.json({
      success: true,
      message: 'Industry updated successfully',
      industry
    });
  } catch (error) {
    console.error('Update industry error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}));

// Delete industry
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
    
    const industry = await Industry.findById(id);
    if (!industry) {
      return res.status(404).json({
        success: false,
        message: 'Industry not found'
      });
    }

    await industry.deleteIndustry();
    
    res.json({
      success: true,
      message: 'Industry deleted successfully'
    });
  } catch (error) {
    console.error('Delete industry error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}));

module.exports = router;