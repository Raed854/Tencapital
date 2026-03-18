import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './ProtectedRoute.css';

const ProtectedRoute = ({ children, requireAuth = true }) => {
  const { isAuthenticated, isLoading } = useAuth();

  // Afficher un loader pendant la vérification
  if (isLoading) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner"></div>
        <p>Vérification de l'authentification...</p>
      </div>
    );
  }

  // Rediriger vers login si authentification requise mais non connecté
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Rediriger vers dashboard si déjà connecté et sur une page publique
  // Mais seulement si on n'est pas déjà sur la page de login
  if (!requireAuth && isAuthenticated && window.location.pathname !== '/login') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
