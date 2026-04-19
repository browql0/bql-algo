import React from 'react';
import { AV_COLORS, BoolBadge, StepControls, VisualizerWrapper, useStepPlayer } from '../../visualizerShared';

export const BooleanLogicVisualizer = ({ operator = 'ET' }) => {
  const combos = operator === 'NON'
    ?[{ a: true, label: 'A = VRAI' }, { a: false, label: 'A = FAUX' }]
    : [{ a: true, b: true }, { a: true, b: false }, { a: false, b: true }, { a: false, b: false }];

  const evalResult = (c) => {
    if (operator === 'ET') return c.a && c.b;
    if (operator === 'OU') return c.a || c.b;
    if (operator === 'NON') return !c.a;
    return false;
  };

  const steps = combos.map(c => {
    const res = evalResult(c);
    const aStr = c.a ?'VRAI' : 'FAUX';
    const bStr = c.b !== undefined ?(c.b ?'VRAI' : 'FAUX') : '';
    const expr = operator === 'NON' ?`NON(${aStr})` : `(${aStr} ${operator} ${bStr})`;
    return {
      a: c.a, b: c.b, result: res,
      desc: { text: `${expr} = ${res ?'VRAI' : 'FAUX'}`, color: res ?AV_COLORS.found : AV_COLORS.reject },
    };
  });

  const { step, playing, speed, setSpeed, play, stop, reset, stepForward } = useStepPlayer(steps, 1600);
  const cur = steps[step];

  return (
    <VisualizerWrapper title={`Visualiseur : Opérateur ${operator}`} icon="🔀"
      description={cur.desc}
      controls={<StepControls playing={playing} onPlay={play} onPause={stop} onReset={reset} onStep={stepForward} speed={speed} onSpeedChange={setSpeed} currentStep={step} totalSteps={steps.length} />}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', padding: '0.5rem 0', justifyContent: 'center' }}>
        <BoolBadge val={cur.a} />
        <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#a78bfa', fontSize: '1rem' }}>{operator}</span>
        {cur.b !== undefined && <BoolBadge val={cur.b} />}
        <span style={{ color: '#475569', fontSize: '1.4rem', fontWeight: 800 }}>=</span>
        <div key={String(cur.result)} style={{
          padding: '0.45rem 1.2rem', borderRadius: '10px', fontFamily: 'monospace', fontWeight: 800, fontSize: '1rem',
          background: cur.result ?'rgba(52,211,153,0.2)' : 'rgba(251,113,133,0.15)',
          border: `2px solid ${cur.result ?AV_COLORS.found : AV_COLORS.reject}`,
          color: cur.result ?AV_COLORS.found : AV_COLORS.reject,
          animation: 'avBounce 0.4s ease',
          boxShadow: `0 0 12px ${cur.result ?AV_COLORS.found : AV_COLORS.reject}30`,
        }}>
          {cur.result ?'VRAI' : 'FAUX'}
        </div>
      </div>
      <div style={{ marginTop: '0.75rem', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', fontFamily: 'monospace' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <th style={{ padding: '0.35rem 0.6rem', color: '#64748b', textAlign: 'center' }}>A</th>
              {operator !== 'NON' && <th style={{ padding: '0.35rem 0.6rem', color: '#64748b', textAlign: 'center' }}>B</th>}
              <th style={{ padding: '0.35rem 0.6rem', color: '#a78bfa', textAlign: 'center' }}>A {operator} {operator !== 'NON' ?'B' : ''}</th>
            </tr>
          </thead>
          <tbody>
            {steps.map((s, idx) => {
              const r = evalResult(s);
              const isActive = idx === step;
              return (
                <tr key={idx} style={{ background: isActive ?'rgba(79,143,240,0.08)' : 'transparent', borderLeft: isActive ?`2px solid ${AV_COLORS.active}` : '2px solid transparent' }}>
                  <td style={{ padding: '0.3rem 0.6rem', textAlign: 'center', color: s.a ?AV_COLORS.found : AV_COLORS.reject }}>{s.a ?'V' : 'F'}</td>
                  {operator !== 'NON' && <td style={{ padding: '0.3rem 0.6rem', textAlign: 'center', color: s.b ?AV_COLORS.found : AV_COLORS.reject }}>{s.b ?'V' : 'F'}</td>}
                  <td style={{ padding: '0.3rem 0.6rem', textAlign: 'center', fontWeight: isActive ?800 : 400, color: r ?AV_COLORS.found : AV_COLORS.reject }}>{r ?'V' : 'F'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </VisualizerWrapper>
  );
};
