import React from 'react';
import { Layers, Code2, AlertTriangle } from 'lucide-react';
import {
  CodeBlock,
  InfoCard,
  WarningCard,
  TipCard,
  SummaryCard,
  LessonSection,
  MatriceDiagram,
  AnalogieCard,
  WhyCard,
} from '../../blocks/LessonComponents';
import { MatrixTraversalVisualizer } from '../../../visualizers';
import { Mono } from '../../common/LessonRendererShared';

// matrice
export const MatriceRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <AnalogieCard>
        Une matrice, c'est une <strong>grille</strong> : des lignes et des colonnes, comme un tableur. Chaque case est reperee par deux indices : la ligne et la colonne.
      </AnalogieCard>

      <InfoCard icon={<Layers size={17} />} title="Definition" color="#a78bfa">
        Une matrice stocke des valeurs dans un tableau <strong>lignes x colonnes</strong>. Declaration : <Mono>Tableau M[L, C] : TYPE</Mono>. Acces : <Mono>M[i, j]</Mono> ou i = ligne, j = colonne.
      </InfoCard>

      <WhyCard>
        Avec une matrice, tu peux representer un tableau de notes par eleve, une image en pixels, ou une grille de jeu (morpion, sudoku...). Sans matrice, ca devient ingérable.
      </WhyCard>

      <LessonSection icon={<Code2 size={15} />} title="Representation visuelle" step={1}>
        <MatriceDiagram matrix={[[1, 2, 3], [4, 5, 6]]} name="M" color="#a78bfa" />
        {lesson.example_code && <CodeBlock code={lesson.example_code} title="matrice.bql" onTry={tryCode} />}
      </LessonSection>

      <WarningCard title="Deux indices, pas un !">
        Une matrice n'a pas une dimension, mais deux. <Mono>M[i]</Mono> est invalide ; il faut <Mono>M[i, j]</Mono>.
      </WarningCard>

      <SummaryCard items={[
        'Tableau M[L, C] : TYPE   matrice de L lignes et C colonnes',
        'M[i, j] accede a la case ligne i, colonne j',
        'Indices commencent a 0, i in [0..L-1], j in [0..C-1]',
      ]} />
    </div>
  );
};

// matrice_init
export const MatriceInitRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <AnalogieCard>
        Avant d'utiliser une grille, on s'assure que chaque case a une valeur propre. L'initialisation evite les valeurs arbitraires.
      </AnalogieCard>

      <InfoCard title="Initialisation : double boucle" icon={<AlertTriangle size={17} />} color="#facc15">
        Toujours initialiser une matrice avant de l'utiliser. Une seule boucle ne suffit pas : il faut parcourir lignes ET colonnes.
      </InfoCard>

      {lesson.example_code && (
        <LessonSection icon={<Code2 size={15} />} title="Initialiser toute la matrice" step={1}>
          <CodeBlock code={lesson.example_code} title="mat_init.bql" onTry={tryCode} />
        </LessonSection>
      )}

      <TipCard title="Pattern universel">
        <code style={{ fontFamily: 'monospace', color: '#4ade80', display: 'block', lineHeight: '1.8' }}>
          POUR i ALLANT DE 0 A L-1 FAIRE<br />
          &nbsp;&nbsp;POUR j ALLANT DE 0 A C-1 FAIRE<br />
          &nbsp;&nbsp;&nbsp;&nbsp;M[i, j] {'<-'} 0; // valeur neutre<br />
          &nbsp;&nbsp;FINPOUR<br />
          FINPOUR
        </code>
      </TipCard>

      <SummaryCard items={[
        'Deux boucles imbriquees : i pour lignes, j pour colonnes',
        'M[i, j] <- valeur_neutre pour chaque case',
        'Evite les valeurs non initialisees et les bugs',
      ]} />
    </div>
  );
};

// matrice_parcours
export const MatriceParcoursRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <InfoCard title="Parcours d'une matrice">
        Pour parcourir une matrice, on utilise une <strong>double boucle</strong>. La boucle externe parcourt les lignes, la boucle interne parcourt les colonnes.
      </InfoCard>

      <LessonSection icon={<Code2 size={15} />} title="Visualisation du parcours" step={1}>
        <MatrixTraversalVisualizer matrix={[[1, 2, 3], [4, 5, 6], [7, 8, 9]]} name="M" />
        {lesson.example_code && <CodeBlock code={lesson.example_code} title="parcours_matrice.bql" onTry={tryCode} />}
      </LessonSection>

      <TipCard>
        Double POUR : <Mono color="#facc15">POUR i ALLANT DE 0 A L-1</Mono> puis <Mono color="#a78bfa">POUR j ALLANT DE 0 A C-1</Mono>.
      </TipCard>

      <SummaryCard items={[
        'Double POUR : i (lignes) x j (colonnes)',
        'LxC iterations totales',
        'M[i, j]   ligne i, colonne j',
      ]} />
    </div>
  );
};
