# Environment Configuration Guide

## Overview
This project now uses centralized environment configuration through `.env` files. All API URLs and configuration values are managed through environment variables.

## Files Structure

### `.env` (Local Development)
- **Purpose**: Local development configuration
- **Location**: Root directory
- **Status**: ✅ Created (not tracked by git)
- **Usage**: Automatically loaded by React during development

### `.env.example` (Template)
- **Purpose**: Template for environment variables
- **Location**: Root directory
- **Status**: ✅ Created (tracked by git)
- **Usage**: Copy this file to `.env` and customize values

### `railway.env` (Production)
- **Purpose**: Production deployment configuration for Railway
- **Location**: Root directory
- **Status**: ✅ Updated
- **Usage**: Used during Railway deployment

### `.env.production` (Production Build)
- **Purpose**: Production build configuration
- **Location**: Root directory
- **Status**: ✅ Exists
- **Usage**: Used during `npm run build`

## Updated Files

All files now use the centralized `API_CONFIG` from `src/config/apiConfig.js`:

1. ✅ `src/config/apiConfig.js` - Centralized configuration (no hardcoded URLs)
2. ✅ `src/services/authService.js` - Uses API_CONFIG
3. ✅ `src/components/Admin/Admin.js` - Uses API_CONFIG
4. ✅ `src/components/Login/Login.js` - Uses API_CONFIG
5. ✅ `src/components/Register/Register.js` - Uses API_CONFIG
6. ✅ `src/components/Sidebar/Sidebar.js` - Uses API_CONFIG
7. ✅ `src/components/Profile/Profile.js` - Uses API_CONFIG
8. ✅ `src/components/ForgotPassword/ForgotPassword.js` - Uses API_CONFIG
9. ✅ `src/components/AddInvestor/AddInvestor.js` - Uses API_CONFIG
10. ✅ `src/components/Chart/Chart.js` - Uses API_CONFIG
11. ✅ `src/components/Dashboard/Dashboard.js` - Uses API_CONFIG

## Environment Variables

### Required Variables

```bash
# API Configuration
REACT_APP_API_URL=http://localhost:5000        # Backend API URL
REACT_APP_API_TIMEOUT=10000                    # Request timeout in ms

# Optional: Comma-separated fallback URLs
REACT_APP_FALLBACK_URLS=                       # Leave empty or add: url1,url2,url3
```

### Optional Variables

```bash
# Public URL
REACT_APP_PUBLIC_URL=http://localhost:3000

# Environment
NODE_ENV=development

# Authentication
REACT_APP_JWT_SECRET=your-jwt-secret-key
REACT_APP_TOKEN_EXPIRY=24h

# Feature Flags
REACT_APP_ENABLE_ANALYTICS=false
REACT_APP_ENABLE_DEBUG=true

# Chart.js
REACT_APP_CHART_DEFAULT_COLOR=#3b82f6
REACT_APP_CHART_BACKGROUND_COLOR=rgba(59, 130, 246, 0.1)

# File Upload
REACT_APP_MAX_FILE_SIZE=10485760
REACT_APP_ALLOWED_FILE_TYPES=.xlsx,.xls,.csv

# Security
REACT_APP_CORS_ORIGIN=http://localhost:3000
REACT_APP_SECURE_COOKIES=false

# Performance
REACT_APP_LAZY_LOADING=true
REACT_APP_CODE_SPLITTING=true
```

## How to Use

### For Local Development

1. Copy the example file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your local values:
   ```bash
   REACT_APP_API_URL=http://localhost:5000
   ```

3. Start the development server:
   ```bash
   npm start
   ```

### For Production

1. Set environment variables in your deployment platform (Railway, Heroku, etc.)

2. Or use the `railway.env` file for Railway deployment

3. Build the project:
   ```bash
   npm run build
   ```

## Benefits of This Approach

✅ **No Hardcoded URLs**: All URLs are now environment-based
✅ **Single Source of Truth**: `apiConfig.js` is the only config file
✅ **Easy Environment Switching**: Change `.env` file for different environments
✅ **Secure**: `.env` file is git-ignored and won't be committed
✅ **Flexible**: Easy to add new configuration values
✅ **Maintainable**: All components import from one central config

## Migration Complete

All hardcoded `http://localhost:5000` values have been removed and replaced with environment variables. The application now properly uses `.env` files for configuration.

## Important Notes

⚠️ **Never commit `.env` files** - They contain sensitive information
✅ **Always update `.env.example`** - When adding new environment variables
✅ **Document new variables** - Add them to this README
✅ **Use meaningful names** - Prefix with `REACT_APP_` for React to recognize them

## Troubleshooting

### API URL not working?
1. Check if `.env` file exists in root directory
2. Verify `REACT_APP_API_URL` is set correctly
3. Restart the development server (environment changes require restart)

### Changes not reflected?
- React requires restart when environment variables change
- Run: `npm start` again after editing `.env`

### Production deployment issues?
- Verify environment variables are set in deployment platform
- Check build logs for environment variable loading
- Ensure `railway.env` or platform-specific env vars are configured
