# TEN Capital - Backend Security Guide

## Security Overview

The TEN Capital backend implements comprehensive security measures to protect user data, prevent unauthorized access, and ensure system integrity. This guide covers all security implementations and best practices.

## Authentication & Authorization

### JWT Token Security

#### Token Generation
```javascript
// JWT token with secure configuration
const generateToken = (userId) => {
  return jwt.sign(
    { 
      id: userId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    },
    process.env.JWT_SECRET,
    { 
      algorithm: 'HS256',
      issuer: 'tencapital-api',
      audience: 'tencapital-client'
    }
  );
};
```

#### Token Validation
```javascript
// Secure token verification
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: 'tencapital-api',
      audience: 'tencapital-client'
    });
  } catch (error) {
    throw new Error('Invalid token');
  }
};
```

#### Refresh Token Strategy
```javascript
// Refresh token implementation
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { 
      expiresIn: '7d',
      algorithm: 'HS256'
    }
  );
};
```

### Password Security

#### Password Hashing
```javascript
// Secure password hashing with bcrypt
const hashPassword = async (password) => {
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  return await bcrypt.hash(password, saltRounds);
};

// Password comparison
const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};
```

#### Password Validation
```javascript
// Strong password requirements
const passwordSchema = Joi.object({
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])'))
    .required()
    .messages({
      'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'
    })
});
```

### Role-Based Access Control (RBAC)

#### Role Definitions
```javascript
const ROLES = {
  ADMIN: 'admin',
  USER: 'user'
};

const PERMISSIONS = {
  ADMIN: [
    'users:read',
    'users:write',
    'users:delete',
    'investors:read',
    'investors:write',
    'investors:delete',
    'excel:read',
    'excel:write',
    'charts:read',
    'admin:access'
  ],
  USER: [
    'investors:read',
    'investors:write',
    'excel:read',
    'excel:write',
    'charts:read'
  ]
};
```

#### Permission Middleware
```javascript
// Check user permissions
const checkPermission = (permission) => {
  return (req, res, next) => {
    const userRole = req.user.role;
    const userPermissions = PERMISSIONS[userRole.toUpperCase()];
    
    if (!userPermissions || !userPermissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }
    
    next();
  };
};
```

## Input Validation & Sanitization

### Request Validation

#### Joi Schema Validation
```javascript
// User registration validation
const registerSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .normalize()
    .trim(),
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])'))
    .required(),
  firstName: Joi.string()
    .min(2)
    .max(50)
    .required()
    .trim()
    .escape(),
  lastName: Joi.string()
    .min(2)
    .max(50)
    .required()
    .trim()
    .escape()
});
```

#### Input Sanitization
```javascript
// HTML sanitization
const sanitizeHtml = require('sanitize-html');

const sanitizeInput = (input) => {
  return sanitizeHtml(input, {
    allowedTags: [],
    allowedAttributes: {}
  });
};

// SQL injection prevention
const sanitizeQuery = (query) => {
  return query.replace(/['"\\]/g, '');
};
```

### File Upload Security

#### File Validation
```javascript
// Secure file upload validation
const fileUploadValidation = (req, res, next) => {
  const allowedTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'No file uploaded'
    });
  }
  
  if (!allowedTypes.includes(req.file.mimetype)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid file type. Only Excel files are allowed.'
    });
  }
  
  if (req.file.size > maxSize) {
    return res.status(400).json({
      success: false,
      error: 'File too large. Maximum size is 10MB.'
    });
  }
  
  next();
};
```

#### File Storage Security
```javascript
// Secure file storage
const multerConfig = {
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = path.join(__dirname, '../uploads');
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const sanitizedName = sanitizeInput(file.originalname);
      cb(null, `${uniqueSuffix}-${sanitizedName}`);
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1
  }
};
```

## Database Security

### MongoDB Security

#### Connection Security
```javascript
// Secure MongoDB connection
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};
```

#### Query Security
```javascript
// Parameterized queries to prevent injection
const findInvestors = async (filters) => {
  const query = {};
  
  if (filters.sector) {
    query.sector = { $regex: new RegExp(filters.sector, 'i') };
  }
  
  if (filters.location) {
    query.location = { $regex: new RegExp(filters.location, 'i') };
  }
  
  return await Investor.find(query).lean();
};
```

#### Data Encryption
```javascript
// Sensitive data encryption
const crypto = require('crypto');

const encryptSensitiveData = (data) => {
  const algorithm = 'aes-256-gcm';
  const key = crypto.scryptSync(process.env.ENCRYPTION_KEY, 'salt', 32);
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipher(algorithm, key);
  cipher.setAAD(Buffer.from('tencapital', 'utf8'));
  
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
};
```

## API Security

### Rate Limiting

#### Express Rate Limit
```javascript
const rateLimit = require('express-rate-limit');

// General API rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Authentication rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later.'
  }
});
```

### CORS Configuration

```javascript
// Secure CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'https://app.tencapital.com',
      'https://staging.tencapital.com'
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset']
};
```

### Security Headers

```javascript
// Helmet.js security headers
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

## Session Security

### Session Configuration
```javascript
// Secure session configuration
const session = require('express-session');
const MongoStore = require('connect-mongo');

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    touchAfter: 24 * 3600 // lazy session update
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'strict'
  },
  name: 'tencapital.sid'
}));
```

## Logging & Monitoring

### Security Logging
```javascript
// Security event logging
const winston = require('winston');

const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: 'logs/security.log',
      level: 'info'
    })
  ]
});

// Log security events
const logSecurityEvent = (event, details) => {
  securityLogger.info({
    event,
    details,
    timestamp: new Date().toISOString(),
    ip: details.ip,
    userAgent: details.userAgent
  });
};
```

### Audit Trail
```javascript
// Audit trail middleware
const auditTrail = (action) => {
  return (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Log audit trail
      auditLogger.info({
        action,
        userId: req.user?.id,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString(),
        success: res.statusCode < 400
      });
      
      originalSend.call(this, data);
    };
    
    next();
  };
};
```

## Environment Security

### Environment Variables
```bash
# Production environment variables
NODE_ENV=production
PORT=5000

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/tencapital
MONGODB_SSL=true
MONGODB_AUTH_SOURCE=admin

# JWT Secrets (use strong, random secrets)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
JWT_REFRESH_SECRET=your-refresh-secret-key-minimum-32-characters
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Security
BCRYPT_ROUNDS=12
SESSION_SECRET=your-session-secret-minimum-32-characters
ENCRYPTION_KEY=your-encryption-key-32-characters

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
ALLOWED_FILE_TYPES=xlsx,xls,csv

# AI Service
AI_SERVICE_URL=https://ai-service.tencapital.com
AI_SERVICE_TIMEOUT=30000

# Email (if using email features)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@tencapital.com
SMTP_PASS=your-app-password

# Redis (if using Redis)
REDIS_URL=redis://redis-cluster:6379
REDIS_PASSWORD=your-redis-password

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/app.log
```

## Security Testing

### Security Test Suite
```javascript
// Security tests
describe('Security Tests', () => {
  describe('Authentication', () => {
    it('should reject invalid JWT tokens', async () => {
      const response = await request(app)
        .get('/api/investors')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
      
      expect(response.body.success).toBe(false);
    });
    
    it('should enforce password complexity', async () => {
      const response = await request(app)
        .post('/api/users/register')
        .send({
          email: 'test@example.com',
          password: 'weak',
          firstName: 'Test',
          lastName: 'User'
        })
        .expect(400);
      
      expect(response.body.error).toContain('Password must contain');
    });
  });
  
  describe('Input Validation', () => {
    it('should sanitize HTML input', async () => {
      const response = await request(app)
        .post('/api/investors')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          firstName: '<script>alert("xss")</script>',
          lastName: 'Test',
          email: 'test@example.com',
          location: 'Test',
          sector: 'Test'
        })
        .expect(201);
      
      expect(response.body.data.firstName).not.toContain('<script>');
    });
  });
});
```

## Security Checklist

### Pre-Production Security Checklist

- [ ] **Authentication**
  - [ ] Strong JWT secrets configured
  - [ ] Password complexity enforced
  - [ ] Account lockout implemented
  - [ ] Session timeout configured

- [ ] **Authorization**
  - [ ] RBAC implemented
  - [ ] Permission checks on all endpoints
  - [ ] Admin-only endpoints protected

- [ ] **Input Validation**
  - [ ] All inputs validated
  - [ ] SQL injection prevention
  - [ ] XSS protection implemented
  - [ ] File upload validation

- [ ] **API Security**
  - [ ] Rate limiting configured
  - [ ] CORS properly configured
  - [ ] Security headers set
  - [ ] HTTPS enforced

- [ ] **Database Security**
  - [ ] Connection encryption
  - [ ] Query parameterization
  - [ ] Sensitive data encryption
  - [ ] Regular backups

- [ ] **Monitoring**
  - [ ] Security logging enabled
  - [ ] Audit trail implemented
  - [ ] Error monitoring configured
  - [ ] Performance monitoring

This comprehensive security guide ensures that the TEN Capital backend maintains the highest security standards to protect user data and system integrity.

