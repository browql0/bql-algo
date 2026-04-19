import React from 'react';
import { AV_COLORS, StepControls, VisualizerWrapper, useStepPlayer } from '../../visualizerShared';

export const ConditionFlowVisualizer = ({
  condition = 'x > 10',
  trueBlock = 'ECRIRE("Grand")',
  falseBlock = 'ECRIRE("Petit")',
  testValues = [{ label: 'x = 15', result: true }, { label: 'x = 5', result: false }, { label: 'x = 10', result: false }],
}) => {
  const steps = [];
  steps.push({ phase: 'intro', desc: { text: `On va évaluer la condition : ${condition}`, color: AV_COLORS.neutral }, result: null });
  testValues.forEach(tv => {
    steps.push({ phase: 'eval', testVal: tv.label, desc: { text: `Test avec ${tv.label} : est-ce que ${condition} ?`, color: AV_COLORS.compare }, result: null });
    steps.push({ phase: 'result', testVal: tv.label, result: tv.result, desc: { text: tv.result ?`VRAI → On exécute le bloc ALORS : ${trueBlock}` : `FAUX → On exécute le bloc SINON : ${falseBlock}`, color: tv.result ?AV_COLORS.found : AV_COLORS.reject } });
  });

  const { step, playing, speed, setSpeed, play, stop, reset, stepForward } = useStepPlayer(steps, 1400);
  const cur = steps[step];

  return (
    <VisualizerWrapper title="Visualiseur : Structure Conditionnelle" icon="Condition"
      description={cur.desc}
      controls={<StepControls playing={playing} onPlay={play} onPause={stop} onReset={reset} onStep={stepForward} speed={speed} onSpeedChange={setSpeed} currentStep={step} totalSteps={steps.length} />}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '0.5rem 0' }}>
        <div style={{ padding: '0.6rem 1.4rem', borderRadius: '10px', background: cur.phase === 'eval' ?'rgba(167,139,250,0.2)' : 'rgba(250,204,21,0.1)', border: `2px solid ${cur.phase === 'eval' ?AV_COLORS.compare : 'rgba(250,204,21,0.4)'}`, fontFamily: 'monospace', fontWeight: 800, fontSize: '0.95rem', color: cur.phase === 'eval' ?AV_COLORS.compare : '#facc15', transition: 'all 0.3s', animation: cur.phase === 'eval' ?'avCellPulse 0.5s ease' : 'none' }}>
          SI {condition} ALORS
          {cur.testVal && <span style={{ marginLeft: '0.7rem', fontSize: '0.75rem', opacity: 0.8 }}>({cur.testVal})</span>}
        </div>

        {cur.result !== null && (
          <div style={{ padding: '0.35rem 1rem', borderRadius: '100px', background: cur.result ?'rgba(52,211,153,0.15)' : 'rgba(251,113,133,0.12)', border: `1px solid ${cur.result ?AV_COLORS.found : AV_COLORS.reject}55`, color: cur.result ?AV_COLORS.found : AV_COLORS.reject, fontWeight: 800, fontSize: '0.85rem', animation: 'avBounce 0.4s ease' }}>
            {cur.result ?'VRAI' : 'FAUX'}
          </div>
        )}

        <div style={{ display: 'flex', gap: '3rem', width: '100%', justifyContent: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: AV_COLORS.found, fontSize: '1.5rem' }}>↙</span>
            <div style={{ padding: '0.5rem 1rem', borderRadius: '8px', background: cur.result === true ?'rgba(52,211,153,0.2)' : 'rgba(52,211,153,0.05)', border: `1px solid ${cur.result === true ?AV_COLORS.found : 'rgba(52,211,153,0.15)'}`, color: cur.result === true ?AV_COLORS.found : '#334155', fontFamily: 'monospace', fontSize: '0.82rem', transition: 'all 0.3s', animation: cur.result === true ?'avCondTrue 0.4s ease' : 'none', opacity: cur.result === false ?0.4 : 1 }}>
              {trueBlock}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: AV_COLORS.reject, fontSize: '1.5rem' }}>↘</span>
            <div style={{ padding: '0.5rem 1rem', borderRadius: '8px', background: cur.result === false ?'rgba(251,113,133,0.15)' : 'rgba(251,113,133,0.04)', border: `1px solid ${cur.result === false ?AV_COLORS.reject : 'rgba(251,113,133,0.12)'}`, color: cur.result === false ?AV_COLORS.reject : '#334155', fontFamily: 'monospace', fontSize: '0.82rem', transition: 'all 0.3s', animation: cur.result === false ?'avCondTrue 0.4s ease' : 'none', opacity: cur.result === true ?0.4 : 1 }}>
              {falseBlock}
            </div>
          </div>
        </div>
      </div>
    </VisualizerWrapper>
  );
};
