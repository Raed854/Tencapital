import React, { useState } from 'react';
import AddInvestor from './AddInvestor';
import './AddInvestor.css';

const AddInvestorDemo = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSaveInvestor = (investorData) => {
    console.log('Investor data received:', investorData);
    alert('Investor saved successfully! Check console for data.');
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Add Investor Modal Demo</h1>
      <button 
        onClick={() => setIsModalOpen(true)}
        style={{
          background: '#4ecdc4',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: '600'
        }}
      >
        Open Add Investor Modal
      </button>
      
      <AddInvestor
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveInvestor}
      />
    </div>
  );
};

export default AddInvestorDemo;
