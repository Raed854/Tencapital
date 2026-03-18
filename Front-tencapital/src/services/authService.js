/**
 * Service centralisé pour la gestion de l'authentification JWT
 * Standardise la récupération, stockage et validation des tokens
 */

import { API_CONFIG } from '../config/apiConfig';

// Configure API base URL from centralized config
const API_BASE_URL = API_CONFIG.BASE_URL;

class AuthService {
  constructor() {
    this.TOKEN_KEY = 'token';
    this.USER_ID_KEY = 'userId';
    this.USER_DATA_KEY = 'userData';
    
    // Clés alternatives pour compatibilité
    this.ALTERNATIVE_TOKEN_KEYS = [
      'access_token',
      'auth_token',
      'jwt_token'
    ];
    
    this.ALTERNATIVE_USER_ID_KEYS = [
      'user_id',
      'id',
      'user_id'
    ];
  }

  /**
   * Récupère le token JWT depuis le localStorage ou sessionStorage
   * @returns {string|null} Le token JWT ou null si non trouvé
   */
  getToken() {
    // Essayer localStorage d'abord
    let token = localStorage.getItem(this.TOKEN_KEY);
    
    if (!token) {
      // Essayer les clés alternatives dans localStorage
      for (const key of this.ALTERNATIVE_TOKEN_KEYS) {
        token = localStorage.getItem(key);
        if (token) break;
      }
    }
    
    if (!token) {
      // Essayer sessionStorage
      token = sessionStorage.getItem(this.TOKEN_KEY);
      if (!token) {
        for (const key of this.ALTERNATIVE_TOKEN_KEYS) {
          token = sessionStorage.getItem(key);
          if (token) break;
        }
      }
    }
    
    console.log('🔑 AuthService.getToken():', token ? `${token.substring(0, 20)}...` : 'null');
    return token;
  }

  /**
   * Récupère l'ID utilisateur depuis le localStorage ou sessionStorage
   * @returns {string|null} L'ID utilisateur ou null si non trouvé
   */
  getUserId() {
    // Essayer localStorage d'abord
    let userId = localStorage.getItem(this.USER_ID_KEY);
    
    if (!userId) {
      // Essayer les clés alternatives dans localStorage
      for (const key of this.ALTERNATIVE_USER_ID_KEYS) {
        userId = localStorage.getItem(key);
        if (userId) break;
      }
    }
    
    if (!userId) {
      // Essayer sessionStorage
      userId = sessionStorage.getItem(this.USER_ID_KEY);
      if (!userId) {
        for (const key of this.ALTERNATIVE_USER_ID_KEYS) {
          userId = sessionStorage.getItem(key);
          if (userId) break;
        }
      }
    }
    
    console.log('👤 AuthService.getUserId():', userId || 'null');
    return userId;
  }

  /**
   * Récupère les données utilisateur depuis le localStorage
   * @returns {object|null} Les données utilisateur ou null si non trouvées
   */
  getUserData() {
    try {
      const userData = localStorage.getItem(this.USER_DATA_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des données utilisateur:', error);
      return null;
    }
  }

  /**
   * Récupère le rôle de l'utilisateur depuis les données utilisateur
   * @returns {string|null} Le rôle de l'utilisateur ou null si non trouvé
   */
  getUserRole() {
    try {
      const userData = this.getUserData();
      if (!userData) {
        console.log('👤 Aucune donnée utilisateur trouvée');
        return null;
      }
      
      // Vérifier différents champs possibles pour le rôle
      const role = userData.role || userData.userRole || userData.roleName || userData.role_type;
      
      console.log('👤 Rôle utilisateur:', role || 'null');
      return role;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération du rôle utilisateur:', error);
      return null;
    }
  }

  /**
   * Vérifie si l'utilisateur a le rôle admin
   * @returns {boolean} True si l'utilisateur est admin, false sinon
   */
  isAdmin() {
    const role = this.getUserRole();
    const isAdmin = role && (role.toLowerCase() === 'admin' || role.toLowerCase() === 'administrator');
    console.log('👑 Utilisateur est admin:', isAdmin);
    return isAdmin;
  }

  /**
   * Stocke le token JWT dans le localStorage
   * @param {string} token - Le token JWT à stocker
   */
  setToken(token) {
    if (!token) {
      console.warn('⚠️ Tentative de stockage d\'un token vide');
      return;
    }
    
    localStorage.setItem(this.TOKEN_KEY, token);
    console.log('✅ Token JWT stocké:', `${token.substring(0, 20)}...`);
  }

  /**
   * Stocke l'ID utilisateur dans le localStorage
   * @param {string} userId - L'ID utilisateur à stocker
   */
  setUserId(userId) {
    if (!userId) {
      console.warn('⚠️ Tentative de stockage d\'un userId vide');
      return;
    }
    
    localStorage.setItem(this.USER_ID_KEY, userId);
    console.log('✅ UserId stocké:', userId);
  }

  /**
   * Stocke les données utilisateur dans le localStorage
   * @param {object} userData - Les données utilisateur à stocker
   */
  setUserData(userData) {
    if (!userData) {
      console.warn('⚠️ Tentative de stockage de données utilisateur vides');
      return;
    }
    
    localStorage.setItem(this.USER_DATA_KEY, JSON.stringify(userData));
    console.log('✅ Données utilisateur stockées:', userData);
  }

  /**
   * Stocke toutes les données d'authentification
   * @param {string} token - Le token JWT
   * @param {string} userId - L'ID utilisateur
   * @param {object} userData - Les données utilisateur (optionnel)
   */
  setAuthData(token, userId, userData = null) {
    this.setToken(token);
    this.setUserId(userId);
    if (userData) {
      this.setUserData(userData);
    }
  }

  /**
   * Vérifie si l'utilisateur est authentifié
   * @returns {boolean} True si authentifié, false sinon
   */
  isAuthenticated() {
    const token = this.getToken();
    const userId = this.getUserId();
    
    const isAuth = !!(token && userId);
    console.log('🔐 AuthService.isAuthenticated():', isAuth);
    return isAuth;
  }

  /**
   * Vérifie si le token JWT est valide (non expiré)
   * @returns {boolean} True si le token est valide, false sinon
   */
  isTokenValid() {
    const token = this.getToken();
    if (!token) return false;
    
    try {
      // Décoder le JWT (partie payload)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      
      // Vérifier l'expiration
      if (payload.exp && payload.exp < currentTime) {
        console.warn('⚠️ Token JWT expiré');
        return false;
      }
      
      console.log('✅ Token JWT valide');
      return true;
    } catch (error) {
      console.error('❌ Erreur lors de la validation du token:', error);
      return false;
    }
  }

  /**
   * Récupère les headers d'authentification pour les requêtes API
   * @returns {object} Les headers avec le token Bearer
   */
  getAuthHeaders() {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  /**
   * Déconnecte l'utilisateur en appelant l'API de logout puis en supprimant les données locales
   * @returns {Promise<boolean>} True si logout réussi, false sinon
   */
  async logout() {
    const userId = this.getUserId();
    const token = this.getToken();
    
    console.log('🚪 Début du processus de logout...');
    
    // Appeler l'API de logout si on a un userId et un token
    if (userId && token) {
      try {
        console.log(`📡 Appel de l'API logout pour l'utilisateur: ${userId}`);
        
        const response = await fetch(`${API_BASE_URL}/api/users/logout/${userId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            userId: userId,
            logoutTime: new Date().toISOString()
          })
        });
        
        if (!response.ok) {
          console.warn(`⚠️ Erreur API logout (${response.status}):`, response.statusText);
          // Continuer avec le logout local même si l'API échoue
        } else {
          const data = await response.json();
          console.log('✅ API logout réussie:', data);
        }
      } catch (error) {
        console.error('❌ Erreur lors de l\'appel API logout:', error);
        // Continuer avec le logout local même si l'API échoue
      }
    } else {
      console.warn('⚠️ Pas de userId ou token trouvé, logout local uniquement');
    }
    
    // Nettoyer les données locales
    this.clearLocalData();
    
    // Force clear any remaining authentication state
    this.forceClearAllAuthData();
    
    console.log('🚪 Logout terminé - toutes les données supprimées');
    return true;
  }

  /**
   * Nettoie toutes les données d'authentification stockées localement
   */
  clearLocalData() {
    // Supprimer du localStorage
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_ID_KEY);
    localStorage.removeItem(this.USER_DATA_KEY);
    
    // Supprimer les clés alternatives
    this.ALTERNATIVE_TOKEN_KEYS.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    
    this.ALTERNATIVE_USER_ID_KEYS.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    
    // Supprimer du sessionStorage
    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.USER_ID_KEY);
    sessionStorage.removeItem(this.USER_DATA_KEY);
    
    console.log('🧹 Données locales supprimées');
  }

  /**
   * Force la suppression de toutes les données d'authentification
   * Inclut les données dans sessionStorage, localStorage et les cookies
   */
  forceClearAllAuthData() {
    // Clear localStorage
    localStorage.clear();
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    // Clear any potential cookies (if any)
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    
    console.log('🧹 Toutes les données d\'authentification supprimées (localStorage, sessionStorage, cookies)');
  }

  /**
   * Teste l'API de logout sans effectuer le logout réel
   * @returns {Promise<object>} Résultat du test
   */
  async testLogoutAPI() {
    const userId = this.getUserId();
    const token = this.getToken();
    
    if (!userId || !token) {
      return {
        success: false,
        error: 'No userId or token found',
        message: 'Cannot test logout API without authentication data'
      };
    }
    
    try {
      console.log('🧪 Test de l\'API logout...');
      
      const response = await fetch(`${API_BASE_URL}/api/users/logout/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: userId,
          logoutTime: new Date().toISOString(),
          test: true
        })
      });
      
      const data = await response.json();
      
      return {
        success: response.ok,
        status: response.status,
        data: data,
        message: response.ok ? 'Logout API test successful' : 'Logout API test failed'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Logout API test failed with network error'
      };
    }
  }

  /**
   * Récupère les informations de debug sur l'état d'authentification
   * @returns {object} Informations de debug
   */
  getDebugInfo() {
    return {
      token: this.getToken(),
      userId: this.getUserId(),
      userData: this.getUserData(),
      isAuthenticated: this.isAuthenticated(),
      isTokenValid: this.isTokenValid(),
      localStorage: {
        token: localStorage.getItem(this.TOKEN_KEY),
        userId: localStorage.getItem(this.USER_ID_KEY),
        userData: localStorage.getItem(this.USER_DATA_KEY)
      },
      sessionStorage: {
        token: sessionStorage.getItem(this.TOKEN_KEY),
        userId: sessionStorage.getItem(this.USER_ID_KEY),
        userData: sessionStorage.getItem(this.USER_DATA_KEY)
      }
    };
  }
}

// Créer une instance singleton
const authService = new AuthService();

export default authService;
