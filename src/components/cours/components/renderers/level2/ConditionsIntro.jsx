import React from 'react';
import { Info, Code2, Hash } from 'lucide-react';
import {
  CodeBlock,
  InfoCard,
  WarningCard,
  TipCard,
  SummaryCard,
  LessonSection,
  BranchDiagram,
  AnalogieCard,
  WhyCard,
  StepByStep,
} from '../../blocks/LessonComponents';
import { ConditionFlowVisualizer } from '../../../visualizers';
import { Mono } from '../../common/LessonRendererShared';

// condition_si
export const ConditionSiRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <AnalogieCard>
        Imagine un portier de boîte de nuit : <strong>SI la personne a plus de 18 ans ALORS</strong> elle entre, <strong>sinon</strong> elle reste dehors. Un SI c'est un gardien qui décide si un bloc de code s'exécute ou non.
      </AnalogieCard>

      <InfoCard icon={<Info size={17} />} title="Définition" color="#facc15">
        L'instruction <strong>SI</strong> exécute un bloc d'instructions <em>seulement si</em> une condition est vraie. Si la condition est fausse, le bloc est ignoré.
      </InfoCard>

      <WhyCard>
        Sans conditions, un programme fait toujours la même chose. Avec SI, il peut <em>réfléchir</em> et adapter son comportement. C'est la base de toute intelligence logicielle.
      </WhyCard>

      <LessonSection icon={<Code2 size={15} />} title="Structure et schéma de décision" step={1}>
        <BranchDiagram condition="SI condition ALORS" trueLabel="Bloc exécuté" falseLabel="Ignoré" />
        <ConditionFlowVisualizer
          condition="age >= 18"
          trueBlock='ECRIRE("Accès autorisé")'
          falseBlock='ECRIRE("Refusé")'
          testValues={[
            { label: 'age = 20', result: true },
            { label: 'age = 15', result: false },
            { label: 'age = 18', result: true },
          ]}
        />
        <StepByStep steps={[
          { label: 'SI condition ALORS', desc: 'BQL évalue la condition (vrai ou faux).' },
          { label: 'Block ALORS', desc: 'Instructions exécutées seulement si VRAI.' },
          { label: 'FINSI', desc: 'Ferme le bloc. Obligatoire.' },
        ]} title="Déroulement étape par étape" />
        {lesson.example_code && <CodeBlock code={lesson.example_code} title="si_simple.bql" onTry={tryCode} />}
      </LessonSection>

      <LessonSection icon={<Hash size={15} />} title="Exemples de conditions" step={2}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
          {[
            ['age >= 18', 'Majeur ?', '#34d399'],
            ['note <> 0', 'Note non nulle ?', '#4f8ff0'],
            ['score > 100', 'Score max dépassé ?', '#facc15'],
            ['actif = VRAI', 'Compte actif ?', '#a78bfa'],
          ].map(([cond, desc, c]) => (
            <div key={cond} style={{ background: `${c}0a`, border: `1px solid ${c}25`, borderRadius: '10px', padding: '0.8rem' }}>
              <code style={{ color: c, display: 'block', fontFamily: 'monospace', marginBottom: '0.3rem' }}>{cond}</code>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{desc}</span>
            </div>
          ))}
        </div>
      </LessonSection>

      <WarningCard>
        Toujours fermer le bloc avec <Mono color="#fb7185">FINSI</Mono>. L'oublier est l'erreur N°1 des débutants en BQL !
      </WarningCard>

      <SummaryCard items={[
        'SI condition ALORS ... FINSI',
        'Le bloc s\'exécute seulement si la condition est VRAIE',
        'FINSI est obligatoire pour fermer le bloc',
        'La condition peut utiliser tout opérateur de comparaison',
      ]} />
    </div>
  );
};

// condition_sinon
export const ConditionSinonRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <AnalogieCard>
        Un feu tricolore : <strong>SI le feu est vert ALORS</strong> tu passes, <strong>SINON</strong> tu t'arrêtes. Deux chemins exclusifs. L'un ou l'autre, jamais les deux.
      </AnalogieCard>

      <InfoCard title="SI / SINON  deux chemins">
        Le bloc <strong>SINON</strong> est le chemin alternatif  il s'exécute quand la condition est <em>fausse</em>. Ensemble, SI et SINON forment un branchement <em>binaire</em>.
      </InfoCard>

      <LessonSection icon={<Code2 size={15} />} title="Les deux chemins possibles" step={1}>
        <BranchDiagram condition="SI condition ALORS" trueLabel="Bloc ALORS" falseLabel="Bloc SINON" />
        <ConditionFlowVisualizer
          condition="note >= 10"
          trueBlock='ECRIRE("Admis !")'
          falseBlock='ECRIRE("Recalé")'
          testValues={[
            { label: 'note = 14', result: true },
            { label: 'note = 7', result: false },
            { label: 'note = 10', result: true },
          ]}
        />
        {lesson.example_code && <CodeBlock code={lesson.example_code} title="si_sinon.bql" onTry={tryCode} />}
      </LessonSection>

      <LessonSection icon={<Hash size={15} />} title="Exemple concret  système de notes" step={2}>
        <CodeBlock code={`ALGORITHME_Bulletin;\nVARIABLE\n  note : ENTIER;\nDEBUT\n  note <- 13;\n  SI note >= 10 ALORS\n    ECRIRE("Admis ! Félicitations.");\n  SINON\n    ECRIRE("Recalé. Bon courage pour le rattrapage.");\n  FINSI\nFIN`} title="bulletin.bql" />
      </LessonSection>

      <TipCard>Maximum <strong>un seul SINON</strong> par bloc SI. Pour plusieurs cas, utilise <Mono color="#facc15">SINONSI</Mono>.</TipCard>

      <SummaryCard items={[
        'SI ... ALORS ... SINON ... FINSI',
        'SINON = chemin si condition fausse',
        'Maximum 1 SINON par bloc SI',
        'Les deux blocs sont mutuellement exclusifs',
      ]} />
    </div>
  );
};

// sinon_si
export const SinonSiRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <AnalogieCard>
        Un jeu de tri de colis : <strong>SI le poids est {'<'} 1kg   lettre, SINONSI {'<'} 5kg   petit colis, SINONSI {'<'} 20kg   grand colis, SINON   palet</strong>. BQL s'arrête dès qu'une condition est vraie.
      </AnalogieCard>

      <InfoCard title="Chaîne de conditions">
        Grâce à <strong>SINONSI</strong>, on évalue plusieurs conditions à la suite. BQL s'arrête au <em>premier bloc vrai</em> rencontré. Les suivants sont ignorés.
      </InfoCard>

      <WhyCard>
        Sans SINONSI, il faudrait imbriquer des SI dans des SINON  code rapidement illisible. SINONSI permet une cascade linçaire, propre et facile à lire.
      </WhyCard>

      <LessonSection icon={<Code2 size={15} />} title="Structure en cascade" step={1}>
        <StepByStep steps={[
          { label: 'SI cond1 ALORS', desc: 'Évalué en premier. Si VRAI   exécuté + stop.' },
          { label: 'SINONSI cond2 ALORS', desc: 'Évalué seulement si cond1 est FAUSSE.' },
          { label: 'SINONSI cond3 ALORS', desc: 'Évalué seulement si cond1 et cond2 sont FAUSSES.' },
          { label: 'SINON', desc: 'Exécuté si AUCUNE condition précédente n\'était VRAIE.' },
          { label: 'FINSI', desc: 'Un seul FINSI pour toute la chaîne.' },
        ]} />
        {lesson.example_code && <CodeBlock code={lesson.example_code} title="sinon_si.bql" onTry={tryCode} />}
      </LessonSection>

      <TipCard title="Ordre des conditions !">
        Placez les conditions <strong>du plus restrictif au plus général</strong>. Si tu mets <Mono color="#facc15">{'note >= 10'}</Mono> avant <Mono color="#facc15">{'note >= 16'}</Mono>, les très bonnes notes seront classées "Passable".
      </TipCard>

      <SummaryCard items={[
        'SINONSI permet d\'enchaîner plusieurs conditions',
        'Le 1er bloc VRAI est exécuté, les suivants ignorés',
        'Un seul FINSI pour toute la chaîne',
        'Ordre critique : du plus restrictif au plus général',
      ]} />
    </div>
  );
};
