import React from 'react';
import ArrayCell from '../shared/ArrayCell';
import { AV_COLORS, StepControls, VisualizerWrapper, useStepPlayer } from '../../visualizerShared';

export const ArraySearchVisualizer = ({ array = [12, 5, 8, 17, 3, 9], target = 17, name = 'T' }) => {
  const steps = array.map((v, i) => {
    const isFound = v === target;
    return {
      active: i,
      found: isFound ?i : -1,
      desc: isFound
        ?{ text: `${name}[${i}] = ${v} -> TROUVÉ ! La valeur cherchée (${target}) est à l'indice ${i}.`, color: AV_COLORS.found }
        : { text: `${name}[${i}] = ${v} ≠  ${target} → on continue…`, color: AV_COLORS.reject },
      vars: [{ name: 'i', value: i, color: AV_COLORS.active }, { name: 'cible', value: target, color: AV_COLORS.temp }, { name: 'trouvé', value: isFound ?'VRAI' : 'FAUX', color: isFound ?AV_COLORS.found : AV_COLORS.reject }],
    };
  });

  const { step, playing, speed, setSpeed, play, stop, reset, stepForward } = useStepPlayer(steps);
  const cur = steps[step];

  const getState = (i) => {
    if (cur.found === i) return 'found';
    if (i === cur.active) return 'compare';
    if (i < cur.active) return cur.found >= 0 && cur.found < i ?'sorted' : 'reject';
    return 'neutral';
  };

  return (
    <VisualizerWrapper title="Visualiseur : Recherche séquentielle" icon="Cible"
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
