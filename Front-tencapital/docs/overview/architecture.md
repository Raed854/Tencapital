# TEN Capital - System Architecture

## Architecture Overview

TEN Capital follows a modern, scalable architecture pattern that separates concerns and enables independent scaling of different components. The system is built using a microservices-inspired approach with clear separation between frontend, backend, and data layers.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    TEN Capital Platform                     │
├─────────────────────────────────────────────────────────────┤
│  Frontend Layer (React SPA)                                │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │   Dashboard │ │   Charts    │ │   Admin     │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │   Auth      │ │   Import    │ │   Profile   │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
├─────────────────────────────────────────────────────────────┤
│  API Gateway / Load Balancer                                │
├─────────────────────────────────────────────────────────────┤
│  Backend Services (Node.js)                                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │   Auth      │ │   Investor  │ │   Excel     │          │
│  │   Service   │ │   Service   │ │   Service   │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │   Chart     │ │   Admin     │ │   AI        │          │
│  │   Service   │ │   Service   │ │   Service   │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
├─────────────────────────────────────────────────────────────┤
│  Data Layer                                                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │   MongoDB   │ │   Redis     │ │   File      │          │
│  │   Database  │ │   Cache     │ │   Storage   │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

## Frontend Architecture

### Technology Stack
- **Framework**: React 18.2.0 with functional components and hooks
- **Routing**: React Router DOM 6.8.1 for client-side routing
- **State Management**: React Context API for global state
- **Styling**: CSS3 with Flexbox and Grid layouts
- **Charts**: Chart.js 4.5.0 with React-Chartjs-2 wrapper
- **HTTP Client**: Axios 1.12.2 for API communication
- **File Processing**: XLSX 0.18.5 for Excel file handling

### Component Architecture

```
src/
├── components/           # Reusable UI components
│   ├── Dashboard/       # Main dashboard component
│   ├── Chart/           # Chart visualization components
│   ├── Login/           # Authentication components
│   ├── Register/        # User registration
│   ├── Profile/         # User profile management
│   ├── Admin/           # Administrative interface
│   ├── AddInvestor/     # Investor management
│   ├── ImportSummary/   # Excel import functionality
│   ├── Navbar/          # Navigation components
│   ├── Sidebar/         # Side navigation
│   ├── Footer/          # Footer component
│   ├── Alert/           # Alert/notification system
│   ├── Tutorial/        # User tutorial system
│   └── ProtectedRoute/  # Route protection
├── contexts/            # React Context providers
│   ├── AlertContext.js  # Global alert management
│   └── ChartContext.js  # Chart data management
├── hooks/               # Custom React hooks
│   ├── useAuth.js       # Authentication hook
│   ├── useAlertInit.js  # Alert initialization
│   └── useTutorial.js   # Tutorial management
├── services/            # API service layers
│   └── authService.js   # Authentication service
├── config/              # Configuration files
│   └── apiConfig.js     # API configuration
└── utils/               # Utility functions
    └── alertUtils.js     # Alert utilities
```

## Backend Architecture

### Technology Stack
- **Runtime**: Node.js with Express.js framework
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **File Processing**: Multer for file uploads
- **Validation**: Joi for request validation
- **Security**: Helmet, CORS, rate limiting

### Service Architecture

#### Core Services
1. **Authentication Service**
   - User registration and login
   - JWT token management
   - Password reset functionality
   - Role-based access control

2. **Investor Management Service**
   - CRUD operations for investor data
   - Search and filtering capabilities
   - Data validation and sanitization
   - Bulk operations support

3. **Excel Processing Service**
   - File upload and validation
   - AI-powered data analysis
   - Intelligent column mapping
   - Data import and export

4. **Chart Data Service**
   - Data aggregation for visualizations
   - Real-time data updates
   - Caching for performance
   - Export capabilities

5. **Administration Service**
   - User management
   - System configuration
   - Audit logging
   - Health monitoring

## Data Architecture

### Database Design (MongoDB)

#### Collections Structure

1. **Users Collection**
```javascript
{
  _id: ObjectId,
  email: String (unique),
  password: String (hashed),
  firstName: String,
  lastName: String,
  role: String, // 'admin', 'user'
  isActive: Boolean,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

2. **Investors Collection**
```javascript
{
  _id: ObjectId,
  investorType: String,
  firstName: String,
  lastName: String,
  email: String,
  phone: String,
  location: String,
  sector: String,
  industries: [String],
  investmentStage: String,
  revenueCriteria: String,
  organizationPersonName: String,
  description: String,
  tags: [String],
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

3. **ExcelData Collection**
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  fileName: String,
  originalFileName: String,
  fileSize: Number,
  headers: [String],
  data: [Object],
  mapping: Object,
  processed: Boolean,
  processingStatus: String,
  errorLog: [String],
  createdAt: Date,
  processedAt: Date
}
```

4. **SavedFilters Collection**
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  filterName: String,
  filters: Object,
  isPublic: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

## Security Architecture

### Authentication & Authorization
- **JWT Tokens**: Stateless authentication with configurable expiration
- **Role-Based Access Control**: Admin and user roles with different permissions
- **Password Security**: Bcrypt hashing with salt rounds
- **Session Management**: Secure session handling with automatic cleanup

### Data Security
- **Input Validation**: Comprehensive validation on all inputs
- **SQL Injection Prevention**: Parameterized queries and input sanitization
- **XSS Protection**: Content Security Policy and input encoding
- **CSRF Protection**: Token-based CSRF protection
- **Rate Limiting**: API rate limiting to prevent abuse

## Performance Architecture

### Caching Strategy
- **Redis Cache**: Session storage and frequently accessed data
- **Browser Caching**: Static assets and API responses
- **Database Indexing**: Optimized database queries with proper indexes
- **CDN**: Content delivery network for static assets

### Scalability Considerations
- **Horizontal Scaling**: Stateless services for easy scaling
- **Database Sharding**: MongoDB sharding for large datasets
- **Load Balancing**: Multiple server instances with load balancing
- **Microservices**: Service decomposition for independent scaling

## Deployment Architecture

### Development Environment
- **Local Development**: Docker containers for consistent environments
- **Hot Reloading**: Development server with hot reloading
- **Mock Data**: Mock API responses for development
- **Debug Tools**: Comprehensive debugging and profiling tools

### Production Environment
- **Railway Deployment**: Cloud platform deployment
- **Environment Configuration**: Environment-specific configurations
- **SSL Certificates**: Automatic SSL certificate management
- **Backup Strategy**: Regular database backups and disaster recovery

## Integration Architecture

### External Integrations
- **Email Service**: SMTP integration for notifications
- **File Storage**: Cloud storage for file management
- **Analytics**: Google Analytics or similar for usage tracking
- **Monitoring**: Application performance monitoring

### API Integrations
- **Third-party APIs**: External service integrations
- **Webhook Support**: Incoming webhook handling
- **Batch Processing**: Scheduled batch operations
- **Data Synchronization**: Real-time data synchronization

This architecture provides a solid foundation for the TEN Capital platform while maintaining flexibility for future growth and enhancements.

