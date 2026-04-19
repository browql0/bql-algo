import React from 'react';
import { Target, Play, Zap, Code2 } from 'lucide-react';
import {
  CodeBlock,
  LessonSection,
  ExerciseBlock,
} from '../../blocks/LessonComponents';
import { P, TeacherRubricPanel } from '../../common/LessonRendererShared';

//  Exercice 
export const ExerciceRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  const paragraphs = (lesson.content || '').split('\n\n').filter(Boolean);
  return (
    <div>
      <div style={{ textAlign: 'center', padding: '1.5rem 0 1.2rem', animation: 'fadeInUp 0.4s ease' }}>
        <div style={{ fontSize: '1rem', marginBottom: '0.6rem', fontWeight: 800, letterSpacing: '0.08em', color: '#facc15' }}>CHALLENGE</div>
        <h2 style={{ color: '#e4e7ec', margin: '0 0 0.5rem', fontWeight: 800, fontSize: '1.6rem' }}>Défi final du niveau !</h2>
        <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Prouvez que vous maîtrisez ce niveau en réussissant l'exercice ci-dessous.</p>
      </div>
      {paragraphs.map((p, i) => <P key={i}>{p}</P>)}
      <ExerciseBlock text={lesson.exercise || lesson.content} code={lesson.example_code} onTry={tryCode} />
      <TeacherRubricPanel lesson={lesson} />
    </div>
  );
};

//  Challenge Final 
export const ChallengeRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  const paragraphs = (lesson.content || '').split('\n\n').filter(Boolean);
  return (
    <div>
      <div style={{ textAlign: 'center', padding: '1.5rem 0 1.2rem', animation: 'fadeInUp 0.4s ease' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(250, 204, 21, 0.1)', border: '1px solid rgba(250, 204, 21, 0.4)', color: '#facc15', padding: '5px 12px', borderRadius: '100px', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem', boxShadow: '0 0 15px rgba(250, 204, 21, 0.2)' }}>
          <Target size={14} /> Défi Final de Niveau
        </div>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 0.5rem 0' }}>{lesson.title.replace('Défi Final : ', '')}</h2>
        <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Prouvez que vous maîtrisez ce niveau en réussissant ce défi.</p>
      </div>

      <div style={{ 
        marginTop: '1.5rem', 
        background: 'linear-gradient(135deg, rgba(250, 204, 21, 0.08), rgba(255, 255, 255, 0.02))', 
        border: '1px solid rgba(250, 204, 21, 0.3)', 
        borderRadius: '16px', 
        padding: '2rem', 
        position: 'relative', 
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)'
      }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(250, 204, 21, 0.15), transparent 70%)', pointerEvents: 'none' }} />
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
            <div style={{ background: 'rgba(250, 204, 21, 0.15)', borderRadius: '10px', padding: '0.5rem', color: '#facc15' }}><Target size={20} /></div>
            <div>
              <div style={{ fontWeight: 800, color: '#e4e7ec', fontSize: '1.2rem' }}>Objectif du Défi</div>
            </div>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: '100px', padding: '0.35rem 0.85rem', color: '#34d399', fontWeight: 800, fontSize: '0.9rem' }}>
            <Zap size={14} fill="currentColor" /> +100 XP
          </div>
        </div>

        {paragraphs.map((p, i) => <P key={i} mt="0">{p}</P>)}

        {lesson.exercise && (
          <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', borderLeft: '3px solid #facc15' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#facc15', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Consignes :</div>
            <div style={{ fontSize: '0.92rem', color: '#cbd5e1', lineHeight: '1.6' }}>{lesson.exercise}</div>
          </div>
        )}

        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center' }}>
          <button 
            onClick={tryCode} 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.6rem', 
              background: 'linear-gradient(to right, #eab308, #d97706)', 
              color: '#fff', 
              border: 'none', 
              borderRadius: '12px', 
              padding: '0.9rem 2rem', 
              fontWeight: 800, 
              fontSize: '1.05rem', 
              cursor: 'pointer', 
              transition: 'all 0.2s',
              boxShadow: '0 4px 15px rgba(217, 119, 6, 0.3)'
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(217, 119, 6, 0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(217, 119, 6, 0.3)'; }}
          >
            <Play size={16} fill="currentColor" /> Résoudre le défi
          </button>
        </div>
        <TeacherRubricPanel lesson={lesson} />
      </div>
    </div>
  );
};

//  Generic Fallback 
export const GenericRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  const paragraphs = (lesson.content || '').split('\n\n').filter(Boolean);
  return (
    <div>
      {paragraphs.map((p, i) => <P key={i}>{p}</P>)}
      {lesson.example_code && (
        <LessonSection icon={<Code2 size={15} />} title="Exemple">
          <CodeBlock code={lesson.example_code} onTry={tryCode} />
        </LessonSection>
      )}
      {lesson.exercise && <ExerciseBlock text={lesson.exercise} code={lesson.example_code} onTry={tryCode} />}
    </div>
  );
};
