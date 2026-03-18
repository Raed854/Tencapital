# TEN Capital - Backend Testing Guide

## Testing Overview

The TEN Capital backend implements comprehensive testing strategies to ensure code quality, reliability, and maintainability. This guide covers unit testing, integration testing, and end-to-end testing approaches.

## Testing Stack

### Core Testing Libraries
- **Jest**: JavaScript testing framework
- **Supertest**: HTTP assertion library for API testing
- **MongoDB Memory Server**: In-memory MongoDB for testing
- **Faker.js**: Generate fake data for testing
- **Sinon**: Test spies, stubs, and mocks

### Additional Testing Tools
- **Coverage**: Istanbul for code coverage
- **ESLint**: Code quality and style checking
- **Prettier**: Code formatting
- **Husky**: Git hooks for pre-commit testing

## Test Structure

```
tests/
├── unit/                   # Unit tests
│   ├── controllers/
│   ├── services/
│   ├── models/
│   ├── middleware/
│   └── utils/
├── integration/            # Integration tests
│   ├── api/
│   ├── database/
│   └── external/
├── e2e/                    # End-to-end tests
├── fixtures/               # Test data
├── helpers/                # Test utilities
└── setup/                  # Test configuration
```

## Test Configuration

### Jest Configuration (`jest.config.js`)

```javascript
module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.js'],
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/src/**/*.test.js'
  ],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/app.js',
    '!src/server.js',
    '!src/**/*.test.js',
    '!src/**/__tests__/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  testTimeout: 10000,
  clearMocks: true,
  restoreMocks: true
};
```

### Test Setup (`tests/setup/jest.setup.js`)

```javascript
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});
```

## Unit Testing

### Controller Testing

#### AuthController Tests (`tests/unit/controllers/authController.test.js`)

```javascript
const request = require('supertest');
const app = require('../../../src/app');
const User = require('../../../src/models/User');
const { generateToken } = require('../../../src/utils/auth');

describe('AuthController', () => {
  describe('POST /api/users/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe'
      };

      const response = await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(userData.email);
      expect(response.body.data.firstName).toBe(userData.firstName);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.password).toBeUndefined();
    });

    it('should reject registration with invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe'
      };

      const response = await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('email');
    });

    it('should reject registration with weak password', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'weak',
        firstName: 'John',
        lastName: 'Doe'
      };

      const response = await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Password must contain');
    });

    it('should reject duplicate email registration', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe'
      };

      // First registration
      await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(201);

      // Second registration with same email
      const response = await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('already exists');
    });
  });

  describe('POST /api/users/login', () => {
    beforeEach(async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe'
      };

      await request(app)
        .post('/api/users/register')
        .send(userData);
    });

    it('should login with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'Password123!'
      };

      const response = await request(app)
        .post('/api/users/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(loginData.email);
      expect(response.body.data.token).toBeDefined();
    });

    it('should reject login with invalid email', async () => {
      const loginData = {
        email: 'wrong@example.com',
        password: 'Password123!'
      };

      const response = await request(app)
        .post('/api/users/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid credentials');
    });

    it('should reject login with invalid password', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'WrongPassword123!'
      };

      const response = await request(app)
        .post('/api/users/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid credentials');
    });
  });
});
```

#### InvestorController Tests (`tests/unit/controllers/investorController.test.js`)

```javascript
const request = require('supertest');
const app = require('../../../src/app');
const User = require('../../../src/models/User');
const Investor = require('../../../src/models/Investor');
const { generateToken } = require('../../../src/utils/auth');

describe('InvestorController', () => {
  let authToken;
  let userId;

  beforeEach(async () => {
    // Create test user
    const user = new User({
      email: 'test@example.com',
      password: 'Password123!',
      firstName: 'John',
      lastName: 'Doe'
    });
    await user.save();
    userId = user._id;
    authToken = generateToken(userId);
  });

  describe('POST /api/investors', () => {
    it('should create a new investor', async () => {
      const investorData = {
        investorType: 'Individual',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        location: 'New York',
        sector: 'Technology'
      };

      const response = await request(app)
        .post('/api/investors')
        .set('Authorization', `Bearer ${authToken}`)
        .send(investorData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.firstName).toBe(investorData.firstName);
      expect(response.body.data.email).toBe(investorData.email);
      expect(response.body.data.createdBy).toBe(userId.toString());
    });

    it('should reject investor creation without authentication', async () => {
      const investorData = {
        investorType: 'Individual',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        location: 'New York',
        sector: 'Technology'
      };

      const response = await request(app)
        .post('/api/investors')
        .send(investorData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Access denied');
    });

    it('should validate required fields', async () => {
      const investorData = {
        firstName: 'Jane'
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/investors')
        .set('Authorization', `Bearer ${authToken}`)
        .send(investorData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('required');
    });
  });

  describe('GET /api/investors', () => {
    beforeEach(async () => {
      // Create test investors
      const investors = [
        {
          investorType: 'Individual',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          location: 'New York',
          sector: 'Technology',
          createdBy: userId
        },
        {
          investorType: 'Institution',
          firstName: 'Bob',
          lastName: 'Johnson',
          email: 'bob@example.com',
          location: 'San Francisco',
          sector: 'Healthcare',
          createdBy: userId
        }
      ];

      await Investor.insertMany(investors);
    });

    it('should get all investors with pagination', async () => {
      const response = await request(app)
        .get('/api/investors')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.investors).toHaveLength(2);
      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.pagination.totalItems).toBe(2);
    });

    it('should filter investors by sector', async () => {
      const response = await request(app)
        .get('/api/investors?sector=Technology')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.investors).toHaveLength(1);
      expect(response.body.data.investors[0].sector).toBe('Technology');
    });

    it('should search investors by name', async () => {
      const response = await request(app)
        .get('/api/investors?search=Jane')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.investors).toHaveLength(1);
      expect(response.body.data.investors[0].firstName).toBe('Jane');
    });
  });
});
```

### Service Testing

#### AuthService Tests (`tests/unit/services/authService.test.js`)

```javascript
const AuthService = require('../../../src/services/authService');
const User = require('../../../src/models/User');

describe('AuthService', () => {
  describe('hashPassword', () => {
    it('should hash password correctly', async () => {
      const password = 'Password123!';
      const hashedPassword = await AuthService.hashPassword(password);
      
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(50);
    });

    it('should generate different hashes for same password', async () => {
      const password = 'Password123!';
      const hash1 = await AuthService.hashPassword(password);
      const hash2 = await AuthService.hashPassword(password);
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('comparePassword', () => {
    it('should return true for correct password', async () => {
      const password = 'Password123!';
      const hashedPassword = await AuthService.hashPassword(password);
      
      const result = await AuthService.comparePassword(password, hashedPassword);
      expect(result).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const password = 'Password123!';
      const wrongPassword = 'WrongPassword123!';
      const hashedPassword = await AuthService.hashPassword(password);
      
      const result = await AuthService.comparePassword(wrongPassword, hashedPassword);
      expect(result).toBe(false);
    });
  });

  describe('generateToken', () => {
    it('should generate valid JWT token', () => {
      const userId = '507f1f77bcf86cd799439011';
      const token = AuthService.generateToken(userId);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });
  });
});
```

#### ExcelService Tests (`tests/unit/services/excelService.test.js`)

```javascript
const ExcelService = require('../../../src/services/excelService');
const fs = require('fs');
const path = require('path');

describe('ExcelService', () => {
  describe('processExcelFile', () => {
    it('should process Excel file correctly', async () => {
      const filePath = path.join(__dirname, '../fixtures/test-data.xlsx');
      
      const result = await ExcelService.processExcelFile(filePath);
      
      expect(result).toBeDefined();
      expect(result.headers).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.rowCount).toBeGreaterThan(0);
    });

    it('should throw error for invalid file', async () => {
      const filePath = 'invalid-file.xlsx';
      
      await expect(ExcelService.processExcelFile(filePath))
        .rejects
        .toThrow('Excel processing failed');
    });
  });

  describe('analyzeHeadersWithAI', () => {
    it('should analyze headers with AI service', async () => {
      const headers = ['Name', 'Email', 'Sector', 'Location'];
      
      // Mock AI service response
      const mockResponse = {
        data: {
          mapping: {
            'Name': { field: 'firstName', confidence: 0.95 },
            'Email': { field: 'email', confidence: 0.98 }
          },
          overallConfidence: 0.96
        }
      };
      
      // Mock axios
      const axios = require('axios');
      jest.spyOn(axios, 'post').mockResolvedValue(mockResponse);
      
      const result = await ExcelService.analyzeHeadersWithAI(headers);
      
      expect(result).toBeDefined();
      expect(result.mapping).toBeDefined();
      expect(result.overallConfidence).toBe(0.96);
    });
  });
});
```

### Model Testing

#### User Model Tests (`tests/unit/models/User.test.js`)

```javascript
const User = require('../../../src/models/User');

describe('User Model', () => {
  describe('User Creation', () => {
    it('should create user with valid data', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe'
      };

      const user = new User(userData);
      await user.save();

      expect(user._id).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.firstName).toBe(userData.firstName);
      expect(user.lastName).toBe(userData.lastName);
      expect(user.role).toBe('user');
      expect(user.isActive).toBe(true);
    });

    it('should hash password before saving', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe'
      };

      const user = new User(userData);
      await user.save();

      expect(user.password).not.toBe(userData.password);
      expect(user.password.length).toBeGreaterThan(50);
    });
  });

  describe('User Validation', () => {
    it('should require email', async () => {
      const userData = {
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe'
      };

      const user = new User(userData);
      
      await expect(user.save()).rejects.toThrow('email is required');
    });

    it('should require unique email', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe'
      };

      const user1 = new User(userData);
      await user1.save();

      const user2 = new User(userData);
      await expect(user2.save()).rejects.toThrow('duplicate key error');
    });

    it('should validate email format', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe'
      };

      const user = new User(userData);
      
      await expect(user.save()).rejects.toThrow('email');
    });
  });

  describe('User Methods', () => {
    let user;

    beforeEach(async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe'
      };

      user = new User(userData);
      await user.save();
    });

    it('should compare password correctly', async () => {
      const isMatch = await user.comparePassword('Password123!');
      expect(isMatch).toBe(true);

      const isNotMatch = await user.comparePassword('WrongPassword');
      expect(isNotMatch).toBe(false);
    });

    it('should generate auth token', () => {
      const token = user.generateAuthToken();
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    it('should return JSON without password', () => {
      const json = user.toJSON();
      
      expect(json.password).toBeUndefined();
      expect(json.email).toBe(user.email);
      expect(json.firstName).toBe(user.firstName);
    });
  });
});
```

## Integration Testing

### API Integration Tests (`tests/integration/api/investors.test.js`)

```javascript
const request = require('supertest');
const app = require('../../../src/app');
const User = require('../../../src/models/User');
const Investor = require('../../../src/models/Investor');
const { generateToken } = require('../../../src/utils/auth');

describe('Investor API Integration', () => {
  let authToken;
  let userId;

  beforeAll(async () => {
    // Create test user
    const user = new User({
      email: 'test@example.com',
      password: 'Password123!',
      firstName: 'John',
      lastName: 'Doe'
    });
    await user.save();
    userId = user._id;
    authToken = generateToken(userId);
  });

  describe('Complete Investor Workflow', () => {
    it('should handle complete investor CRUD workflow', async () => {
      // Create investor
      const investorData = {
        investorType: 'Individual',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        location: 'New York',
        sector: 'Technology'
      };

      const createResponse = await request(app)
        .post('/api/investors')
        .set('Authorization', `Bearer ${authToken}`)
        .send(investorData)
        .expect(201);

      const investorId = createResponse.body.data.id;

      // Get investor
      const getResponse = await request(app)
        .get(`/api/investors/${investorId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(getResponse.body.data.firstName).toBe(investorData.firstName);

      // Update investor
      const updateData = {
        firstName: 'Jane Updated',
        description: 'Updated description'
      };

      const updateResponse = await request(app)
        .put(`/api/investors/${investorId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(updateResponse.body.data.firstName).toBe(updateData.firstName);

      // Delete investor
      await request(app)
        .delete(`/api/investors/${investorId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify deletion
      await request(app)
        .get(`/api/investors/${investorId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});
```

### Database Integration Tests (`tests/integration/database/mongodb.test.js`)

```javascript
const mongoose = require('mongoose');
const User = require('../../../src/models/User');
const Investor = require('../../../src/models/Investor');

describe('MongoDB Integration', () => {
  describe('User Operations', () => {
    it('should perform user CRUD operations', async () => {
      // Create
      const user = new User({
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe'
      });
      await user.save();

      // Read
      const foundUser = await User.findById(user._id);
      expect(foundUser.email).toBe(user.email);

      // Update
      foundUser.firstName = 'John Updated';
      await foundUser.save();

      const updatedUser = await User.findById(user._id);
      expect(updatedUser.firstName).toBe('John Updated');

      // Delete
      await User.findByIdAndDelete(user._id);
      const deletedUser = await User.findById(user._id);
      expect(deletedUser).toBeNull();
    });
  });

  describe('Investor Operations', () => {
    it('should perform investor queries with filters', async () => {
      // Create test investors
      const investors = [
        {
          investorType: 'Individual',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          location: 'New York',
          sector: 'Technology',
          createdBy: new mongoose.Types.ObjectId()
        },
        {
          investorType: 'Institution',
          firstName: 'Bob',
          lastName: 'Johnson',
          email: 'bob@example.com',
          location: 'San Francisco',
          sector: 'Healthcare',
          createdBy: new mongoose.Types.ObjectId()
        }
      ];

      await Investor.insertMany(investors);

      // Test sector filter
      const techInvestors = await Investor.find({ sector: 'Technology' });
      expect(techInvestors).toHaveLength(1);
      expect(techInvestors[0].firstName).toBe('Jane');

      // Test location filter
      const nyInvestors = await Investor.find({ location: 'New York' });
      expect(nyInvestors).toHaveLength(1);

      // Test text search
      const searchResults = await Investor.find({
        $or: [
          { firstName: { $regex: 'Jane', $options: 'i' } },
          { lastName: { $regex: 'Jane', $options: 'i' } }
        ]
      });
      expect(searchResults).toHaveLength(1);
    });
  });
});
```

## End-to-End Testing

### E2E Test Suite (`tests/e2e/complete-workflow.test.js`)

```javascript
const request = require('supertest');
const app = require('../../src/app');

describe('Complete Application Workflow', () => {
  let authToken;
  let userId;

  describe('User Registration and Login', () => {
    it('should complete user registration and login flow', async () => {
      // Register user
      const userData = {
        email: 'e2e@example.com',
        password: 'Password123!',
        firstName: 'E2E',
        lastName: 'Test'
      };

      const registerResponse = await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(201);

      expect(registerResponse.body.success).toBe(true);
      expect(registerResponse.body.data.email).toBe(userData.email);

      // Login user
      const loginData = {
        email: userData.email,
        password: userData.password
      };

      const loginResponse = await request(app)
        .post('/api/users/login')
        .send(loginData)
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      authToken = loginResponse.body.data.token;
      userId = loginResponse.body.data.id;
    });
  });

  describe('Investor Management Workflow', () => {
    it('should complete investor management workflow', async () => {
      // Create investor
      const investorData = {
        investorType: 'Individual',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        location: 'New York',
        sector: 'Technology'
      };

      const createResponse = await request(app)
        .post('/api/investors')
        .set('Authorization', `Bearer ${authToken}`)
        .send(investorData)
        .expect(201);

      const investorId = createResponse.body.data.id;

      // Get investors list
      const listResponse = await request(app)
        .get('/api/investors')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(listResponse.body.data.investors).toHaveLength(1);

      // Update investor
      const updateData = {
        firstName: 'Jane Updated'
      };

      await request(app)
        .put(`/api/investors/${investorId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      // Delete investor
      await request(app)
        .delete(`/api/investors/${investorId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });

  describe('Excel Processing Workflow', () => {
    it('should complete Excel processing workflow', async () => {
      // This would test the complete Excel upload and processing workflow
      // including file upload, header analysis, mapping validation, and data import
      
      // Note: This test would require actual Excel files and AI service mocking
      // For now, we'll test the endpoint structure
      
      const response = await request(app)
        .get('/api/excel/status')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});
```

## Test Utilities

### Test Helpers (`tests/helpers/testHelpers.js`)

```javascript
const User = require('../../src/models/User');
const Investor = require('../../src/models/Investor');
const { generateToken } = require('../../src/utils/auth');

// Create test user
const createTestUser = async (userData = {}) => {
  const defaultData = {
    email: 'test@example.com',
    password: 'Password123!',
    firstName: 'John',
    lastName: 'Doe',
    ...userData
  };

  const user = new User(defaultData);
  await user.save();
  return user;
};

// Create test investor
const createTestInvestor = async (investorData = {}, userId) => {
  const defaultData = {
    investorType: 'Individual',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@example.com',
    location: 'New York',
    sector: 'Technology',
    createdBy: userId,
    ...investorData
  };

  const investor = new Investor(defaultData);
  await investor.save();
  return investor;
};

// Generate auth token
const generateAuthToken = (userId) => {
  return generateToken(userId);
};

// Clean database
const cleanDatabase = async () => {
  await User.deleteMany({});
  await Investor.deleteMany({});
};

module.exports = {
  createTestUser,
  createTestInvestor,
  generateAuthToken,
  cleanDatabase
};
```

### Test Fixtures (`tests/fixtures/testData.js`)

```javascript
const faker = require('faker');

// Generate test user data
const generateUserData = (overrides = {}) => ({
  email: faker.internet.email(),
  password: 'Password123!',
  firstName: faker.name.firstName(),
  lastName: faker.name.lastName(),
  ...overrides
});

// Generate test investor data
const generateInvestorData = (overrides = {}) => ({
  investorType: faker.random.arrayElement(['Individual', 'Institution', 'Fund', 'Corporate']),
  firstName: faker.name.firstName(),
  lastName: faker.name.lastName(),
  email: faker.internet.email(),
  phone: faker.phone.phoneNumber(),
  location: faker.address.city(),
  sector: faker.random.arrayElement(['Technology', 'Healthcare', 'Finance', 'Manufacturing']),
  industries: [faker.commerce.department()],
  investmentStage: faker.random.arrayElement(['Seed', 'Series A', 'Series B', 'Series C']),
  revenueCriteria: faker.random.arrayElement(['>$1M', '>$10M', '>$100M']),
  description: faker.lorem.sentence(),
  tags: [faker.lorem.word()],
  ...overrides
});

// Generate multiple investors
const generateMultipleInvestors = (count = 5) => {
  return Array.from({ length: count }, () => generateInvestorData());
};

module.exports = {
  generateUserData,
  generateInvestorData,
  generateMultipleInvestors
};
```

## Test Scripts

### Package.json Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest tests/unit",
    "test:integration": "jest tests/integration",
    "test:e2e": "jest tests/e2e",
    "test:ci": "jest --ci --coverage --watchAll=false"
  }
}
```

## Best Practices

### Test Organization
- Group related tests in describe blocks
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Keep tests independent and isolated

### Test Data Management
- Use factories for test data generation
- Create reusable test utilities
- Use realistic test data
- Avoid hardcoded values

### Mocking Strategy
- Mock external dependencies
- Use Jest mocks for functions
- Mock database operations when appropriate
- Keep mocks simple and focused

### Performance Considerations
- Use in-memory database for tests
- Clean up after each test
- Use parallel test execution
- Optimize test data setup

This comprehensive testing guide ensures that the TEN Capital backend maintains high quality, reliability, and maintainability through thorough testing at all levels.

