import React, { useState, useEffect, useCallback, useMemo } from 'react';
import * as XLSX from 'xlsx';
import axios from 'axios';
import authService from '../../services/authService';
import { API_CONFIG, configureAxios } from '../../config/apiConfig';
import './Dashboard.css';
import Sidebar from '../Sidebar/Sidebar';
import AddInvestor from '../AddInvestor/AddInvestor';
import { useAlertInit } from '../../hooks/useAlertInit';

// Debounce utility function
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Configure API base URL from centralized config
const API_BASE_URL = API_CONFIG.BASE_URL;

/**
 * Error handling utility functions
 * Provides consistent error formatting and handling across the application
 */
const ErrorHandler = {
  /**
   * Formats HTTP error responses into user-friendly messages
   * @param {Response} response - The fetch response object
   * @param {string} defaultMessage - Default error message if status code is unknown
   * @returns {Promise<string>} Formatted error message
   */
  async formatHttpError(response, defaultMessage = 'An error occurred') {
    let errorMessage = defaultMessage;
    
    // Handle specific HTTP status codes
    switch (response.status) {
      case 400:
        errorMessage = 'Bad Request: Invalid data provided. Please check your input.';
        break;
      case 401:
        errorMessage = 'Authentication failed. Please log in again.';
        break;
      case 403:
        errorMessage = 'Access denied. You do not have permission to perform this action.';
        break;
      case 404:
        errorMessage = 'Resource not found. The requested item may have been deleted.';
        break;
      case 409:
        errorMessage = 'Conflict: This action conflicts with existing data.';
        break;
      case 422:
        errorMessage = 'Validation error: Please check your input data.';
        break;
      case 500:
        errorMessage = 'Server error: Please try again later or contact support.';
        break;
      case 503:
        errorMessage = 'Service unavailable: The server is temporarily unavailable.';
        break;
      default:
        errorMessage = `Error ${response.status}: ${response.statusText || defaultMessage}`;
    }
    
    // Try to extract additional error details from response body
    try {
      const errorData = await response.json();
      if (errorData.message) {
        errorMessage += ` - ${errorData.message}`;
      } else if (errorData.error) {
        errorMessage += ` - ${errorData.error}`;
      }
      // Handle validation errors array
      if (errorData.details && Array.isArray(errorData.details)) {
        const validationErrors = errorData.details.join(', ');
        errorMessage += ` (${validationErrors})`;
      }
    } catch (parseError) {
      // If response is not JSON, try to get text
      try {
        const errorText = await response.text();
        if (errorText && errorText.length < 200) {
          errorMessage += ` - ${errorText}`;
        }
      } catch (textError) {
        console.warn('Could not parse error response:', textError);
      }
    }
    
    return errorMessage;
  },

  /**
   * Handles network errors (connection issues, timeouts, etc.)
   * @param {Error} error - The error object
   * @returns {string} User-friendly error message
   */
  formatNetworkError(error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return 'Network error: Unable to connect to the server. Please check your internet connection.';
    }
    if (error.message.includes('timeout')) {
      return 'Request timeout: The server took too long to respond. Please try again.';
    }
    return `Network error: ${error.message}`;
  },

  /**
   * Logs error details for debugging while keeping user message simple
   * @param {string} context - Context where error occurred (e.g., 'fetchInvestors', 'deleteInvestor')
   * @param {Error|Response} error - The error object or response
   * @param {Object} additionalInfo - Additional context information
   */
  logError(context, error, additionalInfo = {}) {
    console.error(`❌ Error in ${context}:`, {
      timestamp: new Date().toISOString(),
      error: error.message || error,
      status: error.status,
      stack: error.stack,
      ...additionalInfo
    });
  }
};

const Dashboard = () => {
  // Initialize modern alert system
  const { showSuccess, showError, showWarning, showInfo } = useAlertInit();

  // Handler to manually trigger saving mapped data (for already mapped data)
  const handleManualSaveMapped = () => {
    if (mappingPreview && Array.isArray(mappingPreview.mappedData) && mappingPreview.mappedData.length > 0) {
      saveMappedData(mappingPreview.mappedData);
    } else {
      showWarning('Aucune donnée mappée à enregistrer.');
    }
  };

  // Save mapped data to backend
  const saveMappedData = async (mappedArray) => {
    if (!Array.isArray(mappedArray) || mappedArray.length === 0) {
      showWarning('Aucune donnée mappée à enregistrer.');
      return;
    }
    try {
      setImportProgress(98);
      const token = authService.getToken();
      const userId = authService.getUserId() || '';
      if (!userId) {
        showError('Erreur : userId manquant. Veuillez vous reconnecter ou contacter le support.');
        setImportResults({ success: false, message: 'userId manquant, enregistrement impossible.' });
        return;
      }
      // Ajoute userId à chaque objet du tableau mappedArray
      const mappedWithUserId = mappedArray.map(obj => ({ ...obj, userId }));
      const bodyToSend = { mapped: mappedWithUserId, userId };
      console.log('Body sent to /excel/save-mapped:', bodyToSend);
      const response = await fetch(`${API_BASE_URL}/excel/save-mapped`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(bodyToSend)
      });
      const result = await response.json();
      if (response.ok && result.success) {
        showSuccess(`Données enregistrées avec succès ! (${result.insertedCount} éléments insérés)`);
        setImportResults({
          success: true,
          message: `Données enregistrées (${result.insertedCount} éléments).`,
          insertedCount: result.insertedCount
        });
      } else {
        showError(`Erreur lors de l'enregistrement : ${result.message || 'Erreur inconnue.'}`);
        setImportResults({
          success: false,
          message: result.message || 'Erreur lors de l\'enregistrement',
          error: result.error
        });
      }
    } catch (error) {
      showError(`Erreur réseau lors de l'enregistrement : ${error.message}`);
      setImportResults({
        success: false,
        message: 'Erreur réseau lors de l\'enregistrement',
        error: error.message
      });
    }
  };
  const [activeTab, setActiveTab] = useState('unapproved');
  const [filters, setFilters] = useState({
    industry: '',
    investmentStage: '',
    location: '',
    revenueCriteria: '',
    investorType: '',
    sector: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [showAddInvestorModal, setShowAddInvestorModal] = useState(false);
  const [showInvestorDetailsModal, setShowInvestorDetailsModal] = useState(false);
  const [selectedInvestorDetails, setSelectedInvestorDetails] = useState(null);
  const [investorNote, setInvestorNote] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [isEditingInvestor, setIsEditingInvestor] = useState(false);
  const [editedInvestorData, setEditedInvestorData] = useState(null);
  const [isUpdatingInvestor, setIsUpdatingInvestor] = useState(false);
  const [isDeletingInvestor, setIsDeletingInvestor] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newInvestor, setNewInvestor] = useState({
    investorType: '',
    sector: '',
    industries: '',
    investmentStage: '',
    revenueCriteria: '',
    organizationPersonName: '',
    firstName: '',
    lastName: '',
    email: '',
    description: '',
    organizationPersonNameFirstLastName: '',
    location: '',
    phoneNumber: '',
    website: '',
    linkedin: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [investors, setInvestors] = useState([]);
  const [isLoadingInvestors, setIsLoadingInvestors] = useState(false);
  const [filteredInvestors, setFilteredInvestors] = useState([]);
  const [isFiltered, setIsFiltered] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importPreview, setImportPreview] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  
  // AI Excel Import States - Enhanced
  const [importStep, setImportStep] = useState('upload'); // upload, extracting, analyzing, mapping_preview, validating, importing
  const [isDragOver, setIsDragOver] = useState(false);
  const [headerAnalysis, setHeaderAnalysis] = useState(null);
  const [aiMapping, setAiMapping] = useState(null);
  const [customMapping, setCustomMapping] = useState({});
  const [qualityScore, setQualityScore] = useState(0);
  const [mappingSuggestions, setMappingSuggestions] = useState([]);
  const [importProgress, setImportProgress] = useState(0);
  const [excelData, setExcelData] = useState([]); // Données Excel extraites
  const [validationResults, setValidationResults] = useState(null); // Résultats de validation
  const [validationErrors, setValidationErrors] = useState([]); // Erreurs de validation
  const [importResults, setImportResults] = useState(null); // Résultats d'importation
  
  // New Enhanced States
  const [isExtracting, setIsExtracting] = useState(false);
  
  // Import CSV 2 States - Automatic AI mapping
  const [showImportCSV2Modal, setShowImportCSV2Modal] = useState(false);
  const [importCSV2File, setImportCSV2File] = useState(null);
  const [isImportingCSV2, setIsImportingCSV2] = useState(false);
  const [importCSV2Results, setImportCSV2Results] = useState(null);
  const [isDragOverCSV2, setIsDragOverCSV2] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeSummaryTab, setActiveSummaryTab] = useState('Industries');
  const [extractedHeaders, setExtractedHeaders] = useState([]);
  const [rawExcelData, setRawExcelData] = useState([]);
  const [mappingPreview, setMappingPreview] = useState(null);
  const [userMappingEdits, setUserMappingEdits] = useState({});
  const [useAIMapping, setUseAIMapping] = useState(true);

  // État pour les données extraites du fichier Excel
  const [extractedData, setExtractedData] = useState({
    Industries: [],
    Locations: [],
    Sectors: [],
    "Investor Types": [],
    "Investment Stages": [],
    "Revenue Criteria": []
  });
  const [isAnalyzingFile, setIsAnalyzingFile] = useState(false);

  // Fonction pour analyser le fichier Excel et mapper les données
  const analyzeExcelFile = async (file) => {
    try {
      setIsAnalyzingFile(true);
      console.log('Analyzing Excel file:', file.name);
      
      // Simuler l'analyse du fichier Excel avec mapping
      // Dans un vrai projet, vous analyseriez le contenu du fichier
      const mockExcelData = [
        { organization: "TechCorp", location: "Seattle, WA", industries: "Technology,Software", investorType: "Venture Capital", investmentStage: "Series A", revenueCriteria: "$10M-$50M" },
        { organization: "HealthStart", location: "Austin, TX", industries: "Healthcare,Biotech", investorType: "Private Equity", investmentStage: "Growth", revenueCriteria: "$50M-$100M" },
        { organization: "FinTech Inc", location: "New York, NY", industries: "Finance,Fintech", investorType: "Angel Investors", investmentStage: "Seed", revenueCriteria: "$1M-$10M" },
        { organization: "AI Solutions", location: "San Francisco, CA", industries: "Technology,AI/ML", investorType: "Corporate VC", investmentStage: "Series B", revenueCriteria: "$100M+" },
        { organization: "Green Energy", location: "Denver, CO", industries: "Energy,CleanTech", investorType: "Growth Equity", investmentStage: "Pre-Seed", revenueCriteria: "Pre-revenue" }
      ];

      // Analyser et mapper les données
      const mappedData = {
        Industries: [],
        Locations: [],
        Sectors: [],
        "Investor Types": [],
        "Investment Stages": [],
        "Revenue Criteria": []
      };

      // Extraire et compter les industries
      const industryCounts = {};
      const locationCounts = {};
      const investorTypeCounts = {};
      const investmentStageCounts = {};
      const revenueCriteriaCounts = {};

      mockExcelData.forEach(row => {
        // Industries
        if (row.industries) {
          row.industries.split(',').forEach(industry => {
            const cleanIndustry = industry.trim();
            industryCounts[cleanIndustry] = (industryCounts[cleanIndustry] || 0) + 1;
          });
        }

        // Locations
        if (row.location) {
          locationCounts[row.location] = (locationCounts[row.location] || 0) + 1;
        }

        // Investor Types
        if (row.investorType) {
          investorTypeCounts[row.investorType] = (investorTypeCounts[row.investorType] || 0) + 1;
        }

        // Investment Stages
        if (row.investmentStage) {
          investmentStageCounts[row.investmentStage] = (investmentStageCounts[row.investmentStage] || 0) + 1;
        }

        // Revenue Criteria
        if (row.revenueCriteria) {
          revenueCriteriaCounts[row.revenueCriteria] = (revenueCriteriaCounts[row.revenueCriteria] || 0) + 1;
        }
      });

      // Convertir en format d'affichage avec mapping
      mappedData.Industries = Object.entries(industryCounts).map(([name, count]) => ({
        name,
        count,
        isNew: Math.random() > 0.5, // Simuler si c'est nouveau ou existant
        mappedTo: name, // Valeur mappée par défaut
        originalValue: name
      }));

      mappedData.Locations = Object.entries(locationCounts).map(([name, count]) => ({
        name,
        count,
        isNew: Math.random() > 0.5,
        mappedTo: name,
        originalValue: name
      }));

      mappedData["Investor Types"] = Object.entries(investorTypeCounts).map(([name, count]) => ({
        name,
        count,
        isNew: Math.random() > 0.5,
        mappedTo: name,
        originalValue: name
      }));

      mappedData["Investment Stages"] = Object.entries(investmentStageCounts).map(([name, count]) => ({
        name,
        count,
        isNew: Math.random() > 0.5,
        mappedTo: name,
        originalValue: name
      }));

      mappedData["Revenue Criteria"] = Object.entries(revenueCriteriaCounts).map(([name, count]) => ({
        name,
        count,
        isNew: Math.random() > 0.5,
        mappedTo: name,
        originalValue: name
      }));

      // Simuler un délai d'analyse
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setExtractedData(mappedData);
      console.log('Excel data mapped:', mappedData);
      
    } catch (error) {
      console.error('Error analyzing Excel file:', error);
    } finally {
      setIsAnalyzingFile(false);
    }
  };

  const handleSummaryTabClick = (tabName) => {
    setActiveSummaryTab(tabName);
  };
  const [mappingHistory, setMappingHistory] = useState([]);
  const [currentAnalysisProgress, setCurrentAnalysisProgress] = useState(0);
  const [analysisMessages, setAnalysisMessages] = useState([]);
  const [mappingConfidence, setMappingConfidence] = useState({});
  const [autoMappingEnabled, setAutoMappingEnabled] = useState(true);
  const [showMappingTooltips, setShowMappingTooltips] = useState(true);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Selection states
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [duplicateInvestors, setDuplicateInvestors] = useState([]);

  // Upload progress states
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Filter options states
  const [filterOptions, setFilterOptions] = useState({
    sectors: [],
    investorTypes: [],
    locations: [],
    industries: [],
    investmentStages: [],
    revenueCriteria: []
  });

  // Dashboard stats states
  const [dashboardStats, setDashboardStats] = useState({
    totalInvestors: 0,
    approvedInvestors: 0,
    pendingInvestors: 0,
    rejectedInvestors: 0,
    sectors: [],
    investorTypes: [],
    locations: [],
    industries: [],
    investmentStages: [],
    revenueCriteria: []
  });

  // Sample data for approved investors (fallback)
  const sampleApprovedInvestors = [
    {
      id: 1,
      organization: 'TechVentures Capital',
      email: 'john@techventures.com',
      firstName: 'John',
      lastName: 'Smith',
      status: 'Approved',
      location: 'San Francisco, CA',
      revenueCriteria: '$10M–$50M',
      industries: ['AI', 'Blockchain'],
      sector: 'Technology',
      investorType: 'Venture Capitalist',
      investmentStage: 'Series A',
      description: 'Focus on early-stage AI and blockchain startups'
    },
    {
      id: 2,
      organization: 'Green Energy Fund',
      email: 'sarah@greenenergy.com',
      firstName: 'Sarah',
      lastName: 'Johnson',
      status: 'Approved',
      location: 'New York, NY',
      revenueCriteria: '$50M–$100M',
      industries: ['Clean Energy', 'Biotech'],
      sector: 'Energy',
      investorType: 'Corporate Investor',
      investmentStage: 'Series B',
      description: 'Sustainable energy and biotech investments'
    },
    {
      id: 3,
      organization: 'EduTech Angels',
      email: 'mike@edutech.com',
      firstName: 'Mike',
      lastName: 'Wilson',
      status: 'Approved',
      location: 'Boston, MA',
      revenueCriteria: 'Under $1M',
      industries: ['Education', 'AI'],
      sector: 'Education',
      investorType: 'Angel',
      investmentStage: 'Seed',
      description: 'Early-stage education technology investments'
    }
  ];

  const sampleUnapprovedInvestors = [
    {
      id: 4,
      organization: 'Future Finance LLC',
      email: 'alex@futurefinance.com',
      firstName: 'Alex',
      lastName: 'Brown',
      status: 'Pending',
      location: 'Chicago, IL',
      revenueCriteria: '$1M–$10M',
      industries: ['Fintech'],
      sector: 'Finance',
      investorType: 'Venture Capitalist',
      investmentStage: 'Series A',
      description: 'Financial technology and payment solutions'
    }
  ];

  /**
   * Helper function to process API response and extract investors data
   * Handles multiple response formats from the backend API
   * @param {Response} response - Fetch response object
   * @param {string} token - Authentication token (for logging purposes)
   * @returns {Promise<boolean>} True if investors were successfully extracted, false otherwise
   */
  const handleApiResponse = async (response, token) => {
    if (!response.ok) {
      return false;
    }

    try {
      const data = await response.json();
      
      // Handle different response structures
      // The API might return data in various formats, so we check multiple possibilities
      let investorsData = [];
      
      if (Array.isArray(data)) {
        // Format 1: Direct array response
        investorsData = data;
      } else if (data && Array.isArray(data.investors)) {
        // Format 2: Nested investors array (data.investors)
        investorsData = data.investors;
      } else if (data && Array.isArray(data.data)) {
        // Format 3: Nested data array (data.data)
        investorsData = data.data;
      } else if (data && data.results && Array.isArray(data.results)) {
        // Format 4: Results array (data.results)
        investorsData = data.results;
      } else {
        // Unknown format - log warning and use empty array
        console.warn('⚠️ Unknown API response structure:', Object.keys(data || {}));
        investorsData = [];
      }
      
      // Update state with extracted investors
      setInvestors(investorsData);
      
      // Log success or warning
      if (investorsData.length > 0) {
        console.log(`✅ Successfully loaded ${investorsData.length} investors from API`);
      } else {
        console.log('⚠️ No investors found in API response');
      }
      
      return true;
    } catch (error) {
      // Handle JSON parsing errors
      ErrorHandler.logError('handleApiResponse', error, { responseStatus: response.status });
      console.error('Failed to parse API response:', error);
      return false;
    }
  };

  /**
   * Helper functions for status mapping and conversion
   * Converts various status formats to consistent text representation
   */
  
  /**
   * Converts status value to human-readable text
   * Handles numeric (0, 1, 2) and string ('pending', 'approved', 'rejected') formats
   * @param {any} status - Status value (number or string)
   * @returns {string} Human-readable status text
   */
  const getStatusText = (status) => {
    // Handle null/undefined
    if (status === null || status === undefined) return 'Pending';
    
    // Convert to string for comparison
    const statusStr = String(status).toLowerCase();
    
    if (statusStr === '0' || statusStr === 'pending') return 'Pending';
    if (statusStr === '1' || statusStr === 'approved') return 'Approved';
    if (statusStr === '2' || statusStr === 'rejected') return 'Rejected';
    
    // If it's already a readable string, capitalize it
    if (typeof status === 'string') {
      return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    }
    
    return 'Pending';
  };

  /**
   * Converts status value to CSS class name
   * Used for styling status badges and indicators
   * @param {any} status - Status value (number or string)
   * @returns {string} CSS class name (pending, approved, rejected)
   */
  const getStatusClass = (status) => {
    // Handle null/undefined
    if (status === null || status === undefined) return 'pending';
    
    // Convert to string for comparison
    const statusStr = String(status).toLowerCase();
    
    if (statusStr === '0' || statusStr === 'pending') return 'pending';
    if (statusStr === '1' || statusStr === 'approved') return 'approved';
    if (statusStr === '2' || statusStr === 'rejected') return 'rejected';
    
    // If it's already a readable string, use it
    if (typeof status === 'string') {
      return status.toLowerCase();
    }
    
    return 'pending';
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  /**
   * Applies advanced filters received from the sidebar API
   * Processes filter data from the backend and updates the filtered investors list
   * Handles multiple response formats and validates data structure
   * @param {Object|Array} filterData - Filter data from API (can be array or object with nested arrays)
   * @returns {void}
   */
  const handleApplyFilters = (filterData) => {
    // Validate filter data first
    if (!validateFilterData(filterData)) {
      console.log('❌ Invalid filter data - clearing filters');
      setFilteredInvestors([]);
      setIsFiltered(false);
      showWarning('Invalid filter data received. Filters cleared.');
      return;
    }
    
    // Extract investors from filtered data - handle multiple API response formats
    let investorsList = [];
    try {
      if (Array.isArray(filterData)) {
        // Format 1: Direct array response
        investorsList = filterData;
      } else if (filterData && filterData.investors && Array.isArray(filterData.investors)) {
        // Format 2: Nested investors array (filterData.investors)
        investorsList = filterData.investors;
      } else if (filterData && filterData.data && Array.isArray(filterData.data)) {
        // Format 3: Nested data array (filterData.data)
        investorsList = filterData.data;
      } else if (filterData && filterData.results && Array.isArray(filterData.results)) {
        // Format 4: Results array (filterData.results)
        investorsList = filterData.results;
      } else {
        // Unknown format - try to find any array in the object
        const possibleArrays = Object.values(filterData).filter(item => Array.isArray(item));
        if (possibleArrays.length > 0) {
          investorsList = possibleArrays[0];
        } else {
          throw new Error('No valid array found in filter data');
        }
      }
      
      if (investorsList.length > 0) {
        setFilteredInvestors(investorsList);
        setIsFiltered(true);
        console.log(`✅ Applied advanced filters: ${investorsList.length} investors found`);
      } else {
        setFilteredInvestors([]);
        setIsFiltered(true);
        showInfo('No investors found matching the selected filters');
      }
    } catch (error) {
      ErrorHandler.logError('handleApplyFilters', error, { filterData });
      setFilteredInvestors([]);
      setIsFiltered(false);
      showError(`Error applying filters: ${error.message}`);
    }
  };

  /**
   * Clears all active filters and resets to show all investors
   * Resets filter state, search term, and search results
   * @returns {void}
   */
  const handleClearFilters = () => {
    setFilteredInvestors([]);
    setIsFiltered(false);
    setSearchTerm('');
    setSearchResults([]);
    setSearchError(null);
    console.log('🧹 Cleared all filters - showing all investors');
    showInfo('Filters cleared');
  };

  /**
   * Forces a refresh of investor data from the API
   * Useful when filters show 0 results or data seems stale
   * @returns {Promise<void>}
   */
  const handleForceRefresh = async () => {
    console.log('🔄 Force refreshing data...');
    setIsLoadingInvestors(true);
    try {
      await fetchInvestors();
      console.log('✅ Data refreshed successfully');
      showSuccess('Data refreshed successfully');
    } catch (error) {
      ErrorHandler.logError('handleForceRefresh', error);
      const errorMsg = ErrorHandler.formatNetworkError(error);
      showError(`Error refreshing data: ${errorMsg}`);
    } finally {
      setIsLoadingInvestors(false);
    }
  };

  // Configure axios on component mount
  useEffect(() => {
    configureAxios(axios);
  }, []);

  // Update note when investor details change
  useEffect(() => {
    if (selectedInvestorDetails) {
      setInvestorNote(selectedInvestorDetails.note || selectedInvestorDetails.description || '');
      setIsEditingInvestor(false);
      setEditedInvestorData(null);
    } else {
      setInvestorNote('');
      setIsEditingInvestor(false);
      setEditedInvestorData(null);
    }
  }, [selectedInvestorDetails]);

  /**
   * Saves a note for the selected investor
   * Updates the investor's note field via API
   * @returns {Promise<void>}
   */
  const handleSaveNote = async () => {
    if (!selectedInvestorDetails) {
      showError('No investor selected');
      return;
    }

    const investorId = selectedInvestorDetails.id || selectedInvestorDetails._id || selectedInvestorDetails.ID;
    if (!investorId) {
      showError('Investor ID not found. Please refresh and try again.');
      return;
    }

    // Validate note content
    if (!investorNote || investorNote.trim().length === 0) {
      showWarning('Note cannot be empty');
      return;
    }

    setIsSavingNote(true);
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }

      const response = await axios.put(`investors/${investorId}/note`, {
        note: investorNote.trim()
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data && response.data.success) {
        showSuccess('Note saved successfully!');
        // Update local state with new note
        setSelectedInvestorDetails(prev => ({
          ...prev,
          note: investorNote.trim(),
          updatedAt: response.data.investor?.updatedAt || new Date().toISOString()
        }));
      } else {
        throw new Error(response.data?.message || 'Failed to save note');
      }
    } catch (error) {
      ErrorHandler.logError('handleSaveNote', error, { investorId });
      
      if (error.response) {
        // HTTP error response - format using ErrorHandler
        const errorMsg = await ErrorHandler.formatHttpError(error.response, 'Failed to save note');
        showError(errorMsg);
      } else if (error.request) {
        // Network error
        const errorMsg = ErrorHandler.formatNetworkError(error);
        showError(`Network error: ${errorMsg}`);
      } else {
        // Other error
        showError(`Error saving note: ${error.message}`);
      }
    } finally {
      setIsSavingNote(false);
    }
  };

  // Handle click on organization cell to show investor details
  const handleOrganizationClick = (investor) => {
    console.log('👆 Organization clicked:', investor);
    setSelectedInvestorDetails(investor);
    setShowInvestorDetailsModal(true);
  };

  // Close investor details modal
  const handleCloseInvestorDetails = () => {
    setShowInvestorDetailsModal(false);
    setSelectedInvestorDetails(null);
    setInvestorNote('');
    setIsEditingInvestor(false);
    setEditedInvestorData(null);
    setShowDeleteConfirm(false);
  };

  // Handle edit investor
  const handleEditInvestor = () => {
    setIsEditingInvestor(true);
    setEditedInvestorData({
      ...selectedInvestorDetails,
      industries: typeof selectedInvestorDetails.industries === 'string' 
        ? selectedInvestorDetails.industries 
        : selectedInvestorDetails.industries?.join(', ') || ''
    });
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setIsEditingInvestor(false);
    setEditedInvestorData(null);
  };

  // Handle update investor
  const handleUpdateInvestor = async () => {
    if (!selectedInvestorDetails || !editedInvestorData) return;

    const investorId = selectedInvestorDetails.id || selectedInvestorDetails._id || selectedInvestorDetails.ID;
    if (!investorId) {
      showError('Investor ID not found');
      return;
    }

    setIsUpdatingInvestor(true);
    try {
      const token = authService.getToken();
      
      // Prepare update payload - only include fields that have values
      // Based on backend validation, phone and website are not allowed in PUT request
      // Only send fields that are definitely supported: firstName, lastName, email, description
      const updatePayload = {};
      
      // Core allowed fields
      if (editedInvestorData.firstName && editedInvestorData.firstName.trim()) {
        updatePayload.firstName = editedInvestorData.firstName.trim();
      }
      if (editedInvestorData.lastName && editedInvestorData.lastName.trim()) {
        updatePayload.lastName = editedInvestorData.lastName.trim();
      }
      if (editedInvestorData.email && editedInvestorData.email.trim()) {
        updatePayload.email = editedInvestorData.email.trim();
      }
      if (editedInvestorData.description && editedInvestorData.description.trim()) {
        updatePayload.description = editedInvestorData.description.trim();
      }
      
      // Try other fields that might be supported (but remove phone and website)
      if (editedInvestorData.location && editedInvestorData.location.trim()) {
        updatePayload.location = editedInvestorData.location.trim();
      }
      if (editedInvestorData.linkedin && editedInvestorData.linkedin.trim()) {
        updatePayload.linkedin = editedInvestorData.linkedin.trim();
      }
      if (editedInvestorData.investorType && editedInvestorData.investorType.trim()) {
        updatePayload.investorType = editedInvestorData.investorType.trim();
      }
      if (editedInvestorData.sector && editedInvestorData.sector.trim()) {
        updatePayload.sector = editedInvestorData.sector.trim();
      }
      if (editedInvestorData.investmentStage && editedInvestorData.investmentStage.trim()) {
        updatePayload.investmentStage = editedInvestorData.investmentStage.trim();
      }
      if (editedInvestorData.revenueCriteria && editedInvestorData.revenueCriteria.trim()) {
        updatePayload.revenueCriteria = editedInvestorData.revenueCriteria.trim();
      }
      
      // Handle industries - convert to array if it's a string
      if (editedInvestorData.industries) {
        if (typeof editedInvestorData.industries === 'string' && editedInvestorData.industries.trim()) {
          const industriesArray = editedInvestorData.industries.split(',').map(i => i.trim()).filter(i => i);
          if (industriesArray.length > 0) {
            updatePayload.industries = industriesArray;
          }
        } else if (Array.isArray(editedInvestorData.industries) && editedInvestorData.industries.length > 0) {
          updatePayload.industries = editedInvestorData.industries;
        }
      }

      console.log('📤 Updating investor with payload:', JSON.stringify(updatePayload, null, 2));
      console.log('🔑 Investor ID:', investorId);

      const response = await axios.put(`investors/${investorId}`, updatePayload, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });

      if (response.data.success) {
        showSuccess('Investor updated successfully!');
        // Update the selected investor details
        setSelectedInvestorDetails(response.data.data || response.data.investor || editedInvestorData);
        setIsEditingInvestor(false);
        setEditedInvestorData(null);
        // Refresh the investors list
        fetchInvestors();
      } else {
        showError(response.data.message || 'Failed to update investor');
      }
    } catch (error) {
      console.error('Error updating investor:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Request payload:', error.config?.data);
      console.error('Validation details:', error.response?.data?.details);
      
      // Handle validation errors
      if (error.response?.status === 400) {
        const errorData = error.response.data;
        let errorMessage = 'Failed to update investor';
        
        // Check for validation details array
        if (errorData.details && Array.isArray(errorData.details) && errorData.details.length > 0) {
          // Join all validation error messages
          const validationMessages = errorData.details.map((detail, index) => {
            if (typeof detail === 'string') {
              return detail;
            } else if (detail.message) {
              return detail.message;
            } else if (detail.path && detail.message) {
              return `${detail.path}: ${detail.message}`;
            }
            return detail;
          });
          errorMessage = validationMessages.join('. ');
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
        
        console.error('Displaying error message:', errorMessage);
        showError(errorMessage);
      } else if (error.response?.data?.message) {
        showError(error.response.data.message);
      } else {
        showError('Failed to update investor. Please try again.');
      }
    } finally {
      setIsUpdatingInvestor(false);
    }
  };

  /**
   * Deletes a single investor
   * Requires confirmation before deletion
   * @returns {Promise<void>}
   */
  const handleDeleteInvestor = async () => {
    if (!selectedInvestorDetails) {
      showError('No investor selected');
      return;
    }

    const investorId = selectedInvestorDetails.id || selectedInvestorDetails._id || selectedInvestorDetails.ID;
    if (!investorId) {
      showError('Investor ID not found. Please refresh and try again.');
      return;
    }

    // Require confirmation before deletion
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    setIsDeletingInvestor(true);
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }

      const response = await axios.delete(`investors/${investorId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data && response.data.success) {
        showSuccess('Investor deleted successfully!');
        // Close modal and refresh investors list
        handleCloseInvestorDetails();
        await fetchInvestors();
      } else {
        throw new Error(response.data?.message || 'Failed to delete investor');
      }
    } catch (error) {
      ErrorHandler.logError('handleDeleteInvestor', error, { investorId });
      
      if (error.response) {
        // HTTP error response
        const errorMsg = await ErrorHandler.formatHttpError(error.response, 'Failed to delete investor');
        showError(errorMsg);
      } else if (error.request) {
        // Network error
        const errorMsg = ErrorHandler.formatNetworkError(error);
        showError(`Network error: ${errorMsg}`);
      } else {
        // Other error
        showError(`Error deleting investor: ${error.message}`);
      }
    } finally {
      setIsDeletingInvestor(false);
      setShowDeleteConfirm(false);
    }
  };

  // Validate filter data structure
  const validateFilterData = (data) => {
    console.log('🔍 Validating filter data structure...');
    
    if (!data) {
      console.log('❌ No filter data received');
      return false;
    }
    
    if (Array.isArray(data)) {
      console.log('✅ Filter data is direct array with', data.length, 'items');
      return data.length > 0;
    }
    
    if (typeof data === 'object') {
      const possibleArrays = Object.values(data).filter(item => Array.isArray(item));
      if (possibleArrays.length > 0) {
        console.log('✅ Found array in object:', possibleArrays[0].length, 'items');
        return possibleArrays[0].length > 0;
      }
    }
    
    console.log('❌ No valid array found in filter data');
    return false;
  };

  // Fetch investors from API
  /**
   * Fetches all investors from the API
   * Handles various response formats and provides fallback to sample data on error
   * @returns {Promise<boolean>} True if fetch was successful, false otherwise
   */
  const fetchInvestors = async () => {
    setIsLoadingInvestors(true);
    try {
      const token = authService.getToken();
      const apiUrl = `${API_BASE_URL}/investors/`;
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        cache: 'no-store' // Force fresh request
      });

      // Handle successful response
      if (response.ok) {
        const success = await handleApiResponse(response, token);
        if (success) {
          return true;
        }
      }

      // Handle 404 Not Found - API endpoint might not exist
      if (response.status === 404) {
        ErrorHandler.logError('fetchInvestors', response, { apiUrl });
        const errorMsg = await ErrorHandler.formatHttpError(response, 'Investors endpoint not found');
        showWarning(`API endpoint not available: ${errorMsg}. Using sample data.`);
        setInvestors([...sampleApprovedInvestors, ...sampleUnapprovedInvestors]);
        return false;
      }

      // Handle other HTTP errors
      ErrorHandler.logError('fetchInvestors', response, { apiUrl, status: response.status });
      const errorMsg = await ErrorHandler.formatHttpError(response, 'Failed to load investors');
      showError(errorMsg);
      
      // Fallback to sample data
      setInvestors([...sampleApprovedInvestors, ...sampleUnapprovedInvestors]);
      return false;
      
    } catch (error) {
      // Handle network errors
      ErrorHandler.logError('fetchInvestors', error, { apiUrl: `${API_BASE_URL}/investors/` });
      const errorMsg = ErrorHandler.formatNetworkError(error);
      showError(`Failed to load investors: ${errorMsg}. Using sample data.`);
      
      // Fallback to sample data
      setInvestors([...sampleApprovedInvestors, ...sampleUnapprovedInvestors]);
      return false;
    } finally {
      setIsLoadingInvestors(false);
    }
  };

  /**
   * Searches investors using the search API endpoint
   * Memoized with useCallback to prevent infinite loops in useEffect
   * @param {string} query - Search query (minimum 2 characters)
   * @returns {Promise<void>}
   */
  const searchInvestors = useCallback(async (query) => {
    // Validate query length
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const token = authService.getToken();
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const searchUrl = `${API_BASE_URL}/investors/search?q=${encodeURIComponent(query.trim())}`;
      const response = await fetch(searchUrl, {
        method: 'GET',
        headers,
        cache: 'no-store'
      });

      if (response.ok) {
        const data = await response.json();
        
        // Handle different response formats
        let results = [];
        if (data.investors) {
          results = data.investors;
        } else if (data.data) {
          results = data.data;
        } else if (Array.isArray(data)) {
          results = data;
        } else {
          console.warn('Unexpected search response format:', data);
          results = [];
        }
        
        setSearchResults(results);
        setSearchError(null);
        
        if (results.length === 0) {
          showInfo('No investors found matching your search');
        }
      } else {
        // Handle HTTP errors
        ErrorHandler.logError('searchInvestors', response, { query, searchUrl });
        const errorMsg = await ErrorHandler.formatHttpError(response, 'Search failed');
        setSearchError(errorMsg);
        setSearchResults([]);
        showError(errorMsg);
      }
    } catch (error) {
      // Handle network errors
      ErrorHandler.logError('searchInvestors', error, { query });
      const errorMsg = ErrorHandler.formatNetworkError(error);
      setSearchError(errorMsg);
      setSearchResults([]);
      showError(`Search error: ${errorMsg}`);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((query) => {
      searchInvestors(query);
    }, 500),
    [searchInvestors]
  );

  // Handle search term changes
  useEffect(() => {
    if (searchTerm.trim()) {
      debouncedSearch(searchTerm);
    } else {
      setSearchResults([]);
      setSearchError(null);
    }
  }, [searchTerm, debouncedSearch]);

  // Fetch dashboard stats from API
  const fetchDashboardStats = async () => {
    try {
      console.log('🔍 Fetching dashboard stats from:', `${API_BASE_URL}/investors/dashboard/stats`);
      
      const token = authService.getToken();
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const response = await fetch(`${API_BASE_URL}/investors/dashboard/stats`, {
        method: 'GET',
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Dashboard stats received:', data);
        setDashboardStats(data);
      } else {
        console.error('❌ Failed to fetch dashboard stats:', response.status);
        // Use default stats as fallback
        setDashboardStats({
          totalInvestors: 0,
          approvedInvestors: 0,
          pendingInvestors: 0,
          rejectedInvestors: 0,
          sectors: ['Technology', 'Healthcare', 'Finance', 'Education', 'Energy'],
          investorTypes: ['Venture Capital', 'Private Equity', 'Angel Investor', 'Corporate VC'],
          locations: ['San Francisco', 'New York', 'London', 'Paris', 'Berlin'],
          industries: ['Software', 'AI', 'Fintech', 'Biotech', 'CleanTech'],
          investmentStages: ['Seed', 'Series A', 'Series B', 'Series C', 'Growth'],
          revenueCriteria: ['<$1M', '$1M-$10M', '$10M-$50M', '$50M-$100M', '>$100M']
        });
      }
    } catch (error) {
      console.error('❌ Error fetching dashboard stats:', error);
      // Use default stats as fallback
      setDashboardStats({
        totalInvestors: 0,
        approvedInvestors: 0,
        pendingInvestors: 0,
        rejectedInvestors: 0,
        sectors: ['Technology', 'Healthcare', 'Finance', 'Education', 'Energy'],
        investorTypes: ['Venture Capital', 'Private Equity', 'Angel Investor', 'Corporate VC'],
        locations: ['San Francisco', 'New York', 'London', 'Paris', 'Berlin'],
        industries: ['Software', 'AI', 'Fintech', 'Biotech', 'CleanTech'],
        investmentStages: ['Seed', 'Series A', 'Series B', 'Series C', 'Growth'],
        revenueCriteria: ['<$1M', '$1M-$10M', '$10M-$50M', '$50M-$100M', '>$100M']
      });
    }
  };

  // Fetch filter options from API
  const fetchFilterOptions = async () => {
    try {
      console.log('🔍 Fetching filter options from:', `${API_BASE_URL}/investors/filters/options`);
      
      const token = authService.getToken();
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const response = await fetch(`${API_BASE_URL}/investors/filters/options`, {
        method: 'GET',
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Filter options received:', data);
        setFilterOptions(data);
      } else {
        console.error('❌ Failed to fetch filter options:', response.status);
        // Use default options as fallback
        setFilterOptions({
          sectors: ['Technology', 'Healthcare', 'Finance', 'Education', 'Energy'],
          investorTypes: ['Venture Capital', 'Private Equity', 'Angel Investor', 'Corporate VC'],
          locations: ['San Francisco', 'New York', 'London', 'Paris', 'Berlin'],
          industries: ['Software', 'AI', 'Fintech', 'Biotech', 'CleanTech'],
          investmentStages: ['Seed', 'Series A', 'Series B', 'Series C', 'Growth'],
          revenueCriteria: ['<$1M', '$1M-$10M', '$10M-$50M', '$50M-$100M', '>$100M']
        });
      }
    } catch (error) {
      console.error('❌ Error fetching filter options:', error);
      // Use default options as fallback
      setFilterOptions({
        sectors: ['Technology', 'Healthcare', 'Finance', 'Education', 'Energy'],
        investorTypes: ['Venture Capital', 'Private Equity', 'Angel Investor', 'Corporate VC'],
        locations: ['San Francisco', 'New York', 'London', 'Paris', 'Berlin'],
        industries: ['Software', 'AI', 'Fintech', 'Biotech', 'CleanTech'],
        investmentStages: ['Seed', 'Series A', 'Series B', 'Series C', 'Growth'],
        revenueCriteria: ['<$1M', '$1M-$10M', '$10M-$50M', '$50M-$100M', '>$100M']
      });
    }
  };

  // Debug function to test API endpoints
  const testApiEndpoints = async () => {
    console.log('🧪 Testing API endpoints...');
    console.log('🌐 API_BASE_URL:', API_BASE_URL);
    
    const endpoints = [
      `${API_BASE_URL}/investors/`,
      `${API_BASE_URL}/investors`,
      `${API_BASE_URL}/investors/1/status`,
      `${API_BASE_URL}/investors/1`
    ];
    
    for (const endpoint of endpoints) {
      try {
        console.log(`🔍 Testing: ${endpoint}`);
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        console.log(`📡 ${endpoint} - Status: ${response.status}`);
      } catch (error) {
        console.error(`❌ ${endpoint} - Error:`, error.message);
      }
    }
  };

  // Load investors, filter options, and dashboard stats on component mount
  React.useEffect(() => {
    fetchInvestors();
    fetchFilterOptions();
    fetchDashboardStats();
  }, []);




  // ==================== ENHANCED EXCEL API FUNCTIONS ====================
  
  // NEW API: POST /excel/upload-map-insert - Automatic AI mapping and import
  const performExcelUploadMapInsert = async (file) => {
    try {
      console.log('=== EXCEL UPLOAD MAP INSERT DEBUG START ===');
      console.log('🕐 Timestamp:', new Date().toISOString());
      console.log('📁 File details:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: new Date(file.lastModified).toISOString()
      });
      
      // Validate file
      if (!file) {
        console.error('❌ ERROR: No file provided');
        return { success: false, error: 'No file provided' };
      }
      
      if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
        console.error('❌ ERROR: Invalid file type');
        return { success: false, error: 'Invalid file type. Please upload Excel or CSV files only.' };
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        console.error('❌ ERROR: File too large');
        return { success: false, error: 'File too large. Maximum size is 10MB.' };
      }
      
      // Prepare FormData
      const formData = new FormData();
      formData.append('excelFile', file);
      
      console.log('📤 FormData prepared:', {
        file: file.name,
        fieldName: 'excelFile',
        formDataKeys: Array.from(formData.keys()),
        formDataValues: Array.from(formData.values()).map(v => v.name || v)
      });
      
      const token = authService.getToken();
      const userId = authService.getUserId() || '';
      
      console.log('🔐 Authentication debug:');
      console.log('  - Token available:', !!token);
      console.log('  - Token length:', token?.length || 0);
      console.log('  - User ID:', userId);
      
      const startTime = Date.now();
      console.log('⏱️ API call starting at:', new Date().toISOString());
      
      const response = await fetch(`${API_BASE_URL}/excel/upload-map-insert`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: formData
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log('⏱️ API call completed in:', duration, 'ms');
      console.log('📡 Response details:');
      console.log('  - Status:', response.status);
      console.log('  - Status Text:', response.statusText);
      console.log('  - Headers:', Object.fromEntries(response.headers.entries()));
      console.log('  - OK:', response.ok);
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Excel Upload Map Insert Success:');
        console.log('  - Success:', result.success);
        console.log('  - Inserted Count:', result.insertedCount);
        console.log('  - Data keys:', Object.keys(result.data || {}));
        console.log('  - AI Mapping:', result.aiMapping);
        console.log('  - AI Results:', result.aiResults);
        console.log('  - File Info:', result.fileInfo);
        console.log('  - Debug Info:', result.debugInfo);
        console.log('  - Full response:', result);
        return { success: true, data: result };
      } else {
        const errorText = await response.text();
        console.error('❌ Excel Upload Map Insert Error:');
        console.error('  - Status:', response.status);
        console.error('  - Status Text:', response.statusText);
        console.error('  - Error Text:', errorText);
        console.error('  - Response Headers:', Object.fromEntries(response.headers.entries()));
        
        try {
          const errorJson = JSON.parse(errorText);
          console.error('  - Parsed Error:', errorJson);
          return { success: false, error: errorJson.message || errorText, status: response.status };
        } catch (e) {
          console.error('  - Could not parse error as JSON:', e.message);
          return { success: false, error: errorText, status: response.status };
        }
      }
    } catch (error) {
      console.error('❌ Excel Upload Map Insert Network Error:');
      console.error('  - Error type:', error.constructor.name);
      console.error('  - Error message:', error.message);
      console.error('  - Error stack:', error.stack);
      console.error('  - Timestamp:', new Date().toISOString());
      console.error('  - Full error object:', error);
      return { success: false, error: error.message };
    }
  };

  // ==================== ENHANCED EXCEL API FUNCTIONS ====================
  
  // NEW API: POST /excel/map - Mapping automatique avec IA
  const performExcelAutoMapping = async (headers, sampleData) => {
    try {
      console.log('=== EXCEL AUTO MAPPING DEBUG START ===');
      console.log('🕐 Timestamp:', new Date().toISOString());
      console.log('📊 Input headers count:', headers?.length || 0);
      console.log('📊 Input headers:', headers);
      console.log('📊 Sample data count:', sampleData?.length || 0);
      console.log('📊 Sample data (first 3):', sampleData?.slice(0, 3));
      
      // Validate inputs
      if (!headers || headers.length === 0) {
        console.error('❌ ERROR: No headers provided');
        return { success: false, error: 'No headers provided' };
      }
      
      if (!sampleData || sampleData.length === 0) {
        console.warn('⚠️ WARNING: No sample data provided, using empty array');
        sampleData = [];
      }
      
      // Convert object-based data to array-based format as expected by API
      const dataArray = [];
      
      // Add headers as first row
      dataArray.push(headers);
      console.log('✅ Headers added to data array');
      
      // Convert sample data objects to arrays following header order
      sampleData.forEach((dataObj, index) => {
        const row = headers.map(header => dataObj[header] || '');
        dataArray.push(row);
        if (index < 3) {
          console.log(`📝 Row ${index + 1} converted:`, row);
        }
      });
      
      console.log('📊 Final data array structure:');
      console.log('  - Total rows:', dataArray.length);
      console.log('  - Headers row:', dataArray[0]);
      console.log('  - Sample rows:', dataArray.slice(1, 4));
      
      // Prepare request data
      const token = authService.getToken();
      const userId = authService.getUserId() || '';
      
      const requestBody = { 
        data: dataArray,
        userId: userId
      };
      
      console.log('🔐 Authentication debug:');
      console.log('  - Token available:', !!token);
      console.log('  - Token length:', token?.length || 0);
      console.log('  - User ID:', userId);
      
      console.log('📤 Request details:');
      console.log('  - URL:', `${API_BASE_URL}/excel/map`);
      console.log('  - Method: POST');
      console.log('  - Content-Type: application/json');
      console.log('  - Body size:', JSON.stringify(requestBody).length, 'bytes');
      console.log('  - Request body preview:', {
        dataRows: requestBody.data.length,
        userId: requestBody.userId,
        firstRow: requestBody.data[0]
      });
      
      const startTime = Date.now();
      console.log('⏱️ API call starting at:', new Date().toISOString());
      
      const response = await fetch(`${API_BASE_URL}/excel/map`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(requestBody)
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log('⏱️ API call completed in:', duration, 'ms');
      console.log('📡 Response details:');
      console.log('  - Status:', response.status);
      console.log('  - Status Text:', response.statusText);
      console.log('  - Headers:', Object.fromEntries(response.headers.entries()));
      console.log('  - OK:', response.ok);
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Excel Auto Mapping Success:');
        console.log('  - Success:', result.success);
        console.log('  - Data keys:', Object.keys(result.data || {}));
        console.log('  - Mapping:', result.data?.mapping);
        console.log('  - Confidence:', result.data?.confidence);
        console.log('  - Suggestions:', result.data?.suggestions);
        console.log('  - Quality Score:', result.data?.qualityScore);
        console.log('  - Mapped data count:', result.data?.mapped?.length || 0);
        console.log('  - Full response:', result);
        
        // Handle quality score issues
        if (isNaN(result.data?.qualityScore)) {
          console.warn('⚠️ Quality score is NaN, calculating manually...');
          const confidenceValues = Object.values(result.data?.confidence || {});
          const avgConfidence = confidenceValues.length > 0 
            ? confidenceValues.reduce((sum, val) => sum + val, 0) / confidenceValues.length 
            : 0;
          result.data.qualityScore = Math.round(avgConfidence);
          console.log('  - Calculated quality score:', result.data.qualityScore);
        }
        
        // Handle generic suggestions
        if (result.data?.suggestions?.every(s => s.includes('null'))) {
          console.warn('⚠️ Generic suggestions detected, filtering out...');
          result.data.suggestions = result.data.suggestions.filter(s => !s.includes('null'));
          if (result.data.suggestions.length === 0) {
            result.data.suggestions = ['All fields mapped successfully with high confidence'];
          }
        }
        
        // Log mapping quality analysis
        const mappingEntries = Object.entries(result.data?.mapping || {});
        const confidenceEntries = Object.entries(result.data?.confidence || {});
        
        console.log('📊 Mapping Quality Analysis:');
        console.log('  - Total mappings:', mappingEntries.length);
        console.log('  - High confidence (>90%):', confidenceEntries.filter(([_, score]) => score > 90).length);
        console.log('  - Medium confidence (70-90%):', confidenceEntries.filter(([_, score]) => score >= 70 && score <= 90).length);
        console.log('  - Low confidence (<70%):', confidenceEntries.filter(([_, score]) => score < 70).length);
        
        // Check for potential field issues
        const problematicFields = mappingEntries.filter(([header, field]) => 
          header.includes('First Name') && header.includes('Last Name') && header.length > 20
        );
        if (problematicFields.length > 0) {
          console.warn('⚠️ Potential concatenated fields detected:', problematicFields);
        }
        
        return { success: true, data: result };
      } else {
        const errorText = await response.text();
        console.error('❌ Excel Auto Mapping Error:');
        console.error('  - Status:', response.status);
        console.error('  - Status Text:', response.statusText);
        console.error('  - Error Text:', errorText);
        console.error('  - Response Headers:', Object.fromEntries(response.headers.entries()));
        
        try {
          const errorJson = JSON.parse(errorText);
          console.error('  - Parsed Error:', errorJson);
          return { success: false, error: errorJson.message || errorText, status: response.status };
        } catch (e) {
          console.error('  - Could not parse error as JSON:', e.message);
          return { success: false, error: errorText, status: response.status };
        }
      }
    } catch (error) {
      console.error('❌ Excel Auto Mapping Network Error:');
      console.error('  - Error type:', error.constructor.name);
      console.error('  - Error message:', error.message);
      console.error('  - Error stack:', error.stack);
      console.error('  - Timestamp:', new Date().toISOString());
      console.error('  - Full error object:', error);
      return { success: false, error: error.message };
    }
  };

  // Enhanced Extraction Function
  const extractExcelDataComplete = async (file) => {
    return new Promise((resolve, reject) => {
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
      if (fileExtension === '.xlsx' || fileExtension === '.xls') {
        // Use SheetJS for Excel files
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const excelDataArr = new Uint8Array(e.target.result);
            const workbook = XLSX.read(excelDataArr, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            if (!json || json.length < 1) {
              reject(new Error('No data found in Excel file'));
              return;
            }
            const excelHeaders = json[0].map(h => String(h).trim());
            const excelRows = json.slice(1).map(rowArr => {
              const obj = {};
              excelHeaders.forEach((header, idx) => {
                obj[header] = rowArr[idx] || '';
              });
              return obj;
            });
            resolve({ headers: excelHeaders, data: excelRows, totalRows: excelRows.length });
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = () => reject(new Error('Error reading Excel file'));
        reader.readAsArrayBuffer(file);
      } else {
        // CSV
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const content = e.target.result;
            const lines = content.split(/\r?\n/).filter(line => line.trim());
            if (lines.length < 1) {
              reject(new Error('No data found in file'));
              return;
            }
            const csvHeaders = parseCSVLine(lines[0]).map(h => h.replace(/^"|"$/g, '').trim());
            const csvData = [];
            for (let i = 1; i < Math.min(lines.length, 1001); i++) {
              const values = parseCSVLine(lines[i]).map(v => v.replace(/^"|"$/g, '').trim());
              const row = {};
              csvHeaders.forEach((header, index) => {
                row[header] = values[index] || '';
              });
              csvData.push(row);
            }
            resolve({ headers: csvHeaders, data: csvData, totalRows: lines.length - 1 });
          } catch (error) {
            console.error('Error extracting CSV data:', error);
            reject(error);
          }
        };
        reader.onerror = () => reject(new Error('Error reading CSV file'));
        reader.readAsText(file);
      }
    });
  };
  
  // 1. POST /excel/import - Import principal avec IA
  const performExcelImport = async (file, mapping, headers) => {
    try {
      console.log('=== EXCEL IMPORT (PRINCIPAL) ===');
      
      const token = authService.getToken();
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mapping', JSON.stringify(mapping));
      formData.append('headers', JSON.stringify(headers));
      formData.append('userId', localStorage.getItem('userId') || '');
      
      const response = await fetch(`${API_BASE_URL}/excel/import`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: formData
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Excel Import Success:', result);
        return { success: true, data: result };
      } else {
        const errorText = await response.text();
        console.error('Excel Import Error:', errorText);
        return { success: false, error: errorText, status: response.status };
      }
    } catch (error) {
      console.error('Excel Import Network Error:', error);
      return { success: false, error: error.message };
    }
  };

  // 4. POST /excel/analyze-headers - Analyse des en-têtes avec IA
  const performExcelAnalyzeHeaders = async (headers) => {
    try {
      console.log('=== EXCEL ANALYZE HEADERS ===');
      
      const token = authService.getToken();
      
      const response = await fetch(`${API_BASE_URL}/excel/analyze-headers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ headers })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Excel Analyze Headers Success:', result);
        return { success: true, data: result };
      } else {
        const errorText = await response.text();
        console.error('Excel Analyze Headers Error:', errorText);
        return { success: false, error: errorText, status: response.status };
      }
    } catch (error) {
      console.error('Excel Analyze Headers Network Error:', error);
      return { success: false, error: error.message };
    }
  };

  // 5. POST /excel/import-with-mapping - Import with mapping data
  // Helper to get current headers for mapping validation
  const getCurrentHeadersForValidation = () => {
    if (Array.isArray(extractedHeaders) && extractedHeaders.length > 0) return extractedHeaders;
    if (mappingPreview && Array.isArray(mappingPreview.originalHeaders) && mappingPreview.originalHeaders.length > 0) return mappingPreview.originalHeaders;
    if (headerAnalysis && Array.isArray(headerAnalysis) && headerAnalysis.length > 0) return headerAnalysis;
    return [];
  };

  const performExcelImportWithMapping = async (mapping, headers, sampleData) => {
    // If headers param is missing or empty, try to get from state
    let usedHeaders = headers;
    if (!usedHeaders || !Array.isArray(usedHeaders) || usedHeaders.length === 0) {
      usedHeaders = getCurrentHeadersForValidation();
    }
    
    try {
      console.log('=== EXCEL IMPORT WITH MAPPING ===');
      console.log('Mapping to use:', mapping);
      console.log('Headers to use:', usedHeaders);
      console.log('Sample data count:', sampleData?.length || 0);
      
      if (!mapping || Object.keys(mapping).length === 0) {
        alert('Erreur : le mapping est vide ou non défini. Veuillez configurer le mapping avant import.');
        return { success: false, error: 'Mapping is required' };
      }
      if (!usedHeaders || !Array.isArray(usedHeaders) || usedHeaders.length === 0) {
        alert('Erreur : les en-têtes sont vides ou non définies. Veuillez extraire les données du fichier avant import.');
        return { success: false, error: 'Headers are required' };
      }

      // Prepare data array in the format expected by the API
      const dataArray = [];
      
      // Add headers as first row
      dataArray.push(usedHeaders);
      
      // Add sample data rows (limit to 3 for preview)
      const limitedSampleData = (sampleData || []).slice(0, 3);
      limitedSampleData.forEach(dataObj => {
        const row = usedHeaders.map(header => dataObj[header] || '');
        dataArray.push(row);
      });
      
      console.log('Prepared data array:', dataArray);
      
      const token = authService.getToken();
      const userId = authService.getUserId() || '';
      
      const requestBody = {
        data: dataArray,
        mapping: mapping,
        userId: userId
      };
      
      console.log('Request body:', requestBody);
      
      const response = await fetch(`${API_BASE_URL}/excel/import-with-mapping`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(requestBody)
      });
      
      console.log('Import with mapping API Response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Import with mapping API Success:', result);
        return { success: true, data: result };
      } else {
        const errorText = await response.text();
        console.error('Import with mapping API Error:', errorText);
        try {
          const errorJson = JSON.parse(errorText);
          return { success: false, error: errorJson.message || errorText, status: response.status };
        } catch (e) {
          return { success: false, error: errorText, status: response.status };
        }
      }
    } catch (error) {
      console.error('Import with mapping API Network Error:', error);
      return { success: false, error: error.message };
    }
  };




  // ==================== ENHANCED PROCESSING FUNCTIONS ====================

  // Enhanced File Processing with AI Mapping
  const processFileEnhanced = async (file) => {
    try {
      console.log('=== ENHANCED FILE PROCESSING ===');
      setImportStep('extracting');
      setImportProgress(10);
      setIsExtracting(true);
      setAnalysisMessages(['Extraction des données du fichier...']);
      
      // Validate file
      if (!file) {
        throw new Error('No file provided');
      }
      
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
      const allowedExtensions = ['.csv', '.xlsx', '.xls'];
      
      if (!allowedExtensions.includes(fileExtension)) {
        throw new Error(`Format de fichier non supporté: ${fileExtension}. Formats acceptés: ${allowedExtensions.join(', ')}`);
      }
      
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('Fichier trop volumineux. Taille maximale: 10MB');
      }
      
      setImportProgress(20);
      setAnalysisMessages(prev => [...prev, 'Validation du fichier réussie']);
      
      // Extract complete data
      const extractionResult = await extractExcelDataComplete(file);
      console.log('Extraction result:', extractionResult);
      
      setExtractedHeaders(extractionResult.headers);
      setRawExcelData(extractionResult.data);
      setExcelData(extractionResult.data.slice(0, 3)); // Preview data
      setIsExtracting(false);
      
      setImportProgress(40);
      setAnalysisMessages(prev => [...prev, `${extractionResult.headers.length} colonnes détectées`, `${extractionResult.totalRows} lignes trouvées`]);
      
      if (autoMappingEnabled && useAIMapping) {
        // Start AI analysis automatically
        await startAIMapping(extractionResult.headers, extractionResult.data.slice(0, 5));
      } else {
        // Skip to manual mapping
        setImportStep('mapping_preview');
        setImportProgress(60);
        setAnalysisMessages(prev => [...prev, 'Prêt pour le mapping manuel']);
      }
      
    } catch (error) {
      console.error('Error in enhanced file processing:', error);
      setIsExtracting(false);
      setIsAnalyzing(false);
      alert(`Erreur lors du traitement du fichier: ${error.message}`);
      setImportStep('upload');
      setImportProgress(0);
      setAnalysisMessages([]);
    }
  };

  // AI Mapping Analysis
  const startAIMapping = async (headers, sampleData) => {
    try {
      setImportStep('analyzing');
      setIsAnalyzing(true);
      setImportProgress(50);
      setCurrentAnalysisProgress(0);
      setAnalysisMessages(prev => [...prev, 'Démarrage de l\'analyse IA...']);
      
      // Simulate progressive analysis
      const analysisSteps = [
        'Analyse des en-têtes avec IA...',
        'Identification des patterns de données...',
        'Génération des correspondances optimales...',
        'Calcul des scores de confiance...',
        'Finalisation des suggestions...'
      ];
      
      for (let i = 0; i < analysisSteps.length; i++) {
        setCurrentAnalysisProgress((i + 1) * 20);
        setAnalysisMessages(prev => [...prev, analysisSteps[i]]);
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulation du délai
      }
      
      // Debug data format before API call
      console.log('=== PRE-API CALL DEBUG ===');
      testDataFormat(headers, sampleData);
      
      // Call the new mapping API
      const mappingResult = await performExcelAutoMapping(headers, sampleData);
      
      if (mappingResult.success) {
        console.log('AI Mapping Result:', mappingResult.data);
        console.log('Full mappingResult:', mappingResult);

        // Process AI mapping results - handle both direct mapping and nested structure
        let aiMappingData = mappingResult.data.mapping || {};
        let confidence = mappingResult.data.confidence || {};
        let suggestions = mappingResult.data.suggestions || [];
        let qualityScore = mappingResult.data.qualityScore || 75;
        let mappedData = mappingResult.data.mapped || [];
        
        // If mapping is empty, try to extract from the full response structure
        if (Object.keys(aiMappingData).length === 0) {
          console.log('⚠️ Mapping is empty, checking full response structure...');
          console.log('Full response data keys:', Object.keys(mappingResult.data));
          
          // Try to find mapping in different possible locations
          if (mappingResult.data.data && mappingResult.data.data.mapping) {
            aiMappingData = mappingResult.data.data.mapping;
            confidence = mappingResult.data.data.confidence || {};
            console.log('Found mapping in data.data.mapping:', aiMappingData);
          } else if (mappingResult.mapping) {
            aiMappingData = mappingResult.mapping;
            confidence = mappingResult.confidence || {};
            console.log('Found mapping in root mapping:', aiMappingData);
          }
        }

        console.log('Processed AI mapping data:', {
          aiMappingData,
          confidence,
          suggestions,
          qualityScore,
          mappedData
        });

        setAiMapping(aiMappingData);
        setMappingConfidence(confidence);
        setMappingSuggestions(suggestions);
        setQualityScore(qualityScore);

        // Create mapping preview and stocke mappedData pour l'enregistrement
        setMappingPreview({
          originalHeaders: headers,
          suggestedMapping: aiMappingData,
          confidence: confidence,
          sampleData: sampleData.slice(0, 3),
          mappedData: mappedData // <-- tableau d'objets normalisés prêt à enregistrer
        });

        // Initialize custom mapping with AI suggestions
        console.log('Setting custom mapping with:', aiMappingData);
        
        // Check if mapping is empty and create fallback
        if (Object.keys(aiMappingData).length === 0) {
          console.warn('⚠️ AI mapping is empty, creating fallback mapping');
          const fallbackMapping = createBasicMapping(headers);
          setCustomMapping(fallbackMapping);
          setMappingPreview(prev => ({
            ...prev,
            suggestedMapping: fallbackMapping
          }));
        } else {
          setCustomMapping(aiMappingData);
        }
        
        // Verify the mapping was set
        setTimeout(() => {
          console.log('Custom mapping after set:', customMapping);
        }, 100);

        setImportStep('mapping_preview');
        setImportProgress(70);
        setAnalysisMessages(prev => [...prev, 'Analyse IA terminée avec succès!', `Score de qualité: ${qualityScore}%`]);
        
      } else {
        console.error('AI Mapping failed:', mappingResult);
        
        // Enhanced error handling with specific error messages
        let errorMessage = 'Analyse IA échouée';
        if (mappingResult.status === 400) {
          errorMessage += ' - Format de données invalide';
        } else if (mappingResult.status === 401) {
          errorMessage += ' - Authentification requise';
        } else if (mappingResult.status === 500) {
          errorMessage += ' - Erreur serveur';
        }
        
        // Fallback to basic mapping
        const basicMapping = createBasicMapping(headers);
        setCustomMapping(basicMapping);
        setMappingPreview({
          originalHeaders: headers,
          suggestedMapping: basicMapping,
          confidence: {},
          sampleData: sampleData.slice(0, 3)
        });
        
        setImportStep('mapping_preview');
        setImportProgress(60);
        setAnalysisMessages(prev => [...prev, errorMessage, 'Mapping basique appliqué']);
        
        // Show user-friendly error message
        const detailedError = `${errorMessage}\nDétails: ${mappingResult.error}\n\nLe système utilisera un mapping automatique basique basé sur les noms de colonnes.`;
        
        // Use a more user-friendly approach than alert
        console.warn('AI Mapping Error - Using Fallback:', detailedError);
        
        // Optional: You could show a less intrusive notification
        // For now, we'll just log it and continue with basic mapping
      }
      
    } catch (error) {
      console.error('Error in AI mapping:', error);
      // Fallback to basic mapping
      const basicMapping = createBasicMapping(headers);
      setCustomMapping(basicMapping);
      setHeaderAnalysis(headers); // Ensure headerAnalysis is set for validation
      setMappingPreview({
        originalHeaders: headers,
        suggestedMapping: basicMapping,
        confidence: {},
        sampleData: sampleData.slice(0, 3)
      });
      setImportStep('mapping_preview');
      setImportProgress(60);
      setAnalysisMessages(prev => [...prev, `Erreur analyse: ${error.message}`]);
      
      alert(`Erreur lors de l'analyse IA: ${error.message}\nUtilisation du mapping par défaut.`);
    } finally {
      setIsAnalyzing(false);
      setCurrentAnalysisProgress(100);
    }
  };

  // Create basic mapping fallback
  const createBasicMapping = (headers) => {
    const mapping = {};
    const dbFields = [
      'investorType', 'sector', 'industries', 'investmentStage', 'revenueCriteria',
      'firstName', 'lastName', 'email', 'location', 'organizationPersonName',
      'description', 'phoneNumber', 'website', 'linkedin'
    ];
    
    headers.forEach(header => {
      const lowerHeader = header.toLowerCase();
      const matchingField = dbFields.find(field => 
        lowerHeader.includes(field.toLowerCase()) || 
        field.toLowerCase().includes(lowerHeader) ||
        lowerHeader.replace(/[^a-z]/g, '') === field.toLowerCase()
      );
      if (matchingField) {
        mapping[header] = matchingField;
      }
    });
    
    return mapping;
  };

  // Debug function to test data format
  const testDataFormat = (headers, sampleData) => {
    console.log('=== DATA FORMAT TEST ===');
    console.log('Headers type:', typeof headers, 'Is array:', Array.isArray(headers));
    console.log('Headers content:', headers);
    console.log('Sample data type:', typeof sampleData, 'Is array:', Array.isArray(sampleData));
    console.log('Sample data length:', sampleData?.length);
    
    if (sampleData && sampleData.length > 0) {
      console.log('First sample type:', typeof sampleData[0]);
      console.log('First sample keys:', Object.keys(sampleData[0] || {}));
      console.log('First sample:', sampleData[0]);
    }
    
    // Test conversion to array format
    const testArray = [];
    testArray.push(headers);
    
    sampleData.forEach((dataObj, index) => {
      const row = headers.map(header => dataObj[header] || '');
      testArray.push(row);
      if (index === 0) {
        console.log('Converted first row:', row);
      }
    });
    
    console.log('Final array format (first 2 rows):', testArray.slice(0, 2));
    return testArray;
  };

  // Enhanced Mapping Management Functions
  const handleMappingEdit = (originalHeader, newDbField) => {
    setUserMappingEdits(prev => ({
      ...prev,
      [originalHeader]: newDbField
    }));
    
    setCustomMapping(prev => ({
      ...prev,
      [originalHeader]: newDbField
    }));
    
    console.log(`Mapping edited: ${originalHeader} -> ${newDbField}`);
  };

  const resetMappingToAI = () => {
    if (aiMapping) {
      setCustomMapping(aiMapping);
      setUserMappingEdits({});
      console.log('Mapping reset to AI suggestions');
    }
  };

  const applyManualMapping = () => {
    const basicMapping = createBasicMapping(extractedHeaders);
    setCustomMapping(basicMapping);
    setUserMappingEdits({});
    setImportStep('mapping_preview');
    console.log('Applied manual/basic mapping');
  };

  const saveCurrentMapping = () => {
    const mappingTemplate = {
      id: Date.now(),
      name: `Mapping ${new Date().toLocaleDateString()}`,
      mapping: customMapping,
      headers: extractedHeaders,
      created: new Date().toISOString()
    };
    
    setMappingHistory(prev => [mappingTemplate, ...prev.slice(0, 4)]); // Keep last 5
    
    // Save to localStorage
    const savedMappings = JSON.parse(localStorage.getItem('excelMappingHistory') || '[]');
    savedMappings.unshift(mappingTemplate);
    localStorage.setItem('excelMappingHistory', JSON.stringify(savedMappings.slice(0, 10)));
    
    console.log('Mapping template saved:', mappingTemplate);
    alert('Configuration de mapping sauvegardée!');
  };

  const loadMappingTemplate = (template) => {
    setCustomMapping(template.mapping);
    setUserMappingEdits({});
    console.log('Loaded mapping template:', template.name);
    alert(`Template "${template.name}" chargé!`);
  };

  // Load mapping history from localStorage on component mount
  React.useEffect(() => {
    const savedMappings = JSON.parse(localStorage.getItem('excelMappingHistory') || '[]');
    setMappingHistory(savedMappings);
  }, []);

  // Enhanced file processing handler
  const handleFileSelectEnhanced = (e) => {
    const file = e.target.files[0];
    if (file) {
      processFileEnhanced(file);
    }
  };

  const handleDropEnhanced = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      processFileEnhanced(file);
    }
  };

  // Retry AI Analysis
  const retryAIAnalysis = async () => {
    if (extractedHeaders.length > 0 && rawExcelData.length > 0) {
      await startAIMapping(extractedHeaders, rawExcelData.slice(0, 5));
    }
  };

  // Skip to manual mapping
  const skipToManualMapping = () => {
    setImportStep('mapping_preview');
    const basicMapping = createBasicMapping(extractedHeaders);
    setCustomMapping(basicMapping);
    setMappingPreview({
      originalHeaders: extractedHeaders,
      suggestedMapping: basicMapping,
      confidence: {},
      sampleData: rawExcelData.slice(0, 3)
    });
    setImportProgress(60);
    setAnalysisMessages(prev => [...prev, 'Passage au mapping manuel']);
  };

  // Validate mapping quality
  const validateMappingQuality = () => {
    const requiredFields = ['investorType', 'sector', 'industries', 'investmentStage', 'revenueCriteria', 'firstName', 'lastName', 'email', 'location'];
    const mappedFields = Object.values(customMapping);
    const missingRequired = requiredFields.filter(field => !mappedFields.includes(field));
    
    return {
      isValid: missingRequired.length === 0,
      missingFields: missingRequired,
      mappedCount: mappedFields.length,
      totalRequired: requiredFields.length
    };
  };
  const performFallbackImport = async () => {
    try {
      console.log('=== PERFORMING FALLBACK IMPORT ===');
      
      // Extract data from CSV file
      const csvData = await extractCSVData(importFile);
      console.log('Extracted CSV data:', csvData);
      
      // Transform data using mapping
      const transformedData = csvData.map(row => {
        const transformed = {};
        Object.keys(customMapping).forEach(excelHeader => {
          const dbField = customMapping[excelHeader];
          if (dbField && row[excelHeader]) {
            transformed[dbField] = row[excelHeader];
          }
        });
        return transformed;
      });
      
      console.log('Transformed data:', transformedData);
      
      // Import each record individually
      const token = authService.getToken();
      let successCount = 0;
      let errorCount = 0;
      
      for (const record of transformedData) {
        try {
          const response = await fetch(`${API_BASE_URL}/investors`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': token ? `Bearer ${token}` : '',
            },
            body: JSON.stringify({
              ...record,
              userId: localStorage.getItem('userId') || '1'
            })
          });
          
          if (response.ok) {
            successCount++;
            console.log('Record imported successfully:', record);
          } else {
            errorCount++;
            const errorText = await response.text();
            console.error('Record import failed:', record, errorText);
          }
        } catch (error) {
          errorCount++;
          console.error('Record import error:', record, error.message);
        }
      }
      
      setImportProgress(100);
      alert(`Fallback import completed!\n\nSuccessfully imported: ${successCount} records\nFailed: ${errorCount} records\n\nCheck console for details.`);
      
      // Refresh investors list
      await fetchInvestors();
      
      // Close modal
      handleCloseImportModal();
      
    } catch (error) {
      console.error('Fallback import error:', error);
      alert(`Fallback import failed: ${error.message}`);
      setImportStep('validate');
    }
  };

  // Extract CSV data (all rows for import)
  const extractCSVData = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target.result;
          console.log('Extracting all CSV data, content length:', content.length);
          
          // Split by lines and filter empty lines
          const lines = content.split(/\r?\n/).filter(line => line.trim());
          console.log('Total lines for import:', lines.length);
          
          if (lines.length < 2) {
            reject(new Error('No data found in CSV file'));
            return;
          }
          
          // Parse headers using improved CSV parsing
          const headers = parseCSVLine(lines[0]).map(h => h.replace(/^"|"$/g, '').trim());
          console.log('Import headers:', headers);
          
          const data = [];
          
          // Extract ALL data rows (not limited to 3)
          for (let i = 1; i < lines.length; i++) {
            const values = parseCSVLine(lines[i]).map(v => v.replace(/^"|"$/g, '').trim());
            const row = {};
            
            headers.forEach((header, index) => {
              row[header] = values[index] || '';
            });
            
            data.push(row);
          }
          
          console.log(`Extracted ${data.length} complete rows from CSV file`);
          resolve(data);
        } catch (error) {
          console.error('Error extracting CSV data:', error);
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read CSV file'));
      reader.readAsText(file, 'UTF-8');
    });
  };


  const handleSaveView = () => {
    alert('View saved successfully!');
  };

  const handleAddInvestor = () => {
    setShowAddInvestorModal(true);
  };

  const handleCloseModal = () => {
    setShowAddInvestorModal(false);
    setNewInvestor({
      investorType: '',
      sector: '',
      industries: '',
      investmentStage: '',
      revenueCriteria: '',
      organizationPersonName: '',
      firstName: '',
      lastName: '',
      email: '',
      description: '',
      organizationPersonNameFirstLastName: '',
      location: '',
      phoneNumber: '',
      website: '',
      linkedin: ''
    });
    setFormErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewInvestor(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!newInvestor.investorType) errors.investorType = 'Investor Type is required';
    if (!newInvestor.sector) errors.sector = 'Sector is required';
    if (!newInvestor.industries) errors.industries = 'Industries is required';
    if (!newInvestor.investmentStage) errors.investmentStage = 'Investment Stage is required';
    if (!newInvestor.revenueCriteria) errors.revenueCriteria = 'Revenue Criteria is required';
    if (!newInvestor.firstName) errors.firstName = 'First Name is required';
    if (!newInvestor.lastName) errors.lastName = 'Last Name is required';
    if (!newInvestor.email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newInvestor.email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!newInvestor.location) errors.location = 'Location is required';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitInvestor = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Prepare the data for API call
      const investorData = {
        investorType: newInvestor.investorType,
        sector: newInvestor.sector,
        industries: newInvestor.industries,
        investmentStage: newInvestor.investmentStage,
        revenueCriteria: newInvestor.revenueCriteria,
        organizationPersonName: newInvestor.organizationPersonName,
        firstName: newInvestor.firstName,
        lastName: newInvestor.lastName,
        email: newInvestor.email,
        description: newInvestor.description,
        organizationPersonNameFirstNameLastName: newInvestor.organizationPersonNameFirstLastName,
        location: newInvestor.location,
        phoneNumber: newInvestor.phoneNumber,
        website: newInvestor.website,
        linkedin: newInvestor.linkedin,
        userId: localStorage.getItem('userId') || "68d6df6c73bfdbeb3576ab42" // Get from logged-in user or use default
      };

      const token = authService.getToken();
      const response = await fetch(`${API_BASE_URL}/investors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(investorData)
      });

      if (response.ok) {
        const result = await response.json();
        alert('Investor added successfully!');
        handleCloseModal();
        // Refresh the investors list
        fetchInvestors();
      } else {
        const errorData = await response.json();
        alert(`Failed to add investor: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error adding investor:', error);
      alert('Failed to add investor. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImportCSV = () => {
    setShowImportModal(true);
  };

  const handleCloseImportModal = () => {
    setShowImportModal(false);
    setImportFile(null);
    setImportPreview(null);
    setImportStep('upload');
    setHeaderAnalysis(null);
    setAiMapping(null);
    setCustomMapping({});
    setQualityScore(0);
    setMappingSuggestions([]);
    setImportProgress(0);
    setIsDragOver(false);
    setExcelData([]);
    setValidationResults(null);
    setValidationErrors([]);
    setImportResults(null);
    
    // Clear enhanced states
    setIsExtracting(false);
    setIsAnalyzing(false);
    setExtractedHeaders([]);
    setRawExcelData([]);
    setMappingPreview(null);
    setUserMappingEdits({});
    setCurrentAnalysisProgress(0);
    setAnalysisMessages([]);
    setMappingConfidence({});
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file) => {
    // Validate file before setting
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      alert(`Invalid file format. Please select a file with one of these extensions: ${validExtensions.join(', ')}`);
      return;
    }
    
    // Check file size (limit to 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert(`File too large. Maximum size is 10MB. Your file is ${(file.size / 1024 / 1024).toFixed(1)}MB`);
      return;
    }
    
    console.log('File selected:', {
      name: file.name,
      size: file.size,
      type: file.type,
      extension: fileExtension
    });
    
    setImportFile(file);
    setImportStep('analyze');
    
    // Start AI analysis
    analyzeHeadersWithAI(file);
  };

  // Drag and Drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  // Create intelligent mapping based on headers and data content
  const createIntelligentMapping = (headers, data) => {
    const mapping = {};
    
    // Database field patterns to match
    const fieldPatterns = {
      investorType: ['investor', 'type', 'investor_type', 'investorType', 'investor-type'],
      sector: ['sector', 'industry_sector', 'business_sector'],
      industries: ['industries', 'industry', 'sectors', 'business_areas'],
      investmentStage: ['stage', 'investment_stage', 'funding_stage', 'round'],
      revenueCriteria: ['revenue', 'criteria', 'revenue_criteria', 'revenue_criteria', 'size'],
      firstName: ['first', 'first_name', 'firstname', 'fname', 'given_name'],
      lastName: ['last', 'last_name', 'lastname', 'lname', 'surname', 'family_name'],
      email: ['email', 'e_mail', 'email_address', 'mail'],
      location: ['location', 'city', 'address', 'country', 'region'],
      phoneNumber: ['phone', 'telephone', 'phone_number', 'tel', 'mobile'],
      website: ['website', 'web', 'url', 'site', 'homepage'],
      linkedin: ['linkedin', 'linked_in', 'linked-in', 'profile'],
      description: ['description', 'desc', 'about', 'summary', 'notes', 'comments']
    };
    
    // Map database fields to Excel columns
    Object.entries(fieldPatterns).forEach(([dbField, patterns]) => {
      let bestMatch = null;
      let bestScore = 0;
      
      headers.forEach(header => {
        const lowerHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '');
        
        const matchScore = patterns.reduce((score, pattern) => {
          const patternLower = pattern.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (lowerHeader.includes(patternLower) || patternLower.includes(lowerHeader)) {
            return score + 1;
          }
          return score;
        }, 0);
        
        if (matchScore > bestScore) {
          bestScore = matchScore;
          bestMatch = header;
        }
      });
      
      if (bestMatch && bestScore > 0) {
        mapping[dbField] = bestMatch;
        console.log(`Intelligent mapping: ${dbField} -> ${bestMatch} (score: ${bestScore})`);
      }
    });
    
    // Additional data-based mapping for better accuracy
    if (data && data.length > 0) {
      const sampleData = data[0];
      
      // Check email patterns
      Object.keys(sampleData).forEach(header => {
        const value = sampleData[header];
        if (typeof value === 'string' && value.includes('@') && !mapping.email) {
          mapping.email = header;
          console.log(`Email detected in column: ${header}`);
        }
      });
      
      // Check phone patterns
      Object.keys(sampleData).forEach(header => {
        const value = sampleData[header];
        if (typeof value === 'string' && /[+]?[0-9-()\s]+/.test(value) && !mapping.phoneNumber) {
          mapping.phoneNumber = header;
          console.log(`Phone detected in column: ${header}`);
        }
      });
      
      // Check URL patterns
      Object.keys(sampleData).forEach(header => {
        const value = sampleData[header];
        if (typeof value === 'string' && (value.includes('http') || value.includes('www')) && !mapping.website) {
          mapping.website = header;
          console.log(`Website detected in column: ${header}`);
        }
      });
    }
    
    console.log('Intelligent mapping created:', mapping);
    return mapping;
  };

  // AI-powered header analysis
  const analyzeHeadersWithAI = async (file) => {
    try {
      setImportProgress(20);
      console.log('=== AI HEADER ANALYSIS STARTED ===');
      
      // First, extract headers and data from the file
      const { headers, data } = await extractHeadersAndDataFromFile(file);
      console.log('Extracted headers:', headers);
      console.log('Extracted data:', data);
      
      // Store Excel data for display in mapping step
      setExcelData(data);
      
      setImportProgress(40);
      
      // Use the new Excel API function
      const result = await performExcelAnalyzeHeaders(headers);
      
      if (result.success) {
        console.log('AI Analysis Result:', result.data);
        
        setHeaderAnalysis(result.data.headers || headers);
        setAiMapping(result.data.mapping || {});
        setQualityScore(result.data.qualityScore || 0);
        setMappingSuggestions(result.data.suggestions || []);
        
        setImportStep('mapping');
        setImportProgress(60);
        
        // Create intelligent mapping and merge with AI suggestions
        const intelligentMapping = createIntelligentMapping(headers, data);
        
        // Merge AI suggestions with intelligent mapping
        const finalMapping = { ...intelligentMapping };
        if (result.data.mapping) {
          Object.keys(result.data.mapping).forEach(excelHeader => {
            const dbField = result.data.mapping[excelHeader].dbField || result.data.mapping[excelHeader];
            finalMapping[dbField] = excelHeader;
            console.log(`AI mapping: ${dbField} -> ${excelHeader}`);
          });
        }
        
        console.log('Final mapping for customMapping:', finalMapping);
        setCustomMapping(finalMapping);
        
      } else {
        console.error('AI Analysis Error:', result.error);
        
        // Fallback: create basic mapping from headers
        const fallbackMapping = {};
        const fallbackAnalysis = {
          headers: headers,
          mapping: {},
          qualityScore: 50,
          suggestions: ['Manual mapping required - AI analysis failed']
        };
        
        // Create intelligent mapping based on headers and data content
        const intelligentMapping = createIntelligentMapping(headers, data);
        Object.assign(fallbackMapping, intelligentMapping);
        
        console.log('Fallback mapping created:', intelligentMapping);
        fallbackAnalysis.mapping = intelligentMapping;
        
        setHeaderAnalysis(fallbackAnalysis.headers);
        setAiMapping(fallbackAnalysis.mapping);
        setQualityScore(fallbackAnalysis.qualityScore);
        setMappingSuggestions(fallbackAnalysis.suggestions);
        
        setImportStep('mapping');
        setImportProgress(60);
        
        // Initialize custom mapping with fallback suggestions
        console.log('Setting custom mapping with fallback:', intelligentMapping);
        setCustomMapping(intelligentMapping);
        
        alert(`AI analysis failed, using fallback mapping.\nError: ${result.error}`);
      }
    } catch (error) {
      console.error('Error in AI analysis:', error);
      alert(`Network error during AI analysis: ${error.message}`);
      setImportStep('upload');
    }
  };

  // Extract headers from file
  const extractHeadersFromFile = async (file) => {
    return new Promise((resolve, reject) => {
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
      if (fileExtension === '.xlsx' || fileExtension === '.xls') {
        // Use SheetJS for Excel files
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            if (!json || json.length < 1) {
              reject(new Error('No data found in Excel file'));
              return;
            }
            const headers = json[0].map(h => String(h).trim());
            resolve(headers);
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = () => reject(new Error('Failed to read Excel file'));
        reader.readAsArrayBuffer(file);
      } else {
        // CSV fallback
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const content = e.target.result;
            const lines = content.split('\n').filter(line => line.trim());
            if (lines.length > 0) {
              const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
              resolve(headers);
            } else {
              reject(new Error('No content found in CSV file'));
            }
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = () => reject(new Error('Failed to read CSV file'));
        reader.readAsText(file);
      }
    });
  };

  // Parse CSV line properly handling commas and quotes
  const parseCSVLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  };

  // Extract headers and data from file
  const extractHeadersAndDataFromFile = async (file) => {
    return new Promise((resolve, reject) => {
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
      if (fileExtension === '.xlsx' || fileExtension === '.xls') {
        // Use SheetJS for Excel files
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            if (!json || json.length < 1) {
              reject(new Error('No data found in Excel file'));
              return;
            }
            const headers = json[0].map(h => String(h).trim());
            const rows = json.slice(1, 4).map(rowArr => {
              const row = {};
              headers.forEach((header, idx) => {
                row[header] = rowArr[idx] !== undefined ? String(rowArr[idx]) : '';
              });
              return row;
            });
            resolve({ headers, data: rows });
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = () => reject(new Error('Failed to read Excel file'));
        reader.readAsArrayBuffer(file);
      } else {
        // CSV fallback
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const content = e.target.result;
            const lines = content.split(/\r?\n/).filter(line => line.trim());
            if (lines.length === 0) {
              reject(new Error('Empty file'));
              return;
            }
            const headers = parseCSVLine(lines[0]).map(h => h.replace(/^"|"$/g, '').trim());
            const data = [];
            for (let i = 1; i < Math.min(lines.length, 4); i++) {
              const values = parseCSVLine(lines[i]).map(v => v.replace(/^"|"$/g, '').trim());
              const row = {};
              headers.forEach((header, index) => {
                row[header] = values[index] || '';
              });
              data.push(row);
            }
            resolve({ headers, data });
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file, 'UTF-8');
      }
    });
  };

  // Analyze CSV content for potential issues (legacy function)
  const analyzeCSVContent = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        const lines = content.split('\n').filter(line => line.trim());
        
        console.log('=== CSV CONTENT ANALYSIS ===');
        console.log('Total lines:', lines.length);
        console.log('First line (headers):', lines[0]);
        
        if (lines.length > 0) {
          const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
          console.log('Headers found:', headers);
          
          const requiredHeaders = [
            'investorType', 'sector', 'industries', 'investmentStage', 
            'revenueCriteria', 'firstName', 'lastName', 'email', 'location'
          ];
          
          const missingHeaders = requiredHeaders.filter(req => 
            !headers.some(header => header.toLowerCase() === req.toLowerCase())
          );
          
          if (missingHeaders.length > 0) {
            console.warn('Missing required headers:', missingHeaders);
            alert(`Warning: Missing required headers: ${missingHeaders.join(', ')}\n\nThis may cause a 400 error. Please check your file format.`);
          } else {
            console.log('All required headers present');
          }
          
          // Check for empty lines
          const emptyLines = lines.filter((line, index) => index > 0 && line.trim() === '');
          if (emptyLines.length > 0) {
            console.warn('Empty lines found:', emptyLines.length);
          }
        }
      } catch (error) {
        console.error('Error analyzing CSV content:', error);
      }
    };
    reader.readAsText(file);
  };

  // Handle mapping changes
  const handleMappingChange = (excelHeader, dbField) => {
    setCustomMapping(prev => ({
      ...prev,
      [excelHeader]: dbField
    }));
  };

  // ==================== IMPORT CSV 2 HANDLERS ====================
  
  // Handle CSV 2 file selection
  const handleCSV2FileSelect = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setImportCSV2File(file);
      setImportCSV2Results(null);
      console.log('CSV 2 file selected:', file.name, file.size, 'bytes');
      
      // Analyser le fichier pour extraire les données
      await analyzeExcelFile(file);
    }
  };

  // Handle CSV 2 drag and drop
  const handleCSV2DragOver = (e) => {
    e.preventDefault();
    setIsDragOverCSV2(true);
  };

  const handleCSV2DragLeave = (e) => {
    e.preventDefault();
    setIsDragOverCSV2(false);
  };

  const handleCSV2Drop = (e) => {
    e.preventDefault();
    setIsDragOverCSV2(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      setImportCSV2File(file);
      setImportCSV2Results(null);
      console.log('CSV 2 file dropped:', file.name, file.size, 'bytes');
    }
  };

  // Handle CSV 2 import submission
  const handleCSV2Import = async () => {
    if (!importCSV2File) {
      alert('Please select a file first.');
      return;
    }

    setIsImportingCSV2(true);
    setIsUploading(true);
    setUploadProgress(0);
    setImportCSV2Results(null);

    try {
      console.log('=== STARTING CSV 2 IMPORT ===');
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 15;
        });
      }, 200);

      const result = await performExcelUploadMapInsert(importCSV2File);
      
      // Complete the progress
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      if (result.success) {
        console.log('CSV 2 Import Success:', result.data);
        setImportCSV2Results({
          success: true,
          insertedCount: result.data.insertedCount || 0,
          aiMapping: result.data.aiMapping || {},
          aiResults: result.data.aiResults || {},
          fileInfo: result.data.fileInfo || {},
          debugInfo: result.data.debugInfo || {},
          importedData: result.data.importedData || []
        });
        
        // Refresh investors list
        await fetchInvestors();
      } else {
        console.error('CSV 2 Import Error:', result.error);
        setImportCSV2Results({
          success: false,
          error: result.error,
          status: result.status
        });
      }
    } catch (error) {
      console.error('CSV 2 Import Network Error:', error);
      setImportCSV2Results({
        success: false,
        error: error.message
      });
    } finally {
      setIsImportingCSV2(false);
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000); // Reset after 1 second
    }
  };

  // Close CSV 2 modal
  const handleCloseCSV2Modal = () => {
    setShowImportCSV2Modal(false);
    setImportCSV2File(null);
    setImportCSV2Results(null);
    setIsImportingCSV2(false);
    setIsDragOverCSV2(false);
    // Retirer la classe modal-open du body
    document.body.classList.remove('modal-open');
  };

  // Validate mapping and proceed to import
  const validateMapping = async () => {
    try {
      setImportStep('validate');
      setImportProgress(80);
      setValidationResults(null);
      setValidationErrors([]);
      
      // Always pass a valid headers array
      let headersToUse = headerAnalysis;
      if (!headersToUse || !Array.isArray(headersToUse) || headersToUse.length === 0) {
        if (Array.isArray(extractedHeaders) && extractedHeaders.length > 0) {
          headersToUse = extractedHeaders;
        } else if (mappingPreview && Array.isArray(mappingPreview.originalHeaders) && mappingPreview.originalHeaders.length > 0) {
          headersToUse = mappingPreview.originalHeaders;
        } else {
          headersToUse = [];
        }
      }
      const result = await performExcelImportWithMapping(customMapping, headersToUse, rawExcelData.slice(0, 3));
      
      if (result.success) {
        console.log('Validation Result:', result.data);
        // Defensive: handle null result.data and headerAnalysis
        const safeData = result.data || {};
        const safeHeaderAnalysis = Array.isArray(headerAnalysis) ? headerAnalysis : [];
        setValidationResults({
          isValid: true,
          message: safeData.message || 'Mapping validation successful',
          mappedFields: safeData.mappedFields || Object.keys(customMapping).length,
          totalFields: safeData.totalFields || safeHeaderAnalysis.length,
          qualityScore: safeData.qualityScore || qualityScore,
          warnings: safeData.warnings || [],
          suggestions: safeData.suggestions || []
        });
        // Import completed with the import-with-mapping API
        setTimeout(() => {
          setImportStep('import');
          setImportProgress(90);
          performFinalImport(result);
        }, 1500);
      } else {
        console.error('Validation Error:', result.error);
        setValidationResults({
          isValid: false,
          message: result.error || 'Mapping validation failed',
          errors: result.errors || []
        });
        setValidationErrors(result.errors || [result.error]);
        alert(`Mapping validation failed: ${result.status || 'Unknown'}\nError: ${result.error}`);
        setTimeout(() => {
          setImportStep('mapping');
        }, 5000);
      }
    } catch (error) {
      console.error('Error validating mapping:', error);
      
      setValidationResults({
        isValid: false,
        message: 'Network error during validation',
        errors: [error.message]
      });
      setValidationErrors([error.message]);
      
      alert(`Network error during validation: ${error.message}`);
      
      setTimeout(() => {
        setImportStep('mapping');
      }, 5000);
    }
  };

  // Perform final import
  const performFinalImport = async (importResult) => {
    try {
      setImportProgress(95);
      setImportResults(null);

      console.log('=== FINAL IMPORT DEBUG ===');
      console.log('Import result from API:', importResult);

      // Import completed successfully with the import-with-mapping API
      setImportProgress(100);
      setImportResults({
        success: true,
        message: 'Import completed successfully!',
        insertedCount: importResult?.data?.insertedCount || 0
      });
      
      // Close modal after successful import
      setTimeout(() => {
        handleCloseImportModal();
      }, 2000);
    } catch (error) {
      console.error('Error during import:', error);
      
      setImportResults({
        success: false,
        message: 'Network error during import',
        error: error.message
      });
      
      alert(`Network error during import: ${error.message}\n\nPlease check your internet connection and try again.`);
      
      setTimeout(() => {
        setImportStep('validate');
      }, 5000);
    }
  };

  const handlePreviewImport = async () => {
    if (!importFile) {
      alert('Please select a file first.');
      return;
    }

    setIsImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', importFile);

      const token = authService.getToken();
      console.log('=== EXCEL PREVIEW DEBUG ===');
      console.log('API URL:', `${API_BASE_URL}/excel/preview`);
      console.log('File:', importFile.name, importFile.size, 'bytes');
      console.log('Token available:', !!token);
      
      const response = await fetch(`${API_BASE_URL}/excel/preview`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: formData
      });

      console.log('Excel Preview Response Status:', response.status);
      console.log('Excel Preview Response Headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const data = await response.json();
        console.log('Excel Preview Data:', data);
        setImportPreview(data);
        alert(`Preview loaded! Found ${data.rows ? data.rows.length : 0} rows to import.`);
      } else {
        const errorText = await response.text();
        console.error('Excel Preview Error:', {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText
        });
        
        if (response.status === 500) {
          alert(`Server Error (500): The server encountered an internal error while processing your Excel file.\n\nPossible causes:\n- File format not supported\n- File too large\n- Server processing error\n\nError details: ${errorText}`);
        } else {
          alert(`Failed to preview file: ${response.status} ${response.statusText}\nError: ${errorText}`);
        }
      }
    } catch (error) {
      console.error('Error previewing file:', error);
      alert(`Network error while previewing file: ${error.message}\nCheck console for details.`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleValidateImport = async () => {
    if (!importFile) {
      alert('Please select a file first.');
      return;
    }

    setIsImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', importFile);

      const token = authService.getToken();
      console.log('=== EXCEL VALIDATE DEBUG ===');
      console.log('API URL:', `${API_BASE_URL}/excel/validate`);
      console.log('File:', importFile.name, importFile.size, 'bytes');
      console.log('Token available:', !!token);
      
      const response = await fetch(`${API_BASE_URL}/excel/validate`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: formData
      });

      console.log('Excel Validate Response Status:', response.status);
      console.log('Excel Validate Response Headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const data = await response.json();
        console.log('Excel Validate Data:', data);
        alert(`Validation completed! ${data.valid ? 'File is valid' : 'File has errors'}`);
        if (data.valid) {
          // Refresh investors list after successful import
          fetchInvestors();
          handleCloseImportModal();
        }
      } else {
        const errorText = await response.text();
        console.error('Excel Validate Error:', {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText
        });
        
        if (response.status === 500) {
          alert(`Server Error (500): The server encountered an internal error while validating your Excel file.\n\nPossible causes:\n- File format not supported\n- File too large\n- Server processing error\n- Invalid data format\n\nError details: ${errorText}`);
        } else if (response.status === 400) {
          // Enhanced error parsing and debugging
          console.log('=== DETAILED 400 ERROR ANALYSIS ===');
          console.log('Response status:', response.status);
          console.log('Response statusText:', response.statusText);
          console.log('Response headers:', Object.fromEntries(response.headers.entries()));
          console.log('Raw error text:', errorText);
          
          let errorMessage = `Bad Request (400): The file format or content is invalid.\n\n`;
          let parsedError = null;
          
          try {
            parsedError = JSON.parse(errorText);
            console.log('Parsed error data:', parsedError);
          } catch (e) {
            console.log('Could not parse error as JSON, treating as plain text');
          }
          
          if (parsedError) {
            if (parsedError.message) {
              errorMessage += `Server message: ${parsedError.message}\n\n`;
            }
            if (parsedError.errors && Array.isArray(parsedError.errors)) {
              errorMessage += `Validation errors:\n${parsedError.errors.map(err => `- ${err}`).join('\n')}\n\n`;
            }
            if (parsedError.requiredFields && Array.isArray(parsedError.requiredFields)) {
              errorMessage += `Required fields: ${parsedError.requiredFields.join(', ')}\n\n`;
            }
            if (parsedError.missingFields && Array.isArray(parsedError.missingFields)) {
              errorMessage += `Missing fields: ${parsedError.missingFields.join(', ')}\n\n`;
            }
            if (parsedError.invalidFields && Array.isArray(parsedError.invalidFields)) {
              errorMessage += `Invalid fields: ${parsedError.invalidFields.join(', ')}\n\n`;
            }
          } else {
            errorMessage += `Raw server response: ${errorText}\n\n`;
          }
          
          errorMessage += `Debugging steps:\n`;
          errorMessage += `1. Check file format (.xlsx, .xls, .csv only)\n`;
          errorMessage += `2. Verify column headers match exactly\n`;
          errorMessage += `3. Ensure no empty required fields\n`;
          errorMessage += `4. Try the "Test File" button for a working example\n`;
          errorMessage += `5. Check console for detailed error logs\n`;
          
          alert(errorMessage);
        } else {
          alert(`Validation failed: ${response.status} ${response.statusText}\nError: ${errorText}`);
        }
      }
    } catch (error) {
      console.error('Error validating file:', error);
      alert(`Network error while validating file: ${error.message}\nCheck console for details.`);
    } finally {
      setIsImporting(false);
    }
  };

  /**
   * Checks for duplicate investors based on email, organization name, or phone number
   * Normalizes data before comparison to catch variations
   * Toggles between showing duplicates and showing all investors
   * @returns {void}
   */
  const handleCheckDuplicates = () => {
    // If already showing duplicates, toggle back to all investors
    if (showDuplicates) {
      setShowDuplicates(false);
      setDuplicateInvestors([]);
      setCurrentPage(1);
      showInfo('Showing all investors');
      return;
    }

    // Clear any active filters when checking for duplicates
    setIsFiltered(false);
    setSearchTerm('');
    setFilteredInvestors([]);

    // Find duplicate investors based on email, organization name, or phone number
    const emailMap = new Map();
    const orgNameMap = new Map();
    const phoneMap = new Map();
    const duplicateIds = new Set();
    
    /**
     * Normalizes strings for comparison (lowercase, trim, normalize whitespace)
     * @param {any} str - String to normalize
     * @returns {string} Normalized string
     */
    const normalizeString = (str) => {
      if (!str) return '';
      return str.toString().toLowerCase().trim().replace(/\s+/g, ' ');
    };
    
    /**
     * Normalizes phone numbers by removing all non-digit characters
     * @param {any} phone - Phone number to normalize
     * @returns {string} Normalized phone number (digits only)
     */
    const normalizePhone = (phone) => {
      if (!phone) return '';
      return phone.toString().replace(/\D/g, ''); // Remove all non-digits
    };
    
    // Group investors by email, organization name, or phone number
    investors.forEach(investor => {
      const email = normalizeString(investor.email);
      const orgName = normalizeString(investor.organizationPersonName);
      const phone = normalizePhone(investor.phoneNumber || investor.phone);
      const investorId = investor.id || investor._id;
      
      if (!investorId) return; // Skip if no ID
      
      // Group by email (if email exists and is not empty)
      if (email && email.length > 0) {
        if (!emailMap.has(email)) {
          emailMap.set(email, []);
        }
        emailMap.get(email).push(investor);
      }
      
      // Group by organization name (if org name exists and is not empty)
      if (orgName && orgName.length > 0) {
        if (!orgNameMap.has(orgName)) {
          orgNameMap.set(orgName, []);
        }
        orgNameMap.get(orgName).push(investor);
      }
      
      // Group by phone (if phone exists and has at least 7 digits)
      if (phone && phone.length >= 7) {
        if (!phoneMap.has(phone)) {
          phoneMap.set(phone, []);
        }
        phoneMap.get(phone).push(investor);
      }
    });
    
    // Find duplicates in each category
    emailMap.forEach((group, email) => {
      if (group.length > 1) {
        group.forEach(inv => {
          const id = inv.id || inv._id;
          if (id) duplicateIds.add(id);
        });
      }
    });
    
    orgNameMap.forEach((group, orgName) => {
      if (group.length > 1) {
        group.forEach(inv => {
          const id = inv.id || inv._id;
          if (id) duplicateIds.add(id);
        });
      }
    });
    
    phoneMap.forEach((group, phone) => {
      if (group.length > 1) {
        group.forEach(inv => {
          const id = inv.id || inv._id;
          if (id) duplicateIds.add(id);
        });
      }
    });
    
    // Get all duplicate investors
    const duplicates = investors.filter(investor => {
      const id = investor.id || investor._id;
      return id && duplicateIds.has(id);
    });
    
    if (duplicates.length > 0) {
      setDuplicateInvestors(duplicates);
      setShowDuplicates(true);
      setCurrentPage(1);
      showSuccess(`Found ${duplicates.length} duplicate investor(s)`);
    } else {
      setShowDuplicates(false);
      setDuplicateInvestors([]);
      showInfo('No duplicates found');
    }
  };

  /**
   * Exports selected investors to CSV file
   * Only exports investors that are currently selected in the table
   * @returns {void}
   */
  const handleExport = () => {
    // Check if any rows are selected
    if (selectedRows.size === 0) {
      showWarning('Please select at least one investor to export.');
      return;
    }

    try {
      // Get selected investors
      const selectedInvestorIds = Array.from(selectedRows);
      const selectedInvestorsData = investors.filter(investor => {
        const id = investor.id || investor._id;
        return id && selectedInvestorIds.includes(id);
      });

      if (selectedInvestorsData.length === 0) {
        showError('No investors found to export. Please refresh and try again.');
        return;
      }

      // CSV column headers
      const csvHeaders = [
        'Organization',
        'First Name',
        'Last Name',
        'Email',
        'Location',
        'Revenue Criteria',
        'Industries',
        'Sector',
        'Investor Type',
        'Investment Stage',
        'Description',
        'LinkedIn',
        'Phone',
        'Website'
      ];

      /**
       * Escapes CSV values to handle commas, quotes, and newlines
       * @param {any} value - Value to escape
       * @returns {string} Escaped CSV value
       */
      const escapeCSV = (value) => {
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        // If value contains comma, newline, or quote, wrap in quotes and escape quotes
        if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      };

      /**
       * Formats industries array/string for CSV
       * @param {string|Array} industries - Industries to format
       * @returns {string} Formatted industries string
       */
      const formatIndustries = (industries) => {
        if (!industries) return '';
        if (Array.isArray(industries)) {
          return industries.join('; ');
        }
        if (typeof industries === 'string') {
          return industries.split(',').map(i => i.trim()).join('; ');
        }
        return String(industries);
      };

      // Create CSV rows
      const csvRows = selectedInvestorsData.map(investor => {
        return [
          escapeCSV(investor.organizationPersonName || ''),
          escapeCSV(investor.firstName || ''),
          escapeCSV(investor.lastName || ''),
          escapeCSV(investor.email || ''),
          escapeCSV(investor.location || ''),
          escapeCSV(investor.revenueCriteria || ''),
          escapeCSV(formatIndustries(investor.industries)),
          escapeCSV(investor.sector || ''),
          escapeCSV(investor.investorType || ''),
          escapeCSV(investor.investmentStage || ''),
          escapeCSV(investor.description || ''),
          escapeCSV(investor.linkedin || ''),
          escapeCSV(investor.phoneNumber || investor.phone || ''),
          escapeCSV(investor.website || '')
        ].join(',');
      });

      // Combine headers and rows
      const csvContent = [
        csvHeaders.join(','),
        ...csvRows
      ].join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `investors_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      URL.revokeObjectURL(url);
      
      showSuccess(`Exported ${selectedInvestorsData.length} investor(s) to CSV`);
    } catch (error) {
      ErrorHandler.logError('handleExport', error);
      showError(`Error exporting CSV: ${error.message}`);
    }
  };

  /**
   * Separates investors into approved and unapproved lists
   * Handles various status formats (numeric: 0, 1, 2 or string: 'pending', 'approved', 'rejected')
   * Default behavior: treats investors without status field as approved
   */
  const approvedInvestors = investors.filter(investor => {
    // If status field exists, use it; otherwise treat all as approved
    if (investor.status !== undefined && investor.status !== null) {
      const statusStr = String(investor.status).toLowerCase();
      return statusStr === '1' || statusStr === 'approved';
    }
    // Default: treat all investors as approved if no status field
    return true;
  });

  /**
   * Filters unapproved investors
   * Includes pending (0), rejected (2), and unapproved statuses
   * Default behavior: treats investors without status field as approved (not unapproved)
   */
  const unapprovedInvestors = investors.filter(investor => {
    // If status field exists, use it; otherwise treat none as unapproved
    if (investor.status !== undefined && investor.status !== null) {
      const statusStr = String(investor.status).toLowerCase();
      return statusStr === '0' || statusStr === '2' || 
             statusStr === 'pending' || statusStr === 'rejected' ||
             statusStr === 'unapproved';
    }
    // Default: no unapproved investors if no status field
    return false;
  });

  /**
   * Client-side search filtering when API search is not available or search term is too short
   * Filters investors by organization name, email, or full name
   * Falls back to API search results if available
   */
  const searchFilteredInvestors = searchTerm.trim() && searchResults.length > 0 
    ? searchResults 
    : activeTab === 'approved' 
      ? approvedInvestors.filter(investor => 
          (investor.organizationPersonName || investor.organization || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (investor.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          `${investor.firstName || ''} ${investor.lastName || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : unapprovedInvestors.filter(investor => 
          (investor.organizationPersonName || investor.organization || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (investor.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          `${investor.firstName || ''} ${investor.lastName || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
        );

  /**
   * Separates filtered investors by status when filters are applied
   * Memoized to prevent unnecessary recalculations
   * Used when advanced filters from sidebar are active
   */
  const filteredApprovedInvestors = useMemo(() => {
    return isFiltered ? filteredInvestors.filter(investor => {
      if (investor.status !== undefined && investor.status !== null) {
        const statusStr = String(investor.status).toLowerCase();
        return statusStr === '1' || statusStr === 'approved';
      }
      return true; // Default: treat as approved if no status field
    }) : approvedInvestors;
  }, [isFiltered, filteredInvestors, approvedInvestors]);

  /**
   * Filters unapproved investors from filtered results
   * Memoized to prevent unnecessary recalculations
   * Used when advanced filters from sidebar are active
   */
  const filteredUnapprovedInvestors = useMemo(() => {
    return isFiltered ? filteredInvestors.filter(investor => {
      if (investor.status !== undefined && investor.status !== null) {
        const statusStr = String(investor.status).toLowerCase();
        return statusStr === '0' || statusStr === '2' || 
               statusStr === 'pending' || statusStr === 'rejected' ||
               statusStr === 'unapproved';
      }
      return false; // Default: no unapproved if no status field
    }) : unapprovedInvestors;
  }, [isFiltered, filteredInvestors, unapprovedInvestors]);

  // Debug logging for filtered investors
  if (isFiltered) {
    console.log('🔍 Filter Debug Info:');
    console.log('📊 Total filtered investors:', filteredInvestors.length);
    console.log('📊 Filtered approved investors:', filteredApprovedInvestors.length);
    console.log('📊 Filtered unapproved investors:', filteredUnapprovedInvestors.length);
    console.log('📊 Active tab:', activeTab);
    console.log('📊 Current investors will be:', activeTab === 'approved' ? filteredApprovedInvestors.length : filteredUnapprovedInvestors.length);
    console.log('📊 First few filtered investors:', filteredInvestors.slice(0, 3));
    console.log('📊 First few approved investors:', filteredApprovedInvestors.slice(0, 3));
    console.log('📊 First few unapproved investors:', filteredUnapprovedInvestors.slice(0, 3));
    console.log('📊 Sample investor statuses:', filteredInvestors.slice(0, 5).map(inv => ({ id: inv._id || inv.id, status: inv.status })));
  }

  /**
   * Calculates the current list of investors to display
   * Priority order:
   * 1. Duplicates (if showDuplicates is true)
   * 2. Filtered investors (if filters are applied)
   * 3. Search results (if search term exists)
   * 4. Approved/Unapproved investors based on active tab
   * Memoized to prevent unnecessary recalculations
   */
  const currentInvestors = useMemo(() => {
    return showDuplicates 
      ? duplicateInvestors
      : (isFiltered 
        ? (activeTab === 'approved' ? filteredApprovedInvestors : filteredUnapprovedInvestors)
        : (searchTerm.trim() ? searchFilteredInvestors : (activeTab === 'approved' ? approvedInvestors : unapprovedInvestors)));
  }, [showDuplicates, duplicateInvestors, isFiltered, activeTab, filteredApprovedInvestors, filteredUnapprovedInvestors, searchTerm, searchFilteredInvestors, approvedInvestors, unapprovedInvestors]);
  
  // Pagination calculations
  const totalPages = Math.ceil(currentInvestors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  
  /**
   * Paginated investors list for current page
   * Memoized to prevent unnecessary recalculations
   */
  const paginatedInvestors = useMemo(() => {
    return currentInvestors.slice(startIndex, endIndex);
  }, [currentInvestors, startIndex, endIndex]);

  /**
   * Pagination handlers
   */
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  /**
   * Handles items per page change
   * Resets to first page when changing page size
   * @param {number} newItemsPerPage - New number of items per page
   */
  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  /**
   * Reset pagination when filters change
   * Resets to page 1 when switching tabs or changing search term
   */
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm]);

  /**
   * Reset pagination when filters are applied or cleared
   * Ensures user sees first page of filtered results
   */
  useEffect(() => {
    if (isFiltered) {
      setCurrentPage(1);
    }
  }, [isFiltered]);

  /**
   * Selection handlers for table rows
   * Manages checkbox selection state for bulk operations
   */
  
  /**
   * Toggles selection of all investors on current page
   * Selects all if none selected, deselects all if all selected
   */
  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedRows(new Set());
      setIsAllSelected(false);
    } else {
      const allIds = new Set(paginatedInvestors.map(investor => investor.id || investor._id));
      setSelectedRows(allIds);
      setIsAllSelected(true);
    }
  };

  /**
   * Toggles selection of a single investor row
   * @param {string} investorId - ID of the investor to toggle
   */
  const handleSelectRow = (investorId) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(investorId)) {
      newSelected.delete(investorId);
    } else {
      newSelected.add(investorId);
    }
    setSelectedRows(newSelected);
  };

  /**
   * Syncs isAllSelected state with selectedRows and paginatedInvestors
   * Updates checkbox state when selection changes or page changes
   */
  useEffect(() => {
    if (paginatedInvestors.length === 0) {
      setIsAllSelected(false);
      return;
    }
    const allPaginatedIds = new Set(paginatedInvestors.map(investor => investor.id || investor._id));
    const allSelected = allPaginatedIds.size > 0 && 
      Array.from(allPaginatedIds).every(id => selectedRows.has(id));
    setIsAllSelected(allSelected);
  }, [selectedRows, paginatedInvestors]);

  /**
   * Deletes multiple investors in bulk
   * Requires confirmation before deletion
   * Processes deletions sequentially and provides detailed feedback
   * @returns {Promise<void>}
   */
  const handleBulkDelete = async () => {
    if (selectedRows.size === 0) {
      showWarning('Please select at least one investor to delete.');
      return;
    }
    
    // Confirmation dialog
    const confirmed = window.confirm(
      `⚠️ WARNING: This action cannot be undone!\n\n` +
      `Are you sure you want to delete ${selectedRows.size} selected investor(s)?\n\n` +
      `This will permanently remove:\n` +
      `• All selected investor records\n` +
      `• Associated data\n\n` +
      `Click OK to proceed or Cancel to abort.`
    );
    
    if (!confirmed) {
      return;
    }

    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }

      const selectedInvestorIds = Array.from(selectedRows);
      let successCount = 0;
      let errorCount = 0;
      const errors = [];
      
      console.log(`🗑️ Starting bulk delete of ${selectedInvestorIds.length} investors`);
      
      // Delete each selected investor sequentially
      for (const investorId of selectedInvestorIds) {
        try {
          const response = await axios.delete(`investors/${investorId}`, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.data && response.data.success) {
            successCount++;
            console.log(`✅ Deleted investor ${investorId}`);
          } else {
            errorCount++;
            const errorMsg = response.data?.message || 'Unknown error';
            errors.push(`Investor ${investorId}: ${errorMsg}`);
            ErrorHandler.logError('handleBulkDelete', new Error(errorMsg), { investorId });
          }
        } catch (error) {
          errorCount++;
          ErrorHandler.logError('handleBulkDelete', error, { investorId });
          
          if (error.response) {
            const errorMsg = await ErrorHandler.formatHttpError(error.response, 'Failed to delete');
            errors.push(`Investor ${investorId}: ${errorMsg}`);
          } else {
            const errorMsg = ErrorHandler.formatNetworkError(error);
            errors.push(`Investor ${investorId}: ${errorMsg}`);
          }
        }
      }
      
      // Show results summary
      if (successCount > 0) {
        if (errorCount === 0) {
          showSuccess(`Successfully deleted ${successCount} investor(s)!`);
        } else {
          showWarning(
            `Deleted ${successCount} investor(s) successfully.\n` +
            `Failed to delete ${errorCount} investor(s).\n\n` +
            `Errors:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? '\n...' : ''}`
          );
        }
        
        // Clear selection and refresh data
        setSelectedRows(new Set());
        setIsAllSelected(false);
        await fetchInvestors();
      } else {
        // All deletions failed
        const errorSummary = errors.slice(0, 10).join('\n');
        showError(
          `Failed to delete any investors.\n\n` +
          `Errors:\n${errorSummary}${errors.length > 10 ? `\n... and ${errors.length - 10} more` : ''}`
        );
      }
      
    } catch (error) {
      ErrorHandler.logError('handleBulkDelete', error);
      const errorMsg = ErrorHandler.formatNetworkError(error);
      showError(`Error during bulk delete: ${errorMsg}`);
    }
  };

  const handleBulkUpdate = async () => {
    if (selectedRows.size === 0) {
      alert('Please select at least one investor to update.');
      return;
    }
    
    try {
      const token = authService.getToken();
      const selectedInvestorIds = Array.from(selectedRows);
      let successCount = 0;
      let errorCount = 0;
      let pendingCount = 0;
      let approvedCount = 0;
      
      console.log(`🔄 Auto-toggling status for ${selectedInvestorIds.length} investors`);
      
      // First, get current status of selected investors to determine toggle direction
      const currentInvestors = investors.filter(investor => selectedInvestorIds.includes(investor._id || investor.id));
      
      // Count current statuses
      currentInvestors.forEach(investor => {
        const currentStatus = investor.status;
        if (currentStatus === 0 || currentStatus === '0' || currentStatus === 'pending') {
          pendingCount++;
        } else if (currentStatus === 1 || currentStatus === '1' || currentStatus === 'approved') {
          approvedCount++;
        }
      });
      
      // Determine new status based on majority
      // If more are pending, approve them. If more are approved, make them pending.
      const newStatus = pendingCount >= approvedCount ? 1 : 0;
      const statusText = newStatus === 1 ? 'Approved' : 'Pending';
      
      console.log(`📊 Current: ${pendingCount} pending, ${approvedCount} approved`);
      console.log(`🔄 Toggling to: ${statusText} (${newStatus})`);
      
      // Update each selected investor
      for (const investorId of selectedInvestorIds) {
        try {
          // Try the status endpoint first, fallback to main endpoint if 404
          let response = await fetch(`${API_BASE_URL}/investors/${investorId}/status`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': token ? `Bearer ${token}` : '',
            },
            body: JSON.stringify({ status: newStatus })
          });
          
          // If status endpoint returns 404, try the main investor endpoint
          if (response.status === 404) {
            console.log(`⚠️ Status endpoint not found, trying main endpoint for investor ${investorId}`);
            response = await fetch(`${API_BASE_URL}/investors/${investorId}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : '',
              },
              body: JSON.stringify({ status: newStatus })
            });
          }
          
          if (response.ok) {
            successCount++;
            console.log(`✅ Updated investor ${investorId} to ${statusText}`);
          } else {
            errorCount++;
            console.error(`❌ Failed to update investor ${investorId}:`, response.status);
            if (response.status === 404) {
              console.error(`❌ 404 - Both endpoints not found:`);
              console.error(`   - ${API_BASE_URL}/investors/${investorId}/status`);
              console.error(`   - ${API_BASE_URL}/investors/${investorId}`);
              console.error(`💡 Please check your backend API routes.`);
            }
          }
        } catch (error) {
          errorCount++;
          console.error(`❌ Error updating investor ${investorId}:`, error);
        }
      }
      
      // Show results
      if (successCount > 0) {
        alert(`✅ Successfully updated ${successCount} investor(s) to ${statusText}!\n${errorCount > 0 ? `❌ Failed to update ${errorCount} investor(s).` : ''}`);
        
        // Clear selection and refresh data
        setSelectedRows(new Set());
        setIsAllSelected(false);
        await fetchInvestors(); // Refresh the investors list
      } else {
        alert(`❌ Failed to update any investors.\n\n💡 Backend API routes needed:\n- PUT /investors/:id/status\n- OR PUT /investors/:id\n\nPlease check your backend server.`);
      }
      
    } catch (error) {
      console.error('❌ Error in bulk update:', error);
      alert(`❌ Error updating investors: ${error.message}`);
    }
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <div className="dashboard-layout">
          {/* Left Sidebar - Filters */}
          <Sidebar
            filters={filters}
            handleFilterChange={handleFilterChange}
            handleSaveView={handleSaveView}
            fetchInvestors={fetchInvestors}
            fetchFilterOptions={fetchFilterOptions}
            fetchDashboardStats={fetchDashboardStats}
            filterOptions={filterOptions}
            dashboardStats={dashboardStats}
            onApplyFilters={handleApplyFilters}
          />

          {/* Main Content */}
          <div className="dashboard-main ai-features chart-section">
           

            {/* Filter Status Indicator */}
            
            {/* Toolbar */}
            <div className="dashboard-toolbar import-section">
              <div className="toolbar-left">
                {/* Status Tabs */}
                <div className="status-tabs">
                  <button 
                    className={`status-tab ${activeTab === 'approved' ? 'active' : ''}`}
                    onClick={() => setActiveTab('approved')}
                  >
                    Approved ({isFiltered ? filteredApprovedInvestors.length : approvedInvestors.length})
                  </button>
                  <button 
                    className={`status-tab ${activeTab === 'unapproved' ? 'active' : ''}`}
                    onClick={() => setActiveTab('unapproved')}
                  >
                    Unapproved ({isFiltered ? filteredUnapprovedInvestors.length : unapprovedInvestors.length})
                  </button>
                </div>
                <button className="toolbar-btn primary" onClick={handleAddInvestor}>
                + Add New Investor
                </button>
                  <button 
                    className="toolbar-btn primary" 
                    onClick={() => {
                      setShowImportCSV2Modal(true);
                      // Ajouter la classe modal-open au body
                      document.body.classList.add('modal-open');
                    }}
                    style={{ backgroundColor: '#4ecdc4', color: 'white', fontWeight: 'bold' }}
                  >
                    📥 Import CSV 
                  </button>
                {isFiltered && (
                  <button 
                    className="toolbar-btn clear-btn" 
                    onClick={handleClearFilters}
                    title="Clear all filters and show all investors"
                    style={{ backgroundColor: '#dc3545', color: 'white' }}
                  >
                    🗑️ Clear Filters
                  </button>
                )}
                  <button 
                    className="toolbar-btn export-btn" 
                    onClick={handleExport}
                    disabled={selectedRows.size === 0}
                    style={{ 
                      backgroundColor: selectedRows.size > 0 ? 'white' : '#f3f4f6', 
                      color: selectedRows.size > 0 ? '#2c3e50' : '#9ca3af', 
                      border: '2px solid #dee2e6',
                      cursor: selectedRows.size > 0 ? 'pointer' : 'not-allowed',
                      opacity: selectedRows.size > 0 ? 1 : 0.6
                    }}
                    title={selectedRows.size > 0 ? `Export ${selectedRows.size} selected investor(s) to CSV` : 'Please select at least one investor to export'}
                  >
                    📤 Export CSV {selectedRows.size > 0 && `(${selectedRows.size})`}
                  </button>
                <div className="search-container">
                  <input
                    type="text"
                    placeholder={isSearching ? "Searching..." : "Search investors..."}
                    className={`search-bar ${isSearching ? 'searching' : ''} ${searchError ? 'error' : ''}`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    disabled={isSearching}
                  />
                  {isSearching && (
                    <div className="search-loading">
                      <div className="spinner"></div>
                    </div>
                  )}
                  {searchError && (
                    <div className="search-error" title={searchError}>
                      ⚠️
                    </div>
                  )}
                  {searchTerm.trim() && searchResults.length > 0 && (
                    <div className="search-results-count">
                      {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
                <button 
                  className={`toolbar-btn check-duplicates-btn ${showDuplicates ? 'active' : ''}`}
                  onClick={handleCheckDuplicates}
                  title={showDuplicates ? 'Show all investors' : 'Check for duplicate investors'}
                >
                  {showDuplicates ? '✓ Show All' : ' Check Duplicates'}
                </button>
               
              </div>
              <div className="toolbar-right">
                {/* Search and Export functionality moved to toolbar-left */}
              </div>
             </div>

            {/* Table */}
            <div className="dashboard-table-container">
              {showDuplicates && duplicateInvestors.length > 0 && (
                <div className="duplicates-info">
                  <span className="duplicates-badge">
                    ⚠️ {duplicateInvestors.length} Duplicate Investor(s) Found
                  </span>
                </div>
              )}
              {isLoadingInvestors ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>Loading investors...</p>
                </div>
              ) : (
                <table className="investors-table">
                  <thead>
                    <tr>
                      <th className="checkbox-column">
                        <input 
                          type="checkbox" 
                          checked={isAllSelected}
                          onChange={handleSelectAll}
                          className="master-checkbox"
                          title="Select all investors"
                        />
                      </th>
                      <th>Organization</th>
                      <th>First Name</th>
                      <th>Last Name</th>
                      <th>Location</th>
                      <th>Revenue Criteria</th>
                      <th>Industries</th>
                      <th>Sector</th>
                      <th>Investor Type</th>
                      <th>Investment Stage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedInvestors.length === 0 ? (
                      <tr>
                        <td colSpan="15" className="no-data">
                          {isFiltered ? 'No investors found with current filters' : 'No investors found'}
                        </td>
                      </tr>
                    ) : (
                      paginatedInvestors.map(investor => {
                        const investorId = investor.id || investor._id;
                        const isSelected = selectedRows.has(investorId);
                        const isDuplicate = showDuplicates && duplicateInvestors.some(dup => (dup.id || dup._id) === investorId);
                        
                        return (
                          <tr key={investorId} className={`${isSelected ? 'selected-row' : ''} ${isDuplicate ? 'duplicate-row' : ''}`}>
                            <td className="checkbox-column">
                              <input 
                                type="checkbox" 
                                checked={isSelected}
                                onChange={() => handleSelectRow(investorId)}
                                className="row-checkbox"
                                title="Select this investor"
                              />
                            </td>
                            <td className="org-cell" onClick={() => handleOrganizationClick(investor)} style={{ cursor: 'pointer' }}>
                              <div className="org-info">
                                <strong>{investor.organizationPersonName || 'N/A'}</strong>
                                {investor.email && (
                                  <div className="org-email">{investor.email}</div>
                                )}
                              </div>
                            </td>
                            <td className="firstname-cell">
                              {investor.firstName || 'N/A'}
                            </td>
                            <td className="lastname-cell">
                              {investor.lastName || 'N/A'}
                            </td>
                            <td className="location-cell">
                              {investor.location || 'N/A'}
                            </td>
                            <td className="revenue-cell">
                              {investor.revenueCriteria || 'N/A'}
                            </td>
                            <td>
                              <div className="industries-tags">
                                {investor.industries ? (
                                  typeof investor.industries === 'string' ? (
                                    investor.industries.split(',').map((industry, index) => (
                                      <span key={index} className="industry-tag">{industry.trim()}</span>
                                    ))
                                  ) : (
                                    investor.industries.map((industry, index) => (
                                      <span key={index} className="industry-tag">{industry}</span>
                                    ))
                                  )
                                ) : (
                                  <span className="industry-tag">N/A</span>
                                )}
                              </div>
                            </td>
                            <td className="sector-cell">
                              {investor.sector || 'N/A'}
                            </td>
                            <td className="type-cell">
                              {investor.investorType || 'N/A'}
                            </td>
                            <td className="stage-cell">
                              {investor.investmentStage || 'N/A'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {/* Delete Button - Show when rows are selected */}
            {selectedRows.size > 0 && (
              <div className="bulk-delete-container">
                <button 
                  className="bulk-delete-btn"
                  onClick={handleBulkDelete}
                  title={`Delete ${selectedRows.size} selected investor(s)`}
                >
                  🗑️ Delete ({selectedRows.size})
                </button>
              </div>
            )}

            {/* Pagination - Always show when there are results */}
            {currentInvestors.length > 0 && (
              <div className="pagination-container">
                <div className="pagination-info">
                  <span>
                    Showing {startIndex + 1} to {Math.min(endIndex, currentInvestors.length)} of {currentInvestors.length} investors
                  </span>
                  <div className="items-per-page">
                    <label>Items per page:</label>
                    <select 
                      value={itemsPerPage} 
                      onChange={(e) => handleItemsPerPageChange(parseInt(e.target.value))}
                      className="items-per-page-select"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                </div>
                
                <div className="pagination-controls">
                  <button 
                    className="pagination-btn"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                  
                  <div className="pagination-numbers">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button 
                    className="pagination-btn"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Investor Modal */}
      {showAddInvestorModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2>Add New Investor</h2>
              <button className="close-btn" onClick={handleCloseModal}>×</button>
            </div>
            
            <form onSubmit={handleSubmitInvestor} className="modal-form">
              <div className="form-section">
                <h3>Basic Information</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="investorType">Investor Type *</label>
                    <select
                      id="investorType"
                      name="investorType"
                      value={newInvestor.investorType}
                      onChange={handleInputChange}
                      className={formErrors.investorType ? 'error' : ''}
                    >
                      <option value="">Select Investor Type</option>
                      <option value="Venture Capitalist">Venture Capitalist</option>
                      <option value="Angel">Angel</option>
                      <option value="Corporate Investor">Corporate Investor</option>
                      <option value="Private Equity">Private Equity</option>
                    </select>
                    {formErrors.investorType && <span className="error-text">{formErrors.investorType}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="sector">Sector *</label>
                    <select
                      id="sector"
                      name="sector"
                      value={newInvestor.sector}
                      onChange={handleInputChange}
                      className={formErrors.sector ? 'error' : ''}
                    >
                      <option value="">Select Sector</option>
                      <option value="Technology">Technology</option>
                      <option value="Energy">Energy</option>
                      <option value="Education">Education</option>
                      <option value="Finance">Finance</option>
                      <option value="Healthcare">Healthcare</option>
                    </select>
                    {formErrors.sector && <span className="error-text">{formErrors.sector}</span>}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="industries">Industries *</label>
                    <input
                      type="text"
                      id="industries"
                      name="industries"
                      value={newInvestor.industries}
                      onChange={handleInputChange}
                      placeholder="e.g., AI, Blockchain, Biotech"
                      className={formErrors.industries ? 'error' : ''}
                    />
                    {formErrors.industries && <span className="error-text">{formErrors.industries}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="investmentStage">Investment Stage *</label>
                    <select
                      id="investmentStage"
                      name="investmentStage"
                      value={newInvestor.investmentStage}
                      onChange={handleInputChange}
                      className={formErrors.investmentStage ? 'error' : ''}
                    >
                      <option value="">Select Investment Stage</option>
                      <option value="Seed">Seed</option>
                      <option value="Series A">Series A</option>
                      <option value="Series B">Series B</option>
                      <option value="Series C">Series C</option>
                      <option value="Growth">Growth</option>
                      <option value="Late Stage">Late Stage</option>
                    </select>
                    {formErrors.investmentStage && <span className="error-text">{formErrors.investmentStage}</span>}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="revenueCriteria">Revenue Criteria *</label>
                    <select
                      id="revenueCriteria"
                      name="revenueCriteria"
                      value={newInvestor.revenueCriteria}
                      onChange={handleInputChange}
                      className={formErrors.revenueCriteria ? 'error' : ''}
                    >
                      <option value="">Select Revenue Criteria</option>
                      <option value="Under $1M">Under $1M</option>
                      <option value="$1M–$10M">$1M–$10M</option>
                      <option value="$10M–$50M">$10M–$50M</option>
                      <option value="$50M–$100M">$50M–$100M</option>
                      <option value="Over $100M">Over $100M</option>
                    </select>
                    {formErrors.revenueCriteria && <span className="error-text">{formErrors.revenueCriteria}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="location">Location *</label>
                    <input
                      type="text"
                      id="location"
                      name="location"
                      value={newInvestor.location}
                      onChange={handleInputChange}
                      placeholder="e.g., San Francisco, CA"
                      className={formErrors.location ? 'error' : ''}
                    />
                    {formErrors.location && <span className="error-text">{formErrors.location}</span>}
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Contact Information</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="organizationPersonName">Organization/Person Name</label>
                    <input
                      type="text"
                      id="organizationPersonName"
                      name="organizationPersonName"
                      value={newInvestor.organizationPersonName}
                      onChange={handleInputChange}
                      placeholder="Organization or person name"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="organizationPersonNameFirstLastName">Full Name (First Last)</label>
                    <input
                      type="text"
                      id="organizationPersonNameFirstLastName"
                      name="organizationPersonNameFirstLastName"
                      value={newInvestor.organizationPersonNameFirstLastName}
                      onChange={handleInputChange}
                      placeholder="Full name"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="firstName">First Name *</label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={newInvestor.firstName}
                      onChange={handleInputChange}
                      className={formErrors.firstName ? 'error' : ''}
                    />
                    {formErrors.firstName && <span className="error-text">{formErrors.firstName}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="lastName">Last Name *</label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={newInvestor.lastName}
                      onChange={handleInputChange}
                      className={formErrors.lastName ? 'error' : ''}
                    />
                    {formErrors.lastName && <span className="error-text">{formErrors.lastName}</span>}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="email">Email *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={newInvestor.email}
                      onChange={handleInputChange}
                      className={formErrors.email ? 'error' : ''}
                    />
                    {formErrors.email && <span className="error-text">{formErrors.email}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="phoneNumber">Phone Number</label>
                    <input
                      type="tel"
                      id="phoneNumber"
                      name="phoneNumber"
                      value={newInvestor.phoneNumber}
                      onChange={handleInputChange}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="website">Website</label>
                    <input
                      type="url"
                      id="website"
                      name="website"
                      value={newInvestor.website}
                      onChange={handleInputChange}
                      placeholder="https://example.com"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="linkedin">LinkedIn</label>
                    <input
                      type="url"
                      id="linkedin"
                      name="linkedin"
                      value={newInvestor.linkedin}
                      onChange={handleInputChange}
                      placeholder="https://linkedin.com/in/username"
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Additional Information</h3>
                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    value={newInvestor.description}
                    onChange={handleInputChange}
                    rows="4"
                    placeholder="Brief description about the investor..."
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn" disabled={isSubmitting}>
                  {isSubmitting ? 'Adding...' : 'Add Investor'}
                </button>
              </div>
            </form>
           </div>
         </div>
       )}

       {/* AI-Powered Import Modal */}
       {showImportModal && (
         <div className="modal-overlay">
           <div className="modal-container ai-import-modal">
             <div className="modal-header">
               <h2>🤖 AI-Powered Excel Import</h2>
               <button className="close-btn" onClick={handleCloseImportModal}>×</button>
             </div>
             
             {/* Enhanced Progress Indicator */}
             <div className="import-progress">
               <div className="progress-steps">
                 <div className={`step ${importStep === 'upload' ? 'active' : ['extracting', 'analyzing', 'mapping_preview', 'validating', 'importing'].includes(importStep) ? 'completed' : ''}`}>
                   <div className="step-number">1</div>
                   <div className="step-label">Upload</div>
                 </div>
                 <div className={`step ${importStep === 'extracting' ? 'active' : ['analyzing', 'mapping_preview', 'validating', 'importing'].includes(importStep) ? 'completed' : ''}`}>
                   <div className="step-number">2</div>
                   <div className="step-label">Extraction</div>
                 </div>
                 <div className={`step ${importStep === 'analyzing' ? 'active' : ['mapping_preview', 'validating', 'importing'].includes(importStep) ? 'completed' : ''}`}>
                   <div className="step-number">3</div>
                   <div className="step-label">IA Analysis</div>
                 </div>
                 <div className={`step ${importStep === 'mapping_preview' ? 'active' : ['validating', 'importing'].includes(importStep) ? 'completed' : ''}`}>
                   <div className="step-number">4</div>
                   <div className="step-label">Mapping</div>
                 </div>
                 <div className={`step ${importStep === 'validating' ? 'active' : importStep === 'importing' ? 'completed' : ''}`}>
                   <div className="step-number">5</div>
                   <div className="step-label">Validation</div>
                 </div>
                 <div className={`step ${importStep === 'importing' ? 'active' : ''}`}>
                   <div className="step-number">6</div>
                   <div className="step-label">Import</div>
                 </div>
               </div>
               <div className="progress-bar">
                 <div className="progress-fill" style={{width: `${importProgress}%`}}></div>
               </div>
             </div>
             
             <div className="dashboard-modal-content">
               {/* Step 1: Enhanced Upload */}
               {importStep === 'upload' && (
                 <div className="upload-step">
                   <div className="upload-options">
                     <div className="ai-toggle-section">
                       <h4>⚙️ Options d'Importation</h4>
                       <div className="toggle-option">
                         <label className="toggle-switch">
                           <input 
                             type="checkbox" 
                             checked={useAIMapping}
                             onChange={(e) => setUseAIMapping(e.target.checked)}
                           />
                           <span className="toggle-slider"></span>
                         </label>
                         <span className="toggle-label">
                           🤖 Utiliser l'analyse IA pour le mapping automatique
                         </span>
                       </div>
                       
                       <div className="toggle-option">
                         <label className="toggle-switch">
                           <input 
                             type="checkbox" 
                             checked={autoMappingEnabled}
                             onChange={(e) => setAutoMappingEnabled(e.target.checked)}
                           />
                           <span className="toggle-slider"></span>
                         </label>
                         <span className="toggle-label">
                           ⚡ Démarrer l'analyse automatiquement après l'upload
                         </span>
                       </div>
                     </div>
                   </div>

                   <div 
                     className={`drag-drop-zone ${isDragOver ? 'drag-over' : ''}`}
                     onDragOver={handleDragOver}
                     onDragLeave={handleDragLeave}
                     onDrop={handleDropEnhanced}
                     onClick={() => document.getElementById('file-upload-enhanced').click()}
                   >
                     <div className="upload-icon">📁</div>
                     <h4>Glissez-déposez votre fichier Excel ici</h4>
                     <p>ou cliquez pour sélectionner</p>
                     <div className="upload-info">
                       <p><strong>Formats supportés:</strong> .xlsx, .xls, .csv</p>
                       <p><strong>Taille maximale:</strong> 10MB</p>
                     </div>
                     
                     <input
                       id="file-upload-enhanced"
                       type="file"
                       accept=".xlsx,.xls,.csv"
                       onChange={handleFileSelectEnhanced}
                       style={{display: 'none'}}
                     />
                   </div>

                   {mappingHistory.length > 0 && (
                     <div className="mapping-templates">
                       <h5>📋 Templates de Mapping Sauvegardés</h5>
                       <div className="template-list">
                         {mappingHistory.slice(0, 3).map(template => (
                           <div key={template.id} className="template-item">
                             <span className="template-name">{template.name}</span>
                             <span className="template-fields">{Object.keys(template.mapping).length} champs</span>
                             <button 
                               className="load-template-btn"
                               onClick={() => loadMappingTemplate(template)}
                             >
                               Charger
                             </button>
                           </div>
                         ))}
                       </div>
                     </div>
                   )}
                 </div>
               )}

               {/* Step 2: Extracting */}
               {importStep === 'extracting' && (
                 <div className="extracting-step">
                   <div className="extraction-progress">
                     <div className="extraction-icon">📤</div>
                     <h4>Extraction des Données</h4>
                     <p>Lecture et analyse de votre fichier...</p>
                     <div className="loading-spinner"></div>
                     
                     <div className="analysis-messages">
                       {analysisMessages.map((message, index) => (
                         <div key={index} className="message-item">
                           <span className="message-dot">•</span>
                           {message}
                         </div>
                       ))}
                     </div>
                   </div>
                 </div>
               )}

               {/* Step 3: AI Analyzing */}
               {importStep === 'analyzing' && (
                 <div className="analyzing-step">
                   <div className="ai-analysis-progress">
                     <div className="ai-icon">🤖</div>
                     <h4>Analyse IA en Cours</h4>
                     <p>L'IA analyse vos données pour optimiser le mapping...</p>
                     
                     <div className="analysis-progress-bar">
                       <div className="progress-fill" style={{width: `${currentAnalysisProgress}%`}}></div>
                       <span className="progress-text">{currentAnalysisProgress}%</span>
                     </div>
                     
                     <div className="analysis-messages">
                       {analysisMessages.slice(-5).map((message, index) => (
                         <div key={index} className="message-item fade-in">
                           <span className="message-dot">•</span>
                           {message}
                         </div>
                       ))}
                     </div>

                     <div className="analysis-actions">
                       <button className="skip-ai-btn" onClick={skipToManualMapping}>
                         Passer au mapping manuel
                       </button>
                     </div>
                   </div>
                 </div>
               )}

               {/* Step 4: Enhanced Mapping Preview */}
               {importStep === 'mapping_preview' && mappingPreview && (
                 <div className="mapping-preview-step">
                   <div className="mapping-header">
                     <h4>🎯 Prévisualisation du Mapping</h4>
                     <div className="mapping-stats">
                       <div className="stat">
                         <span className="stat-value">{Object.keys(customMapping).length}</span>
                         <span className="stat-label">Champs Mappés</span>
                       </div>
                       <div className="stat">
                         <span className="stat-value">{qualityScore}%</span>
                         <span className="stat-label">Score Qualité</span>
                       </div>
                       <div className="stat">
                         <span className="stat-value">{extractedHeaders.length}</span>
                         <span className="stat-label">Colonnes Détectées</span>
                       </div>
                     </div>
                   </div>

                   <div className="mapping-controls">
                     <div className="control-buttons">
                       {aiMapping && Object.keys(aiMapping).length > 0 && (
                         <button className="reset-mapping-btn" onClick={resetMappingToAI}>
                           🤖 Réinitialiser à l'IA
                         </button>
                       )}
                       <button className="manual-mapping-btn" onClick={applyManualMapping}>
                         ✋ Mapping Manuel
                       </button>
                       <button className="save-template-btn" onClick={saveCurrentMapping}>
                         💾 Sauvegarder Template
                       </button>
                       {useAIMapping && (
                         <button className="retry-ai-btn" onClick={retryAIAnalysis}>
                           🔄 Refaire Analyse IA
                         </button>
                       )}
                     </div>
                   </div>

                   <div className="enhanced-mapping-table">
                     <div className="table-container">
                       <table className="mapping-comparison-table">
                         <thead>
                           <tr>
                             <th>En-tête Original</th>
                             <th>Champ Base de Données</th>
                             <th>Confiance IA</th>
                             <th>Exemple de Données</th>
                             <th>Actions</th>
                           </tr>
                         </thead>
                         <tbody>
                           {extractedHeaders.map((header, index) => {
                             const dbField = customMapping[header] || mappingPreview?.suggestedMapping?.[header] || '';
                             const confidence = mappingConfidence[header] || mappingPreview?.confidence?.[header] || 0;
                             const sampleValue = mappingPreview.sampleData[0] ? mappingPreview.sampleData[0][header] || 'N/A' : 'N/A';
                             
                             // Debug logging
                             console.log(`Mapping Debug - Header: "${header}", dbField: "${dbField}", confidence: ${confidence}`);
                             console.log('Custom mapping keys:', Object.keys(customMapping));
                             console.log('Suggested mapping keys:', Object.keys(mappingPreview?.suggestedMapping || {}));
                             console.log('Full custom mapping:', customMapping);
                             console.log('Full suggested mapping:', mappingPreview?.suggestedMapping);
                             
                             return (
                               <tr key={index} className={`mapping-row ${confidence > 80 ? 'high-confidence' : confidence > 50 ? 'medium-confidence' : 'low-confidence'}`}>
                                 <td className="original-header">
                                   <strong>{header}</strong>
                                 </td>
                                 <td className="db-field">
                                   <div className="mapped-field-display">
                                     <div className="field-name">
                                       <strong>{dbField || '-- Non mappé --'}</strong>
                                     </div>
                                     <select 
                                       value={dbField}
                                       onChange={(e) => handleMappingEdit(header, e.target.value)}
                                       className="mapping-select"
                                     >
                                       <option value="">-- Non mappé --</option>
                                       <option value="investorType">investorType</option>
                                       <option value="sector">sector</option>
                                       <option value="industries">industries</option>
                                       <option value="investmentStage">investmentStage</option>
                                       <option value="revenueCriteria">revenueCriteria</option>
                                       <option value="firstName">firstName</option>
                                       <option value="lastName">lastName</option>
                                       <option value="email">email</option>
                                       <option value="location">location</option>
                                       <option value="organizationPersonName">organizationPersonName</option>
                                       <option value="organizationPersonNameFirstNameLastName">organizationPersonNameFirstNameLastName</option>
                                       <option value="description">description</option>
                                       <option value="phoneNumber">phoneNumber</option>
                                       <option value="website">website</option>
                                       <option value="linkedin">linkedin</option>
                                     </select>
                                   </div>
                                 </td>
                                 <td className="confidence-score">
                                   <div className="confidence-display">
                                     {confidence > 0 ? (
                                       <div className={`confidence-badge confidence-${confidence > 80 ? 'high' : confidence > 50 ? 'medium' : 'low'}`}>
                                         <span className="confidence-value">{confidence}%</span>
                                         <span className="confidence-label">Confiance IA</span>
                                       </div>
                                     ) : (
                                       <div className="confidence-badge confidence-none">
                                         <span className="confidence-value">--</span>
                                         <span className="confidence-label">Non analysé</span>
                                       </div>
                                     )}
                                   </div>
                                 </td>
                                 <td className="sample-data" title={sampleValue}>
                                   {sampleValue}
                                 </td>
                                 <td className="actions">
                                   {userMappingEdits[header] && (
                                     <span className="edited-indicator" title="Modifié manuellement">✏️</span>
                                   )}
                                 </td>
                               </tr>
                             );
                           })}
                         </tbody>
                       </table>
                     </div>
                   </div>

                   {/* Mapping Quality Check */}
                   <div className="mapping-quality-check">
                     <h5>🔍 Vérification de la Qualité</h5>
                     {(() => {
                       const quality = validateMappingQuality();
                       return (
                         <div className={`quality-status ${quality.isValid ? 'valid' : 'invalid'}`}>
                           <div className="quality-indicator">
                             {quality.isValid ? '✅' : '⚠️'} 
                             {quality.mappedCount}/{quality.totalRequired} champs requis mappés
                           </div>
                           {!quality.isValid && quality.missingFields.length > 0 && (
                             <div className="missing-fields">
                               <strong>Champs manquants:</strong> {quality.missingFields.join(', ')}
                             </div>
                           )}
                         </div>
                       );
                     })()}
                   </div>

                   {/* AI Suggestions */}
                   {mappingSuggestions.length > 0 && (
                     <div className="ai-suggestions">
                       <h5>💡 Suggestions de l'IA</h5>
                       <ul>
                         {mappingSuggestions.map((suggestion, index) => (
                           <li key={index}>{suggestion}</li>
                         ))}
                       </ul>
                     </div>
                   )}

                   <div className="mapping-actions">
                     <button className="cancel-btn" onClick={handleCloseImportModal}>
                       Annuler
                     </button>
                     <button 
                       className="validate-mapping-btn" 
                       onClick={validateMapping}
                       disabled={!validateMappingQuality().isValid}
                     >
                       {validateMappingQuality().isValid ? 'Valider & Importer' : 'Mapping Incomplet'}
                     </button>
                   </div>
                 </div>
               )}

               {/* Step 2: AI Analysis - Keep existing for compatibility */}
               {importStep === 'analyze' && (
                 <div className="analyze-step">
                   <div className="ai-analysis">
                     <div className="ai-icon">🤖</div>
                     <h4>AI is analyzing your file...</h4>
                     <p>Detecting headers and generating intelligent mapping</p>
                     <div className="loading-spinner"></div>
                   </div>
                 </div>
               )}

               {/* Step 3: Mapping Interface */}
               {importStep === 'mapping' && headerAnalysis && (
                 <div className="mapping-step">
                   <div className="mapping-header">
                     <h4>📊 Column Mapping</h4>
                     <div className="quality-score">
                       <span className="score-label">AI Confidence:</span>
                       <div className="score-bar">
                         <div className="score-fill" style={{width: `${qualityScore}%`}}></div>
                       </div>
                       <span className="score-value">{qualityScore}%</span>
                     </div>
                   </div>

                   <div className="mapping-table">
                     <table>
                       <thead>
                         <tr>
                           <th>Excel Column</th>
                           <th>Database Field</th>
                           <th>Confidence</th>
                           <th>Action</th>
                         </tr>
                       </thead>
                       <tbody>
                         {Object.keys(aiMapping).map(excelHeader => {
                           const mapping = aiMapping[excelHeader];
                           return (
                             <tr key={excelHeader}>
                               <td className="excel-header">{excelHeader}</td>
                               <td>
                                 <select 
                                   value={customMapping[excelHeader] || mapping.dbField}
                                   onChange={(e) => handleMappingChange(excelHeader, e.target.value)}
                                   className="mapping-select"
                                 >
                                   <option value="">-- Select Field --</option>
                                   <option value="investorType">Investor Type</option>
                                   <option value="sector">Sector</option>
                                   <option value="industries">Industries</option>
                                   <option value="investmentStage">Investment Stage</option>
                                   <option value="revenueCriteria">Revenue Criteria</option>
                                   <option value="firstName">First Name</option>
                                   <option value="lastName">Last Name</option>
                                   <option value="email">Email</option>
                                   <option value="location">Location</option>
                                   <option value="phoneNumber">Phone Number</option>
                                   <option value="website">Website</option>
                                   <option value="linkedin">LinkedIn</option>
                                   <option value="description">Description</option>
                                 </select>
                               </td>
                               <td className="confidence">
                                 <span className={`confidence-badge ${mapping.confidence > 80 ? 'high' : mapping.confidence > 60 ? 'medium' : 'low'}`}>
                                   {mapping.confidence}%
                                 </span>
                               </td>
                               <td>
                                 {mapping.suggestion && (
                                   <button 
                                     className="suggestion-btn"
                                     onClick={() => handleMappingChange(excelHeader, mapping.suggestion)}
                                     title={mapping.suggestion}
                                   >
                                     💡
                                   </button>
                                 )}
                               </td>
                             </tr>
                           );
                         })}
                       </tbody>
                     </table>
                   </div>

                   {/* Excel Data Preview */}
                   {excelData && excelData.length > 0 && (
                     <div className="excel-data-preview">
                       <h5>📋 Excel Data Preview (3 rows)</h5>
                       <div className="data-table-container">
                         <table className="data-preview-table">
                           <thead>
                             <tr>
                               {Object.keys(excelData[0]).map(header => (
                                 <th key={header}>{header}</th>
                               ))}
                             </tr>
                           </thead>
                           <tbody>
                             {excelData.map((row, index) => (
                               <tr key={index}>
                                 {Object.values(row).map((value, cellIndex) => (
                                   <td key={cellIndex} title={value}>
                                     {value}
                                   </td>
                                 ))}
                               </tr>
                             ))}
                           </tbody>
                         </table>
                       </div>
                       <p className="data-preview-note">
                         💡 This preview shows 3 complete rows from your Excel file. 
                         Use the mapping above to match Excel columns to database fields.
                         After validation, all data will be imported to the database.
                       </p>
                     </div>
                   )}

                   {/* Debug Info - Show available Excel headers and current mapping */}
                   {excelData && excelData.length > 0 && (
                     <div className="debug-info" style={{ marginBottom: '20px', padding: '10px', background: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '5px' }}>
                       <h6>🔍 Debug Info:</h6>
                       <p><strong>Available Excel Headers:</strong> {Object.keys(excelData[0] || {}).join(', ')}</p>
                       <p><strong>Current Mapping:</strong> {JSON.stringify(customMapping, null, 2)}</p>
                       <p><strong>Sample Excel Data:</strong> {JSON.stringify(excelData[0], null, 2)}</p>
                     </div>
                   )}

                   {/* Mapped Data Preview - Shows how data will look after mapping */}
                   {excelData && excelData.length > 0 && customMapping && (
                     <div className="mapped-data-preview">
                       <h5>🎯 Mapped Data Preview (After Validation)</h5>
                       <div className="data-table-container">
                         <table className="data-preview-table">
                           <thead>
                             <tr>
                               <th>Database Field</th>
                               <th>Excel Column</th>
                               <th>Sample Data (Row 1)</th>
                               <th>Sample Data (Row 2)</th>
                               <th>Sample Data (Row 3)</th>
                             </tr>
                           </thead>
                           <tbody>
                             {Object.entries(customMapping).map(([dbField, excelColumn]) => {
                               console.log('Mapping entry:', { dbField, excelColumn });
                               console.log('Excel data sample:', excelData[0]);
                               console.log('Available Excel columns:', Object.keys(excelData[0] || {}));
                               
                               return (
                                 <tr key={dbField}>
                                   <td><strong>{dbField}</strong></td>
                                   <td>{excelColumn || 'Not mapped'}</td>
                                   <td>
                                     {excelColumn && excelData[0] && excelData[0].hasOwnProperty(excelColumn) ? 
                                       excelData[0][excelColumn] : 'N/A'
                                     }
                                   </td>
                                   <td>
                                     {excelColumn && excelData[1] && excelData[1].hasOwnProperty(excelColumn) ? 
                                       excelData[1][excelColumn] : 'N/A'
                                     }
                                   </td>
                                   <td>
                                     {excelColumn && excelData[2] && excelData[2].hasOwnProperty(excelColumn) ? 
                                       excelData[2][excelColumn] : 'N/A'
                                     }
                                   </td>
                                 </tr>
                               );
                             })}
                           </tbody>
                         </table>
                       </div>
                       <p className="mapped-data-note">
                         🎯 This shows how your Excel data will be mapped to database fields.
                         After clicking "Validate & Import", all rows will be imported with this mapping.
                       </p>
                     </div>
                   )}

                   {mappingSuggestions.length > 0 && (
                     <div className="suggestions">
                       <h5>💡 AI Suggestions</h5>
                       <ul>
                         {mappingSuggestions.map((suggestion, index) => (
                           <li key={index}>{suggestion}</li>
                         ))}
                       </ul>
                     </div>
                   )}

                   <div className="mapping-actions">
                     <button className="cancel-btn" onClick={handleCloseImportModal}>
                       Cancel
                     </button>
                     <button className="submit-btn" onClick={validateMapping}>
                       Validate & Import
                     </button>
                   </div>
                 </div>
               )}

               {/* Step 4: Validation */}
               {importStep === 'validate' && (
                 <div className="validate-step">
                   {!validationResults ? (
                     <div className="validation-loading">
                       <div className="validation-icon">⏳</div>
                       <h4>Validating mapping...</h4>
                       <p>Checking data integrity and field mappings</p>
                       <div className="loading-spinner"></div>
                     </div>
                   ) : (
                     <div className="validation-results">
                       {validationResults.isValid ? (
                         <div className="validation-success">
                           <div className="validation-icon success">✅</div>
                           <h4>Validation Successful!</h4>
                           <p>{validationResults.message}</p>
                           
                           <div className="validation-details">
                             <div className="validation-stats">
                               <div className="stat">
                                 <span className="stat-label">Mapped Fields:</span>
                                 <span className="stat-value">{validationResults.mappedFields}</span>
                               </div>
                               <div className="stat">
                                 <span className="stat-label">Total Fields:</span>
                                 <span className="stat-value">{validationResults.totalFields}</span>
                               </div>
                               <div className="stat">
                                 <span className="stat-label">Quality Score:</span>
                                 <span className="stat-value">{validationResults.qualityScore}%</span>
                               </div>
                             </div>
                             
                             {validationResults.warnings && validationResults.warnings.length > 0 && (
                               <div className="validation-warnings">
                                 <h5>⚠️ Warnings:</h5>
                                 <ul>
                                   {validationResults.warnings.map((warning, index) => (
                                     <li key={index}>{warning}</li>
                                   ))}
                                 </ul>
                               </div>
                             )}
                             
                             {validationResults.suggestions && validationResults.suggestions.length > 0 && (
                               <div className="validation-suggestions">
                                 <h5>💡 Suggestions:</h5>
                                 <ul>
                                   {validationResults.suggestions.map((suggestion, index) => (
                                     <li key={index}>{suggestion}</li>
                                   ))}
                                 </ul>
                               </div>
                             )}
                           </div>
                           
                           <p className="proceed-message">Proceeding to import in 3 seconds...</p>
                         </div>
                       ) : (
                         <div className="validation-error">
                           <div className="validation-icon error">❌</div>
                           <h4>Validation Failed</h4>
                           <p>{validationResults.message}</p>
                           
                           {validationErrors.length > 0 && (
                             <div className="validation-errors">
                               <h5>🚨 Errors:</h5>
                               <ul>
                                 {validationErrors.map((error, index) => (
                                   <li key={index}>{error}</li>
                                 ))}
                               </ul>
                             </div>
                           )}
                           
                           <p className="retry-message">Returning to mapping in 5 seconds...</p>
                         </div>
                       )}
                     </div>
                   )}
                 </div>
               )}

               {/* Step 5: Import */}
               {importStep === 'import' && (
                 <div className="import-step">
                   {!importResults ? (
                     <div className="import-loading">
                       <div className="import-icon">📥</div>
                       <h4>Importing data...</h4>
                       <p>Processing your file and importing records</p>
                       <div className="loading-spinner"></div>
                     </div>
                   ) : (
                     <div className="import-results">
                       {importResults.success ? (
                         <div className="import-success">
                           <div className="import-icon success">🎉</div>
                           <h4>Import Successful!</h4>
                           <p>{importResults.message}</p>
                           
                           <div className="import-details">
                             <div className="import-stats">
                               {importResults.importedCount !== undefined && (
                                 <div className="stat">
                                   <span className="stat-label">Records Imported:</span>
                                   <span className="stat-value success">{importResults.importedCount}</span>
                                 </div>
                               )}
                               {importResults.failedCount !== undefined && (
                                 <div className="stat">
                                   <span className="stat-label">Records Failed:</span>
                                   <span className="stat-value error">{importResults.failedCount}</span>
                                 </div>
                               )}
                               {importResults.totalCount !== undefined && (
                                 <div className="stat">
                                   <span className="stat-label">Total Records:</span>
                                   <span className="stat-value">{importResults.totalCount}</span>
                                 </div>
                               )}
                             </div>
                             
                             {importResults.warnings && importResults.warnings.length > 0 && (
                               <div className="import-warnings">
                                 <h5>⚠️ Warnings:</h5>
                                 <ul>
                                   {importResults.warnings.map((warning, index) => (
                                     <li key={index}>{warning}</li>
                                   ))}
                                 </ul>
                               </div>
                             )}
                             
                             {importResults.errors && importResults.errors.length > 0 && (
                               <div className="import-errors">
                                 <h5>🚨 Import Errors:</h5>
                                 <ul>
                                   {importResults.errors.map((error, index) => (
                                     <li key={index}>{error}</li>
                                   ))}
                                 </ul>
                               </div>
                             )}
                           </div>
                           
                           <p className="completion-message">Closing in 5 seconds... Data refreshed!</p>
                         </div>
                       ) : (
                         <div className="import-error">
                           <div className="import-icon error">💥</div>
                           <h4>Import Failed</h4>
                           <p>{importResults.message}</p>
                           
                           {importResults.error && (
                             <div className="import-error-details">
                               <h5>🚨 Error Details:</h5>
                               <p className="error-text">{importResults.error}</p>
                               {importResults.status && (
                                 <p className="error-code">Status Code: {importResults.status}</p>
                               )}
                             </div>
                           )}
                           
                           <p className="retry-message">Returning to validation in 5 seconds...</p>
                         </div>
                       )}
                     </div>
                   )}
                 </div>
               )}
               
               {importStep === 'upload' && (
                 <div className="help-section">
                   <h4>📋 Import Guidelines</h4>
                   <ul>
                     <li><strong>Supported formats:</strong> .xlsx, .xls, .csv</li>
                     <li><strong>Maximum size:</strong> 10MB</li>
                     <li><strong>Required columns:</strong> investorType, sector, industries, investmentStage, revenueCriteria, firstName, lastName, email, location</li>
                     <li><strong>Optional columns:</strong> organizationPersonName, description, organizationPersonNameFirstNameLastName, phoneNumber, website, linkedin</li>
                   </ul>
                   
                   <div className="column-examples">
                     <h5>📊 Column Headers Example:</h5>
                     <div className="headers-grid">
                       <div className="required-headers">
                         <strong>Required:</strong><br/>
                         investorType<br/>
                         sector<br/>
                         industries<br/>
                         investmentStage<br/>
                         revenueCriteria<br/>
                         firstName<br/>
                         lastName<br/>
                         email<br/>
                         location
                       </div>
                       <div className="optional-headers">
                         <strong>Optional:</strong><br/>
                         organizationPersonName<br/>
                         description<br/>
                         organizationPersonNameFirstNameLastName<br/>
                         phoneNumber<br/>
                         website<br/>
                         linkedin
                       </div>
                     </div>
                   </div>
                   
                   <p className="help-note">
                     💡 <strong>Tip:</strong> Use the "Test File" button to download a complete template with correct headers and example data.
                   </p>
                 </div>
               )}

             </div>
           </div>
         </div>
       )}

       {/* Import CSV 2 Modal - Import Investors from CSV */}
       {showImportCSV2Modal && (
         <div className="modal-overlay">
           <div className="modal-container modal-import-investors">
             <div className="modal-header">
               <h2>Import Investors from CSV</h2>
               <button className="close-btn" onClick={handleCloseCSV2Modal}>×</button>
             </div>

             <div className="modal-subtext">
               Data will be checked and validated during import.
             </div>

               {!importCSV2File ? (
                 <>
                   <div className="instructions">
                     <h4>CSV Format Instructions:</h4>
                     <ul>
                       <li>First row should contain column headers</li>
                       <li>Required columns: organization, email, firstName, lastName</li>
                       <li>Optional columns: location, investorType, investmentStage, revenueCriteria, sector, industries, description, linkedinUrl</li>
                       <li>Multiple industries can be separated by commas</li>
                     </ul>
                     <p className="hint">
                       <em>Hint: Export a CSV first to see the expected format</em>
                     </p>
                   </div>

                   <div className="upload-section">
                     <h4>Choose an import method:</h4>
                     <div className="upload-tabs">
                       <button className="tab active">Upload File</button>
                       <button className="tab disabled">Paste CSV</button>
                     </div>

                     <div className="file-upload-area">
                       <button
                         className="upload-button"
                         onClick={() => document.getElementById('csv2-file-input').click()}
                       >
                         Choose Files
                       </button>

                       <p className="file-help">
                         Files should be in CSV or Excel format (.csv, .xlsx, .xls) with the first row as headers. You can select multiple files for batch import.
                       </p>

                       <input
                         type="file"
                         id="csv2-file-input"
                         accept=".csv,.xlsx,.xls"
                         onChange={handleCSV2FileSelect}
                         style={{ display: 'none' }}
                         multiple
                       />
                     </div>
                   </div>
                 </>
               ) : (
                 <div className="file-uploaded-section" style={{
                   padding: '20px',
                   textAlign: 'center',
                   backgroundColor: '#f8f9fa',
                   borderRadius: '8px',
                   border: '2px dashed #dee2e6'
                 }}>
                   {isAnalyzingFile ? (
                     <div>
                       <div style={{ fontSize: '2rem', marginBottom: '16px' }}>📊</div>
                       <h3 style={{ color: '#0369a1', marginBottom: '8px' }}>Analyzing File...</h3>
                       <p style={{ color: '#6c757d', marginBottom: '16px' }}>
                         Please wait while we analyze your Excel file and extract the data.
                       </p>
                       <div style={{
                         width: '100%',
                         height: '4px',
                         backgroundColor: '#e9ecef',
                         borderRadius: '2px',
                         overflow: 'hidden'
                       }}>
                         <div style={{
                           width: '100%',
                           height: '100%',
                           backgroundColor: '#0369a1',
                           animation: 'loading-bar 2s ease-in-out infinite'
                         }}></div>
                       </div>
                     </div>
                   ) : (
                     <div>
                       <div style={{ fontSize: '2rem', marginBottom: '16px' }}>✅</div>
                       <h3 style={{ color: '#28a745', marginBottom: '8px' }}>File Ready for Import</h3>
                       <p style={{ color: '#6c757d', marginBottom: '16px' }}>
                         Your file <strong>{importCSV2File?.name}</strong> has been analyzed and is ready for import.
                       </p>
                       <button 
                         onClick={() => {
                           setImportCSV2File(null);
                           setExtractedData({
                             Industries: [],
                             Locations: [],
                             Sectors: [],
                             "Investor Types": [],
                             "Investment Stages": [],
                             "Revenue Criteria": []
                           });
                           setIsAnalyzingFile(false);
                         }}
                         style={{
                           padding: '8px 16px',
                           backgroundColor: '#f8f9fa',
                           color: '#6c757d',
                           border: '1px solid #dee2e6',
                           borderRadius: '6px',
                           cursor: 'pointer',
                           fontSize: '14px'
                         }}
                       >
                         📁 Change File
                       </button>
                     </div>
                   )}
                 </div>
               )}


             <div className="footer-buttons">
               <button className="btn-cancel" onClick={handleCloseCSV2Modal}>
                 Cancel
               </button>
               <button
                 className="btn-import"
                 onClick={handleCSV2Import}
                 disabled={!importCSV2File || isImportingCSV2}
               >
                 Import CSV
               </button>
             </div>
           </div>
         </div>
       )}

       {/* Add Investor Modal */}
       <AddInvestor
         isOpen={showAddInvestorModal}
         onClose={() => setShowAddInvestorModal(false)}
         onSave={async (investorData) => {
           console.log('New investor data:', investorData);
           showSuccess('Investor added successfully!');
           setShowAddInvestorModal(false);
           // Refresh the investors list
           await fetchInvestors();
         }}
       />

       {/* Investor Details Modal */}
       {showInvestorDetailsModal && selectedInvestorDetails && (
         <div className="modal-overlay" onClick={handleCloseInvestorDetails}>
           <div className="investor-details-modal" onClick={(e) => e.stopPropagation()}>
             <div className="modal-header">
               <div className="investor-header-info">
                 <div className="investor-avatar">
                   {selectedInvestorDetails.organizationPersonName ? 
                     selectedInvestorDetails.organizationPersonName.charAt(0).toUpperCase() : 'N/A'}
                 </div>
                 <div className="investor-title-section">
                   {isEditingInvestor ? (
                     <input
                       type="text"
                       value={editedInvestorData?.organizationPersonName || ''}
                       onChange={(e) => setEditedInvestorData({...editedInvestorData, organizationPersonName: e.target.value})}
                       className="edit-input"
                       style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}
                     />
                   ) : (
                     <h2>{selectedInvestorDetails.organizationPersonName || 'N/A'}</h2>
                   )}
                   <div className="status-badge pending">Pending</div>
                 </div>
               </div>
              <div className="modal-actions">
                {!isEditingInvestor ? (
                  <>
                    <button className="edit-btn" onClick={handleEditInvestor}>
                      <span className="icon">✏️</span>
                      Edit Investor
                    </button>
                    <button className="delete-btn" onClick={() => setShowDeleteConfirm(true)}>
                      <span className="icon">🗑️</span>
                      Delete Record
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      className="edit-btn" 
                      onClick={handleUpdateInvestor}
                      disabled={isUpdatingInvestor}
                    >
                      <span className="icon">💾</span>
                      {isUpdatingInvestor ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button 
                      className="delete-btn" 
                      onClick={handleCancelEdit}
                      disabled={isUpdatingInvestor}
                    >
                      <span className="icon">❌</span>
                      Cancel
                    </button>
                  </>
                )}
              </div>
             </div>

             
               <div className="investor-details-grid">
                <div className="left-column">
                  <div className="info-section">
                    <h3>Contact Information</h3>
                    <div className="info-item">
                      <label>Email:</label>{isEditingInvestor ? (
                        <input
                          type="email"
                          value={editedInvestorData?.email || ''}
                          onChange={(e) => setEditedInvestorData({...editedInvestorData, email: e.target.value})}
                          className="edit-input"
                        />
                      ) : (
                        <span>{selectedInvestorDetails.email || 'Not specified'}</span>
                      )}
                    </div>
                    <div className="info-item">
                      <label>First Name:</label>{isEditingInvestor ? (
                        <input
                          type="text"
                          value={editedInvestorData?.firstName || ''}
                          onChange={(e) => setEditedInvestorData({...editedInvestorData, firstName: e.target.value})}
                          className="edit-input"
                        />
                      ) : (
                        <span>{selectedInvestorDetails.firstName || 'Not specified'}</span>
                      )}
                    </div>
                    <div className="info-item">
                      <label>Last Name:</label>{isEditingInvestor ? (
                        <input
                          type="text"
                          value={editedInvestorData?.lastName || ''}
                          onChange={(e) => setEditedInvestorData({...editedInvestorData, lastName: e.target.value})}
                          className="edit-input"
                        />
                      ) : (
                        <span>{selectedInvestorDetails.lastName || 'Not specified'}</span>
                      )}
                    </div>
                    <div className="info-item">
                      <label>Location:</label>{isEditingInvestor ? (
                        <input
                          type="text"
                          value={editedInvestorData?.location || ''}
                          onChange={(e) => setEditedInvestorData({...editedInvestorData, location: e.target.value})}
                          className="edit-input"
                        />
                      ) : (
                        <span>{selectedInvestorDetails.location || 'Not specified'}</span>
                      )}
                    </div>
                    <div className="info-item">
                      <label>LinkedIn:</label>{isEditingInvestor ? (
                        <input
                          type="text"
                          value={editedInvestorData?.linkedin || ''}
                          onChange={(e) => setEditedInvestorData({...editedInvestorData, linkedin: e.target.value})}
                          className="edit-input"
                        />
                      ) : (
                        <span>{selectedInvestorDetails.linkedin || 'Not specified'}</span>
                      )}
                    </div>
                    <div className="info-item">
                      <label>Phone:</label>{isEditingInvestor ? (
                        <input
                          type="text"
                          value={editedInvestorData?.phoneNumber || editedInvestorData?.phone || ''}
                          onChange={(e) => setEditedInvestorData({...editedInvestorData, phoneNumber: e.target.value, phone: e.target.value})}
                          className="edit-input"
                        />
                      ) : (
                        <span>{selectedInvestorDetails.phoneNumber || selectedInvestorDetails.phone || 'Not specified'}</span>
                      )}
                    </div>
                    <div className="info-item">
                      <label>Website:</label>{isEditingInvestor ? (
                        <input
                          type="text"
                          value={editedInvestorData?.website || ''}
                          onChange={(e) => setEditedInvestorData({...editedInvestorData, website: e.target.value})}
                          className="edit-input"
                        />
                      ) : (
                        <span>{selectedInvestorDetails.website || 'Not specified'}</span>
                      )}
                    </div>
                    <div className="info-item">
                      <label>Date Added:</label><span>{selectedInvestorDetails.createdAt ? 
                        new Date(selectedInvestorDetails.createdAt).toLocaleDateString() : 
                        'Not specified'}</span>
                    </div>

                    <h3>Investment Details</h3>
                    <div className="info-item">
                      <label>Investor Type:</label>{isEditingInvestor ? (
                        <input
                          type="text"
                          value={editedInvestorData?.investorType || ''}
                          onChange={(e) => setEditedInvestorData({...editedInvestorData, investorType: e.target.value})}
                          className="edit-input"
                        />
                      ) : (
                        <span>{selectedInvestorDetails.investorType || 'Not specified'}</span>
                      )}
                    </div>
                    <div className="info-item">
                      <label>Sector:</label>{isEditingInvestor ? (
                        <input
                          type="text"
                          value={editedInvestorData?.sector || ''}
                          onChange={(e) => setEditedInvestorData({...editedInvestorData, sector: e.target.value})}
                          className="edit-input"
                        />
                      ) : (
                        <span>{selectedInvestorDetails.sector || 'Not specified'}</span>
                      )}
                    </div>
                    <div className="info-item">
                      <label>Investment Stage:</label>{isEditingInvestor ? (
                        <input
                          type="text"
                          value={editedInvestorData?.investmentStage || ''}
                          onChange={(e) => setEditedInvestorData({...editedInvestorData, investmentStage: e.target.value})}
                          className="edit-input"
                        />
                      ) : (
                        <span>{selectedInvestorDetails.investmentStage || 'Not specified'}</span>
                      )}
                    </div>
                    <div className="info-item">
                      <label>Revenue Criteria:</label>{isEditingInvestor ? (
                        <input
                          type="text"
                          value={editedInvestorData?.revenueCriteria || ''}
                          onChange={(e) => setEditedInvestorData({...editedInvestorData, revenueCriteria: e.target.value})}
                          className="edit-input"
                        />
                      ) : (
                        <span>{selectedInvestorDetails.revenueCriteria || 'Not specified'}</span>
                      )}
                    </div>

                    <h3>Industries</h3>
                    {isEditingInvestor ? (
                      <input
                        type="text"
                        value={editedInvestorData?.industries || ''}
                        onChange={(e) => setEditedInvestorData({...editedInvestorData, industries: e.target.value})}
                        className="edit-input"
                        placeholder="Enter industries separated by commas"
                      />
                    ) : (
                      <div className="industries-container">
                        {selectedInvestorDetails.industries ? (
                          typeof selectedInvestorDetails.industries === 'string' ? (
                            selectedInvestorDetails.industries.split(',').map((industry, index) => (
                              <span key={index} className="industry-tag">{industry.trim()}</span>
                            ))
                          ) : (
                            selectedInvestorDetails.industries.map((industry, index) => (
                              <span key={index} className="industry-tag">{industry}</span>
                            ))
                          )
                        ) : (
                          <span className="industry-tag">Not specified</span>
                        )}
                      </div>
                    )}

                    <h3>Description</h3>
                    {isEditingInvestor ? (
                      <textarea
                        value={editedInvestorData?.description || ''}
                        onChange={(e) => setEditedInvestorData({...editedInvestorData, description: e.target.value})}
                        className="edit-textarea"
                        rows="4"
                      />
                    ) : (
                      <div className="description-text">
                        {selectedInvestorDetails.description || 'No description provided.'}
                      </div>
                    )}
                  </div>
                </div>

                <div className="right-column">
                  <div className="info-section">
                    <h3>Additional Notes</h3>
                    <textarea 
                      className="notes-textarea"
                      placeholder="Add additional notes about this investor..."
                      value={investorNote}
                      onChange={(e) => setInvestorNote(e.target.value)}
                    />
                    <button 
                      className="save-notes-btn"
                      onClick={handleSaveNote}
                      disabled={isSavingNote || !selectedInvestorDetails}
                    >
                      {isSavingNote ? 'Saving...' : 'Save Notes'}
                    </button>
                  </div>
                </div>
              </div>
             

             <div className="modal-footer">
               <button className="close-btn" onClick={handleCloseInvestorDetails}>
                 Close
               </button>
             </div>

             {/* Delete Confirmation Dialog */}
             {showDeleteConfirm && (
               <div className="modal-overlay" style={{ zIndex: 10001 }} onClick={() => setShowDeleteConfirm(false)}>
                 <div className="delete-confirm-dialog" onClick={(e) => e.stopPropagation()}>
                   <h3>Confirm Delete</h3>
                   <p>Are you sure you want to delete this investor record?</p>
                   <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
                     This action cannot be undone.
                   </p>
                   <div className="delete-confirm-buttons">
                     <button 
                       className="cancel-delete-btn" 
                       onClick={() => setShowDeleteConfirm(false)}
                       disabled={isDeletingInvestor}
                     >
                       Cancel
                     </button>
                     <button 
                       className="confirm-delete-btn" 
                       onClick={handleDeleteInvestor}
                       disabled={isDeletingInvestor}
                     >
                       {isDeletingInvestor ? 'Deleting...' : 'Delete'}
                     </button>
                   </div>
                 </div>
               </div>
             )}
           </div>
         </div>
       )}
     </div>
   );
 };
 
 export default Dashboard;
