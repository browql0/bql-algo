import React from 'react';

const ChartCard = ({ title, children }) => {
  return (
    <div className="chart-card">
      <h3>{title}</h3>
      <div className="chart-container" style={{ height: '300px', width: '100%', minHeight: '300px' }}>
        {children}
      </div>
    </div>
  );
};

export default ChartCard;
