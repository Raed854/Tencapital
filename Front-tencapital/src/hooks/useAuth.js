import { useState, useEffect } from 'react';
import authService from '../services/authService';

/**
 * Hook personnalisé pour gérer l'authentification
 * Fournit un état réactif de l'authentification dans les composants
 */
export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    setIsLoading(true);
    
    const authenticated = authService.isAuthenticated();
    const tokenValid = authService.isTokenValid();
    const userData = authService.getUserData();
    
    setIsAuthenticated(authenticated && tokenValid);
    setUser(userData);
    setIsLoading(false);
    
    console.log('🔐 useAuth - État d\'authentification:', {
      authenticated,
      tokenValid,
      hasUser: !!userData,
      finalAuth: authenticated && tokenValid
    });
  };

  const login = (token, userId, userData) => {
    authService.setAuthData(token, userId, userData);
    checkAuthStatus();
  };

  const logout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setUser(null);
  };

  const refreshAuth = () => {
    checkAuthStatus();
  };

  return {
    isAuthenticated,
    isLoading,
    user,
    login,
    logout,
    refreshAuth,
    // Méthodes utilitaires
    getToken: authService.getToken,
    getUserId: authService.getUserId,
    getAuthHeaders: authService.getAuthHeaders
  };
};

export default useAuth;
