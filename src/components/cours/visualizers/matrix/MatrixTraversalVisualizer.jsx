import React from 'react';
import { AV_COLORS, StepControls, VisualizerWrapper, useStepPlayer } from '../../visualizerShared';

export const MatrixTraversalVisualizer = ({ matrix = [[1,2,3],[4,5,6],[7,8,9]], name = 'M' }) => {
  const steps = [];
  const L = matrix.length, C = matrix[0].length;

  steps.push({ i: -1, j: -1, desc: { text: `Matrice ${name}[${L}, ${C}]. La double boucle va parcourir chaque cellule M[i, j].`, color: AV_COLORS.neutral }, vars: [] });

  for (let i = 0; i < L; i++) {
    for (let j = 0; j < C; j++) {
      steps.push({ i, j, desc: { text: `Boucle externe i=${i}, interne j=${j} : ${name}[${i}, ${j}] = ${matrix[i][j]}`, color: j === 0 ?AV_COLORS.active : AV_COLORS.compare }, vars: [{ name: 'i', value: i, color: AV_COLORS.active }, { name: 'j', value: j, color: AV_COLORS.compare }, { name: `${name}[i, j]`, value: matrix[i][j], color: AV_COLORS.temp }] });
    }
  }
  steps.push({ i: -1, j: -1, done: true, desc: { text: `Parcours complet ! ${L} × ${C} = ${L * C} cellules visitées.`, color: AV_COLORS.found }, vars: [{ name: 'total', value: `${L * C} cellules`, color: AV_COLORS.found }] });

  const { step, playing, speed, setSpeed, play, stop, reset, stepForward } = useStepPlayer(steps);
  const cur = steps[step];

  return (
    <VisualizerWrapper title="Visualiseur : Parcours de Matrice (Double Boucle)" icon="Grille"
      description={cur.desc} variables={cur.vars}
      controls={<StepControls playing={playing} onPlay={play} onPause={stop} onReset={reset} onStep={stepForward} speed={speed} onSpeedChange={setSpeed} currentStep={step} totalSteps={steps.length} />}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {matrix.map((row, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.65rem', color: i === cur.i && !cur.done ?AV_COLORS.active : '#334155', width: '18px', textAlign: 'right', fontFamily: 'monospace', fontWeight: i === cur.i && !cur.done ?800 : 400, transition: 'color 0.3s' }}>i={i}</span>
            {row.map((v, j) => {
              const isActive = i === cur.i && j === cur.j && !cur.done;
              const isPrev = cur.done || (i < cur.i) || (i === cur.i && j < cur.j);
              return (
                <div key={j} style={{
                  width: '44px', height: '44px', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  background: isActive ?'rgba(79,143,240,0.25)' : isPrev ?'rgba(52,211,153,0.07)' : 'rgba(30,41,59,0.6)',
                  border: `2px solid ${isActive ?AV_COLORS.active : isPrev ?'#1e4033' : 'rgba(255,255,255,0.08)'}`,
                  transition: 'all 0.3s',
                  animation: isActive ?'avCellPulse 0.5s ease' : 'none',
                  boxShadow: isActive ?`0 0 14px ${AV_COLORS.active}50` : 'none',
                }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.9rem', color: isActive ?AV_COLORS.active : isPrev ?'#34d39977' : '#4b5563' }}>{v}</span>
                  <span style={{ fontSize: '0.5rem', color: isActive ?AV_COLORS.compare : '#334155' }}>[{i}, {j}]</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </VisualizerWrapper>
  );
};
