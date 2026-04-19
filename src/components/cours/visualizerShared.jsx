/* eslint-disable react-refresh/only-export-components */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pause, Play, RotateCcw, SkipForward } from 'lucide-react';

export const ANIM_CSS = `
  @keyframes avCellPulse   { 0%,100%{transform:scale(1)} 50%{transform:scale(1.18)} }
  @keyframes avCellGlow    { 0%,100%{box-shadow:0 0 0 rgba(79,143,240,0)} 50%{box-shadow:0 0 18px rgba(79,143,240,0.7)} }
  @keyframes avSwapUp      { 0%{transform:translateY(0)} 40%{transform:translateY(-28px)} 100%{transform:translateY(0)} }
  @keyframes avSwapDown    { 0%{transform:translateY(0)} 40%{transform:translateY(28px)} 100%{transform:translateY(0)} }
  @keyframes avFadeSlide   { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
  @keyframes avBounce      { 0%,100%{transform:translateY(0)} 30%{transform:translateY(-10px)} 60%{transform:translateY(-5px)} }
  @keyframes avAccumulate  { 0%{transform:scaleX(0)} 100%{transform:scaleX(1)} }
  @keyframes avCondTrue    { 0%{opacity:0.3;transform:translateX(-6px)} 100%{opacity:1;transform:translateX(0)} }
  @keyframes avSpin        { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes avHighlight   { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
  @keyframes avSlideRight  { from{transform:translateX(-30%);opacity:0} to{transform:translateX(0);opacity:1} }
  @keyframes avVarChange   { 0%{transform:scale(1)} 30%{transform:scale(1.2);filter:brightness(1.4)} 100%{transform:scale(1);filter:brightness(1)} }
`;

export const AV_COLORS = {
  active: '#4f8ff0',
  compare: '#a78bfa',
  found: '#34d399',
  reject: '#fb7185',
  temp: '#facc15',
  sorted: '#475569',
  neutral: '#1e293b',
  border: 'rgba(255,255,255,0.08)',
};

export const BoolBadge = ({ val, label }) => (
  <div style={{
    padding: '0.35rem 0.9rem', borderRadius: '8px', fontFamily: 'monospace', fontWeight: 800, fontSize: '0.88rem',
    background: val ?'rgba(52,211,153,0.15)' : 'rgba(251,113,133,0.12)',
    border: `1px solid ${val ?AV_COLORS.found : AV_COLORS.reject}55`,
    color: val ?AV_COLORS.found : AV_COLORS.reject,
  }}>
    {label || (val ?'VRAI' : 'FAUX')}
  </div>
);

export function useStepPlayer(steps, speedMs = 700) {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(speedMs);
  const intervalRef = useRef(null);

  const stop = useCallback(() => {
    clearInterval(intervalRef.current);
    setPlaying(false);
  }, []);

  const reset = useCallback(() => {
    stop();
    setStep(0);
  }, [stop]);

  const stepForward = useCallback(() => {
    setStep(s => {
      if (s >= steps.length - 1) { stop(); return s; }
      return s + 1;
    });
  }, [steps.length, stop]);

  const play = useCallback(() => {
    if (step >= steps.length - 1) setStep(0);
    setPlaying(true);
  }, [step, steps.length]);

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        setStep(s => {
          if (s >= steps.length - 1) { stop(); return s; }
          return s + 1;
        });
      }, speed);
    }
    return () => clearInterval(intervalRef.current);
  }, [playing, speed, steps.length, stop]);

  return { step, playing, speed, setSpeed, play, stop, reset, stepForward };
}

export const StepControls = ({ playing, onPlay, onPause, onReset, onStep, speed, onSpeedChange, currentStep, totalSteps }) => {
  const speeds = [{ label: 'Lent Lent', val: 1400 }, { label: 'Normal Normal', val: 700 }, { label: 'Rapide Rapide', val: 280 }];
  const btnBase = {
    display: 'flex', alignItems: 'center', gap: '0.35rem',
    border: 'none', borderRadius: '8px', padding: '0.45rem 0.85rem',
    fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
      <style>{ANIM_CSS}</style>
      {!playing ?(
        <button style={{ ...btnBase, background: 'rgba(79,143,240,0.15)', color: '#4f8ff0', border: '1px solid rgba(79,143,240,0.35)' }} onClick={onPlay}>
          <Play size={12} fill="currentColor" /> Démarrer
        </button>
      ) : (
        <button style={{ ...btnBase, background: 'rgba(251,113,133,0.12)', color: '#fb7185', border: '1px solid rgba(251,113,133,0.3)' }} onClick={onPause}>
          <Pause size={12} /> Pause
        </button>
      )}
      <button style={{ ...btnBase, background: 'rgba(255,255,255,0.04)', color: '#64748b', border: '1px solid rgba(255,255,255,0.08)' }} onClick={onStep} disabled={playing}>
        <SkipForward size={12} /> Étape suivante
      </button>
      <button style={{ ...btnBase, background: 'rgba(255,255,255,0.04)', color: '#64748b', border: '1px solid rgba(255,255,255,0.08)' }} onClick={onReset}>
        <RotateCcw size={12} /> Réinitialiser
      </button>

      <div style={{ display: 'flex', gap: '3px', marginLeft: 'auto' }}>
        {speeds.map(s => (
          <button key={s.val} onClick={() => onSpeedChange(s.val)}
            style={{ ...btnBase, padding: '0.38rem 0.65rem', fontSize: '0.72rem',
              background: speed === s.val ?'rgba(167,139,250,0.18)' : 'rgba(255,255,255,0.03)',
              color: speed === s.val ?'#a78bfa' : '#475569',
              border: `1px solid ${speed === s.val ?'rgba(167,139,250,0.4)' : 'rgba(255,255,255,0.06)'}` }}>
            {s.label}
          </button>
        ))}
      </div>

      <div style={{ fontSize: '0.75rem', color: '#475569', fontFamily: 'monospace', minWidth: '70px', textAlign: 'right' }}>
        étape {currentStep + 1} / {totalSteps}
      </div>
    </div>
  );
};

export const StepDescription = ({ text, color = '#4f8ff0' }) => (
  <div key={text} style={{
    background: `rgba(${color === '#4f8ff0' ?'79,143,240' : color === '#34d399' ?'52,211,153' : color === '#a78bfa' ?'167,139,250' : color === '#facc15' ?'250,204,21' : '251,113,133'},0.07)`,
    border: `1px solid ${color}33`,
    borderLeft: `3px solid ${color}`,
    borderRadius: '8px',
    padding: '0.6rem 1rem',
    fontSize: '0.85rem',
    color: '#cbd5e1',
    lineHeight: '1.6',
    animation: 'avFadeSlide 0.3s ease',
    marginTop: '0.5rem',
  }}>
    <span style={{ color, fontWeight: 700 }}>• </span>{text}
  </div>
);

export const VariablePanel = ({ vars }) => {
  if (!vars || vars.length === 0) return null;
  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem',
      padding: '0.65rem 0.85rem',
      background: 'rgba(11,17,32,0.6)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '10px',
    }}>
      {vars.map(({ name, value, color = '#4f8ff0', changed }) => (
        <div key={name} style={{
          display: 'flex', alignItems: 'center', gap: '0.4rem',
          background: `${color}10`, border: `1px solid ${color}30`,
          borderRadius: '6px', padding: '0.28rem 0.6rem',
          animation: changed ?'avVarChange 0.4s ease' : 'none',
        }}>
          <span style={{ color: '#64748b', fontSize: '0.72rem', fontFamily: 'monospace' }}>{name}</span>
          <span style={{ color: '#475569', fontSize: '0.7rem' }}>→</span>
          <span style={{ color, fontWeight: 800, fontFamily: 'monospace', fontSize: '0.82rem' }}>{String(value)}</span>
        </div>
      ))}
    </div>
  );
};

export const VisualizerWrapper = ({ title, icon = 'Visualiseur', children, controls, description, variables }) => (
  <div style={{
    background: 'rgba(11,17,32,0.9)',
    border: '1px solid rgba(79,143,240,0.2)',
    borderRadius: '16px',
    padding: '1.4rem',
    margin: '1.5rem 0',
    boxShadow: '0 4px 24px rgba(0,0,0,0.3), 0 0 0 1px rgba(79,143,240,0.08)',
    maxWidth: '100%',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', paddingBottom: '0.7rem', borderBottom: '1px solid rgba(255,255,255,0.06)', flexWrap: 'wrap' }}>
      <span style={{ fontSize: '1rem' }}>{icon}</span>
      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{title}</span>
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', display: 'inline-block', animation: 'avSpin 2s linear infinite' }} />
        <span style={{ fontSize: '0.68rem', color: '#34d399', fontWeight: 700 }}>INTERACTIF</span>
      </div>
    </div>
    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
      {children}
    </div>
    {description && <StepDescription text={description.text} color={description.color} />}
    {variables && <VariablePanel vars={variables} />}
    {controls}
  </div>
);
