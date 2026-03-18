import React, { useState, useEffect } from 'react';
import authService from '../../services/authService';
import { API_CONFIG } from '../../config/apiConfig';
import './Sidebar.css';

// Configure API base URL from centralized config
const API_BASE_URL = API_CONFIG.BASE_URL;

const Sidebar = ({
  filters,
  handleFilterChange,
  handleSaveView,
  fetchInvestors,
  fetchFilterOptions,
  fetchDashboardStats,
  filterOptions,
  dashboardStats,
  onApplyFilters
}) => {
  // États pour les données des catégories
  const [categoriesData, setCategoriesData] = useState({
    industries: [],
    locations: [],
    investorTypes: [],
    revenueCriteria: [],
    investmentStages: [],
    sectors: []
  });
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [categoriesError, setCategoriesError] = useState(null);
  
  // États pour la sauvegarde
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  
  // États pour le bouton Create
  const [isCreating, setIsCreating] = useState(false);
  const [createMessage, setCreateMessage] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // États pour la liste des filtres enregistrés
  const [savedFilters, setSavedFilters] = useState([]);
  const [isLoadingFilters, setIsLoadingFilters] = useState(false);
  const [filtersError, setFiltersError] = useState(null);
  const [rawApiData, setRawApiData] = useState(null);
  const [showFiltersList, setShowFiltersList] = useState(false);
  
  // États pour le formulaire de création
  const [createFormData, setCreateFormData] = useState({
    title: '',
    description: ''
  });
  const [createFormErrors, setCreateFormErrors] = useState({});

  // États pour l'application des filtres sauvegardés
  const [isApplyingFilter, setIsApplyingFilter] = useState(false);
  const [applyingFilterId, setApplyingFilterId] = useState(null);

  // Fonction pour appliquer un filtre sauvegardé
  const handleApplySavedFilter = async (filterId) => {
    setIsApplyingFilter(true);
    setApplyingFilterId(filterId);
    
    try {
      console.log('🔄 Applying saved filter:', filterId);
      
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }
      
      const headers = { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      const response = await fetch(`${API_BASE_URL}/investors/filter/saved/${filterId}`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
          
          // Handle specific authentication errors
          if (response.status === 401) {
            errorMessage = 'Authentication failed. Please log in again.';
          } else if (response.status === 403) {
            errorMessage = 'Access denied. You do not have permission to access this filter.';
          } else if (response.status === 404) {
            errorMessage = 'Filter not found. The saved filter may have been deleted.';
          }
        } catch (parseError) {
          console.warn('Could not parse error response:', parseError);
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('✅ Saved filter API response:', data);
      console.log('📊 Response structure:', {
        hasInvestors: !!data.investors,
        hasData: !!data.data,
        hasResults: !!data.results,
        isArray: Array.isArray(data),
        keys: Object.keys(data || {}),
        success: data.success,
        message: data.message,
        count: data.count,
        total: data.total
      });
      
      // Check if the response indicates success
      if (data.success === false) {
        console.warn('⚠️ API returned success: false');
        console.warn('⚠️ API message:', data.message);
        console.warn('⚠️ API error:', data.error);
      }

      // Determine the correct data format
      let investorsData = null;
      if (data.investors && Array.isArray(data.investors)) {
        investorsData = data.investors;
        console.log('📊 Using data.investors:', investorsData.length, 'items');
      } else if (data.data && Array.isArray(data.data)) {
        investorsData = data.data;
        console.log('📊 Using data.data:', investorsData.length, 'items');
      } else if (data.results && Array.isArray(data.results)) {
        investorsData = data.results;
        console.log('📊 Using data.results:', investorsData.length, 'items');
      } else if (Array.isArray(data)) {
        investorsData = data;
        console.log('📊 Using direct array:', investorsData.length, 'items');
      } else {
        console.warn('⚠️ No valid investors array found in response');
        // Try to find any array in the response
        const possibleArrays = Object.values(data).filter(item => Array.isArray(item));
        if (possibleArrays.length > 0) {
          investorsData = possibleArrays[0];
          console.log('📊 Found array in response:', investorsData.length, 'items');
        }
      }

      // Appeler la fonction onApplyFilters avec les données filtrées
      if (onApplyFilters && investorsData) {
        console.log('🔄 Calling onApplyFilters with:', investorsData.length, 'investors');
        console.log('🔄 First investor sample:', investorsData[0]);
        onApplyFilters(investorsData);
      } else {
        console.warn('⚠️ No onApplyFilters function or no investors data');
        console.warn('⚠️ onApplyFilters exists:', !!onApplyFilters);
        console.warn('⚠️ investorsData exists:', !!investorsData);
        console.warn('⚠️ investorsData length:', investorsData ? investorsData.length : 'N/A');
      }

      // Mettre à jour les statistiques du dashboard si disponibles
      if (fetchDashboardStats) {
        fetchDashboardStats();
      }

      const investorCount = investorsData ? investorsData.length : 0;
      
      if (investorCount === 0) {
        console.warn('⚠️ No investors found with this filter');
        console.warn('⚠️ This could mean:');
        console.warn('   - The filter criteria are too restrictive');
        console.warn('   - No investors match the saved filter conditions');
        console.warn('   - The filter data is empty or invalid');
        alert(`⚠️ Filter applied but found 0 investors.\n\nThis could mean:\n• The filter criteria are too restrictive\n• No investors match the saved filter conditions\n• The filter may need to be updated\n\nCheck the console for more details.`);
      } else {
        alert(`✅ Filter applied successfully! Found ${investorCount} investors.`);
      }

    } catch (error) {
      console.error('❌ Error applying saved filter:', error);
      alert(`❌ Failed to apply saved filter: ${error.message}`);
    } finally {
      setIsApplyingFilter(false);
      setApplyingFilterId(null);
    }
  };

  // Fonction pour supprimer un filtre sauvegardé
  const deleteSavedFilter = async (filterId) => {
    try {
      console.log('🗑️ Deleting saved filter:', filterId);
      
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }
      
      const headers = { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      const response = await fetch(`${API_BASE_URL}/investors/filter/saved/${filterId}`, {
        method: 'DELETE',
        headers
      });

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
          
          // Handle specific authentication errors
          if (response.status === 401) {
            errorMessage = 'Authentication failed. Please log in again.';
          } else if (response.status === 403) {
            errorMessage = 'Access denied. You do not have permission to delete this filter.';
          } else if (response.status === 404) {
            errorMessage = 'Filter not found. The saved filter may have already been deleted.';
          }
        } catch (parseError) {
          console.warn('Could not parse error response:', parseError);
        }
        throw new Error(errorMessage);
      }

      console.log('✅ Filter deleted successfully');
      
      // Recharger la liste des filtres sauvegardés
      await loadSavedFilters();
      
      alert('✅ Filter deleted successfully!');

    } catch (error) {
      console.error('❌ Error deleting saved filter:', error);
      alert(`❌ Failed to delete saved filter: ${error.message}`);
    }
  };

  // Fonctions pour récupérer les données de chaque catégorie
  const fetchIndustries = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/industries`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Industries fetched:', data);
      return Array.isArray(data) ? data : data.industries || data.data || [];
    } catch (error) {
      console.error('Error fetching industries:', error);
      return [];
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/locations`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Locations fetched:', data);
      return Array.isArray(data) ? data : data.locations || data.data || [];
    } catch (error) {
      console.error('Error fetching locations:', error);
      return [];
    }
  };

  const fetchInvestorTypes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/investor-types`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Investor types fetched:', data);
      return Array.isArray(data) ? data : data.investorTypes || data.data || [];
    } catch (error) {
      console.error('Error fetching investor types:', error);
      return [];
    }
  };

  const fetchRevenueCriteria = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/revenue-criteria`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Revenue criteria fetched:', data);
      return Array.isArray(data) ? data : data.revenueCriteria || data.data || [];
    } catch (error) {
      console.error('Error fetching revenue criteria:', error);
      return [];
    }
  };

  const fetchInvestmentStages = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/investment-stages`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Investment stages fetched:', data);
      return Array.isArray(data) ? data : data.investmentStages || data.data || [];
    } catch (error) {
      console.error('Error fetching investment stages:', error);
      return [];
    }
  };

  const fetchSectors = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/sectors`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Sectors fetched:', data);
      return Array.isArray(data) ? data : data.sectors || data.data || [];
    } catch (error) {
      console.error('Error fetching sectors:', error);
      return [];
    }
  };

  // Fonction pour récupérer toutes les catégories
  const fetchAllCategories = async () => {
    setIsLoadingCategories(true);
    setCategoriesError(null);

    try {
      console.log('Fetching all categories data...');
      
      const [industries, locations, investorTypes, revenueCriteria, investmentStages, sectors] = await Promise.all([
        fetchIndustries(),
        fetchLocations(),
        fetchInvestorTypes(),
        fetchRevenueCriteria(),
        fetchInvestmentStages(),
        fetchSectors()
      ]);

      setCategoriesData({
        industries: industries.map(item => item.name || item),
        locations: locations.map(item => item.name || item),
        investorTypes: investorTypes.map(item => item.name || item),
        revenueCriteria: revenueCriteria.map(item => item.name || item),
        investmentStages: investmentStages.map(item => item.name || item),
        sectors: sectors.map(item => item.name || item)
      });

      console.log('All categories fetched successfully:', {
        industries: industries.length,
        locations: locations.length,
        investorTypes: investorTypes.length,
        revenueCriteria: revenueCriteria.length,
        investmentStages: investmentStages.length,
        sectors: sectors.length
      });

    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategoriesError('Failed to load category data');
    } finally {
      setIsLoadingCategories(false);
    }
  };

  // Fonction pour récupérer l'authentification via le service centralisé
  const getAuthenticationData = () => {
    const userId = authService.getUserId();
    const token = authService.getToken();
    
    console.log('Recherche d\'authentification via AuthService:');
    console.log('- userId:', userId);
    console.log('- token:', token ? 'Présent' : 'Manquant');
    console.log('- isAuthenticated:', authService.isAuthenticated());
    console.log('- isTokenValid:', authService.isTokenValid());
    
    return { userId, token };
  };

  // Fonction pour charger les filtres enregistrés
  const loadSavedFilters = async () => {
    setIsLoadingFilters(true);
    setFiltersError(null);
    
    try {
      const { userId, token } = getAuthenticationData();
      
      if (!userId || !token) {
        setFiltersError('You must be logged in to view saved filters');
        return;
      }
      
      console.log('Chargement des filtres enregistrés...');
      
      const response = await fetch(`${API_BASE_URL}/enregistrer-filtres/`, {
        method: 'GET',
        headers: authService.getAuthHeaders()
      });
      
      console.log('Réponse API filtres - Status:', response.status);
      
      if (!response.ok) {
        if (response.status === 401) {
          setFiltersError('Session expired. Please log in again.');
        } else if (response.status === 403) {
          setFiltersError('Access denied. Check your permissions.');
        } else {
          setFiltersError(`Error ${response.status}: ${response.statusText}`);
        }
        return;
      }
      
      const data = await response.json();
      console.log('=== DONNÉES API /enregistrer-filtres/ ===');
      console.log('Status:', response.status);
      console.log('Type de données:', typeof data);
      console.log('Est un array:', Array.isArray(data));
      console.log('Contenu complet:', JSON.stringify(data, null, 2));
      console.log('==========================================');
      
      // Stocker les données brutes pour debug
      setRawApiData(data);
      
      // Extraire seulement les titres des filtres avec gestion robuste
      let filtersArray = [];
      
      // Vérifier différents formats de réponse
      if (data && Array.isArray(data)) {
        console.log('Format 1: Array direct');
        filtersArray = data;
      } else if (data && data.filters && Array.isArray(data.filters)) {
        console.log('Format 2: data.filters');
        filtersArray = data.filters;
      } else if (data && data.data && Array.isArray(data.data)) {
        console.log('Format 3: data.data');
        filtersArray = data.data;
      } else if (data && data.results && Array.isArray(data.results)) {
        console.log('Format 4: data.results');
        filtersArray = data.results;
      } else if (data && data.items && Array.isArray(data.items)) {
        console.log('Format 5: data.items');
        filtersArray = data.items;
      } else if (data && typeof data === 'object' && data !== null) {
        console.log('Format 6: Objet avec propriétés');
        // Essayer de trouver un array dans l'objet
        const possibleArrays = Object.values(data).filter(item => Array.isArray(item));
        if (possibleArrays.length > 0) {
          filtersArray = possibleArrays[0];
          console.log('Array trouvé dans l\'objet:', possibleArrays[0]);
        }
      }
      
      console.log('FiltresArray final:', filtersArray);
      console.log('Nombre d\'éléments:', filtersArray.length);
      
      // Vérifier si on a des données
      if (filtersArray.length === 0) {
        console.warn('⚠️ Aucun filtre trouvé dans la réponse API');
        console.log('Structure de la réponse:', Object.keys(data || {}));
        setSavedFilters([]);
        setFiltersError('No filters found in API response');
        return;
      }
      
      // Filtrer pour ne garder que les titres avec gestion d'erreur
      try {
        const titlesOnly = filtersArray.map((filter, index) => {
          console.log(`Filtre ${index}:`, filter);
          
          return {
            title: filter.title || filter.name || filter.label || `Filtre ${index + 1}`,
            id: filter.id || filter._id || filter.uuid || index,
            createdAt: filter.createdAt || filter.created_at || filter.date || filter.timestamp
          };
        });
        
        console.log('Titres extraits:', titlesOnly);
        setSavedFilters(titlesOnly);
      } catch (mappingError) {
        console.error('Erreur lors du mapping des filtres:', mappingError);
        setFiltersError('Error processing data');
      }
      
    } catch (error) {
      console.error('Erreur lors du chargement des filtres:', error);
      setFiltersError(`Connection error: ${error.message}`);
    } finally {
      setIsLoadingFilters(false);
    }
  };

  // Fonction pour appliquer les filtres avec l'API avancée
  const applyFilters = async () => {
    console.log('🔍 Applying advanced filters...');
    console.log('Current filters:', filters);
    
    try {
      const { userId, token } = getAuthenticationData();
      
      if (!userId || !token) {
        console.error('Authentication required for filtering');
        alert('You must be logged in to apply filters');
        return;
      }

      // Construire les paramètres de requête pour l'API avancée
      const filterParams = {
        industry: filters.industry && filters.industry !== 'All' ? filters.industry : null,
        location: filters.location && filters.location !== 'All' ? filters.location : null,
        investorType: filters.investorType && filters.investorType !== 'All' ? filters.investorType : null,
        revenueCriteria: filters.revenueCriteria && filters.revenueCriteria !== 'All' ? filters.revenueCriteria : null,
        investmentStage: filters.investmentStage && filters.investmentStage !== 'All' ? filters.investmentStage : null,
        sector: filters.sector && filters.sector !== 'All' ? filters.sector : null
      };

      // Supprimer les paramètres null/undefined
      const cleanParams = Object.fromEntries(
        Object.entries(filterParams).filter(([_, value]) => value !== null && value !== undefined && value !== '')
      );

      console.log('Filter parameters:', cleanParams);

      // Construire l'URL avec les paramètres de requête
      const queryParams = new URLSearchParams();
      Object.entries(cleanParams).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          queryParams.append(key, value);
        }
      });

      // Ajouter des paramètres pour obtenir tous les résultats
      queryParams.append('limit', '1000'); // Limite élevée pour obtenir tous les résultats
      queryParams.append('page', '1');

      const apiUrl = `${API_BASE_URL}/investors/filter?${queryParams.toString()}`;
      console.log('Filter API URL:', apiUrl);

      // Appeler l'API de filtrage existante
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        console.error('Filter API error:', response.status, response.statusText);
        alert(`Filter API error: ${response.status} - ${response.statusText}`);
        return;
      }

      const filteredData = await response.json();
      console.log('Filtered investors:', filteredData);

      // Appeler la fonction de callback pour mettre à jour le dashboard
      if (onApplyFilters) {
        onApplyFilters(filteredData);
      }

    } catch (error) {
      console.error('Error applying advanced filters:', error);
      alert(`Error applying filters: ${error.message}`);
    }
  };

  // Fonction pour effacer tous les filtres
  const clearAllFilters = () => {
    console.log('🧹 Clearing all filters...');
    
    // Réinitialiser tous les filtres à 'All'
    const clearedFilters = {
      industry: 'All',
      location: 'All',
      investorType: 'All',
      revenueCriteria: 'All',
      investmentStage: 'All',
      sector: 'All'
    };
    
    // Mettre à jour les filtres via la fonction de callback
    Object.keys(clearedFilters).forEach(key => {
      if (handleFilterChange) {
        handleFilterChange(key, clearedFilters[key]);
      }
    });
    
    console.log('✅ All filters cleared');
  };

  // Fonction pour tester l'API de filtrage avancé
  const testAdvancedFilterAPI = async () => {
    try {
      const { userId, token } = getAuthenticationData();
      
      if (!userId || !token) {
        alert('❌ No authentication token found. Please log in first.');
        return;
      }

      // Test avec des paramètres de filtrage simples
      const testParams = {
        industry: 'Technology',
        location: 'Paris'
      };

      console.log('🧪 Testing filter API with params:', testParams);

      // Construire l'URL avec les paramètres de requête
      const queryParams = new URLSearchParams();
      Object.entries(testParams).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          queryParams.append(key, value);
        }
      });

      // Ajouter des paramètres pour obtenir tous les résultats
      queryParams.append('limit', '1000');
      queryParams.append('page', '1');

      const apiUrl = `${API_BASE_URL}/investors/filter?${queryParams.toString()}`;
      console.log('Test API URL:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Filter API Response Status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Filter API Response Data:', data);
        const investorCount = Array.isArray(data) ? data.length : 
                             (data.investors ? data.investors.length : 
                             (data.data ? data.data.length : 'unknown'));
        alert(`✅ Filter API is working! Found ${investorCount} investors with test filters.`);
      } else {
        const errorText = await response.text();
        console.log('Filter API Error Response:', errorText);
        alert(`❌ Filter API error: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('Filter API test failed:', error);
      alert(`❌ Filter API test failed: ${error.message}`);
    }
  };

  // Fonction pour tester la connectivité de l'API
  const testApiConnection = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/enregistrer-filtres/`, {
        method: 'OPTIONS',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('Test de connectivité API - Status:', response.status);
      return response.ok;
    } catch (error) {
      console.error('Erreur de connectivité API:', error);
      return false;
    }
  };

  // Fonction utilitaire pour collecter les choix sélectionnés
  const collectSelectedChoices = () => {
    console.log('Filtres actuels:', filters);
    
    // Récupérer l'ID de l'utilisateur connecté depuis différentes sources
    const { userId } = getAuthenticationData();
    
    // Fonction pour gérer les valeurs vides - enregistrer "All" si rien n'est sélectionné
    const getValueOrDefault = (value) => {
      if (!value || value.trim() === '' || value === 'All') {
        return 'All';
      }
      return value;
    };
    
    const selectedChoices = {
      industries: getValueOrDefault(filters.industry),
      locations: getValueOrDefault(filters.location),
      investorTypes: getValueOrDefault(filters.investorType),
      revenueCriteria: getValueOrDefault(filters.revenueCriteria),
      investmentStages: getValueOrDefault(filters.investmentStage),
      sectors: getValueOrDefault(filters.sector),
      userId: userId || ''
    };
    
    // Convertir en chaînes de caractères (l'API attend des strings)
    // Gérer les cas où les filtres pourraient être des tableaux
    const result = {
      industries: Array.isArray(selectedChoices.industries) 
        ? selectedChoices.industries.join(',') 
        : selectedChoices.industries.toString(),
      locations: Array.isArray(selectedChoices.locations) 
        ? selectedChoices.locations.join(',') 
        : selectedChoices.locations.toString(),
      investorTypes: Array.isArray(selectedChoices.investorTypes) 
        ? selectedChoices.investorTypes.join(',') 
        : selectedChoices.investorTypes.toString(),
      revenueCriteria: Array.isArray(selectedChoices.revenueCriteria) 
        ? selectedChoices.revenueCriteria.join(',') 
        : selectedChoices.revenueCriteria.toString(),
      investmentStages: Array.isArray(selectedChoices.investmentStages) 
        ? selectedChoices.investmentStages.join(',') 
        : selectedChoices.investmentStages.toString(),
      sectors: Array.isArray(selectedChoices.sectors) 
        ? selectedChoices.sectors.join(',') 
        : selectedChoices.sectors.toString(),
      userId: selectedChoices.userId
    };
    
    console.log('Choix sélectionnés pour l\'API:', result);
    return result;
  };

  // Fonction pour sauvegarder les filtres et résultats
  const handleSave = async () => {
    if (!createFormData.title.trim()) {
      setSaveMessage('❌ Le titre est requis pour sauvegarder');
      setTimeout(() => setSaveMessage(''), 3000);
      return;
    }
    
    // Vérifier l'authentification depuis différentes sources
    const { userId, token } = getAuthenticationData();
    
    console.log('Vérification authentification:');
    console.log('- userId:', userId);
    console.log('- token:', token ? 'Présent' : 'Manquant');
    console.log('- userId type:', typeof userId);
    console.log('- token type:', typeof token);
    
    if (!userId || !token) {
      console.error('Authentification échouée - userId ou token manquant');
      setSaveMessage('❌ You must be logged in to save');
      setTimeout(() => setSaveMessage(''), 3000);
      return;
    }
    
    // Vérifier que l'userId n'est pas vide
    if (!userId.trim()) {
      console.error('Authentification échouée - userId vide');
      setSaveMessage('❌ ID utilisateur manquant. Veuillez vous reconnecter.');
      setTimeout(() => setSaveMessage(''), 3000);
      return;
    }
    
    console.log('Authentification réussie');
    
    setIsSaving(true);
    setSaveMessage('');
    
    try {
      // Tester la connectivité de l'API
      const isApiConnected = await testApiConnection();
      if (!isApiConnected) {
        setSaveMessage('❌ Impossible de se connecter à l\'API. Vérifiez que le serveur est démarré.');
        setTimeout(() => setSaveMessage(''), 5000);
        return;
      }
      
      // Collecter les choix sélectionnés
      const selectedChoices = collectSelectedChoices();
      
      // Préparer les données pour l'API
      const saveData = {
        title: createFormData.title,
        ...selectedChoices
      };
      
      console.log('Données envoyées à l\'API:', saveData);
      console.log('Exemple de format attendu par l\'API:', {
        "title": "Filtre Fintech France",
        "industries": "Finance",
        "locations": "Paris",
        "investorTypes": "VC,Corporate",
        "revenueCriteria": "1-10M,10-50M",
        "investmentStages": "Series A,Series B",
        "sectors": "Fintech",
        "userId": "fintech_user"
      });
      
      // Vérifier que les données sont valides
      if (!saveData.title || saveData.title.trim() === '') {
        throw new Error('Le titre est requis');
      }
      
      if (!saveData.userId || saveData.userId.trim() === '') {
        throw new Error('L\'ID utilisateur est requis');
      }
      
      console.log('Validation des données: OK');
      
      // Envoyer à l'API
      const response = await fetch(`${API_BASE_URL}/enregistrer-filtres/`, {
        method: 'POST',
        headers: authService.getAuthHeaders(),
        body: JSON.stringify(saveData)
      });
      
      console.log('Réponse API - Status:', response.status);
      console.log('Réponse API - Headers:', response.headers);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erreur API - Status:', response.status);
        console.error('Erreur API - Response:', errorText);
        throw new Error(`Erreur ${response.status}: ${response.statusText} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Filtres sauvegardés avec succès:', result);
      
      setSaveMessage('✅ Filters saved successfully!');
      
      // Recharger la liste des filtres
      loadSavedFilters();
      
      // Effacer le message après 3 secondes
      setTimeout(() => {
        setSaveMessage('');
      }, 3000);
      
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      setSaveMessage(`❌ Error saving: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };


  // Fonction pour gérer les changements dans le formulaire
  const handleCreateFormChange = (field, value) => {
    setCreateFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Effacer l'erreur du champ modifié
    if (createFormErrors[field]) {
      setCreateFormErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Fonction pour valider le formulaire
  const validateCreateForm = () => {
    const errors = {};
    
    if (!createFormData.title.trim()) {
      errors.title = 'Le titre est requis';
    }
    
    // La description n'est plus obligatoire pour l'enregistrement
    // if (!createFormData.description.trim()) {
    //   errors.description = 'La description est requise';
    // }
    
    setCreateFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Fonction pour créer un nouvel élément (sauvegarde les données)
  const handleCreate = async () => {
    if (!validateCreateForm()) {
      return;
    }
    
    // Vérifier l'authentification depuis différentes sources
    const { userId, token } = getAuthenticationData();
    
    console.log('Vérification authentification (handleCreate):');
    console.log('- userId:', userId);
    console.log('- token:', token ? 'Présent' : 'Manquant');
    
    if (!userId || !token) {
      console.error('Authentification échouée - userId ou token manquant');
      console.error('userId:', userId);
      console.error('token:', token);
      setCreateMessage('❌ You must be logged in to save. Please log in first.');
      setTimeout(() => setCreateMessage(''), 5000);
      return;
    }
    
    // Vérifier que l'userId n'est pas vide
    if (!userId.trim()) {
      console.error('Authentification échouée - userId vide');
      setCreateMessage('❌ ID utilisateur manquant. Veuillez vous reconnecter.');
      setTimeout(() => setCreateMessage(''), 3000);
      return;
    }
    
    console.log('Authentification réussie (handleCreate)');
    
    setIsCreating(true);
    setCreateMessage('');
    
    try {
      // Collecter les choix sélectionnés
      const selectedChoices = collectSelectedChoices();
      
      // Préparer les données pour l'API
      const saveData = {
        title: createFormData.title,
        ...selectedChoices
      };
      
      console.log('Données envoyées à l\'API:', saveData);
      console.log('Exemple de format attendu par l\'API:', {
        "title": "Filtre Fintech France",
        "industries": "Finance",
        "locations": "Paris",
        "investorTypes": "VC,Corporate",
        "revenueCriteria": "1-10M,10-50M",
        "investmentStages": "Series A,Series B",
        "sectors": "Fintech",
        "userId": "fintech_user"
      });
      
      // Vérifier que les données sont valides
      if (!saveData.title || saveData.title.trim() === '') {
        throw new Error('Le titre est requis');
      }
      
      if (!saveData.userId || saveData.userId.trim() === '') {
        throw new Error('L\'ID utilisateur est requis');
      }
      
      console.log('Validation des données: OK');
      
      // Envoyer à l'API
      const response = await fetch(`${API_BASE_URL}/enregistrer-filtres/`, {
        method: 'POST',
        headers: authService.getAuthHeaders(),
        body: JSON.stringify(saveData)
      });
      
      console.log('Réponse API - Status:', response.status);
      console.log('Réponse API - Headers:', response.headers);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erreur API - Status:', response.status);
        console.error('Erreur API - Response:', errorText);
        throw new Error(`Erreur ${response.status}: ${response.statusText} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Filtres sauvegardés avec succès:', result);
      
      setCreateMessage('✅ Filters saved successfully!');
      
      // Recharger la liste des filtres
      loadSavedFilters();
      
      // Fermer le formulaire et réinitialiser après succès
      setTimeout(() => {
        setCreateMessage('');
        setShowCreateForm(false);
        // Réinitialiser le formulaire
        setCreateFormData({
          title: '',
          description: ''
        });
        setCreateFormErrors({});
      }, 2000);
      
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      setCreateMessage(`❌ Error saving: ${error.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  // Fonction pour annuler la création (enregistre les données)
  const handleCancelCreate = async () => {
    if (!createFormData.title.trim()) {
      setCreateMessage('❌ Le titre est requis pour enregistrer');
      setTimeout(() => setCreateMessage(''), 3000);
      return;
    }
    
    // Vérifier l'authentification depuis différentes sources
    const { userId, token } = getAuthenticationData();
    
    if (!userId || !token) {
      setCreateMessage('❌ You must be logged in to register');
      setTimeout(() => setCreateMessage(''), 3000);
      return;
    }
    
    // Vérifier que l'userId n'est pas vide
    if (!userId.trim()) {
      setCreateMessage('❌ ID utilisateur manquant. Veuillez vous reconnecter.');
      setTimeout(() => setCreateMessage(''), 3000);
      return;
    }
    
    setIsCreating(true);
    setCreateMessage('');
    
    try {
      // Collecter les choix sélectionnés
      const selectedChoices = collectSelectedChoices();
      
      // Préparer les données pour l'API
      const saveData = {
        title: createFormData.title,
        ...selectedChoices
      };
      
      console.log('Données envoyées à l\'API:', saveData);
      console.log('Exemple de format attendu par l\'API:', {
        "title": "Filtre Fintech France",
        "industries": "Finance",
        "locations": "Paris",
        "investorTypes": "VC,Corporate",
        "revenueCriteria": "1-10M,10-50M",
        "investmentStages": "Series A,Series B",
        "sectors": "Fintech",
        "userId": "fintech_user"
      });
      
      // Vérifier que les données sont valides
      if (!saveData.title || saveData.title.trim() === '') {
        throw new Error('Le titre est requis');
      }
      
      if (!saveData.userId || saveData.userId.trim() === '') {
        throw new Error('L\'ID utilisateur est requis');
      }
      
      console.log('Validation des données: OK');
      
      // Envoyer à l'API
      const response = await fetch(`${API_BASE_URL}/enregistrer-filtres/`, {
        method: 'POST',
        headers: authService.getAuthHeaders(),
        body: JSON.stringify(saveData)
      });
      
      console.log('Réponse API - Status:', response.status);
      console.log('Réponse API - Headers:', response.headers);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erreur API - Status:', response.status);
        console.error('Erreur API - Response:', errorText);
        throw new Error(`Erreur ${response.status}: ${response.statusText} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Filtres enregistrés avec succès:', result);
      
      setCreateMessage('✅ Filters registered successfully!');
      
      // Recharger la liste des filtres
      loadSavedFilters();
      
      // Fermer le formulaire et réinitialiser après succès
      setTimeout(() => {
        setCreateMessage('');
        setShowCreateForm(false);
        // Réinitialiser le formulaire
        setCreateFormData({
          title: '',
          description: ''
        });
        setCreateFormErrors({});
      }, 2000);
      
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error);
      setCreateMessage(`❌ Error registering: ${error.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  // Vérifier l'authentification au montage du composant
  useEffect(() => {
    const { userId, token } = getAuthenticationData();
    
    console.log('=== VÉRIFICATION AUTHENTIFICATION AU CHARGEMENT ===');
    console.log('userId:', userId);
    console.log('token:', token ? 'Présent' : 'Manquant');
    console.log('userId type:', typeof userId);
    console.log('token type:', typeof token);
    console.log('userId length:', userId ? userId.length : 0);
    console.log('token length:', token ? token.length : 0);
    console.log('====================================================');
    
    if (!userId || !token) {
      console.warn('⚠️ Utilisateur non authentifié - certaines fonctionnalités peuvent être limitées');
      console.warn('Veuillez vous connecter pour utiliser la sauvegarde des filtres');
    } else {
      console.log('✅ Utilisateur authentifié - toutes les fonctionnalités disponibles');
    }
    
    fetchAllCategories();
    loadSavedFilters(); // Charger les filtres enregistrés
  }, []);

  // Note: Application automatique des filtres désactivée
  // Les filtres ne s'appliquent que manuellement via le bouton "Apply Filters"
  return (
    <div className="dashboard-sidebar">
      {/* Section 1 - Filters */}
      <div className="dashboard-sidebar-section">
        <div className="sidebar-header">
          <h3>Filters</h3>
        </div>
      

      {/* Error message */}
      {categoriesError && (
        <div className="error-message" style={{ 
          color: '#dc3545', 
          padding: '10px', 
          margin: '10px 0', 
          backgroundColor: '#f8d7da', 
          border: '1px solid #f5c6cb', 
          borderRadius: '4px',
          fontSize: '14px'
        }}>
          {categoriesError}
        </div>
      )}

      {/* Authentication status message */}
      {(() => {
        const { userId, token } = getAuthenticationData();
        if (!userId || !token) {
          return (
            <div className="auth-warning" style={{ 
              color: '#ff6b35', 
              padding: '10px', 
              margin: '10px 0',
              backgroundColor: '#fff3e0',
              border: '1px solid #ffcc80',
              borderRadius: '4px',
              fontSize: '14px'
            }}>
              ⚠️ You must be logged in to save your filters. 
              <br />
              <strong>userId:</strong> {userId || 'Missing'} | 
              <strong>token:</strong> {token ? 'Present' : 'Missing'}
              <br />
              <small>Click "🔍 Debug Auth" for more details</small>
            </div>
          );
        }
        return null;
      })()}

      {/* Loading indicator */}
      {isLoadingCategories && (
        <div className="loading-message" style={{ 
          color: '#007bff', 
          padding: '10px', 
          margin: '10px 0', 
          backgroundColor: '#d1ecf1', 
          border: '1px solid #bee5eb', 
          borderRadius: '4px',
          fontSize: '14px'
        }}>
          🔄 Loading category data...
        </div>
      )}

      <div className="filters-section">
      <label>Industry</label>
       
          
          <select 
            value={filters.industry} 
            onChange={(e) => handleFilterChange('industry', e.target.value)}
            disabled={isLoadingCategories}
          >
            <option value="">All Industries</option>
            {categoriesData.industries.map((industry, index) => (
              <option key={index} value={industry}>{industry}</option>
            ))}
          </select>
     
        <label>Investment Stage</label>
      
          <select 
            value={filters.investmentStage} 
            onChange={(e) => handleFilterChange('investmentStage', e.target.value)}
            disabled={isLoadingCategories}
          >
            <option value="">All Stages</option>
            {categoriesData.investmentStages.map((stage, index) => (
              <option key={index} value={stage}>{stage}</option>
            ))}
          </select>
 
        <label>Location</label>
        
        
          <select 
            value={filters.location} 
            onChange={(e) => handleFilterChange('location', e.target.value)}
            disabled={isLoadingCategories}
          >
            <option value="">All Locations</option>
            {categoriesData.locations.map((location, index) => (
              <option key={index} value={location}>{location}</option>
            ))}
          </select>
      
        <label>Revenue Criteria</label>
        
          
          <select 
            value={filters.revenueCriteria} 
            onChange={(e) => handleFilterChange('revenueCriteria', e.target.value)}
            disabled={isLoadingCategories}
          >
            <option value="">All Revenue</option>
            {categoriesData.revenueCriteria.map((criteria, index) => (
              <option key={index} value={criteria}>{criteria}</option>
            ))}
          </select>
   
        <label>Investor Type</label>
        
       
          <select 
            value={filters.investorType} 
            onChange={(e) => handleFilterChange('investorType', e.target.value)}
            disabled={isLoadingCategories}
          >
            <option value="">All Types</option>
            {categoriesData.investorTypes.map((type, index) => (
              <option key={index} value={type}>{type}</option>
            ))}
          </select>
        
        <label>Sector</label>
        
        
          <select 
            value={filters.sector} 
            onChange={(e) => handleFilterChange('sector', e.target.value)}
            disabled={isLoadingCategories}
          >
            <option value="">All Sectors</option>
            {categoriesData.sectors.map((sector, index) => (
              <option key={index} value={sector}>{sector}</option>
            ))}
          </select>
        
      </div>

      {/* Section Save et Actions */}
      <div className="actions-section">
      
          <button 
            className="create-btn"
            onClick={() => setShowCreateForm(true)}
            title="Open creation form"
          >
            Save View
          </button>
          
          <button 
            className="clear-filters-btn"
            onClick={clearAllFilters}
            title="Clear all filters"
          >
            Clear All Filters
          </button>
        
      



        {/* Messages de feedback */}
        {saveMessage && (
          <div className={`save-message ${saveMessage.includes('✅') ? 'success' : 'error'}`}>
            {saveMessage}
          </div>
        )}
        
        {createMessage && (
          <div className={`create-message ${createMessage.includes('✅') ? 'success' : 'error'}`}>
            {createMessage}
          </div>
        )}
        </div>
      </div>

      {/* Section 2 - Saved Searches */}
       <div className="dashboard-sidebar-section">
         <div className="sidebar-header">
           <h3>Saved Searches</h3>
         </div>
         
         <div className="saved-searches-section">
           <div className="filters-section">
             <label>Manage Searches</label>
             <select 
               value=""
               onChange={(e) => {
                 if (e.target.value) {
                   const selectedFilter = savedFilters.find(f => f.id === e.target.value);
                   if (selectedFilter) {
                     handleApplySavedFilter(selectedFilter.id);
                   }
                 }
               }}
               disabled={isLoadingFilters}
             >
               <option value="">Select a saved search...</option>
               {Array.isArray(savedFilters) && savedFilters.map((filter) => (
                 <option key={filter?.id || Math.random()} value={filter?.id}>
                   {filter?.title || 'Untitled Filter'} - {filter?.createdAt ? new Date(filter.createdAt).toLocaleDateString() : 'No date'}
                 </option>
               ))}
             </select>


             {/* Message d'erreur */}
             {filtersError && (
               <div className="filters-error" style={{ 
                 color: '#dc3545', 
                 padding: '8px', 
                 margin: '8px 0', 
                 backgroundColor: '#f8d7da', 
                 border: '1px solid #f5c6cb', 
                 borderRadius: '4px',
                 fontSize: '12px'
               }}>
                 {filtersError}
               </div>
             )}

             {/* Message de chargement */}
             {isLoadingFilters && (
               <div className="filters-loading" style={{ 
                 color: '#007bff', 
                 padding: '10px', 
                 textAlign: 'center',
                 fontSize: '12px'
               }}>
                 ⏳ Loading saved searches...
               </div>
             )}

             {/* Message si aucun filtre */}
             {!isLoadingFilters && (!Array.isArray(savedFilters) || savedFilters.length === 0) && (
               <div className="no-filters" style={{ 
                 textAlign: 'center', 
                 padding: '20px', 
                 color: '#6c757d',
                 fontSize: '12px',
                 fontStyle: 'italic'
               }}>
                 <p>No saved searches</p>
                 <p style={{ marginTop: '5px', fontSize: '10px' }}>
                   Create your first search using the filters above
                 </p>
               </div>
             )}
           </div>
         </div>
       </div>

       {/* Formulaire de création - Popup */}
      {showCreateForm && (
        <div className="create-form-overlay">
          <div className="create-form-popup">
            <div className="create-form-header">
              <h4>Create New Search</h4>
              <button 
                className="close-create-form-btn"
                onClick={() => setShowCreateForm(false)}
                title="Close form"
              >
                ✕
              </button>
            </div>
            
            <div className="create-form">
              <div className="form-group">
                <label htmlFor="create-title">Title *</label>
                <input
                  type="text"
                  id="create-title"
                  value={createFormData.title}
                  onChange={(e) => handleCreateFormChange('title', e.target.value)}
                  className={createFormErrors.title ? 'error' : ''}
                  placeholder="Enter search title"
                />
                {createFormErrors.title && <span className="error-text">{createFormErrors.title}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="create-description">Description</label>
                <textarea
                  id="create-description"
                  value={createFormData.description}
                  onChange={(e) => handleCreateFormChange('description', e.target.value)}
                  placeholder="Enter search description"
                  rows="3"
                />
              </div>

              {/* Aperçu des filtres sélectionnés */}
              <div className="selected-filters">
                <h5>Current Filters:</h5>
                <div className="filters-preview">
                  <div className="filter-item">
                    <strong>Industry:</strong> {filters.industry || 'All'}
                  </div>
                  <div className="filter-item">
                    <strong>Location:</strong> {filters.location || 'All'}
                  </div>
                  <div className="filter-item">
                    <strong>Investor Type:</strong> {filters.investorType || 'All'}
                  </div>
                  <div className="filter-item">
                    <strong>Investment Stage:</strong> {filters.investmentStage || 'All'}
                  </div>
                  <div className="filter-item">
                    <strong>Sector:</strong> {filters.sector || 'All'}
                  </div>
                  <div className="filter-item">
                    <strong>Revenue Criteria:</strong> {filters.revenueCriteria || 'All'}
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button 
                  className="cancel-create-btn"
                  onClick={() => setShowCreateForm(false)}
                  disabled={isCreating}
                >
                  Cancel
                </button>
                <button 
                  className="submit-create-btn"
                  onClick={handleCreate}
                  disabled={isCreating}
                >
                  {isCreating ? '⏳ Creating...' : '💾 Create Search'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Sidebar;
