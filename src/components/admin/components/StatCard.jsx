import React from 'react';

const VARIANT_ICON_COLORS = {
  success: 'rgba(34,197,94,0.15)',
  warning: 'rgba(245,158,11,0.15)',
  critical: 'rgba(239,68,68,0.15)',
  default: 'rgba(99,102,241,0.15)',
};

const VARIANT_TEXT_COLORS = {
  success: '#86efac',
  warning: '#fcd34d',
  critical: '#fca5a5',
  default: '#a5b4fc',
};

const StatCard = ({ title, value, icon, trendValue, variant }) => {
  const iconBg = VARIANT_ICON_COLORS[variant] || VARIANT_ICON_COLORS.default;
  const iconColor = VARIANT_TEXT_COLORS[variant] || VARIANT_TEXT_COLORS.default;
  const cardClass = ['stat-card', variant === 'critical' ? 'critical' : variant === 'warning' ? 'warning' : variant === 'success' ? 'success' : ''].filter(Boolean).join(' ');

  return (
    <div className={cardClass}>
      <div className="stat-header">
        <span>{title}</span>
        {icon && (
          <span style={{ background: iconBg, color: iconColor, padding: '0.45rem', borderRadius: '8px', display: 'flex' }}>
            {icon}
          </span>
        )}
      </div>
      <div className="stat-value">{value}</div>
      {trendValue && (
        <div className="stat-footer">
          <span style={{ color: 'var(--admin-text-sub)', fontSize: '0.78rem' }}>{trendValue}</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;
