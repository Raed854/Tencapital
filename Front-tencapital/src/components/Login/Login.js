import React, { useState, useEffect } from 'react';
import axios from 'axios';
import authService from '../../services/authService';
import { configureAxios } from '../../config/apiConfig';
import './Login.css';

const Login = ({ onLoginSuccess, onShowRegister, onShowForgotPassword }) => {
  const [activeTab, setActiveTab] = useState('login');
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  const [registerData, setRegisterData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    securityQuestion: '',
    securityAnswer: ''
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Configure axios on component mount
  useEffect(() => {
    configureAxios(axios);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (activeTab === 'login') {
      setLoginData(prev => ({
        ...prev,
        [name]: value
      }));
    } else {
      setRegisterData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Clear submit error when user starts typing
    if (errors.submit) {
      setErrors(prev => ({
        ...prev,
        submit: ''
      }));
    }
  };

  const validateLoginForm = () => {
    const newErrors = {};

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!loginData.email) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(loginData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!loginData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateRegisterForm = () => {
    const newErrors = {};

    // First name validation
    if (!registerData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    // Last name validation
    if (!registerData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!registerData.email) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(registerData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!registerData.password) {
      newErrors.password = 'Password is required';
    } else if (registerData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Confirm password validation
    if (!registerData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (registerData.password !== registerData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Security question validation
    if (!registerData.securityQuestion.trim()) {
      newErrors.securityQuestion = 'Security question is required';
    }

    // Security answer validation
    if (!registerData.securityAnswer.trim()) {
      newErrors.securityAnswer = 'Security answer is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setErrors({});
    
    if (!validateLoginForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post('users/login', loginData);
      
      if (response.data.success || response.status === 200) {
        // Utiliser le service d'authentification pour stocker les données
        if (response.data.token && response.data.user) {
          authService.setAuthData(
            response.data.token,
            response.data.user.id || response.data.user._id,
            response.data.user
          );
        } else if (response.data.token) {
          // Si pas d'ID utilisateur dans la réponse, essayer de l'extraire du token
          authService.setToken(response.data.token);
        }
        
     
        if (onLoginSuccess) {
          onLoginSuccess();
        }
      } else {
        setErrors({ submit: response.data.message || 'Login failed. Please try again.' });
      }
    } catch (error) {
      console.error('Login error:', error);
      if (error.response?.data?.message) {
        setErrors({ submit: error.response.data.message });
      } else if (error.response?.data?.error) {
        setErrors({ submit: error.response.data.error });
      } else if (error.response?.status === 401) {
        setErrors({ submit: 'Invalid email or password. Please try again.' });
      } else if (error.response?.status === 404) {
        setErrors({ submit: 'User not found. Please check your email.' });
      } else {
        setErrors({ submit: 'Network error. Please check your connection and try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setErrors({});
    
    if (!validateRegisterForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        firstName: registerData.firstName,
        lastName: registerData.lastName,
        email: registerData.email,
        password: registerData.password,
        confirmPassword: registerData.confirmPassword,
        securityQuestion: registerData.securityQuestion,
        securityAnswer: registerData.securityAnswer
      };
      
      console.log('Sending registration payload:', payload);
      
      const response = await axios.post('users/register', payload);
      
      if (response.data.success || response.status === 200 || response.status === 201) {
        // Registration successful, switch to login tab
        setActiveTab('login');
        setErrors({ submit: 'Registration successful! Please log in with your credentials.' });
        
        // Clear register form
        setRegisterData({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          confirmPassword: '',
          securityQuestion: '',
          securityAnswer: ''
        });
      } else {
        setErrors({ submit: response.data.message || 'Registration failed. Please try again.' });
      }
    } catch (error) {
      console.error('=== REGISTRATION ERROR ===');
      console.error('Full error object:', error);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
      console.error('Error response status:', error.response?.status);
      console.error('Validation details:', error.response?.data?.details);
      console.error('Received data:', error.response?.data?.receivedData);
      console.error('Full error response data (JSON):', JSON.stringify(error.response?.data, null, 2));
      console.error('========================');
      
      if (error.response?.data?.details && Array.isArray(error.response.data.details)) {
        // Handle validation errors array from backend
        const errorMessages = error.response.data.details.map(err => {
          if (typeof err === 'string') return err;
          if (err.message) return err.message;
          if (err.msg) return err.msg;
          return JSON.stringify(err);
        }).join(', ');
        console.log('Extracted error messages:', errorMessages);
        setErrors({ submit: errorMessages });
      } else if (error.response?.data?.message) {
        setErrors({ submit: error.response.data.message });
      } else if (error.response?.data?.error) {
        setErrors({ submit: error.response.data.error });
      } else if (error.response?.data?.errors) {
        // Handle validation errors array
        const errorMessages = Array.isArray(error.response.data.errors) 
          ? error.response.data.errors.join(', ')
          : JSON.stringify(error.response.data.errors);
        setErrors({ submit: errorMessages });
      } else if (error.response?.status === 400) {
        const errorDetail = error.response?.data?.details 
          ? (Array.isArray(error.response.data.details) 
              ? error.response.data.details.join(', ')
              : error.response.data.details)
          : 'Invalid data. Please check your inputs and try again.';
        setErrors({ submit: errorDetail });
      } else if (error.response?.status === 409) {
        setErrors({ submit: 'Email already exists. Please use a different email.' });
      } else {
        setErrors({ submit: error.message || 'Network error. Please check your connection and try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const clearLoginForm = () => {
    setLoginData({
      email: '',
      password: ''
    });
    setErrors({});
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="logo">
          <span className="logo-investor">Investor</span>
          <span className="logo-match">Match</span>
        </div>
        
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => setActiveTab('login')}
          >
            Login
          </button>
          <button 
            className={`tab ${activeTab === 'register' ? 'active' : ''}`}
            onClick={() => setActiveTab('register')}
          >
            Register
          </button>
        </div>
        
        <h1>Welcome to InvestorMatch</h1>
        <p className="subtitle">
          {activeTab === 'login' ? 'Log in to your account to continue' : 'Create your account to get started'}
        </p>
        
        {activeTab === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="login-form">
            {errors.submit && (
              <div className="error-message submit-error">
                {errors.submit}
              </div>
            )}
            
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={loginData.email}
                onChange={handleInputChange}
                className={errors.email ? 'error' : ''}
                placeholder="email@example.com"
              />
              {errors.email && <span className="error-text">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="password-input">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={loginData.password}
                  onChange={handleInputChange}
                  className={errors.password ? 'error' : ''}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {errors.password && <span className="error-text">{errors.password}</span>}
            </div>

            <div className="form-options">
              <button 
                type="button" 
                className="forgot-password"
                onClick={onShowForgotPassword}
              >
                Forgot Password?
              </button>
            </div>

            <button 
              type="submit" 
              className="login-btn"
              disabled={isLoading}
            >
              {isLoading ? 'Logging In...' : 'Login'}
            </button>

            <p className="register-link">
              Don't have an account? Click Register above.
            </p>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="login-form">
            {errors.submit && (
              <div className="error-message submit-error">
                {errors.submit}
              </div>
            )}
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">First Name</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={registerData.firstName}
                  onChange={handleInputChange}
                  className={errors.firstName ? 'error' : ''}
                  placeholder="Enter your first name"
                />
                {errors.firstName && <span className="error-text">{errors.firstName}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="lastName">Last Name</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={registerData.lastName}
                  onChange={handleInputChange}
                  className={errors.lastName ? 'error' : ''}
                  placeholder="Enter your last name"
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
                value={registerData.email}
                onChange={handleInputChange}
                className={errors.email ? 'error' : ''}
                placeholder="email@example.com"
              />
              {errors.email && <span className="error-text">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="password-input">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={registerData.password}
                  onChange={handleInputChange}
                  className={errors.password ? 'error' : ''}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {errors.password && <span className="error-text">{errors.password}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="password-input">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={registerData.confirmPassword}
                  onChange={handleInputChange}
                  className={errors.confirmPassword ? 'error' : ''}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="securityQuestion">Security Question</label>
              <input
                type="text"
                id="securityQuestion"
                name="securityQuestion"
                value={registerData.securityQuestion}
                onChange={handleInputChange}
                className={errors.securityQuestion ? 'error' : ''}
                placeholder="Enter your security question"
              />
              {errors.securityQuestion && <span className="error-text">{errors.securityQuestion}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="securityAnswer">Security Answer</label>
              <input
                type="text"
                id="securityAnswer"
                name="securityAnswer"
                value={registerData.securityAnswer}
                onChange={handleInputChange}
                className={errors.securityAnswer ? 'error' : ''}
                placeholder="Enter your answer"
              />
              {errors.securityAnswer && <span className="error-text">{errors.securityAnswer}</span>}
            </div>

            <button 
              type="submit" 
              className="login-btn"
              disabled={isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>

            <p className="register-link">
              Already have an account? Click Login above.
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
