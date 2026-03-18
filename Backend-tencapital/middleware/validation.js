const Joi = require('joi');

// User registration validation schema
const userRegistrationSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  firstName: Joi.string().min(2).max(50).required().messages({
    'string.min': 'First name must be at least 2 characters long',
    'string.max': 'First name must not exceed 50 characters',
    'any.required': 'First name is required'
  }),
  lastName: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Last name must be at least 2 characters long',
    'string.max': 'Last name must not exceed 50 characters',
    'any.required': 'Last name is required'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters long',
    'any.required': 'Password is required'
  }),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
    'any.only': 'Passwords do not match',
    'any.required': 'Password confirmation is required'
  }),
  securityQuestion: Joi.string().min(5).required().messages({
    'string.min': 'Security question must be at least 5 characters long',
    'any.required': 'Security question is required'
  }),
  securityAnswer: Joi.string().min(2).required().messages({
    'string.min': 'Security answer must be at least 2 characters long',
    'any.required': 'Security answer is required'
  })
});

// Email validation schema
const emailSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  })
});

// User update validation schema
const userUpdateSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).optional().messages({
    'string.min': 'First name must be at least 2 characters long',
    'string.max': 'First name must not exceed 50 characters'
  }),
  lastName: Joi.string().min(2).max(50).optional().messages({
    'string.min': 'Last name must be at least 2 characters long',
    'string.max': 'Last name must not exceed 50 characters'
  }),
  email: Joi.string().email().optional().messages({
    'string.email': 'Please provide a valid email address'
  }),
  password: Joi.string().min(6).optional().messages({
    'string.min': 'Password must be at least 6 characters long'
  }),
  securityQuestion: Joi.string().min(5).optional().messages({
    'string.min': 'Security question must be at least 5 characters long'
  }),
  securityAnswer: Joi.string().min(2).optional().messages({
    'string.min': 'Security answer must be at least 2 characters long'
  }),
  isActive: Joi.boolean().optional().messages({
    'boolean.base': 'isActive must be a boolean value'
  }),
  role: Joi.string().valid('user', 'admin', 'moderator').optional().messages({
    'any.only': 'Role must be one of: user, admin, moderator'
  })
});

// Login validation schema
const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required'
  })
});

// Step 1: Email verification schema
const verifyEmailSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  })
});

// Step 2: Security answer verification schema
const verifySecurityAnswerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  securityAnswer: Joi.string().min(2).required().messages({
    'string.min': 'Security answer must be at least 2 characters long',
    'any.required': 'Security answer is required'
  })
});

// Step 3: Reset password schema
const resetPasswordSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  newPassword: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters long',
    'any.required': 'New password is required'
  }),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
    'any.only': 'Passwords do not match',
    'any.required': 'Password confirmation is required'
  }),
  securityAnswer: Joi.string().min(2).required().messages({
    'string.min': 'Security answer must be at least 2 characters long',
    'any.required': 'Security answer is required'
  })
});


// User status update schema
const updateUserStatusSchema = Joi.object({
  isActive: Joi.boolean().required().messages({
    'boolean.base': 'isActive must be a boolean value',
    'any.required': 'isActive is required'
  })
});

// Admin user creation validation schema
const adminUserCreationSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  firstName: Joi.string().min(2).max(50).required().messages({
    'string.min': 'First name must be at least 2 characters long',
    'string.max': 'First name must not exceed 50 characters',
    'any.required': 'First name is required'
  }),
  lastName: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Last name must be at least 2 characters long',
    'string.max': 'Last name must not exceed 50 characters',
    'any.required': 'Last name is required'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters long',
    'any.required': 'Password is required'
  }),
  securityQuestion: Joi.string().min(5).required().messages({
    'string.min': 'Security question must be at least 5 characters long',
    'any.required': 'Security question is required'
  }),
  securityAnswer: Joi.string().min(2).required().messages({
    'string.min': 'Security answer must be at least 2 characters long',
    'any.required': 'Security answer is required'
  })
});

// User creation with role validation schema
const userWithRoleCreationSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  firstName: Joi.string().min(2).max(50).required().messages({
    'string.min': 'First name must be at least 2 characters long',
    'string.max': 'First name must not exceed 50 characters',
    'any.required': 'First name is required'
  }),
  lastName: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Last name must be at least 2 characters long',
    'string.max': 'Last name must not exceed 50 characters',
    'any.required': 'Last name is required'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters long',
    'any.required': 'Password is required'
  }),
  securityQuestion: Joi.string().min(5).required().messages({
    'string.min': 'Security question must be at least 5 characters long',
    'any.required': 'Security question is required'
  }),
  securityAnswer: Joi.string().min(2).required().messages({
    'string.min': 'Security answer must be at least 2 characters long',
    'any.required': 'Security answer is required'
  }),
  role: Joi.string().valid('user', 'admin', 'moderator').default('admin').messages({
    'any.only': 'Role must be one of: user, admin, moderator'
  }),
  isActive: Joi.boolean().default(true).messages({
    'boolean.base': 'isActive must be a boolean value'
  })
});

// Change password schema
const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'any.required': 'Current password is required'
  }),
  newPassword: Joi.string().min(6).required().messages({
    'string.min': 'New password must be at least 6 characters long',
    'any.required': 'New password is required'
  }),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
    'any.only': 'Passwords do not match',
    'any.required': 'Password confirmation is required'
  })
});

// Investor creation schema
const createInvestorSchema = Joi.object({
  investorType: Joi.string().max(100).optional().messages({
    'string.max': 'Investor type must not exceed 100 characters'
  }),
  sector: Joi.string().max(100).optional().messages({
    'string.max': 'Sector must not exceed 100 characters'
  }),
  industries: Joi.string().max(255).optional().messages({
    'string.max': 'Industries must not exceed 255 characters'
  }),
  investmentStage: Joi.string().max(100).optional().messages({
    'string.max': 'Investment stage must not exceed 100 characters'
  }),
  revenueCriteria: Joi.string().max(255).optional().messages({
    'string.max': 'Revenue criteria must not exceed 255 characters'
  }),
  organizationPersonName: Joi.string().max(255).optional().messages({
    'string.max': 'Organization/Person name must not exceed 255 characters'
  }),
  firstName: Joi.string().max(100).optional().messages({
    'string.max': 'First name must not exceed 100 characters'
  }),
  lastName: Joi.string().max(100).optional().messages({
    'string.max': 'Last name must not exceed 100 characters'
  }),
  email: Joi.string().email().optional().messages({
    'string.email': 'Please provide a valid email address'
  }),
  description: Joi.string().optional().messages({
    'string.base': 'Description must be a string'
  }),
  organizationPersonNameFirstNameLastName: Joi.string().max(255).optional().messages({
    'string.max': 'Combined name must not exceed 255 characters'
  }),
  location: Joi.string().max(255).optional().messages({
    'string.max': 'Location must not exceed 255 characters'
  }),
  phoneNumber: Joi.string().max(50).optional().messages({
    'string.max': 'Phone number must not exceed 50 characters'
  }),
  website: Joi.string().uri().optional().messages({
    'string.uri': 'Website must be a valid URL'
  }),
  linkedin: Joi.string().uri().optional().messages({
    'string.uri': 'LinkedIn must be a valid URL'
  }),
  note: Joi.string().optional().messages({
    'string.base': 'Note must be a string'
  }),
  userId: Joi.string().required().messages({
    'string.base': 'User ID must be a string',
    'any.required': 'User ID is required'
  })
});

// Investor update schema
const updateInvestorSchema = Joi.object({
  investorType: Joi.string().max(100).optional().messages({
    'string.max': 'Investor type must not exceed 100 characters'
  }),
  sector: Joi.string().max(100).optional().messages({
    'string.max': 'Sector must not exceed 100 characters'
  }),
  industries: Joi.string().max(255).optional().messages({
    'string.max': 'Industries must not exceed 255 characters'
  }),
  investmentStage: Joi.string().max(100).optional().messages({
    'string.max': 'Investment stage must not exceed 100 characters'
  }),
  revenueCriteria: Joi.string().max(255).optional().messages({
    'string.max': 'Revenue criteria must not exceed 255 characters'
  }),
  organizationPersonName: Joi.string().max(255).optional().messages({
    'string.max': 'Organization/Person name must not exceed 255 characters'
  }),
  firstName: Joi.string().max(100).optional().messages({
    'string.max': 'First name must not exceed 100 characters'
  }),
  lastName: Joi.string().max(100).optional().messages({
    'string.max': 'Last name must not exceed 100 characters'
  }),
  email: Joi.string().email().optional().messages({
    'string.email': 'Please provide a valid email address'
  }),
  description: Joi.string().optional().messages({
    'string.base': 'Description must be a string'
  }),
  organizationPersonNameFirstNameLastName: Joi.string().max(255).optional().messages({
    'string.max': 'Combined name must not exceed 255 characters'
  }),
  location: Joi.string().max(255).optional().messages({
    'string.max': 'Location must not exceed 255 characters'
  }),
  phoneNumber: Joi.string().max(50).optional().messages({
    'string.max': 'Phone number must not exceed 50 characters'
  }),
  website: Joi.string().uri().optional().messages({
    'string.uri': 'Website must be a valid URL'
  }),
  linkedin: Joi.string().uri().optional().messages({
    'string.uri': 'LinkedIn must be a valid URL'
  }),
  status: Joi.number().integer().min(0).max(2).optional().messages({
    'number.base': 'Status must be a number',
    'number.integer': 'Status must be an integer',
    'number.min': 'Status must be at least 0',
    'number.max': 'Status must be at most 2'
  }),
  note: Joi.string().optional().messages({
    'string.base': 'Note must be a string'
  })
});

// Validation middleware factory
const validate = (schema) => {
  return (req, res, next) => {
    console.log('🔍 [DEBUG] Validation middleware - Request body:', JSON.stringify(req.body, null, 2));
    console.log('🔍 [DEBUG] Validation middleware - Schema name:', schema._flags?.label || 'Unknown');
    
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errorMessages = error.details.map(detail => detail.message);
      console.log('❌ [DEBUG] Validation failed:', errorMessages);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: errorMessages,
        receivedData: req.body
      });
    }
    
    console.log('✅ [DEBUG] Validation passed');
    req.body = value; // Use validated and sanitized data
    next();
  };
};

module.exports = {
  validateUserRegistration: validate(userRegistrationSchema),
  validateEmail: validate(emailSchema),
  validateUserUpdate: validate(userUpdateSchema),
  validateLogin: validate(loginSchema),
  validateVerifyEmail: validate(verifyEmailSchema),
  validateVerifySecurityAnswer: validate(verifySecurityAnswerSchema),
  validateResetPassword: validate(resetPasswordSchema),
  validateUpdateUserStatus: validate(updateUserStatusSchema),
  validateChangePassword: validate(changePasswordSchema),
  validateCreateInvestor: validate(createInvestorSchema),
  validateUpdateInvestor: validate(updateInvestorSchema),
  validateAdminUserCreation: validate(adminUserCreationSchema),
  validateUserWithRoleCreation: validate(userWithRoleCreationSchema),
  userRegistrationSchema,
  emailSchema,
  userUpdateSchema,
  loginSchema,
  verifyEmailSchema,
  verifySecurityAnswerSchema,
  resetPasswordSchema,
  updateUserStatusSchema,
  changePasswordSchema,
  createInvestorSchema,
  updateInvestorSchema,
  adminUserCreationSchema,
  userWithRoleCreationSchema
};

