import React, { useState, useEffect } from 'react';
import './Alert.css';

const Alert = ({ 
  type = 'info', 
  title, 
  message, 
  duration = 5000, 
  show = false, 
  onClose,
  position = 'top-right',
  actions = []
}) => {
  const [isVisible, setIsVisible] = useState(show);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    setIsVisible(show);
    if (show && duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, 300);
  };

  if (!isVisible) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return 'ℹ️';
    }
  };

  const getTypeClass = () => {
    switch (type) {
      case 'success':
        return 'alert-success';
      case 'error':
        return 'alert-error';
      case 'warning':
        return 'alert-warning';
      case 'info':
        return 'alert-info';
      default:
        return 'alert-info';
    }
  };

  return (
    <div className={`alert-container alert-${position} ${isExiting ? 'alert-exiting' : ''}`}>
      <div className={`alert ${getTypeClass()}`}>
        <div className="alert-content">
          <div className="alert-icon">
            {getIcon()}
          </div>
          <div className="alert-body">
            {title && <div className="alert-title">{title}</div>}
            {message && <div className="alert-message">{message}</div>}
            {actions.length > 0 && (
              <div className="alert-actions">
                {actions.map((action, index) => (
                  <button
                    key={index}
                    className={`alert-action ${action.type || 'secondary'}`}
                    onClick={action.onClick}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button className="alert-close" onClick={handleClose}>
            ✕
          </button>
        </div>
        <div className="alert-progress">
          <div 
            className="alert-progress-bar" 
            style={{ 
              animationDuration: `${duration}ms`,
              animationPlayState: isExiting ? 'paused' : 'running'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Alert;
