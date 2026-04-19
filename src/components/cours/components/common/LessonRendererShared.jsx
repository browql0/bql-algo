import React from 'react';
import { InfoCard } from '../blocks/LessonComponents';
import { getRubricForLesson } from '../../../../data/teacherRubrics';
import { getAdvancedProjectForLesson } from '../../../../data/advancedProjectMetadata';

export const P = ({ children, mt }) => (
  <p style={{ color: '#cbd5e1', lineHeight: '1.85', fontSize: '0.97rem', marginBottom: '0.9rem', marginTop: mt || 0 }}>
    {children}
  </p>
);

export const Mono = ({ children, color = '#c084fc' }) => (
  <code style={{ color, fontFamily: "'JetBrains Mono',monospace", fontSize: '0.88em', background: `${color}15`, padding: '0.1em 0.4em', borderRadius: '4px' }}>
    {children}
  </code>
);

const listLine = (label, items = []) => {
  if (!items || items.length === 0) return null;
  return (
    <div style={{ marginBottom: '0.65rem' }}>
      <div style={{ color: '#94a3b8', fontWeight: 800, fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>{label}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
        {items.map((item, index) => (
          <span key={`${label}-${index}`} style={{ color: '#cbd5e1', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '0.28rem 0.48rem', fontSize: '0.76rem' }}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
};

export const TeacherRubricPanel = ({ lesson }) => {
  const rubric = getRubricForLesson(lesson);
  const project = getAdvancedProjectForLesson(lesson);
  if (!rubric && !project) return null;

  return (
    <details style={{ marginTop: '1.2rem', background: 'rgba(15,23,42,0.72)', border: '1px solid rgba(250,204,21,0.28)', borderRadius: '8px', padding: '0.9rem 1rem' }}>
      <summary style={{ cursor: 'pointer', color: '#facc15', fontWeight: 900, fontSize: '0.85rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        Guide enseignant / evaluation
      </summary>
      {rubric && (
        <div style={{ marginTop: '0.9rem' }}>
          <div style={{ color: '#e2e8f0', fontWeight: 800, marginBottom: '0.35rem' }}>{rubric.title}</div>
          <P>{rubric.objective}</P>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.6rem', marginBottom: '0.8rem' }}>
            <InfoCard color="#4f8ff0" title="Difficulte">{rubric.difficulty}</InfoCard>
            <InfoCard color="#34d399" title="Temps estime">{rubric.estimatedMinutes} min</InfoCard>
          </div>
          {listLine('Concepts attendus', rubric.concepts)}
          {listLine('Erreurs frequentes', rubric.commonMistakes)}
          {listLine('Reussite partielle', rubric.partialSuccess)}
          {listLine('Alternatives acceptees', rubric.acceptableAlternatives)}
          {listLine('Points de vigilance', rubric.misconceptions)}
          {listLine('Conseils de correction', rubric.gradingHints)}
        </div>
      )}
      {project && (
        <div style={{ marginTop: rubric ?'1rem' : '0.9rem', paddingTop: rubric ?'1rem' : 0, borderTop: rubric ?'1px solid rgba(255,255,255,0.08)' : 'none' }}>
          <div style={{ color: '#e2e8f0', fontWeight: 800, marginBottom: '0.5rem' }}>Metadata projet avance</div>
          {listLine('Modules requis', project.requiredModules)}
          {listLine('Fonctions minimum', project.minimumFeatures)}
          {listLine('Bonus possibles', project.optionalBonusFeatures)}
          {listLine('Chemins valides', project.multipleSuccessPaths)}
          {listLine('Scenarios cachés', project.hiddenScenarios)}
          {listLine('Signaux de maintenabilite', project.maintainabilitySignals)}
          <div style={{ marginTop: '0.7rem', color: '#94a3b8', fontSize: '0.78rem' }}>
            Poids: correction {project.scoringWeights.correctness}%, logique {project.scoringWeights.logic}%, structure {project.scoringWeights.structure}%, clarte {project.scoringWeights.clarity}%.
          </div>
        </div>
      )}
    </details>
  );
};
