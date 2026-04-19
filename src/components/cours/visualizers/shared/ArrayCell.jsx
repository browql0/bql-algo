import React from 'react';
import { AV_COLORS } from '../../visualizerShared';

const ArrayCell = ({ value, index, name, state, swapAnim }) => {
  const stateStyles = {
    active:  { bg: 'rgba(79,143,240,0.25)',  border: AV_COLORS.active,   color: AV_COLORS.active,   anim: 'avCellPulse 0.5s ease, avCellGlow 0.5s ease' },
    compare: { bg: 'rgba(167,139,250,0.2)',  border: AV_COLORS.compare,  color: AV_COLORS.compare,  anim: 'avCellPulse 0.4s ease' },
    found:   { bg: 'rgba(52,211,153,0.2)',   border: AV_COLORS.found,    color: AV_COLORS.found,    anim: 'avBounce 0.5s ease' },
    reject:  { bg: 'rgba(251,113,133,0.15)', border: AV_COLORS.reject,   color: AV_COLORS.reject,   anim: 'none' },
    temp:    { bg: 'rgba(250,204,21,0.2)',   border: AV_COLORS.temp,     color: AV_COLORS.temp,     anim: 'avCellPulse 0.4s ease' },
    sorted:  { bg: 'rgba(52,211,153,0.08)',  border: '#334155',          color: '#4b5563',           anim: 'none' },
    neutral: { bg: 'rgba(30,41,59,0.6)',     border: 'rgba(255,255,255,0.1)', color: '#94a3b8',      anim: 'none' },
  };
  const s = stateStyles[state] || stateStyles.neutral;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
      <div style={{
        minWidth: '44px', height: '44px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: s.bg, border: `2px solid ${s.border}`,
        fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, fontSize: '0.95rem', color: s.color,
        animation: swapAnim || s.anim,
        transition: 'background 0.3s, border-color 0.3s, color 0.3s',
        boxShadow: state === 'active' ?`0 0 12px ${AV_COLORS.active}40` : state === 'found' ?`0 0 12px ${AV_COLORS.found}40` : 'none',
      }}>
        {value}
      </div>
      <div style={{ fontSize: '0.65rem', color: '#334155', fontFamily: 'monospace' }}>{name}[{index}]</div>
    </div>
  );
};

export default ArrayCell;
