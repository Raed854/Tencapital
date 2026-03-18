import React, { createContext, useContext, useState, useCallback } from 'react';
import Alert from '../components/Alert/Alert';

const AlertContext = createContext();

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

export const AlertProvider = ({ children }) => {
  const [alerts, setAlerts] = useState([]);

  const addAlert = useCallback((alert) => {
    const id = Date.now() + Math.random();
    const newAlert = {
      id,
      ...alert,
      show: true
    };
    
    setAlerts(prev => [...prev, newAlert]);
    
    return id;
  }, []);

  const removeAlert = useCallback((id) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  }, []);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  // Convenience methods
  const showSuccess = useCallback((message, options = {}) => {
    return addAlert({
      type: 'success',
      message,
      ...options
    });
  }, [addAlert]);

  const showError = useCallback((message, options = {}) => {
    return addAlert({
      type: 'error',
      message,
      ...options
    });
  }, [addAlert]);

  const showWarning = useCallback((message, options = {}) => {
    return addAlert({
      type: 'warning',
      message,
      ...options
    });
  }, [addAlert]);

  const showInfo = useCallback((message, options = {}) => {
    return addAlert({
      type: 'info',
      message,
      ...options
    });
  }, [addAlert]);

  const value = {
    alerts,
    addAlert,
    removeAlert,
    clearAlerts,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };

  return (
    <AlertContext.Provider value={value}>
      {children}
      {alerts.map(alert => (
        <Alert
          key={alert.id}
          {...alert}
          onClose={() => removeAlert(alert.id)}
        />
      ))}
    </AlertContext.Provider>
  );
};
