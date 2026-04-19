import React from 'react';
import { AV_COLORS, StepControls, VisualizerWrapper, useStepPlayer } from '../../visualizerShared';

export const RecordVisualizer = ({
  typeName = 'Personne',
  fields = [
    { name: 'nom', type: 'CHAINE', value: '"Alice"', color: '#4ade80' },
    { name: 'age', type: 'ENTIER', value: '25', color: '#facc15' },
    { name: 'score', type: 'REEL', value: '17.5', color: '#4f8ff0' },
  ],
  varName = 'p',
}) => {
  const steps = [
    { active: -1, desc: { text: `On déclare la variable ${varName} de type ${typeName}. Tous les champs sont non initialisés.`, color: AV_COLORS.neutral } },
    ...fields.map((f, i) => ({
      active: i,
      desc: { text: `${varName}.${f.name} <- ${f.value} → Le champ "${f.name}" de type ${f.type} reçoit sa valeur.`, color: f.color || AV_COLORS.active },
      vars: [{ name: `${varName}.${f.name}`, value: f.value, color: f.color || AV_COLORS.active, changed: true }],
    })),
    {
      active: fields.length,
      desc: { text: `L'enregistrement ${varName} est complet. Accès via notation pointée : ${varName}.${fields[0]?.name}, ${varName}.${fields[1]?.name}...`, color: AV_COLORS.found },
    },
  ];

  const { step, playing, speed, setSpeed, play, stop, reset, stepForward } = useStepPlayer(steps, 1200);
  const cur = steps[step];

  return (
    <VisualizerWrapper title={`Visualiseur : Enregistrement ${typeName}`} icon="🗂️"
      description={cur.desc} variables={cur.vars}
      controls={<StepControls playing={playing} onPlay={play} onPause={stop} onReset={reset} onStep={stepForward} speed={speed} onSpeedChange={setSpeed} currentStep={step} totalSteps={steps.length} />}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ fontSize: '0.72rem', color: '#a78bfa', fontFamily: 'monospace', fontWeight: 800, marginBottom: '0.25rem' }}>
          TYPE {typeName} = ENREGISTREMENT
        </div>
        {fields.map((f, i) => {
          const isActive = cur.active === i;
          const isDone = cur.active > i || cur.active === fields.length;
          return (
            <div key={f.name} style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.5rem 0.9rem', borderRadius: '10px',
              background: isActive ?`${f.color || AV_COLORS.active}18` : isDone ?'rgba(52,211,153,0.06)' : 'rgba(30,41,59,0.5)',
              border: `1px solid ${isActive ?(f.color || AV_COLORS.active) + '55' : isDone ?'#1e4033' : 'rgba(255,255,255,0.06)'}`,
              transition: 'all 0.3s',
              animation: isActive ?'avFadeSlide 0.3s ease' : 'none',
            }}>
              <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: isActive ?(f.color || AV_COLORS.active) : isDone ?'#4b5563' : '#334155', fontWeight: isActive ?800 : 400, minWidth: '80px' }}>{f.name}</span>
              <span style={{ fontSize: '0.68rem', color: '#475569' }}>: {f.type}</span>
              <span style={{ marginLeft: 'auto', fontFamily: 'monospace', fontWeight: 800, fontSize: '0.88rem', color: isActive ?(f.color || AV_COLORS.active) : isDone ?'#34d39977' : '#334155', animation: isActive ?'avVarChange 0.4s ease' : 'none' }}>
                {isActive || isDone ?f.value : '-'}
              </span>
            </div>
          );
        })}
        <div style={{ fontSize: '0.72rem', color: '#a78bfa', fontFamily: 'monospace', fontWeight: 800 }}>
          FIN {typeName}
        </div>
        {cur.active >= 0 && (
          <div style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#4f8ff0', fontFamily: 'monospace' }}>
            Accès : <span style={{ color: '#facc15' }}>{varName}.{fields[Math.min(cur.active, fields.length - 1)]?.name}</span>
          </div>
        )}
      </div>
    </VisualizerWrapper>
  );
};
