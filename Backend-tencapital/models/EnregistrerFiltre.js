const mongoose = require('mongoose');

const enregistrerFiltreSchema = new mongoose.Schema({
  // Titre du filtre enregistré
  title: {
    type: String,
    required: false,
    trim: true,
    maxlength: 200,
    index: true,
    default: 'Filtre sans nom'
  },
  
  // Industries sélectionnées
  industries: {
    type: String,
    required: false,
    trim: true,
    maxlength: 1000,
    default: ''
  },
  
  // Localisations sélectionnées
  locations: {
    type: String,
    required: false,
    trim: true,
    maxlength: 1000,
    default: ''
  },
  
  // Types d'investisseurs sélectionnés
  investorTypes: {
    type: String,
    required: false,
    trim: true,
    maxlength: 1000,
    default: ''
  },
  
  // Critères de revenus sélectionnés
  revenueCriteria: {
    type: String,
    required: false,
    trim: true,
    maxlength: 1000,
    default: ''
  },
  
  // Stages d'investissement sélectionnés
  investmentStages: {
    type: String,
    required: false,
    trim: true,
    maxlength: 1000,
    default: ''
  },
  
  // Secteurs sélectionnés
  sectors: {
    type: String,
    required: false,
    trim: true,
    maxlength: 1000,
    default: ''
  },
  
  // Statut actif/inactif
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  
  // Utilisateur qui a créé le filtre (optionnel)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    index: true,
    default: null
  }
}, {
  timestamps: true
});

// Index composés pour de meilleures performances
enregistrerFiltreSchema.index({ userId: 1, isActive: 1 });
enregistrerFiltreSchema.index({ title: 'text' });
enregistrerFiltreSchema.index({ createdAt: -1 });

// Méthodes statiques
enregistrerFiltreSchema.statics.createEnregistrerFiltre = async function(filterData) {
  const enregistrerFiltre = new this(filterData);
  return await enregistrerFiltre.save();
};

enregistrerFiltreSchema.statics.findAll = async function(options = {}) {
  const { 
    includeInactive = false, 
    search = '', 
    userId = null,
    sortBy = 'createdAt', 
    sortOrder = 'desc',
    skip = 0,
    limit = 10
  } = options;
  
  const query = {};
  
  if (!includeInactive) {
    query.isActive = true;
  }
  
  if (userId) {
    query.userId = userId;
  }
  
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { industries: { $regex: search, $options: 'i' } },
      { locations: { $regex: search, $options: 'i' } },
      { investorTypes: { $regex: search, $options: 'i' } },
      { revenueCriteria: { $regex: search, $options: 'i' } },
      { investmentStages: { $regex: search, $options: 'i' } },
      { sectors: { $regex: search, $options: 'i' } }
    ];
  }
  
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
  
  return await this.find(query).sort(sort).skip(skip).limit(limit);
};

enregistrerFiltreSchema.statics.search = async function(searchTerm, userId = null) {
  const query = {
    $or: [
      { title: { $regex: searchTerm, $options: 'i' } },
      { industries: { $regex: searchTerm, $options: 'i' } },
      { locations: { $regex: searchTerm, $options: 'i' } },
      { investorTypes: { $regex: searchTerm, $options: 'i' } },
      { revenueCriteria: { $regex: searchTerm, $options: 'i' } },
      { investmentStages: { $regex: searchTerm, $options: 'i' } },
      { sectors: { $regex: searchTerm, $options: 'i' } }
    ],
    isActive: true
  };
  
  if (userId) {
    query.userId = userId;
  }
  
  return await this.find(query).sort({ createdAt: -1 });
};

enregistrerFiltreSchema.statics.getStats = async function(userId = null) {
  const matchQuery = { isActive: true };
  if (userId) {
    matchQuery.userId = userId;
  }
  
  const stats = await this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        totalFilters: { $sum: 1 },
        totalWithIndustries: {
          $sum: { $cond: [{ $ne: ['$industries', ''] }, 1, 0] }
        },
        totalWithLocations: {
          $sum: { $cond: [{ $ne: ['$locations', ''] }, 1, 0] }
        },
        totalWithInvestorTypes: {
          $sum: { $cond: [{ $ne: ['$investorTypes', ''] }, 1, 0] }
        },
        totalWithRevenueCriteria: {
          $sum: { $cond: [{ $ne: ['$revenueCriteria', ''] }, 1, 0] }
        },
        totalWithInvestmentStages: {
          $sum: { $cond: [{ $ne: ['$investmentStages', ''] }, 1, 0] }
        },
        totalWithSectors: {
          $sum: { $cond: [{ $ne: ['$sectors', ''] }, 1, 0] }
        }
      }
    }
  ]);
  
  return stats[0] || {
    totalFilters: 0,
    totalWithIndustries: 0,
    totalWithLocations: 0,
    totalWithInvestorTypes: 0,
    totalWithRevenueCriteria: 0,
    totalWithInvestmentStages: 0,
    totalWithSectors: 0
  };
};

// Méthodes d'instance
enregistrerFiltreSchema.methods.updateEnregistrerFiltre = async function(updateData) {
  const allowedFields = [
    'title', 
    'industries', 
    'locations', 
    'investorTypes', 
    'revenueCriteria', 
    'investmentStages', 
    'sectors',
    'isActive'
  ];
  
  for (const [key, value] of Object.entries(updateData)) {
    if (allowedFields.includes(key) && value !== undefined) {
      this[key] = value;
    }
  }
  
  return await this.save();
};

enregistrerFiltreSchema.methods.deactivate = async function() {
  this.isActive = false;
  return await this.save();
};

enregistrerFiltreSchema.methods.activate = async function() {
  this.isActive = true;
  return await this.save();
};

enregistrerFiltreSchema.methods.deleteEnregistrerFiltre = async function() {
  this.isActive = false;
  return await this.save();
};

// Middleware pre-save pour validation
enregistrerFiltreSchema.pre('save', function(next) {
  // Normaliser le titre
  if (this.title) {
    this.title = this.title.trim();
  }
  
  // Normaliser tous les champs de filtres
  const filterFields = ['industries', 'locations', 'investorTypes', 'revenueCriteria', 'investmentStages', 'sectors'];
  filterFields.forEach(field => {
    if (this[field]) {
      this[field] = this[field].trim();
    }
  });
  
  next();
});

// Middleware post-save pour logging
enregistrerFiltreSchema.post('save', function(doc) {
  console.log(`EnregistrerFiltre saved: ${doc.title} (ID: ${doc._id})`);
});

const EnregistrerFiltre = mongoose.model('EnregistrerFiltre', enregistrerFiltreSchema);

module.exports = EnregistrerFiltre;
