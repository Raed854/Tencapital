// Utility functions to replace basic alert() calls with modern notifications

// This will be set by the AlertProvider
let alertContext = null;

export const setAlertContext = (context) => {
  alertContext = context;
};

// Replace basic alert() with modern notifications
export const showAlert = (message, type = 'info', options = {}) => {
  if (alertContext) {
    return alertContext.addAlert({
      type,
      message,
      ...options
    });
  } else {
    // Fallback to basic alert if context not available
    console.warn('Alert context not available, using basic alert');
    alert(message);
  }
};

// Convenience methods
export const showSuccess = (message, options = {}) => {
  return showAlert(message, 'success', options);
};

export const showError = (message, options = {}) => {
  return showAlert(message, 'error', options);
};

export const showWarning = (message, options = {}) => {
  return showAlert(message, 'warning', options);
};

export const showInfo = (message, options = {}) => {
  return showAlert(message, 'info', options);
};

// Enhanced alert with actions
export const showConfirmAlert = (message, onConfirm, onCancel, options = {}) => {
  const actions = [
    {
      label: 'Cancel',
      type: 'secondary',
      onClick: () => {
        if (onCancel) onCancel();
        alertContext?.removeAlert(alertId);
      }
    },
    {
      label: 'Confirm',
      type: 'primary',
      onClick: () => {
        if (onConfirm) onConfirm();
        alertContext?.removeAlert(alertId);
      }
    }
  ];

  const alertId = showAlert(message, 'warning', {
    title: 'Confirmation Required',
    actions,
    duration: 0, // Don't auto-close
    ...options
  });

  return alertId;
};

// Progress alert for long operations
export const showProgressAlert = (message, progress = 0, options = {}) => {
  return showAlert(message, 'info', {
    title: 'Processing...',
    duration: 0, // Don't auto-close
    progress,
    ...options
  });
};

// Replace window.alert globally
if (typeof window !== 'undefined') {
  const originalAlert = window.alert;
  
  window.alert = (message) => {
    // Try to use modern alert first
    if (alertContext) {
      showAlert(message, 'info');
    } else {
      // Fallback to original alert
      originalAlert(message);
    }
  };
}
