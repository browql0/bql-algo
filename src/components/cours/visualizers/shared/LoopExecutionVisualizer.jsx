import React from 'react';
import { AV_COLORS, StepControls, VisualizerWrapper, useStepPlayer } from '../../visualizerShared';

export const LoopExecutionVisualizer = ({ start = 1, end = 5, bodyLabel = 'ECRIRE(i)', type = 'pour' }) => {
  const steps = [];
  steps.push({ i: null, phase: 'init', desc: { text: `Initialisation : i = ${start}. La boucle va s'exécuter de ${start} à ${end}.`, color: AV_COLORS.neutral }, vars: [] });

  for (let i = start; i <= end; i++) {
    const condOk = i <= end;
    steps.push({ i, phase: 'check', desc: { text: `Test de condition : i = ${i} <= ${end} -> ${condOk ?'VRAI, on entre dans le corps' : 'FAUX, on sort'}`, color: condOk ?AV_COLORS.active : AV_COLORS.reject }, vars: [{ name: 'i', value: i, color: AV_COLORS.active }] });
    steps.push({ i, phase: 'body', desc: { text: `Corps de boucle (itération ${i - start + 1}) : ${bodyLabel} avec i = ${i}`, color: AV_COLORS.compare }, vars: [{ name: 'i', value: i, color: AV_COLORS.temp }] });
    if (i < end) {
      steps.push({ i: i + 1, phase: 'update', desc: { text: `i <- i + 1 = ${i + 1}. On revient au test de condition.`, color: AV_COLORS.active }, vars: [{ name: 'i', value: i + 1, color: AV_COLORS.active, changed: true }] });
    }
  }
  steps.push({ i: end + 1, phase: 'end', desc: { text: `i = ${end + 1} > ${end} → condition FAUSSE. La boucle se termine. ${end - start + 1} itérations effectuées.`, color: AV_COLORS.found }, vars: [{ name: 'i', value: end + 1, color: AV_COLORS.reject }, { name: 'itérations', value: end - start + 1, color: AV_COLORS.found }] });

  const { step, playing, speed, setSpeed, play, stop, reset, stepForward } = useStepPlayer(steps, 1000);
  const cur = steps[step];

  const iterations = Array.from({ length: end - start + 1 }, (_, k) => start + k);

  return (
    <VisualizerWrapper title={`Visualiseur : Boucle ${type.toUpperCase()}`} icon="🔁"
      description={cur.desc} variables={cur.vars}
      controls={<StepControls playing={playing} onPlay={play} onPause={stop} onReset={reset} onStep={stepForward} speed={speed} onSpeedChange={setSpeed} currentStep={step} totalSteps={steps.length} />}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: '#c084fc', background: 'rgba(192,132,252,0.08)', border: '1px solid rgba(192,132,252,0.2)', borderRadius: '8px', padding: '0.5rem 1rem' }}>
          POUR i ALLANT DE {start} A {end} FAIRE
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', padding: '0.25rem 0' }}>
          {iterations.map(i => {
            const isPast = cur.i !== null && i < cur.i && cur.phase !== 'init';
            const isCurrent = cur.i === i && cur.phase !== 'update' && cur.phase !== 'end';
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isCurrent && cur.phase === 'body' ?'rgba(167,139,250,0.25)' : isCurrent ?'rgba(79,143,240,0.2)' : isPast ?'rgba(52,211,153,0.1)' : 'rgba(30,41,59,0.5)',
                  border: `2px solid ${isCurrent && cur.phase === 'body' ?AV_COLORS.compare : isCurrent ?AV_COLORS.active : isPast ?AV_COLORS.found + '44' : 'rgba(255,255,255,0.07)'}`,
                  fontFamily: 'monospace', fontWeight: 800, fontSize: '0.95rem',
                  color: isCurrent && cur.phase === 'body' ?AV_COLORS.compare : isCurrent ?AV_COLORS.active : isPast ?AV_COLORS.found : '#4b5563',
                  animation: isCurrent && cur.phase === 'body' ?'avCellPulse 0.5s ease' : 'none',
                  transition: 'all 0.35s',
                }}>
                  {i}
                </div>
                <span style={{ fontSize: '0.62rem', color: isPast ?AV_COLORS.found + '88' : '#334155', fontFamily: 'monospace' }}>i={i}</span>
                {isCurrent && cur.phase === 'body' && (
                  <span style={{ fontSize: '0.58rem', color: AV_COLORS.compare, fontWeight: 800, animation: 'avFadeSlide 0.3s ease' }}>▲ corps</span>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: cur.phase === 'body' ?AV_COLORS.compare : '#334155', background: cur.phase === 'body' ?'rgba(167,139,250,0.12)' : 'rgba(255,255,255,0.02)', border: `1px solid ${cur.phase === 'body' ?AV_COLORS.compare + '44' : 'rgba(255,255,255,0.05)'}`, borderRadius: '8px', padding: '0.5rem 1rem', transition: 'all 0.3s', animation: cur.phase === 'body' ?'avFadeSlide 0.3s ease' : 'none' }}>
          &nbsp;&nbsp;{bodyLabel}
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: '#c084fc', background: 'rgba(192,132,252,0.05)', border: '1px solid rgba(192,132,252,0.15)', borderRadius: '8px', padding: '0.5rem 1rem' }}>
          FINPOUR
        </div>
      </div>
    </VisualizerWrapper>
  );
};
