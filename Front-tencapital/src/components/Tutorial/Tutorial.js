import React, { useState, useEffect } from 'react';
import './Tutorial.css';

const Tutorial = ({ onClose, isOpen, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const tutorialSteps = [
    {
      id: 'welcome',
      title: '🎉 Welcome to InvestorMatch!',
      content: 'Discover how to use our intelligent investment platform with advanced data management and analytics.',
      position: 'center',
      target: null
    },
    {
      id: 'import-excel',
      title: '📁 Import Excel Data',
      content: 'Upload XLSX files and map columns to create your investment database. The system will automatically detect and suggest column mappings.',
      tip: 'Make sure your Excel file has headers in the first row for better column detection.',
      position: 'center',
      target: null
    },
    {
      id: 'dashboard-overview',
      title: '📊 Dashboard & KPIs',
      content: 'View your investment data in a comprehensive table with key performance indicators. Navigate through different categories using the sidebar filters.',
      position: 'center',
      target: null
    },
    {
      id: 'charts-page',
      title: '📈 Charts & Analytics',
      content: 'Access the Charts page to view filtered visualizations. Use the global category selector to filter charts by specific investment categories.',
      position: 'center',
      target: null
    },
    {
      id: 'row-selection',
      title: '✅ Row Selection & Actions',
      content: 'Select individual rows to activate Approve/Unapprove/Delete actions in the sidebar. Use checkboxes to select multiple items for bulk operations.',
      tip: 'Use the master checkbox in the header to select all visible rows at once.',
      position: 'center',
      target: null
    },
    {
      id: 'filters-system',
      title: '🔍 Advanced Filters',
      content: 'Apply text filters, date ranges, and status filters. Save your filter combinations with custom names for quick access later.',
      tip: 'Saved filters are shared across your team and can be loaded instantly.',
      position: 'center',
      target: null
    },
    {
      id: 'sidebar-features',
      title: '📋 Sidebar Management',
      content: 'The sidebar is your control center: active filters, row actions, and save/load filter presets. Everything you need for efficient data management.',
      position: 'center',
      target: null
    },
    {
      id: 'admin-panel',
      title: '⚙️ Admin Panel',
      content: 'Access the Admin section to manage users (Admin, Manager, Viewer roles), data, and categories. Role-based permissions control what actions are available.',
      position: 'center',
      target: null
    },
    {
      id: 'permissions-system',
      title: '🔐 Role-Based Permissions',
      content: 'Your role determines available actions: Admins can delete data, Managers can edit, Viewers can only view. The interface adapts to your permissions.',
      position: 'center',
      target: null
    },
    {
      id: 'profile-management',
      title: '👤 Profile Settings',
      content: 'Update your profile: name, email, password, and optional avatar. Access from the navigation bar to customize your account settings.',
      position: 'center',
      target: null
    },
    {
      id: 'completion',
      title: '✅ Tutorial Complete!',
      content: 'You now know how to import data, manage investments, apply filters, and use role-based features. Start exploring InvestorMatch!',
      position: 'center',
      target: null
    }
  ];

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsCompleted(true);
      localStorage.setItem('tutorialCompleted', 'true');
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('tutorialSkipped', 'true');
    onClose();
  };

  const handleComplete = () => {
    localStorage.setItem('tutorialCompleted', 'true');
    if (onComplete) {
      onComplete();
    }
    onClose();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleSkip();
    } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
      if (currentStep < tutorialSteps.length - 1) {
        handleNext();
      } else {
        handleComplete();
      }
    } else if (e.key === 'ArrowLeft') {
      handlePrevious();
    }
  };

  // Add keyboard event listener
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, currentStep]);

  const getTooltipPosition = (step) => {
    // Always center the tooltip for simplified tutorial
    return { 
      top: '50%', 
      left: '50%', 
      transform: 'translate(-50%, -50%)',
      position: 'fixed'
    };
  };

  if (!isOpen) return null;

  const currentStepData = tutorialSteps[currentStep];
  const tooltipStyle = getTooltipPosition(currentStepData);

  return (
    <div className="tutorial-overlay" role="dialog" aria-labelledby="tutorial-title" aria-describedby="tutorial-content">
      <div className="tutorial-backdrop" onClick={handleSkip} aria-hidden="true"></div>
      

      {/* Tooltip */}
      <div 
        className={`tutorial-tooltip ${currentStepData.position}`}
        style={tooltipStyle}
        role="tooltip"
        aria-live="polite"
      >
        <div className="tutorial-tooltip-content">
          <div className="tutorial-header">
            <h3 id="tutorial-title">{currentStepData.title}</h3>
            <button 
              className="tutorial-close" 
              onClick={handleSkip}
              aria-label="Close tutorial"
              title="Close tutorial (Escape)"
            >
              ×
            </button>
          </div>
          <div className="tutorial-body">
            <p id="tutorial-content">{currentStepData.content}</p>
            {currentStepData.tip && (
              <div className="tutorial-tip">
                <strong>💡 Tip:</strong> {currentStepData.tip}
              </div>
            )}
          </div>
          <div className="tutorial-footer">
            <div className="tutorial-progress" aria-live="polite">
              <span>Step {currentStep + 1} of {tutorialSteps.length}</span>
            </div>
            <div className="tutorial-actions">
              {currentStep > 0 && (
                <button 
                  className="tutorial-btn secondary" 
                  onClick={handlePrevious}
                  aria-label="Go to previous step"
                  title="Previous step (←)"
                >
                  ← Previous
                </button>
              )}
              <button 
                className="tutorial-btn skip" 
                onClick={handleSkip}
                aria-label="Skip tutorial"
                title="Skip tutorial (Escape)"
              >
                Skip
              </button>
              {currentStep < tutorialSteps.length - 1 ? (
                <button 
                  className="tutorial-btn primary" 
                  onClick={handleNext}
                  aria-label="Go to next step"
                  title="Next step (→ or Enter)"
                >
                  Next →
                </button>
              ) : (
                <button 
                  className="tutorial-btn primary" 
                  onClick={handleComplete}
                  aria-label="Complete tutorial"
                  title="Complete tutorial (Enter)"
                >
                  Finish
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tutorial;
