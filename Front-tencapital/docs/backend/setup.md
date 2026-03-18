# TEN Capital - Backend Setup Guide

## Prerequisites

Before setting up the TEN Capital backend, ensure you have the following installed:

- **Node.js**: Version 16.x or higher
- **npm**: Version 8.x or higher (comes with Node.js)
- **MongoDB**: Version 5.x or higher
- **Git**: For version control

## Installation Steps

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ten-capital-backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```bash
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/tencapital
MONGODB_TEST_URI=mongodb://localhost:27017/tencapital_test

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your-refresh-secret-key-here
JWT_REFRESH_EXPIRES_IN=7d

# Security Configuration
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
ALLOWED_FILE_TYPES=xlsx,xls,csv

# AI Service Configuration
AI_SERVICE_URL=http://localhost:8000
AI_SERVICE_TIMEOUT=30000

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Redis Configuration (Optional)
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your-redis-password

# Logging Configuration
LOG_LEVEL=info
LOG_FILE=./logs/app.log
```

### 4. Database Setup

#### MongoDB Installation

**Windows:**
```bash
# Download MongoDB Community Server from https://www.mongodb.com/try/download/community
# Follow installation wizard
# Start MongoDB service
net start MongoDB
```

**macOS:**
```bash
# Using Homebrew
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb/brew/mongodb-community
```

**Linux (Ubuntu/Debian):**
```bash
# Import MongoDB public key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Create list file
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Install MongoDB
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

#### Database Initialization

```bash
# Connect to MongoDB
mongosh

# Create database and collections
use tencapital

# Create indexes for better performance
db.users.createIndex({ "email": 1 }, { unique: true })
db.investors.createIndex({ "email": 1 })
db.investors.createIndex({ "sector": 1 })
db.investors.createIndex({ "location": 1 })
db.exceldata.createIndex({ "userId": 1 })
db.savedfilters.createIndex({ "userId": 1 })
```

### 5. Redis Setup (Optional)

Redis is used for caching and session storage:

**Windows:**
```bash
# Download Redis for Windows from https://github.com/microsoftarchive/redis/releases
# Extract and run redis-server.exe
```

**macOS:**
```bash
brew install redis
brew services start redis
```

**Linux:**
```bash
sudo apt-get install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

### 6. Start the Development Server

```bash
# Development mode with hot reloading
npm run dev

# Or start normally
npm start
```

The server will start on `http://localhost:5000`

## Project Structure

```
backend/
├── src/
│   ├── controllers/         # Request handlers
│   │   ├── authController.js
│   │   ├── investorController.js
│   │   ├── excelController.js
│   │   ├── chartController.js
│   │   └── adminController.js
│   ├── models/             # Database models
│   │   ├── User.js
│   │   ├── Investor.js
│   │   ├── ExcelData.js
│   │   └── SavedFilter.js
│   ├── routes/             # API routes
│   │   ├── auth.js
│   │   ├── investors.js
│   │   ├── excel.js
│   │   ├── charts.js
│   │   └── admin.js
│   ├── middleware/         # Custom middleware
│   │   ├── auth.js
│   │   ├── validation.js
│   │   ├── errorHandler.js
│   │   └── rateLimiter.js
│   ├── services/           # Business logic
│   │   ├── authService.js
│   │   ├── investorService.js
│   │   ├── excelService.js
│   │   ├── aiService.js
│   │   └── emailService.js
│   ├── utils/              # Utility functions
│   │   ├── logger.js
│   │   ├── validator.js
│   │   ├── fileHandler.js
│   │   └── constants.js
│   ├── config/             # Configuration files
│   │   ├── database.js
│   │   ├── redis.js
│   │   └── email.js
│   └── app.js              # Main application file
├── tests/                  # Test files
│   ├── unit/
│   ├── integration/
│   └── fixtures/
├── uploads/                # File upload directory
├── logs/                   # Log files
├── docs/                   # API documentation
├── .env                    # Environment variables
├── .env.example           # Environment variables template
├── package.json           # Dependencies and scripts
├── package-lock.json      # Dependency lock file
└── README.md              # Project documentation
```

## Available Scripts

```bash
# Development
npm run dev          # Start development server with hot reloading
npm start            # Start production server

# Testing
npm test             # Run all tests
npm run test:unit    # Run unit tests only
npm run test:integration # Run integration tests only
npm run test:coverage # Run tests with coverage report

# Database
npm run db:seed      # Seed database with sample data
npm run db:reset     # Reset database (development only)
npm run db:migrate   # Run database migrations

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run format       # Format code with Prettier

# Build
npm run build        # Build for production
npm run build:dev    # Build for development

# Docker
npm run docker:build # Build Docker image
npm run docker:run   # Run Docker container
```

## Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/tencapital` |
| `JWT_SECRET` | Secret key for JWT signing | `your-super-secret-key` |
| `PORT` | Server port | `5000` |

### Optional Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `NODE_ENV` | Environment mode | `development` | `production` |
| `JWT_EXPIRES_IN` | JWT expiration time | `24h` | `7d` |
| `BCRYPT_ROUNDS` | Bcrypt salt rounds | `12` | `15` |
| `MAX_FILE_SIZE` | Maximum file upload size | `10485760` | `20971520` |
| `RATE_LIMIT_MAX_REQUESTS` | Rate limit per window | `100` | `200` |
| `LOG_LEVEL` | Logging level | `info` | `debug` |

## Database Setup Commands

### Create Collections and Indexes

```bash
# Connect to MongoDB
mongosh tencapital

# Create indexes for performance
db.users.createIndex({ "email": 1 }, { unique: true })
db.users.createIndex({ "role": 1 })
db.investors.createIndex({ "email": 1 })
db.investors.createIndex({ "sector": 1 })
db.investors.createIndex({ "location": 1 })
db.investors.createIndex({ "investorType": 1 })
db.investors.createIndex({ "createdAt": -1 })
db.exceldata.createIndex({ "userId": 1 })
db.exceldata.createIndex({ "processed": 1 })
db.savedfilters.createIndex({ "userId": 1 })
db.savedfilters.createIndex({ "isPublic": 1 })
```

### Seed Sample Data

```bash
npm run db:seed
```

This will create:
- Admin user (admin@tencapital.com / admin123)
- Sample investors
- Sample Excel data
- Sample saved filters

## Troubleshooting

### Common Issues

#### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution**: Ensure MongoDB is running
```bash
# Windows
net start MongoDB

# macOS
brew services start mongodb/brew/mongodb-community

# Linux
sudo systemctl start mongod
```

#### Port Already in Use
```
Error: listen EADDRINUSE :::5000
```
**Solution**: Change port or kill existing process
```bash
# Change port in .env
PORT=5001

# Or kill existing process
npx kill-port 5000
```

#### JWT Secret Not Set
```
Error: jwt secret is not defined
```
**Solution**: Set JWT_SECRET in .env file
```bash
JWT_SECRET=your-super-secret-jwt-key-here
```

#### File Upload Issues
```
Error: ENOENT: no such file or directory, open 'uploads/...'
```
**Solution**: Create uploads directory
```bash
mkdir uploads
chmod 755 uploads
```

### Health Check

Test if the backend is running correctly:

```bash
# Health check endpoint
curl http://localhost:5000/api/health

# Expected response
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0",
  "database": "connected",
  "redis": "connected"
}
```

### Logs

Check application logs:

```bash
# View logs in real-time
tail -f logs/app.log

# View error logs only
grep "ERROR" logs/app.log

# View recent logs
tail -n 100 logs/app.log
```

## Development Tools

### Recommended VS Code Extensions

- **ES7+ React/Redux/React-Native snippets**
- **Prettier - Code formatter**
- **ESLint**
- **MongoDB for VS Code**
- **REST Client**
- **Thunder Client**

### API Testing

Use the provided REST client files or tools like Postman:

```bash
# Test authentication
curl -X POST http://localhost:5000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@tencapital.com","password":"admin123"}'

# Test protected endpoint
curl -X GET http://localhost:5000/api/investors \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Next Steps

After successful setup:

1. **Run Tests**: `npm test`
2. **Check API Documentation**: Visit `/api/docs` endpoint
3. **Seed Database**: `npm run db:seed`
4. **Start Frontend**: Follow frontend setup guide
5. **Configure AI Service**: Set up AI service for Excel processing

## Support

For additional help:

- Check the [API Documentation](./api.md)
- Review [Code Structure](./structure-code.md)
- Consult [Security Guide](./securite.md)
- Contact the development team

