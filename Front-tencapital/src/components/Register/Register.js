import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { API_CONFIG, configureAxios } from '../../config/apiConfig';
import './Register.css';

const Register = ({ onLoginSuccess, onShowLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
    securityQuestion: '',
    securityAnswer: ''
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldTouched, setFieldTouched] = useState({});
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: [] });
  const [emailAvailable, setEmailAvailable] = useState(null);
  const [checkingEmail, setCheckingEmail] = useState(false);

  // Security question suggestions
  const securityQuestions = [
    "What city were you born in?",
    "What was the name of your first pet?",
    "What was your mother's maiden name?",
    "What was the name of your elementary school?",
    "What was your childhood nickname?",
    "What street did you grow up on?",
    "What was your favorite food as a child?",
    "What was the make of your first car?"
  ];

  // Configure axios on component mount
  useEffect(() => {
    configureAxios(axios);
  }, []);

  // Calculate password strength
  const calculatePasswordStrength = useCallback((password) => {
    if (!password) {
      return { score: 0, feedback: [] };
    }

    const feedback = [];
    let score = 0;

    // Length check
    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push('At least 8 characters');
    }

    // Lowercase check
    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('One lowercase letter');
    }

    // Uppercase check
    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('One uppercase letter');
    }

    // Number check
    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedback.push('One number');
    }

    // Special character check
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      score += 1;
    } else {
      feedback.push('One special character');
    }

    // Length bonus
    if (password.length >= 12) {
      score += 1;
    }

    return { score: Math.min(score, 5), feedback };
  }, []);

  // Check email availability (debounced)
  useEffect(() => {
    const checkEmail = async () => {
      if (!formData.email || !fieldTouched.email) return;
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setEmailAvailable(null);
        return;
      }

      setCheckingEmail(true);
      try {
        // You can add an API endpoint to check email availability
        // For now, we'll skip this to avoid too many requests
        setEmailAvailable(null);
      } catch (error) {
        setEmailAvailable(null);
      } finally {
        setCheckingEmail(false);
      }
    };

    const timer = setTimeout(checkEmail, 500);
    return () => clearTimeout(timer);
  }, [formData.email, fieldTouched.email]);

  // Update password strength when password changes
  useEffect(() => {
    if (formData.password) {
      setPasswordStrength(calculatePasswordStrength(formData.password));
    } else {
      setPasswordStrength({ score: 0, feedback: [] });
    }
  }, [formData.password, calculatePasswordStrength]);

  // Real-time validation with debounce
  const validateField = useCallback((name, value) => {
    const newErrors = { ...errors };
    
    switch (name) {
      case 'email':
        if (!value) {
          newErrors.email = '';
        } else {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            newErrors.email = 'Please enter a valid email address';
          } else {
            delete newErrors.email;
          }
        }
        break;
      
      case 'firstName':
        if (!value.trim()) {
          newErrors.firstName = '';
        } else if (value.trim().length < 2) {
          newErrors.firstName = 'First name must be at least 2 characters';
        } else {
          delete newErrors.firstName;
        }
        break;
      
      case 'lastName':
        if (!value.trim()) {
          newErrors.lastName = '';
        } else if (value.trim().length < 2) {
          newErrors.lastName = 'Last name must be at least 2 characters';
        } else {
          delete newErrors.lastName;
        }
        break;
      
      case 'password':
        if (!value) {
          newErrors.password = '';
        } else {
          const strength = calculatePasswordStrength(value);
          if (strength.score < 3) {
            newErrors.password = `Password is too weak. Missing: ${strength.feedback.join(', ')}`;
          } else {
            delete newErrors.password;
          }
        }
        break;
      
      case 'confirmPassword':
        if (!value) {
          newErrors.confirmPassword = '';
        } else if (value !== formData.password) {
          newErrors.confirmPassword = 'Passwords do not match';
        } else {
          delete newErrors.confirmPassword;
        }
        break;
      
      case 'securityQuestion':
        if (!value.trim()) {
          newErrors.securityQuestion = '';
        } else {
          delete newErrors.securityQuestion;
        }
        break;
      
      case 'securityAnswer':
        if (!value.trim()) {
          newErrors.securityAnswer = '';
        } else {
          delete newErrors.securityAnswer;
        }
        break;
    }
    
    setErrors(newErrors);
  }, [errors, formData.password, calculatePasswordStrength]);

  // Debounced validation
  useEffect(() => {
    const timers = {};
    
    Object.keys(formData).forEach(field => {
      if (fieldTouched[field]) {
        clearTimeout(timers[field]);
        timers[field] = setTimeout(() => {
          validateField(field, formData[field]);
        }, 300);
      }
    });

    return () => {
      Object.values(timers).forEach(timer => clearTimeout(timer));
    };
  }, [formData, fieldTouched, validateField]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Mark field as touched
    setFieldTouched(prev => ({
      ...prev,
      [name]: true
    }));
    
    // Clear submit error when user starts typing
    if (errors.submit) {
      setErrors(prev => ({
        ...prev,
        submit: ''
      }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setFieldTouched(prev => ({
      ...prev,
      [name]: true
    }));
    validateField(name, value);
  };


  // Calculate form completion percentage
  const formCompletion = useMemo(() => {
    const fields = ['email', 'firstName', 'lastName', 'password', 'confirmPassword', 'securityQuestion', 'securityAnswer'];
    const filledFields = fields.filter(field => formData[field] && formData[field].trim()).length;
    return Math.round((filledFields / fields.length) * 100);
  }, [formData]);

  // Check if form is valid
  const isFormValid = useMemo(() => {
    return formData.email &&
           formData.firstName.trim() &&
           formData.lastName.trim() &&
           formData.password &&
           formData.confirmPassword &&
           formData.securityQuestion.trim() &&
           formData.securityAnswer.trim() &&
           passwordStrength.score >= 3 &&
           formData.password === formData.confirmPassword &&
           !errors.email &&
           !errors.firstName &&
           !errors.lastName &&
           !errors.password &&
           !errors.confirmPassword &&
           !errors.securityQuestion &&
           !errors.securityAnswer;
  }, [formData, passwordStrength, errors]);

  const validateForm = () => {
    const newErrors = {};

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Name validations
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
    }

    // Password validations
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (passwordStrength.score < 3) {
      newErrors.password = `Password is too weak. Missing: ${passwordStrength.feedback.join(', ')}`;
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Security question and answer
    if (!formData.securityQuestion.trim()) {
      newErrors.securityQuestion = 'Security question is required';
    }
    if (!formData.securityAnswer.trim()) {
      newErrors.securityAnswer = 'Security answer is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Prepare payload - exclude confirmPassword from being sent, only send required fields
      const payload = {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        securityQuestion: formData.securityQuestion,
        securityAnswer: formData.securityAnswer
      };
      
      const response = await axios.post('users/register', payload);
      
      if (response.data.success) {
        alert('Account created successfully! You can now log in.');
        setFormData({
          email: '',
          firstName: '',
          lastName: '',
          password: '',
          confirmPassword: '',
          securityQuestion: '',
          securityAnswer: ''
        });
        setErrors({}); // Clear all errors on success
        if (onShowLogin) {
          onShowLogin();
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      console.error('Error response data:', error.response?.data);
      
      const newErrors = {};
      
      // Map backend field names to frontend field names
      const fieldMapping = {
        'email': 'email',
        'firstName': 'firstName',
        'first_name': 'firstName',
        'firstname': 'firstName',
        'lastName': 'lastName',
        'last_name': 'lastName',
        'lastname': 'lastName',
        'password': 'password',
        'confirmPassword': 'confirmPassword',
        'confirm_password': 'confirmPassword',
        'passwordconfirmation': 'confirmPassword',
        'password_confirmation': 'confirmPassword',
        'securityQuestion': 'securityQuestion',
        'security_question': 'securityQuestion',
        'securityquestion': 'securityQuestion',
        'securityAnswer': 'securityAnswer',
        'security_answer': 'securityAnswer',
        'securityanswer': 'securityAnswer'
      };
      
      // Helper function to find field name from error
      const findFieldName = (err) => {
        // If error has a path property (like Joi validation)
        if (typeof err === 'object' && err.path) {
          const path = err.path.toLowerCase();
          for (const [backendField, frontendField] of Object.entries(fieldMapping)) {
            if (path === backendField.toLowerCase() || path.includes(backendField.toLowerCase())) {
              return frontendField;
            }
          }
        }
        
        // If error has a field property
        if (typeof err === 'object' && err.field) {
          const field = err.field.toLowerCase();
          for (const [backendField, frontendField] of Object.entries(fieldMapping)) {
            if (field === backendField.toLowerCase() || field.includes(backendField.toLowerCase())) {
              return frontendField;
            }
          }
        }
        
        // Try to extract from error message
        const errorMsg = typeof err === 'string' ? err : (err.message || err.msg || JSON.stringify(err));
        const lowerMsg = errorMsg.toLowerCase();
        
        for (const [backendField, frontendField] of Object.entries(fieldMapping)) {
          if (lowerMsg.includes(backendField.toLowerCase())) {
            return frontendField;
          }
        }
        
        return null;
      };
      
      // Handle backend validation errors - map to specific fields
      if (error.response?.data?.details && Array.isArray(error.response.data.details)) {
        error.response.data.details.forEach(err => {
          const errorMsg = typeof err === 'string' ? err : (err.message || err.msg || err.details || JSON.stringify(err));
          const fieldName = findFieldName(err);
          
          if (fieldName) {
            newErrors[fieldName] = errorMsg;
          } else {
            // If we can't map to a specific field, add to submit error
            if (!newErrors.submit) {
              newErrors.submit = errorMsg;
            } else {
              newErrors.submit += ', ' + errorMsg;
            }
          }
        });
      } else if (error.response?.data?.errors) {
        // Handle validation errors object or array
        if (Array.isArray(error.response.data.errors)) {
          const errorMessages = error.response.data.errors.join(', ');
          newErrors.submit = errorMessages;
        } else if (typeof error.response.data.errors === 'object') {
          // Map object errors to fields
          Object.keys(error.response.data.errors).forEach(key => {
            const frontendField = findFieldName({ path: key, field: key }) || key;
            newErrors[frontendField] = Array.isArray(error.response.data.errors[key]) 
              ? error.response.data.errors[key].join(', ')
              : error.response.data.errors[key];
          });
        }
      } else if (error.response?.data?.message) {
        newErrors.submit = error.response.data.message;
      } else if (error.response?.data?.error) {
        newErrors.submit = error.response.data.error;
      } else if (error.response?.status === 400) {
        newErrors.submit = 'Invalid data. Please check your inputs and try again.';
      } else {
        newErrors.submit = error.message || 'An error occurred. Please try again.';
      }
      
      setErrors(newErrors);
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div className="register-container">
      <div className="register-card">
        <div className="logo">
          <span className="logo-investor">Investor</span>
          <span className="logo-match">Match</span>
        </div>
        
        <h1>Welcome to InvestorMatch</h1>
        <p className="subtitle">Create a new account to get started</p>

        {/* Form Progress Indicator */}
        <div className="form-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${formCompletion}%` }}
            ></div>
          </div>
          <span className="progress-text">{formCompletion}% Complete</span>
        </div>

        <form onSubmit={handleSubmit} className="register-form">
          {errors.submit && (
            <div className="error-message submit-error">
              {errors.submit}
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <div className="input-wrapper">
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`${errors.email ? 'error' : ''} ${fieldTouched.email && !errors.email && formData.email ? 'success' : ''}`}
                placeholder="email@example.com"
              />
              {checkingEmail && <span className="checking-indicator">Checking...</span>}
              {fieldTouched.email && !errors.email && formData.email && (
                <span className="success-indicator">✓</span>
              )}
            </div>
            {errors.email && fieldTouched.email && <span className="error-text">{errors.email}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <div className="input-wrapper">
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`${errors.firstName ? 'error' : ''} ${fieldTouched.firstName && !errors.firstName && formData.firstName ? 'success' : ''}`}
                  placeholder="First Name"
                />
                {fieldTouched.firstName && !errors.firstName && formData.firstName && (
                  <span className="success-indicator">✓</span>
                )}
              </div>
              {errors.firstName && fieldTouched.firstName && <span className="error-text">{errors.firstName}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <div className="input-wrapper">
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`${errors.lastName ? 'error' : ''} ${fieldTouched.lastName && !errors.lastName && formData.lastName ? 'success' : ''}`}
                  placeholder="Last Name"
                />
                {fieldTouched.lastName && !errors.lastName && formData.lastName && (
                  <span className="success-indicator">✓</span>
                )}
              </div>
              {errors.lastName && fieldTouched.lastName && <span className="error-text">{errors.lastName}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`${errors.password ? 'error' : ''} ${fieldTouched.password && !errors.password && formData.password ? 'success' : ''}`}
                placeholder="••••••••"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            
            {/* Password Strength Indicator */}
            {formData.password && (
              <div className="password-strength">
                <div className="strength-bars">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`strength-bar ${passwordStrength.score >= level ? `strength-${passwordStrength.score <= 2 ? 'weak' : passwordStrength.score <= 4 ? 'medium' : 'strong'}` : ''}`}
                    ></div>
                  ))}
                </div>
                <div className="strength-text">
                  {passwordStrength.score === 0 && 'Enter a password'}
                  {passwordStrength.score === 1 && 'Very Weak'}
                  {passwordStrength.score === 2 && 'Weak'}
                  {passwordStrength.score === 3 && 'Fair'}
                  {passwordStrength.score === 4 && 'Good'}
                  {passwordStrength.score === 5 && 'Strong'}
                </div>
                {passwordStrength.feedback.length > 0 && (
                  <div className="password-requirements">
                    {passwordStrength.feedback.map((req, idx) => (
                      <span key={idx} className="requirement-item">• {req}</span>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {errors.password && fieldTouched.password && <span className="error-text">{errors.password}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="password-input">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`${errors.confirmPassword ? 'error' : ''} ${fieldTouched.confirmPassword && !errors.confirmPassword && formData.confirmPassword && formData.password === formData.confirmPassword ? 'success' : ''}`}
                placeholder="Confirm your password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex="-1"
              >
                {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {errors.confirmPassword && fieldTouched.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
            {fieldTouched.confirmPassword && !errors.confirmPassword && formData.confirmPassword && formData.password === formData.confirmPassword && (
              <span className="success-text">✓ Passwords match</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="securityQuestion">Security Question</label>
            <div className="input-wrapper">
              <input
                type="text"
                id="securityQuestion"
                name="securityQuestion"
                value={formData.securityQuestion}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`${errors.securityQuestion ? 'error' : ''} ${fieldTouched.securityQuestion && !errors.securityQuestion && formData.securityQuestion ? 'success' : ''}`}
                placeholder="e.g., What city were you born in?"
                list="security-questions"
              />
              <datalist id="security-questions">
                {securityQuestions.map((q, idx) => (
                  <option key={idx} value={q} />
                ))}
              </datalist>
              {fieldTouched.securityQuestion && !errors.securityQuestion && formData.securityQuestion && (
                <span className="success-indicator">✓</span>
              )}
            </div>
            <small className="help-text">
              This will be used for password recovery if you forget your password
            </small>
            {errors.securityQuestion && fieldTouched.securityQuestion && <span className="error-text">{errors.securityQuestion}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="securityAnswer">Security Answer</label>
            <div className="input-wrapper">
              <input
                type="text"
                id="securityAnswer"
                name="securityAnswer"
                value={formData.securityAnswer}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`${errors.securityAnswer ? 'error' : ''} ${fieldTouched.securityAnswer && !errors.securityAnswer && formData.securityAnswer ? 'success' : ''}`}
                placeholder="Your answer"
              />
              {fieldTouched.securityAnswer && !errors.securityAnswer && formData.securityAnswer && (
                <span className="success-indicator">✓</span>
              )}
            </div>
            <small className="help-text">
              Remember this answer! It will be required to reset your password
            </small>
            {errors.securityAnswer && fieldTouched.securityAnswer && <span className="error-text">{errors.securityAnswer}</span>}
          </div>

          <button 
            type="submit" 
            className={`create-account-btn ${isFormValid ? 'ready' : ''}`}
            disabled={isLoading || !isFormValid}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </button>

          <p className="login-link">
            Already have an account? <button type="button" onClick={onShowLogin}>Sign in here.</button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;
