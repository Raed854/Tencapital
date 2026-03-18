# TEN Capital - Frontend Setup Guide

## Prerequisites

Before setting up the TEN Capital frontend, ensure you have the following installed:

- **Node.js**: Version 16.x or higher
- **npm**: Version 8.x or higher (comes with Node.js)
- **Git**: For version control
- **Modern Browser**: Chrome, Firefox, Safari, or Edge (latest versions)

## Installation Steps

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ten-capital-frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```bash
# API Configuration
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_API_TIMEOUT=10000
REACT_APP_FALLBACK_URLS=http://localhost:5001/api,http://localhost:5002/api

# Environment
REACT_APP_ENV=development
REACT_APP_ENABLE_DEBUG=true
REACT_APP_ENABLE_ANALYTICS=false

# Feature Flags
REACT_APP_ENABLE_TUTORIAL=true
REACT_APP_ENABLE_CHARTS=true
REACT_APP_ENABLE_EXCEL_IMPORT=true

# External Services
REACT_APP_AI_SERVICE_URL=http://localhost:8000
REACT_APP_FILE_UPLOAD_MAX_SIZE=10485760

# Development Tools
REACT_APP_ENABLE_REDUX_DEVTOOLS=true
REACT_APP_ENABLE_REACT_QUERY_DEVTOOLS=true
```

### 4. Start the Development Server

```bash
# Start development server with hot reloading
npm start

# Or start with specific port
PORT=3001 npm start
```

The application will start on `http://localhost:3000`

## Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── Dashboard/       # Main dashboard component
│   │   ├── Dashboard.js
│   │   ├── Dashboard.css
│   │   └── index.js
│   ├── Chart/           # Chart visualization components
│   │   ├── Chart.js
│   │   ├── Chart.css
│   │   └── index.js
│   ├── Login/           # Authentication components
│   │   ├── Login.js
│   │   ├── Login.css
│   │   └── index.js
│   ├── Register/        # User registration
│   │   ├── Register.js
│   │   ├── Register.css
│   │   └── index.js
│   ├── Profile/         # User profile management
│   │   ├── Profile.js
│   │   ├── Profile.css
│   │   └── index.js
│   ├── Admin/           # Administrative interface
│   │   ├── Admin.js
│   │   ├── Admin.css
│   │   └── index.js
│   ├── AddInvestor/     # Investor management
│   │   ├── AddInvestor.js
│   │   ├── AddInvestor.css
│   │   └── index.js
│   ├── ImportSummary/   # Excel import functionality
│   │   ├── ImportSummary.js
│   │   ├── ImportSummary.css
│   │   ├── ImportSummaryExample.js
│   │   └── index.js
│   ├── Navbar/          # Navigation components
│   │   ├── Navbar.js
│   │   ├── Navbar.css
│   │   └── index.js
│   ├── Sidebar/         # Side navigation
│   │   ├── Sidebar.js
│   │   ├── Sidebar.css
│   │   └── index.js
│   ├── Footer/          # Footer component
│   │   ├── Footer.js
│   │   ├── Footer.css
│   │   └── index.js
│   ├── Alert/           # Alert/notification system
│   │   ├── Alert.js
│   │   ├── Alert.css
│   │   └── index.js
│   ├── Tutorial/        # User tutorial system
│   │   ├── Tutorial.js
│   │   ├── Tutorial.css
│   │   └── index.js
│   └── ProtectedRoute/  # Route protection
│       ├── ProtectedRoute.js
│       ├── ProtectedRoute.css
│       └── index.js
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
├── utils/               # Utility functions
│   └── alertUtils.js    # Alert utilities
├── App.js               # Main application component
├── App.css              # Global styles
├── index.js             # Application entry point
├── index.css            # Global CSS
└── index.jsx            # Alternative entry point
```

## Available Scripts

```bash
# Development
npm start                # Start development server
npm run dev              # Alternative development command

# Building
npm run build            # Build for production
npm run build:dev        # Build for development
npm run build:analyze    # Build with bundle analysis

# Testing
npm test                 # Run tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage
npm run test:ci          # Run tests for CI/CD

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
npm run format           # Format code with Prettier
npm run type-check       # Run TypeScript type checking

# Utilities
npm run eject            # Eject from Create React App
npm run precommit        # Run pre-commit checks
npm run postinstall      # Run post-install scripts
```

## Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `REACT_APP_API_URL` | Backend API URL | `http://localhost:5000/api` |

### Optional Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `REACT_APP_ENV` | Environment mode | `development` | `production` |
| `REACT_APP_API_TIMEOUT` | API request timeout | `10000` | `15000` |
| `REACT_APP_ENABLE_DEBUG` | Enable debug logging | `false` | `true` |
| `REACT_APP_ENABLE_ANALYTICS` | Enable analytics | `false` | `true` |
| `REACT_APP_ENABLE_TUTORIAL` | Enable tutorial system | `true` | `false` |
| `REACT_APP_ENABLE_CHARTS` | Enable chart features | `true` | `false` |
| `REACT_APP_ENABLE_EXCEL_IMPORT` | Enable Excel import | `true` | `false` |

## Development Tools

### Recommended VS Code Extensions

- **ES7+ React/Redux/React-Native snippets**
- **Prettier - Code formatter**
- **ESLint**
- **Auto Rename Tag**
- **Bracket Pair Colorizer**
- **GitLens**
- **Thunder Client**
- **REST Client**

### VS Code Settings

Create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "emmet.includeLanguages": {
    "javascript": "javascriptreact"
  },
  "files.associations": {
    "*.js": "javascriptreact"
  }
}
```

### Browser Developer Tools

#### Chrome DevTools
- **React Developer Tools**: Install Chrome extension
- **Redux DevTools**: Install Chrome extension
- **Network Tab**: Monitor API calls
- **Console**: Debug JavaScript errors
- **Performance Tab**: Analyze performance

#### Firefox Developer Tools
- **React Developer Tools**: Install Firefox add-on
- **Network Monitor**: Monitor API calls
- **Console**: Debug JavaScript errors
- **Performance**: Analyze performance

## API Integration

### API Configuration

The frontend uses a centralized API configuration system:

```javascript
// src/config/apiConfig.js
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  TIMEOUT: parseInt(process.env.REACT_APP_API_TIMEOUT) || 10000,
  FALLBACK_URLS: process.env.REACT_APP_FALLBACK_URLS?.split(',') || [],
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  DEBUG: process.env.REACT_APP_ENABLE_DEBUG === 'true'
};
```

### Authentication Service

The frontend includes a comprehensive authentication service:

```javascript
// src/services/authService.js
import { API_CONFIG } from '../config/apiConfig';

class AuthService {
  getToken() {
    return localStorage.getItem('token');
  }

  setToken(token) {
    localStorage.setItem('token', token);
  }

  isAuthenticated() {
    const token = this.getToken();
    const userId = this.getUserId();
    return !!(token && userId);
  }

  async logout() {
    // Implementation details in authService.js
  }
}

export default new AuthService();
```

## Component Development

### Component Structure

Each component follows a consistent structure:

```javascript
// Component.js
import React, { useState, useEffect } from 'react';
import './Component.css';

const Component = ({ prop1, prop2 }) => {
  const [state, setState] = useState(initialValue);

  useEffect(() => {
    // Side effects
  }, [dependencies]);

  const handleEvent = (event) => {
    // Event handling
  };

  return (
    <div className="component">
      {/* Component JSX */}
    </div>
  );
};

export default Component;
```

### CSS Organization

```css
/* Component.css */
.component {
  /* Component styles */
}

.component__element {
  /* Element styles */
}

.component--modifier {
  /* Modifier styles */
}

/* Responsive design */
@media (max-width: 768px) {
  .component {
    /* Mobile styles */
  }
}
```

## Testing Setup

### Test Configuration

The project uses Jest and React Testing Library for testing:

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx}'
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/index.js',
    '!src/setupTests.js'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

### Test Setup

```javascript
// src/setupTests.js
import '@testing-library/jest-dom';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
```

## Build and Deployment

### Production Build

```bash
# Create production build
npm run build

# Build will be created in 'build' directory
# Contains optimized, minified files
```

### Build Analysis

```bash
# Analyze bundle size
npm run build:analyze

# Opens bundle analyzer in browser
# Shows which packages contribute to bundle size
```

### Deployment

#### Railway Deployment

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Deploy
railway up
```

#### Manual Deployment

```bash
# Build for production
npm run build

# Upload build directory to web server
# Configure web server to serve index.html for all routes
```

## Troubleshooting

### Common Issues

#### Port Already in Use
```
Error: listen EADDRINUSE :::3000
```
**Solution**: Use a different port
```bash
PORT=3001 npm start
```

#### Module Not Found
```
Module not found: Can't resolve 'module-name'
```
**Solution**: Install missing dependency
```bash
npm install module-name
```

#### Build Errors
```
Failed to compile
```
**Solution**: Check for syntax errors and missing dependencies
```bash
npm run lint
npm install
```

#### API Connection Issues
```
Network Error: Failed to fetch
```
**Solution**: Check API configuration and backend status
```bash
# Check API health
curl http://localhost:5000/api/health

# Check environment variables
echo $REACT_APP_API_URL
```

### Debug Mode

Enable debug mode for detailed logging:

```bash
# Set debug environment variable
REACT_APP_ENABLE_DEBUG=true npm start

# Check browser console for debug messages
```

### Performance Issues

#### Slow Development Server
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Large Bundle Size
```bash
# Analyze bundle
npm run build:analyze

# Check for unused dependencies
npm run lint
```

## Best Practices

### Code Organization
- Keep components small and focused
- Use custom hooks for reusable logic
- Organize imports consistently
- Follow naming conventions

### Performance
- Use React.memo for expensive components
- Implement proper key props for lists
- Lazy load components when appropriate
- Optimize images and assets

### Accessibility
- Use semantic HTML elements
- Provide alt text for images
- Ensure keyboard navigation
- Test with screen readers

### Security
- Sanitize user inputs
- Use HTTPS in production
- Implement proper authentication
- Validate data from APIs

## Next Steps

After successful setup:

1. **Run Tests**: `npm test`
2. **Check Linting**: `npm run lint`
3. **Start Development**: `npm start`
4. **Review Components**: Explore the component library
5. **Configure Backend**: Ensure backend is running
6. **Test Features**: Try all application features

## Support

For additional help:

- Check the [Code Structure Guide](./structure-code.md)
- Review [UI Guide](./ui-guide.md)
- Consult [Testing Guide](./tests.md)
- Contact the development team









