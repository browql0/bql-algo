import React from 'react';
import { GitBranch, Database } from 'lucide-react';
import {
  CodeBlock,
  InfoCard,
  SummaryCard,
  LessonSection,
  FlowDiagram,
  AnalogieCard,
  WhyCard,
  StepByStep,
} from '../../blocks/LessonComponents';
import { ArraySearchVisualizer, AccumulatorVisualizer } from '../../../visualizers';
import { TeacherRubricPanel } from '../../common/LessonRendererShared';

export const AdvancedDecompositionRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <AnalogieCard>
        Un probleme avance ne se resout pas en une seule pensee. On le coupe en petites etapes : lire, calculer, decider, afficher.
      </AnalogieCard>

      <WhyCard>
        La decomposition evite les programmes confus. Elle aide a verifier chaque partie avant de tout assembler.
      </WhyCard>

      <LessonSection icon={<GitBranch size={15} />} title="Decomposer avant de coder" step={1}>
        <FlowDiagram steps={[
          { label: 'Entrer les données', sub: 'LIRE', accent: '#4f8ff0' },
          { label: 'Traiter', sub: 'boucles + calculs', accent: '#34d399' },
          { label: 'Decider', sub: 'SI / SELON', accent: '#facc15' },
          { label: 'Afficher', sub: 'ECRIRE final', accent: '#fb7185' },
        ]} />
        {lesson.example_code && <CodeBlock code={lesson.example_code} title="decomposition.bql" onTry={tryCode} />}
      </LessonSection>

      <SummaryCard items={[
        'Un probleme avance se decoupe en blocs simples',
        'Chaque bloc doit avoir un role clair',
        'On teste plus facilement un programme bien separe',
      ]} />
      <TeacherRubricPanel lesson={lesson} />
    </div>
  );
};

export const AdvancedDataFlowRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <InfoCard title="Combiner plusieurs concepts">
        Les vrais exercices melangent souvent tableaux, boucles et conditions. L'important est de suivre le trajet des données.
      </InfoCard>

      <LessonSection icon={<Database size={15} />} title="Parcours + condition + compteur" step={1}>
        <ArraySearchVisualizer array={[12, 9, 17, 4, 17, 2]} target={17} name="notes" />
        <AccumulatorVisualizer values={[12, 9, 17, 4, 17, 2]} operation="sum" name="somme" />
      </LessonSection>

      <StepByStep steps={[
        { label: 'Tableau', desc: 'les données sont stockees dans une serie ordonnée.' },
        { label: 'Boucle', desc: 'on lit chaque case une seule fois.' },
        { label: 'Condition', desc: 'on decide quoi faire avec la valeur courante.' },
        { label: 'Resultat', desc: 'on affiche uniquement la reponse demandee.' },
      ]} />

      {lesson.example_code && <CodeBlock code={lesson.example_code} title="combinaison.bql" onTry={tryCode} />}

      <SummaryCard items={[
        'Le tableau stocke les données',
        'La boucle parcourt les données',
        'La condition filtre ou choisit',
        'Le compteur ou l accumulateur resume le resultat',
      ]} />
      <TeacherRubricPanel lesson={lesson} />
    </div>
  );
};
