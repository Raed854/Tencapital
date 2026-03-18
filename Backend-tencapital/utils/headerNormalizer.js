/**
 * Utilitaire pour la normalisation des en-têtes Excel
 * Utilise le service d'IA pour mapper automatiquement les colonnes
 */

const aiMappingService = require('../services/aiMappingService');

class HeaderNormalizer {
  /**
   * Normalise les en-têtes d'un fichier Excel avec mapping intelligent
   * @param {Array} excelData - Données Excel brutes
   * @param {Object} customMapping - Mapping personnalisé (optionnel)
   * @returns {Object} - Résultat avec mapping et données normalisées
   */
  static normalizeExcelHeaders(excelData, customMapping = {}) {
    if (!excelData || excelData.length === 0) {
      throw new Error('Aucune donnée Excel fournie');
    }

    // Extraire les en-têtes de la première ligne
    const excelHeaders = Object.keys(excelData[0] || {});
    
    if (excelHeaders.length === 0) {
      throw new Error('Aucun en-tête trouvé dans le fichier Excel');
    }

    // Générer le mapping intelligent
    const mappingResult = aiMappingService.generateIntelligentMapping(excelHeaders);
    
    // Appliquer le mapping personnalisé si fourni
    const finalMapping = { ...mappingResult.mapping, ...customMapping };
    
    // Normaliser toutes les données
    const normalizedData = excelData.map((row, index) => {
      const normalizedRow = {
        rowNumber: index + 1,
        validationErrors: []
      };

      // Appliquer le mapping à chaque ligne
      for (const [excelHeader, value] of Object.entries(row)) {
        const dbField = finalMapping[excelHeader];
        if (dbField && value !== undefined && value !== '') {
          normalizedRow[dbField] = value;
        }
      }

      return normalizedRow;
    });

    // Générer le rapport de mapping
    const mappingReport = aiMappingService.generateMappingReport({
      mapping: finalMapping,
      report: {
        ...mappingResult.report,
        totalExcelColumns: excelHeaders.length,
        mappedColumns: Object.keys(finalMapping).length
      }
    });

    return {
      normalizedData,
      mapping: finalMapping,
      report: mappingReport,
      originalHeaders: excelHeaders
    };
  }

  /**
   * Fonction utilitaire pour normaliser les en-têtes selon un mapping donné
   * @param {Object} headers - Objet avec les en-têtes et valeurs
   * @param {Object} mapping - Mapping des colonnes Excel vers les champs DB
   * @returns {Object} - Données normalisées
   */
  static normalizeHeaders(headers, mapping) {
    return aiMappingService.normalizeHeaders(headers, mapping);
  }

  /**
   * Valide la qualité d'un mapping
   * @param {Object} mapping - Mapping à valider
   * @param {Array} excelHeaders - En-têtes Excel originaux
   * @returns {Object} - Rapport de validation
   */
  static validateMapping(mapping, excelHeaders) {
    const dbFields = [
      'investorType', 'sector', 'industries', 'investmentStage', 'revenueCriteria',
      'organizationPersonName', 'firstName', 'lastName', 'email', 'description',
      'organizationPersonNameFirstNameLastName', 'location', 'phoneNumber', 'website', 'linkedin'
    ];

    console.log('🔍 [DEBUG] Validating mapping with:');
    console.log('  - Mapping keys:', Object.keys(mapping));
    console.log('  - Excel headers:', excelHeaders);
    console.log('  - DB fields:', dbFields);

    const mappedFields = Object.values(mapping);
    const mappedHeaders = Object.keys(mapping);
    
    // Filter out null/undefined headers first
    const validExcelHeaders = excelHeaders.filter(header => 
      header !== null && 
      header !== undefined && 
      header !== '' && 
      typeof header === 'string'
    );
    
    // Find headers that are in Excel but not in mapping
    const unmappedExcelHeaders = validExcelHeaders.filter(header => !mappedHeaders.includes(header));
    
    // Find DB fields that are not mapped
    const missingDbFields = dbFields.filter(field => !mappedFields.includes(field));

    console.log('🔍 [DEBUG] Validation results:');
    console.log('  - Mapped headers:', mappedHeaders);
    console.log('  - Unmapped Excel headers:', unmappedExcelHeaders);
    console.log('  - Missing DB fields:', missingDbFields);

    return {
      isValid: unmappedExcelHeaders.length === 0 && missingDbFields.length === 0,
      unmappedExcelHeaders,
      missingDbFields,
      coverage: validExcelHeaders.length > 0 ? (validExcelHeaders.length - unmappedExcelHeaders.length) / validExcelHeaders.length : 0,
      completeness: (dbFields.length - missingDbFields.length) / dbFields.length
    };
  }

  /**
   * Génère des suggestions d'amélioration pour un mapping
   * @param {Object} mapping - Mapping actuel
   * @param {Array} excelHeaders - En-têtes Excel
   * @returns {Array} - Suggestions d'amélioration
   */
  static generateMappingSuggestions(mapping, excelHeaders) {
    const suggestions = [];
    const dbFields = [
      'investorType', 'sector', 'industries', 'investmentStage', 'revenueCriteria',
      'organizationPersonName', 'firstName', 'lastName', 'email', 'description',
      'organizationPersonNameFirstNameLastName', 'location', 'phoneNumber', 'website', 'linkedin'
    ];

    console.log('🔍 [DEBUG] Mapping object keys:', Object.keys(mapping));
    console.log('🔍 [DEBUG] Mapping values:', Object.values(mapping));

    // Get unmapped headers from the mapping object (not from excelHeaders array)
    const mappedHeaders = Object.keys(mapping);
    const unmappedHeaders = excelHeaders.filter(header => 
      header !== null && 
      header !== undefined && 
      header !== '' && 
      typeof header === 'string' &&
      !mappedHeaders.includes(header)
    );

    console.log('🔍 [DEBUG] Mapped headers from mapping object:', mappedHeaders);
    console.log('🔍 [DEBUG] Unmapped headers (not in mapping):', unmappedHeaders);
    
    for (const header of unmappedHeaders) {
      console.log('🔍 [DEBUG] Processing unmapped header for suggestions:', header);
      const bestMatch = aiMappingService.findBestMatch(header);
      if (bestMatch) {
        suggestions.push({
          type: 'unmapped_column',
          excelHeader: header,
          suggestedDbField: bestMatch.field,
          confidence: bestMatch.confidence,
          message: `Colonne "${header}" pourrait correspondre à "${bestMatch.field}" (confiance: ${Math.round(bestMatch.confidence * 100)}%)`
        });
      } else {
        suggestions.push({
          type: 'unmapped_column',
          excelHeader: header,
          message: `Colonne "${header}" n'a pas de correspondance évidente`
        });
      }
    }

    // Vérifier les champs DB manquants
    const mappedFields = Object.values(mapping);
    const missingDbFields = dbFields.filter(field => !mappedFields.includes(field));
    for (const field of missingDbFields) {
      suggestions.push({
        type: 'missing_db_field',
        dbField: field,
        message: `Champ de base de données "${field}" n'est pas mappé`
      });
    }

    return suggestions;
  }

  /**
   * Crée un mapping par défaut pour les en-têtes courants
   * @returns {Object} - Mapping par défaut
   */
  static getDefaultMapping() {
    return {
      'Investor Type': 'investorType',
      'Sector': 'sector',
      'Industries': 'industries',
      'Investment Stage': 'investmentStage',
      'Revenue Criteria': 'revenueCriteria',
      'Organization/Person Name': 'organizationPersonName',
      'First Name': 'firstName',
      'Last Name': 'lastName',
      'Email': 'email',
      'Description': 'description',
      'Organization/Person NameFirst NameLast Name': 'organizationPersonNameFirstNameLastName',
      'Location': 'location',
      'Phone Number': 'phoneNumber',
      'Website': 'website',
      'LinkedIn': 'linkedin'
    };
  }

  /**
   * Applique des corrections automatiques aux en-têtes
   * @param {Array} headers - En-têtes à corriger
   * @returns {Array} - En-têtes corrigés
   */
  static autoCorrectHeaders(headers) {
    const corrections = {
      'investor type': 'Investor Type',
      'sector': 'Sector',
      'industries': 'Industries',
      'investment stage': 'Investment Stage',
      'revenue criteria': 'Revenue Criteria',
      'organization name': 'Organization/Person Name',
      'first name': 'First Name',
      'last name': 'Last Name',
      'email': 'Email',
      'description': 'Description',
      'location': 'Location',
      'phone number': 'Phone Number',
      'website': 'Website',
      'linkedin': 'LinkedIn'
    };

    return headers.map(header => {
      const normalized = header.toLowerCase().trim();
      return corrections[normalized] || header;
    });
  }
}

module.exports = HeaderNormalizer;
