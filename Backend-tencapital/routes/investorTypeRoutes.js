const express = require('express');
const router = express.Router();
const InvestorType = require('../models/InvestorType');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticateToken, authorize } = require('../middleware/auth');
const { referenceDataCache, invalidateReferenceCache } = require('../middleware/cache');

// Get all (PUBLIC - no auth required) investor types
router.get('/', referenceDataCache, asyncHandler(async (req, res) => {
  try {
    const { search = '', includeInactive = false } = req.query;
    
    let investorTypes;
    if (search) {
      investorTypes = await InvestorType.search(search);
    } else if (includeInactive === 'true') {
      investorTypes = await InvestorType.findAllWithInactive();
    } else {
      investorTypes = await InvestorType.findAll();
    }

    res.json({
      success: true,
      count: investorTypes.length,
      investorTypes
    });
  } catch (error) {
    console.error('Get investor types error:', error);
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
    const investorType = await InvestorType.findById(id);
    
    if (!investorType) {
      return res.status(404).json({
        success: false,
        message: 'Investor type not found'
      });
    }

    res.json({
      success: true,
      investorType
    });
  } catch (error) {
    console.error('Get investor type error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}));

// Create new investor type
router.post('/', authenticateToken, authorize('admin'), invalidateReferenceCache, asyncHandler(async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Name is required'
      });
    }

    const investorType = await InvestorType.createInvestorType({ name, description });
    
    res.status(201).json({
      success: true,
      message: 'Investor type created successfully',
      investorType
    });
  } catch (error) {
    console.error('Create investor type error:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Investor type with this name already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}));

// Update investor type
router.put('/:id', authenticateToken, authorize('admin'), invalidateReferenceCache, asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const investorType = await InvestorType.findById(id);
    if (!investorType) {
      return res.status(404).json({
        success: false,
        message: 'Investor type not found'
      });
    }

    await investorType.updateInvestorType(updateData);
    
    res.json({
      success: true,
      message: 'Investor type updated successfully',
      investorType
    });
  } catch (error) {
    console.error('Update investor type error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}));

// Delete investor type
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
    
    const investorType = await InvestorType.findById(id);
    if (!investorType) {
      return res.status(404).json({
        success: false,
        message: 'Investor type not found'
      });
    }

    await investorType.deleteInvestorType();
    
    res.json({
      success: true,
      message: 'Investor type deleted successfully'
    });
  } catch (error) {
    console.error('Delete investor type error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}));

module.exports = router;