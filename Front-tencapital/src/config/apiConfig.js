// Get BASE_URL with proper fallback logic
const getBaseUrl = () => {
  // First, try environment variable
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // In production, use window.location.origin + /api
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    return `${window.location.origin}/api`;
  }
  
  // Development fallback
  return 'http://localhost:5000/api';
};

// API Configuration - All values from environment variables
export const API_CONFIG = {
  // Base URL for API calls - use getter to ensure it's always defined
  get BASE_URL() {
    return getBaseUrl();
  },
  
  // Timeout for API calls
  TIMEOUT: parseInt(process.env.REACT_APP_API_TIMEOUT) || 10000,
  
  // Fallback URLs if main API fails (can be configured via env)
  get FALLBACK_URLS() {
    return process.env.REACT_APP_FALLBACK_URLS 
      ? process.env.REACT_APP_FALLBACK_URLS.split(',')
      : [];
  },
  
  // Check if we're in production
  get IS_PRODUCTION() {
    return process.env.NODE_ENV === 'production';
  },
  
  // Enable debug mode
  get DEBUG() {
    return process.env.REACT_APP_ENABLE_DEBUG === 'true';
  }
};

// Function to get the best available API URL
export const getApiUrl = async () => {
  const urls = [API_CONFIG.BASE_URL, ...API_CONFIG.FALLBACK_URLS];
  
  for (const url of urls) {
    try {
      const response = await fetch(`${url}/health`, {
        method: 'GET',
        timeout: 5000
      });
      
      if (response.ok) {
        if (API_CONFIG.DEBUG) {
          console.log(`✅ API URL working: ${url}`);
        }
        return url;
      }
    } catch (error) {
      if (API_CONFIG.DEBUG) {
        console.log(`❌ API URL failed: ${url}`, error.message);
      }
    }
  }
  
  // If all URLs fail, return the first one as fallback
  console.warn('⚠️ All API URLs failed, using fallback');
  return urls[0];
};

// Function to make API calls with error handling
export const apiCall = async (endpoint, options = {}) => {
  try {
    const baseUrl = await getApiUrl();
    const url = `${baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      timeout: API_CONFIG.TIMEOUT,
      ...options
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Call failed:', error);
    
    // Return mock data for development
    if (!API_CONFIG.IS_PRODUCTION) {
      return {
        success: false,
        message: 'API not available - using mock data',
        data: []
      };
    }
    
    throw error;
  }
};

// Helper function to configure axios
export const configureAxios = (axiosInstance) => {
  if (axiosInstance && axiosInstance.defaults) {
    axiosInstance.defaults.baseURL = API_CONFIG.BASE_URL;
    axiosInstance.defaults.timeout = API_CONFIG.TIMEOUT;
    
    if (API_CONFIG.DEBUG) {
      console.log('🔧 Axios configured with BASE_URL:', API_CONFIG.BASE_URL);
    }
  }
};

export default API_CONFIG;
