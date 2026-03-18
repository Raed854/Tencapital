const express = require('express');
const router = express.Router();
const EnregistrerFiltreController = require('../controllers/enregistrerFiltreController');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

// Get all enregistrer filtres (public - no auth required)
router.get('/', asyncHandler(EnregistrerFiltreController.getAllEnregistrerFiltres));

// Get statistics (public - no auth required)
router.get('/stats', asyncHandler(EnregistrerFiltreController.getEnregistrerFiltreStats));

// Search enregistrer filtres (public - no auth required)
router.get('/search', asyncHandler(EnregistrerFiltreController.searchEnregistrerFiltres));

// Get enregistrer filtres by user ID (public - no auth required)
router.get('/user/:userId', asyncHandler(EnregistrerFiltreController.getEnregistrerFiltresByUser));

// Get single enregistrer filtre by ID (public - no auth required)
router.get('/:id', asyncHandler(EnregistrerFiltreController.getEnregistrerFiltreById));

// Create new enregistrer filtre (REQUIRES AUTHENTICATION)
router.post('/', authenticateToken, asyncHandler(EnregistrerFiltreController.createEnregistrerFiltre));

// Bulk operations (REQUIRES AUTHENTICATION)
router.post('/bulk', authenticateToken, asyncHandler(EnregistrerFiltreController.bulkUpdate));

// Update enregistrer filtre (REQUIRES AUTHENTICATION)
router.put('/:id', authenticateToken, asyncHandler(EnregistrerFiltreController.updateEnregistrerFiltre));

// Toggle active status (REQUIRES AUTHENTICATION)
router.put('/:id/active', authenticateToken, asyncHandler(EnregistrerFiltreController.toggleActive));

// Delete enregistrer filtre (REQUIRES AUTHENTICATION)
router.delete('/:id', authenticateToken, asyncHandler(EnregistrerFiltreController.deleteEnregistrerFiltre));

module.exports = router;
