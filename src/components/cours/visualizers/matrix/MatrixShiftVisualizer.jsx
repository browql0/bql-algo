import React from 'react';
import { AV_COLORS, StepControls, VisualizerWrapper, useStepPlayer } from '../../visualizerShared';

export const MatrixShiftVisualizer = ({ matrix = [[3,1,2], [6,4,5]] }) => {
  const steps = [];
  const m = matrix.map(row => [...row]);
  const L = m.length;
  const C = m[0].length;

  steps.push({ m: m.map(r => [...r]), activeI: -1, activeJ: -1, saved: null, desc: { text: "Décalage de Matrice à droite. L'opération se répète pour chaque ligne (tableau 1D).", color: AV_COLORS.neutral }, vars: [] });

  for (let i = 0; i < L; i++) {
    const saved = m[i][C - 1];
    steps.push({ m: m.map(r => [...r]), activeI: i, activeJ: C - 1, saved, desc: { text: `Ligne ${i} : on sauvegardé le dernier élément (${saved}).`, color: AV_COLORS.temp }, vars: [{ name: 'i', value: i, color: AV_COLORS.active }, { name: 'dernier', value: saved, color: AV_COLORS.temp }] });

    for (let j = C - 1; j > 0; j--) {
      m[i][j] = m[i][j - 1];
      steps.push({ m: m.map(r => [...r]), activeI: i, activeJ: j, saved, desc: { text: `Ligne ${i} : on décale ${m[i][j]} vers la case de droite.`, color: AV_COLORS.active }, vars: [{ name: 'i', value: i, color: AV_COLORS.active }, { name: 'j', value: j, color: AV_COLORS.active }, { name: 'dernier', value: saved, color: AV_COLORS.temp }] });
    }
    m[i][0] = saved;
    steps.push({ m: m.map(r => [...r]), activeI: i, activeJ: 0, saved, desc: { text: `Ligne ${i} : réinsertion de l'élément sauvegardé au début de la ligne.`, color: AV_COLORS.found }, vars: [{ name: 'i', value: i, color: AV_COLORS.active }, { name: `M[${i}, 0]`, value: saved, color: AV_COLORS.found, changed: true }] });
  }

  steps.push({ m: m.map(r => [...r]), activeI: -1, activeJ: -1, saved: null, doneAll: true, desc: { text: "Terminé ! Toutes les lignes ont été décalées.", color: AV_COLORS.found }, vars: [] });

  const { step, playing, speed, setSpeed, play, stop, reset, stepForward } = useStepPlayer(steps, 1000);
  const cur = steps[step];

  return (
    <VisualizerWrapper title="Visualiseur : Décalage Horizontal" icon="➡"
      description={cur.desc} variables={cur.vars}
      controls={<StepControls playing={playing} onPlay={play} onPause={stop} onReset={reset} onStep={stepForward} speed={speed} onSpeedChange={setSpeed} currentStep={step} totalSteps={steps.length} />}>
      {cur.saved !== null && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Sauvegarde (dernier) :</span>
          <div style={{ background: 'rgba(250,204,21,0.15)', border: '1px solid rgba(250,204,21,0.4)', borderRadius: '6px', padding: '0.2rem 0.55rem', color: AV_COLORS.temp, fontFamily: 'monospace', fontWeight: 800 }}>{cur.saved}</div>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflowX: 'auto', padding: '0.5rem 0' }}>
        {cur.m.map((row, i) => (
          <div key={i} style={{ display: 'flex', gap: '4px' }}>
            {row.map((val, j) => {
              let state = 'neutral';
              if (cur.doneAll) state = 'found';
              else if (i === cur.activeI && j === cur.activeJ && cur.desc.text.includes('réinsertion')) state = 'found';
              else if (i === cur.activeI && (j === cur.activeJ || j === cur.activeJ - 1)&& cur.desc.text.includes('décalage')) state = 'active';
              else if (i === cur.activeI && j === cur.activeJ && cur.desc.text.includes('sauvegardé')) state = 'temp';
              else if (i < cur.activeI && !cur.doneAll) state = 'found';

              return (
                <div key={j} style={{
                  minWidth: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: state === 'active' ?'rgba(79,143,240,0.2)' : state === 'found' ?'rgba(52,211,153,0.2)' : state === 'temp' ?'rgba(250,204,21,0.15)' : 'rgba(30,41,59,0.5)',
                  border: `2px solid ${state === 'active' ?AV_COLORS.active : state === 'found' ?AV_COLORS.found : state === 'temp' ?AV_COLORS.temp : 'rgba(255,255,255,0.08)'}`,
                  color: state === 'active' ?AV_COLORS.active : state === 'found' ?AV_COLORS.found : state === 'temp' ?AV_COLORS.temp : '#94a3b8',
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
