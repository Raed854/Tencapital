import React, { useState, useEffect } from 'react';
import authService from '../../services/authService';
import { API_CONFIG } from '../../config/apiConfig';
import './Profile.css';

// Configure API base URL from centralized config
const API_BASE_URL = API_CONFIG.BASE_URL;

const Profile = () => {
  const [activeSection, setActiveSection] = useState('profile');
  const [userData, setUserData] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [passwordErrors, setPasswordErrors] = useState({});
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Security question change state
  const [securityQuestionData, setSecurityQuestionData] = useState({
    currentAnswer: '',
    newQuestion: '',
    newAnswer: '',
    confirmAnswer: ''
  });

  const [securityErrors, setSecurityErrors] = useState({});
  const [isChangingSecurity, setIsChangingSecurity] = useState(false);
  const [showSecurityForm, setShowSecurityForm] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState(null);

  // Fonction pour tester l'API et afficher les informations de debug
  const testUserAPI = async (userId) => {
    console.log('=== TESTING USER API ===');
    console.log('User ID:', userId);
    console.log('API URL:', `${API_BASE_URL}/users/${userId}`);
    
    // Vérifier le token avant de faire la requête
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found. Please log in again.');
    }
    
    console.log('Token found:', token.substring(0, 20) + '...');
    
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('Error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('API Response:', data);
      console.log('Data type:', typeof data);
      console.log('Data keys:', Object.keys(data));
      console.log('Is array:', Array.isArray(data));
      
      // Validation basique de la réponse
      if (!data) {
        throw new Error('Empty response from server');
      }
      
      // Log détaillé pour debug
      if (typeof data === 'object' && !Array.isArray(data)) {
        console.log('Response object analysis:', {
          hasUser: 'user' in data,
          hasUserData: 'userData' in data,
          hasData: 'data' in data,
          hasId: 'id' in data,
          hasFirstName: 'firstName' in data,
          hasEmail: 'email' in data,
          hasSuccess: 'success' in data,
          allKeys: Object.keys(data)
        });
      }
      
      return data;
    } catch (error) {
      console.error('API Test Error:', error);
      throw error;
    }
  };

  // Fonction pour récupérer les données du profil utilisateur
  const fetchUserProfile = async (userId) => {
    setIsLoadingProfile(true);
    setProfileError(null);

    try {
      console.log(`Fetching user profile for ID: ${userId}`);
      
      // Utiliser la fonction de test pour obtenir des informations de debug
      const data = await testUserAPI(userId);
      console.log('User profile fetched:', data);
      
      // Gérer différents formats de réponse avec plus de flexibilité
      let userData = null;
      
      console.log('Parsing response data:', {
        hasUser: !!data.user,
        hasUserData: !!data.userData,
        hasData: !!data.data,
        hasId: !!data.id,
        hasFirstName: !!data.firstName,
        hasSuccess: !!data.success,
        dataKeys: Object.keys(data),
        dataType: typeof data
      });
      
      // Vérifier si la réponse indique un succès
      if (data.success === false) {
        throw new Error('Server returned success: false');
      }
      
      // Essayer différents formats de réponse
      if (data.user && typeof data.user === 'object') {
        userData = data.user;
        console.log('Using data.user format');
      } else if (data.userData && typeof data.userData === 'object') {
        userData = data.userData;
        console.log('Using data.userData format');
      } else if (data.data && typeof data.data === 'object') {
        userData = data.data;
        console.log('Using data.data format');
      } else if (data.id || data.firstName || data.email) {
        // Si l'objet contient directement les propriétés utilisateur
        userData = data;
        console.log('Using direct data format');
      } else if (Array.isArray(data) && data.length > 0) {
        // Si c'est un tableau, prendre le premier élément
        userData = data[0];
        console.log('Using array format, taking first element');
      } else {
        // Log détaillé pour debug
        console.error('Unable to parse response format:', {
          data,
          dataType: typeof data,
          isArray: Array.isArray(data),
          keys: data ? Object.keys(data) : 'null/undefined'
        });
        throw new Error(`Invalid response format. Expected user object but got: ${typeof data}. Response keys: ${data ? Object.keys(data).join(', ') : 'null'}`);
      }
      
      console.log('Data structure:', {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        role: userData.role,
        isActive: userData.isActive,
        securityQuestion: userData.securityQuestion,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt
      });
      
      // Mettre à jour les données utilisateur
      setUserData(userData);
      console.log('UserData state updated:', userData);
      
      // Mettre à jour le formulaire avec les données récupérées
      setFormData({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || ''
      });
      console.log('FormData updated:', {
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || ''
      });
      
    } catch (error) {
      console.error('Error fetching user profile:', error);
      
      // Gestion d'erreur plus détaillée
      let errorMessage = 'Failed to load profile';
      
      if (error.message.includes('Invalid response format')) {
        errorMessage = 'Server returned unexpected data format. Please contact support.';
      } else if (error.message.includes('HTTP 401')) {
        errorMessage = 'Authentication failed. Please log in again.';
      } else if (error.message.includes('HTTP 404')) {
        errorMessage = 'User profile not found. Please contact support.';
      } else if (error.message.includes('HTTP 500')) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.message.includes('Network') || error.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection.';
      } else {
        errorMessage = `Failed to load profile: ${error.message}`;
      }
      
      setProfileError(errorMessage);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  // Fonction pour obtenir l'ID utilisateur actuel
  const getCurrentUserId = () => {
    // Récupérer l'ID depuis localStorage ou sessionStorage
    const storedUserId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
    
    if (!storedUserId) {
      console.error('No user ID found in storage');
      // Essayer de récupérer depuis le token JWT si disponible
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload.userId || payload.id) {
            console.log('User ID found in JWT token:', payload.userId || payload.id);
            return payload.userId || payload.id;
          }
        } catch (error) {
          console.error('Error parsing JWT token:', error);
        }
      }
      throw new Error('User not authenticated. Please log in.');
    }
    
    console.log('Current user ID:', storedUserId);
    return storedUserId;
  };

  // Comprehensive API function for updating all user fields
  const updateUserFields = async (updateData) => {
    const currentUserId = getCurrentUserId();
    const token = authService.getToken();
    
    if (!token) {
      throw new Error('No authentication token found. Please log in again.');
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    console.log('Updating user fields via public API:', {
      userId: currentUserId,
      data: updateData
    });

    const response = await fetch(`${API_BASE_URL}/users/public/${currentUserId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (parseError) {
        console.warn('Could not parse error response:', parseError);
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log('User fields updated successfully:', result);
    return result;
  };

  // Charger les données du profil au montage du composant
  useEffect(() => {
    console.log('Profile component mounted, fetching user data...');
    try {
      const currentUserId = getCurrentUserId();
      console.log('Fetching profile for user ID:', currentUserId);
      fetchUserProfile(currentUserId);
    } catch (error) {
      console.error('Error getting user ID:', error);
      setProfileError(error.message);
      setIsLoadingProfile(false);
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (passwordErrors[name]) {
      setPasswordErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSecurityQuestionInputChange = (e) => {
    const { name, value } = e.target;
    setSecurityQuestionData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (securityErrors[name]) {
      setSecurityErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordForm = () => {
    const newErrors = {};
    
    if (!passwordData.currentPassword.trim()) {
      newErrors.currentPassword = 'Current password is required';
    } else if (passwordData.currentPassword.length < 1) {
      newErrors.currentPassword = 'Current password cannot be empty';
    }
    
    if (!passwordData.newPassword.trim()) {
      newErrors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = 'New password must be at least 6 characters';
    } else if (passwordData.newPassword.length > 128) {
      newErrors.newPassword = 'New password must be less than 128 characters';
    } else if (!/^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/.test(passwordData.newPassword)) {
      newErrors.newPassword = 'New password contains invalid characters';
    }
    
    if (!passwordData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (passwordData.currentPassword === passwordData.newPassword) {
      newErrors.newPassword = 'New password must be different from current password';
    }
    
    // Additional validation for common password requirements
    if (passwordData.newPassword && passwordData.newPassword.length >= 6) {
      const hasUpperCase = /[A-Z]/.test(passwordData.newPassword);
      const hasLowerCase = /[a-z]/.test(passwordData.newPassword);
      const hasNumbers = /\d/.test(passwordData.newPassword);
      const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(passwordData.newPassword);
      
      if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
        newErrors.newPassword = 'New password must contain at least one uppercase letter, one lowercase letter, and one number';
      }
    }
    
    setPasswordErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateSecurityQuestionForm = () => {
    const newErrors = {};
    
    // Only require current answer if user has an existing security question
    if (userData?.securityQuestion && !securityQuestionData.currentAnswer.trim()) {
      newErrors.currentAnswer = 'Current answer is required';
    }
    
    if (!securityQuestionData.newQuestion.trim()) {
      newErrors.newQuestion = 'Security question is required';
    } else if (securityQuestionData.newQuestion.length < 10) {
      newErrors.newQuestion = 'Security question must be at least 10 characters';
    }
    
    if (!securityQuestionData.newAnswer.trim()) {
      newErrors.newAnswer = 'Answer is required';
    } else if (securityQuestionData.newAnswer.length < 3) {
      newErrors.newAnswer = 'Answer must be at least 3 characters';
    }
    
    if (!securityQuestionData.confirmAnswer.trim()) {
      newErrors.confirmAnswer = 'Please confirm your answer';
    } else if (securityQuestionData.newAnswer !== securityQuestionData.confirmAnswer) {
      newErrors.confirmAnswer = 'Answers do not match';
    }
    
    setSecurityErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({}); // Clear previous errors
    
    try {
      const currentUserId = getCurrentUserId();
      
      console.log('Updating user profile:', {
        userId: currentUserId,
        data: formData
      });
      
      // Get authentication token
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      const result = await updateUserFields({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email
      });
      
      console.log('User profile update response:', result);
      
      // Handle different response formats
      let updatedUser = null;
      if (result.user) {
        updatedUser = result.user;
      } else if (result.userData) {
        updatedUser = result.userData;
      } else if (result.data) {
        updatedUser = result.data;
      } else if (result.id || result.firstName) {
        updatedUser = result;
      } else {
        console.warn('Unexpected response format:', result);
        // Still proceed with success message
      }
      
      // Update local user data with the response
      if (updatedUser) {
        setUserData(prev => ({
          ...prev,
          ...updatedUser
        }));
        
        // Also update form data with the updated values
        setFormData({
          firstName: updatedUser.firstName || formData.firstName,
          lastName: updatedUser.lastName || formData.lastName,
          email: updatedUser.email || formData.email
        });
        
        console.log('User data updated successfully');
      }
      
      alert('Profile updated successfully!');
      
    } catch (error) {
      console.error('Error updating user profile:', error);
      
      // Handle specific error cases with more detailed messages
      if (error.message.includes('400') || error.message.includes('Validation error')) {
        setErrors({ submit: 'Invalid data provided. Please check your inputs and try again.' });
      } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        setErrors({ submit: 'Authentication failed. Please log in again.' });
      } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
        setErrors({ submit: 'Access denied. You do not have permission to update this profile.' });
      } else if (error.message.includes('404') || error.message.includes('Not Found')) {
        setErrors({ submit: 'User not found. Please contact support.' });
      } else if (error.message.includes('409') || error.message.includes('Conflict')) {
        setErrors({ submit: 'Email already exists. Please use a different email address.' });
      } else if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
        setErrors({ submit: 'Server error. Please try again later or contact support.' });
      } else if (error.message.includes('No authentication token')) {
        setErrors({ submit: 'You are not logged in. Please log in again.' });
      } else if (error.message.includes('Network') || error.message.includes('fetch')) {
        setErrors({ submit: 'Network error. Please check your connection and try again.' });
      } else {
        setErrors({ submit: `Failed to update profile: ${error.message}` });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) {
      return;
    }

    setIsChangingPassword(true);
    setPasswordErrors({}); // Clear previous errors
    
    try {
      const currentUserId = getCurrentUserId();
      
      console.log('Changing user password:', {
        userId: currentUserId
      });
      
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      const headers = { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      // Try different approaches for password change
      let response;
      let requestBody;
      let success = false;

      // Validate password data before sending
      if (!passwordData.currentPassword || !passwordData.newPassword) {
        throw new Error('Current password and new password are required');
      }

      if (passwordData.currentPassword === passwordData.newPassword) {
        throw new Error('New password must be different from current password');
      }

      // Additional validation
      if (passwordData.currentPassword.length < 1) {
        throw new Error('Current password cannot be empty');
      }

      if (passwordData.newPassword.length < 6) {
        throw new Error('New password must be at least 6 characters long');
      }

      if (passwordData.newPassword.length > 128) {
        throw new Error('New password must be less than 128 characters');
      }

      // Debug logging
      console.log('Password change attempt details:', {
        userId: currentUserId,
        currentPasswordLength: passwordData.currentPassword.length,
        newPasswordLength: passwordData.newPassword.length,
        newPasswordHasUpper: /[A-Z]/.test(passwordData.newPassword),
        newPasswordHasLower: /[a-z]/.test(passwordData.newPassword),
        newPasswordHasNumber: /\d/.test(passwordData.newPassword),
        newPasswordHasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(passwordData.newPassword)
      });

      // First, try to verify current password by attempting a login-like verification
      console.log('Step 1: Verifying current password...');
      
      try {
        const verifyResponse = await fetch(`${API_BASE_URL}/users/public/${currentUserId}/verify-password`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            password: passwordData.currentPassword
          })
        });
        
        if (!verifyResponse.ok) {
          console.log('Password verification endpoint not available, proceeding with change attempt...');
        } else {
          const verifyResult = await verifyResponse.json();
          if (!verifyResult.valid) {
            throw new Error('Current password is incorrect. Please verify your current password and try again.');
          }
          console.log('Current password verified successfully');
        }
      } catch (verifyError) {
        console.log('Password verification not supported, proceeding with change attempt...');
      }

      // Use the comprehensive API function for password change
      console.log('Step 2: Attempting password change with new API:', {
        hasLastPassword: !!passwordData.currentPassword,
        hasNewPassword: !!passwordData.newPassword,
        lastPasswordLength: passwordData.currentPassword.length,
        newPasswordLength: passwordData.newPassword.length
      });

      const result = await updateUserFields({
        lastPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });



      console.log('Password changed successfully:', result);
      
      // Reset form on success
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      alert('Password changed successfully!');
      
    } catch (error) {
      console.error('Error changing password:', error);
      
      // Handle specific error cases with more detailed messages
      if (error.message.includes('400') || error.message.includes('Validation error')) {
        setPasswordErrors({ submit: 'Invalid password data. Please check that your current password is correct and your new password meets the requirements.' });
      } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        setPasswordErrors({ submit: 'Current password is incorrect or you are not authorized. Please check your current password and try again.' });
      } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
        setPasswordErrors({ submit: 'Access denied. Please log in again.' });
      } else if (error.message.includes('404') || error.message.includes('Not Found')) {
        setPasswordErrors({ submit: 'Password change feature is not available. Please contact support to change your password.' });
      } else if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
        setPasswordErrors({ submit: 'Server error. Please try again later or contact support.' });
      } else if (error.message.includes('Route not found') || error.message.includes('Method not allowed')) {
        setPasswordErrors({ submit: 'Password change is not supported by the current server configuration. Please contact support.' });
      } else if (error.message.includes('No authentication token')) {
        setPasswordErrors({ submit: 'You are not logged in. Please log in again.' });
      } else if (error.message.includes('Network') || error.message.includes('fetch')) {
        setPasswordErrors({ submit: 'Network error. Please check your connection and try again.' });
      } else {
        setPasswordErrors({ submit: `Failed to change password: ${error.message}` });
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSecurityQuestionChange = async (e) => {
    e.preventDefault();
    
    if (!validateSecurityQuestionForm()) {
      return;
    }

    setIsChangingSecurity(true);
    setSecurityErrors({}); // Clear previous errors
    
    try {
      const currentUserId = getCurrentUserId();
      
      console.log('Changing security question:', {
        userId: currentUserId,
        hasCurrentQuestion: !!userData?.securityQuestion
      });
      
      // Prepare the request body based on whether user has existing security question
      const requestBody = {
        securityQuestion: securityQuestionData.newQuestion,
        securityAnswer: securityQuestionData.newAnswer
      };
      
      // Only include current answer if user has an existing security question
      if (userData?.securityQuestion) {
        requestBody.currentSecurityAnswer = securityQuestionData.currentAnswer;
      }
      
      // Get authentication token
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      const result = await updateUserFields(requestBody);
      console.log('Security question changed successfully:', result);
      
      // Handle different response formats for security question update
      let updatedUser = null;
      if (result.user) {
        updatedUser = result.user;
      } else if (result.userData) {
        updatedUser = result.userData;
      } else if (result.data) {
        updatedUser = result.data;
      } else if (result.id || result.firstName) {
        updatedUser = result;
      }
      
      // Update local user data with the new security question
      if (updatedUser) {
        setUserData(prev => ({
          ...prev,
          securityQuestion: updatedUser.securityQuestion
        }));
      }
      
      // Reset form on success
      setSecurityQuestionData({
        currentAnswer: '',
        newQuestion: '',
        newAnswer: '',
        confirmAnswer: ''
      });
      
      // Hide the form
      setShowSecurityForm(false);
      
      alert('Security question changed successfully!');
      
    } catch (error) {
      console.error('Error changing security question:', error);
      
      // Handle specific error cases
      if (error.message.includes('400')) {
        setSecurityErrors({ submit: 'Invalid security question data. Please check your inputs.' });
      } else if (error.message.includes('401')) {
        setSecurityErrors({ submit: 'Current answer is incorrect.' });
      } else if (error.message.includes('403')) {
        setSecurityErrors({ submit: 'Unauthorized. Please log in again.' });
      } else if (error.message.includes('404')) {
        setSecurityErrors({ submit: 'User not found. Please contact support.' });
      } else if (error.message.includes('500')) {
        setSecurityErrors({ submit: 'Server error. Please try again later.' });
      } else if (error.message.includes('Route not found')) {
        setSecurityErrors({ submit: 'Security question update is not supported by the server. Please contact support.' });
      } else {
        setSecurityErrors({ submit: `Failed to change security question: ${error.message}` });
      }
    } finally {
      setIsChangingSecurity(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-layout">
        {/* Left Side - User Profile Section */}
        <div className="profile-left">
          <div className="user-profile-card">
            {isLoadingProfile ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading profile...</p>
              </div>
            ) : profileError ? (
              <div className="error-container">
                <p className="error-message">{profileError}</p>
                <button
                  className="retry-btn"
                  onClick={() => {
                    try {
                      const currentUserId = getCurrentUserId();
                      fetchUserProfile(currentUserId);
                    } catch (error) {
                      console.error('Error getting user ID for retry:', error);
                      setProfileError(error.message);
                    }
                  }}
                >
                  Retry
                </button>
              </div>
            ) : userData ? (
              <>
            <div className="user-avatar">
                  <span className="avatar-text">
                    {userData.lastName ? userData.lastName.charAt(0).toUpperCase() : 'U'}
                  </span>
            </div>
            
            <div className="user-info">
                  <h2 className="user-name">
                    {userData.firstName || 'N/A'} {userData.lastName || 'N/A'}
                  </h2>
                  <p className="user-role">
                    <span className="role-badge">{userData.role || 'N/A'}</span>
                    {userData.isActive && <span className="status-badge active">Active</span>}
                    {!userData.isActive && <span className="status-badge inactive">Inactive</span>}
                  </p>
                  <p className="user-email">
                    <strong>Email:</strong> {userData.email || 'N/A'}
                  </p>
                  
               
                  <p className="user-created">
                    <strong>Member since:</strong> {userData.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                  <p className="user-updated">
                    <strong>Last Updated:</strong> {userData.updatedAt ? new Date(userData.updatedAt).toLocaleDateString() : 'N/A'}
                  </p>
                  {userData.lastLogin && (
                    <p className="user-last-login">
                      <strong>Last Login:</strong> {new Date(userData.lastLogin).toLocaleDateString()}
                    </p>
                  )}
                  
                  
                </div>
              </>
            ) : (
              <div className="no-data">
                <p>No user data available</p>
            </div>
            )}
          </div>
        </div>

        {/* Right Side - Profile Information & Settings */}
        <div className="profile-right">
          {/* Account Settings Navigation */}
          <div className="account-settings">
            <div className="settings-header">
            <h3 className="settings-title">Account Settings</h3>
             
            </div>
            <div className="settings-nav">
              <button 
                className={`settings-nav-item ${activeSection === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveSection('profile')}
              >
                Profile Information
              </button>
              <button 
                className={`settings-nav-item ${activeSection === 'password' ? 'active' : ''}`}
                onClick={() => setActiveSection('password')}
              >
                Change Password
              </button>
              <button 
                className={`settings-nav-item ${activeSection === 'security' ? 'active' : ''}`}
                onClick={() => setActiveSection('security')}
              >
                Security Question
              </button>
            </div>
          </div>

          {/* Profile Information Form */}
          {activeSection === 'profile' && (
            <div className="profile-information">
              <h3 className="section-title">Profile Information</h3>
              
              {errors.submit && (
                <div className="error-message submit-error">
                  {errors.submit}
                </div>
              )}
              
              <form onSubmit={handleSaveChanges} className="profile-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="firstName">First Name</label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className={errors.firstName ? 'error' : ''}
                    />
                    {errors.firstName && <span className="error-text">{errors.firstName}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="lastName">Last Name</label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className={errors.lastName ? 'error' : ''}
                    />
                    {errors.lastName && <span className="error-text">{errors.lastName}</span>}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={errors.email ? 'error' : ''}
                  />
                  {errors.email && <span className="error-text">{errors.email}</span>}
                </div>


                <button 
                  type="submit" 
                  className="save-changes-btn"
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>
          )}

          {/* Change Password Section */}
          {activeSection === 'password' && (
            <div className="change-password">
              <h3 className="section-title">Change Password</h3>
              <p className="section-description">Update your password to keep your account secure.</p>
              
              {passwordErrors.submit && (
                <div className="error-message submit-error">
                  {passwordErrors.submit}
                </div>
              )}
              
              <form onSubmit={handlePasswordChange} className="profile-form">
                <div className="form-group">
                  <label htmlFor="currentPassword">Current Password</label>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordInputChange}
                    className={passwordErrors.currentPassword ? 'error' : ''}
                    placeholder="Enter your current password"
                  />
                  {passwordErrors.currentPassword && <span className="error-text">{passwordErrors.currentPassword}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="newPassword">New Password</label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordInputChange}
                    className={passwordErrors.newPassword ? 'error' : ''}
                    placeholder="Enter your new password"
                  />
                  {passwordErrors.newPassword && <span className="error-text">{passwordErrors.newPassword}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm New Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordInputChange}
                    className={passwordErrors.confirmPassword ? 'error' : ''}
                    placeholder="Confirm your new password"
                  />
                  {passwordErrors.confirmPassword && <span className="error-text">{passwordErrors.confirmPassword}</span>}
              </div>

                <button 
                  type="submit" 
                  className="save-changes-btn"
                  disabled={isChangingPassword}
                >
                  {isChangingPassword ? 'Changing Password...' : 'Change Password'}
                </button>
              </form>
            </div>
          )}

          {/* Security Question Section */}
          {activeSection === 'security' && (
            <div className="security-question">
              <h3 className="section-title">Security Question</h3>
              <p className="section-description">Manage your security question for account recovery.</p>
              
              {userData && userData.securityQuestion ? (
                <div className="current-security-question">
                  <div className="security-question-card">
                    <div className="security-header">
                      <h4>🔒 Current Security Question</h4>
                      <span className="security-status active">Active</span>
                    </div>
                    
                    <div className="security-question-display">
                      <div className="question-container">
                        <div className="question-icon">❓</div>
                        <div className="question-content">
                          <p className="security-question-text">"{userData.securityQuestion}"</p>
                          <div className="question-meta">
                            <span className="question-label">Security Question</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="security-info">
                      <div className="info-grid">
                        <div className="info-item">
                          <div className="info-icon">📋</div>
                          <div className="info-content">
                            <span className="info-label">Purpose</span>
                            <span className="info-text">Used for account recovery if you forget your password</span>
                          </div>
                        </div>
                        <div className="info-item">
                          <div className="info-icon">📅</div>
                          <div className="info-content">
                            <span className="info-label">Last Updated</span>
                            <span className="info-text">{userData.updatedAt ? new Date(userData.updatedAt).toLocaleDateString() : 'Unknown'}</span>
                          </div>
                        </div>
                        <div className="info-item">
                          <div className="info-icon">🛡️</div>
                          <div className="info-content">
                            <span className="info-label">Status</span>
                            <span className="info-text status-active">Active and Ready</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="security-actions">
                    <button 
                      className="change-security-btn primary"
                      onClick={() => setShowSecurityForm(!showSecurityForm)}
                    >
                      {showSecurityForm ? 'Cancel Changes' : '✏️ Change Security Question'}
                    </button>
                    <button 
                      className="test-security-btn secondary"
                      onClick={() => {
                        const testAnswer = prompt(`Please answer your security question:\n\n"${userData.securityQuestion}"`);
                        if (testAnswer !== null) {
                          alert(testAnswer ? 'Answer provided (this is just a test - no validation performed)' : 'No answer provided');
                        }
                      }}
                    >
                      🧪 Test Security Question
                    </button>
                  </div>

                  {/* Security Question Change Form */}
                  {showSecurityForm && (
                    <div className="security-question-form">
                      <div className="form-header">
                        <h4>✏️ Change Security Question</h4>
                        <p className="form-description">Update your security question and answer for better account protection.</p>
                      </div>
                      
                      <div className="form-info">
                        <div className="info-box">
                          <div className="info-icon">💡</div>
                          <div className="info-content">
                            <h5>Tips for a good security question:</h5>
                            <ul>
                              <li>Choose something only you would know</li>
                              <li>Make it easy to remember but hard to guess</li>
                              <li>Avoid questions with answers that can be found online</li>
                              <li>Keep your answer consistent and memorable</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                      
                      {securityErrors.submit && (
                        <div className="error-message submit-error">
                          <div className="error-icon">⚠️</div>
                          <div className="error-content">
                            <strong>Error:</strong> {securityErrors.submit}
                          </div>
                        </div>
                      )}
                      
                      <form onSubmit={handleSecurityQuestionChange} className="profile-form">
                        <div className="form-section">
                          <h5 className="section-title">Current Security Question</h5>
                          <div className="current-question-display">
                            <p className="current-question">"{userData?.securityQuestion}"</p>
                          </div>
                          
                          {userData?.securityQuestion && (
                            <div className="form-group">
                              <label htmlFor="currentAnswer">
                                Current Answer <span className="required">*</span>
                              </label>
                              <input
                                type="text"
                                id="currentAnswer"
                                name="currentAnswer"
                                value={securityQuestionData.currentAnswer}
                                onChange={handleSecurityQuestionInputChange}
                                className={securityErrors.currentAnswer ? 'error' : ''}
                                placeholder="Enter your current security question answer"
                                required
                              />
                              {securityErrors.currentAnswer && <span className="error-text">{securityErrors.currentAnswer}</span>}
                              <div className="field-help">
                                You must provide the correct answer to your current security question to make changes.
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="form-section">
                          <h5 className="section-title">New Security Question</h5>
                          
                          <div className="form-group">
                            <label htmlFor="newQuestion">
                              New Security Question <span className="required">*</span>
                            </label>
                            <textarea
                              id="newQuestion"
                              name="newQuestion"
                              value={securityQuestionData.newQuestion}
                              onChange={handleSecurityQuestionInputChange}
                              className={securityErrors.newQuestion ? 'error' : ''}
                              placeholder="Enter your new security question (e.g., What was the name of your first pet?)"
                              rows="3"
                              required
                            />
                            {securityErrors.newQuestion && <span className="error-text">{securityErrors.newQuestion}</span>}
                            <div className="field-help">
                              Choose a question that is personal to you and easy to remember.
                            </div>
                          </div>

                          <div className="form-group">
                            <label htmlFor="newAnswer">
                              New Answer <span className="required">*</span>
                            </label>
                            <input
                              type="text"
                              id="newAnswer"
                              name="newAnswer"
                              value={securityQuestionData.newAnswer}
                              onChange={handleSecurityQuestionInputChange}
                              className={securityErrors.newAnswer ? 'error' : ''}
                              placeholder="Enter your new answer"
                              required
                            />
                            {securityErrors.newAnswer && <span className="error-text">{securityErrors.newAnswer}</span>}
                            <div className="field-help">
                              Make sure your answer is something you'll remember and is consistent.
                            </div>
                          </div>

                          <div className="form-group">
                            <label htmlFor="confirmAnswer">
                              Confirm New Answer <span className="required">*</span>
                            </label>
                            <input
                              type="text"
                              id="confirmAnswer"
                              name="confirmAnswer"
                              value={securityQuestionData.confirmAnswer}
                              onChange={handleSecurityQuestionInputChange}
                              className={securityErrors.confirmAnswer ? 'error' : ''}
                              placeholder="Confirm your new answer"
                              required
                            />
                            {securityErrors.confirmAnswer && <span className="error-text">{securityErrors.confirmAnswer}</span>}
                            <div className="field-help">
                              Re-enter your answer to ensure it's correct.
                            </div>
                          </div>
                        </div>

                        <div className="form-actions">
                          <button 
                            type="submit" 
                            className="save-changes-btn primary"
                            disabled={isChangingSecurity}
                          >
                            {isChangingSecurity ? '🔄 Updating Security Question...' : '✅ Update Security Question'}
                          </button>
                          <button 
                            type="button" 
                            className="cancel-btn secondary"
                            onClick={() => {
                              setShowSecurityForm(false);
                              setSecurityQuestionData({
                                currentAnswer: '',
                                newQuestion: '',
                                newAnswer: '',
                                confirmAnswer: ''
                              });
                              setSecurityErrors({});
                            }}
                          >
                            ❌ Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              ) : (
                <div className="no-security-question">
                  <div className="no-security-card">
                    <div className="security-header">
                      <div className="no-security-icon">⚠️</div>
                      <div className="header-content">
                        <h4>No Security Question Set</h4>
                        <span className="security-status inactive">Not Configured</span>
                      </div>
                    </div>
                    
                    <div className="security-warning">
                      <div className="warning-content">
                        <div className="warning-icon">🚨</div>
                        <div className="warning-text">
                          <h5>Security Risk Detected</h5>
                          <p>Without a security question, account recovery will be more difficult if you forget your password.</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="security-benefits">
                      <h5>Benefits of setting a security question:</h5>
                      <ul>
                        <li>🔐 Secure account recovery</li>
                        <li>🛡️ Additional account protection</li>
                        <li>⚡ Quick password reset process</li>
                        <li>🔒 Enhanced account security</li>
                      </ul>
                    </div>
                    
                    <div className="security-actions">
                      <button 
                        className="set-security-btn primary"
                        onClick={() => setShowSecurityForm(!showSecurityForm)}
                      >
                        {showSecurityForm ? 'Cancel Setup' : '🔒 Set Up Security Question'}
                      </button>
                    </div>
                  </div>

                  {/* Set Security Question Form */}
                  {showSecurityForm && (
                    <div className="security-question-form">
                      <h4>Set Security Question</h4>
                      <p className="form-description">Set up a security question for account recovery.</p>
                      <div className="info-message">
                        <p><strong>Note:</strong> This feature may not be supported by the current server configuration. If you encounter errors, please contact support.</p>
                      </div>
                      
                      {securityErrors.submit && (
                        <div className="error-message submit-error">
                          {securityErrors.submit}
                        </div>
                      )}
                      
                      <form onSubmit={handleSecurityQuestionChange} className="profile-form">
                        <div className="form-group">
                          <label htmlFor="newQuestion">Security Question</label>
                          <input
                            type="text"
                            id="newQuestion"
                            name="newQuestion"
                            value={securityQuestionData.newQuestion}
                            onChange={handleSecurityQuestionInputChange}
                            className={securityErrors.newQuestion ? 'error' : ''}
                            placeholder="Enter your security question"
                          />
                          {securityErrors.newQuestion && <span className="error-text">{securityErrors.newQuestion}</span>}
                        </div>

                        <div className="form-group">
                          <label htmlFor="newAnswer">Answer</label>
                          <input
                            type="text"
                            id="newAnswer"
                            name="newAnswer"
                            value={securityQuestionData.newAnswer}
                            onChange={handleSecurityQuestionInputChange}
                            className={securityErrors.newAnswer ? 'error' : ''}
                            placeholder="Enter your answer"
                          />
                          {securityErrors.newAnswer && <span className="error-text">{securityErrors.newAnswer}</span>}
                        </div>

                        <div className="form-group">
                          <label htmlFor="confirmAnswer">Confirm Answer</label>
                          <input
                            type="text"
                            id="confirmAnswer"
                            name="confirmAnswer"
                            value={securityQuestionData.confirmAnswer}
                            onChange={handleSecurityQuestionInputChange}
                            className={securityErrors.confirmAnswer ? 'error' : ''}
                            placeholder="Confirm your answer"
                          />
                          {securityErrors.confirmAnswer && <span className="error-text">{securityErrors.confirmAnswer}</span>}
                        </div>

                        <div className="form-actions">
                          <button 
                            type="submit" 
                            className="save-changes-btn"
                            disabled={isChangingSecurity}
                          >
                            {isChangingSecurity ? 'Setting Security Question...' : 'Set Security Question'}
                          </button>
                          <button 
                            type="button" 
                            className="cancel-btn"
                            onClick={() => {
                              setShowSecurityForm(false);
                              setSecurityQuestionData({
                                currentAnswer: '',
                                newQuestion: '',
                                newAnswer: '',
                                confirmAnswer: ''
                              });
                              setSecurityErrors({});
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
              </div>
              )}
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
};

export default Profile;
