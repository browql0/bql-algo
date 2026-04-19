import React from 'react';
import ArrayCell from '../shared/ArrayCell';
import { AV_COLORS, StepControls, VisualizerWrapper, useStepPlayer } from '../../visualizerShared';

export const ArrayMaxMinVisualizer = ({ array = [12, 5, 8, 17, 3, 9], name = 'T' }) => {
  const steps = [];
  let max = array[0], maxIdx = 0;
  steps.push({ active: 0, maxIdx: 0, max, desc: { text: `On initialise max <- ${name}[0] = ${max}. C'est notre premier candidat.`, color: AV_COLORS.temp }, vars: [{ name: 'i', value: 0, color: AV_COLORS.active }, { name: 'max', value: max, color: AV_COLORS.temp }] });

  for (let i = 1; i < array.length; i++) {
    const isNew = array[i] > max;
    if (isNew) { max = array[i]; maxIdx = i; }
    steps.push({
      active: i, maxIdx,
      max,
      desc: isNew
        ?{ text: `${name}[${i}] = ${array[i]} > max actuel (${max}) -> Nouveau maximum trouvé !`, color: AV_COLORS.found }
        : { text: `${name}[${i}] = ${array[i]} <= max (${max}) -> On garde le max actuel.`, color: AV_COLORS.active },
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
    <VisualizerWrapper title="Visualiseur : Recherche du Maximum" icon="Maximum"
      description={cur.desc} variables={cur.vars}
      controls={<StepControls playing={playing} onPlay={play} onPause={stop} onReset={reset} onStep={stepForward} speed={speed} onSpeedChange={setSpeed} currentStep={step} totalSteps={steps.length} />}>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', padding: '0.5rem 0' }}>
        {array.map((v, i) => <ArrayCell key={i} value={v} index={i} name={name} state={getState(i)} />)}
      </div>
    </VisualizerWrapper>
  );
};
