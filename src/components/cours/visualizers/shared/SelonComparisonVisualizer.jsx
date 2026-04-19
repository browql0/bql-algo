import React from 'react';
import { AV_COLORS, StepControls, VisualizerWrapper, useStepPlayer } from '../../visualizerShared';

export const SelonComparisonVisualizer = ({
  choices = [
    { value: 1, label: 'Nouveau dossier' },
    { value: 2, label: 'Ouvrir dossier' },
    { value: 3, label: 'Quitter' },
  ],
  testValues = [1, 2, 3, 9],
}) => {
  const steps = testValues.map((choice) => {
    const matchIndex = choices.findIndex(item => item.value === choice);
    const matched = matchIndex >= 0 ?choices[matchIndex] : { value: 'AUTRE', label: 'Choix invalide' };
    return {
      choice,
      matchIndex,
      matched,
      siChecks: matchIndex >= 0 ?matchIndex + 1 : choices.length,
      selonChecks: 1,
      desc: {
        text: matchIndex >= 0
          ?`Avec choix = ${choice}, les deux versions executent "${matched.label}".`
          : `Avec choix = ${choice}, les deux versions vont vers AUTRE.`,
        color: matchIndex >= 0 ?AV_COLORS.found : AV_COLORS.temp,
      },
      vars: [
        { name: 'choix', value: choice, color: AV_COLORS.active },
        { name: 'tests SI', value: matchIndex >= 0 ?matchIndex + 1 : choices.length, color: AV_COLORS.compare },
        { name: 'lecture SELON', value: 1, color: AV_COLORS.found },
      ],
    };
  });

  const { step, playing, speed, setSpeed, play, stop, reset, stepForward } = useStepPlayer(steps, 1500);
  const cur = steps[step];

  const renderBranch = (item, index, mode) => {
    const active = cur.matchIndex === index;
    const checkedBySi = mode === 'si' && (cur.matchIndex < 0 || index <= cur.matchIndex);
    return (
      <div key={`${mode}-${item.value}`} style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
        padding: '0.55rem 0.7rem',
        borderRadius: '8px',
        border: `1px solid ${active ?AV_COLORS.found : checkedBySi ?AV_COLORS.compare : 'rgba(255,255,255,0.08)'}`,
        background: active ?'rgba(52,211,153,0.15)' : checkedBySi ?'rgba(167,139,250,0.12)' : 'rgba(30,41,59,0.45)',
        color: active ?AV_COLORS.found : '#94a3b8',
        fontSize: '0.82rem',
        transition: 'all 0.25s',
      }}>
        <span style={{ fontFamily: 'monospace', fontWeight: 800 }}>
          {mode === 'si' ?`${index === 0 ?'SI' : 'SINONSI'} choix = ${item.value}` : `CAS ${item.value}:`}
        </span>
        <span>{item.label}</span>
      </div>
    );
  };

  return (
    <VisualizerWrapper title="Visualiseur : SI repetes vs SELON" icon="Comparaison"
      description={cur.desc} variables={cur.vars}
      controls={<StepControls playing={playing} onPlay={play} onPause={stop} onReset={reset} onStep={stepForward} speed={speed} onSpeedChange={setSpeed} currentStep={step} totalSteps={steps.length} />}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        <div style={{ background: 'rgba(11,17,32,0.65)', border: '1px solid rgba(167,139,250,0.22)', borderRadius: '8px', padding: '0.9rem' }}>
          <div style={{ color: AV_COLORS.compare, fontWeight: 800, marginBottom: '0.7rem', fontSize: '0.82rem' }}>Version SI/SINONSI</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            {choices.map((item, index) => renderBranch(item, index, 'si'))}
            <div style={{ padding: '0.55rem 0.7rem', borderRadius: '8px', border: `1px solid ${cur.matchIndex < 0 ?AV_COLORS.temp : 'rgba(255,255,255,0.08)'}`, background: cur.matchIndex < 0 ?'rgba(250,204,21,0.12)' : 'rgba(30,41,59,0.45)', color: cur.matchIndex < 0 ?AV_COLORS.temp : '#64748b', fontFamily: 'monospace', fontWeight: 800, fontSize: '0.82rem' }}>
              SINON
            </div>
          </div>
          <div style={{ marginTop: '0.75rem', fontSize: '0.76rem', color: '#94a3b8' }}>
            Lit les conditions l'une apres l'autre. Plus le menu grandit, plus c'est long a lire.
          </div>
        </div>

        <div style={{ background: 'rgba(11,17,32,0.65)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: '8px', padding: '0.9rem' }}>
          <div style={{ color: AV_COLORS.found, fontWeight: 800, marginBottom: '0.7rem', fontSize: '0.82rem' }}>Version SELON</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            {choices.map((item, index) => renderBranch(item, index, 'selon'))}
            <div style={{ padding: '0.55rem 0.7rem', borderRadius: '8px', border: `1px solid ${cur.matchIndex < 0 ?AV_COLORS.temp : 'rgba(255,255,255,0.08)'}`, background: cur.matchIndex < 0 ?'rgba(250,204,21,0.12)' : 'rgba(30,41,59,0.45)', color: cur.matchIndex < 0 ?AV_COLORS.temp : '#64748b', fontFamily: 'monospace', fontWeight: 800, fontSize: '0.82rem' }}>
              AUTRE:
            </div>
          </div>
          <div style={{ marginTop: '0.75rem', fontSize: '0.76rem', color: '#94a3b8' }}>
            Montre directement que l'on teste une seule variable contre plusieurs valeurs exactes.
          </div>
        </div>
      </div>
    </VisualizerWrapper>
  );
};
