import React from 'react';
import ArrayCell from '../shared/ArrayCell';
import { AV_COLORS, StepControls, VisualizerWrapper, useStepPlayer } from '../../visualizerShared';

export const ArrayTraversalVisualizer = ({ array = [12, 5, 8, 17, 3, 9], name = 'T' }) => {
  const steps = array.map((_, i) => ({
    active: i,
    desc: { text: `On lit maintenant ${name}[${i}] = ${array[i]}. L'indice i vaut ${i}.`, color: AV_COLORS.active },
    vars: [{ name: 'i', value: i, color: AV_COLORS.active }, { name: `${name}[i]`, value: array[i], color: AV_COLORS.temp }],
  }));

  const { step, playing, speed, setSpeed, play, stop, reset, stepForward } = useStepPlayer(steps);
  const cur = steps[step];

  return (
    <VisualizerWrapper title="Visualiseur : Parcours de tableau" icon="Recherche"
      description={cur.desc} variables={cur.vars}
      controls={<StepControls playing={playing} onPlay={play} onPause={stop} onReset={reset} onStep={stepForward} speed={speed} onSpeedChange={setSpeed} currentStep={step} totalSteps={steps.length} />}>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', padding: '0.5rem 0' }}>
        {array.map((v, i) => (
          <ArrayCell key={i} value={v} index={i} name={name} state={i === cur.active ?'active' : i < cur.active ?'sorted' : 'neutral'} />
        ))}
      </div>
    </VisualizerWrapper>
  );
};
