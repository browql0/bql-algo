import React from 'react';
import { AV_COLORS, StepControls, VisualizerWrapper, useStepPlayer } from '../../visualizerShared';

export const AccumulatorVisualizer = ({ values = [3, 7, 2, 8, 5], varName = 'total', operation = '+', initVal = 0 }) => {
  const steps = [];
  let acc = initVal;
  const total = values.reduce((a, b) => operation === '+' ?a + b : a * b, initVal);

  steps.push({ active: -1, acc, desc: { text: `On initialise ${varName} <- ${initVal}. Valeur neutre pour ${operation === '+' ?'l\'addition' : 'la multiplication'}.`, color: AV_COLORS.neutral }, vars: [{ name: varName, value: acc, color: AV_COLORS.temp }] });

  values.forEach((v, i) => {
    const prev = acc;
    acc = operation === '+' ?acc + v : acc * v;
    steps.push({ active: i, acc, desc: { text: `${varName} <- ${prev} ${operation} ${v} = ${acc}`, color: AV_COLORS.temp }, vars: [{ name: 'i', value: i, color: AV_COLORS.active }, { name: `T[${i}]`, value: v, color: AV_COLORS.compare }, { name: varName, value: acc, color: AV_COLORS.temp, changed: true }] });
  });
  steps.push({ active: -1, acc, done: true, desc: { text: `Résultat : ${varName} = ${acc}${operation === '+' ?`, moyenne = ${(acc / values.length).toFixed(2)}` : ''}`, color: AV_COLORS.found }, vars: [{ name: varName, value: acc, color: AV_COLORS.found }] });

  const { step, playing, speed, setSpeed, play, stop, reset, stepForward } = useStepPlayer(steps, 900);
  const cur = steps[step];
  const pct = total !== 0 ?Math.min(100, Math.abs(cur.acc / total) * 100) : 0;

  return (
    <VisualizerWrapper title="Visualiseur : Accumulateur" icon="Calc"
      description={cur.desc} variables={cur.vars}
      controls={<StepControls playing={playing} onPlay={play} onPause={stop} onReset={reset} onStep={stepForward} speed={speed} onSpeedChange={setSpeed} currentStep={step} totalSteps={steps.length} />}>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end' }}>
          {values.map((v, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <div style={{ fontSize: '0.65rem', color: i === cur.active ?AV_COLORS.compare : '#334155' }}>T[{i}]</div>
              <div style={{ width: '36px', height: '38px', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: i === cur.active ?'rgba(167,139,250,0.2)' : i < cur.active ?'rgba(52,211,153,0.07)' : 'rgba(30,41,59,0.5)', border: `2px solid ${i === cur.active ?AV_COLORS.compare : i < cur.active ?'#1e4033' : 'rgba(255,255,255,0.07)'}`, fontFamily: 'monospace', fontWeight: 800, color: i === cur.active ?AV_COLORS.compare : i < cur.active ?'#4b5563' : '#374151', animation: i === cur.active ?'avCellPulse 0.4s ease' : 'none', transition: 'all 0.3s', fontSize: '0.88rem' }}>
                {v}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', marginLeft: '1rem' }}>
          <div style={{ fontSize: '0.65rem', color: AV_COLORS.temp, fontWeight: 800, textTransform: 'uppercase' }}>{varName}</div>
          <div style={{ width: '50px', height: '80px', background: 'rgba(30,41,59,0.8)', border: `2px solid ${AV_COLORS.temp}44`, borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'flex-end' }}>
            <div style={{ width: '100%', background: `linear-gradient(180deg, ${AV_COLORS.temp}, #d97706)`, height: `${pct}%`, transition: 'height 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)', borderRadius: '6px 6px 0 0' }} />
          </div>
          <div key={cur.acc} style={{ fontFamily: 'monospace', fontWeight: 800, color: cur.done ?AV_COLORS.found : AV_COLORS.temp, fontSize: '1.1rem', animation: 'avVarChange 0.35s ease' }}>{cur.acc}</div>
        </div>
      </div>
    </VisualizerWrapper>
  );
};
