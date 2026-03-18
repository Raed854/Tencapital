import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_CONFIG, configureAxios } from '../../config/apiConfig';
import './ForgotPassword.css';
import { useAlertInit } from '../../hooks/useAlertInit';

const ForgotPassword = ({ onClose, onShowLogin }) => {
  // Initialize modern alert system
  const { showSuccess, showError, showWarning, showInfo } = useAlertInit();
  
  const [forgotPasswordStep, setForgotPasswordStep] = useState(1); // 1: email, 2: security question, 3: new password
  const [forgotPasswordData, setForgotPasswordData] = useState({
    email: '',
    securityAnswer: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [userSecurityQuestion, setUserSecurityQuestion] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Configure axios on component mount
  useEffect(() => {
    configureAxios(axios);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForgotPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateEmailStep = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!forgotPasswordData.email) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(forgotPasswordData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateSecurityAnswerStep = () => {
    const newErrors = {};
    
    if (!forgotPasswordData.securityAnswer.trim()) {
      newErrors.securityAnswer = 'Security answer is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateNewPasswordStep = () => {
    const newErrors = {};
    
    if (!forgotPasswordData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (forgotPasswordData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters long';
    }
    
    if (!forgotPasswordData.confirmNewPassword) {
      newErrors.confirmNewPassword = 'Please confirm your new password';
    } else if (forgotPasswordData.newPassword !== forgotPasswordData.confirmNewPassword) {
      newErrors.confirmNewPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEmailSubmit = async () => {
    if (!validateEmailStep()) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post('users/forgot-password/verify-email', {
        email: forgotPasswordData.email
      });
      
      if (response.data.success) {
        setUserSecurityQuestion(response.data.securityQuestion || response.data.data?.securityQuestion);
        setForgotPasswordStep(2);
        setErrors({});
      } else {
        setErrors({ submit: response.data.message || 'Email not found' });
      }
    } catch (error) {
      console.error('Email verification error:', error);
      console.error('Error response:', error.response?.data);
      
      if (error.response?.data?.message) {
        setErrors({ submit: error.response.data.message });
      } else if (error.response?.status === 404) {
        setErrors({ submit: 'Email not found. Please check your email address.' });
      } else {
        setErrors({ submit: 'Email not found. Please check your email address.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSecurityAnswerSubmit = async () => {
    if (!validateSecurityAnswerStep()) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post('users/forgot-password/verify-answer', {
        email: forgotPasswordData.email,
        securityAnswer: forgotPasswordData.securityAnswer
      });
      
      if (response.data.success) {
        setForgotPasswordStep(3);
        setErrors({});
      } else {
        setErrors({ submit: 'Incorrect security answer. Please try again.' });
      }
    } catch (error) {
      console.error('Security answer verification error:', error);
      console.error('Error response:', error.response?.data);
      
      if (error.response?.data?.message) {
        setErrors({ submit: error.response.data.message });
      } else {
        setErrors({ submit: 'Incorrect security answer. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewPasswordSubmit = async () => {
    if (!validateNewPasswordStep()) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post('users/forgot-password/reset', {
        email: forgotPasswordData.email,
        newPassword: forgotPasswordData.newPassword,
        confirmPassword: forgotPasswordData.confirmNewPassword,
        securityAnswer: forgotPasswordData.securityAnswer
      });
      
      if (response.data.success) {
        showSuccess('Password reset successfully! You can now log in with your new password.');
        onClose();
        if (onShowLogin) {
          onShowLogin();
        }
      } else {
        setErrors({ submit: response.data.message || 'Failed to reset password' });
      }
    } catch (error) {
      console.error('Password reset error:', error);
      console.error('Error response:', error.response?.data);
      
      if (error.response?.data?.message) {
        let errorMessage = error.response.data.message;
        
        // If there are validation details, show them
        if (error.response.data.details && Array.isArray(error.response.data.details)) {
          const details = error.response.data.details.map(detail => 
            typeof detail === 'string' ? detail : detail.message || detail.error || JSON.stringify(detail)
          ).join(', ');
          errorMessage += `: ${details}`;
        }
        
        setErrors({ submit: errorMessage });
      } else if (error.response?.data?.error) {
        setErrors({ submit: error.response.data.error });
      } else {
        setErrors({ submit: `Failed to reset password. ${error.response?.status ? `Status: ${error.response.status}` : 'Please try again.'}` });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (forgotPasswordStep > 1) {
      setForgotPasswordStep(forgotPasswordStep - 1);
      setErrors({});
    }
  };

  const handleClose = () => {
    setForgotPasswordStep(1);
    setForgotPasswordData({
      email: '',
      securityAnswer: '',
      newPassword: '',
      confirmNewPassword: ''
    });
    setUserSecurityQuestion('');
    setErrors({});
    onClose();
  };

  return (
    <div className="forgot-password-overlay">
      <div className="forgot-password-modal">
        <div className="modal-header">
          <h2>Reset Password</h2>
          <button className="close-btn" onClick={handleClose}>×</button>
        </div>
        
       
          {forgotPasswordStep === 1 && (
            <div className="forgot-password-step">
              <h3>Step 1: Enter your email</h3>
              <p>Enter the email address associated with your account.</p>
              
              {errors.submit && (
                <div className="error-message submit-error">
                  {errors.submit}
                </div>
              )}
              
              <div className="form-group">
                <label htmlFor="forgotEmail">Email</label>
                <input
                  type="email"
                  id="forgotEmail"
                  name="email"
                  value={forgotPasswordData.email}
                  onChange={handleInputChange}
                  className={errors.email ? 'error' : ''}
                  placeholder="email@example.com"
                />
                {errors.email && <span className="error-text">{errors.email}</span>}
              </div>
              
              <div className="modal-buttons">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={handleClose}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="submit-btn"
                  onClick={handleEmailSubmit}
                  disabled={isLoading}
                >
                  {isLoading ? 'Verifying...' : 'Continue'}
                </button>
              </div>
            </div>
          )}

          {forgotPasswordStep === 2 && (
            <div className="forgot-password-step">
              <h3>Step 2: Answer Security Question</h3>
              <p>Please answer your security question to continue.</p>
              
              {errors.submit && (
                <div className="error-message submit-error">
                  {errors.submit}
                </div>
              )}
              
              <div className="form-group">
                <label>Security Question</label>
                <div className="security-question-display">
                  {userSecurityQuestion}
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="securityAnswer">Your Answer</label>
                <input
                  type="text"
                  id="securityAnswer"
                  name="securityAnswer"
                  value={forgotPasswordData.securityAnswer}
                  onChange={handleInputChange}
                  className={errors.securityAnswer ? 'error' : ''}
                  placeholder="Enter your answer"
                />
                {errors.securityAnswer && <span className="error-text">{errors.securityAnswer}</span>}
              </div>
              
              <div className="modal-buttons">
                <button 
                  type="button" 
                  className="back-btn"
                  onClick={handleBack}
                >
                  Back
                </button>
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={handleClose}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="submit-btn"
                  onClick={handleSecurityAnswerSubmit}
                  disabled={isLoading}
                >
                  {isLoading ? 'Verifying...' : 'Continue'}
                </button>
              </div>
            </div>
          )}

          {forgotPasswordStep === 3 && (
            <div className="forgot-password-step">
              <h3>Step 3: Create New Password</h3>
              <p>Enter your new password below.</p>
              
              {errors.submit && (
                <div className="error-message submit-error">
                  {errors.submit}
                </div>
              )}
              
              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={forgotPasswordData.newPassword}
                  onChange={handleInputChange}
                  className={errors.newPassword ? 'error' : ''}
                  placeholder="Enter new password"
                />
                {errors.newPassword && <span className="error-text">{errors.newPassword}</span>}
              </div>
              
              <div className="form-group">
                <label htmlFor="confirmNewPassword">Confirm New Password</label>
                <input
                  type="password"
                  id="confirmNewPassword"
                  name="confirmNewPassword"
                  value={forgotPasswordData.confirmNewPassword}
                  onChange={handleInputChange}
                  className={errors.confirmNewPassword ? 'error' : ''}
                  placeholder="Confirm new password"
                />
                {errors.confirmNewPassword && <span className="error-text">{errors.confirmNewPassword}</span>}
              </div>
              
              <div className="modal-buttons">
                <button 
                  type="button" 
                  className="back-btn"
                  onClick={handleBack}
                >
                  Back
                </button>
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={handleClose}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="submit-btn"
                  onClick={handleNewPasswordSubmit}
                  disabled={isLoading}
                >
                  {isLoading ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </div>
          )}
        
      </div>
    </div>
  );
};

export default ForgotPassword;
