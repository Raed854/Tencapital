import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';
import Dashboard from './components/Dashboard/Dashboard';
import Chart from './components/Chart/Chart';
import Profile from './components/Profile/Profile';
import Register from './components/Register/Register';
import Login from './components/Login/Login';
import ForgotPassword from './components/ForgotPassword/ForgotPassword';
import Admin from './components/Admin/Admin';
import Tutorial from './components/Tutorial/Tutorial';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import { AlertProvider } from './contexts/AlertContext';
import { useTutorial } from './hooks/useTutorial';

// Main App Content Component
function AppContent() {
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const location = useLocation();
  const { showTutorial, closeTutorial, completeTutorial, startTutorial } = useTutorial();

  const handleLoginSuccess = () => {
    // Redirect to dashboard after successful login
    window.location.href = '/dashboard';
  };

  const handleShowRegister = () => {
    window.location.href = '/register';
  };

  const handleShowLogin = () => {
    window.location.href = '/login';
  };

  const handleShowForgotPassword = () => {
    setShowForgotPassword(true);
  };

  const handleCloseForgotPassword = () => {
    setShowForgotPassword(false);
  };

  // Check if current route should show navbar and footer
  const shouldShowNavbar = !['/login', '/register'].includes(location.pathname);

  return (
    <div className="App">
      {shouldShowNavbar && <Navbar onStartTutorial={startTutorial} />}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route 
            path="/login" 
            element={
              <Login 
                onLoginSuccess={handleLoginSuccess}
                onShowRegister={handleShowRegister}
                onShowForgotPassword={handleShowForgotPassword}
              />
            } 
          />
          <Route 
            path="/register" 
            element={
              <Register 
                onLoginSuccess={handleLoginSuccess}
                onShowLogin={handleShowLogin}
              />
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute requireAuth={true}>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/chart" 
            element={
              <ProtectedRoute requireAuth={true}>
                <Chart />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute requireAuth={true}>
                <Admin />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute requireAuth={true}>
                <Profile />
              </ProtectedRoute>
            } 
          />
          <Route path="/settings" element={<Navigate to="/profile" replace />} />
          <Route path="/investors" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        {showForgotPassword && (
          <ForgotPassword 
            onClose={handleCloseForgotPassword}
            onShowLogin={handleShowLogin}
          />
        )}
        <Tutorial 
          isOpen={showTutorial}
          onClose={closeTutorial}
          onComplete={completeTutorial}
        />
      </main>
      {shouldShowNavbar && <Footer />}
    </div>
  );
}

// Main App Component with Router
function App() {
  return (
    <BrowserRouter>
      <AlertProvider>
        <AppContent />
      </AlertProvider>
    </BrowserRouter>
  );
}

export default App;
