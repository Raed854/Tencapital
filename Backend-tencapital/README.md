# InvestorMatch Backend API

A Node.js Express API with MVC architecture for user registration and management.

## Project Structure

```
backend/
├── config/
│   └── database.js          # Database configuration and connection pool
├── controllers/
│   └── userController.js    # User business logic and request handling
├── middleware/
│   ├── validation.js        # Input validation schemas and middleware
│   └── errorHandler.js      # Global error handling and 404 middleware
├── models/
│   └── User.js              # User data model and database operations
├── routes/
│   ├── index.js             # Main routes configuration
│   └── userRoutes.js        # User-specific routes
├── server.js                # Application entry point
├── package.json
└── README.md
```

## Features

- **MVC Architecture**: Clean separation of concerns with Models, Views (Controllers), and Routes
- **Database Connection Pool**: Efficient MySQL connection management
- **Input Validation**: Comprehensive request validation using Joi
- **Error Handling**: Centralized error handling with proper HTTP status codes
- **Security**: Password hashing with bcrypt, input sanitization
- **Async/Await**: Modern JavaScript with proper error handling

## API Endpoints

### User Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/users/register` | Register a new user |
| POST | `/api/users/check-email` | Check if email exists |
| POST | `/api/users/login` | User login |
| POST | `/api/users/forgot-password` | Get security question for password reset |
| POST | `/api/users/reset-password` | Reset password using security answer |
| GET | `/api/users/profile/:userId` | Get user profile |
| PUT | `/api/users/profile/:userId` | Update user profile |
| DELETE | `/api/users/account/:userId` | Delete user account |

### General

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| GET | `/api` | API documentation |

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file with your database configuration:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=investormatch
PORT=5000
```

3. Start the server:
```bash
# Development
npm run dev

# Production
npm start
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  security_question VARCHAR(255) NOT NULL,
  security_answer VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## Request/Response Examples

### User Registration
```json
POST /api/users/register
{
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "password": "password123",
  "confirmPassword": "password123",
  "securityQuestion": "What is your mother's maiden name?",
  "securityAnswer": "Smith"
}
```

### Response
```json
{
  "success": true,
  "message": "User account created successfully",
  "userId": 1
}
```

### User Login
```json
POST /api/users/login
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Response
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "securityQuestion": "What is your mother's maiden name?",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
}
```

### Forgot Password
```json
POST /api/users/forgot-password
{
  "email": "user@example.com"
}
```

### Response
```json
{
  "success": true,
  "message": "User found",
  "securityQuestion": "What is your mother's maiden name?"
}
```

### Reset Password
```json
POST /api/users/reset-password
{
  "email": "user@example.com",
  "newPassword": "newpassword123",
  "confirmPassword": "newpassword123",
  "securityAnswer": "Smith"
}
```

### Response
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "details": ["Validation error details"]
}
```

## Development

The project uses:
- **Express.js** - Web framework
- **MySQL2** - Database driver with connection pooling
- **Joi** - Input validation
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variable management

## Contributing

1. Follow the MVC pattern
2. Add proper error handling
3. Include input validation
4. Write clear documentation
5. Test all endpoints
