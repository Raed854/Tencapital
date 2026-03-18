const express = require('express');
const router = express.Router();
const InvestmentStage = require('../models/InvestmentStage');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticateToken, authorize } = require('../middleware/auth');
const { referenceDataCache, invalidateReferenceCache } = require('../middleware/cache');

// Get all (PUBLIC - no auth required) investment stages
router.get('/', referenceDataCache, asyncHandler(async (req, res) => {
  try {
    const { search = '', includeInactive = false } = req.query;
    
    let investmentStages;
    if (search) {
      investmentStages = await InvestmentStage.search(search);
    } else if (includeInactive === 'true') {
      investmentStages = await InvestmentStage.findAllWithInactive();
    } else {
      investmentStages = await InvestmentStage.findAll();
    }

    res.json({
      success: true,
      count: investmentStages.length,
      investmentStages
    });
  } catch (error) {
    console.error('Get investment stages error:', error);
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
    const investmentStage = await InvestmentStage.findById(id);
    
    if (!investmentStage) {
      return res.status(404).json({
        success: false,
        message: 'Investment stage not found'
      });
    }

    res.json({
      success: true,
      investmentStage
    });
  } catch (error) {
    console.error('Get investment stage error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}));

// Create new investment stage
router.post('/', authenticateToken, authorize('admin'), invalidateReferenceCache, asyncHandler(async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Name is required'
      });
    }

    const investmentStage = await InvestmentStage.createInvestmentStage({ name, description });
    
    res.status(201).json({
      success: true,
      message: 'Investment stage created successfully',
      investmentStage
    });
  } catch (error) {
    console.error('Create investment stage error:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Investment stage with this name already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}));

// Update investment stage
router.put('/:id', authenticateToken, authorize('admin'), invalidateReferenceCache, asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const investmentStage = await InvestmentStage.findById(id);
    if (!investmentStage) {
      return res.status(404).json({
        success: false,
        message: 'Investment stage not found'
      });
    }

    await investmentStage.updateInvestmentStage(updateData);
    
    res.json({
      success: true,
      message: 'Investment stage updated successfully',
      investmentStage
    });
  } catch (error) {
    console.error('Update investment stage error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}));

// Delete investment stage
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
    
    const investmentStage = await InvestmentStage.findById(id);
    if (!investmentStage) {
      return res.status(404).json({
        success: false,
        message: 'Investment stage not found'
      });
    }

    await investmentStage.deleteInvestmentStage();
    
    res.json({
      success: true,
      message: 'Investment stage deleted successfully'
    });
  } catch (error) {
    console.error('Delete investment stage error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}));

module.exports = router;