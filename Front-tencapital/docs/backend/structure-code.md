# TEN Capital - Backend Code Structure

## Overview

The TEN Capital backend follows a layered architecture pattern with clear separation of concerns. The codebase is organized into logical modules that handle different aspects of the application.

## Directory Structure

```
backend/
├── src/
│   ├── controllers/         # Request handlers and business logic orchestration
│   ├── models/             # Database models and schemas
│   ├── routes/             # API route definitions
│   ├── middleware/         # Custom middleware functions
│   ├── services/           # Business logic and external service integration
│   ├── utils/              # Utility functions and helpers
│   ├── config/             # Configuration files
│   ├── validators/         # Input validation schemas
│   ├── constants/          # Application constants
│   └── app.js              # Main application entry point
├── tests/                  # Test files
├── uploads/                # File upload storage
├── logs/                   # Application logs
├── docs/                   # API documentation
└── scripts/                # Utility scripts
```

## Core Components

### 1. Controllers (`src/controllers/`)

Controllers handle HTTP requests and orchestrate business logic. They are responsible for:
- Request validation
- Calling appropriate services
- Formatting responses
- Error handling

#### AuthController (`authController.js`)

```javascript
// Key responsibilities:
- User registration and login
- Password reset functionality
- Token management
- User profile management
- Logout handling

// Main methods:
- register(req, res, next)
- login(req, res, next)
- logout(req, res, next)
- forgotPassword(req, res, next)
- resetPassword(req, res, next)
- getProfile(req, res, next)
- updateProfile(req, res, next)
```

#### InvestorController (`investorController.js`)

```javascript
// Key responsibilities:
- CRUD operations for investors
- Search and filtering
- Bulk operations
- Data validation

// Main methods:
- createInvestor(req, res, next)
- getInvestors(req, res, next)
- getInvestorById(req, res, next)
- updateInvestor(req, res, next)
- deleteInvestor(req, res, next)
- searchInvestors(req, res, next)
- filterInvestors(req, res, next)
- bulkImport(req, res, next)
```

#### ExcelController (`excelController.js`)

```javascript
// Key responsibilities:
- File upload handling
- Excel data processing
- AI-powered analysis
- Data mapping and validation

// Main methods:
- uploadFile(req, res, next)
- processExcel(req, res, next)
- analyzeHeaders(req, res, next)
- validateMapping(req, res, next)
- importData(req, res, next)
- getExcelData(req, res, next)
```

### 2. Models (`src/models/`)

Models define the database schema and provide methods for data manipulation.

#### User Model (`User.js`)

```javascript
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Methods:
- comparePassword(candidatePassword)
- generateAuthToken()
- toJSON() // Remove sensitive data
```

#### Investor Model (`Investor.js`)

```javascript
const investorSchema = new mongoose.Schema({
  investorType: {
    type: String,
    required: true,
    enum: ['Individual', 'Institution', 'Fund', 'Corporate']
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  phone: String,
  location: {
    type: String,
    required: true
  },
  sector: {
    type: String,
    required: true
  },
  industries: [String],
  investmentStage: {
    type: String,
    enum: ['Seed', 'Series A', 'Series B', 'Series C', 'Growth', 'Late Stage']
  },
  revenueCriteria: String,
  organizationPersonName: String,
  description: String,
  tags: [String],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Methods:
- static findByFilters(filters)
- static searchByText(query)
- static getStatistics()
```

### 3. Services (`src/services/`)

Services contain business logic and external service integration.

#### AuthService (`authService.js`)

```javascript
class AuthService {
  // Hash password
  async hashPassword(password) {
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    return await bcrypt.hash(password, saltRounds);
  }

  // Compare password
  async comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  // Generate JWT token
  generateToken(userId) {
    return jwt.sign(
      { id: userId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
  }

  // Generate refresh token
  generateRefreshToken(userId) {
    return jwt.sign(
      { id: userId },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );
  }

  // Verify token
  verifyToken(token) {
    return jwt.verify(token, process.env.JWT_SECRET);
  }
}
```

#### ExcelService (`excelService.js`)

```javascript
class ExcelService {
  // Process Excel file
  async processExcelFile(filePath) {
    try {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);
      
      return {
        headers: Object.keys(data[0] || {}),
        data: data,
        rowCount: data.length
      };
    } catch (error) {
      throw new Error(`Excel processing failed: ${error.message}`);
    }
  }

  // Analyze headers with AI
  async analyzeHeadersWithAI(headers) {
    try {
      const response = await axios.post(`${process.env.AI_SERVICE_URL}/analyze-headers`, {
        headers: headers
      });
      
      return response.data;
    } catch (error) {
      throw new Error(`AI analysis failed: ${error.message}`);
    }
  }

  // Create intelligent mapping
  async createIntelligentMapping(headers, sampleData) {
    try {
      const response = await axios.post(`${process.env.AI_SERVICE_URL}/create-mapping`, {
        headers: headers,
        sampleData: sampleData
      });
      
      return response.data;
    } catch (error) {
      throw new Error(`Mapping creation failed: ${error.message}`);
    }
  }
}
```

### 4. Middleware (`src/middleware/`)

Middleware functions handle cross-cutting concerns.

#### Authentication Middleware (`auth.js`)

```javascript
// authenticate: Verify JWT token
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token.' });
  }
};

// authorizeAdmin: Check admin role
const authorizeAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin role required.' });
  }
  next();
};
```

#### Error Handler Middleware (`errorHandler.js`)

```javascript
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error(err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new ErrorResponse(message, 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = new ErrorResponse(message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = new ErrorResponse(message, 400);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error'
  });
};
```

## Code Patterns and Conventions

### 1. Error Handling Pattern

```javascript
// Controller error handling
const createInvestor = async (req, res, next) => {
  try {
    const investor = await investorService.createInvestor(req.body, req.user.id);
    res.status(201).json({
      success: true,
      data: investor,
      message: 'Investor created successfully'
    });
  } catch (error) {
    next(error);
  }
};
```

### 2. Service Layer Pattern

```javascript
// Service method
const createInvestor = async (investorData, userId) => {
  // Validation
  if (!investorData.email) {
    throw new Error('Email is required');
  }

  // Business logic
  const investor = new Investor({
    ...investorData,
    createdBy: userId
  });

  // Save to database
  await investor.save();
  
  return investor;
};
```

### 3. Response Format Pattern

```javascript
// Success response
res.status(200).json({
  success: true,
  data: result,
  message: 'Operation completed successfully',
  timestamp: new Date().toISOString()
});

// Error response
res.status(400).json({
  success: false,
  error: 'Error message',
  timestamp: new Date().toISOString()
});
```

## Best Practices

### 1. Code Organization
- Keep controllers thin - delegate business logic to services
- Use middleware for cross-cutting concerns
- Separate validation logic into dedicated validators
- Use constants for magic numbers and strings

### 2. Error Handling
- Always use try-catch blocks in async functions
- Use custom error classes for different error types
- Log errors with appropriate context
- Return user-friendly error messages

### 3. Security
- Validate all inputs
- Use parameterized queries
- Implement proper authentication and authorization
- Sanitize user inputs
- Use HTTPS in production

### 4. Performance
- Use database indexes appropriately
- Implement caching where beneficial
- Use pagination for large datasets
- Optimize database queries
- Use connection pooling

### 5. Testing
- Write unit tests for services
- Write integration tests for API endpoints
- Use test fixtures for consistent test data
- Mock external services in tests
- Maintain high test coverage

This code structure provides a solid foundation for the TEN Capital backend, ensuring maintainability, scalability, and code quality.

