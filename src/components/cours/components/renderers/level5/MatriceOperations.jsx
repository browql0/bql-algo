import React from 'react';
import { Hash } from 'lucide-react';
import {
  CodeBlock,
  InfoCard,
  SummaryCard,
  TipCard,
  LessonSection,
  AnalogieCard,
  StepByStep,
} from '../../blocks/LessonComponents';
import { Mono } from '../../common/LessonRendererShared';

// matrice_somme
export const MatriceSommeRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <InfoCard title="Somme de tous les éléments d'une matrice">
        Même pattern que pour un tableau 1D, mais avec deux boucles imbriquées. L'accumulateur s'incrémente de M[i, j] à chaque itération intérieure.
      </InfoCard>
      {lesson.example_code && <CodeBlock code={lesson.example_code} title="mat_somme.bql" onTry={tryCode} />}
      <StepByStep steps={[
        { label: 'Initialiser', desc: 'somme <- 0; avant les deux boucles.' },
        { label: 'Boucle externe', desc: 'POUR i ALLANT DE 0 A L-1 FAIRE  lignes.' },
        { label: 'Boucle interne', desc: 'POUR j ALLANT DE 0 A C-1 FAIRE  colonnes.' },
        { label: 'Accumuler', desc: 'somme <- somme + M[i, j];' },
        { label: 'Résultat', desc: 'ECRIRE(somme) après les deux FINPOUR.' },
      ]} />
      <SummaryCard items={['Accumulateur initialisé à 0 avant les deux boucles', 'somme <- somme + M[i, j]; dans la boucle interne', 'Total = somme de toutes les LC cellules']} />
    </div>
  );
};

// matrice_diagonale
export const MatriceDiagonaleRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <AnalogieCard>
        Dans une table de multiplication, la diagonale est le carré des nombres : 1, 4, 9, 16... C'est toujours là où ligne = colonne. Une propriété mathématique puissante des matrices carrées.
      </AnalogieCard>
      <InfoCard title="Diagonale principale  propriété des matrices carrées">
        La diagonale principale contient les éléments <Mono color="#a78bfa">M[i, j]</Mono> (même indice de ligne et colonne). Un seul POUR suffit pour la parcourir.
      </InfoCard>
      {lesson.example_code && <CodeBlock code={lesson.example_code} title="diagonale.bql" onTry={tryCode} />}
      <TipCard>Pour une matrice NN, la diagonale a exactement N éléments. Une seule boucle POUR i ALLANT DE 0 A N-1 suffit.</TipCard>
      <SummaryCard items={['Diagonale principale : M[i, i]  ligne i = colonne i', 'Un seul POUR suffit (pas de boucle imbriquée)', 'Uniquement pour les matrices carrées (L = C)']} />
    </div>
  );
};

// matrice_ligne_col
export const MatriceLigneColRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <InfoCard title="Somme d'une ligne ou d'une colonne">
        Pour la somme de la ligne i : parcourir j de 0 à C-1, sommer M[i, j].<br />
        Pour la somme de la colonne j : parcourir i de 0 à L-1, sommer M[i, j].
      </InfoCard>
      {lesson.example_code && <CodeBlock code={lesson.example_code} title="ligne_col.bql" onTry={tryCode} />}
      <LessonSection icon={<Hash size={15} />} title="Visualisation  ligne vs colonne" step={1}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <InfoCard color="#4f8ff0" title="Somme ligne i">POUR j ALLANT DE 0 A C-1 FAIRE<br />somme {'<-'} somme + M[i, j]</InfoCard>
          <InfoCard color="#34d399" title="Somme colonne j">POUR i ALLANT DE 0 A L-1 FAIRE<br />somme {'<-'} somme + M[i, j]</InfoCard>
        </div>
      </LessonSection>
      <SummaryCard items={['Somme ligne i : fixer i, parcourir j (colonnes)', 'Somme colonne j : fixer j, parcourir i (lignes)', 'Un seul POUR dans les deux cas']} />
    </div>
  );
};

// matrice_max
export const MatriceMaxRenderer = ({ lesson, onTryCode }) => {
  const tryCode = () => onTryCode(lesson);
  return (
    <div>
      <InfoCard title="Maximum dans une matrice">
        Même logique que pour un tableau 1D, mais avec deux boucles. Initialiser avec M[i, j], puis comparer toutes les cellules.
      </InfoCard>
      {lesson.example_code && <CodeBlock code={lesson.example_code} title="mat_max.bql" onTry={tryCode} />}
      <TipCard>On retient les indices (lig_max, col_max) en même temps que la valeur max pour savoir exactement où se trouve le maximum.</TipCard>
      <SummaryCard items={['Initialiser max <- M[0, 0]; lig_max <- 0; col_max <- 0;', 'Double boucle pour parcourir toutes les cellules', 'Mettre à jour max et ses indices dès qu\'on trouve plus grand']} />
    </div>
  );
};
