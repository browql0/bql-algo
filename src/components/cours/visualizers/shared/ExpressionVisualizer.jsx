import React from 'react';
import { AV_COLORS, StepControls, VisualizerWrapper, useStepPlayer } from '../../visualizerShared';

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
    <VisualizerWrapper title="Visualiseur : Évaluation d'Expression" icon="🔢"
      description={cur.desc}
      controls={<StepControls playing={playing} onPlay={play} onPause={stop} onReset={reset} onStep={stepForward} speed={speed} onSpeedChange={setSpeed} currentStep={step} totalSteps={stepsToUse.length} />}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', padding: '0.5rem 0' }}>
        {tokens.map((t, i) => {
          const isHighlighted = cur.highlight && cur.highlight.includes(i);
          return (
            <div key={i} style={{
              padding: t.type === 'op' ?'0.3rem 0.5rem' : '0.4rem 0.9rem',
              borderRadius: '8px',
              fontFamily: 'monospace', fontWeight: 800, fontSize: t.type === 'op' ?'1.2rem' : '1.1rem',
              background: isHighlighted ?(t.type === 'op' ?'rgba(167,139,250,0.2)' : 'rgba(79,143,240,0.2)') : 'rgba(30,41,59,0.5)',
              border: `2px solid ${isHighlighted ?(t.type === 'op' ?AV_COLORS.compare : AV_COLORS.active) : 'rgba(255,255,255,0.07)'}`,
              color: isHighlighted ?(t.type === 'op' ?AV_COLORS.compare : AV_COLORS.active) : '#64748b',
              transition: 'all 0.3s',
              animation: isHighlighted ?'avCellPulse 0.5s ease' : 'none',
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
              background: cur.result === '14' || cur.result ?'rgba(52,211,153,0.2)' : 'rgba(250,204,21,0.15)',
              border: `2px solid ${cur.result ?AV_COLORS.found : AV_COLORS.temp}`,
              fontFamily: 'monospace', fontWeight: 800, fontSize: '1.1rem',
              color: cur.result ?AV_COLORS.found : AV_COLORS.temp,
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
