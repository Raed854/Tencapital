import React, { useState, useEffect } from 'react';
import './AddInvestor.css';
import authService from '../../services/authService';
import { API_CONFIG } from '../../config/apiConfig';

// Configure API base URL from centralized config
const API_BASE_URL = API_CONFIG.BASE_URL;

const AddInvestor = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    organization: '',
    email: '',
    firstName: '',
    lastName: '',
    location: '',
    linkedinUrl: '',
    investorType: '',
    investmentStage: '',
    revenueCriteria: '',
    sector: '',
    industries: [],
    description: ''
  });

  const [errors, setErrors] = useState({});
  
  // API Data States
  const [apiData, setApiData] = useState({
    investorTypes: [],
    sectors: [],
    investmentStages: [],
    revenueCriteria: [],
    locations: []
  });
  const [isLoadingApi, setIsLoadingApi] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  // API Functions
  const fetchInvestorTypes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/investor-types`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      return Array.isArray(data) ? data : data.investorTypes || data.data || [];
    } catch (error) {
      console.error('Error fetching investor types:', error);
      return [];
    }
  };

  const fetchSectors = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/sectors`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      return Array.isArray(data) ? data : data.sectors || data.data || [];
    } catch (error) {
      console.error('Error fetching sectors:', error);
      return [];
    }
  };

  const fetchInvestmentStages = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/investment-stages`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      return Array.isArray(data) ? data : data.investmentStages || data.data || [];
    } catch (error) {
      console.error('Error fetching investment stages:', error);
      return [];
    }
  };

  const fetchRevenueCriteria = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/revenue-criteria`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      return Array.isArray(data) ? data : data.revenueCriteria || data.data || [];
    } catch (error) {
      console.error('Error fetching revenue criteria:', error);
      return [];
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/locations`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      return Array.isArray(data) ? data : data.locations || data.data || [];
    } catch (error) {
      console.error('Error fetching locations:', error);
      return [];
    }
  };

  // Fetch all API data
  const fetchAllApiData = async () => {
    setIsLoadingApi(true);
    try {
      const [investorTypes, sectors, investmentStages, revenueCriteria, locations] = await Promise.all([
        fetchInvestorTypes(),
        fetchSectors(),
        fetchInvestmentStages(),
        fetchRevenueCriteria(),
        fetchLocations()
      ]);

      setApiData({
        investorTypes: investorTypes.map(item => item.name || item),
        sectors: sectors.map(item => item.name || item),
        investmentStages: investmentStages.map(item => item.name || item),
        revenueCriteria: revenueCriteria.map(item => item.name || item),
        locations: locations.map(item => item.name || item)
      });

      console.log('API data loaded successfully:', {
        investorTypes: investorTypes.length,
        sectors: sectors.length,
        investmentStages: investmentStages.length,
        revenueCriteria: revenueCriteria.length,
        locations: locations.length
      });
    } catch (error) {
      console.error('Error fetching API data:', error);
    } finally {
      setIsLoadingApi(false);
    }
  };

  // Load API data when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchAllApiData();
    }
  }, [isOpen]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleIndustryAdd = (industry) => {
    if (industry && !formData.industries.includes(industry)) {
      setFormData(prev => ({
        ...prev,
        industries: [...prev.industries, industry]
      }));
    }
  };

  const handleIndustryRemove = (industryToRemove) => {
    setFormData(prev => ({
      ...prev,
      industries: prev.industries.filter(industry => industry !== industryToRemove)
    }));
  };

  const resetForm = () => {
    setFormData({
      organization: '',
      email: '',
      firstName: '',
      lastName: '',
      location: '',
      linkedinUrl: '',
      investorType: '',
      investmentStage: '',
      revenueCriteria: '',
      sector: '',
      industries: [],
      description: ''
    });
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Only validate email format if provided
    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveInvestorToAPI = async (investorData) => {
    try {
      const token = localStorage.getItem('token');
      console.log('Token:', token ? 'Present' : 'Missing');
      
      const response = await fetch(`${API_BASE_URL}/investors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(investorData)
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Investor saved successfully:', result);
      return result;
    } catch (error) {
      console.error('Error saving investor:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted with data:', formData);
    
    if (validateForm()) {
      setIsSaving(true);
      try {
        // Get user ID from auth service
        const userId = authService.getUserId();
        console.log('User ID:', userId);
        
        if (!userId) {
          throw new Error('User not authenticated');
        }

        // Prepare data for API - only include fields with actual values
        const investorData = {
          userId: userId,
          organizationPersonName: formData.organization || '',
          email: formData.email || '',
          firstName: formData.firstName || '',
          lastName: formData.lastName || ''
        };

        // Add optional fields only if they have values
        if (formData.investorType && formData.investorType.trim()) {
          investorData.investorType = formData.investorType;
        }
        if (formData.sector && formData.sector.trim()) {
          investorData.sector = formData.sector;
        }
        if (formData.industries && formData.industries.length > 0) {
          investorData.industries = Array.isArray(formData.industries) 
            ? formData.industries.join(', ') 
            : formData.industries;
        }
        if (formData.investmentStage && formData.investmentStage.trim()) {
          investorData.investmentStage = formData.investmentStage;
        }
        if (formData.revenueCriteria && formData.revenueCriteria.trim()) {
          investorData.revenueCriteria = formData.revenueCriteria;
        }
        if (formData.description && formData.description.trim()) {
          investorData.description = formData.description;
        }
        if (formData.location && formData.location.trim()) {
          investorData.location = formData.location;
        }
        if (formData.linkedinUrl && formData.linkedinUrl.trim()) {
          investorData.linkedin = formData.linkedinUrl;
        }
        
        // Always include the combined name field
        const combinedName = `${formData.organization || ''} ${formData.firstName || ''} ${formData.lastName || ''}`.trim();
        if (combinedName) {
          investorData.organizationPersonNameFirstNameLastName = combinedName;
        }

        console.log('Sending data to API:', investorData);

        // Save to API
        const result = await saveInvestorToAPI(investorData);
        console.log('API response:', result);
        
        // Call parent callback
        onSave(investorData);
        resetForm();
        onClose();
        
        // Show success message
        alert('Investor saved successfully!');
      } catch (error) {
        console.error('Failed to save investor:', error);
        alert(`Failed to save investor: ${error.message}`);
      } finally {
        setIsSaving(false);
      }
    } else {
      console.log('Form validation failed:', errors);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2>Add New Investor</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        {isLoadingApi && (
          <div className="loading-indicator">
            <p>Loading data...</p>
          </div>
        )}
        
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="organization">Organization</label>
            <input
              type="text"
              id="organization"
              value={formData.organization}
              onChange={(e) => handleInputChange('organization', e.target.value)}
              className={errors.organization ? 'error' : ''}
            />
            {errors.organization && <span className="error-text">{errors.organization}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <input
                type="text"
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                className={errors.lastName ? 'error' : ''}
              />
              {errors.lastName && <span className="error-text">{errors.lastName}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <input
                type="text"
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                className={errors.firstName ? 'error' : ''}
              />
              {errors.firstName && <span className="error-text">{errors.firstName}</span>}
            </div>
            
          <div className="form-group">
            <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={errors.email ? 'error' : ''}
              />
              {errors.email && <span className="error-text">{errors.email}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="location">Location</label>
            <div className="location-input">
              <span className="location-icon">📍</span>
              <select
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                disabled={isLoadingApi}
              >
                <option value="">Select Location</option>
                {apiData.locations.map((location, index) => (
                  <option key={index} value={location}>{location}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="linkedinUrl">LinkedIn URL</label>
            <input
              type="url"
              id="linkedinUrl"
              value={formData.linkedinUrl}
              onChange={(e) => handleInputChange('linkedinUrl', e.target.value)}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="investorType">Investor Type</label>
              <select
                id="investorType"
                value={formData.investorType}
                onChange={(e) => handleInputChange('investorType', e.target.value)}
                disabled={isLoadingApi}
              >
                <option value="">Select Investor Type</option>
                {apiData.investorTypes.map((type, index) => (
                  <option key={index} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="investmentStage">Investment Stage</label>
              <select
                id="investmentStage"
                value={formData.investmentStage}
                onChange={(e) => handleInputChange('investmentStage', e.target.value)}
                disabled={isLoadingApi}
              >
                <option value="">Select Investment Stage</option>
                {apiData.investmentStages.map((stage, index) => (
                  <option key={index} value={stage}>{stage}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="revenueCriteria">Revenue Criteria</label>
              <select
                id="revenueCriteria"
                value={formData.revenueCriteria}
                onChange={(e) => handleInputChange('revenueCriteria', e.target.value)}
                disabled={isLoadingApi}
              >
                <option value="">Select Revenue Criteria</option>
                {apiData.revenueCriteria.map((criteria, index) => (
                  <option key={index} value={criteria}>{criteria}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="sector">Sector</label>
            <select
              id="sector"
              value={formData.sector}
              onChange={(e) => handleInputChange('sector', e.target.value)}
              disabled={isLoadingApi}
            >
              <option value="">Select Sector</option>
              {apiData.sectors.map((sector, index) => (
                <option key={index} value={sector}>{sector}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="industries">Industries</label>
            <div className="industries-container">
              <div className="industries-tags">
                {formData.industries.map((industry, index) => (
                  <span key={index} className="industry-tag">
                    {industry}
                    <button
                      type="button"
                      className="remove-tag"
                      onClick={() => handleIndustryRemove(industry)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                id="industries"
                placeholder="venture capital & private equity"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleIndustryAdd(e.target.value);
                    e.target.value = '';
                  }
                }}
              />
            </div>
            <p className="helper-text">Select an industry from the dropdown or choose "Add custom industry"</p>
          </div>


          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows="4"
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={handleClose}>
              Cancel
            </button>
            <button type="submit" className="add-btn" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Add Investor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddInvestor;
