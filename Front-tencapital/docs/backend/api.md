# TEN Capital - Backend API Documentation

## Overview

The TEN Capital backend provides a RESTful API for managing investors, processing Excel files, and handling user authentication. All API endpoints follow consistent patterns and return standardized responses.

## Base URL

- **Development**: `http://localhost:5000/api`
- **Production**: `https://api.tencapital.com/api`

## Authentication

Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Response Format

All API responses follow this standard format:

### Success Response
```json
{
  "success": true,
  "data": <response-data>,
  "message": "Operation completed successfully",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## API Endpoints

### Authentication Endpoints

#### POST /users/register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user-id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user",
    "token": "jwt-token"
  },
  "message": "User registered successfully"
}
```

#### POST /users/login
Authenticate user and return JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user-id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user",
    "token": "jwt-token"
  },
  "message": "Login successful"
}
```

#### POST /users/logout/:userId
Logout user and invalidate token.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

#### GET /users/profile
Get current user profile.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user-id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user",
    "isActive": true,
    "lastLogin": "2024-01-01T00:00:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### PUT /users/profile
Update user profile.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user-id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "role": "user",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Profile updated successfully"
}
```

### Investor Management Endpoints

#### GET /investors
Get list of investors with pagination and filtering.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `sector` (optional): Filter by sector
- `location` (optional): Filter by location
- `investorType` (optional): Filter by investor type
- `search` (optional): Search in name and email

**Response:**
```json
{
  "success": true,
  "data": {
    "investors": [
      {
        "id": "investor-id",
        "investorType": "Individual",
        "firstName": "Jane",
        "lastName": "Smith",
        "email": "jane@example.com",
        "phone": "+1234567890",
        "location": "New York",
        "sector": "Technology",
        "industries": ["Software", "AI"],
        "investmentStage": "Series A",
        "revenueCriteria": ">$1M",
        "description": "Tech investor",
        "tags": ["tech", "ai"],
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 50,
      "itemsPerPage": 10
    }
  }
}
```

#### POST /investors
Create a new investor.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "investorType": "Individual",
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@example.com",
  "phone": "+1234567890",
  "location": "New York",
  "sector": "Technology",
  "industries": ["Software", "AI"],
  "investmentStage": "Series A",
  "revenueCriteria": ">$1M",
  "description": "Tech investor",
  "tags": ["tech", "ai"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "investor-id",
    "investorType": "Individual",
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane@example.com",
    "phone": "+1234567890",
    "location": "New York",
    "sector": "Technology",
    "industries": ["Software", "AI"],
    "investmentStage": "Series A",
    "revenueCriteria": ">$1M",
    "description": "Tech investor",
    "tags": ["tech", "ai"],
    "createdBy": "user-id",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Investor created successfully"
}
```

#### GET /investors/:id
Get investor by ID.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "investor-id",
    "investorType": "Individual",
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane@example.com",
    "phone": "+1234567890",
    "location": "New York",
    "sector": "Technology",
    "industries": ["Software", "AI"],
    "investmentStage": "Series A",
    "revenueCriteria": ">$1M",
    "description": "Tech investor",
    "tags": ["tech", "ai"],
    "createdBy": "user-id",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### PUT /investors/:id
Update investor by ID.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "phone": "+1234567890",
  "description": "Updated description"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "investor-id",
    "investorType": "Individual",
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane@example.com",
    "phone": "+1234567890",
    "location": "New York",
    "sector": "Technology",
    "industries": ["Software", "AI"],
    "investmentStage": "Series A",
    "revenueCriteria": ">$1M",
    "description": "Updated description",
    "tags": ["tech", "ai"],
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Investor updated successfully"
}
```

#### DELETE /investors/:id
Delete investor by ID.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Investor deleted successfully"
}
```

### Excel Processing Endpoints

#### POST /excel/upload
Upload Excel file for processing.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body:**
```
file: <excel-file>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "fileId": "file-id",
    "fileName": "investors.xlsx",
    "fileSize": 1024000,
    "headers": ["Name", "Email", "Sector", "Location"],
    "rowCount": 100,
    "uploadedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "File uploaded successfully"
}
```

#### POST /excel/analyze-headers
Analyze Excel headers using AI.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "fileId": "file-id",
  "headers": ["Name", "Email", "Sector", "Location"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "mapping": {
      "Name": {
        "field": "firstName",
        "confidence": 0.95,
        "suggested": true
      },
      "Email": {
        "field": "email",
        "confidence": 0.98,
        "suggested": true
      },
      "Sector": {
        "field": "sector",
        "confidence": 0.92,
        "suggested": true
      },
      "Location": {
        "field": "location",
        "confidence": 0.88,
        "suggested": true
      }
    },
    "overallConfidence": 0.93,
    "suggestions": [
      "Consider splitting 'Name' into 'firstName' and 'lastName'",
      "Add 'investorType' field for better categorization"
    ]
  },
  "message": "Header analysis completed"
}
```

#### POST /excel/validate-mapping
Validate field mapping before import.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "fileId": "file-id",
  "mapping": {
    "Name": "firstName",
    "Email": "email",
    "Sector": "sector",
    "Location": "location"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "warnings": [
      "Some rows have missing email addresses",
      "Location field contains inconsistent formats"
    ],
    "errors": [],
    "preview": [
      {
        "firstName": "John",
        "email": "john@example.com",
        "sector": "Technology",
        "location": "New York"
      }
    ]
  },
  "message": "Mapping validation completed"
}
```

#### POST /excel/import
Import Excel data using validated mapping.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "fileId": "file-id",
  "mapping": {
    "Name": "firstName",
    "Email": "email",
    "Sector": "sector",
    "Location": "location"
  },
  "options": {
    "skipDuplicates": true,
    "validateEmails": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "imported": 95,
    "skipped": 5,
    "errors": 0,
    "importId": "import-id",
    "importedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Data imported successfully"
}
```

### Chart Data Endpoints

#### GET /charts/sectors
Get investor data grouped by sectors.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "labels": ["Technology", "Healthcare", "Finance", "Manufacturing"],
    "datasets": [
      {
        "label": "Investors by Sector",
        "data": [45, 30, 20, 15],
        "backgroundColor": ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0"]
      }
    ]
  }
}
```

#### GET /charts/locations
Get investor data grouped by locations.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "labels": ["New York", "San Francisco", "London", "Tokyo"],
    "datasets": [
      {
        "label": "Investors by Location",
        "data": [35, 25, 20, 15],
        "backgroundColor": ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0"]
      }
    ]
  }
}
```

#### GET /charts/investor-types
Get investor data grouped by types.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "labels": ["Individual", "Institution", "Fund", "Corporate"],
    "datasets": [
      {
        "label": "Investors by Type",
        "data": [40, 30, 20, 10],
        "backgroundColor": ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0"]
      }
    ]
  }
}
```

### Admin Endpoints

#### GET /admin/users
Get all users (admin only).

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "user-id",
        "email": "user@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "role": "user",
        "isActive": true,
        "lastLogin": "2024-01-01T00:00:00.000Z",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalItems": 15,
      "itemsPerPage": 10
    }
  }
}
```

#### PUT /admin/users/:id/role
Update user role (admin only).

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Request Body:**
```json
{
  "role": "admin"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user-id",
    "email": "user@example.com",
    "role": "admin",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "User role updated successfully"
}
```

### Health Check Endpoint

#### GET /health
Check API health status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0",
  "uptime": 3600,
  "memory": {
    "rss": 50000000,
    "heapTotal": 20000000,
    "heapUsed": 15000000,
    "external": 1000000
  },
  "database": "connected",
  "redis": "connected"
}
```

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input data |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists |
| 422 | Unprocessable Entity - Validation failed |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |

## Rate Limiting

API requests are rate limited to prevent abuse:

- **General endpoints**: 100 requests per 15 minutes
- **Authentication endpoints**: 5 requests per 15 minutes
- **File upload endpoints**: 10 requests per 15 minutes

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Pagination

List endpoints support pagination with these query parameters:

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)

Pagination information is included in the response:
```json
{
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 50,
    "itemsPerPage": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

This API documentation provides comprehensive information for integrating with the TEN Capital backend services.

