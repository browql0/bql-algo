import React from 'react';
import ArrayCell from '../shared/ArrayCell';
import { AV_COLORS, StepControls, VisualizerWrapper, useStepPlayer } from '../../visualizerShared';

export const ArraySumVisualizer = ({ array = [5, 3, 8, 2, 6], name = 'T' }) => {
  const steps = [];
  let sum = 0;
  steps.push({ active: -1, sum, desc: { text: `On initialise somme <- 0. L'accumulateur est vide.`, color: AV_COLORS.neutral }, vars: [{ name: 'somme', value: 0, color: AV_COLORS.temp }, { name: 'i', value: '-', color: AV_COLORS.active }] });

  for (let i = 0; i < array.length; i++) {
    const prev = sum;
    sum += array[i];
    steps.push({
      active: i, sum,
      desc: { text: `somme <- ${prev} + ${name}[${i}] (${array[i]}) = ${sum}`, color: AV_COLORS.temp },
      vars: [{ name: 'i', value: i, color: AV_COLORS.active }, { name: `${name}[i]`, value: array[i], color: AV_COLORS.compare }, { name: 'somme', value: sum, color: AV_COLORS.temp, changed: true }],
    });
  }
  const moyenne = (sum / array.length).toFixed(2);
  steps.push({ active: -1, sum, done: true, desc: { text: `Résultat final : somme = ${sum}, moyenne = ${sum} / ${array.length} = ${moyenne}`, color: AV_COLORS.found }, vars: [{ name: 'somme', value: sum, color: AV_COLORS.found }, { name: 'moyenne', value: moyenne, color: AV_COLORS.found }] });

  const { step, playing, speed, setSpeed, play, stop, reset, stepForward } = useStepPlayer(steps);
  const cur = steps[step];
  const pct = Math.min(100, (cur.sum / sum) * 100);

  return (
    <VisualizerWrapper title="Visualiseur : Somme et Moyenne" icon="Somme"
      description={cur.desc} variables={cur.vars}
      controls={<StepControls playing={playing} onPlay={play} onPause={stop} onReset={reset} onStep={stepForward} speed={speed} onSpeedChange={setSpeed} currentStep={step} totalSteps={steps.length} />}>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', padding: '0.5rem 0', alignItems: 'flex-end' }}>
        {array.map((v, i) => <ArrayCell key={i} value={v} index={i} name={name} state={i === cur.active ?'compare' : i < cur.active ?'sorted' : 'neutral'} />)}
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
