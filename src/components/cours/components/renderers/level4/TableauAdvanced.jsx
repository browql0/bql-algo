import React from 'react';
import { Info, Code2 } from 'lucide-react';
import {
  CodeBlock,
  InfoCard,
  WarningCard,
  TipCard,
  SummaryCard,
  LessonSection,
  TableauDiagram,
  AnalogieCard,
} from '../../blocks/LessonComponents';
import { ArrayReverseVisualizer, ArrayShiftVisualizer } from '../../../visualizers';
import { Mono } from '../../common/LessonRendererShared';

// tableau_inverse
export const TableauInverseRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <AnalogieCard>
        Inverser un tableau, c'est comme plier une feuille en deux : le premier élément touche le dernier, le deuxième touche l'avant-dernier. On échange leurs places jusqu'à arriver au <strong>centre</strong>.
      </AnalogieCard>

      <InfoCard icon={<Info size={17} />} title="Le principe du miroir" color="#4f8ff0">
        Inverser le contenu d'un tableau sur place nécessite une <strong>variable temporaire</strong>. Étant donné une taille N, on échange <Mono color="#4f8ff0">T[i]</Mono> et <Mono color="#4f8ff0">T[N - 1 - i]</Mono>.
      </InfoCard>

      <LessonSection icon={<Code2 size={15} />} title="L'algorithme d'inversion" step={1}>
        <TableauDiagram values={[1, 2, 3, 4, 5]} name="T" color="#4f8ff0" />
        <ArrayReverseVisualizer array={[1, 2, 3, 4, 5]} name="T" />
        {lesson.example_code && <CodeBlock code={lesson.example_code} title="inverser.bql" onTry={tryCode} />}
      </LessonSection>

      <WarningCard title="Le piège de la boucle complète">
        Attention à la condition de ta boucle POUR : <Mono color="#fb7185">POUR i ALLANT DE 0 A N-1</Mono> annulera l'inversion ! Vous inverserez la première moitié, puis la deuxième moitié ré-inversera tout à sa place initiale. Il faut s'arrêter au niveau de la moitié du tableau.
      </WarningCard>

      <SummaryCard items={[
        '0change classique avec variable : temp = A; A = B; B = temp',
        'L\'indice opposé à [i] dans un tableau de taille N est [N - 1 - i]',
        'On arrête la boucle au MILIEU du tableau'
      ]} />
    </div>
  );
};

export const TableauDecalageRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <AnalogieCard>
        Un jeu de chaises musicales : tout le monde doit se décaler d'une chaise vers la droite. Celui qui était au bout n'a plus de chaise, alors il court prendre la toute première place à gauche. C'est un <strong>décalage circulaire</strong>.
      </AnalogieCard>

      <InfoCard title="L'ordre de copie est crucial">
        Pour décaler vers la DROITE, on doit absolument <strong>copier en partant de la fin</strong> du tableau (ou écrire unitairement les opérations en remontant). Si l'on copie T[0] dans T[1], puis T[1] dans T[2], on propagerait la même valeur dans tout le tableau !
      </InfoCard>

      <LessonSection icon={<Code2 size={15} />} title="Algorithme de décalage droit" step={1}>
        <TableauDiagram values={[5, 1, 2, 3, 4]} name="T decale" color="#34d399" />
        <ArrayShiftVisualizer array={[1, 2, 3, 4, 5]} name="T" direction="right" />
        {lesson.example_code && <CodeBlock code={lesson.example_code} title="decalage.bql" onTry={tryCode} />}
      </LessonSection>

      <TipCard title="Ne pas perdre le dernier élément">
        Sauvegarde toujours le dernier élément <Mono color="#facc15">T[N-1]</Mono> dans une variable (ex: <i>dernier</i>) <strong>avant</strong> d'effectuer le décalage. Une fois le tableau décalé, réinjecte cette valeur dans <Mono color="#facc15">T[0]</Mono>.
      </TipCard>

      <SummaryCard items={[
        'Pour un décalage droit, on copie T[i-1] vers T[i]',
        'Ceci doit se faire par ordre décroissant (ou étape par étape à l\'envers)',
        'On utilise une variable "dernier" pour un décalage circulaire'
      ]} />
    </div>
  );
};
