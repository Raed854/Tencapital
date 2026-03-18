import React, { useState } from 'react';
import ImportSummary from './ImportSummary';

const ImportSummaryExample = () => {
  const [showImportSummary, setShowImportSummary] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleShowImportSummary = () => {
    setShowImportSummary(true);
  };

  const handleCloseImportSummary = () => {
    setShowImportSummary(false);
  };

  const handleImport = async () => {
    setIsImporting(true);
    
    // Simuler un processus d'import
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Import completed successfully');
      setShowImportSummary(false);
    } catch (error) {
      console.error('Import failed:', error);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Import Summary Example</h1>
      <p>This is an example of how to use the Import Summary component on any page.</p>
      
      <button 
        onClick={handleShowImportSummary}
        style={{
          padding: '12px 24px',
          backgroundColor: '#0369a1',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: '500'
        }}
      >
        Show Import Summary
      </button>

      <ImportSummary
        isVisible={showImportSummary}
        onClose={handleCloseImportSummary}
        onImport={handleImport}
        isImporting={isImporting}
      />
    </div>
  );
};

export default ImportSummaryExample;
