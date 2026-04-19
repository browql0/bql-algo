import React from 'react';

const ChartCard = ({ title, subtitle, action, children }) => {
  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <div>
          <h3>{title}</h3>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="chart-container" style={{ height: '300px', width: '100%', minHeight: '300px' }}>
        {children}
      </div>
    </div>
  );
};

export default ChartCard;
