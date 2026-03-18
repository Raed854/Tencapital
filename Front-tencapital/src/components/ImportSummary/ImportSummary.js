import React, { useState } from 'react';
import './ImportSummary.css';

const ImportSummary = ({ 
  isVisible, 
  onClose, 
  importData = null,
  onImport,
  isImporting = false 
}) => {
  const [activeSummaryTab, setActiveSummaryTab] = useState('Industries');

  // Données d'exemple pour chaque catégorie
  const summaryData = {
    Industries: [
      { name: "Technology", count: 15, isNew: true },
      { name: "Healthcare", count: 12, isNew: false },
      { name: "Finance", count: 8, isNew: true },
      { name: "Manufacturing", count: 6, isNew: false }
    ],
    Locations: [
      { name: "Seattle, Washington, United States", count: 8, isNew: true },
      { name: "Austin, Texas, United States", count: 6, isNew: true },
      { name: "Denver, Colorado, United States", count: 4, isNew: true },
      { name: "New York, New York, United States", count: 12, isNew: false }
    ],
    Sectors: [
      { name: "Software", count: 10, isNew: false },
      { name: "Biotechnology", count: 7, isNew: true },
      { name: "Fintech", count: 5, isNew: true },
      { name: "E-commerce", count: 3, isNew: false }
    ],
    "Investor Types": [
      { name: "Venture Capital", count: 20, isNew: false },
      { name: "Private Equity", count: 15, isNew: true },
      { name: "Angel Investors", count: 8, isNew: true },
      { name: "Corporate VC", count: 5, isNew: false }
    ],
    "Investment Stages": [
      { name: "Seed", count: 25, isNew: false },
      { name: "Series A", count: 18, isNew: true },
      { name: "Series B", count: 12, isNew: true },
      { name: "Growth", count: 8, isNew: false }
    ],
    "Revenue Criteria": [
      { name: "$1M - $10M", count: 15, isNew: true },
      { name: "$10M - $50M", count: 12, isNew: false },
      { name: "$50M - $100M", count: 8, isNew: true },
      { name: "$100M+", count: 5, isNew: false }
    ]
  };

  const handleSummaryTabClick = (tabName) => {
    setActiveSummaryTab(tabName);
  };

  if (!isVisible) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container modal-import-summary">
        <div className="modal-header">
          <h2>Import Summary</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="summary-content">
          <div className="summary-header">
            <h3>Import Summary</h3>
            <p className="summary-description">
              Your import has 102 records, with 102 records containing new filter values.
            </p>
          </div>

          <div className="summary-tabs">
            <button 
              className={`summary-tab ${activeSummaryTab === 'Industries' ? 'active' : ''}`}
              onClick={() => handleSummaryTabClick('Industries')}
            >
              Industries
              <span className="tab-badge">15</span>
            </button>
            <button 
              className={`summary-tab ${activeSummaryTab === 'Locations' ? 'active' : ''}`}
              onClick={() => handleSummaryTabClick('Locations')}
            >
              Locations
              <span className="tab-badge">41</span>
            </button>
            <button 
              className={`summary-tab ${activeSummaryTab === 'Sectors' ? 'active' : ''}`}
              onClick={() => handleSummaryTabClick('Sectors')}
            >
              Sectors
              <span className="tab-badge">8</span>
            </button>
            <button 
              className={`summary-tab ${activeSummaryTab === 'Investor Types' ? 'active' : ''}`}
              onClick={() => handleSummaryTabClick('Investor Types')}
            >
              Investor Types
              <span className="tab-badge">12</span>
            </button>
            <button 
              className={`summary-tab ${activeSummaryTab === 'Investment Stages' ? 'active' : ''}`}
              onClick={() => handleSummaryTabClick('Investment Stages')}
            >
              Investment Stages
              <span className="tab-badge">6</span>
            </button>
            <button 
              className={`summary-tab ${activeSummaryTab === 'Revenue Criteria' ? 'active' : ''}`}
              onClick={() => handleSummaryTabClick('Revenue Criteria')}
            >
              Revenue Criteria
              <span className="tab-badge">4</span>
            </button>
          </div>

          <div className="new-items-section">
            <h4>New {activeSummaryTab}</h4>
            <div className="items-list">
              {summaryData[activeSummaryTab]?.map((item, index) => (
                <div key={index} className="item-card">
                  <div className="item-header">
                    {item.isNew && <span className="new-badge">New</span>}
                    <span className="item-name">{item.name}</span>
                    <span className="item-count">({item.count} records)</span>
                  </div>
                  {item.isNew && (
                    <div className="item-mapping">
                      <span className="mapping-label">Map to:</span>
                      <select className="mapping-select">
                        <option>{item.name}</option>
                        <option>Keep as is</option>
                        <option>Merge with existing</option>
                      </select>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="footer-buttons">
          <button className="btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-import"
            onClick={onImport}
            disabled={isImporting}
          >
            {isImporting ? 'Importing...' : 'Import CSV'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportSummary;
