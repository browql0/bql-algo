import React from 'react';
import ArrayCell from '../shared/ArrayCell';
import { AV_COLORS, StepControls, VisualizerWrapper, useStepPlayer } from '../../visualizerShared';

export const BubbleSortVisualizer = ({ array = [5, 3, 8, 1, 9, 2], name = 'T' }) => {
  const steps = [];
  const arr = [...array];
  const n = arr.length;
  const sorted = new Set();

  steps.push({ arr: [...arr], j: -1, j1: -1, sorted: new Set(), swapping: false, desc: { text: `Tableau initial : tri à bulles. On va comparer les paires adjacentes et les échanger si nécessaire.`, color: AV_COLORS.neutral }, vars: [] });

  for (let pass = 0; pass < n - 1; pass++) {
    for (let j = 0; j < n - 1 - pass; j++) {
      const needSwap = arr[j] > arr[j + 1];
      steps.push({ arr: [...arr], j, j1: j + 1, sorted: new Set(sorted), swapping: needSwap, pass, desc: needSwap ?{ text: `Passe ${pass + 1} : ${name}[${j}]=${arr[j]} > ${name}[${j + 1}]=${arr[j + 1]} -> On échange !`, color: AV_COLORS.compare } : { text: `Passe ${pass + 1} : ${name}[${j}]=${arr[j]} <= ${name}[${j + 1}]=${arr[j + 1]} -> OK, pas d'échange.`, color: AV_COLORS.active }, vars: [{ name: 'passe', value: pass + 1, color: '#64748b' }, { name: 'j', value: j, color: AV_COLORS.compare }, { name: `${name}[j]`, value: arr[j], color: AV_COLORS.compare }, { name: `${name}[j+1]`, value: arr[j + 1], color: AV_COLORS.compare }] });
      if (needSwap) {
        const tmp = arr[j]; arr[j] = arr[j + 1]; arr[j + 1] = tmp;
        steps.push({ arr: [...arr], j, j1: j + 1, sorted: new Set(sorted), swapping: false, desc: { text: `Échange effectué ! ${name}[${j}]=${arr[j]}, ${name}[${j + 1}]=${arr[j + 1]}.`, color: AV_COLORS.found }, vars: [{ name: `${name}[j]`, value: arr[j], color: AV_COLORS.found }, { name: `${name}[j+1]`, value: arr[j + 1], color: AV_COLORS.found }] });
      }
    }
    sorted.add(n - 1 - pass);
    steps.push({ arr: [...arr], j: -1, j1: -1, sorted: new Set(sorted), swapping: false, desc: { text: `Fin de passe ${pass + 1} : ${name}[${n - 1 - pass}] = ${arr[n - 1 - pass]} est maintenant à sa place définitive !`, color: AV_COLORS.found }, vars: [{ name: 'passe', value: pass + 1, color: '#64748b' }] });
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
    <VisualizerWrapper title="Visualiseur : Tri à Bulles" icon="Tri"
      description={cur.desc} variables={cur.vars}
      controls={<StepControls playing={playing} onPlay={play} onPause={stop} onReset={reset} onStep={stepForward} speed={speed} onSpeedChange={setSpeed} currentStep={step} totalSteps={steps.length} />}>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', padding: '0.5rem 0' }}>
        {cur.arr.map((v, i) => (
          <div key={i} style={{ animation: cur.swapping && (i === cur.j || i === cur.j1) ?(i === cur.j ?'avSwapUp 0.3s ease' : 'avSwapDown 0.3s ease') : 'none' }}>
            <ArrayCell value={v} index={i} name={name} state={getState(i)} />
          </div>
        ))}
      </div>
      {cur.sorted.size > 0 && (
        <div style={{ fontSize: '0.72rem', color: AV_COLORS.sorted, marginTop: '0.25rem' }}>
          - {cur.sorted.size} élément{cur.sorted.size > 1 ?'s' : ''} trié{cur.sorted.size > 1 ?'s' : ''}
        </div>
      )}
    </VisualizerWrapper>
  );
};
