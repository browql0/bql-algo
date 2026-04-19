import React from 'react';
import { Info, Code2 } from 'lucide-react';
import {
  CodeBlock,
  InfoCard,
  WarningCard,
  TipCard,
  SummaryCard,
  LessonSection,
  AnalogieCard,
} from '../../blocks/LessonComponents';
import { MatrixReverseVisualizer, MatrixShiftVisualizer } from '../../../visualizers';
import { Mono } from '../../common/LessonRendererShared';

// matrice_symetrie
export const MatriceSymetrieRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <AnalogieCard>
        Un miroir : ce qui est à gauche est le reflet de ce qui est à droite. Une matrice symétrique est son propre "miroir" diagonal : M[i, j] = M[i, j].
      </AnalogieCard>
      <InfoCard title="Symétrie  M[i, j] = M[j, i]">
        Une matrice carrée est symétrique si chaque élément de la partie triangulaire supérieure est égal à son correspondant dans la partie inférieure.
      </InfoCard>
      {lesson.example_code && <CodeBlock code={lesson.example_code} title="symetrie.bql" onTry={tryCode} />}
      <TipCard>Dès qu'on trouve UN élément qui n'est pas symétrique, on peut mettre <Mono color="#fb7185">symetrique {'<-'} FAUX</Mono> et sortir (ou continuer jusqu'à la fin).</TipCard>
      <SummaryCard items={['Matrice symétrique : M[i, j] = M[j, i] pour tout i, j', 'vérifier toutes les paires (i,j) avec double boucle', 'Un seul écart suffit à invalider la symétrie']} />
    </div>
  );
};

// matrice_transposee
export const MatriceTransposeeRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <AnalogieCard>
        Retourner une image : les colonnes deviennent des lignes et les lignes deviennent des colonnes. La transposée d'une matrice 2×3 est une matrice 3×2.
      </AnalogieCard>
      <InfoCard title="Transposée  lignes → colonnes">
        La transposée de M[i, j] est une matrice M[i, j] où <Mono>M[i, j] = M[i, j]</Mono>. Les dimensions sont inversées.
      </InfoCard>
      {lesson.example_code && <CodeBlock code={lesson.example_code} title="transposee.bql" onTry={tryCode} />}
      <SummaryCard items={['M[i, j] = M[i, j]  inverser les indices', 'M[i, j]   M[i, j] (dimensions échangées)', 'Double boucle sur la matrice originale pour remplir la transposée']} />
    </div>
  );
};

// matrice_inverse
export const MatriceInverseRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <AnalogieCard>
        C'est comme tourner la page d'un carnet de notes de bas en haut. La toute dernière ligne devient la première, et l'avant-dernière devient la deuxième. On échange des <strong>lignes entières</strong>.
      </AnalogieCard>

      <InfoCard icon={<Info size={17} />} title="Inversion verticale d'une matrice" color="#a78bfa">
        La logique principale reste l'inversement miroir, tout comme le tableau 1D. La seule différence : l'élément à échanger n'est plus une simple case, c'est l'ensemble des cases <Mono color="#a78bfa">j</Mono> d'une même ligne <Mono color="#a78bfa">i</Mono>.
      </InfoCard>

      <LessonSection icon={<Code2 size={15} />} title="Inverser les lignes" step={1}>
        <MatrixReverseVisualizer matrix={[[4,4,4],[3,3,3],[2,2,2],[1,1,1]]} name="M" />
        {lesson.example_code && <CodeBlock code={lesson.example_code} title="matrice_inverse.bql" onTry={tryCode} />}
      </LessonSection>

      <WarningCard title="Combien de lignes faut-il parcourir ?">
        Comme pour l'inversion d'un tableau classique, la boucle externe sur les lignes ne doit aller que jusqu'à <strong>la moitié de la hauteur</strong> (L/2) ! Si la matrice contient 4 lignes, on inverse la ligne 0 avec la 3, puis la ligne 1 avec la 2, et on s'arrête !
      </WarningCard>

      <SummaryCard items={[
        'La boucle de lignes (boucle externe) s\'arrête à la moitié (ex: 0 à 1 pour 4 lignes)',
        'La boucle des colonnes (boucle interne) parcourt toujours TOUTES les colonnes',
        '0change classique : temp = M[i, j]; M[i, j] = M[i, j] ...'
      ]} />
    </div>
  );
};

// matrice_decalage
export const MatriceDecalageRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <AnalogieCard>
        Un bandit manchot dans un casino : on décale l'ensemble des rouleaux d'un cran. Le principe horizontal est le même que le décalage de tableau, mais il doit être <strong>répété pour chaque ligne</strong> !
      </AnalogieCard>

      <InfoCard title="Décalage horizontal (à droite)">
        Pour décaler les colonnes à droite, on applique simplement l'algorithme "classique" de décalage... à l'intérieur d'une boucle <Mono>POUR i</Mono> qui parcourt l'ensemble des lignes de la matrice.
      </InfoCard>

      <LessonSection icon={<Code2 size={15} />} title="Décaler d'un cran" step={1}>
        <MatrixShiftVisualizer matrix={[[3,1,2],[6,4,5]]} name="M" />
        {lesson.example_code && <CodeBlock code={lesson.example_code} title="matrice_decalage.bql" onTry={tryCode} />}
      </LessonSection>

      <TipCard title="Le décalage vertical">
        Une variante populaire est de décaler les <strong>lignes</strong> de la matrice vers le bas. Dans ce scénario, on sauvegardé la ligne finale, on décale chaque élément vers le bas (<Mono color="#facc15">M[i, j] = M[i, j]</Mono>), et on réinjecte en ligne 0.
      </TipCard>

      <SummaryCard items={[
        'Boucle externe : on parcourt chaque ligne',
        'À l\'intérieur de chaque ligne, on effectue un décalage de tableau droit standard',
        'Il faut impérativement une variable pour mémoriser le dernier élément de la ligne courante'
      ]} />
    </div>
  );
};
