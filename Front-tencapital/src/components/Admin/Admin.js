import React, { useState, useEffect } from 'react';
import authService from '../../services/authService';
import { API_CONFIG } from '../../config/apiConfig';
import './Admin.css';

// Configure API base URL from centralized config
const API_BASE_URL = API_CONFIG.BASE_URL;

const Admin = () => {
  // User Management State
  const [userSearch, setUserSearch] = useState('');
  const [users, setUsers] = useState([
    { id: 1, name: 'Regular User', email: 'user@example.com', role: 'User' },
    { id: 2, name: 'Client User', email: 'client@example.com', role: 'Client' },
    { id: 3, name: 'Admin User', email: 'admin@example.com', role: 'Admin' },
    { id: 4, name: 'Benedict Sherlock', email: 'benedict@sherlock.to', role: 'Admin' },
    { id: 5, name: 'Philippe Mathew', email: 'matt@sherlock.to', role: 'Admin' },
    { id: 6, name: 'Sherlock Admin', email: 'exampleadminaccount@sherlock.to', role: 'Client' }
  ]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserActions, setShowUserActions] = useState(null);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState(null);
  const [apiStatus, setApiStatus] = useState('unknown'); // 'working', 'error', 'unknown'
  const [actionLoading, setActionLoading] = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUserForRole, setSelectedUserForRole] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [addItemError, setAddItemError] = useState(null);
  
  // Unapproved Investors State
  const [unapprovedInvestors, setUnapprovedInvestors] = useState([]);
  const [isLoadingUnapproved, setIsLoadingUnapproved] = useState(false);
  const [unapprovedError, setUnapprovedError] = useState(null);
  const [showInvestorDetailsModal, setShowInvestorDetailsModal] = useState(false);
  const [selectedInvestorDetails, setSelectedInvestorDetails] = useState(null);
  const [investorSearchTerm, setInvestorSearchTerm] = useState('');
  
  // API call deduplication
  const [hasInitialized, setHasInitialized] = useState(false);
  
  // Custom Alert System State
  const [customAlert, setCustomAlert] = useState(null);

  // Custom Alert Functions
  const showCustomAlert = (type, title, message, onConfirm = null, onCancel = null) => {
    setCustomAlert({
      type,
      title,
      message,
      onConfirm,
      onCancel,
      show: true
    });
  };

  const hideCustomAlert = () => {
    setCustomAlert(null);
  };


  const handleAlertConfirm = () => {
    if (customAlert && customAlert.onConfirm) {
      customAlert.onConfirm();
    }
    hideCustomAlert();
  };

  const handleAlertCancel = () => {
    if (customAlert && customAlert.onCancel) {
      customAlert.onCancel();
    }
    hideCustomAlert();
  };
  
  // Category data state
  const [categoryData, setCategoryData] = useState({
    Industries: [],
    Locations: [],
    'Investor Types': [],
    'Revenue Criteria': [],
    'Investment Stages': [],
    Sectors: []
  });
  const [categoryLoading, setCategoryLoading] = useState({});
  const [categoryErrors, setCategoryErrors] = useState({});

  // Unapproved Records State
  const [unapprovedSearch, setUnapprovedSearch] = useState('');
  const [unapprovedRecords] = useState([]);

  // Filter Properties Management State
  const [selectedCategory, setSelectedCategory] = useState('Industries');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newIndustry, setNewIndustry] = useState('');
  const [industries, setIndustries] = useState([
    'AI',
    'E-commerce',
    'Blockchain',
    'Real Estate',
    'Biotech',
    'Cleantech',
    'SaaS'
  ]);

  // Additional categories
  const [locations, setLocations] = useState([
    'New York',
    'San Francisco',
    'London',
    'Paris',
    'Tokyo',
    'Singapore'
  ]);
  const [investorTypes, setInvestorTypes] = useState([
    'Venture Capital',
    'Private Equity',
    'Angel Investor',
    'Corporate VC',
    'Family Office'
  ]);
  const [revenueCriteria, setRevenueCriteria] = useState([
    '> $1M',
    '> $10M',
    '> $50M',
    '> $100M',
    '> $500M'
  ]);
  const [investmentStages, setInvestmentStages] = useState([
    'Seed',
    'Series A',
    'Series B',
    'Series C',
    'Growth',
    'Late Stage'
  ]);
  const [sectors, setSectors] = useState([
    'Technology',
    'Healthcare',
    'Finance',
    'Education',
    'Energy',
    'Manufacturing'
  ]);

  // Filter users based on search
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    user.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    user.role.toLowerCase().includes(userSearch.toLowerCase())
  );

  // Filter unapproved records based on search
  const filteredUnapproved = unapprovedRecords.filter(record => 
    record.toLowerCase().includes(unapprovedSearch.toLowerCase())
  );

  // Handle adding new item with API integration
  const handleAddIndustry = async () => {
    if (!newIndustry.trim()) {
      setAddItemError('Please enter a name');
      return;
    }

    setIsAddingItem(true);
    setAddItemError(null);

    try {
      let result;
      const itemName = newIndustry.trim();

      switch (selectedCategory) {
        case 'Industries':
          result = await addIndustry(itemName);
          break;
        case 'Locations':
          result = await addLocation(itemName);
          break;
        case 'Investor Types':
          result = await addInvestorType(itemName);
          break;
        case 'Revenue Criteria':
          result = await addRevenueCriteria(itemName);
          break;
        case 'Investment Stages':
          result = await addInvestmentStage(itemName);
          break;
        case 'Sectors':
          result = await addSector(itemName);
          break;
        default:
          throw new Error('Invalid category selected');
      }

      // Update local state
      handleAddItem(selectedCategory, itemName);
      
      // Show success message
      alert(`✅ ${selectedCategory.slice(0, -1)} "${itemName}" added successfully!`);
      
      // Reset form
      setNewIndustry('');
      setShowAddModal(false);
      
    } catch (error) {
      console.error(`Error adding ${selectedCategory.toLowerCase()}:`, error);
      setAddItemError(`Failed to add ${selectedCategory.toLowerCase()}: ${error.message}`);
    } finally {
      setIsAddingItem(false);
    }
  };

  // Handle deleting industry
  const handleDeleteIndustry = (industry) => {
    setIndustries(industries.filter(item => item !== industry));
  };

  // Generic functions for all categories
  const handleAddItem = (category, item) => {
    if (!item.trim()) return;
    
    switch (category) {
      case 'Industries':
        if (!industries.includes(item.trim())) {
          setIndustries([...industries, item.trim()]);
        }
        break;
      case 'Locations':
        if (!locations.includes(item.trim())) {
          setLocations([...locations, item.trim()]);
        }
        break;
      case 'Investor Types':
        if (!investorTypes.includes(item.trim())) {
          setInvestorTypes([...investorTypes, item.trim()]);
        }
        break;
      case 'Revenue Criteria':
        if (!revenueCriteria.includes(item.trim())) {
          setRevenueCriteria([...revenueCriteria, item.trim()]);
        }
        break;
      case 'Investment Stages':
        if (!investmentStages.includes(item.trim())) {
          setInvestmentStages([...investmentStages, item.trim()]);
        }
        break;
      case 'Sectors':
        if (!sectors.includes(item.trim())) {
          setSectors([...sectors, item.trim()]);
        }
        break;
      default:
        break;
    }
    setNewIndustry('');
    setShowAddModal(false);
  };

  const handleDeleteItem = (category, item) => {
    switch (category) {
      case 'Industries':
        setIndustries(industries.filter(i => i !== item));
        break;
      case 'Locations':
        setLocations(locations.filter(i => i !== item));
        break;
      case 'Investor Types':
        setInvestorTypes(investorTypes.filter(i => i !== item));
        break;
      case 'Revenue Criteria':
        setRevenueCriteria(revenueCriteria.filter(i => i !== item));
        break;
      case 'Investment Stages':
        setInvestmentStages(investmentStages.filter(i => i !== item));
        break;
      case 'Sectors':
        setSectors(sectors.filter(i => i !== item));
        break;
      default:
        break;
    }
  };

  // Handle deleting category items via API
  const handleDeleteCategoryItem = async (categoryId, item) => {
    const category = allCategories.find(c => c.id === categoryId);
    if (!category) return;

    // Get item ID and name - handle different data structures
    let itemId, itemName;
    
    if (typeof item === 'object') {
      // Try different possible ID fields
      itemId = item.id || item._id || item.ID || item.Id;
      // Try different possible name fields
      itemName = item.name || item.title || item.label || item.Name || item.Title || item.Label || itemId;
    } else {
      // Item is a string
      itemId = item;
      itemName = item;
    }

    // Debug logging
    console.log('Delete item details:', {
      categoryId,
      item,
      itemId,
      itemName,
      itemType: typeof item
    });

    // Check if we have a valid ID
    if (!itemId) {
      showCustomAlert(
        'error',
        'Erreur de suppression',
        `Impossible de déterminer l'ID de l'élément à supprimer.\n\nÉlément: ${itemName}\nType: ${typeof item}\nStructure: ${JSON.stringify(item)}`
      );
      return;
    }

    // Confirmation dialog
    const confirmMessage = `⚠️ ATTENTION: Suppression définitive\n\n` +
                         `Êtes-vous sûr de vouloir supprimer cet élément ?\n\n` +
                         `Cette action est IRRÉVERSIBLE.`;
    
    showCustomAlert(
      'warning',
      'Confirmation de suppression',
      confirmMessage,
      async () => {
        try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      // Determine the correct API endpoint based on category
      let endpoint = '';
      switch (categoryId) {
        case 'Industries':
          endpoint = `/industries/${itemId}`;
          break;
        case 'Locations':
          endpoint = `/locations/${itemId}`;
          break;
        case 'Investor Types':
          endpoint = `/investor-types/${itemId}`;
          break;
        case 'Revenue Criteria':
          endpoint = `/revenue-criteria/${itemId}`;
          break;
        case 'Investment Stages':
          endpoint = `/investment-stages/${itemId}`;
          break;
        case 'Sectors':
          endpoint = `/sectors/${itemId}`;
          break;
        default:
          throw new Error('Invalid category');
      }

      console.log('Making DELETE request to:', `${API_BASE_URL}${endpoint}`);

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Delete API error:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

          // Refresh the category data after successful deletion
          await fetchCategoryData(categoryId);
          
          // Show success message
          showCustomAlert(
            'success',
            'Suppression réussie',
            `✅ L'élément a été supprimé avec succès!`
          );

        } catch (error) {
          console.error('Error deleting item:', error);
          showCustomAlert(
            'error',
            'Erreur de suppression',
            `❌ Erreur lors de la suppression:\n\n${error.message}\n\nVeuillez réessayer.`
          );
        }
      },
      () => console.log('Deletion cancelled')
    );
  };

  const getCurrentItems = (category) => {
    switch (category) {
      case 'Industries': return industries;
      case 'Locations': return locations;
      case 'Investor Types': return investorTypes;
      case 'Revenue Criteria': return revenueCriteria;
      case 'Investment Stages': return investmentStages;
      case 'Sectors': return sectors;
      default: return [];
    }
  };

  // Category dropdown management
  const allCategories = [
    { id: 'Industries', name: 'Industries', icon: '🏭', endpoint: '/industries' },
    { id: 'Locations', name: 'Locations', icon: '📍', endpoint: '/locations' },
    { id: 'Investor Types', name: 'Investor Types', icon: '💼', endpoint: '/investor-types' },
    { id: 'Revenue Criteria', name: 'Revenue Criteria', icon: '💰', endpoint: '/revenue-criteria' },
    { id: 'Investment Stages', name: 'Investment Stages', icon: '📈', endpoint: '/investment-stages' },
    { id: 'Sectors', name: 'Sectors', icon: '🏢', endpoint: '/sectors' }
  ];

  // Function to fetch data for a specific category
  const fetchCategoryData = async (categoryId) => {
    const category = allCategories.find(c => c.id === categoryId);
    if (!category) return;

    setCategoryLoading(prev => ({ ...prev, [categoryId]: true }));
    setCategoryErrors(prev => ({ ...prev, [categoryId]: null }));

    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      console.log(`Fetching data for ${categoryId} from ${category.endpoint}`);
      
      const response = await fetch(`${API_BASE_URL}${category.endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();
      console.log(`Raw response for ${categoryId}:`, responseData);

      // Parse the data based on different possible response formats
      let parsedData = [];
      
      if (Array.isArray(responseData)) {
        // Direct array response
        parsedData = responseData;
      } else if (responseData.data && Array.isArray(responseData.data)) {
        // Nested data array
        parsedData = responseData.data;
      } else if (responseData.items && Array.isArray(responseData.items)) {
        // Items array
        parsedData = responseData.items;
      } else if (responseData.results && Array.isArray(responseData.results)) {
        // Results array
        parsedData = responseData.results;
      } else if (responseData[categoryId.toLowerCase()] && Array.isArray(responseData[categoryId.toLowerCase()])) {
        // Category-specific array
        parsedData = responseData[categoryId.toLowerCase()];
      } else if (typeof responseData === 'object' && responseData !== null) {
        // Try to find any array property
        const arrayKeys = Object.keys(responseData).filter(key => Array.isArray(responseData[key]));
        if (arrayKeys.length > 0) {
          parsedData = responseData[arrayKeys[0]];
        } else {
          // If no array found, wrap the object in an array
          parsedData = [responseData];
        }
      } else {
        // Fallback: wrap in array
        parsedData = [responseData];
      }

      console.log(`Parsed data for ${categoryId}:`, parsedData);

      // Update category data
      setCategoryData(prev => ({
        ...prev,
        [categoryId]: parsedData
      }));

    } catch (error) {
      console.error(`Error fetching data for ${categoryId}:`, error);
      setCategoryErrors(prev => ({
        ...prev,
        [categoryId]: error.message
      }));
    } finally {
      setCategoryLoading(prev => ({ ...prev, [categoryId]: false }));
    }
  };

  const handleCategoryToggle = (categoryId) => {
    setSelectedCategories(prev => {
      const isCurrentlySelected = prev.includes(categoryId);
      
      if (isCurrentlySelected) {
        // Category is being deselected
        return prev.filter(id => id !== categoryId);
      } else {
        // Category is being selected - fetch its data
        fetchCategoryData(categoryId);
        return [...prev, categoryId];
      }
    });
  };

  const handleAddToSelectedCategory = (categoryId) => {
    setSelectedCategory(categoryId);
    setShowAddModal(true);
  };

  // API functions for each category
  const addIndustry = async (name) => {
    try {
      // Get authentication token
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      const response = await fetch(`${API_BASE_URL}/industries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Industry added successfully:', result);
      return result;
    } catch (error) {
      console.error('Error adding industry:', error);
      throw error;
    }
  };

  const addLocation = async (name) => {
    try {
      // Get authentication token
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      const response = await fetch(`${API_BASE_URL}/locations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Location added successfully:', result);
      return result;
    } catch (error) {
      console.error('Error adding location:', error);
      throw error;
    }
  };

  const addInvestorType = async (name) => {
    try {
      // Get authentication token
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      const response = await fetch(`${API_BASE_URL}/investor-types`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Investor type added successfully:', result);
      return result;
    } catch (error) {
      console.error('Error adding investor type:', error);
      throw error;
    }
  };

  const addRevenueCriteria = async (name) => {
    try {
      // Get authentication token
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      const response = await fetch(`${API_BASE_URL}/revenue-criteria`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Revenue criteria added successfully:', result);
      return result;
    } catch (error) {
      console.error('Error adding revenue criteria:', error);
      throw error;
    }
  };

  const addInvestmentStage = async (name) => {
    try {
      // Get authentication token
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      const response = await fetch(`${API_BASE_URL}/investment-stages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Investment stage added successfully:', result);
      return result;
    } catch (error) {
      console.error('Error adding investment stage:', error);
      throw error;
    }
  };

  const addSector = async (name) => {
    try {
      // Get authentication token
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      const response = await fetch(`${API_BASE_URL}/sectors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Sector added successfully:', result);
      return result;
    } catch (error) {
      console.error('Error adding sector:', error);
      throw error;
    }
  };

  // Handle user role click
  const handleUserRoleClick = (userId) => {
    setShowUserActions(showUserActions === userId ? null : userId);
    setSelectedUser(userId);
  };

  // Handle edit user - open role selection modal
  const handleEditUser = (userId) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setSelectedUserForRole(user);
      setSelectedRole(user.role);
      setShowRoleModal(true);
    }
    setShowUserActions(null);
  };

  // Handle role update confirmation
  const handleConfirmRoleUpdate = async () => {
    if (!selectedUserForRole || !selectedRole) return;

    setActionLoading(`edit-${selectedUserForRole.id}`);
    try {
      const apiRole = mapRoleToAPI(selectedRole);
      console.log(`Updating role for user ${selectedUserForRole.id} from: ${selectedRole} to API role: ${apiRole}`);
      
      // Get authentication token
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      const response = await fetch(`${API_BASE_URL}/users/${selectedUserForRole.id}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        body: JSON.stringify({
          role: apiRole
        })
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        // Try to get error details from response
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          console.error('Error response data:', errorData);
          errorMessage += ` - ${errorData.message || errorData.error || 'Unknown error'}`;
        } catch (parseError) {
          console.error('Could not parse error response:', parseError);
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Role update response:', result);

      // Update local state
      setUsers(users.map(u => 
        u.id === selectedUserForRole.id ? { ...u, role: selectedRole } : u
      ));

      alert(`Rôle mis à jour avec succès pour ${selectedUserForRole.firstName} ${selectedUserForRole.lastName}`);
      
      // Close modal
      setShowRoleModal(false);
      setSelectedUserForRole(null);
      setSelectedRole('');
      
    } catch (error) {
      console.error('Error updating user role:', error);
      console.error('User ID:', selectedUserForRole.id);
      console.error('New role:', selectedRole);
      
      // More detailed error message
      let errorMsg = `Erreur lors de la mise à jour du rôle: ${error.message}`;
      if (error.message.includes('500')) {
        errorMsg += '\n\nErreur serveur (500). Vérifiez que le backend est en cours d\'exécution et que l\'endpoint /users/:userId/role est configuré correctement.';
      }
      
      alert(errorMsg);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle role modal close
  const handleCloseRoleModal = () => {
    setShowRoleModal(false);
    setSelectedUserForRole(null);
    setSelectedRole('');
  };

  // Map frontend roles to backend API roles
  const mapRoleToAPI = (frontendRole) => {
    const roleMapping = {
      'User': 'user',
      'Client': 'moderator', // Client maps to moderator in backend
      'Admin': 'admin'
    };
    const apiRole = roleMapping[frontendRole] || frontendRole.toLowerCase();
    console.log(`Mapping frontend role "${frontendRole}" to API role "${apiRole}"`);
    return apiRole;
  };

  // Map backend roles to frontend display roles
  const mapRoleFromAPI = (backendRole) => {
    const roleMapping = {
      'user': 'User',
      'moderator': 'Client',
      'admin': 'Admin'
    };
    return roleMapping[backendRole] || backendRole;
  };

  // Handle delete user
  const handleDeleteUser = async (userId) => {
    const user = users.find(u => u.id === userId);
    if (!user) {
      showCustomAlert(
        'error',
        'Erreur',
        'Utilisateur non trouvé.'
      );
      setShowUserActions(null);
      return;
    }

    // Get user display name
    const userName = user.firstName && user.lastName 
      ? `${user.firstName} ${user.lastName}` 
      : user.name || user.email || 'Cet utilisateur';
    
    // Enhanced confirmation dialog using custom alert
    const confirmMessage = `⚠️ ATTENTION: Suppression définitive\n\n` +
                         `Utilisateur: ${userName}\n` +
                         `Email: ${user.email}\n` +
                         `Rôle: ${user.role}\n\n` +
                         `Cette action est IRRÉVERSIBLE et supprimera définitivement:\n` +
                         `• Le compte utilisateur\n` +
                         `• Toutes les données associées\n` +
                         `• L'historique des connexions\n\n` +
                         `Êtes-vous ABSOLUMENT SÛR de vouloir continuer ?`;
    
    showCustomAlert(
      'warning',
      'Confirmation de suppression',
      confirmMessage,
      async () => {
        // User confirmed deletion
        setActionLoading(`delete-${userId}`);
        try {
          console.log(`Deleting user ${userId}: ${userName}`);
          
          // Get authentication token
          const token = authService.getToken();
          if (!token) {
            throw new Error('No authentication token found. Please log in again.');
          }

          const response = await fetch(`${API_BASE_URL}/users/account/${userId}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          });

          console.log('Delete response status:', response.status);
          console.log('Delete response headers:', response.headers);

          if (!response.ok) {
            // Handle specific error codes
            let errorMessage = '';
            if (response.status === 401) {
              errorMessage = 'Authentication failed. Please log in again.';
            } else if (response.status === 403) {
              errorMessage = 'Access denied. You do not have permission to delete users.';
            } else if (response.status === 404) {
              errorMessage = 'User not found. The user may have already been deleted.';
            } else if (response.status === 409) {
              errorMessage = 'Cannot delete user. User may have associated data that prevents deletion.';
            } else if (response.status >= 500) {
              errorMessage = 'Server error. Please try again later.';
            } else {
              errorMessage = `HTTP error! status: ${response.status}`;
            }

            // Try to get additional error details from response
            try {
              const errorData = await response.json();
              console.error('Delete error response data:', errorData);
              if (errorData.message || errorData.error) {
                errorMessage += ` - ${errorData.message || errorData.error}`;
              }
            } catch (parseError) {
              console.error('Could not parse delete error response:', parseError);
            }
            
            throw new Error(errorMessage);
          }

          const result = await response.json();
          console.log('User delete response:', result);

          // Update local state
          setUsers(users.filter(u => u.id !== userId));

          showCustomAlert(
            'success',
            'Suppression réussie',
            `✅ L'utilisateur ${userName} a été supprimé avec succès!`
          );
          
        } catch (error) {
          console.error('Error deleting user:', error);
          console.error('User ID:', userId);
          console.error('User name:', userName);
          
          // More detailed error message
          let errorMsg = `Erreur lors de la suppression de l'utilisateur:\n\n${error.message}`;
          if (error.message.includes('500')) {
            errorMsg += '\n\nErreur serveur (500). Vérifiez que le backend est en cours d\'exécution et que l\'endpoint /users/account/:userId est configuré correctement.';
          } else if (error.message.includes('404')) {
            errorMsg += '\n\nUtilisateur non trouvé (404). L\'utilisateur a peut-être déjà été supprimé.';
          }
          
          showCustomAlert(
            'error',
            'Erreur de suppression',
            errorMsg
          );
        } finally {
          setActionLoading(null);
          setShowUserActions(null);
        }
      },
      () => {
        // User cancelled deletion
        setShowUserActions(null);
      }
    );
  };

  // Fetch users from API
  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    setUsersError(null);
    
    try {
      // Get authentication token
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      const response = await fetch(`${API_BASE_URL}/users/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        } else if (response.status === 403) {
          throw new Error('Access denied. You do not have permission to view users.');
        } else if (response.status === 404) {
          throw new Error('Users endpoint not found. Please check the API configuration.');
        } else if (response.status >= 500) {
          throw new Error('Server error. Please try again later.');
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      const data = await response.json();
      console.log('Users API Response:', data);
      
      // Handle different response structures
      let usersData = [];
      if (Array.isArray(data)) {
        usersData = data;
      } else if (data.users && Array.isArray(data.users)) {
        usersData = data.users;
      } else if (data.data && Array.isArray(data.data)) {
        usersData = data.data;
      } else if (data.results && Array.isArray(data.results)) {
        usersData = data.results;
      }

      // Transform API data to match our component structure
      const transformedUsers = usersData.map((user, index) => ({
        id: user._id || user.id || index + 1,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        role: mapRoleFromAPI(user.role) || 'User',
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User'
      }));

      setUsers(transformedUsers);
      setApiStatus('working');
      setUsersError(null);
      console.log('Transformed users:', transformedUsers);
      
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsersError(`Erreur lors du chargement des utilisateurs: ${error.message}`);
      setApiStatus('error');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Test users API specifically
  const testUsersAPI = async () => {
    try {
      console.log('Testing users API...');
      const token = authService.getToken();
      
      if (!token) {
        alert('❌ No authentication token found. Please log in first.');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/users/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Users API Response Status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Users API Response Data:', data);
        const userCount = Array.isArray(data) ? data.length : 
                         (data.users ? data.users.length : 
                         (data.data ? data.data.length : 'unknown'));
        alert(`✅ Users API is working! Found ${userCount} users.`);
      } else {
        const errorText = await response.text();
        console.log('Users API Error Response:', errorText);
        alert(`❌ Users API error: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('Users API test failed:', error);
      alert(`❌ Users API test failed: ${error.message}`);
    }
  };

  // Test delete user API specifically
  const testDeleteUserAPI = async (testUserId = 'test-user-id') => {
    try {
      console.log('Testing delete user API...');
      const token = authService.getToken();
      
      if (!token) {
        alert('❌ No authentication token found. Please log in first.');
        return;
      }

      // Test with a non-existent user ID to avoid actually deleting a user
      const response = await fetch(`${API_BASE_URL}/users/account/${testUserId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('Delete User API Response Status:', response.status);
      
      if (response.status === 404) {
        alert('✅ Delete User API is working! (404 expected for non-existent user)');
      } else if (response.ok) {
        alert('✅ Delete User API is working! (User deleted successfully)');
      } else {
        const errorText = await response.text();
        console.log('Delete User API Error Response:', errorText);
        alert(`❌ Delete User API error: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('Delete User API test failed:', error);
      alert(`❌ Delete User API test failed: ${error.message}`);
    }
  };

  // Test backend connectivity
  const testBackendConnection = async () => {
    try {
      console.log('Testing backend connection...');
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        console.log('Backend is running and accessible');
        return true;
      } else {
        console.log('Backend responded with status:', response.status);
        return false;
      }
    } catch (error) {
      console.error('Backend connection test failed:', error);
      return false;
    }
  };

  // Utility function to safely extract array from API response
  const extractInvestorsArray = (data) => {
    if (Array.isArray(data)) {
      return data;
    }
    
    if (data && typeof data === 'object') {
      // Try common property names
      const possibleArrays = [
        data.data,
        data.investors,
        data.results,
        data.items,
        data.list,
        data.records
      ];
      
      for (const arr of possibleArrays) {
        if (Array.isArray(arr)) {
          return arr;
        }
      }
    }
    
    console.warn('⚠️ Could not extract investors array from:', data);
    return [];
  };

  // Fetch unapproved investors
  const fetchUnapprovedInvestors = async () => {
    setIsLoadingUnapproved(true);
    setUnapprovedError(null);
    
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/investors/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📊 All investors data:', data);
        
        // Safely extract investors array
        const allInvestors = extractInvestorsArray(data);
        console.log('📋 Extracted investors array:', allInvestors);
        
        // Filter for unapproved investors
        const unapprovedOnly = allInvestors.filter(investor => 
          investor && (
            investor.status === 'Unapproved' || 
            investor.status === 'unapproved' || 
            !investor.status || 
            investor.status === null ||
            investor.status === undefined
          )
        );
        
        console.log('📋 Filtered unapproved investors:', unapprovedOnly);
        setUnapprovedInvestors(unapprovedOnly);
      } else {
        throw new Error(`Failed to fetch investors: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error fetching unapproved investors:', error);
      setUnapprovedError(error.message);
      
      // Set mock data with emails for development
      console.log('🔄 Using mock data for development...');
      
      // Simulate all investors data (including approved and unapproved)
      const allMockInvestors = [
        {
          id: 1,
          organizationPersonName: 'Tech Ventures Inc',
          email: 'contact@techventures.com',
          firstName: 'Sarah',
          lastName: 'Johnson',
          location: 'San Francisco, CA',
          investorType: 'Venture Capital',
          sector: 'Technology',
          investmentStage: 'Seed',
          revenueCriteria: '$1M - $10M',
          industries: 'Technology, Software, AI',
          description: 'Leading venture capital firm focused on early-stage technology startups.',
          status: 'Unapproved',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 2,
          organizationPersonName: 'Green Energy Partners',
          email: 'info@greenenergypartners.com',
          firstName: 'Michael',
          lastName: 'Chen',
          location: 'Austin, TX',
          investorType: 'Private Equity',
          sector: 'Clean Energy',
          investmentStage: 'Series A',
          revenueCriteria: '$10M - $50M',
          industries: 'Clean Energy, Sustainability',
          description: 'Private equity firm specializing in clean energy investments.',
          status: 'Unapproved',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 3,
          organizationPersonName: 'HealthTech Capital',
          email: 'hello@healthtechcapital.com',
          firstName: 'Dr. Emily',
          lastName: 'Rodriguez',
          location: 'Boston, MA',
          investorType: 'Family Investment Office',
          sector: 'Healthcare',
          investmentStage: 'Growth',
          revenueCriteria: '$50M+',
          industries: 'Healthcare, Medical Devices',
          description: 'Family investment office focused on healthcare technology.',
          status: 'Unapproved',
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 4,
          organizationPersonName: 'FinTech Innovations',
          email: 'partnerships@fintechinnovations.com',
          firstName: 'David',
          lastName: 'Kim',
          location: 'New York, NY',
          investorType: 'Corporate Venture Capital',
          sector: 'Financial Services',
          investmentStage: 'Series B',
          revenueCriteria: '$25M - $100M',
          industries: 'Financial Services, FinTech, Blockchain',
          description: 'Corporate venture capital arm focused on financial technology innovations.',
          status: 'Approved', // This one is approved, so it won't show in unapproved list
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 5,
          organizationPersonName: 'EduTech Ventures',
          email: 'contact@edutechventures.com',
          firstName: 'Lisa',
          lastName: 'Thompson',
          location: 'Seattle, WA',
          investorType: 'Angel Investor',
          sector: 'Education',
          investmentStage: 'Pre-Seed',
          revenueCriteria: 'Not specified',
          industries: 'Education, EdTech, Online Learning',
          description: 'Angel investor network focused on educational technology.',
          status: null, // This one has no status, so it will show in unapproved list
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
      
      // Filter for unapproved investors (same logic as API)
      const unapprovedOnly = allMockInvestors.filter(investor => 
        investor.status === 'Unapproved' || 
        investor.status === 'unapproved' || 
        !investor.status || 
        investor.status === null
      );
      
      console.log('📋 Mock data - All investors:', allMockInvestors.length);
      console.log('📋 Mock data - Unapproved investors:', unapprovedOnly.length);
      setUnapprovedInvestors(unapprovedOnly);
    } finally {
      setIsLoadingUnapproved(false);
    }
  };

  // Handle investor status change (Approve/Reject)
  const handleInvestorStatusChange = async (investorId, newStatus) => {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Debug logging
      console.log('🔍 Investor status change debug:', {
        investorId,
        newStatus,
        type: typeof investorId
      });

      // Handle different possible ID field names
      let actualInvestorId = investorId;
      if (!actualInvestorId || actualInvestorId === 'undefined') {
        console.error('❌ Invalid investor ID:', investorId);
        throw new Error('Invalid investor ID');
      }

      // Convert status string to numeric value
      const statusValue = newStatus === 'Approved' ? 1 : 0;

      console.log('🚀 Making API call:', {
        url: `${API_BASE_URL}/investors/${actualInvestorId}`,
        method: 'PUT',
        body: { status: statusValue }
      });

      const response = await fetch(`${API_BASE_URL}/investors/${actualInvestorId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: statusValue }),
      });

      if (response.ok) {
        setUnapprovedInvestors(prev => 
          prev.filter(investor => {
            // Handle different ID field names when filtering
            const investorIdToCheck = investor.id || investor._id || investor.ID;
            return investorIdToCheck !== actualInvestorId;
          })
        );
        
        showCustomAlert(
          'success',
          'Status Updated',
          `Investor has been ${newStatus.toLowerCase()} successfully!`,
          null,
          null
        );
      } else {
        throw new Error(`Failed to update investor status: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error updating investor status:', error);
      
      // For development: simulate successful status change
      console.log('🔄 Simulating status change for development...');
      
      setUnapprovedInvestors(prev => 
        prev.filter(investor => {
          // Handle different ID field names when filtering
          const investorIdToCheck = investor.id || investor._id || investor.ID;
          return investorIdToCheck !== investorId;
        })
      );
      
      showCustomAlert(
        'success',
        'Status Updated (Development Mode)',
        `Investor has been ${newStatus.toLowerCase()} successfully! (Using mock data)`,
        null,
        null
      );
    }
  };

  // Handle view investor details
  const handleViewInvestorDetails = (investor) => {
    setSelectedInvestorDetails(investor);
    setShowInvestorDetailsModal(true);
  };

  // Close investor details modal
  const handleCloseInvestorDetails = () => {
    setShowInvestorDetailsModal(false);
    setSelectedInvestorDetails(null);
  };

  // Filter investors based on search term
  const filteredUnapprovedInvestors = unapprovedInvestors.filter(investor =>
    investor.email?.toLowerCase().includes(investorSearchTerm.toLowerCase()) ||
    investor.organizationPersonName?.toLowerCase().includes(investorSearchTerm.toLowerCase()) ||
    investor.firstName?.toLowerCase().includes(investorSearchTerm.toLowerCase()) ||
    investor.lastName?.toLowerCase().includes(investorSearchTerm.toLowerCase())
  );

  // Load users on component mount (with deduplication for StrictMode)
  useEffect(() => {
    if (!hasInitialized) {
      setHasInitialized(true);
      fetchUsers();
      fetchUnapprovedInvestors();
    }
  }, [hasInitialized]);

  // Fermer le menu des options utilisateur quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserActions && !event.target.closest('.user-options-container')) {
        setShowUserActions(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserActions]);

  return (
    <div className="admin-container">
        
        {/* User Management and Unapproved Records - Horizontal Layout */}
        <div className="admin-sections-horizontal">
          {/* User Management Section */}
          <div className="admin-section user-management">
            <div className="section-header">
              <div className="header-icon">👥</div>
              <h2 className="section-title">
                User Management
              </h2>
            </div>
            <div className="search-container">
              <div className="search-icon">🔍</div>
              <input
                type="text"
                placeholder="Search users..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="search-input"
              />
            </div>
            
            <div className="users-list">
              {isLoadingUsers ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>Chargement des utilisateurs...</p>
                </div>
              ) : usersError ? (
                <div className="error-container" style={{
                  background: '#f8d7da',
                  border: '1px solid #f5c6cb',
                  borderRadius: '8px',
                  padding: '20px',
                  margin: '20px 0',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '10px' }}>❌</div>
                  <h3 style={{ color: '#721c24', marginBottom: '10px' }}>Erreur de chargement des utilisateurs</h3>
                  <p className="error-message" style={{ color: '#721c24', marginBottom: '15px' }}>{usersError}</p>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button 
                      className="retry-btn" 
                      onClick={fetchUsers}
                      style={{
                        background: '#007bff',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      🔄 Réessayer
                    </button>
                    <button 
                      className="test-api-btn" 
                      onClick={testUsersAPI}
                      style={{
                        background: '#28a745',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      🧪 Tester l'API
                    </button>
                  </div>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="no-users">
                  <p>Aucun utilisateur trouvé</p>
                </div>
              ) : (
                filteredUsers.map(user => (
                  <div key={user.id} className="user-card">
                    <div className="user-avatar">
                      <span className="avatar-text">
                        {user.firstName ? user.firstName.charAt(0).toUpperCase() : ''}
                        {user.lastName ? user.lastName.charAt(0).toUpperCase() : ''}
                      </span>
                    </div>
                    <div className="user-info">
                      <h3 className="user-name">
                        {user.firstName} {user.lastName}
                      </h3>
                      <p className="user-email">{user.email}</p>
                    </div>
                    <div className="user-actions-container">
                      <span 
                        className={`role-badge role-${user.role.toLowerCase()}`}
                      >
                        {user.role}
                      </span>
                      <div className="user-options-container">
                        <button 
                          className="more-options-btn"
                          onClick={() => setShowUserActions(showUserActions === user.id ? null : user.id)}
                        >
                          ⋮
                        </button>
                        {showUserActions === user.id && (
                          <div className="user-options-dropdown">
                            <div className="dropdown-item" onClick={() => {
                              handleEditUser(user.id);
                              setShowUserActions(null);
                            }}>
                              ✏️ Update
                            </div>
                            <div className="dropdown-item" onClick={() => {
                              handleDeleteUser(user.id);
                              setShowUserActions(null);
                            }}>
                              🗑️ Delete
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Unapproved Records Section */}
          <div className="admin-section unapproved-records">
            <div className="section-header">
              
              <h2 className="section-title">
                {filteredUnapprovedInvestors.length} Unapproved Investors
                {unapprovedError && (
                  <span className="dev-mode-indicator"> (Development Mode)</span>
                )}
              </h2>
              <div className="header-actions">
                <button 
                  className="approve-all-btn"
                  onClick={() => {
                    showCustomAlert(
                      'confirm',
                      'Approve All',
                      'Are you sure you want to approve all unapproved investors?',
                      () => {
                        filteredUnapprovedInvestors.forEach(investor => {
                          handleInvestorStatusChange(investor.id || investor._id || investor.ID, 'Approved');
                        });
                      },
                      null
                    );
                  }}
                  disabled={filteredUnapprovedInvestors.length === 0}
                >
                  <span className="icon">✅</span>
                  Approve All
                </button>
                <button 
                  className="reject-all-btn"
                  onClick={() => {
                    showCustomAlert(
                      'confirm',
                      'Reject All',
                      'Are you sure you want to reject all unapproved investors?',
                      () => {
                        filteredUnapprovedInvestors.forEach(investor => {
                          handleInvestorStatusChange(investor.id || investor._id || investor.ID, 'Rejected');
                        });
                      },
                      null
                    );
                  }}
                  disabled={filteredUnapprovedInvestors.length === 0}
                >
                  <span className="icon">❌</span>
                  Reject All
                </button>
              </div>
            </div>

            <div className="search-container">
              <div className="search-icon">🔍</div>
              <input
                type="text"
                placeholder="Search unapproved investors..."
                value={investorSearchTerm}
                onChange={(e) => setInvestorSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="investors-list">
              {isLoadingUnapproved ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>Loading unapproved investors...</p>
                </div>
              ) : unapprovedError ? (
                <div className="error-container">
                  <div className="error-icon">❌</div>
                  <h3>Error loading investors</h3>
                  <p className="error-message">{unapprovedError}</p>
                  <button className="retry-btn" onClick={fetchUnapprovedInvestors}>
                    Retry
                  </button>
                </div>
              ) : filteredUnapprovedInvestors.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📭</div>
                  <h3>No unapproved investors</h3>
                  <p>All investors have been processed.</p>
                </div>
              ) : (
                filteredUnapprovedInvestors.map((investor) => (
                  <div key={investor.id} className="investor-card">
                    <div className="investor-info">
                      <div className="investor-header">
                        <h3 className="investor-name">
                          {investor.organizationPersonName || 'Unnamed Organization'}
                          <span className="external-link-icon">🔗</span>
                        </h3>
                        <p className="investor-subtitle">{investor.organizationPersonName || 'Organization'}</p>
                      </div>
                      <div className="investor-contact">
                        <div className="contact-item">
                          <span className="contact-icon">✉️</span>
                          <span className="contact-text">{investor.email || 'No email provided'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="investor-actions">
                      <button 
                        className="approve-btn"
                        onClick={() => handleInvestorStatusChange(investor.id || investor._id || investor.ID, 'Approved')}
                        title="Approve this investor"
                      >
                        <span className="icon">✅</span>
                        Approve
                      </button>
                      <button 
                        className="reject-btn"
                        onClick={() => handleInvestorStatusChange(investor.id || investor._id || investor.ID, 'Rejected')}
                        title="Reject this investor"
                      >
                        <span className="icon">❌</span>
                        Reject
                      </button>
                      <button 
                        className="view-details-btn"
                        onClick={() => handleViewInvestorDetails(investor)}
                        title="View detailed information"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Filter Properties Management Section */}
        
          <h2 className="section-title">Filter Properties Management</h2>
          
          {/* Category Selection Dropdown */}
          
            <div className="category-dropdown-header">
              <h3>Select Categories to Manage:</h3>
              <div className="header-buttons">
                
                <button 
                  className="toggle-dropdown-btn"
                  onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                >
                  {showCategoryDropdown ? '🔼 Hide' : '🔽 Show'} Categories
                </button>
              </div>
            </div>
            
            {showCategoryDropdown && (
              <div className="category-dropdown">
                <div className="category-list">
                  {allCategories.map(category => (
                    <div key={category.id} className="category-option">
                      <label className="category-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(category.id)}
                          onChange={() => handleCategoryToggle(category.id)}
                        />
                        <span className="category-label">
                          <span className="category-icon">{category.icon}</span>
                          <span className="category-name">{category.name}</span>
                          <span className="category-status">
                            {selectedCategories.includes(category.id) ? '✅' : '❌'}
                          </span>
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
                
                {selectedCategories.length > 0 && (
                  <div className="selected-categories-actions">
                    <h4>Selected Categories ({selectedCategories.length}):</h4>
                    <div className="action-buttons">
                      {selectedCategories.map(categoryId => {
                        const category = allCategories.find(c => c.id === categoryId);
                        return (
                          <button
                            key={categoryId}
                            className="add-selected-category-btn"
                            onClick={() => handleAddToSelectedCategory(categoryId)}
                            title={`Add new ${category.name.toLowerCase()}`}
                          >
                            {category.icon} + Add {category.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Category Data Display */}
                {selectedCategories.length > 0 && (
                  <div className="category-data-display">
                    <h4>📊 Category Data:</h4>
                    {selectedCategories.map(categoryId => {
                      const category = allCategories.find(c => c.id === categoryId);
                      const data = categoryData[categoryId] || [];
                      const isLoading = categoryLoading[categoryId];
                      const error = categoryErrors[categoryId];
                      
                      return (
                        <div key={categoryId} className="category-data-section">
                          <div className="category-data-header">
                            <h5>
                              {category.icon} {category.name}
                              {isLoading && <span className="loading-indicator"> ⏳ Loading...</span>}
                              {error && <span className="error-indicator"> ❌ Error</span>}
                            </h5>
                            <div className="category-data-count">
                              {!isLoading && !error && (
                                <span className="count-badge">
                                  {Array.isArray(data) ? data.length : 0} items
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {isLoading && (
                            <div className="loading-message">
                              <div className="spinner"></div>
                              <span>Loading {category.name.toLowerCase()}...</span>
                            </div>
                          )}
                          
                          {error && (
                            <div className="error-message">
                              <span className="error-icon">❌</span>
                              <span>Error loading {category.name.toLowerCase()}: {error}</span>
                              <button 
                                className="retry-btn"
                                onClick={() => fetchCategoryData(categoryId)}
                                title="Retry loading data"
                              >
                                🔄 Retry
                              </button>
                            </div>
                          )}
                          
                          {!isLoading && !error && data && (
                            <div className="category-data-content">
                              {Array.isArray(data) && data.length > 0 ? (
                                <div className="data-list">
                                  {data.map((item, index) => {
                                    // Debug logging for each item
                                    console.log(`Item ${index} in ${category.id}:`, {
                                      item,
                                      type: typeof item,
                                      hasId: typeof item === 'object' ? !!item.id : false,
                                      hasName: typeof item === 'object' ? !!item.name : false,
                                      keys: typeof item === 'object' ? Object.keys(item) : 'N/A'
                                    });
                                    
                                    return (
                                      <div key={index} className="data-item">
                                        <span className="item-icon">📋</span>
                                        <span className="item-content">
                                          {typeof item === 'object' ? 
                                            (item.name || item.title || item.label || item.id || JSON.stringify(item)) : 
                                            String(item)
                                          }
                                        </span>
                                        <button 
                                          className="delete-item-btn"
                                          onClick={() => handleDeleteCategoryItem(category.id, item)}
                                          title={`Delete ${typeof item === 'object' ? (item.name || item.title || item.label || item.id) : item}`}
                                        >
                                          🗑️
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="no-data-message">
                                  <span className="no-data-icon">📭</span>
                                  <span>No {category.name.toLowerCase()} data available</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
         
          
       

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add New {selectedCategory.slice(0, -1)}</h3>
              <button 
                className="close-modal-btn"
                onClick={() => setShowAddModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <input
                type="text"
                placeholder={`Enter ${selectedCategory.slice(0, -1).toLowerCase()} name...`}
                value={newIndustry}
                onChange={(e) => {
                  setNewIndustry(e.target.value);
                  setAddItemError(null);
                }}
                className="modal-input"
                autoFocus
                disabled={isAddingItem}
              />
              {addItemError && (
                <div className="error-message" style={{ color: '#dc3545', marginTop: '10px', fontSize: '14px' }}>
                  {addItemError}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button 
                className="cancel-btn"
                onClick={() => {
                  setShowAddModal(false);
                  setAddItemError(null);
                }}
                disabled={isAddingItem}
              >
                Cancel
              </button>
              <button 
                className="confirm-btn"
                onClick={handleAddIndustry}
                disabled={isAddingItem || !newIndustry.trim()}
                style={{ 
                  opacity: isAddingItem || !newIndustry.trim() ? 0.6 : 1,
                  cursor: isAddingItem || !newIndustry.trim() ? 'not-allowed' : 'pointer'
                }}
              >
                {isAddingItem ? 'Adding...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Selection Modal */}
      {showRoleModal && (
        <div className="modal-overlay">
          <div className="modal-content role-selection-modal">
            <div className="modal-header">
              <h3>Change Role</h3>
              <button 
                className="close-modal-btn"
                onClick={handleCloseRoleModal}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              {selectedUserForRole && (
                <div className="user-info-modal">
                  <h4>{selectedUserForRole.firstName} {selectedUserForRole.lastName}</h4>
                  <p>{selectedUserForRole.email}</p>
                  <p className="current-role">Current role: <span className={`role-badge role-${selectedUserForRole.role.toLowerCase()}`}>{selectedUserForRole.role}</span></p>
                </div>
              )}
              
              <div className="role-selection">
                <h4>Select a new role:</h4>
                <div className="role-options">
                  <label className="role-option">
                    <input
                      type="radio"
                      name="role"
                      value="User"
                      checked={selectedRole === 'User'}
                      onChange={(e) => setSelectedRole(e.target.value)}
                    />
                    <span className="role-option-label">
                      <span className="role-badge role-user">User</span>
                      <span className="role-description">Standard user</span>
                    </span>
                  </label>
                  
                  <label className="role-option">
                    <input
                      type="radio"
                      name="role"
                      value="Client"
                      checked={selectedRole === 'Client'}
                      onChange={(e) => setSelectedRole(e.target.value)}
                    />
                    <span className="role-option-label">
                      <span className="role-badge role-client">Moderator</span>
                      <span className="role-description">Moderator with limited access</span>
                    </span>
                  </label>
                  
                  <label className="role-option">
                    <input
                      type="radio"
                      name="role"
                      value="Admin"
                      checked={selectedRole === 'Admin'}
                      onChange={(e) => setSelectedRole(e.target.value)}
                    />
                    <span className="role-option-label">
                      <span className="role-badge role-admin">Admin</span>
                      <span className="role-description">Administrator with full access</span>
                    </span>
                  </label>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="cancel-btn"
                onClick={handleCloseRoleModal}
              >
                Cancel
              </button>
              <button 
                className="confirm-btn"
                onClick={handleConfirmRoleUpdate}
                disabled={!selectedRole || actionLoading === `edit-${selectedUserForRole?.id}`}
              >
                {actionLoading === `edit-${selectedUserForRole?.id}` ? '⏳ Updating...' : '✅ Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Custom Alert System */}
      {customAlert && (
        <div className="custom-alert-overlay" onClick={hideCustomAlert}>
          <div className="custom-alert" onClick={(e) => e.stopPropagation()}>
            <div className="custom-alert-header">
              <div className={`custom-alert-icon ${customAlert.type}`}>
                {customAlert.type === 'success' && '✅'}
                {customAlert.type === 'error' && '❌'}
                {customAlert.type === 'warning' && '⚠️'}
                {customAlert.type === 'info' && 'ℹ️'}
              </div>
              <h3 className="custom-alert-title">{customAlert.title}</h3>
            </div>
            <div className="custom-alert-body">
              {customAlert.message}
            </div>
            <div className="custom-alert-footer">
              {customAlert.onCancel && (
                <button 
                  className="custom-alert-btn secondary"
                  onClick={handleAlertCancel}
                >
                  Annuler
                </button>
              )}
              <button 
                className={`custom-alert-btn ${customAlert.type === 'error' || customAlert.type === 'warning' ? 'danger' : 'primary'}`}
                onClick={handleAlertConfirm}
              >
                {customAlert.type === 'warning' ? 'Confirmer la suppression' : customAlert.type === 'error' ? 'OK' : 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}

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
                  <h2>{selectedInvestorDetails.organizationPersonName || 'N/A'}</h2>
                  <div className="status-badge unapproved">Unapproved</div>
                </div>
              </div>
              <div className="modal-actions">
                <button 
                  className="approve-btn"
                  onClick={() => {
                    handleInvestorStatusChange(selectedInvestorDetails.id || selectedInvestorDetails._id || selectedInvestorDetails.ID, 'Approved');
                    handleCloseInvestorDetails();
                  }}
                >
                  <span className="icon">✅</span>
                  Approve
                </button>
                <button 
                  className="reject-btn"
                  onClick={() => {
                    handleInvestorStatusChange(selectedInvestorDetails.id || selectedInvestorDetails._id || selectedInvestorDetails.ID, 'Rejected');
                    handleCloseInvestorDetails();
                  }}
                >
                  <span className="icon">❌</span>
                  Reject
                </button>
              </div>
            </div>

            
              <div className="investor-details-grid">
                <div className="left-column">
                  <div className="info-section">
                    <h3>Contact Information</h3>
                    <div className="info-item">
                      <label>Email:</label>
                      <span>{selectedInvestorDetails.email || 'Not specified'}</span>
                    </div>
                    <div className="info-item">
                      <label>Name:</label>
                      <span>{selectedInvestorDetails.firstName && selectedInvestorDetails.lastName ? 
                        `${selectedInvestorDetails.firstName} ${selectedInvestorDetails.lastName}` : 
                        'Not specified'}</span>
                    </div>
                    <div className="info-item">
                      <label>Location:</label>
                      <span>{selectedInvestorDetails.location || 'Not specified'}</span>
                    </div>
                    <div className="info-item">
                      <label>Date Added:</label>
                      <span>{selectedInvestorDetails.createdAt ? 
                        new Date(selectedInvestorDetails.createdAt).toLocaleDateString() : 
                        'Not specified'}</span>
                    </div>
                  </div>

                  <div className="info-section">
                    <h3>Investment Details</h3>
                    <div className="info-item">
                      <label>Investor Type:</label>
                      <span>{selectedInvestorDetails.investorType || 'Not specified'}</span>
                    </div>
                    <div className="info-item">
                      <label>Sector:</label>
                      <span>{selectedInvestorDetails.sector || 'Not specified'}</span>
                    </div>
                    <div className="info-item">
                      <label>Investment Stage:</label>
                      <span>{selectedInvestorDetails.investmentStage || 'Not specified'}</span>
                    </div>
                    <div className="info-item">
                      <label>Revenue Criteria:</label>
                      <span>{selectedInvestorDetails.revenueCriteria || 'Not specified'}</span>
                    </div>
                  </div>

                  <div className="info-section">
                    <h3>Industries</h3>
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
                  </div>

                  <div className="info-section">
                    <h3>Description</h3>
                    <div className="description-text">
                      {selectedInvestorDetails.description || 'No description provided.'}
                    </div>
                  </div>
                </div>

                <div className="right-column">
                  <div className="info-section">
                    <h3>Additional Notes</h3>
                    <textarea 
                      className="notes-textarea"
                      placeholder="Add additional notes about this investor..."
                      defaultValue={selectedInvestorDetails.description || ''}
                    />
                    <button className="save-notes-btn">Save Notes</button>
                  </div>
                </div>
              </div>
            

            <div className="modal-footer">
              <button className="close-btn" onClick={handleCloseInvestorDetails}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
