import React from 'react';
import { Cpu, Target } from 'lucide-react';
import {
  CodeBlock,
  InfoCard,
  SummaryCard,
  LessonSection,
  FlowDiagram,
  TipCard,
  AnalogieCard,
} from '../../blocks/LessonComponents';
import {
  VariableStateVisualizer,
  ConditionFlowVisualizer,
  DebugTraceComparisonVisualizer,
  RecordVisualizer,
} from '../../../visualizers';
import { Mono, TeacherRubricPanel } from '../../common/LessonRendererShared';

export const AdvancedDebugRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <AnalogieCard>
        Deboguer, c'est rejouer le programme au ralenti. A chaque instruction, on regarde ce qui change en memoire.
      </AnalogieCard>

      <LessonSection icon={<Cpu size={15} />} title="Trace d execution" step={1}>
        <VariableStateVisualizer sequence={[
          { name: 'somme', value: 0, op: 'somme <- 0' },
          { name: 'somme', value: 4, op: 'somme <- somme + T[0]' },
          { name: 'somme', value: 11, op: 'somme <- somme + T[1]' },
          { name: 'somme', value: 20, op: 'somme <- somme + T[2]' },
        ]} />
        <ConditionFlowVisualizer
          condition="somme >= 10"
          trueBlock="ECRIRE(&quot;Valide&quot;)"
          falseBlock="continuer"
          testValues={[{ label: 'somme = 8', result: false }, { label: 'somme = 20', result: true }]}
        />
        <DebugTraceComparisonVisualizer
          title="accumulateur initialise"
          wrongTrace={[
            { step: 'depart', vars: { somme: '?', i: '-' }, note: 'somme n est pas initialisee' },
            { step: 'i = 0', vars: { somme: '?+ 4', i: 0 }, note: 'la premiere addition est incertaine' },
            { step: 'i = 1', vars: { somme: '?', i: 1 }, note: 'la trace ne permet pas de verifier le resultat' },
          ]}
          correctTrace={[
            { step: 'depart', vars: { somme: 0, i: '-' }, note: 'somme commence a 0' },
            { step: 'i = 0', vars: { somme: 4, i: 0 }, note: '0 + T[0]' },
            { step: 'i = 1', vars: { somme: 11, i: 1 }, note: '4 + T[1]' },
          ]}
        />
      </LessonSection>

      {lesson.example_code && <CodeBlock code={lesson.example_code} title="debug_trace.bql" onTry={tryCode} />}

      <TipCard title="Technique simple">
        Ajoute temporairement des <Mono color="#facc15">ECRIRE</Mono> pour observer les variables, puis retire-les avant la validation officielle si la sortie doit etre stricte.
      </TipCard>

      <SummaryCard items={[
        'Verifier les variables apres chaque etape',
        'Tester un petit cas a la main',
        'Comparer la trace attendue avec la trace du programme',
      ]} />
      <TeacherRubricPanel lesson={lesson} />
    </div>
  );
};

export const AdvancedMiniProjectRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <InfoCard title="Mini-projet">
        Un mini-projet assemble plusieurs idees : modeliser les données, lire une serie, calculer, puis prendre une decision claire.
      </InfoCard>

      <LessonSection icon={<Target size={15} />} title="Etat du projet" step={1}>
        <RecordVisualizer record={{ nom: 'Sara', note: 16, admis: true }} name="etudiant" />
        <FlowDiagram steps={[
          { label: 'TYPE Etudiant', sub: 'structure des données', accent: '#a78bfa' },
          { label: 'Tableau groupe', sub: 'plusieurs fiches', accent: '#4f8ff0' },
          { label: 'Boucle POUR', sub: 'lire et calculer', accent: '#34d399' },
          { label: 'Bilan', sub: 'moyenne / meilleur', accent: '#facc15' },
        ]} />
      </LessonSection>

      {lesson.example_code && <CodeBlock code={lesson.example_code} title="mini_projet.bql" onTry={tryCode} />}

      <SummaryCard items={[
        'Un mini-projet commence par le choix de la structure',
        'Les boucles automatisent le traitement des données',
        'Les conditions transforment les calculs en decisions utiles',
      ]} />
      <TeacherRubricPanel lesson={lesson} />
    </div>
  );
};

export const AdvancedReviewRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <InfoCard title="Choisir la bonne structure">
        Le bon outil depend du probleme : une valeur simple, une liste, une grille ou une fiche composee.
      </InfoCard>

      <LessonSection icon={<Target size={15} />} title="Carte de decision" step={1}>
        <FlowDiagram steps={[
          { label: 'Une seule valeur', sub: 'VARIABLE', accent: '#4f8ff0' },
          { label: 'Liste de valeurs', sub: 'Tableau T[n]', accent: '#34d399' },
          { label: 'Grille', sub: 'Tableau M[l, c]', accent: '#facc15' },
          { label: 'Objet avec champs', sub: 'TYPE ENREGISTREMENT', accent: '#a78bfa' },
        ]} />
      </LessonSection>

      {lesson.example_code && <CodeBlock code={lesson.example_code} title="choisir_structure.bql" onTry={tryCode} />}

      <SummaryCard items={[
        'Variable : une information simple',
        'Tableau : plusieurs valeurs du meme type',
        'Matrice : lignes et colonnes',
        'Enregistrement : plusieurs champs lies au meme objet',
      ]} />
      <TeacherRubricPanel lesson={lesson} />
    </div>
  );
};
