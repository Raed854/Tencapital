const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const ExcelController = require('../controllers/excelController');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticateToken } = require('../middleware/auth');

// Configuration Multer pour l'upload de fichiers
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Créer le dossier uploads s'il n'existe pas
    const uploadDir = path.join(__dirname, '../uploads');
    require('fs').mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Générer un nom de fichier unique
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Filtre pour accepter seulement les fichiers Excel
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'text/csv', // .csv
    'application/csv'
  ];
  
  const allowedExtensions = ['.xlsx', '.xls', '.csv'];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (allowedMimes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error('Only Excel files (.xlsx, .xls) and CSV files are allowed'), false);
  }
};

// Configuration Multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
    files: 1 // Un seul fichier à la fois
  }
});

// Middleware pour gérer les erreurs Multer
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 10MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Only one file is allowed.'
      });
    }
  }
  
  if (error.message.includes('Only Excel files')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  next(error);
};

// Routes Excel

// POST /api/excel/upload - Upload et traitement d'un fichier Excel (REQUIRES AUTHENTICATION)
router.post('/upload', 
  authenticateToken,
  upload.single('excelFile'),
  handleMulterError,
  asyncHandler(ExcelController.uploadExcel)
);

// POST /api/excel/preview - Prévisualisation d'un fichier Excel (REQUIRES AUTHENTICATION)
router.post('/preview',
  authenticateToken,
  upload.single('excelFile'),
  handleMulterError,
  asyncHandler(ExcelController.previewExcel)
);

// POST /api/excel/validate - Validation des données Excel (REQUIRES AUTHENTICATION)
router.post('/validate',
  authenticateToken,
  asyncHandler(ExcelController.validateExcelData)
);

// GET /api/excel/mapping-info - Informations sur le mapping (PUBLIC)
router.get('/mapping-info',
  asyncHandler(ExcelController.getMappingInfo)
);

// GET /api/excel/user/:userId - Obtenir les données Excel d'un utilisateur (REQUIRES AUTHENTICATION)
router.get('/user/:userId',
  authenticateToken,
  asyncHandler(ExcelController.getUserExcelData)
);

// PUT /api/excel/mark-processed - Marquer les données comme traitées (REQUIRES AUTHENTICATION)
router.put('/mark-processed',
  authenticateToken,
  asyncHandler(ExcelController.markAsProcessed)
);

// POST /api/excel/analyze-headers - Analyser les en-têtes avec IA (REQUIRES AUTHENTICATION)
router.post('/analyze-headers',
  authenticateToken,
  asyncHandler(ExcelController.analyzeHeaders)
);

// POST /api/excel/validate-mapping - Valider un mapping personnalisé (REQUIRES AUTHENTICATION)
router.post('/validate-mapping',
  authenticateToken,
  asyncHandler(ExcelController.validateCustomMapping)
);

// POST /api/excel/import - Import de fichier Excel (REQUIRES AUTHENTICATION)
router.post('/import',
  authenticateToken,
  upload.single('excelFile'),
  handleMulterError,
  asyncHandler(ExcelController.uploadExcel)
);

// POST /api/excel/map - Mapper les données avec ChatGPT (REQUIRES AUTHENTICATION)
router.post('/map',
  authenticateToken,
  asyncHandler(ExcelController.mapExcelData)
);

// POST /api/excel/save-mapped - Enregistrer les données mappées (REQUIRES AUTHENTICATION)
router.post('/save-mapped', authenticateToken, asyncHandler(ExcelController.saveMappedData));

// POST /api/excel/import-with-mapping - Importer avec mapping personnalisé (REQUIRES AUTHENTICATION)
router.post('/import-with-mapping', authenticateToken, asyncHandler(ExcelController.importWithMapping));

// POST /api/excel/map-and-insert - Mapping et insertion en une seule étape (REQUIRES AUTHENTICATION)
router.post('/map-and-insert', authenticateToken, asyncHandler(ExcelController.mapAndInsert));

// POST /api/excel/upload-map-insert - Upload fichier Excel + mapping + insertion en une seule étape (REQUIRES AUTHENTICATION)
router.post('/upload-map-insert',
  authenticateToken,
  upload.single('excelFile'),
  handleMulterError,
  asyncHandler(ExcelController.uploadMapAndInsert)
);

module.exports = router;
