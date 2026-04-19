import React from 'react';
import { AV_COLORS, StepControls, VisualizerWrapper, useStepPlayer } from '../../visualizerShared';

export const DebugTraceComparisonVisualizer = ({
  title = 'Accumulator not initialized',
  wrongTrace = [
    { step: 'depart', vars: { somme: 'non defini', i: '-' }, note: 'somme n a pas de valeur claire' },
    { step: 'i = 0', vars: { somme: 'non defini + 4', i: 0 }, note: 'le calcul part deja mal' },
    { step: 'i = 1', vars: { somme: 'non defini', i: 1 }, note: 'le resultat reste impossible a verifier' },
  ],
  correctTrace = [
    { step: 'depart', vars: { somme: 0, i: '-' }, note: 'somme est initialisee' },
    { step: 'i = 0', vars: { somme: 4, i: 0 }, note: '0 + 4' },
    { step: 'i = 1', vars: { somme: 11, i: 1 }, note: '4 + 7' },
  ],
}) => {
  const total = Math.max(wrongTrace.length, correctTrace.length);
  const steps = Array.from({ length: total }, (_, index) => {
    const wrong = wrongTrace[index] || wrongTrace[wrongTrace.length - 1];
    const correct = correctTrace[index] || correctTrace[correctTrace.length - 1];
    const diverged = JSON.stringify(wrong?.vars) !== JSON.stringify(correct?.vars);
    return {
      index,
      wrong,
      correct,
      diverged,
      desc: {
        text: diverged
          ?`La divergence commence ici : la version correcte garde un etat previsible, la version fausse non.`
          : `Les deux traces sont encore coherentes a cette etape.`,
        color: diverged ?AV_COLORS.reject : AV_COLORS.found,
      },
      vars: [
        { name: 'etape', value: index + 1, color: AV_COLORS.active },
        { name: 'divergence', value: diverged ?'oui' : 'non', color: diverged ?AV_COLORS.reject : AV_COLORS.found },
      ],
    };
  });

  const { step, playing, speed, setSpeed, play, stop, reset, stepForward } = useStepPlayer(steps, 1600);
  const cur = steps[step];
  const varNames = Array.from(new Set([
    ...wrongTrace.flatMap(item => Object.keys(item.vars || {})),
    ...correctTrace.flatMap(item => Object.keys(item.vars || {})),
  ]));

  const renderTrace = (trace, heading, color) => (
    <div style={{ background: 'rgba(11,17,32,0.65)', border: `1px solid ${color}44`, borderRadius: '8px', padding: '0.85rem' }}>
      <div style={{ color, fontWeight: 800, marginBottom: '0.7rem', fontSize: '0.82rem' }}>{heading}</div>
      <div style={{ display: 'grid', gap: '0.4rem' }}>
        {trace.map((row, index) => {
          const active = index === cur.index;
          return (
            <div key={`${heading}-${index}`} style={{ padding: '0.55rem', borderRadius: '8px', border: `1px solid ${active ?color : 'rgba(255,255,255,0.07)'}`, background: active ?`${color}18` : 'rgba(30,41,59,0.42)' }}>
              <div style={{ color: active ?color : '#94a3b8', fontWeight: 800, fontSize: '0.78rem', marginBottom: '0.35rem' }}>{row.step}</div>
              <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                {varNames.map(varName => (
                  <span key={varName} style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '0.18rem 0.4rem', color: '#cbd5e1', fontFamily: 'monospace', fontSize: '0.74rem' }}>
                    {varName} = {String(row.vars?.[varName] ?? '-')}
                  </span>
                ))}
              </div>
              <div style={{ color: '#64748b', fontSize: '0.72rem' }}>{row.note}</div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <VisualizerWrapper title={`Visualiseur - Debug avant / apres : ${title}`} icon="!"
      description={cur.desc} variables={cur.vars}
      controls={<StepControls playing={playing} onPlay={play} onPause={stop} onReset={reset} onStep={stepForward} speed={speed} onSpeedChange={setSpeed} currentStep={step} totalSteps={steps.length} />}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
        {renderTrace(wrongTrace, 'Version fausse', AV_COLORS.reject)}
        {renderTrace(correctTrace, 'Version corrigee', AV_COLORS.found)}
      </div>
    </VisualizerWrapper>
  );
};
