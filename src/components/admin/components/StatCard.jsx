import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, trend, trendValue }) => {
  const isPositive = trend === 'up';
  
  return (
    <div className="stat-card">
      <div className="stat-header">
        <span>{title}</span>
        {Icon && (
          typeof Icon === 'function' ? <Icon size={20} className="stat-icon" /> : Icon
        )}
      </div>
      <div className="stat-value">{value}</div>
      {trendValue && (
        <div className="stat-footer">
          <span className={`stat-trend ${isPositive ? 'positive' : 'negative'}`}>
            {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {trendValue}%
          </span>
          <span style={{ color: 'var(--admin-text-sub)' }}>depuis le mois dernier</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;
