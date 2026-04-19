import React from 'react';
import { AV_COLORS, StepControls, VisualizerWrapper, useStepPlayer } from '../../visualizerShared';

export const MatrixReverseVisualizer = ({ matrix = [[4,4,4], [3,3,3], [2,2,2], [1,1,1]] }) => {
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
    <VisualizerWrapper title="Visualiseur : Inversion de Matrice" icon="🔃"
      description={cur.desc} variables={cur.vars}
      controls={<StepControls playing={playing} onPlay={play} onPause={stop} onReset={reset} onStep={stepForward} speed={speed} onSpeedChange={setSpeed} currentStep={step} totalSteps={steps.length} />}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflowX: 'auto', padding: '0.5rem 0', position: 'relative' }}>
        {cur.m.map((row, i) => (
          <div key={i} style={{ display: 'flex', gap: '4px', transition: 'transform 0.4s ease', transform: cur.swapping && (i === cur.activeL && cur.activeR > i) ?`translateY(${(cur.activeR-cur.activeL)*44}px)` : cur.swapping && (i === cur.activeR && cur.activeL < i) ?`translateY(-${(cur.activeR-cur.activeL)*44}px)` : 'none' }}>
            {row.map((val, j) => {
              let state = 'neutral';
              if (cur.doneAll) state = 'found';
              else if (cur.done && (i === cur.activeL || i === cur.activeR)) state = 'found';
              else if (i === cur.activeL || i === cur.activeR) state = 'compare';

              return (
                <div key={j} style={{
                  minWidth: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: state === 'compare' ?'rgba(250,204,21,0.15)' : state === 'found' ?'rgba(52,211,153,0.2)' : 'rgba(30,41,59,0.5)',
                  border: `2px solid ${state === 'compare' ?AV_COLORS.compare : state === 'found' ?AV_COLORS.found : 'rgba(255,255,255,0.08)'}`,
                  color: state === 'compare' ?AV_COLORS.compare : state === 'found' ?AV_COLORS.found : '#94a3b8',
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
