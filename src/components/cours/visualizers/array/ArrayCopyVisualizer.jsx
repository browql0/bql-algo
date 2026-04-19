import React from 'react';
import ArrayCell from '../shared/ArrayCell';
import { AV_COLORS, StepControls, VisualizerWrapper, useStepPlayer } from '../../visualizerShared';

export const ArrayCopyVisualizer = ({ arrayA = [10, 20, 30, 40, 50], nameA = 'A', nameB = 'B' }) => {
  const n = arrayA.length;
  const steps = [];
  const b = new Array(n).fill(null);

  steps.push({ i: -1, b: [...b], desc: { text: `Tableau ${nameB} initialement vide. On va copier chaque case de ${nameA} vers ${nameB}.`, color: AV_COLORS.neutral }, vars: [] });

  for (let i = 0; i < n; i++) {
    b[i] = arrayA[i];
    steps.push({
      i, b: [...b],
      desc: { text: `${nameB}[${i}] <- ${nameA}[${i}] = ${arrayA[i]}. Case copiée !`, color: AV_COLORS.active },
      vars: [{ name: 'i', value: i, color: AV_COLORS.active }, { name: `${nameA}[i]`, value: arrayA[i], color: AV_COLORS.compare }, { name: `${nameB}[i]`, value: arrayA[i], color: AV_COLORS.found }],
    });
  }
  steps.push({ i: n, b: [...b], done: true, desc: { text: `Copie terminée ! ${nameA} et ${nameB} sont indépendants — modifier l'un ne change pas l'autre.`, color: AV_COLORS.found }, vars: [] });

  const { step, playing, speed, setSpeed, play, stop, reset, stepForward } = useStepPlayer(steps, 800);
  const cur = steps[step];

  return (
    <VisualizerWrapper title="Visualiseur : Copie de Tableau" icon="Liste"
      description={cur.desc} variables={cur.vars}
      controls={<StepControls playing={playing} onPlay={play} onPause={stop} onReset={reset} onStep={stepForward} speed={speed} onSpeedChange={setSpeed} currentStep={step} totalSteps={steps.length} />}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.72rem', color: AV_COLORS.compare, fontFamily: 'monospace', fontWeight: 800, minWidth: '20px' }}>{nameA}</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            {arrayA.map((v, i) => <ArrayCell key={i} value={v} index={i} name={nameA} state={i === cur.i ?'compare' : 'sorted'} />)}
          </div>
        </div>
        <div style={{ paddingLeft: '1.5rem', fontSize: '0.75rem', color: cur.i >= 0 && !cur.done ?AV_COLORS.active : '#334155', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {cur.i >= 0 && !cur.done && <span style={{ animation: 'avFadeSlide 0.3s ease' }}>↓ copie {nameA}[{cur.i}] -&gt; {nameB}[{cur.i}]</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.72rem', color: AV_COLORS.found, fontFamily: 'monospace', fontWeight: 800, minWidth: '20px' }}>{nameB}</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            {cur.b.map((v, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                <div style={{
                  minWidth: '44px', height: '44px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: v !== null ?(i === cur.i - 1 && !cur.done ?'rgba(52,211,153,0.25)' : 'rgba(52,211,153,0.1)') : 'rgba(30,41,59,0.4)',
                  border: `2px solid ${v !== null ?(i === cur.i - 1 ?AV_COLORS.found : '#1e4033') : 'rgba(255,255,255,0.06)'}`,
                  fontFamily: 'monospace', fontWeight: 800, fontSize: '0.95rem',
                  color: v !== null ?AV_COLORS.found : '#334155',
                  animation: i === cur.i - 1 && !cur.done ?'avBounce 0.4s ease' : 'none',
                  transition: 'all 0.3s',
                }}>
                  {v !== null ?v : '-'}
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
