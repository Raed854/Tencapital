import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import authService from '../../services/authService';
import './Navbar.css';

const Navbar = ({ onStartTutorial }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showDebugTools, setShowDebugTools] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userData, setUserData] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Vérifier le rôle de l'utilisateur au chargement
  useEffect(() => {
    const checkAdminRole = () => {
      const adminStatus = authService.isAdmin();
      setIsAdmin(adminStatus);
      console.log('🔍 Vérification du rôle admin:', adminStatus);
    };

    const loadUserData = () => {
      const storedUserData = authService.getUserData();
      if (storedUserData) {
        setUserData(storedUserData);
        console.log('👤 Données utilisateur chargées:', storedUserData);
      }
    };

    checkAdminRole();
    loadUserData();

    // Écouter les changements de données utilisateur (si l'utilisateur met à jour son profil)
    const handleStorageChange = (e) => {
      if (e.key === 'userData' || e.key === 'token') {
        console.log('🔄 Données utilisateur mises à jour, re-vérification du rôle admin');
        checkAdminRole();
        loadUserData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Fermer le menu déroulant quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserMenu && !event.target.closest('.user-profile')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  const handleNavigation = (path) => {
    navigate(path);
  };

  // Fonction pour forcer la vérification du rôle admin
  const refreshAdminStatus = () => {
    const adminStatus = authService.isAdmin();
    setIsAdmin(adminStatus);
    console.log('🔄 Statut admin rafraîchi:', adminStatus);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    
    try {
      console.log('🚪 Début du processus de logout...');
      
      // Utiliser le service d'authentification pour la déconnexion
      const logoutSuccess = await authService.logout();
      
      if (logoutSuccess) {
        console.log('✅ Logout réussi, redirection vers login...');
        // Force page reload to ensure clean state
        window.location.href = '/login';
      } else {
        console.warn('⚠️ Logout partiellement réussi, redirection quand même...');
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('❌ Erreur lors du logout:', error);
      // Même en cas d'erreur, rediriger vers login
      alert('Une erreur est survenue lors de la déconnexion, mais vous allez être redirigé vers la page de connexion.');
      window.location.href = '/login';
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleTestLogoutAPI = async () => {
    try {
      console.log('🧪 Test de l\'API logout...');
      const result = await authService.testLogoutAPI();
      console.log('Résultat du test logout API:', result);
      
      if (result.success) {
        alert('✅ Test API logout réussi ! Vérifiez la console pour plus de détails.');
      } else {
        alert(`❌ Test API logout échoué: ${result.message}`);
      }
    } catch (error) {
      console.error('Erreur lors du test API logout:', error);
      alert('❌ Erreur lors du test API logout');
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Left side - Logo */}
        <div className="navbar-left">
          <div className="navbar-logo" onClick={() => handleNavigation('/dashboard')}>
            <span className="logo-investors">Investor</span>
            <span className="logo-admin">Match</span>
          </div>
        </div>

        {/* Center - Navigation links */}
        <div className="navbar-center">
          <ul className="navbar-nav">
            <li className="nav-item">
              <button 
                className={`nav-link ${location.pathname === '/chart' ? 'active' : ''}`}
                onClick={() => handleNavigation('/chart')}
              >
                Dashboard
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
                onClick={() => handleNavigation('/dashboard')}
              >
                Investors
              </button>
            </li>
            {isAdmin && (
              <li className="nav-item">
                <button 
                  className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`}
                  onClick={() => handleNavigation('/admin')}
                >
                  Admin
                </button>
              </li>
            )}
          </ul>
        </div>

        {/* Right side - User profile */}
        <div className="navbar-right">
          <div className="user-profile" onClick={() => setShowUserMenu(!showUserMenu)}>
            <div className="user-avatar">
              <span className="avatar-text">
                {userData?.lastName ? userData.lastName.charAt(0).toUpperCase() : 'U'}
              </span>
            </div>
            <span className="user-name">
              {userData?.firstName || 'User'}
            </span>
            <span className="user-chevron">▼</span>
            
            {/* User dropdown menu */}
            {showUserMenu && (
              <div className="user-dropdown">
                <div className="dropdown-item" onClick={() => {
                  handleNavigation('/profile');
                  setShowUserMenu(false);
                }}>
                  👤 Profile
                </div>
                <div className="dropdown-item" onClick={() => {
                  console.log('🎓 Tutorial button clicked!');
                  onStartTutorial();
                  setShowUserMenu(false);
                }}>
                  🎓 Tutorial
                </div>
                <div className="dropdown-item" onClick={() => {
                  handleLogout();
                  setShowUserMenu(false);
                }}>
                  🚪 Logout
                </div>
              </div>
            )}
        
            <div className="user-menu">
            
              {showDebugTools && process.env.NODE_ENV === 'development' && (
                <div className="debug-tools" style={{
                  position: 'absolute',
                  top: '100%',
                  right: '0',
                  background: 'white',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  padding: '10px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                  zIndex: 1000,
                  minWidth: '200px'
                }}>
                  <button 
                    onClick={handleTestLogoutAPI}
                    style={{
                      background: '#17a2b8',
                      color: 'white',
                      border: 'none',
                      padding: '6px 10px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      width: '100%',
                      marginBottom: '5px'
                    }}
                  >
                    🧪 Test Logout API
                  </button>
                  <button 
                    onClick={() => {
                      console.log('Auth Debug Info:', authService.getDebugInfo());
                      alert('Debug info logged to console');
                    }}
                    style={{
                      background: '#28a745',
                      color: 'white',
                      border: 'none',
                      padding: '6px 10px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      width: '100%',
                      marginBottom: '5px'
                    }}
                  >
                    📊 Auth Debug Info
                  </button>
                  <button 
                    onClick={() => {
                      refreshAdminStatus();
                      alert(`Admin status: ${isAdmin ? 'YES' : 'NO'}\nRole: ${authService.getUserRole() || 'Not found'}`);
                    }}
                    style={{
                      background: '#ffc107',
                      color: 'black',
                      border: 'none',
                      padding: '6px 10px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      width: '100%'
                    }}
                  >
                    👑 Check Admin Status
                  </button>
                </div>
              )}
              
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
