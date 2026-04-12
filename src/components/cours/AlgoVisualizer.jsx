import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, SkipForward, Zap, ChevronRight } from 'lucide-react';

// ─── Global Animations CSS ────────────────────────────────────────────────────

const ANIM_CSS = `
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

// ─── Semantic Colors ──────────────────────────────────────────────────────────

export const AV_COLORS = {
  active:    '#4f8ff0', // bleu — index courant, case lue
  compare:   '#a78bfa', // violet — deux éléments comparés
  found:     '#34d399', // vert — trouvé, validé
  reject:    '#fb7185', // rouge — condition fausse
  temp:      '#facc15', // jaune — variable temporaire
  sorted:    '#475569', // gris — élément à sa place finale
  neutral:   '#1e293b', // fond neutre
  border:    'rgba(255,255,255,0.08)',
};

// ─── Shared: useStepPlayer ───────────────────────────────────────────────────

function useStepPlayer(steps, speedMs = 700) {
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

// ─── Shared: StepControls ────────────────────────────────────────────────────

export const StepControls = ({ playing, onPlay, onPause, onReset, onStep, speed, onSpeedChange, currentStep, totalSteps }) => {
  const speeds = [{ label: '🐢 Lent', val: 1400 }, { label: '▶ Normal', val: 700 }, { label: '⚡ Rapide', val: 280 }];
  const btnBase = {
    display: 'flex', alignItems: 'center', gap: '0.35rem',
    border: 'none', borderRadius: '8px', padding: '0.45rem 0.85rem',
    fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
      <style>{ANIM_CSS}</style>
      {!playing ? (
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
              background: speed === s.val ? 'rgba(167,139,250,0.18)' : 'rgba(255,255,255,0.03)',
              color: speed === s.val ? '#a78bfa' : '#475569',
              border: `1px solid ${speed === s.val ? 'rgba(167,139,250,0.4)' : 'rgba(255,255,255,0.06)'}` }}>
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

// ─── Shared: StepDescription ─────────────────────────────────────────────────

export const StepDescription = ({ text, color = '#4f8ff0' }) => (
  <div key={text} style={{
    background: `rgba(${color === '#4f8ff0' ? '79,143,240' : color === '#34d399' ? '52,211,153' : color === '#a78bfa' ? '167,139,250' : color === '#facc15' ? '250,204,21' : '251,113,133'},0.07)`,
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
    <span style={{ color, fontWeight: 700 }}>→ </span>{text}
  </div>
);

// ─── Shared: VariablePanel ───────────────────────────────────────────────────

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
          animation: changed ? 'avVarChange 0.4s ease' : 'none',
        }}>
          <span style={{ color: '#64748b', fontSize: '0.72rem', fontFamily: 'monospace' }}>{name}</span>
          <span style={{ color: '#475569', fontSize: '0.7rem' }}>←</span>
          <span style={{ color, fontWeight: 800, fontFamily: 'monospace', fontSize: '0.82rem' }}>{String(value)}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Shared: VisualizerWrapper ───────────────────────────────────────────────

const VisualizerWrapper = ({ title, icon = '🎬', children, controls, description, variables }) => (
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
    {/* Scrollable inner content for wide visualizations (e.g. large arrays on mobile) */}
    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
      {children}
    </div>
    {description && <StepDescription text={description.text} color={description.color} />}
    {variables && <VariablePanel vars={variables} />}
    {controls}
  </div>
);

// ─── Cell component ───────────────────────────────────────────────────────────

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
        boxShadow: state === 'active' ? `0 0 12px ${AV_COLORS.active}40` : state === 'found' ? `0 0 12px ${AV_COLORS.found}40` : 'none',
      }}>
        {value}
      </div>
      <div style={{ fontSize: '0.65rem', color: '#334155', fontFamily: 'monospace' }}>{name}[{index}]</div>
    </div>
  );
};

// ─── 1. ArrayTraversalVisualizer ─────────────────────────────────────────────

export const ArrayTraversalVisualizer = ({ array = [12, 5, 8, 17, 3, 9], name = 'T' }) => {
  const steps = array.map((_, i) => ({
    active: i,
    desc: { text: `On lit maintenant ${name}[${i}] = ${array[i]}. L'indice i vaut ${i}.`, color: AV_COLORS.active },
    vars: [{ name: 'i', value: i, color: AV_COLORS.active }, { name: `${name}[i]`, value: array[i], color: AV_COLORS.temp }],
  }));

  const { step, playing, speed, setSpeed, play, stop, reset, stepForward } = useStepPlayer(steps);
  const cur = steps[step];

  return (
    <VisualizerWrapper title="Visualiseur — Parcours de tableau" icon="🔍"
      description={cur.desc} variables={cur.vars}
      controls={<StepControls playing={playing} onPlay={play} onPause={stop} onReset={reset} onStep={stepForward} speed={speed} onSpeedChange={setSpeed} currentStep={step} totalSteps={steps.length} />}>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', padding: '0.5rem 0' }}>
        {array.map((v, i) => (
          <ArrayCell key={i} value={v} index={i} name={name} state={i === cur.active ? 'active' : i < cur.active ? 'sorted' : 'neutral'} />
        ))}
      </div>
    </VisualizerWrapper>
  );
};

// ─── 2. ArraySearchVisualizer ─────────────────────────────────────────────────

export const ArraySearchVisualizer = ({ array = [12, 5, 8, 17, 3, 9], target = 17, name = 'T' }) => {
  const foundIdx = array.indexOf(target);
  const steps = array.map((v, i) => {
    const isFound = v === target;
    return {
      active: i,
      found: isFound ? i : -1,
      desc: isFound
        ? { text: `${name}[${i}] = ${v} → TROUVÉ ! La valeur cherchée (${target}) est à l'indice ${i}.`, color: AV_COLORS.found }
        : { text: `${name}[${i}] = ${v} ≠ ${target} — on continue…`, color: AV_COLORS.reject },
      vars: [{ name: 'i', value: i, color: AV_COLORS.active }, { name: 'cible', value: target, color: AV_COLORS.temp }, { name: 'trouvé', value: isFound ? 'VRAI' : 'FAUX', color: isFound ? AV_COLORS.found : AV_COLORS.reject }],
    };
  });

  const { step, playing, speed, setSpeed, play, stop, reset, stepForward } = useStepPlayer(steps);
  const cur = steps[step];

  const getState = (i) => {
    if (cur.found === i) return 'found';
    if (i === cur.active) return 'compare';
    if (i < cur.active) return cur.found >= 0 && cur.found < i ? 'sorted' : 'reject';
    return 'neutral';
  };

  return (
    <VisualizerWrapper title="Visualiseur — Recherche séquentielle" icon="🎯"
      description={cur.desc} variables={cur.vars}
      controls={<StepControls playing={playing} onPlay={play} onPause={stop} onReset={reset} onStep={stepForward} speed={speed} onSpeedChange={setSpeed} currentStep={step} totalSteps={steps.length} />}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Rechercher :</span>
        <span style={{ background: 'rgba(250,204,21,0.15)', border: '1px solid rgba(250,204,21,0.4)', borderRadius: '6px', padding: '0.2rem 0.55rem', color: AV_COLORS.temp, fontFamily: 'monospace', fontWeight: 800 }}>{target}</span>
      </div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', padding: '0.5rem 0' }}>
        {array.map((v, i) => <ArrayCell key={i} value={v} index={i} name={name} state={getState(i)} />)}
      </div>
    </VisualizerWrapper>
  );
};

// ─── 3. ArrayMaxMinVisualizer ────────────────────────────────────────────────

export const ArrayMaxMinVisualizer = ({ array = [12, 5, 8, 17, 3, 9], name = 'T' }) => {
  const steps = [];
  let max = array[0], maxIdx = 0;
  steps.push({ active: 0, maxIdx: 0, max, desc: { text: `On initialise max ← ${name}[0] = ${max}. C'est notre premier candidat.`, color: AV_COLORS.temp }, vars: [{ name: 'i', value: 0, color: AV_COLORS.active }, { name: 'max', value: max, color: AV_COLORS.temp }] });

  for (let i = 1; i < array.length; i++) {
    const isNew = array[i] > max;
    if (isNew) { max = array[i]; maxIdx = i; }
    steps.push({
      active: i, maxIdx,
      max,
      desc: isNew
        ? { text: `${name}[${i}] = ${array[i]} > max actuel (${isNew ? array[i] : max}) → Nouveau maximum trouvé !`, color: AV_COLORS.found }
        : { text: `${name}[${i}] = ${array[i]} ≤ max (${max}) → On garde le max actuel.`, color: AV_COLORS.active },
      vars: [{ name: 'i', value: i, color: AV_COLORS.active }, { name: 'max', value: max, color: AV_COLORS.temp, changed: isNew }, { name: 'indice_max', value: maxIdx, color: AV_COLORS.found }],
    });
  }

  const { step, playing, speed, setSpeed, play, stop, reset, stepForward } = useStepPlayer(steps);
  const cur = steps[step];

  const getState = (i) => {
    if (i === cur.maxIdx && i === cur.active) return 'found';
    if (i === cur.active) return 'compare';
    if (i === cur.maxIdx) return 'temp';
    if (i < cur.active) return 'sorted';
    return 'neutral';
  };

  return (
    <VisualizerWrapper title="Visualiseur — Recherche du Maximum" icon="🏆"
      description={cur.desc} variables={cur.vars}
      controls={<StepControls playing={playing} onPlay={play} onPause={stop} onReset={reset} onStep={stepForward} speed={speed} onSpeedChange={setSpeed} currentStep={step} totalSteps={steps.length} />}>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', padding: '0.5rem 0' }}>
        {array.map((v, i) => <ArrayCell key={i} value={v} index={i} name={name} state={getState(i)} />)}
      </div>
    </VisualizerWrapper>
  );
};

// ─── 4. ArraySumVisualizer ───────────────────────────────────────────────────

export const ArraySumVisualizer = ({ array = [5, 3, 8, 2, 6], name = 'T' }) => {
  const steps = [];
  let sum = 0;
  steps.push({ active: -1, sum, desc: { text: `On initialise somme ← 0. L'accumulateur est vide.`, color: AV_COLORS.neutral }, vars: [{ name: 'somme', value: 0, color: AV_COLORS.temp }, { name: 'i', value: '-', color: AV_COLORS.active }] });

  for (let i = 0; i < array.length; i++) {
    const prev = sum;
    sum += array[i];
    steps.push({
      active: i, sum,
      desc: { text: `somme ← ${prev} + ${name}[${i}] (${array[i]}) = ${sum}`, color: AV_COLORS.temp },
      vars: [{ name: 'i', value: i, color: AV_COLORS.active }, { name: `${name}[i]`, value: array[i], color: AV_COLORS.compare }, { name: 'somme', value: sum, color: AV_COLORS.temp, changed: true }],
    });
  }
  const moyenne = (sum / array.length).toFixed(2);
  steps.push({ active: -1, sum, done: true, desc: { text: `Résultat final : somme = ${sum}, moyenne = ${sum} / ${array.length} = ${moyenne}`, color: AV_COLORS.found }, vars: [{ name: 'somme', value: sum, color: AV_COLORS.found }, { name: 'moyenne', value: moyenne, color: AV_COLORS.found }] });

  const { step, playing, speed, setSpeed, play, stop, reset, stepForward } = useStepPlayer(steps);
  const cur = steps[step];
  const pct = Math.min(100, (cur.sum / sum) * 100);

  return (
    <VisualizerWrapper title="Visualiseur — Somme et Moyenne" icon="∑"
      description={cur.desc} variables={cur.vars}
      controls={<StepControls playing={playing} onPlay={play} onPause={stop} onReset={reset} onStep={stepForward} speed={speed} onSpeedChange={setSpeed} currentStep={step} totalSteps={steps.length} />}>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', padding: '0.5rem 0', alignItems: 'flex-end' }}>
        {array.map((v, i) => <ArrayCell key={i} value={v} index={i} name={name} state={i === cur.active ? 'compare' : i < cur.active ? 'sorted' : 'neutral'} />)}
        <div style={{ marginLeft: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
          <div style={{ fontSize: '0.65rem', color: '#4f8ff0', fontWeight: 800, textTransform: 'uppercase' }}>somme</div>
          <div style={{ width: '44px', height: '60px', background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(79,143,240,0.3)', borderRadius: '6px', overflow: 'hidden', display: 'flex', alignItems: 'flex-end' }}>
            <div style={{ width: '100%', background: 'linear-gradient(180deg, #4f8ff0, #6366f1)', height: `${pct}%`, transition: 'height 0.5s ease', borderRadius: '4px 4px 0 0' }} />
          </div>
          <div style={{ fontFamily: 'monospace', fontWeight: 800, color: AV_COLORS.temp, fontSize: '0.9rem' }}>{cur.sum}</div>
        </div>
      </div>
    </VisualizerWrapper>
  );
};

// ─── 5. ArrayReverseVisualizer ───────────────────────────────────────────────

export const ArrayReverseVisualizer = ({ array = [1, 2, 3, 4, 5], name = 'T' }) => {
  const steps = [];
  const arr = [...array];
  const n = arr.length;
  steps.push({ arr: [...arr], left: -1, right: -1, swapping: false, desc: { text: `Tableau initial. On va échanger les paires opposées jusqu'au milieu.`, color: AV_COLORS.neutral }, vars: [] });

  for (let i = 0; i < Math.floor(n / 2); i++) {
    const j = n - 1 - i;
    steps.push({ arr: [...arr], left: i, right: j, swapping: true, desc: { text: `On compare ${name}[${i}] = ${arr[i]} et ${name}[${j}] = ${arr[j]}. On les échange !`, color: AV_COLORS.compare }, vars: [{ name: 'i', value: i, color: AV_COLORS.active }, { name: 'j', value: j, color: AV_COLORS.compare }, { name: 'temp', value: arr[i], color: AV_COLORS.temp }] });
    const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    steps.push({ arr: [...arr], left: i, right: j, done: [i, j], desc: { text: `Échange effectué ! ${name}[${i}] = ${arr[i]}, ${name}[${j}] = ${arr[j]}.`, color: AV_COLORS.found }, vars: [{ name: 'i', value: i, color: AV_COLORS.active }, { name: `${name}[i]`, value: arr[i], color: AV_COLORS.found }, { name: `${name}[j]`, value: arr[j], color: AV_COLORS.found }] });
  }
  steps.push({ arr: [...arr], left: -1, right: -1, done: 'all', desc: { text: `Tableau inversé ! Toutes les paires ont été échangées.`, color: AV_COLORS.found }, vars: [] });

  const { step, playing, speed, setSpeed, play, stop, reset, stepForward } = useStepPlayer(steps);
  const cur = steps[step];

  const getState = (i) => {
    if (cur.done === 'all') return 'found';
    if (Array.isArray(cur.done) && cur.done.includes(i)) return 'found';
    if (i === cur.left) return 'compare';
    if (i === cur.right) return 'compare';
    return 'neutral';
  };

  return (
    <VisualizerWrapper title="Visualiseur — Inversion de Tableau" icon="🔄"
      description={cur.desc} variables={cur.vars}
      controls={<StepControls playing={playing} onPlay={play} onPause={stop} onReset={reset} onStep={stepForward} speed={speed} onSpeedChange={setSpeed} currentStep={step} totalSteps={steps.length} />}>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', padding: '0.5rem 0', position: 'relative' }}>
        {cur.arr.map((v, i) => (
          <div key={i} style={{ animation: (i === cur.left || i === cur.right) && cur.swapping ? `avSwapUp 0.4s ease` : 'none' }}>
            <ArrayCell value={v} index={i} name={name} state={getState(i)} />
          </div>
        ))}
      </div>
      {cur.left >= 0 && cur.right >= 0 && (
        <div style={{ fontSize: '0.75rem', color: AV_COLORS.compare, fontFamily: 'monospace', marginTop: '0.25rem' }}>
          ↕ Échange de {name}[{cur.left}] ↔ {name}[{cur.right}]
        </div>
      )}
    </VisualizerWrapper>
  );
};

// ─── 6. ArrayShiftVisualizer ─────────────────────────────────────────────────

export const ArrayShiftVisualizer = ({ array = [1, 2, 3, 4, 5], name = 'T', direction = 'right' }) => {
  const steps = [];
  const n = array.length;
  const arr = [...array];
  const saved = direction === 'right' ? arr[n - 1] : arr[0];

  steps.push({ arr: [...arr], active: -1, saved: null, desc: { text: `Tableau initial. On va décaler tous les éléments d'une case vers la ${direction === 'right' ? 'droite' : 'gauche'}.`, color: AV_COLORS.neutral }, vars: [] });
  steps.push({ arr: [...arr], active: direction === 'right' ? n - 1 : 0, saved, desc: { text: `On sauvegarde ${name}[${direction === 'right' ? n - 1 : 0}] = ${saved} avant le décalage (il serait écrasé sinon).`, color: AV_COLORS.temp }, vars: [{ name: 'dernier', value: saved, color: AV_COLORS.temp }] });

  if (direction === 'right') {
    for (let i = n - 1; i > 0; i--) {
      arr[i] = arr[i - 1];
      steps.push({ arr: [...arr], active: i, saved, desc: { text: `${name}[${i}] ← ${name}[${i - 1}] = ${arr[i]}. On décale vers la droite.`, color: AV_COLORS.active }, vars: [{ name: 'i', value: i, color: AV_COLORS.active }, { name: 'dernier', value: saved, color: AV_COLORS.temp }] });
    }
    arr[0] = saved;
  } else {
    for (let i = 0; i < n - 1; i++) {
      arr[i] = arr[i + 1];
      steps.push({ arr: [...arr], active: i, saved, desc: { text: `${name}[${i}] ← ${name}[${i + 1}] = ${arr[i]}. On décale vers la gauche.`, color: AV_COLORS.active }, vars: [{ name: 'i', value: i, color: AV_COLORS.active }, { name: 'premier', value: saved, color: AV_COLORS.temp }] });
    }
    arr[n - 1] = saved;
  }
  steps.push({ arr: [...arr], active: direction === 'right' ? 0 : n - 1, saved, desc: { text: `On réinjecte la valeur sauvegardée (${saved}) à ${direction === 'right' ? 'T[0]' : `T[${n - 1}]`}.`, color: AV_COLORS.found }, vars: [{ name: direction === 'right' ? `${name}[0]` : `${name}[${n - 1}]`, value: saved, color: AV_COLORS.found, changed: true }] });
  steps.push({ arr: [...arr], active: -1, done: true, desc: { text: `Décalage circulaire terminé !`, color: AV_COLORS.found }, vars: [] });

  const { step, playing, speed, setSpeed, play, stop, reset, stepForward } = useStepPlayer(steps);
  const cur = steps[step];

  return (
    <VisualizerWrapper title="Visualiseur — Décalage Circulaire" icon="↺"
      description={cur.desc} variables={cur.vars}
      controls={<StepControls playing={playing} onPlay={play} onPause={stop} onReset={reset} onStep={stepForward} speed={speed} onSpeedChange={setSpeed} currentStep={step} totalSteps={steps.length} />}>
      {cur.saved !== null && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Sauvegardé :</span>
          <div style={{ background: 'rgba(250,204,21,0.15)', border: '1px solid rgba(250,204,21,0.4)', borderRadius: '6px', padding: '0.2rem 0.55rem', color: AV_COLORS.temp, fontFamily: 'monospace', fontWeight: 800 }}>{cur.saved}</div>
        </div>
      )}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', padding: '0.5rem 0' }}>
        {cur.arr.map((v, i) => <ArrayCell key={i} value={v} index={i} name={name} state={i === cur.active ? 'active' : cur.done ? 'found' : 'neutral'} />)}
      </div>
    </VisualizerWrapper>
  );
};

// ─── 7. BubbleSortVisualizer ─────────────────────────────────────────────────

export const BubbleSortVisualizer = ({ array = [5, 3, 8, 1, 9, 2], name = 'T' }) => {
  const steps = [];
  const arr = [...array];
  const n = arr.length;
  const sorted = new Set();

  steps.push({ arr: [...arr], j: -1, j1: -1, sorted: new Set(), swapping: false, desc: { text: `Tableau initial — tri à bulles : on va comparer les paires adjacentes et les échanger si nécessaire.`, color: AV_COLORS.neutral }, vars: [] });

  for (let pass = 0; pass < n - 1; pass++) {
    for (let j = 0; j < n - 1 - pass; j++) {
      const needSwap = arr[j] > arr[j + 1];
      steps.push({ arr: [...arr], j, j1: j + 1, sorted: new Set(sorted), swapping: needSwap, pass, desc: needSwap ? { text: `Passe ${pass + 1} — ${name}[${j}]=${arr[j]} > ${name}[${j + 1}]=${arr[j + 1]} → On échange !`, color: AV_COLORS.compare } : { text: `Passe ${pass + 1} — ${name}[${j}]=${arr[j]} ≤ ${name}[${j + 1}]=${arr[j + 1]} → OK, pas d'échange.`, color: AV_COLORS.active }, vars: [{ name: 'passe', value: pass + 1, color: '#64748b' }, { name: 'j', value: j, color: AV_COLORS.compare }, { name: `${name}[j]`, value: arr[j], color: AV_COLORS.compare }, { name: `${name}[j+1]`, value: arr[j + 1], color: AV_COLORS.compare }] });
      if (needSwap) {
        const tmp = arr[j]; arr[j] = arr[j + 1]; arr[j + 1] = tmp;
        steps.push({ arr: [...arr], j, j1: j + 1, sorted: new Set(sorted), swapping: false, desc: { text: `Échange effectué ! ${name}[${j}]=${arr[j]}, ${name}[${j + 1}]=${arr[j + 1]}.`, color: AV_COLORS.found }, vars: [{ name: `${name}[j]`, value: arr[j], color: AV_COLORS.found }, { name: `${name}[j+1]`, value: arr[j + 1], color: AV_COLORS.found }] });
      }
    }
    sorted.add(n - 1 - pass);
    steps.push({ arr: [...arr], j: -1, j1: -1, sorted: new Set(sorted), swapping: false, desc: { text: `Fin de passe ${pass + 1} — ${name}[${n - 1 - pass}] = ${arr[n - 1 - pass]} est maintenant à sa place définitive !`, color: AV_COLORS.found }, vars: [{ name: 'passe', value: pass + 1, color: '#64748b' }] });
  }
  sorted.add(0);
  steps.push({ arr: [...arr], j: -1, j1: -1, sorted: new Set(sorted), swapping: false, done: true, desc: { text: `Tableau trié ! Toutes les valeurs sont à leur place définitive.`, color: AV_COLORS.found }, vars: [] });

  const { step, playing, speed, setSpeed, play, stop, reset, stepForward } = useStepPlayer(steps, 900);
  const cur = steps[step];

  const getState = (i) => {
    if (cur.sorted.has(i)) return 'sorted';
    if (cur.swapping && (i === cur.j || i === cur.j1)) return 'compare';
    if (i === cur.j || i === cur.j1) return 'compare';
    return 'neutral';
  };

  return (
    <VisualizerWrapper title="Visualiseur — Tri à Bulles" icon="🫧"
      description={cur.desc} variables={cur.vars}
      controls={<StepControls playing={playing} onPlay={play} onPause={stop} onReset={reset} onStep={stepForward} speed={speed} onSpeedChange={setSpeed} currentStep={step} totalSteps={steps.length} />}>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', padding: '0.5rem 0' }}>
        {cur.arr.map((v, i) => (
          <div key={i} style={{ animation: cur.swapping && (i === cur.j || i === cur.j1) ? (i === cur.j ? 'avSwapUp 0.3s ease' : 'avSwapDown 0.3s ease') : 'none' }}>
            <ArrayCell value={v} index={i} name={name} state={getState(i)} />
          </div>
        ))}
      </div>
      {cur.sorted.size > 0 && (
        <div style={{ fontSize: '0.72rem', color: AV_COLORS.sorted, marginTop: '0.25rem' }}>
          ✓ {cur.sorted.size} élément{cur.sorted.size > 1 ? 's' : ''} trié{cur.sorted.size > 1 ? 's' : ''}
        </div>
      )}
    </VisualizerWrapper>
  );
};

// ─── 8. MatrixTraversalVisualizer ────────────────────────────────────────────

export const MatrixTraversalVisualizer = ({ matrix = [[1,2,3],[4,5,6],[7,8,9]], name = 'M' }) => {
  const steps = [];
  const L = matrix.length, C = matrix[0].length;

  steps.push({ i: -1, j: -1, desc: { text: `Matrice ${name}[${L}, ${C}]. La double boucle va parcourir chaque cellule M[i, j].`, color: AV_COLORS.neutral }, vars: [] });

  for (let i = 0; i < L; i++) {
    for (let j = 0; j < C; j++) {
      steps.push({ i, j, desc: { text: `Boucle externe i=${i}, interne j=${j} → ${name}[${i}, ${j}] = ${matrix[i][j]}`, color: j === 0 ? AV_COLORS.active : AV_COLORS.compare }, vars: [{ name: 'i', value: i, color: AV_COLORS.active }, { name: 'j', value: j, color: AV_COLORS.compare }, { name: `${name}[i, j]`, value: matrix[i][j], color: AV_COLORS.temp }] });
    }
  }
  steps.push({ i: -1, j: -1, done: true, desc: { text: `Parcours complet ! ${L} × ${C} = ${L * C} cellules visitées.`, color: AV_COLORS.found }, vars: [{ name: 'total', value: `${L * C} cellules`, color: AV_COLORS.found }] });

  const { step, playing, speed, setSpeed, play, stop, reset, stepForward } = useStepPlayer(steps);
  const cur = steps[step];

  return (
    <VisualizerWrapper title="Visualiseur — Parcours de Matrice (Double Boucle)" icon="⊞"
      description={cur.desc} variables={cur.vars}
      controls={<StepControls playing={playing} onPlay={play} onPause={stop} onReset={reset} onStep={stepForward} speed={speed} onSpeedChange={setSpeed} currentStep={step} totalSteps={steps.length} />}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {matrix.map((row, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.65rem', color: i === cur.i && !cur.done ? AV_COLORS.active : '#334155', width: '18px', textAlign: 'right', fontFamily: 'monospace', fontWeight: i === cur.i && !cur.done ? 800 : 400, transition: 'color 0.3s' }}>i={i}</span>
            {row.map((v, j) => {
              const isActive = i === cur.i && j === cur.j && !cur.done;
              const isPrev = cur.done || (i < cur.i) || (i === cur.i && j < cur.j);
              return (
                <div key={j} style={{
                  width: '44px', height: '44px', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  background: isActive ? 'rgba(79,143,240,0.25)' : isPrev ? 'rgba(52,211,153,0.07)' : 'rgba(30,41,59,0.6)',
                  border: `2px solid ${isActive ? AV_COLORS.active : isPrev ? '#1e4033' : 'rgba(255,255,255,0.08)'}`,
                  transition: 'all 0.3s',
                  animation: isActive ? 'avCellPulse 0.5s ease' : 'none',
                  boxShadow: isActive ? `0 0 14px ${AV_COLORS.active}50` : 'none',
                }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.9rem', color: isActive ? AV_COLORS.active : isPrev ? '#34d39977' : '#4b5563' }}>{v}</span>
                  <span style={{ fontSize: '0.5rem', color: isActive ? AV_COLORS.compare : '#334155' }}>[{i}, {j}]</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </VisualizerWrapper>
  );
};

// ─── 9. VariableStateVisualizer ──────────────────────────────────────────────

export const VariableStateVisualizer = ({ sequence = [{ name: 'x', value: 5, op: 'x ← 5' }, { name: 'x', value: 6, op: 'x ← x + 1' }, { name: 'x', value: 12, op: 'x ← x * 2' }] }) => {
  const steps = sequence.map((s, idx) => ({
    ...s,
    desc: { text: `${s.op} — La variable "${s.name}" reçoit la valeur ${s.value}.`, color: AV_COLORS.active },
    vars: [{ name: s.name, value: s.value, color: AV_COLORS.active, changed: idx > 0 }],
    prev: idx > 0 ? sequence[idx - 1].value : null,
  }));

  const { step, playing, speed, setSpeed, play, stop, reset, stepForward } = useStepPlayer(steps, 1200);
  const cur = steps[step];

  return (
    <VisualizerWrapper title="Visualiseur — Affectation de Variable" icon="📦"
      description={cur.desc} variables={cur.vars}
      controls={<StepControls playing={playing} onPlay={play} onPause={stop} onReset={reset} onStep={stepForward} speed={speed} onSpeedChange={setSpeed} currentStep={step} totalSteps={steps.length} />}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '0.5rem 0', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 800 }}>Instruction</div>
          <div style={{ background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.5rem 1rem', fontFamily: 'monospace', color: '#c084fc', fontWeight: 700, fontSize: '0.9rem', animation: 'avFadeSlide 0.35s ease' }}>
            {cur.op}
          </div>
        </div>
        <ChevronRight size={16} color="#334155" />
        <div style={{ display: 'flex', flex: 1, gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {cur.prev !== null && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <div style={{ fontSize: '0.62rem', color: '#475569', textTransform: 'uppercase' }}>Avant</div>
                <div style={{ minWidth: '60px', height: '60px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'monospace', fontWeight: 800, fontSize: '1.2rem', color: '#475569' }}>{cur.prev}</div>
                <div style={{ fontSize: '0.65rem', color: '#334155', fontFamily: 'monospace' }}>{cur.name}</div>
              </div>
              <span style={{ color: AV_COLORS.active, fontSize: '1.4rem' }}>→</span>
            </>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <div style={{ fontSize: '0.62rem', color: AV_COLORS.active, textTransform: 'uppercase', fontWeight: 800 }}>Maintenant</div>
            <div key={cur.value} style={{ minWidth: '64px', height: '64px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(79,143,240,0.2)', border: `2px solid ${AV_COLORS.active}`, fontFamily: 'monospace', fontWeight: 800, fontSize: '1.4rem', color: AV_COLORS.active, animation: 'avVarChange 0.4s ease', boxShadow: `0 0 16px ${AV_COLORS.active}40` }}>{cur.value}</div>
            <div style={{ fontSize: '0.65rem', color: AV_COLORS.active, fontFamily: 'monospace', fontWeight: 700 }}>{cur.name}</div>
          </div>
        </div>
      </div>
    </VisualizerWrapper>
  );
};

// ─── 10. ConditionFlowVisualizer ─────────────────────────────────────────────

export const ConditionFlowVisualizer = ({
  condition = 'x > 10',
  trueBlock = 'ECRIRE("Grand")',
  falseBlock = 'ECRIRE("Petit")',
  testValues = [{ label: 'x = 15', result: true }, { label: 'x = 5', result: false }, { label: 'x = 10', result: false }],
}) => {
  const steps = [];
  steps.push({ phase: 'intro', desc: { text: `On va évaluer la condition : ${condition}`, color: AV_COLORS.neutral }, result: null });
  testValues.forEach(tv => {
    steps.push({ phase: 'eval', testVal: tv.label, desc: { text: `Test avec ${tv.label} : est-ce que ${condition} ?`, color: AV_COLORS.compare }, result: null });
    steps.push({ phase: 'result', testVal: tv.label, result: tv.result, desc: { text: tv.result ? `VRAI → On exécute le bloc ALORS : ${trueBlock}` : `FAUX → On exécute le bloc SINON : ${falseBlock}`, color: tv.result ? AV_COLORS.found : AV_COLORS.reject } });
  });

  const { step, playing, speed, setSpeed, play, stop, reset, stepForward } = useStepPlayer(steps, 1400);
  const cur = steps[step];

  return (
    <VisualizerWrapper title="Visualiseur — Structure Conditionnelle" icon="⑇"
      description={cur.desc}
      controls={<StepControls playing={playing} onPlay={play} onPause={stop} onReset={reset} onStep={stepForward} speed={speed} onSpeedChange={setSpeed} currentStep={step} totalSteps={steps.length} />}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '0.5rem 0' }}>
        {/* Condition box */}
        <div style={{ padding: '0.6rem 1.4rem', borderRadius: '10px', background: cur.phase === 'eval' ? 'rgba(167,139,250,0.2)' : 'rgba(250,204,21,0.1)', border: `2px solid ${cur.phase === 'eval' ? AV_COLORS.compare : 'rgba(250,204,21,0.4)'}`, fontFamily: 'monospace', fontWeight: 800, fontSize: '0.95rem', color: cur.phase === 'eval' ? AV_COLORS.compare : '#facc15', transition: 'all 0.3s', animation: cur.phase === 'eval' ? 'avCellPulse 0.5s ease' : 'none' }}>
          SI {condition} ALORS
          {cur.testVal && <span style={{ marginLeft: '0.7rem', fontSize: '0.75rem', opacity: 0.8 }}>({cur.testVal})</span>}
        </div>

        {/* Result badge */}
        {cur.result !== null && (
          <div style={{ padding: '0.35rem 1rem', borderRadius: '100px', background: cur.result ? 'rgba(52,211,153,0.15)' : 'rgba(251,113,133,0.12)', border: `1px solid ${cur.result ? AV_COLORS.found : AV_COLORS.reject}55`, color: cur.result ? AV_COLORS.found : AV_COLORS.reject, fontWeight: 800, fontSize: '0.85rem', animation: 'avBounce 0.4s ease' }}>
            {cur.result ? '✓ VRAI' : '✗ FAUX'}
          </div>
        )}

        {/* Branches */}
        <div style={{ display: 'flex', gap: '3rem', width: '100%', justifyContent: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: AV_COLORS.found, fontSize: '1.5rem' }}>↙</span>
            <div style={{ padding: '0.5rem 1rem', borderRadius: '8px', background: cur.result === true ? 'rgba(52,211,153,0.2)' : 'rgba(52,211,153,0.05)', border: `1px solid ${cur.result === true ? AV_COLORS.found : 'rgba(52,211,153,0.15)'}`, color: cur.result === true ? AV_COLORS.found : '#334155', fontFamily: 'monospace', fontSize: '0.82rem', transition: 'all 0.3s', animation: cur.result === true ? 'avCondTrue 0.4s ease' : 'none', opacity: cur.result === false ? 0.4 : 1 }}>
              {trueBlock}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: AV_COLORS.reject, fontSize: '1.5rem' }}>↘</span>
            <div style={{ padding: '0.5rem 1rem', borderRadius: '8px', background: cur.result === false ? 'rgba(251,113,133,0.15)' : 'rgba(251,113,133,0.04)', border: `1px solid ${cur.result === false ? AV_COLORS.reject : 'rgba(251,113,133,0.12)'}`, color: cur.result === false ? AV_COLORS.reject : '#334155', fontFamily: 'monospace', fontSize: '0.82rem', transition: 'all 0.3s', animation: cur.result === false ? 'avCondTrue 0.4s ease' : 'none', opacity: cur.result === true ? 0.4 : 1 }}>
              {falseBlock}
            </div>
          </div>
        </div>
      </div>
    </VisualizerWrapper>
  );
};

// ─── 11. LoopExecutionVisualizer ─────────────────────────────────────────────

export const LoopExecutionVisualizer = ({ start = 1, end = 5, bodyLabel = 'ECRIRE(i)', type = 'pour' }) => {
  const steps = [];
  steps.push({ i: null, phase: 'init', desc: { text: `Initialisation : i ← ${start}. La boucle va s'exécuter de ${start} à ${end}.`, color: AV_COLORS.neutral }, vars: [] });

  for (let i = start; i <= end; i++) {
    const condOk = i <= end;
    steps.push({ i, phase: 'check', desc: { text: `Test de condition : i = ${i} ≤ ${end} ? → ${condOk ? 'VRAI → on entre dans le corps' : 'FAUX → on sort'}`, color: condOk ? AV_COLORS.active : AV_COLORS.reject }, vars: [{ name: 'i', value: i, color: AV_COLORS.active }] });
    steps.push({ i, phase: 'body', desc: { text: `Corps de boucle (itération ${i - start + 1}) : ${bodyLabel} avec i = ${i}`, color: AV_COLORS.compare }, vars: [{ name: 'i', value: i, color: AV_COLORS.temp }] });
    if (i < end) {
      steps.push({ i: i + 1, phase: 'update', desc: { text: `i ← i + 1 = ${i + 1}. On revient au test de condition.`, color: AV_COLORS.active }, vars: [{ name: 'i', value: i + 1, color: AV_COLORS.active, changed: true }] });
    }
  }
  steps.push({ i: end + 1, phase: 'end', desc: { text: `i = ${end + 1} > ${end} → condition FAUSSE. La boucle se termine. ${end - start + 1} itérations effectuées.`, color: AV_COLORS.found }, vars: [{ name: 'i', value: end + 1, color: AV_COLORS.reject }, { name: 'itérations', value: end - start + 1, color: AV_COLORS.found }] });

  const { step, playing, speed, setSpeed, play, stop, reset, stepForward } = useStepPlayer(steps, 1000);
  const cur = steps[step];

  const iterations = Array.from({ length: end - start + 1 }, (_, k) => start + k);

  return (
    <VisualizerWrapper title={`Visualiseur — Boucle ${type.toUpperCase()}`} icon="🔁"
      description={cur.desc} variables={cur.vars}
      controls={<StepControls playing={playing} onPlay={play} onPause={stop} onReset={reset} onStep={stepForward} speed={speed} onSpeedChange={setSpeed} currentStep={step} totalSteps={steps.length} />}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {/* Loop header */}
        <div style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: '#c084fc', background: 'rgba(192,132,252,0.08)', border: '1px solid rgba(192,132,252,0.2)', borderRadius: '8px', padding: '0.5rem 1rem' }}>
          POUR i DE {start} A {end} FAIRE
        </div>

        {/* Iterations */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', padding: '0.25rem 0' }}>
          {iterations.map(i => {
            const isPast = cur.i !== null && i < cur.i && cur.phase !== 'init';
            const isCurrent = cur.i === i && cur.phase !== 'update' && cur.phase !== 'end';
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isCurrent && cur.phase === 'body' ? 'rgba(167,139,250,0.25)' : isCurrent ? 'rgba(79,143,240,0.2)' : isPast ? 'rgba(52,211,153,0.1)' : 'rgba(30,41,59,0.5)',
                  border: `2px solid ${isCurrent && cur.phase === 'body' ? AV_COLORS.compare : isCurrent ? AV_COLORS.active : isPast ? AV_COLORS.found + '44' : 'rgba(255,255,255,0.07)'}`,
                  fontFamily: 'monospace', fontWeight: 800, fontSize: '0.95rem',
                  color: isCurrent && cur.phase === 'body' ? AV_COLORS.compare : isCurrent ? AV_COLORS.active : isPast ? AV_COLORS.found : '#4b5563',
                  animation: isCurrent && cur.phase === 'body' ? 'avCellPulse 0.5s ease' : 'none',
                  transition: 'all 0.35s',
                }}>
                  {i}
                </div>
                <span style={{ fontSize: '0.62rem', color: isPast ? AV_COLORS.found + '88' : '#334155', fontFamily: 'monospace' }}>i={i}</span>
                {isCurrent && cur.phase === 'body' && (
                  <span style={{ fontSize: '0.58rem', color: AV_COLORS.compare, fontWeight: 800, animation: 'avFadeSlide 0.3s ease' }}>▲ corps</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Body indicator */}
        <div style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: cur.phase === 'body' ? AV_COLORS.compare : '#334155', background: cur.phase === 'body' ? 'rgba(167,139,250,0.12)' : 'rgba(255,255,255,0.02)', border: `1px solid ${cur.phase === 'body' ? AV_COLORS.compare + '44' : 'rgba(255,255,255,0.05)'}`, borderRadius: '8px', padding: '0.5rem 1rem', transition: 'all 0.3s', animation: cur.phase === 'body' ? 'avFadeSlide 0.3s ease' : 'none' }}>
          &nbsp;&nbsp;{bodyLabel}
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: '#c084fc', background: 'rgba(192,132,252,0.05)', border: '1px solid rgba(192,132,252,0.15)', borderRadius: '8px', padding: '0.5rem 1rem' }}>
          FINPOUR
        </div>
      </div>
    </VisualizerWrapper>
  );
};

// ─── 12. AccumulatorVisualizer ───────────────────────────────────────────────

export const AccumulatorVisualizer = ({ values = [3, 7, 2, 8, 5], varName = 'total', operation = '+', initVal = 0 }) => {
  const steps = [];
  let acc = initVal;
  const total = values.reduce((a, b) => operation === '+' ? a + b : a * b, initVal);

  steps.push({ active: -1, acc, desc: { text: `On initialise ${varName} ← ${initVal}. Valeur neutre pour ${operation === '+' ? 'l\'addition' : 'la multiplication'}.`, color: AV_COLORS.neutral }, vars: [{ name: varName, value: acc, color: AV_COLORS.temp }] });

  values.forEach((v, i) => {
    const prev = acc;
    acc = operation === '+' ? acc + v : acc * v;
    steps.push({ active: i, acc, desc: { text: `${varName} ← ${prev} ${operation} ${v} = ${acc}`, color: AV_COLORS.temp }, vars: [{ name: 'i', value: i, color: AV_COLORS.active }, { name: `T[${i}]`, value: v, color: AV_COLORS.compare }, { name: varName, value: acc, color: AV_COLORS.temp, changed: true }] });
  });
  steps.push({ active: -1, acc, done: true, desc: { text: `Résultat : ${varName} = ${acc}${operation === '+' ? `, moyenne = ${(acc / values.length).toFixed(2)}` : ''}`, color: AV_COLORS.found }, vars: [{ name: varName, value: acc, color: AV_COLORS.found }] });

  const { step, playing, speed, setSpeed, play, stop, reset, stepForward } = useStepPlayer(steps, 900);
  const cur = steps[step];
  const pct = total !== 0 ? Math.min(100, Math.abs(cur.acc / total) * 100) : 0;

  return (
    <VisualizerWrapper title="Visualiseur — Accumulateur" icon="∑"
      description={cur.desc} variables={cur.vars}
      controls={<StepControls playing={playing} onPlay={play} onPause={stop} onReset={reset} onStep={stepForward} speed={speed} onSpeedChange={setSpeed} currentStep={step} totalSteps={steps.length} />}>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end' }}>
          {values.map((v, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <div style={{ fontSize: '0.65rem', color: i === cur.active ? AV_COLORS.compare : '#334155' }}>T[{i}]</div>
              <div style={{ width: '36px', height: '38px', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: i === cur.active ? 'rgba(167,139,250,0.2)' : i < cur.active ? 'rgba(52,211,153,0.07)' : 'rgba(30,41,59,0.5)', border: `2px solid ${i === cur.active ? AV_COLORS.compare : i < cur.active ? '#1e4033' : 'rgba(255,255,255,0.07)'}`, fontFamily: 'monospace', fontWeight: 800, color: i === cur.active ? AV_COLORS.compare : i < cur.active ? '#4b5563' : '#374151', animation: i === cur.active ? 'avCellPulse 0.4s ease' : 'none', transition: 'all 0.3s', fontSize: '0.88rem' }}>
                {v}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', marginLeft: '1rem' }}>
          <div style={{ fontSize: '0.65rem', color: AV_COLORS.temp, fontWeight: 800, textTransform: 'uppercase' }}>{varName}</div>
          <div style={{ width: '50px', height: '80px', background: 'rgba(30,41,59,0.8)', border: `2px solid ${AV_COLORS.temp}44`, borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'flex-end' }}>
            <div style={{ width: '100%', background: `linear-gradient(180deg, ${AV_COLORS.temp}, #d97706)`, height: `${pct}%`, transition: 'height 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)', borderRadius: '6px 6px 0 0' }} />
          </div>
          <div key={cur.acc} style={{ fontFamily: 'monospace', fontWeight: 800, color: cur.done ? AV_COLORS.found : AV_COLORS.temp, fontSize: '1.1rem', animation: 'avVarChange 0.35s ease' }}>{cur.acc}</div>
        </div>
      </div>
    </VisualizerWrapper>
  );
};

// ─── 13. ExpressionVisualizer ─────────────────────────────────────────────────

export const ExpressionVisualizer = ({
  tokens = [
    { val: '2', type: 'num' }, { val: '+', type: 'op' },
    { val: '3', type: 'num' }, { val: '*', type: 'op' },
    { val: '4', type: 'num' },
  ],
  steps: propSteps = null,
}) => {
  const defaultSteps = [
    { highlight: [2, 3, 4], result: null,  desc: { text: `Priorité des opérateurs : la multiplication est calculée avant l'addition.`, color: AV_COLORS.neutral } },
    { highlight: [2, 3, 4], result: '12',  partial: '12', desc: { text: `3 × 4 = 12. On remplace 3 × 4 par 12.`, color: AV_COLORS.compare } },
    { highlight: [0, 1, 2], result: '14',  partial: '14', desc: { text: `2 + 12 = 14. Résultat final de l'expression !`, color: AV_COLORS.found } },
  ];
  const stepsToUse = propSteps || defaultSteps;
  const { step, playing, speed, setSpeed, play, stop, reset, stepForward } = useStepPlayer(stepsToUse, 1400);
  const cur = stepsToUse[step];

  return (
    <VisualizerWrapper title="Visualiseur — Évaluation d'Expression" icon="🔢"
      description={cur.desc}
      controls={<StepControls playing={playing} onPlay={play} onPause={stop} onReset={reset} onStep={stepForward} speed={speed} onSpeedChange={setSpeed} currentStep={step} totalSteps={stepsToUse.length} />}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', padding: '0.5rem 0' }}>
        {tokens.map((t, i) => {
          const isHighlighted = cur.highlight && cur.highlight.includes(i);
          return (
            <div key={i} style={{
              padding: t.type === 'op' ? '0.3rem 0.5rem' : '0.4rem 0.9rem',
              borderRadius: '8px',
              fontFamily: 'monospace', fontWeight: 800, fontSize: t.type === 'op' ? '1.2rem' : '1.1rem',
              background: isHighlighted ? (t.type === 'op' ? 'rgba(167,139,250,0.2)' : 'rgba(79,143,240,0.2)') : 'rgba(30,41,59,0.5)',
              border: `2px solid ${isHighlighted ? (t.type === 'op' ? AV_COLORS.compare : AV_COLORS.active) : 'rgba(255,255,255,0.07)'}`,
              color: isHighlighted ? (t.type === 'op' ? AV_COLORS.compare : AV_COLORS.active) : '#64748b',
              transition: 'all 0.3s',
              animation: isHighlighted ? 'avCellPulse 0.5s ease' : 'none',
            }}>
              {t.val}
            </div>
          );
        })}
        {cur.partial && (
          <>
            <span style={{ color: '#334155', fontSize: '1.4rem', fontWeight: 800 }}>=</span>
            <div style={{
              padding: '0.4rem 1rem', borderRadius: '8px',
              background: cur.result === '14' || cur.result ? 'rgba(52,211,153,0.2)' : 'rgba(250,204,21,0.15)',
              border: `2px solid ${cur.result ? AV_COLORS.found : AV_COLORS.temp}`,
              fontFamily: 'monospace', fontWeight: 800, fontSize: '1.1rem',
              color: cur.result ? AV_COLORS.found : AV_COLORS.temp,
              animation: 'avBounce 0.4s ease',
            }}>
              {cur.partial}
            </div>
          </>
        )}
      </div>
    </VisualizerWrapper>
  );
};

// ─── 14. BooleanLogicVisualizer ───────────────────────────────────────────────

export const BooleanLogicVisualizer = ({ operator = 'ET' }) => {
  const combos = operator === 'NON'
    ? [{ a: true, label: 'A = VRAI' }, { a: false, label: 'A = FAUX' }]
    : [{ a: true, b: true }, { a: true, b: false }, { a: false, b: true }, { a: false, b: false }];

  const evalResult = (c) => {
    if (operator === 'ET') return c.a && c.b;
    if (operator === 'OU') return c.a || c.b;
    if (operator === 'NON') return !c.a;
    return false;
  };

  const steps = combos.map(c => {
    const res = evalResult(c);
    const aStr = c.a ? 'VRAI' : 'FAUX';
    const bStr = c.b !== undefined ? (c.b ? 'VRAI' : 'FAUX') : '';
    const expr = operator === 'NON' ? `NON(${aStr})` : `(${aStr} ${operator} ${bStr})`;
    return {
      a: c.a, b: c.b, result: res,
      desc: { text: `${expr} → ${res ? 'VRAI ✓' : 'FAUX ✗'}`, color: res ? AV_COLORS.found : AV_COLORS.reject },
    };
  });

  const { step, playing, speed, setSpeed, play, stop, reset, stepForward } = useStepPlayer(steps, 1600);
  const cur = steps[step];

  const BoolBadge = ({ val, label }) => (
    <div style={{
      padding: '0.35rem 0.9rem', borderRadius: '8px', fontFamily: 'monospace', fontWeight: 800, fontSize: '0.88rem',
      background: val ? 'rgba(52,211,153,0.15)' : 'rgba(251,113,133,0.12)',
      border: `1px solid ${val ? AV_COLORS.found : AV_COLORS.reject}55`,
      color: val ? AV_COLORS.found : AV_COLORS.reject,
    }}>
      {label || (val ? 'VRAI' : 'FAUX')}
    </div>
  );

  return (
    <VisualizerWrapper title={`Visualiseur — Opérateur ${operator}`} icon="🔀"
      description={cur.desc}
      controls={<StepControls playing={playing} onPlay={play} onPause={stop} onReset={reset} onStep={stepForward} speed={speed} onSpeedChange={setSpeed} currentStep={step} totalSteps={steps.length} />}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', padding: '0.5rem 0', justifyContent: 'center' }}>
        <BoolBadge val={cur.a} />
        <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#a78bfa', fontSize: '1rem' }}>{operator}</span>
        {cur.b !== undefined && <BoolBadge val={cur.b} />}
        <span style={{ color: '#475569', fontSize: '1.4rem', fontWeight: 800 }}>=</span>
        <div key={String(cur.result)} style={{
          padding: '0.45rem 1.2rem', borderRadius: '10px', fontFamily: 'monospace', fontWeight: 800, fontSize: '1rem',
          background: cur.result ? 'rgba(52,211,153,0.2)' : 'rgba(251,113,133,0.15)',
          border: `2px solid ${cur.result ? AV_COLORS.found : AV_COLORS.reject}`,
          color: cur.result ? AV_COLORS.found : AV_COLORS.reject,
          animation: 'avBounce 0.4s ease',
          boxShadow: `0 0 12px ${cur.result ? AV_COLORS.found : AV_COLORS.reject}30`,
        }}>
          {cur.result ? 'VRAI' : 'FAUX'}
        </div>
      </div>
      {/* Truth table */}
      <div style={{ marginTop: '0.75rem', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', fontFamily: 'monospace' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <th style={{ padding: '0.35rem 0.6rem', color: '#64748b', textAlign: 'center' }}>A</th>
              {operator !== 'NON' && <th style={{ padding: '0.35rem 0.6rem', color: '#64748b', textAlign: 'center' }}>B</th>}
              <th style={{ padding: '0.35rem 0.6rem', color: '#a78bfa', textAlign: 'center' }}>A {operator} {operator !== 'NON' ? 'B' : ''}</th>
            </tr>
          </thead>
          <tbody>
            {steps.map((s, idx) => {
              const r = evalResult(s);
              const isActive = idx === step;
              return (
                <tr key={idx} style={{ background: isActive ? 'rgba(79,143,240,0.08)' : 'transparent', borderLeft: isActive ? `2px solid ${AV_COLORS.active}` : '2px solid transparent' }}>
                  <td style={{ padding: '0.3rem 0.6rem', textAlign: 'center', color: s.a ? AV_COLORS.found : AV_COLORS.reject }}>{s.a ? 'V' : 'F'}</td>
                  {operator !== 'NON' && <td style={{ padding: '0.3rem 0.6rem', textAlign: 'center', color: s.b ? AV_COLORS.found : AV_COLORS.reject }}>{s.b ? 'V' : 'F'}</td>}
                  <td style={{ padding: '0.3rem 0.6rem', textAlign: 'center', fontWeight: isActive ? 800 : 400, color: r ? AV_COLORS.found : AV_COLORS.reject }}>{r ? 'V' : 'F'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </VisualizerWrapper>
  );
};

// ─── 15. ArrayCopyVisualizer ──────────────────────────────────────────────────

export const ArrayCopyVisualizer = ({ arrayA = [10, 20, 30, 40, 50], nameA = 'A', nameB = 'B' }) => {
  const n = arrayA.length;
  const steps = [];
  const b = new Array(n).fill(null);

  steps.push({ i: -1, b: [...b], desc: { text: `Tableau ${nameB} initialement vide. On va copier chaque case de ${nameA} vers ${nameB}.`, color: AV_COLORS.neutral }, vars: [] });

  for (let i = 0; i < n; i++) {
    b[i] = arrayA[i];
    steps.push({
      i, b: [...b],
      desc: { text: `${nameB}[${i}] ← ${nameA}[${i}] = ${arrayA[i]}. Case copiée !`, color: AV_COLORS.active },
      vars: [{ name: 'i', value: i, color: AV_COLORS.active }, { name: `${nameA}[i]`, value: arrayA[i], color: AV_COLORS.compare }, { name: `${nameB}[i]`, value: arrayA[i], color: AV_COLORS.found }],
    });
  }
  steps.push({ i: n, b: [...b], done: true, desc: { text: `Copie terminée ! ${nameA} et ${nameB} sont indépendants — modifier l'un ne change pas l'autre.`, color: AV_COLORS.found }, vars: [] });

  const { step, playing, speed, setSpeed, play, stop, reset, stepForward } = useStepPlayer(steps, 800);
  const cur = steps[step];

  return (
    <VisualizerWrapper title="Visualiseur — Copie de Tableau" icon="📋"
      description={cur.desc} variables={cur.vars}
      controls={<StepControls playing={playing} onPlay={play} onPause={stop} onReset={reset} onStep={stepForward} speed={speed} onSpeedChange={setSpeed} currentStep={step} totalSteps={steps.length} />}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {/* Array A */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.72rem', color: AV_COLORS.compare, fontFamily: 'monospace', fontWeight: 800, minWidth: '20px' }}>{nameA}</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            {arrayA.map((v, i) => <ArrayCell key={i} value={v} index={i} name={nameA} state={i === cur.i ? 'compare' : 'sorted'} />)}
          </div>
        </div>
        {/* Arrow */}
        <div style={{ paddingLeft: '1.5rem', fontSize: '0.75rem', color: cur.i >= 0 && !cur.done ? AV_COLORS.active : '#334155', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {cur.i >= 0 && !cur.done && <span style={{ animation: 'avFadeSlide 0.3s ease' }}>↓ copie {nameA}[{cur.i}] → {nameB}[{cur.i}]</span>}
        </div>
        {/* Array B */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.72rem', color: AV_COLORS.found, fontFamily: 'monospace', fontWeight: 800, minWidth: '20px' }}>{nameB}</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            {cur.b.map((v, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                <div style={{
                  minWidth: '44px', height: '44px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: v !== null ? (i === cur.i - 1 && !cur.done ? 'rgba(52,211,153,0.25)' : 'rgba(52,211,153,0.1)') : 'rgba(30,41,59,0.4)',
                  border: `2px solid ${v !== null ? (i === cur.i - 1 ? AV_COLORS.found : '#1e4033') : 'rgba(255,255,255,0.06)'}`,
                  fontFamily: 'monospace', fontWeight: 800, fontSize: '0.95rem',
                  color: v !== null ? AV_COLORS.found : '#334155',
                  animation: i === cur.i - 1 && !cur.done ? 'avBounce 0.4s ease' : 'none',
                  transition: 'all 0.3s',
                }}>
                  {v !== null ? v : '?'}
                </div>
                <div style={{ fontSize: '0.65rem', color: '#334155', fontFamily: 'monospace' }}>{nameB}[{i}]</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </VisualizerWrapper>
  );
};

// ─── 16. RecordVisualizer ─────────────────────────────────────────────────────

export const RecordVisualizer = ({
  typeName = 'Personne',
  fields = [
    { name: 'nom', type: 'CHAINE', value: '"Alice"', color: '#4ade80' },
    { name: 'age', type: 'ENTIER', value: '25', color: '#facc15' },
    { name: 'score', type: 'REEL', value: '17.5', color: '#4f8ff0' },
  ],
  varName = 'p',
}) => {
  const steps = [
    { active: -1, desc: { text: `On déclare la variable ${varName} de type ${typeName}. Tous les champs sont non initialisés.`, color: AV_COLORS.neutral } },
    ...fields.map((f, i) => ({
      active: i,
      desc: { text: `${varName}.${f.name} ← ${f.value} — Le champ "${f.name}" de type ${f.type} reçoit sa valeur.`, color: f.color || AV_COLORS.active },
      vars: [{ name: `${varName}.${f.name}`, value: f.value, color: f.color || AV_COLORS.active, changed: true }],
    })),
    {
      active: fields.length,
      desc: { text: `L'enregistrement ${varName} est complet. Accès via notation pointée : ${varName}.${fields[0]?.name}, ${varName}.${fields[1]?.name}...`, color: AV_COLORS.found },
    },
  ];

  const { step, playing, speed, setSpeed, play, stop, reset, stepForward } = useStepPlayer(steps, 1200);
  const cur = steps[step];

  return (
    <VisualizerWrapper title={`Visualiseur — Enregistrement ${typeName}`} icon="🗂️"
      description={cur.desc} variables={cur.vars}
      controls={<StepControls playing={playing} onPlay={play} onPause={stop} onReset={reset} onStep={stepForward} speed={speed} onSpeedChange={setSpeed} currentStep={step} totalSteps={steps.length} />}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {/* Type header */}
        <div style={{ fontSize: '0.72rem', color: '#a78bfa', fontFamily: 'monospace', fontWeight: 800, marginBottom: '0.25rem' }}>
          TYPE {typeName} = ENREGISTREMENT
        </div>
        {/* Fields */}
        {fields.map((f, i) => {
          const isActive = cur.active === i;
          const isDone = cur.active > i || cur.active === fields.length;
          return (
            <div key={f.name} style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.5rem 0.9rem', borderRadius: '10px',
              background: isActive ? `${f.color || AV_COLORS.active}18` : isDone ? 'rgba(52,211,153,0.06)' : 'rgba(30,41,59,0.5)',
              border: `1px solid ${isActive ? (f.color || AV_COLORS.active) + '55' : isDone ? '#1e4033' : 'rgba(255,255,255,0.06)'}`,
              transition: 'all 0.3s',
              animation: isActive ? 'avFadeSlide 0.3s ease' : 'none',
            }}>
              <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: isActive ? (f.color || AV_COLORS.active) : isDone ? '#4b5563' : '#334155', fontWeight: isActive ? 800 : 400, minWidth: '80px' }}>{f.name}</span>
              <span style={{ fontSize: '0.68rem', color: '#475569' }}>: {f.type}</span>
              <span style={{ marginLeft: 'auto', fontFamily: 'monospace', fontWeight: 800, fontSize: '0.88rem', color: isActive ? (f.color || AV_COLORS.active) : isDone ? '#34d39977' : '#334155', animation: isActive ? 'avVarChange 0.4s ease' : 'none' }}>
                {isActive || isDone ? f.value : '—'}
              </span>
            </div>
          );
        })}
        <div style={{ fontSize: '0.72rem', color: '#a78bfa', fontFamily: 'monospace', fontWeight: 800 }}>
          FIN {typeName}
        </div>
        {cur.active >= 0 && (
          <div style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#4f8ff0', fontFamily: 'monospace' }}>
            Accès : <span style={{ color: '#facc15' }}>{varName}.{fields[Math.min(cur.active, fields.length - 1)]?.name}</span>
          </div>
        )}
      </div>
    </VisualizerWrapper>
  );
};

// ─── 17. MatrixReverseVisualizer ──────────────────────────────────────────────

export const MatrixReverseVisualizer = ({ matrix = [[4,4,4], [3,3,3], [2,2,2], [1,1,1]], name = 'M' }) => {
  const steps = [];
  const m = matrix.map(row => [...row]);
  const L = m.length;
  
  steps.push({ m: m.map(r => [...r]), activeL: -1, activeR: -1, swapping: false, desc: { text: "Matrice initiale. On va inverser les lignes : la première avec la dernière.", color: AV_COLORS.neutral }, vars: [] });
  
  for (let i = 0; i < Math.floor(L / 2); i++) {
    const opp = L - 1 - i;
    steps.push({ m: m.map(r => [...r]), activeL: i, activeR: opp, swapping: true, desc: { text: `Échange de toute la ligne ${i} avec la ligne ${opp}.`, color: AV_COLORS.compare }, vars: [{ name: 'i', value: i, color: AV_COLORS.active }, { name: 'L-1-i', value: opp, color: AV_COLORS.compare }] });
    
    const temp = m[i];
    m[i] = m[opp];
    m[opp] = temp;
    
    steps.push({ m: m.map(r => [...r]), activeL: i, activeR: opp, done: true, desc: { text: `Lignes échangées !`, color: AV_COLORS.found }, vars: [] });
  }
  steps.push({ m: m.map(r => [...r]), activeL: -1, activeR: -1, doneAll: true, desc: { text: `Inversion terminée !`, color: AV_COLORS.found }, vars: [] });

  const { step, playing, speed, setSpeed, play, stop, reset, stepForward } = useStepPlayer(steps, 1400);
  const cur = steps[step];

  return (
    <VisualizerWrapper title="Visualiseur — Inversion de Matrice" icon="🔃"
      description={cur.desc} variables={cur.vars}
      controls={<StepControls playing={playing} onPlay={play} onPause={stop} onReset={reset} onStep={stepForward} speed={speed} onSpeedChange={setSpeed} currentStep={step} totalSteps={steps.length} />}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflowX: 'auto', padding: '0.5rem 0', position: 'relative' }}>
        {cur.m.map((row, i) => (
          <div key={i} style={{ display: 'flex', gap: '4px', transition: 'transform 0.4s ease', transform: cur.swapping && (i === cur.activeL && cur.activeR > i) ? `translateY(${(cur.activeR-cur.activeL)*44}px)` : cur.swapping && (i === cur.activeR && cur.activeL < i) ? `translateY(-${(cur.activeR-cur.activeL)*44}px)` : 'none' }}>
            {row.map((val, j) => {
              let state = 'neutral';
              if (cur.doneAll) state = 'found';
              else if (cur.done && (i === cur.activeL || i === cur.activeR)) state = 'found';
              else if (i === cur.activeL || i === cur.activeR) state = 'compare';
              
              return (
                <div key={j} style={{
                  minWidth: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: state === 'compare' ? 'rgba(250,204,21,0.15)' : state === 'found' ? 'rgba(52,211,153,0.2)' : 'rgba(30,41,59,0.5)',
                  border: `2px solid ${state === 'compare' ? AV_COLORS.compare : state === 'found' ? AV_COLORS.found : 'rgba(255,255,255,0.08)'}`,
                  color: state === 'compare' ? AV_COLORS.compare : state === 'found' ? AV_COLORS.found : '#94a3b8',
                  borderRadius: '6px', fontFamily: 'monospace', fontWeight: 800, fontSize: '0.9rem', transition: 'all 0.3s'
                }}>
                  {val}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </VisualizerWrapper>
  );
};

// ─── 18. MatrixShiftVisualizer ────────────────────────────────────────────────

export const MatrixShiftVisualizer = ({ matrix = [[3,1,2], [6,4,5]], name = 'M' }) => {
  const steps = [];
  const m = matrix.map(row => [...row]);
  const L = m.length;
  const C = m[0].length;

  steps.push({ m: m.map(r => [...r]), activeI: -1, activeJ: -1, saved: null, desc: { text: "Décalage de Matrice à droite. L'opération se répète pour chaque ligne (tableau 1D).", color: AV_COLORS.neutral }, vars: [] });

  for (let i = 0; i < L; i++) {
    const saved = m[i][C - 1];
    steps.push({ m: m.map(r => [...r]), activeI: i, activeJ: C - 1, saved, desc: { text: `Ligne ${i} : on sauvegarde le dernier élément (${saved}).`, color: AV_COLORS.temp }, vars: [{ name: 'i', value: i, color: AV_COLORS.active }, { name: 'dernier', value: saved, color: AV_COLORS.temp }] });

    for (let j = C - 1; j > 0; j--) {
      m[i][j] = m[i][j - 1];
      steps.push({ m: m.map(r => [...r]), activeI: i, activeJ: j, saved, desc: { text: `Ligne ${i} : on décale ${m[i][j]} vers la case de droite.`, color: AV_COLORS.active }, vars: [{ name: 'i', value: i, color: AV_COLORS.active }, { name: 'j', value: j, color: AV_COLORS.active }, { name: 'dernier', value: saved, color: AV_COLORS.temp }] });
    }
    m[i][0] = saved;
    steps.push({ m: m.map(r => [...r]), activeI: i, activeJ: 0, saved, desc: { text: `Ligne ${i} : réinsertion de l'élément sauvegardé au début de la ligne.`, color: AV_COLORS.found }, vars: [{ name: 'i', value: i, color: AV_COLORS.active }, { name: `M[${i}, 0]`, value: saved, color: AV_COLORS.found, changed: true }] });
  }

  steps.push({ m: m.map(r => [...r]), activeI: -1, activeJ: -1, saved: null, doneAll: true, desc: { text: "Terminé ! Toutes les lignes ont été décalées.", color: AV_COLORS.found }, vars: [] });

  const { step, playing, speed, setSpeed, play, stop, reset, stepForward } = useStepPlayer(steps, 1000);
  const cur = steps[step];

  return (
    <VisualizerWrapper title="Visualiseur — Décalage Horizontal" icon="➡"
      description={cur.desc} variables={cur.vars}
      controls={<StepControls playing={playing} onPlay={play} onPause={stop} onReset={reset} onStep={stepForward} speed={speed} onSpeedChange={setSpeed} currentStep={step} totalSteps={steps.length} />}>
      {cur.saved !== null && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Sauvegarde (dernier) :</span>
          <div style={{ background: 'rgba(250,204,21,0.15)', border: '1px solid rgba(250,204,21,0.4)', borderRadius: '6px', padding: '0.2rem 0.55rem', color: AV_COLORS.temp, fontFamily: 'monospace', fontWeight: 800 }}>{cur.saved}</div>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflowX: 'auto', padding: '0.5rem 0' }}>
        {cur.m.map((row, i) => (
          <div key={i} style={{ display: 'flex', gap: '4px' }}>
            {row.map((val, j) => {
              let state = 'neutral';
              if (cur.doneAll) state = 'found';
              else if (i === cur.activeI && j === cur.activeJ && cur.desc.text.includes('réinsertion')) state = 'found';
              else if (i === cur.activeI && (j === cur.activeJ || j === cur.activeJ - 1)&& cur.desc.text.includes('décalage')) state = 'active';
              else if (i === cur.activeI && j === cur.activeJ && cur.desc.text.includes('sauvegarde')) state = 'temp';
              else if (i < cur.activeI && !cur.doneAll) state = 'found'; // previous lines done
              
              return (
                <div key={j} style={{
                  minWidth: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: state === 'active' ? 'rgba(79,143,240,0.2)' : state === 'found' ? 'rgba(52,211,153,0.2)' : state === 'temp' ? 'rgba(250,204,21,0.15)' : 'rgba(30,41,59,0.5)',
                  border: `2px solid ${state === 'active' ? AV_COLORS.active : state === 'found' ? AV_COLORS.found : state === 'temp' ? AV_COLORS.temp : 'rgba(255,255,255,0.08)'}`,
                  color: state === 'active' ? AV_COLORS.active : state === 'found' ? AV_COLORS.found : state === 'temp' ? AV_COLORS.temp : '#94a3b8',
                  borderRadius: '6px', fontFamily: 'monospace', fontWeight: 800, fontSize: '0.9rem', transition: 'all 0.3s'
                }}>
                  {val}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </VisualizerWrapper>
  );
};
