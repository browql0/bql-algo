import React from 'react';
import { ChevronRight } from 'lucide-react';
import { AV_COLORS, StepControls, VisualizerWrapper, useStepPlayer } from '../../visualizerShared';

export const VariableStateVisualizer = ({ sequence = [{ name: 'x', value: 5, op: 'x <- 5' }, { name: 'x', value: 6, op: 'x <- x + 1' }, { name: 'x', value: 12, op: 'x <- x * 2' }] }) => {
  const steps = sequence.map((s, idx) => ({
    ...s,
    desc: { text: `${s.op} → La variable "${s.name}" reçoit la valeur ${s.value}.`, color: AV_COLORS.active },
    vars: [{ name: s.name, value: s.value, color: AV_COLORS.active, changed: idx > 0 }],
    prev: idx > 0 ?sequence[idx - 1].value : null,
  }));

  const { step, playing, speed, setSpeed, play, stop, reset, stepForward } = useStepPlayer(steps, 1200);
  const cur = steps[step];

  return (
    <VisualizerWrapper title="Visualiseur : Affectation de Variable" icon="Mémoire"
      description={cur.desc} variables={cur.vars}
      controls={<StepControls playing={playing} onPlay={play} onPause={stop} onReset={reset} onStep={stepForward} speed={speed} onSpeedChange={setSpeed} currentStep={step} totalSteps={steps.length} />}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '0.5rem 0', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 800 }}>Instruction</div>
          <div style={{ background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.5rem 1rem', fontFamily: 'monospace', color: '#c084fc', fontWeight: 700, fontSize: '0.9rem', animation: 'avFadeSlide 0.35s ease' }}>
            {cur.op}
          </div>
        </div>
        <ChevronRight size={16} color="#334155" />
        <div style={{ display: 'flex', flex: 1, gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {cur.prev !== null && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <div style={{ fontSize: '0.62rem', color: '#475569', textTransform: 'uppercase' }}>Avant</div>
                <div style={{ minWidth: '60px', height: '60px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'monospace', fontWeight: 800, fontSize: '1.2rem', color: '#475569' }}>{cur.prev}</div>
                <div style={{ fontSize: '0.65rem', color: '#334155', fontFamily: 'monospace' }}>{cur.name}</div>
              </div>
              <span style={{ color: AV_COLORS.active, fontSize: '1.4rem' }}>-&gt;</span>
            </>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <div style={{ fontSize: '0.62rem', color: AV_COLORS.active, textTransform: 'uppercase', fontWeight: 800 }}>Maintenant</div>
            <div key={cur.value} style={{ minWidth: '64px', height: '64px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(79,143,240,0.2)', border: `2px solid ${AV_COLORS.active}`, fontFamily: 'monospace', fontWeight: 800, fontSize: '1.4rem', color: AV_COLORS.active, animation: 'avVarChange 0.4s ease', boxShadow: `0 0 16px ${AV_COLORS.active}40` }}>{cur.value}</div>
            <div style={{ fontSize: '0.65rem', color: AV_COLORS.active, fontFamily: 'monospace', fontWeight: 700 }}>{cur.name}</div>
          </div>
        </div>
      </div>
    </VisualizerWrapper>
  );
};
