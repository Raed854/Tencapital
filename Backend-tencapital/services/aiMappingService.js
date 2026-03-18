/**
 * Service d'IA pour la détection automatique des correspondances de colonnes Excel
 * Utilise des algorithmes de similarité et de correspondance intelligente
 */

class AIMappingService {
  constructor() {
    // Champs de la base de données avec leurs variantes possibles
    this.databaseFields = {
      investorType: {
        field: 'investorType',
        variants: [
          'investor type', 'investor_type', 'type', 'investor', 'investor category',
          'type of investor', 'investor classification', 'investor class'
        ],
        keywords: ['investor', 'type', 'category', 'class']
      },
      sector: {
        field: 'sector',
        variants: [
          'sector', 'industry', 'business sector', 'market sector', 'economic sector',
          'sector focus', 'primary sector', 'main sector'
        ],
        keywords: ['sector', 'industry', 'business', 'market']
      },
      industries: {
        field: 'industries',
        variants: [
          'industries', 'industry focus', 'target industries', 'industry sectors',
          'business industries', 'industry categories', 'sector focus'
        ],
        keywords: ['industries', 'industry', 'sectors', 'focus', 'target']
      },
      investmentStage: {
        field: 'investmentStage',
        variants: [
          'investment stage', 'investment_stage', 'stage', 'funding stage',
          'investment phase', 'development stage', 'growth stage', 'maturity stage'
        ],
        keywords: ['stage', 'phase', 'investment', 'funding', 'development']
      },
      revenueCriteria: {
        field: 'revenueCriteria',
        variants: [
          'revenue criteria', 'revenue_criteria', 'revenue requirements',
          'revenue threshold', 'revenue minimum', 'revenue target', 'revenue range'
        ],
        keywords: ['revenue', 'criteria', 'requirements', 'threshold', 'minimum']
      },
      organizationPersonName: {
        field: 'organizationPersonName',
        variants: [
          'organization name', 'organization', 'organization/person name',
          'company name', 'company', 'organization person name', 'entity name',
          'business name', 'firm name', 'institution name'
        ],
        keywords: ['organization', 'company', 'business', 'firm', 'institution', 'entity']
      },
      firstName: {
        field: 'firstName',
        variants: [
          'first name', 'first_name', 'given name', 'forename', 'personal name',
          'contact first name', 'person first name'
        ],
        keywords: ['first', 'given', 'forename', 'personal']
      },
      lastName: {
        field: 'lastName',
        variants: [
          'last name', 'last_name', 'surname', 'family name', 'contact last name',
          'person last name', 'family surname'
        ],
        keywords: ['last', 'surname', 'family']
      },
      email: {
        field: 'email',
        variants: [
          'email', 'email address', 'e-mail', 'contact email', 'email contact',
          'electronic mail', 'mail address', 'email id'
        ],
        keywords: ['email', 'mail', 'contact', 'electronic']
      },
      description: {
        field: 'description',
        variants: [
          'description', 'notes', 'comments', 'remarks', 'details', 'summary',
          'overview', 'information', 'additional info', 'extra information'
        ],
        keywords: ['description', 'notes', 'comments', 'details', 'summary']
      },
      organizationPersonNameFirstNameLastName: {
        field: 'organizationPersonNameFirstNameLastName',
        variants: [
          'organization/person namefirst namelast name', 'full name',
          'complete name', 'organization person name first name last name',
          'entity full name', 'company person name', 'full company name',
          'organization person namefirst namelast name', 'complete organization name',
          'full entity name', 'company full name', 'organization full name',
          'person full name', 'entity person name', 'business full name'
        ],
        keywords: ['organization', 'person', 'name', 'first', 'last', 'full', 'complete', 'entity', 'company', 'business']
      },
      location: {
        field: 'location',
        variants: [
          'location', 'city', 'address', 'geographic location', 'place',
          'headquarters', 'office location', 'business location', 'base location'
        ],
        keywords: ['location', 'city', 'address', 'place', 'headquarters']
      },
      phoneNumber: {
        field: 'phoneNumber',
        variants: [
          'phone', 'phone number', 'contact number', 'telephone', 'tel',
          'mobile', 'cell phone', 'phone contact', 'contact phone'
        ],
        keywords: ['phone', 'telephone', 'contact', 'mobile', 'cell']
      },
      website: {
        field: 'website',
        variants: [
          'website', 'web site', 'url', 'web address', 'homepage',
          'company website', 'business website', 'official website'
        ],
        keywords: ['website', 'web', 'url', 'homepage', 'site']
      },
      linkedin: {
        field: 'linkedin',
        variants: [
          'linkedin', 'linkedin profile', 'linkedin url', 'linkedin link',
          'linkedin account', 'linkedin page', 'linkedin profile url'
        ],
        keywords: ['linkedin', 'profile', 'social']
      }
    };

    // Champs de la DB qui ne sont pas dans l'Excel (générés automatiquement)
    this.autoGeneratedFields = ['userId', 'createdAt', 'updatedAt'];
  }

  /**
   * Calcule la similarité entre deux chaînes de caractères
   * Utilise l'algorithme de Levenshtein et la similarité de Jaccard
   */
  calculateSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;
    
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();
    
    if (s1 === s2) return 1;
    
    // Similarité de Jaccard (mots communs)
    const words1 = new Set(s1.split(/[\s\-_\/]+/));
    const words2 = new Set(s2.split(/[\s\-_\/]+/));
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    const jaccardSimilarity = intersection.size / union.size;
    
    // Distance de Levenshtein
    const levenshteinDistance = this.levenshteinDistance(s1, s2);
    const maxLength = Math.max(s1.length, s2.length);
    const levenshteinSimilarity = maxLength === 0 ? 1 : 1 - (levenshteinDistance / maxLength);
    
    // Combinaison pondérée
    return (jaccardSimilarity * 0.6) + (levenshteinSimilarity * 0.4);
  }

  /**
   * Calcule la distance de Levenshtein entre deux chaînes
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Trouve la meilleure correspondance pour une colonne Excel
   */
  findBestMatch(excelColumn, threshold = 0.3) {
    // Correction : ignorer les headers vides ou non-string
    if (!excelColumn || typeof excelColumn !== 'string') return null;
    let bestMatch = null;
    let bestScore = 0;
    // Normaliser la colonne Excel
    const normalizedColumn = excelColumn.toLowerCase().trim();
    // Vérifier chaque champ de la DB
    for (const [fieldName, fieldInfo] of Object.entries(this.databaseFields)) {
      // Vérifier les variantes exactes
      for (const variant of fieldInfo.variants) {
        const similarity = this.calculateSimilarity(normalizedColumn, variant);
        if (similarity > bestScore && similarity >= threshold) {
          bestScore = similarity;
          bestMatch = {
            field: fieldInfo.field,
            confidence: similarity,
            matchType: 'exact_variant',
            originalColumn: excelColumn,
            matchedVariant: variant
          };
        }
      }
      // Vérifier la correspondance par mots-clés
      const columnWords = normalizedColumn.split(/[^\w]+/);
      const keywordMatches = fieldInfo.keywords.filter(keyword => 
        columnWords.some(word => this.calculateSimilarity(word, keyword) > 0.7)
      );
      if (keywordMatches.length > 0) {
        const keywordScore = keywordMatches.length / fieldInfo.keywords.length;
        if (keywordScore > bestScore && keywordScore >= threshold) {
          bestScore = keywordScore;
          bestMatch = {
            field: fieldInfo.field,
            confidence: keywordScore,
            matchType: 'keyword_match',
            originalColumn: excelColumn,
            matchedKeywords: keywordMatches
          };
        }
      }
    }
    
    // Logique spéciale pour organizationPersonNameFirstNameLastName
    if (!bestMatch && normalizedColumn.includes('organization') && 
        (normalizedColumn.includes('person') || normalizedColumn.includes('name'))) {
      const orgScore = this.calculateSimilarity(normalizedColumn, 'organization person name first name last name');
      if (orgScore >= threshold) {
        bestMatch = {
          field: 'organizationPersonNameFirstNameLastName',
          confidence: orgScore,
          matchType: 'special_organization_match',
          originalColumn: excelColumn,
          matchedVariant: 'organization person name first name last name'
        };
      }
    }
    
    return bestMatch;
  }

  /**
   * Génère le mapping intelligent pour toutes les colonnes Excel
   */
  generateIntelligentMapping(excelHeaders) {
    const mapping = {};
    const unmappedColumns = [];
    const missingDbFields = [...Object.keys(this.databaseFields)];
    const mappingReport = {
      totalExcelColumns: excelHeaders.length,
      mappedColumns: 0,
      unmappedColumns: [],
      missingDbFields: [],
      confidence: {}
    };

    // Traiter chaque colonne Excel
    for (const header of excelHeaders) {
      const match = this.findBestMatch(header);
      
      if (match) {
        mapping[header] = match.field;
        mappingReport.mappedColumns++;
        mappingReport.confidence[header] = match.confidence;
        
        // Retirer le champ de la liste des champs manquants
        const fieldIndex = missingDbFields.indexOf(match.field);
        if (fieldIndex > -1) {
          missingDbFields.splice(fieldIndex, 1);
        }
      } else {
        unmappedColumns.push(header);
        mappingReport.unmappedColumns.push(header);
      }
    }

    mappingReport.unmappedColumns = unmappedColumns;
    mappingReport.missingDbFields = missingDbFields;

    return {
      mapping,
      report: mappingReport
    };
  }

  /**
   * Normalise les en-têtes selon le mapping
   */
  normalizeHeaders(headers, mapping) {
    const normalizedData = {};
    
    for (const [excelHeader, value] of Object.entries(headers)) {
      const dbField = mapping[excelHeader];
      if (dbField && value !== undefined && value !== '') {
        normalizedData[dbField] = value;
      }
    }
    
    return normalizedData;
  }

  /**
   * Valide la qualité du mapping généré
   */
  validateMappingQuality(mappingResult) {
    const { mapping, report } = mappingResult;
    
    const qualityScore = {
      overall: 0,
      coverage: 0,
      confidence: 0,
      recommendations: []
    };

    // Score de couverture (colonnes mappées / total)
    qualityScore.coverage = report.mappedColumns / report.totalExcelColumns;
    
    // Score de confiance moyen
    const confidences = Object.values(report.confidence);
    qualityScore.confidence = confidences.length > 0 
      ? confidences.reduce((a, b) => a + b, 0) / confidences.length 
      : 0;

    // Score global
    qualityScore.overall = (qualityScore.coverage * 0.6) + (qualityScore.confidence * 0.4);

    // Recommandations
    if (qualityScore.coverage < 0.7) {
      qualityScore.recommendations.push('Faible couverture de mapping. Vérifiez les noms de colonnes.');
    }
    
    if (qualityScore.confidence < 0.5) {
      qualityScore.recommendations.push('Confiance faible dans les correspondances. Vérification manuelle recommandée.');
    }
    
    if (report.unmappedColumns.length > 0) {
      qualityScore.recommendations.push(`Colonnes non mappées: ${report.unmappedColumns.join(', ')}`);
    }
    
    if (report.missingDbFields.length > 0) {
      qualityScore.recommendations.push(`Champs DB manquants: ${report.missingDbFields.join(', ')}`);
    }

    return qualityScore;
  }

  /**
   * Génère un rapport détaillé du mapping
   */
  generateMappingReport(mappingResult) {
    const { mapping, report } = mappingResult;
    const quality = this.validateMappingQuality(mappingResult);
    
    return {
      summary: {
        totalColumns: report.totalExcelColumns,
        mappedColumns: report.mappedColumns,
        unmappedColumns: report.unmappedColumns.length,
        missingDbFields: report.missingDbFields.length,
        qualityScore: quality.overall,
        confidence: quality.confidence
      },
      mapping: mapping,
      unmappedColumns: report.unmappedColumns,
      missingDbFields: report.missingDbFields,
      quality: quality,
      recommendations: quality.recommendations
    };
  }

  /**
   * Mapping strict : pour chaque ligne Excel, retourne un objet avec tous les champs DB (camelCase),
   * en cherchant la colonne Excel correspondante (insensible à la casse, ignore espaces/underscores).
   * Si la colonne n'existe pas, la valeur est null.
   * @param {Array<Object>} excelRows - Tableau d'objets Excel (clé = nom colonne Excel)
   * @returns {Array<Object>} - Tableau d'objets stricts (clé = champ DB camelCase)
   */
  strictMapExcelRows(excelRows) {
    // Liste stricte des champs DB (camelCase)
    const dbFields = Object.keys(this.databaseFields);
    // Préparer un mapping Excel->DB (insensible à la casse, ignore espaces/underscores)
    function normalize(str) {
      return (str || '').toLowerCase().replace(/\s|_/g, '');
    }
    return excelRows.map(row => {
      const mapped = {};
      for (const dbField of dbFields) {
        // Chercher la colonne Excel correspondante
        let found = null;
        for (const col of Object.keys(row)) {
          if (normalize(col) === normalize(dbField)) {
            found = row[col];
            break;
          }
        }
        mapped[dbField] = (found !== undefined && found !== null && found !== '') ? found : null;
      }
      return mapped;
    });
  }
}

module.exports = new AIMappingService();
