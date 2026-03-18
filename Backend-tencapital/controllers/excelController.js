const ExcelMapping = require('../models/ExcelMapping');
const HeaderNormalizer = require('../utils/headerNormalizer');
const aiMappingService = require('../services/aiMappingService');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

class ExcelController {
  // Upload et traitement du fichier Excel
  static async uploadExcel(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No Excel file uploaded'
        });
      }

      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      // Convertir userId en ObjectId si c'est une chaîne
      let validUserId = userId;
      if (typeof userId === 'string' && userId.length !== 24) {
        // Si ce n'est pas un ObjectId valide, créer un ObjectId temporaire
        const mongoose = require('mongoose');
        validUserId = new mongoose.Types.ObjectId();
        console.log('⚠️ UserId non-ObjectId détecté, utilisation d\'un ObjectId temporaire:', validUserId);
      }

      // Vérifier que le fichier existe
      if (!fs.existsSync(req.file.path)) {
        return res.status(400).json({
          success: false,
          message: 'Uploaded file not found on server'
        });
      }

      console.log('Reading Excel file from:', req.file.path);
      
      // Lire le fichier Excel
      const workbook = XLSX.readFile(req.file.path);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convertir en JSON
      const excelData = XLSX.utils.sheet_to_json(worksheet);
      
      if (excelData.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Excel file is empty or has no data'
        });
      }

      // Mapping intelligent des colonnes avec IA
      const mappingResult = HeaderNormalizer.normalizeExcelHeaders(excelData);
      const mappedData = mappingResult.normalizedData;
      
      // Validation des données
      const validatedData = ExcelMapping.validateMappedData(mappedData);
      
      // Normalisation des données
      const normalizedData = ExcelMapping.normalizeData(validatedData);

      // Ajouter les métadonnées
      const processedData = normalizedData.map(row => ({
        ...row,
        sourceFile: req.file.filename,
        userId: validUserId,
        status: 'pending'
      }));

      // Sauvegarder en base de données
      const savedData = await ExcelMapping.insertMany(processedData);

      // Nettoyer le fichier temporaire
      fs.unlinkSync(req.file.path);

      res.json({
        success: true,
        message: 'Excel file processed successfully',
        data: {
          totalRows: savedData.length,
          processedRows: savedData.filter(row => row.validationErrors.length === 0).length,
          errorRows: savedData.filter(row => row.validationErrors.length > 0).length,
          fileInfo: {
            originalName: req.file.originalname,
            size: req.file.size,
            uploadedAt: new Date()
          },
          mappingReport: mappingResult.report
        },
        rows: savedData.map(row => ({
          id: row._id,
          rowNumber: row.rowNumber,
          hasErrors: row.validationErrors.length > 0,
          errors: row.validationErrors
        }))
      });

    } catch (error) {
      console.error('Excel upload error:', error);
      
      // Nettoyer le fichier en cas d'erreur
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      res.status(500).json({
        success: false,
        message: 'Error processing Excel file',
        error: error.message
      });
    }
  }

  // Prévisualisation des données Excel
  static async previewExcel(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No Excel file uploaded'
        });
      }

      // Lire le fichier Excel
      const workbook = XLSX.readFile(req.file.path);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convertir en JSON
      const excelData = XLSX.utils.sheet_to_json(worksheet);
      
      if (excelData.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Excel file is empty or has no data'
        });
      }

      // Mapping intelligent des colonnes avec IA
      const mappingResult = HeaderNormalizer.normalizeExcelHeaders(excelData);
      const mappedData = mappingResult.normalizedData;
      
      // Validation des données
      const validatedData = ExcelMapping.validateMappedData(mappedData);

      // Nettoyer le fichier temporaire
      fs.unlinkSync(req.file.path);

      res.json({
        success: true,
        message: 'Excel file preview generated',
        data: {
          totalRows: validatedData.length,
          columns: Object.keys(excelData[0] || {}),
          mappedColumns: Object.keys(mappedData[0] || {}),
          sampleData: validatedData.slice(0, 5), // Premières 5 lignes
          mappingReport: mappingResult.report,
          validationSummary: {
            validRows: validatedData.filter(row => row.validationErrors.length === 0).length,
            errorRows: validatedData.filter(row => row.validationErrors.length > 0).length,
            commonErrors: ExcelController.getCommonErrors(validatedData)
          }
        }
      });

    } catch (error) {
      console.error('Excel preview error:', error);
      
      // Nettoyer le fichier en cas d'erreur
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      res.status(500).json({
        success: false,
        message: 'Error previewing Excel file',
        error: error.message
      });
    }
  }

  // Validation des données Excel
  static async validateExcelData(req, res) {
    try {
      const { data } = req.body;
      
      if (!data || !Array.isArray(data)) {
        return res.status(400).json({
          success: false,
          message: 'Data array is required'
        });
      }

      // Validation des données
      const validatedData = ExcelMapping.validateMappedData(data);
      
      // Normalisation des données
      const normalizedData = ExcelMapping.normalizeData(validatedData);

      res.json({
        success: true,
        message: 'Data validation completed',
        data: {
          totalRows: normalizedData.length,
          validRows: normalizedData.filter(row => row.validationErrors.length === 0).length,
          errorRows: normalizedData.filter(row => row.validationErrors.length > 0).length,
          validationResults: normalizedData.map(row => ({
            rowNumber: row.rowNumber,
            isValid: row.validationErrors.length === 0,
            errors: row.validationErrors
          }))
        }
      });

    } catch (error) {
      console.error('Data validation error:', error);
      res.status(500).json({
        success: false,
        message: 'Error validating data',
        error: error.message
      });
    }
  }

  // Obtenir les erreurs communes
  static getCommonErrors(validatedData) {
    const errorCounts = {};
    
    validatedData.forEach(row => {
      row.validationErrors.forEach(error => {
        const key = `${error.field}: ${error.message}`;
        errorCounts[key] = (errorCounts[key] || 0) + 1;
      });
    });

    return Object.entries(errorCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([error, count]) => ({ error, count }));
  }

  // Obtenir les informations de mapping
  static async getMappingInfo(req, res) {
    try {
      const mappingInfo = {
        supportedFormats: ['.xlsx', '.xls', '.csv'],
        maxFileSize: '10MB',
        maxRows: 10000,
        defaultMapping: HeaderNormalizer.getDefaultMapping(),
        aiMapping: {
          enabled: true,
          confidenceThreshold: 0.3,
          supportedAlgorithms: ['jaccard', 'levenshtein', 'keyword_matching']
        },
        validationRules: {
          email: 'Must be a valid email format',
          phoneNumber: 'Must be a valid phone number',
          website: 'Must start with http:// or https://',
          linkedin: 'Must be a valid LinkedIn profile URL',
          investmentAmount: 'Must be a positive number',
          investmentDate: 'Must be a valid date'
        }
      };

      res.json({
        success: true,
        message: 'Mapping information retrieved',
        data: mappingInfo
      });

    } catch (error) {
      console.error('Mapping info error:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving mapping information',
        error: error.message
      });
    }
  }

  // Analyser les en-têtes Excel avec IA
  static async analyzeHeaders(req, res) {
    try {
      const { headers } = req.body;
      
      if (!headers || !Array.isArray(headers)) {
        return res.status(400).json({
          success: false,
          message: 'Headers array is required'
        });
      }

      // Générer le mapping intelligent
      const mappingResult = aiMappingService.generateIntelligentMapping(headers);
      const report = aiMappingService.generateMappingReport(mappingResult);
      
      // Générer des suggestions
      const suggestions = HeaderNormalizer.generateMappingSuggestions(
        mappingResult.mapping, 
        headers
      );

      res.json({
        success: true,
        message: 'Headers analyzed successfully',
        data: {
          originalHeaders: headers,
          mapping: mappingResult.mapping,
          report: report,
          suggestions: suggestions
        }
      });

    } catch (error) {
      console.error('Header analysis error:', error);
      res.status(500).json({
        success: false,
        message: 'Error analyzing headers',
        error: error.message
      });
    }
  }

  // Valider un mapping personnalisé
  static async validateCustomMapping(req, res) {
    try {
      console.log('🚀 [DEBUG] Starting validateCustomMapping request');
      console.log('📥 [DEBUG] Request body keys:', Object.keys(req.body));
      console.log('📥 [DEBUG] Request body:', req.body);
      
      const { mapping, headers } = req.body;
      
      console.log('📊 [DEBUG] Mapping received:', mapping);
      console.log('📊 [DEBUG] Headers received:', headers);
      console.log('📊 [DEBUG] Headers type:', typeof headers);
      console.log('📊 [DEBUG] Headers length:', headers ? headers.length : 'undefined');
      console.log('📊 [DEBUG] Headers array check:', Array.isArray(headers));
      
      if (!mapping || !headers) {
        console.log('❌ [DEBUG] Missing mapping or headers');
        return res.status(400).json({
          success: false,
          message: 'Mapping and headers are required'
        });
      }

      // Filter out null/undefined headers
      const cleanHeaders = headers.filter(header => header !== null && header !== undefined && header !== '');
      console.log('🧹 [DEBUG] Cleaned headers:', cleanHeaders);
      console.log('🧹 [DEBUG] Removed null/undefined headers:', headers.length - cleanHeaders.length);

      if (cleanHeaders.length === 0) {
        console.log('❌ [DEBUG] No valid headers after cleaning');
        return res.status(400).json({
          success: false,
          message: 'No valid headers found after cleaning null/undefined values'
        });
      }

      console.log('🔍 [DEBUG] Starting validation with clean headers');
      const validation = HeaderNormalizer.validateMapping(mapping, cleanHeaders);
      console.log('🔍 [DEBUG] Validation result:', validation);
      
      console.log('💡 [DEBUG] Starting suggestions generation');
      const suggestions = HeaderNormalizer.generateMappingSuggestions(mapping, cleanHeaders);
      console.log('💡 [DEBUG] Suggestions generated:', suggestions.length);

      console.log('📤 [DEBUG] Preparing response');
      res.json({
        success: true,
        message: 'Mapping validation completed',
        data: {
          validation: validation,
          suggestions: suggestions
        }
      });

    } catch (error) {
      console.error('❌ [DEBUG] Mapping validation error:', error);
      console.error('❌ [DEBUG] Error message:', error.message);
      console.error('❌ [DEBUG] Error stack:', error.stack);
      console.error('❌ [DEBUG] Request body that caused error:', req.body);
      
      res.status(500).json({
        success: false,
        message: 'Error validating mapping',
        error: error.message,
        debug_info: {
          error_type: error.constructor.name,
          error_message: error.message,
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  // Obtenir les données traitées par utilisateur
  static async getUserExcelData(req, res) {
    try {
      const { userId } = req.params;
      const { status, page = 1, limit = 50 } = req.query;

      const filter = { userId };
      if (status) {
        filter.status = status;
      }

      const skip = (page - 1) * limit;
      
      const data = await ExcelMapping.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await ExcelMapping.countDocuments(filter);

      res.json({
        success: true,
        message: 'Excel data retrieved successfully',
        data: {
          rows: data,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            totalRows: total,
            hasNext: page * limit < total,
            hasPrev: page > 1
          }
        }
      });

    } catch (error) {
      console.error('Get user Excel data error:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving Excel data',
        error: error.message
      });
    }
  }

  // Marquer les données comme traitées
  static async markAsProcessed(req, res) {
    try {
      const { ids } = req.body;
      
      if (!ids || !Array.isArray(ids)) {
        return res.status(400).json({
          success: false,
          message: 'Array of IDs is required'
        });
      }

      const result = await ExcelMapping.updateMany(
        { _id: { $in: ids } },
        { 
          isProcessed: true,
          status: 'active'
        }
      );

      res.json({
        success: true,
        message: 'Data marked as processed successfully',
        data: {
          updatedCount: result.modifiedCount
        }
      });

    } catch (error) {
      console.error('Mark as processed error:', error);
      res.status(500).json({
        success: false,
        message: 'Error marking data as processed',
        error: error.message
      });
    }
  }

  // Mapper les données avec ChatGPT
  static async mapExcelData(req, res) {
    try {
      console.log('🚀 [DEBUG] Starting mapExcelData request');
      console.log('📥 [DEBUG] Request body keys:', Object.keys(req.body));
      console.log('📥 [DEBUG] Request body data type:', typeof req.body.data);
      
      const { data } = req.body;

      // Validation des données d'entrée
      if (!data || !Array.isArray(data) || data.length === 0) {
        console.log('❌ [DEBUG] Invalid data format - not array or empty');
        return res.status(400).json({
          success: false,
          message: 'Invalid data format. Expected array of arrays with headers and rows.'
        });
      }

      console.log('📊 [DEBUG] Data array length:', data.length);
      console.log('📊 [DEBUG] First few rows:', data.slice(0, 3));

      const headers = data[0];
      const rows = data.slice(1);

      if (!headers || headers.length === 0) {
        console.log('❌ [DEBUG] No headers found in data');
        return res.status(400).json({
          success: false,
          message: 'No headers found in the data.'
        });
      }

      console.log('🔍 [DEBUG] Headers detected:', headers);
      console.log('🔍 [DEBUG] Number of data rows:', rows.length);
      console.log('🔍 [DEBUG] Sample data row:', rows[0]);

      // Utiliser le service AI local existant
      console.log('🧠 [DEBUG] Starting AI mapping service');
      console.log('🧠 [DEBUG] Headers to analyze:', headers);
      
      const mappingResult = await aiMappingService.generateIntelligentMapping(headers);
      
      console.log('🧠 [DEBUG] AI mapping result:', {
        hasMapping: !!mappingResult.mapping,
        mappingKeys: mappingResult.mapping ? Object.keys(mappingResult.mapping) : [],
        report: mappingResult.report ? {
          totalColumns: mappingResult.report.totalColumns,
          mappedColumns: mappingResult.report.mappedColumns,
          qualityScore: mappingResult.report.qualityScore
        } : null
      });
      
      let mappedHeaders = {};
      if (mappingResult && mappingResult.mapping) {
        mappedHeaders = mappingResult.mapping;
        console.log('✅ [DEBUG] AI mapping successful:', mappedHeaders);
        console.log('✅ [DEBUG] Mapping confidence:', mappingResult.report?.confidence);
      } else {
        // Fallback ultime : mapping 1:1
        console.log('⚠️ [DEBUG] AI mapping failed, using fallback mapping');
        headers.forEach(header => {
          const cleanField = header.toLowerCase()
            .replace(/[^a-zA-Z0-9]/g, '')
            .replace(/^\d/, 'field$&'); // Ajouter 'field' si commence par un chiffre
          mappedHeaders[header] = cleanField || 'unknownField';
        });
        console.log('⚠️ [DEBUG] Fallback mapping created:', mappedHeaders);
      }

      console.log('🔄 [DEBUG] Header mapping completed - focusing on headers only');
      console.log('🔄 [DEBUG] Headers to map:', headers);
      console.log('🔄 [DEBUG] Mapping rules:', mappedHeaders);
      console.log('🔄 [DEBUG] Skipping data value processing - headers only mode');

      console.log('📤 [DEBUG] Preparing header-only response for frontend');
      console.log('📤 [DEBUG] Response data summary:', {
        success: true,
        originalHeaders: headers.length,
        mappedHeaders: Object.keys(mappedHeaders).length,
        mappingMethod: mappingResult ? 'ai_mapping' : 'fallback_mapping',
        mode: 'headers_only'
      });

      // Calculer les scores de confiance pour chaque mapping
      const confidence = {};
      Object.entries(mappedHeaders).forEach(([originalHeader, dbField]) => {
        if (mappingResult && mappingResult.report && mappingResult.report.confidence) {
          // Utiliser la confiance de l'IA si disponible
          const aiConfidence = mappingResult.report.confidence[originalHeader];
          confidence[originalHeader] = aiConfidence ? Math.round(aiConfidence * 100) : 85;
        } else {
          // Confiance par défaut pour le fallback
          confidence[originalHeader] = 75;
        }
      });

      // Générer des suggestions basées sur l'analyse
      const suggestions = [];
      if (mappingResult && mappingResult.report) {
        if (mappingResult.report.unmappedColumns && mappingResult.report.unmappedColumns.length > 0) {
          mappingResult.report.unmappedColumns.forEach(column => {
            suggestions.push(`Consider mapping '${column}' to a database field`);
          });
        }
        
        if (mappingResult.report.missingDbFields && mappingResult.report.missingDbFields.length > 0) {
          mappingResult.report.missingDbFields.forEach(field => {
            suggestions.push(`Database field '${field}' is not mapped`);
          });
        }
      }

      // Calculer le score de qualité global
      const qualityScore = mappingResult && mappingResult.report ? 
        Math.round(mappingResult.report.qualityScore * 100) : 75;

      console.log('📤 [DEBUG] Frontend response format (headers only):', {
        success: true,
        data: {
          mapping: mappedHeaders,
          confidence: confidence,
          suggestions: suggestions,
          qualityScore: qualityScore,
          originalHeaders: headers,
          totalRows: rows.length
        }
      });

      res.json({
        success: true,
        data: {
          mapping: mappedHeaders,
          confidence: confidence,
          suggestions: suggestions,
          qualityScore: qualityScore,
          originalHeaders: headers,
          totalRows: rows.length,
          mode: 'headers_only'
        }
      });

    } catch (error) {
      console.error('❌ [DEBUG] Error mapping Excel data:', error);
      console.error('❌ [DEBUG] Error message:', error.message);
      console.error('❌ [DEBUG] Error stack:', error.stack);
      console.error('❌ [DEBUG] Request body that caused error:', req.body);
      
      res.status(500).json({
        success: false,
        message: 'Failed to map Excel data. Please try again.',
        error: process.env.NODE_ENV === 'development' ? {
          message: error.message,
          stack: error.stack,
          requestBody: req.body
        } : undefined,
        debug_info: {
          error_type: error.constructor.name,
          error_message: error.message,
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  // Enregistrer les données mappées dans la base de données
  static async saveMappedData(req, res) {
    try {
      console.log('🚀 [DEBUG] Starting saveMappedData request');
      console.log('📥 [DEBUG] Request body keys:', Object.keys(req.body));
      
      const { mapped, userId, headerMapping } = req.body; // tableau d'objets mappés + userId + headerMapping
      
      if (!Array.isArray(mapped)) {
        console.log('❌ [DEBUG] Mapped data is not an array');
        return res.status(400).json({ success: false, message: 'Mapped data must be an array' });
      }
      if (!userId) {
        console.log('❌ [DEBUG] UserId is missing');
        return res.status(400).json({ success: false, message: 'userId is required' });
      }
      
      console.log('📊 [DEBUG] Data to insert:', {
        mappedRows: mapped.length,
        userId: userId,
        hasHeaderMapping: !!headerMapping
      });
      
      // Même si le tableau est vide, on accepte et on retourne success
      if (mapped.length === 0) {
        console.log('⚠️ [DEBUG] No data to insert');
        return res.json({ success: true, insertedCount: 0, data: [] });
      }
      
      // Convertir userId en ObjectId si c'est une chaîne simple
      let validUserId = userId;
      if (typeof userId === 'string' && userId.length !== 24) {
        // Si ce n'est pas un ObjectId valide, créer un ObjectId temporaire
        const mongoose = require('mongoose');
        validUserId = new mongoose.Types.ObjectId();
        console.log('⚠️ [DEBUG] UserId non-ObjectId détecté, utilisation d\'un ObjectId temporaire:', validUserId);
      }
      
      // Ajouter userId à chaque objet et convertir le status
      const mappedWithUser = mapped.map(obj => {
        const convertedObj = { ...obj, userId: validUserId };
        
        // Convertir le status de string à number si présent
        if (convertedObj.status) {
          if (typeof convertedObj.status === 'string') {
            switch (convertedObj.status.toLowerCase()) {
              case 'pending':
                convertedObj.status = 0;
                break;
              case 'active':
                convertedObj.status = 1;
                break;
              case 'inactive':
                convertedObj.status = 2;
                break;
              default:
                convertedObj.status = 0; // default to pending
            }
          }
        } else {
          convertedObj.status = 0; // default to pending if no status
        }
        
        return convertedObj;
      });
      console.log('🔄 [DEBUG] Data with userId and converted status:', mappedWithUser.slice(0, 2));
      
      const Investor = require('../models/Investor');
      const result = await Investor.insertMany(mappedWithUser);
      
      console.log('✅ [DEBUG] Successfully inserted data:', {
        insertedCount: result.length,
        sampleData: result.slice(0, 2)
      });
      
      res.json({ success: true, insertedCount: result.length, data: result });
    } catch (error) {
      console.error('❌ [DEBUG] Error saving mapped data:', error);
      console.error('❌ [DEBUG] Error message:', error.message);
      console.error('❌ [DEBUG] Error stack:', error.stack);
      
      res.status(500).json({ 
        success: false, 
        message: 'Failed to save mapped data', 
        error: error.message,
        debug_info: {
          error_type: error.constructor.name,
          error_message: error.message,
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  // Importer des données Excel avec un mapping personnalisé
  static async importWithMapping(req, res) {
    try {
      console.log('🚀 [DEBUG] Starting importWithMapping request');
      console.log('📥 [DEBUG] Request body keys:', Object.keys(req.body));
      
      const { data, mapping } = req.body;
      
      console.log('📊 [DEBUG] Data array length:', data ? data.length : 'undefined');
      console.log('📊 [DEBUG] Mapping object:', mapping);
      
      // Validation des données d'entrée
      if (!data || !Array.isArray(data) || data.length === 0) {
        console.log('❌ [DEBUG] Invalid data format - not array or empty');
        return res.status(400).json({
          success: false,
          message: 'Invalid data format. Expected array of arrays with headers and rows.'
        });
      }

      if (!mapping || typeof mapping !== 'object') {
        console.log('❌ [DEBUG] Invalid mapping format');
        return res.status(400).json({
          success: false,
          message: 'Invalid mapping format. Expected object with Excel header to DB field mapping.'
        });
      }

      const headers = data[0];
      const rows = data.slice(1);

      if (!headers || headers.length === 0) {
        console.log('❌ [DEBUG] No headers found in data');
        return res.status(400).json({
          success: false,
          message: 'No headers found in the data.'
        });
      }

      console.log('🔍 [DEBUG] Headers detected:', headers);
      console.log('🔍 [DEBUG] Number of data rows:', rows.length);
      console.log('🔍 [DEBUG] Mapping rules:', mapping);

      // Mapper les données en utilisant le mapping fourni
      console.log('🔄 [DEBUG] Starting data mapping with custom mapping');
      const mappedData = rows.map((row, index) => {
        const mappedRow = {};
        
        console.log(`🔄 [DEBUG] Processing row ${index + 1}:`, row);
        
        headers.forEach((header, colIndex) => {
          const mappedField = mapping[header];
          const value = row[colIndex];
          
          console.log(`🔄 [DEBUG] Header: "${header}" -> Field: "${mappedField}", Value: "${value}"`);
          
          if (mappedField && value !== undefined && value !== null && value !== '') {
            // Nettoyer et normaliser la valeur
            const cleanValue = String(value).trim();
            if (cleanValue) {
              mappedRow[mappedField] = cleanValue;
              console.log(`✅ [DEBUG] Mapped: ${mappedField} = ${cleanValue}`);
            }
          } else {
            console.log(`⚠️ [DEBUG] Skipped: ${header} (empty or no mapping)`);
          }
        });
        
        // Ajouter métadonnées
        mappedRow.sourceFile = 'custom-mapping-import';
        mappedRow.status = 0; // 0 = pending
        mappedRow.createdAt = new Date();
        mappedRow.updatedAt = new Date();
        
        console.log(`🔄 [DEBUG] Row ${index + 1} mapped result:`, mappedRow);
        return mappedRow;
      });

      // Filtrer les lignes vides
      const filteredData = mappedData.filter((row, index) => {
        const hasData = Object.keys(row).length > 4 && // Plus que sourceFile, status, createdAt, updatedAt
          Object.entries(row).some(([key, val]) => 
            key !== 'sourceFile' && 
            key !== 'status' && 
            key !== 'createdAt' && 
            key !== 'updatedAt' && 
            val && 
            String(val).trim()
          );
        console.log(`🔍 [DEBUG] Row ${index + 1} has data:`, hasData);
        return hasData;
      });

      console.log(`✅ [DEBUG] Successfully mapped ${filteredData.length} rows out of ${mappedData.length}`);
      console.log('✅ [DEBUG] Sample mapped data:', filteredData.slice(0, 2));

      if (filteredData.length === 0) {
        console.log('⚠️ [DEBUG] No valid data to insert');
        return res.json({
          success: true,
          message: 'No valid data found to insert',
          insertedCount: 0,
          data: []
        });
      }

      // Insérer les données dans la base de données
      console.log('💾 [DEBUG] Starting database insertion');
      const Investor = require('../models/Investor');
      const result = await Investor.insertMany(filteredData);
      
      console.log('✅ [DEBUG] Successfully inserted data:', {
        insertedCount: result.length,
        sampleData: result.slice(0, 2)
      });

      res.json({
        success: true,
        message: 'Data imported successfully with custom mapping',
        insertedCount: result.length,
        data: result,
        mapping: mapping,
        debug_info: {
          totalRows: rows.length,
          validRows: filteredData.length,
          mappingUsed: Object.keys(mapping).length,
          processing_time: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('❌ [DEBUG] Error importing with mapping:', error);
      console.error('❌ [DEBUG] Error message:', error.message);
      console.error('❌ [DEBUG] Error stack:', error.stack);
      console.error('❌ [DEBUG] Request body that caused error:', req.body);
      
      res.status(500).json({
        success: false,
        message: 'Failed to import data with custom mapping',
        error: process.env.NODE_ENV === 'development' ? {
          message: error.message,
          stack: error.stack,
          requestBody: req.body
        } : undefined,
        debug_info: {
          error_type: error.constructor.name,
          error_message: error.message,
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  // Mapping et insertion en une seule étape
  static async mapAndInsert(req, res) {
    try {
      console.log('🚀 [DEBUG] Starting mapAndInsert request');
      console.log('📥 [DEBUG] Request body keys:', Object.keys(req.body));
      
      const { data, mapping } = req.body;
      
      console.log('📊 [DEBUG] Data array length:', data ? data.length : 'undefined');
      console.log('📊 [DEBUG] Mapping object:', mapping);
      
      // Validation des données d'entrée
      if (!data || !Array.isArray(data) || data.length === 0) {
        console.log('❌ [DEBUG] Invalid data format - not array or empty');
        return res.status(400).json({
          success: false,
          message: 'Invalid data format. Expected array of arrays with headers and rows.'
        });
      }

      if (!mapping || typeof mapping !== 'object') {
        console.log('❌ [DEBUG] Invalid mapping format');
        return res.status(400).json({
          success: false,
          message: 'Invalid mapping format. Expected object with Excel header to DB field mapping.'
        });
      }

      const headers = data[0];
      const rows = data.slice(1);

      if (!headers || headers.length === 0) {
        console.log('❌ [DEBUG] No headers found in data');
        return res.status(400).json({
          success: false,
          message: 'No headers found in the data.'
        });
      }

      console.log('🔍 [DEBUG] Headers detected:', headers);
      console.log('🔍 [DEBUG] Number of data rows:', rows.length);
      console.log('🔍 [DEBUG] Mapping rules:', mapping);

      // Mapper et insérer les données en une seule étape
      console.log('🔄 [DEBUG] Starting mapping and insertion process');
      const mappedData = [];
      
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const mappedRow = {};
        
        console.log(`🔄 [DEBUG] Processing row ${i + 1}:`, row);
        
        headers.forEach((header, colIndex) => {
          const mappedField = mapping[header];
          const value = row[colIndex];
          
          console.log(`🔄 [DEBUG] Header: "${header}" -> Field: "${mappedField}", Value: "${value}"`);
          
          if (mappedField && value !== undefined && value !== null && value !== '') {
            const cleanValue = String(value).trim();
            if (cleanValue) {
              mappedRow[mappedField] = cleanValue;
              console.log(`✅ [DEBUG] Mapped: ${mappedField} = ${cleanValue}`);
            }
          } else {
            console.log(`⚠️ [DEBUG] Skipped: ${header} (empty or no mapping)`);
          }
        });
        
        // Ajouter métadonnées
        mappedRow.sourceFile = 'map-and-insert-import';
        mappedRow.status = 0; // 0 = pending
        mappedRow.createdAt = new Date();
        mappedRow.updatedAt = new Date();
        
        console.log(`🔄 [DEBUG] Row ${i + 1} mapped result:`, mappedRow);
        
        // Vérifier si la ligne a des données valides
        const hasData = Object.keys(mappedRow).length > 4 && // Plus que sourceFile, status, createdAt, updatedAt
          Object.entries(mappedRow).some(([key, val]) => 
            key !== 'sourceFile' && 
            key !== 'status' && 
            key !== 'createdAt' && 
            key !== 'updatedAt' && 
            val && 
            String(val).trim()
          );
        
        if (hasData) {
          mappedData.push(mappedRow);
          console.log(`✅ [DEBUG] Row ${i + 1} added to insertion list`);
        } else {
          console.log(`⚠️ [DEBUG] Row ${i + 1} skipped (no valid data)`);
        }
      }

      console.log(`✅ [DEBUG] Successfully mapped ${mappedData.length} rows out of ${rows.length}`);
      console.log('✅ [DEBUG] Sample mapped data:', mappedData.slice(0, 2));

      if (mappedData.length === 0) {
        console.log('⚠️ [DEBUG] No valid data to insert');
        return res.json({
          success: true,
          message: 'No valid data found to insert',
          insertedCount: 0,
          data: [],
          mapping: mapping
        });
      }

      // Insérer les données dans la base de données
      console.log('💾 [DEBUG] Starting database insertion');
      const Investor = require('../models/Investor');
      const result = await Investor.insertMany(mappedData);
      
      console.log('✅ [DEBUG] Successfully inserted data:', {
        insertedCount: result.length,
        sampleData: result.slice(0, 2)
      });

      res.json({
        success: true,
        message: 'Data mapped and inserted successfully',
        insertedCount: result.length,
        data: result,
        mapping: mapping,
        debug_info: {
          totalRows: rows.length,
          validRows: mappedData.length,
          mappingUsed: Object.keys(mapping).length,
          processing_time: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('❌ [DEBUG] Error in mapAndInsert:', error);
      console.error('❌ [DEBUG] Error message:', error.message);
      console.error('❌ [DEBUG] Error stack:', error.stack);
      console.error('❌ [DEBUG] Request body that caused error:', req.body);
      
      res.status(500).json({
        success: false,
        message: 'Failed to map and insert data',
        error: process.env.NODE_ENV === 'development' ? {
          message: error.message,
          stack: error.stack,
          requestBody: req.body
        } : undefined,
        debug_info: {
          error_type: error.constructor.name,
          error_message: error.message,
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  // Upload fichier Excel + mapping automatique + insertion en une seule étape
  static async uploadMapAndInsert(req, res) {
    try {
      console.log('🚀 [DEBUG] Starting uploadMapAndInsert request - AUTO MAPPING VERSION');
      console.log('📁 [DEBUG] File info:', req.file ? {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      } : 'No file');
      
      // Validation du fichier
      if (!req.file) {
        console.log('❌ [DEBUG] No file uploaded');
        return res.status(400).json({
          success: false,
          message: 'No Excel file uploaded'
        });
      }

      // Vérifier que le fichier existe
      if (!fs.existsSync(req.file.path)) {
        console.log('❌ [DEBUG] File not found on disk');
        return res.status(400).json({
          success: false,
          message: 'Uploaded file not found'
        });
      }

      // Lire le fichier Excel
      console.log('📖 [DEBUG] Reading Excel file:', req.file.path);
      const workbook = XLSX.readFile(req.file.path);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      console.log('📊 [DEBUG] Excel data rows:', jsonData.length);
      console.log('📊 [DEBUG] First few rows:', jsonData.slice(0, 3));

      if (jsonData.length === 0) {
        console.log('❌ [DEBUG] No data found in Excel file');
        return res.status(400).json({
          success: false,
          message: 'No data found in Excel file'
        });
      }

      const headers = jsonData[0];
      const rows = jsonData.slice(1);

      if (!headers || headers.length === 0) {
        console.log('❌ [DEBUG] No headers found in Excel file');
        return res.status(400).json({
          success: false,
          message: 'No headers found in Excel file'
        });
      }

      console.log('🔍 [DEBUG] Headers detected:', headers);
      console.log('🔍 [DEBUG] Number of data rows:', rows.length);

      // MAPPING AUTOMATIQUE avec IA
      console.log('🤖 [DEBUG] Starting automatic AI mapping...');
      const HeaderNormalizer = require('../utils/headerNormalizer');
      
      // Create proper data structure for HeaderNormalizer
      const excelData = rows.map(row => {
        const rowObj = {};
        headers.forEach((header, index) => {
          rowObj[header] = row[index];
        });
        return rowObj;
      });
      
      const mappingResult = HeaderNormalizer.normalizeExcelHeaders(excelData);
      
      console.log('🤖 [DEBUG] AI Mapping result:', {
        mapping: mappingResult.mapping,
        confidence: mappingResult.confidence,
        suggestions: mappingResult.suggestions?.length || 0,
        qualityScore: mappingResult.qualityScore
      });

      const mapping = mappingResult.mapping;
      console.log('🔍 [DEBUG] Final mapping rules:', mapping);

      // Mapper et insérer les données en une seule étape
      console.log('🔄 [DEBUG] Starting mapping and insertion process');
      const mappedData = [];
      
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const mappedRow = {};
        
        console.log(`🔄 [DEBUG] Processing row ${i + 1}:`, row);
        
        headers.forEach((header, colIndex) => {
          const mappedField = mapping[header];
          const value = row[colIndex];
          
          console.log(`🔄 [DEBUG] Header: "${header}" -> Field: "${mappedField}", Value: "${value}"`);
          
          if (mappedField && value !== undefined && value !== null && value !== '') {
            const cleanValue = String(value).trim();
            if (cleanValue) {
              mappedRow[mappedField] = cleanValue;
              console.log(`✅ [DEBUG] Mapped: ${mappedField} = ${cleanValue}`);
            }
          } else {
            console.log(`⚠️ [DEBUG] Skipped: ${header} (empty or no mapping)`);
          }
        });
        
        // Ajouter métadonnées
        mappedRow.sourceFile = req.file.filename;
        mappedRow.status = 0; // 0 = pending
        mappedRow.createdAt = new Date();
        mappedRow.updatedAt = new Date();
        
        console.log(`🔄 [DEBUG] Row ${i + 1} mapped result:`, mappedRow);
        
        // Vérifier si la ligne a des données valides
        const hasData = Object.keys(mappedRow).length > 4 && // Plus que sourceFile, status, createdAt, updatedAt
          Object.entries(mappedRow).some(([key, val]) => 
            key !== 'sourceFile' && 
            key !== 'status' && 
            key !== 'createdAt' && 
            key !== 'updatedAt' && 
            val && 
            String(val).trim()
          );
        
        if (hasData) {
          mappedData.push(mappedRow);
          console.log(`✅ [DEBUG] Row ${i + 1} added to insertion list`);
        } else {
          console.log(`⚠️ [DEBUG] Row ${i + 1} skipped (no valid data)`);
        }
      }

      console.log(`✅ [DEBUG] Successfully mapped ${mappedData.length} rows out of ${rows.length}`);
      console.log('✅ [DEBUG] Sample mapped data:', mappedData.slice(0, 2));

      if (mappedData.length === 0) {
        console.log('⚠️ [DEBUG] No valid data to insert');
        return res.json({
          success: true,
          message: 'No valid data found to insert',
          insertedCount: 0,
          data: [],
          mapping: mapping,
          aiMappingResult: {
            confidence: mappingResult.confidence,
            suggestions: mappingResult.suggestions,
            qualityScore: mappingResult.qualityScore
          },
          fileInfo: {
            filename: req.file.filename,
            originalname: req.file.originalname,
            size: req.file.size
          }
        });
      }

      // Insérer les données dans la base de données
      console.log('💾 [DEBUG] Starting database insertion');
      const Investor = require('../models/Investor');
      const result = await Investor.insertMany(mappedData);
      
      console.log('✅ [DEBUG] Successfully inserted data:', {
        insertedCount: result.length,
        sampleData: result.slice(0, 2)
      });

      // Nettoyer le fichier temporaire
      try {
        fs.unlinkSync(req.file.path);
        console.log('🗑️ [DEBUG] Temporary file cleaned up');
      } catch (cleanupError) {
        console.log('⚠️ [DEBUG] Could not clean up temporary file:', cleanupError.message);
      }

      res.json({
        success: true,
        message: 'Excel file processed and data inserted successfully with automatic AI mapping',
        insertedCount: result.length,
        data: result,
        mapping: mapping,
        aiMappingResult: {
          confidence: mappingResult.confidence,
          suggestions: mappingResult.suggestions,
          qualityScore: mappingResult.qualityScore
        },
        fileInfo: {
          filename: req.file.filename,
          originalname: req.file.originalname,
          size: req.file.size
        },
        debug_info: {
          totalRows: rows.length,
          validRows: mappedData.length,
          mappingUsed: Object.keys(mapping).length,
          processing_time: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('❌ [DEBUG] Error in uploadMapAndInsert:', error);
      console.error('❌ [DEBUG] Error message:', error.message);
      console.error('❌ [DEBUG] Error stack:', error.stack);
      
      // Nettoyer le fichier temporaire en cas d'erreur
      if (req.file && fs.existsSync(req.file.path)) {
        try {
          fs.unlinkSync(req.file.path);
          console.log('🗑️ [DEBUG] Temporary file cleaned up after error');
        } catch (cleanupError) {
          console.log('⚠️ [DEBUG] Could not clean up temporary file after error:', cleanupError.message);
        }
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to process Excel file and insert data',
        error: process.env.NODE_ENV === 'development' ? {
          message: error.message,
          stack: error.stack
        } : undefined,
        debug_info: {
          error_type: error.constructor.name,
          error_message: error.message,
          timestamp: new Date().toISOString()
        }
      });
    }
  }
}

module.exports = ExcelController;