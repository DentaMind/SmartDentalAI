import React from 'react';

const AROverlay = ({ context, vitals, alert }) => {
  const renderOverlayContent = () => {
    switch (context) {
      case 'perio':
        return <div>Displaying periodontal charting data...</div>;
      case 'crownPrep':
        return <div>Displaying crown preparation guidance...</div>;
      case 'endo':
        return <div>Displaying endodontic procedure guidance...</div>;
      default:
        return <div>No specific context data available.</div>;
    }
  };

  return (
    <div className="ar-overlay">
      {renderOverlayContent()}
      {vitals && <div>Vitals: {vitals}</div>}
      {alert && <div className="alert">Alert: {alert}</div>}
    </div>
  );
};

export default AROverlay; 