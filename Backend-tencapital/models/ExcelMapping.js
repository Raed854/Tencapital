const mongoose = require('mongoose');

const excelMappingSchema = new mongoose.Schema({
  // Données de base de l'investisseur
  investorType: {
    type: String,
    trim: true
  },
  sector: {
    type: String,
    trim: true
  },
  industries: {
    type: String,
    trim: true
  },
  investmentStage: {
    type: String,
    trim: true
  },
  revenueCriteria: {
    type: String,
    trim: true
  },
  organizationPersonName: {
    type: String,
    trim: true
  },
  firstName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  description: {
    type: String
  },
  organizationPersonNameFirstNameLastName: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  phoneNumber: {
    type: String,
    trim: true
  },
  website: {
    type: String,
    trim: true
  },
  linkedin: {
    type: String,
    trim: true
  },
  
  // Données spécifiques au formulaire
  companyName: {
    type: String,
    trim: true
  },
  contactEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  investmentAmount: {
    type: Number
  },
  investmentDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending'],
    default: 'pending'
  },
  
  // Métadonnées
  sourceFile: {
    type: String,
    required: true
  },
  rowNumber: {
    type: Number,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  validationErrors: [{
    field: String,
    message: String,
    value: mongoose.Schema.Types.Mixed
  }],
  isProcessed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index pour les performances
excelMappingSchema.index({ userId: 1 });
excelMappingSchema.index({ sourceFile: 1 });
excelMappingSchema.index({ isProcessed: 1 });
excelMappingSchema.index({ status: 1 });

// Méthodes statiques pour le mapping intelligent
excelMappingSchema.statics.mapExcelColumns = function(excelData, mappingConfig = {}) {
  const defaultMapping = {
    // Mapping par défaut
    'Investor Type': 'investorType',
    'Investor_Type': 'investorType',
    'Type': 'investorType',
    
    'Sector': 'sector',
    'Industry': 'sector',
    'Business Sector': 'sector',
    
    'Industries': 'industries',
    'Industry Focus': 'industries',
    'Target Industries': 'industries',
    
    'Investment Stage': 'investmentStage',
    'Stage': 'investmentStage',
    'Investment_Stage': 'investmentStage',
    
    'Revenue Criteria': 'revenueCriteria',
    'Revenue_Criteria': 'revenueCriteria',
    'Revenue Requirements': 'revenueCriteria',
    
    'Organization Name': 'organizationPersonName',
    'Organization': 'organizationPersonName',
    'Company Name': 'companyName',
    'Company': 'companyName',
    
    'First Name': 'firstName',
    'First_Name': 'firstName',
    'Given Name': 'firstName',
    
    'Last Name': 'lastName',
    'Last_Name': 'lastName',
    'Surname': 'lastName',
    'Family Name': 'lastName',
    
    'Email': 'email',
    'Contact Email': 'contactEmail',
    'Email Address': 'email',
    'E-mail': 'email',
    
    'Description': 'description',
    'Notes': 'description',
    'Comments': 'description',
    
    'Location': 'location',
    'City': 'location',
    'Address': 'location',
    
    'Phone': 'phoneNumber',
    'Phone Number': 'phoneNumber',
    'Contact Number': 'phoneNumber',
    'Telephone': 'phoneNumber',
    
    'Website': 'website',
    'Web Site': 'website',
    'URL': 'website',
    
    'LinkedIn': 'linkedin',
    'LinkedIn Profile': 'linkedin',
    'LinkedIn URL': 'linkedin',
    
    'Investment Amount': 'investmentAmount',
    'Amount': 'investmentAmount',
    'Investment_Amount': 'investmentAmount',
    'Funding Amount': 'investmentAmount',
    
    'Investment Date': 'investmentDate',
    'Date': 'investmentDate',
    'Investment_Date': 'investmentDate',
    'Funding Date': 'investmentDate'
  };

  const finalMapping = { ...defaultMapping, ...mappingConfig };
  
  return excelData.map((row, index) => {
    const mappedRow = {
      rowNumber: index + 1,
      validationErrors: []
    };

    // Appliquer le mapping
    Object.keys(row).forEach(excelColumn => {
      const mappedField = finalMapping[excelColumn];
      if (mappedField && row[excelColumn] !== undefined && row[excelColumn] !== '') {
        mappedRow[mappedField] = row[excelColumn];
      }
    });

    return mappedRow;
  });
};

// Méthode pour valider les données mappées
excelMappingSchema.statics.validateMappedData = function(mappedData) {
  const validationRules = {
    email: (value) => {
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return 'Invalid email format';
      }
      return null;
    },
    phoneNumber: (value) => {
      if (value && !/^[\+]?[1-9][\d]{0,15}$/.test(value.replace(/[\s\-\(\)]/g, ''))) {
        return 'Invalid phone number format';
      }
      return null;
    },
    website: (value) => {
      if (value && !/^https?:\/\/.+/.test(value)) {
        return 'Website must start with http:// or https://';
      }
      return null;
    },
    linkedin: (value) => {
      if (value && !/^https?:\/\/(www\.)?linkedin\.com\/.+/.test(value)) {
        return 'LinkedIn URL must be a valid LinkedIn profile';
      }
      return null;
    },
    investmentAmount: (value) => {
      if (value && (isNaN(value) || value < 0)) {
        return 'Investment amount must be a positive number';
      }
      return null;
    },
    investmentDate: (value) => {
      if (value && isNaN(Date.parse(value))) {
        return 'Invalid date format';
      }
      return null;
    }
  };

  return mappedData.map(row => {
    const errors = [];
    
    Object.keys(validationRules).forEach(field => {
      if (row[field] !== undefined) {
        const error = validationRules[field](row[field]);
        if (error) {
          errors.push({
            field,
            message: error,
            value: row[field]
          });
        }
      }
    });

    return {
      ...row,
      validationErrors: errors
    };
  });
};

// Méthode pour normaliser les données
excelMappingSchema.statics.normalizeData = function(mappedData) {
  return mappedData.map(row => {
    const normalized = { ...row };

    // Normaliser les emails
    if (normalized.email) {
      normalized.email = normalized.email.toLowerCase().trim();
    }
    if (normalized.contactEmail) {
      normalized.contactEmail = normalized.contactEmail.toLowerCase().trim();
    }

    // Normaliser les noms
    if (normalized.firstName) {
      normalized.firstName = normalized.firstName.trim();
    }
    if (normalized.lastName) {
      normalized.lastName = normalized.lastName.trim();
    }

    // Normaliser les URLs
    if (normalized.website && !normalized.website.startsWith('http')) {
      normalized.website = 'https://' + normalized.website;
    }
    if (normalized.linkedin && !normalized.linkedin.startsWith('http')) {
      normalized.linkedin = 'https://' + normalized.linkedin;
    }

    // Convertir les montants en nombres
    if (normalized.investmentAmount && typeof normalized.investmentAmount === 'string') {
      normalized.investmentAmount = parseFloat(normalized.investmentAmount.replace(/[^0-9.-]/g, ''));
    }

    // Convertir les dates
    if (normalized.investmentDate && typeof normalized.investmentDate === 'string') {
      normalized.investmentDate = new Date(normalized.investmentDate);
    }

    return normalized;
  });
};

const ExcelMapping = mongoose.model('ExcelMapping', excelMappingSchema);

module.exports = ExcelMapping;
