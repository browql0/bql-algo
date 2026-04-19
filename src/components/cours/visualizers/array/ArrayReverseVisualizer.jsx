import React from 'react';
import ArrayCell from '../shared/ArrayCell';
import { AV_COLORS, StepControls, VisualizerWrapper, useStepPlayer } from '../../visualizerShared';

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
    <VisualizerWrapper title="Visualiseur : Inversion de Tableau" icon="Rotation"
      description={cur.desc} variables={cur.vars}
      controls={<StepControls playing={playing} onPlay={play} onPause={stop} onReset={reset} onStep={stepForward} speed={speed} onSpeedChange={setSpeed} currentStep={step} totalSteps={steps.length} />}>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', padding: '0.5rem 0', position: 'relative' }}>
        {cur.arr.map((v, i) => (
          <div key={i} style={{ animation: (i === cur.left || i === cur.right) && cur.swapping ?`avSwapUp 0.4s ease` : 'none' }}>
            <ArrayCell value={v} index={i} name={name} state={getState(i)} />
          </div>
        ))}
      </div>
      {cur.left >= 0 && cur.right >= 0 && (
        <div style={{ fontSize: '0.75rem', color: AV_COLORS.compare, fontFamily: 'monospace', marginTop: '0.25rem' }}>
          Échange : {name}[{cur.left}] {'<->'} {name}[{cur.right}]
        </div>
      )}
    </VisualizerWrapper>
  );
};
