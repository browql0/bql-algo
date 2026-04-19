import React from 'react';
import ArrayCell from '../shared/ArrayCell';
import { AV_COLORS, StepControls, VisualizerWrapper, useStepPlayer } from '../../visualizerShared';

export const ArrayShiftVisualizer = ({ array = [1, 2, 3, 4, 5], name = 'T', direction = 'right' }) => {
  const steps = [];
  const n = array.length;
  const arr = [...array];
  const saved = direction === 'right' ?arr[n - 1] : arr[0];

  steps.push({ arr: [...arr], active: -1, saved: null, desc: { text: `Tableau initial. On va décaler tous les éléments d'une case vers la ${direction === 'right' ?'droite' : 'gauche'}.`, color: AV_COLORS.neutral }, vars: [] });
  steps.push({ arr: [...arr], active: direction === 'right' ?n - 1 : 0, saved, desc: { text: `On sauvegardé ${name}[${direction === 'right' ?n - 1 : 0}] = ${saved} avant le décalage (il serait écrasé sinon).`, color: AV_COLORS.temp }, vars: [{ name: 'dernier', value: saved, color: AV_COLORS.temp }] });

  if (direction === 'right') {
    for (let i = n - 1; i > 0; i--) {
      arr[i] = arr[i - 1];
      steps.push({ arr: [...arr], active: i, saved, desc: { text: `${name}[${i}] <- ${name}[${i - 1}] = ${arr[i]}. On décale vers la droite.`, color: AV_COLORS.active }, vars: [{ name: 'i', value: i, color: AV_COLORS.active }, { name: 'dernier', value: saved, color: AV_COLORS.temp }] });
    }
    arr[0] = saved;
  } else {
    for (let i = 0; i < n - 1; i++) {
      arr[i] = arr[i + 1];
      steps.push({ arr: [...arr], active: i, saved, desc: { text: `${name}[${i}] <- ${name}[${i + 1}] = ${arr[i]}. On décale vers la gauche.`, color: AV_COLORS.active }, vars: [{ name: 'i', value: i, color: AV_COLORS.active }, { name: 'premier', value: saved, color: AV_COLORS.temp }] });
    }
    arr[n - 1] = saved;
  }
  steps.push({ arr: [...arr], active: direction === 'right' ?0 : n - 1, saved, desc: { text: `On réinjecte la valeur sauvegardée (${saved}) à ${direction === 'right' ?'T[0]' : `T[${n - 1}]`}.`, color: AV_COLORS.found }, vars: [{ name: direction === 'right' ?`${name}[0]` : `${name}[${n - 1}]`, value: saved, color: AV_COLORS.found, changed: true }] });
  steps.push({ arr: [...arr], active: -1, done: true, desc: { text: `Décalage circulaire terminé !`, color: AV_COLORS.found }, vars: [] });

  const { step, playing, speed, setSpeed, play, stop, reset, stepForward } = useStepPlayer(steps);
  const cur = steps[step];

  return (
    <VisualizerWrapper title="Visualiseur : Décalage Circulaire" icon="Decalage"
      description={cur.desc} variables={cur.vars}
      controls={<StepControls playing={playing} onPlay={play} onPause={stop} onReset={reset} onStep={stepForward} speed={speed} onSpeedChange={setSpeed} currentStep={step} totalSteps={steps.length} />}>
      {cur.saved !== null && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Sauvegardé :</span>
          <div style={{ background: 'rgba(250,204,21,0.15)', border: '1px solid rgba(250,204,21,0.4)', borderRadius: '6px', padding: '0.2rem 0.55rem', color: AV_COLORS.temp, fontFamily: 'monospace', fontWeight: 800 }}>{cur.saved}</div>
        </div>
      )}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', padding: '0.5rem 0' }}>
        {cur.arr.map((v, i) => <ArrayCell key={i} value={v} index={i} name={name} state={i === cur.active ?'active' : cur.done ?'found' : 'neutral'} />)}
      </div>
    </VisualizerWrapper>
  );
};
